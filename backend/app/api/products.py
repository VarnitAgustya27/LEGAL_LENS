import os
import requests
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.models.product import Product
from app.models.inspection import Inspection
from app.config import settings

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("")
def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns aggregated product catalogue with inspection counts and latest compliance status.
    First checks live Supabase inspections table, with SQLite local database fallback.
    """
    supabase_url = settings.SUPABASE_URL.rstrip('/') if settings.SUPABASE_URL else None
    anon_key = settings.SUPABASE_ANON_KEY or settings.SUPABASE_SERVICE_ROLE_KEY

    inspections_data = []

    # 1. Fetch live inspections from Supabase
    if supabase_url and anon_key:
        try:
            url = f"{supabase_url}/rest/v1/inspections?select=*"
            headers = {
                "apikey": anon_key,
                "Authorization": f"Bearer {anon_key}"
            }
            resp = requests.get(url, headers=headers, timeout=5)
            if resp.status_code == 200:
                inspections_data = resp.json()
        except Exception as e:
            print(f"[Products API] Supabase fetch notice: {e}")

    # 2. If Supabase is empty or unavailable, fetch from local DB
    if not inspections_data:
        local_insps = db.query(Inspection).join(Product).order_by(Inspection.created_at.desc()).all()
        for insp in local_insps:
            inspections_data.append({
                "id": insp.id,
                "case_number": insp.case_number,
                "product_name": insp.product.name if insp.product else "Packaged Commodity",
                "category": insp.product.category if insp.product else "Packaged Food",
                "manufacturer": insp.retailer_name or (insp.product.brand if insp.product else None),
                "barcode": insp.product.barcode if insp.product else None,
                "status": insp.status,
                "score": insp.score,
                "created_at": insp.created_at.isoformat() if insp.created_at else None,
                "declarations": [{"label": d.label, "field": d.field, "value": d.value, "status": d.status} for d in (insp.declarations or [])],
                "violations": [{"title": v.title, "description": v.description, "severity": v.severity} for v in (insp.violations or [])]
            })

    # 3. Aggregate distinct products
    product_map = {}
    for insp in inspections_data:
        raw_name = (insp.get("product_name") or insp.get("product") or "Packaged Commodity").strip()
        if not raw_name:
            continue

        cno = insp.get("case_number") or str(insp.get("id"))
        date_str = str(insp.get("created_at") or "2026-08-31")[:10]
        status_val = (insp.get("status") or "REVIEW").upper()
        manufacturer = (insp.get("manufacturer") or insp.get("retailer_name") or "").strip()

        # Determine note summary
        violations = insp.get("violations") or []
        declarations = insp.get("declarations") or []
        note = "All mandatory declarations verified"
        if status_val == "NON_COMPLIANT":
            if violations:
                note = " • ".join([v.get("description") or v.get("title") or "Non-compliant declaration" for v in violations[:2]])
            else:
                missing = [d.get("label") or d.get("field") for d in declarations if d.get("status") == "FAIL" or not d.get("value")]
                note = f"Missing: {', '.join(missing[:2])}" if missing else "Statutory non-compliance detected"
        elif status_val == "REVIEW":
            note = "Requires manual officer verification"

        hist_item = {
            "id": cno,
            "date": date_str,
            "status": status_val,
            "inspector": insp.get("inspector_name") or "Authorized Officer",
            "score": insp.get("score") if insp.get("score") is not None else (100.0 if status_val == "COMPLIANT" else 50.0),
            "note": note,
            "raw": insp
        }

        # Barcode extraction / generation
        barcode = insp.get("barcode")
        if not barcode and declarations:
            b_decl = next((d for d in declarations if d.get("field") in ["barcode", "gtin", "ean"]), None)
            if b_decl and b_decl.get("value"):
                barcode = b_decl.get("value")
        if not barcode:
            hash_val = abs(hash(raw_name + cno)) % 10000000000
            barcode = f"890{str(hash_val).zfill(10)}"

        # Determine unique grouping key
        display_name = raw_name
        if barcode and not barcode.startswith("890"):
            key = f"barcode:{barcode}"
        elif raw_name.lower() in ["packaged commodity", "unknown product", "commodity", "packaged food", "packaged product"]:
            if manufacturer and manufacturer != "—":
                key = f"mfr:{manufacturer.lower()}"
                display_name = f"Packaged Commodity ({manufacturer[:30]}...)" if len(manufacturer) > 30 else f"Packaged Commodity ({manufacturer})"
            else:
                key = f"case:{cno}"
                display_name = f"Packaged Commodity ({cno})"
        else:
            key = f"name:{raw_name.lower()}"

        if key not in product_map:
            product_map[key] = {
                "name": display_name,
                "barcode": barcode,
                "category": insp.get("category") or "Packaged Food",
                "manufacturer": manufacturer or "—",
                "inspections": 1,
                "status": status_val,
                "latest_date": date_str,
                "history": [hist_item]
            }
        else:
            product_map[key]["inspections"] += 1
            product_map[key]["history"].append(hist_item)
            if (not product_map[key]["manufacturer"] or product_map[key]["manufacturer"] == "—") and manufacturer:
                product_map[key]["manufacturer"] = manufacturer

    # Sort history per product and sort products by latest inspection date
    results = []
    for p in product_map.values():
        p["history"].sort(key=lambda x: x["date"], reverse=True)
        p["status"] = p["history"][0]["status"]
        p["latest_date"] = p["history"][0]["date"]

        # Apply filters
        if search:
            s_low = search.lower()
            if s_low not in p["name"].lower() and s_low not in p["barcode"].lower() and s_low not in p["manufacturer"].lower():
                continue
        if category and category != "ALL" and p["category"].lower() != category.lower():
            continue
        if status_filter and status_filter != "ALL" and p["status"].upper() != status_filter.upper():
            continue

        results.append(p)

    results.sort(key=lambda x: x["latest_date"], reverse=True)
    return results

@router.get("/{product_name_or_id}/history")
def get_product_history(product_name_or_id: str, db: Session = Depends(get_db)):
    """
    Returns the chronological case history for a specific product.
    """
    products = list_products(search=product_name_or_id, db=db)
    for p in products:
        if p["name"].lower() == product_name_or_id.lower() or p["barcode"] == product_name_or_id:
            return {
                "product": p["name"],
                "barcode": p["barcode"],
                "category": p["category"],
                "manufacturer": p["manufacturer"],
                "inspections_count": p["inspections"],
                "current_status": p["status"],
                "history": p["history"]
            }

    if products:
        p = products[0]
        return {
            "product": p["name"],
            "barcode": p["barcode"],
            "category": p["category"],
            "manufacturer": p["manufacturer"],
            "inspections_count": p["inspections"],
            "current_status": p["status"],
            "history": p["history"]
        }

    raise HTTPException(status_code=404, detail="Product history not found")
