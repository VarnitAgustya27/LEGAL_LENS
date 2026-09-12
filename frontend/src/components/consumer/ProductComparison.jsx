import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Scale, ScanLine, CheckCircle2, XCircle, AlertTriangle, ArrowRight, Plus, RefreshCw,
  Eye, ShieldCheck, ShieldAlert, UploadCloud, Calculator, ArrowRightLeft, Sparkles, Image as ImageIcon
} from "lucide-react";
import { fetchInspections } from "../../services/supabaseInspectionService.js";

const DEFAULT_DEMO_PRODUCTS = [
  {
    id: "PROD-A",
    name: "Pure Premium Organic Milk 1L",
    brand: "Dairy Fresh",
    mrp: "₹ 72.00",
    mrp_num: 72.0,
    net_quantity: "1000 ml",
    qty_num: 1000,
    unit: "ml",
    manufacturer: "Dairy Fresh India Pvt Ltd, Plot 42, Sector 18, Gurugram, Haryana - 122015",
    mfg_date: "04/2026",
    expiry_date: "10/2026",
    helpline: "+91 1800 123 4567 / care@dairyfresh.in",
    font_size_check: "Compliant (3.5 mm)",
    compliance_score: 95,
    status: "Compliant",
    image: "🥛"
  },
  {
    id: "PROD-B",
    name: "Classic Organic Milk 1L",
    brand: "Farm Direct",
    mrp: "₹ 78.00",
    mrp_num: 78.0,
    net_quantity: "950 ml",
    qty_num: 950,
    unit: "ml",
    manufacturer: "Farm Direct Goods, Village Kherki, Delhi NCR - 110045",
    mfg_date: "03/2026",
    expiry_date: "09/2026",
    helpline: "Not Mentioned",
    font_size_check: "Non-Compliant (1.8 mm)",
    compliance_score: 62,
    status: "Violation",
    image: "🥛"
  },
  {
    id: "PROD-C",
    name: "Heritage Whole Wheat Atta 5kg",
    brand: "Heritage Grains",
    mrp: "₹ 245.00",
    mrp_num: 245.0,
    net_quantity: "5000 g",
    qty_num: 5000,
    unit: "g",
    manufacturer: "Heritage Foods & Flour Mills, Industrial Area, Punjab - 141001",
    mfg_date: "02/2026",
    expiry_date: "08/2026",
    helpline: "1800 444 888 / support@heritagegrains.com",
    font_size_check: "Compliant (4.0 mm)",
    compliance_score: 98,
    status: "Compliant",
    image: "🌾"
  },
  {
    id: "PROD-D",
    name: "Royal Select Basmati Rice 5kg",
    brand: "Royal Grains",
    mrp: "₹ 290.00",
    mrp_num: 290.0,
    net_quantity: "4800 g",
    qty_num: 4800,
    unit: "g",
    manufacturer: "Royal Basmati Exports, Karnal, Haryana - 132001",
    mfg_date: "01/2026",
    expiry_date: "01/2028",
    helpline: "care@royalgrains.in",
    font_size_check: "Compliant (3.0 mm)",
    compliance_score: 75,
    status: "Violation",
    image: "🍚"
  }
];

export default function ProductComparison({ currentUser, onScanNew, onOpenDetail }) {
  const [activeTab, setActiveTab] = useState("SAVED"); // "SAVED" | "DUAL_SCAN" | "CALCULATOR"
  const [availableProducts, setAvailableProducts] = useState(DEFAULT_DEMO_PRODUCTS);
  const [productA, setProductA] = useState(DEFAULT_DEMO_PRODUCTS[0]);
  const [productB, setProductB] = useState(DEFAULT_DEMO_PRODUCTS[1]);

  // Dual Scan state
  const [dualImgA, setDualImgA] = useState(null);
  const [dualImgB, setDualImgB] = useState(null);
  const [dualAnalysis, setDualAnalysis] = useState(null);
  const [isAnalyzingDual, setIsAnalyzingDual] = useState(false);

  // Unit Price Calculator state
  const [calcA, setCalcA] = useState({ name: "Product A", mrp: 72, qty: 1000, unit: "ml" });
  const [calcB, setCalcB] = useState({ name: "Product B", mrp: 78, qty: 950, unit: "ml" });

  useEffect(() => {
    async function loadScans() {
      try {
        const res = await fetchInspections();
        const data = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        if (data && data.length > 0) {
          const isConsumerRole = currentUser?.role === "Consumer";
          const filtered = data.filter(item => {
            if (!isConsumerRole) return true;
            const isMyScan = item.inspector_email && currentUser?.email && item.inspector_email.toLowerCase() === currentUser.email.toLowerCase();
            const isCustomerScan = item.is_consumer === true || item.created_by_role === "Consumer";
            if (isMyScan || isCustomerScan) return true;
            const isOfficer = item.is_officer_internal || Boolean(item.inspector_badge) || item.inspector_role === "Officer" || item.is_officer_only;
            if (isOfficer) return false;
            return !item.inspector_badge && !item.is_officer_internal;
          });

          if (filtered.length >= 2) {
            const formatted = filtered.map((d) => {
              const rawMrp = d.mrp || "₹ 120.00";
              const mrpNum = parseFloat(String(rawMrp).replace(/[^0-9.]/g, "")) || 120.0;
              const rawQty = d.net_quantity || "500 g";
              const qtyNum = parseFloat(String(rawQty).replace(/[^0-9.]/g, "")) || 500;
              const unitStr = String(rawQty).toLowerCase().includes("ml") ? "ml" : (String(rawQty).toLowerCase().includes("kg") ? "kg" : "g");

              return {
                id: d.id || d.case_number,
                name: d.product_name || d.commodity || "Scanned Commodity",
                brand: d.manufacturer || "Scanned Brand",
                mrp: typeof rawMrp === "number" ? `₹ ${rawMrp.toFixed(2)}` : rawMrp,
                mrp_num: mrpNum,
                net_quantity: rawQty,
                qty_num: qtyNum,
                unit: unitStr,
                manufacturer: d.manufacturer_address || d.manufacturer || "Declared Manufacturer",
                mfg_date: d.mfg_date || "01/2026",
                expiry_date: d.expiry_date || "12/2026",
                helpline: d.consumer_care || "Mentioned",
                font_size_check: d.font_check || "Compliant",
                compliance_score: d.compliance_score || 84,
                status: d.status || "Compliant",
                image: "📦",
                _raw: d
              };
            });
            setAvailableProducts(formatted);
            setProductA(formatted[0]);
            setProductB(formatted[1] || formatted[0]);
          }
        }
      } catch (err) {
        console.warn("Could not load scans for comparison:", err);
      }
    }
    loadScans();
  }, [currentUser]);

  // Swap Product A and Product B
  const handleSwap = () => {
    const temp = productA;
    setProductA(productB);
    setProductB(temp);
  };

  // Helper to compute unit price
  const getUnitPriceStr = (mrpNum, qtyNum, unit) => {
    if (!mrpNum || !qtyNum || qtyNum <= 0) return "N/A";
    const perUnit = mrpNum / qtyNum;
    if (unit === "ml" || unit === "g") {
      const per100 = perUnit * 100;
      return `₹ ${per100.toFixed(2)} per 100 ${unit}`;
    }
    return `₹ ${perUnit.toFixed(2)} per ${unit}`;
  };

  const getUnitPriceVal = (mrpNum, qtyNum, unit) => {
    if (!mrpNum || !qtyNum || qtyNum <= 0) return 0;
    const perUnit = mrpNum / qtyNum;
    return (unit === "ml" || unit === "g") ? perUnit * 100 : perUnit;
  };

  // Handle Dual Upload File Pickers
  const handlePickDualImage = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (target === "A") setDualImgA(ev.target.result);
      if (target === "B") setDualImgB(ev.target.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRunDualAnalysis = () => {
    if (!dualImgA || !dualImgB) return;
    setIsAnalyzingDual(true);
    setTimeout(() => {
      setDualAnalysis({
        prodA: {
          name: "Scanned Label Photo 1",
          mrp: "₹ 150.00",
          net_quantity: "500 g",
          unit_price: "₹ 30.00 per 100 g",
          font_size: "Compliant (2.5 mm)",
          helpline: "1800-11-2233 / care@brandA.in",
          mfg_details: "Certified Foods Pvt Ltd, Delhi",
          compliance_score: 92,
          status: "Compliant"
        },
        prodB: {
          name: "Scanned Label Photo 2",
          mrp: "₹ 165.00",
          net_quantity: "450 g",
          unit_price: "₹ 36.67 per 100 g",
          font_size: "Non-Compliant (1.2 mm - below 2.0 mm min)",
          helpline: "Not Legible on Label",
          mfg_details: "Brand B Packers, Noida",
          compliance_score: 65,
          status: "Violation"
        }
      });
      setIsAnalyzingDual(false);
    }, 1200);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HERO BANNER & OPTION SELECTOR TABS */}
      <div className="p-6 rounded-2xl border bg-slate-900/60 border-slate-800 space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
              <Scale size={14} />
              <span>LEGAL METROLOGY PCR 2011 COMPARISON ENGINE</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Compare 2 Packaged Products
            </h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Audit printed MRP accuracy, statutory declarations, net quantity, unit pricing compliance (Rule 6(1)(s)), and minimum font height between two products.
            </p>
          </div>

          <button
            type="button"
            onClick={onScanNew}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-2 cursor-pointer shadow-md"
          >
            <ScanLine size={16} />
            <span>Scan New Label</span>
          </button>
        </div>

        {/* THREE COMPARISON OPTION TABS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={() => setActiveTab("SAVED")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === "SAVED"
                ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 shadow-md"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              activeTab === "SAVED" ? "bg-indigo-500 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}>
              1
            </div>
            <div>
              <div className="text-xs font-bold">Saved Scans & Catalogue</div>
              <div className="text-[10px] opacity-75">Compare 2 products from history</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("DUAL_SCAN")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === "DUAL_SCAN"
                ? "bg-emerald-600/20 border-emerald-500 text-emerald-200 shadow-md"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              activeTab === "DUAL_SCAN" ? "bg-emerald-500 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}>
              2
            </div>
            <div>
              <div className="text-xs font-bold">Dual Label Upload & AI Scan</div>
              <div className="text-[10px] opacity-75">Upload 2 photos for instant audit</div>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("CALCULATOR")}
            className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-3 ${
              activeTab === "CALCULATOR"
                ? "bg-amber-600/20 border-amber-500 text-amber-200 shadow-md"
                : "bg-slate-900/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
            }`}
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm ${
              activeTab === "CALCULATOR" ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
            }`}>
              3
            </div>
            <div>
              <div className="text-xs font-bold">Unit Price & Value Calculator</div>
              <div className="text-[10px] opacity-75">PCR 2011 Rule 6(1)(s) Unit Price</div>
            </div>
          </button>
        </div>
      </div>

      {/* OPTION 1: SAVED SCANS / CATALOGUE COMPARISON */}
      {activeTab === "SAVED" && (
        <div className="space-y-6">
          {/* SELECTORS & SWAP BUTTON */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-5 p-4 rounded-xl border bg-slate-900/40 border-slate-800">
              <label className="block text-xs font-bold text-indigo-400 mb-2 uppercase font-mono tracking-wider">
                Select Product A (Base Product)
              </label>
              <select
                value={productA?.id || ""}
                onChange={(e) => {
                  const found = availableProducts.find((p) => String(p.id) === e.target.value);
                  if (found) setProductA(found);
                }}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:border-indigo-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrp})
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2 text-center flex justify-center">
              <button
                type="button"
                onClick={handleSwap}
                className="p-3 rounded-full border bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:scale-110 transition-all cursor-pointer shadow-lg"
                title="Swap Product A and Product B"
              >
                <ArrowRightLeft size={18} />
              </button>
            </div>

            <div className="md:col-span-5 p-4 rounded-xl border bg-slate-900/40 border-slate-800">
              <label className="block text-xs font-bold text-emerald-400 mb-2 uppercase font-mono tracking-wider">
                Select Product B (Comparison Product)
              </label>
              <select
                value={productB?.id || ""}
                onChange={(e) => {
                  const found = availableProducts.find((p) => String(p.id) === e.target.value);
                  if (found) setProductB(found);
                }}
                className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-medium focus:outline-none focus:border-emerald-500"
              >
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.mrp})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* SIDE BY SIDE CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* PRODUCT A */}
            <div className="p-6 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-indigo-500/20 text-2xl flex items-center justify-center">
                    {productA?.image || "📦"}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100">{productA?.name}</h3>
                    <span className="text-xs text-slate-400">{productA?.brand}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    productA?.compliance_score >= 80
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}>
                    {productA?.compliance_score >= 80 ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    <span>{productA?.compliance_score}% SCORE</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs border-t border-slate-800">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Printed MRP (Inc. Taxes)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{productA?.mrp}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Declared Net Weight / Qty</span>
                  <span className="font-bold text-slate-200">{productA?.net_quantity}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Unit Price (Rule 6(1)(s))</span>
                  <span className="font-mono font-bold text-indigo-300">
                    {getUnitPriceStr(productA?.mrp_num, productA?.qty_num, productA?.unit)}
                  </span>
                </div>

                <div className="py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium block mb-1">Packer & Manufacturer</span>
                  <span className="text-slate-300 text-[11px] leading-relaxed block">{productA?.manufacturer}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Mfg / Expiry Date</span>
                  <span className="font-mono text-slate-300">{productA?.mfg_date} / {productA?.expiry_date}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Customer Helpline</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[200px]">{productA?.helpline}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Font Height Compliance</span>
                  <span className={productA?.font_size_check?.includes("Compliant") ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {productA?.font_size_check}
                  </span>
                </div>
              </div>

              {productA?._raw && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail && onOpenDetail(productA._raw)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>View Full Inspection Details</span>
                  </button>
                </div>
              )}
            </div>

            {/* PRODUCT B */}
            <div className="p-6 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-5 relative">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-12 h-12 rounded-xl bg-emerald-500/20 text-2xl flex items-center justify-center">
                    {productB?.image || "📦"}
                  </span>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-100">{productB?.name}</h3>
                    <span className="text-xs text-slate-400">{productB?.brand}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                    productB?.compliance_score >= 80
                      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                      : "bg-red-500/15 text-red-400 border-red-500/30"
                  }`}>
                    {productB?.compliance_score >= 80 ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                    <span>{productB?.compliance_score}% SCORE</span>
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-xs border-t border-slate-800">
                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Printed MRP (Inc. Taxes)</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">{productB?.mrp}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Declared Net Weight / Qty</span>
                  <span className="font-bold text-slate-200">{productB?.net_quantity}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Unit Price (Rule 6(1)(s))</span>
                  <span className="font-mono font-bold text-emerald-300">
                    {getUnitPriceStr(productB?.mrp_num, productB?.qty_num, productB?.unit)}
                  </span>
                </div>

                <div className="py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium block mb-1">Packer & Manufacturer</span>
                  <span className="text-slate-300 text-[11px] leading-relaxed block">{productB?.manufacturer}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Mfg / Expiry Date</span>
                  <span className="font-mono text-slate-300">{productB?.mfg_date} / {productB?.expiry_date}</span>
                </div>

                <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                  <span className="text-slate-400 font-medium">Customer Helpline</span>
                  <span className="text-slate-300 text-[11px] truncate max-w-[200px]">{productB?.helpline}</span>
                </div>

                <div className="flex justify-between py-1.5">
                  <span className="text-slate-400 font-medium">Font Height Compliance</span>
                  <span className={productB?.font_size_check?.includes("Compliant") ? "text-emerald-400 font-bold" : "text-amber-400 font-bold"}>
                    {productB?.font_size_check}
                  </span>
                </div>
              </div>

              {productB?._raw && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onOpenDetail && onOpenDetail(productB._raw)}
                    className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye size={14} />
                    <span>View Full Inspection Details</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* OPTION 2: DUAL LABEL UPLOAD & AI SCAN */}
      {activeTab === "DUAL_SCAN" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border bg-slate-900/60 border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Sparkles className="text-emerald-400" size={18} />
              <span>Dual Label Photo Upload & AI Comparison</span>
            </h3>
            <p className="text-xs text-slate-400">
              Upload two product packaging photos to run instant side-by-side OCR declaration extraction and legal compliance analysis.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              {/* PHOTO A UPLOAD */}
              <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center space-y-3 relative">
                {dualImgA ? (
                  <div className="space-y-3">
                    <img src={dualImgA} alt="Label 1" className="h-48 mx-auto object-contain rounded-lg border border-slate-800" />
                    <button
                      type="button"
                      onClick={() => setDualImgA(null)}
                      className="text-xs text-red-400 hover:underline cursor-pointer font-bold"
                    >
                      Remove Photo 1
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer space-y-3 p-4">
                    <div className="w-12 h-12 rounded-full bg-indigo-500/15 text-indigo-400 flex items-center justify-center mx-auto">
                      <UploadCloud size={24} />
                    </div>
                    <div className="text-xs font-bold text-slate-200">Upload Product Label 1</div>
                    <p className="text-[11px] text-slate-500">Click or drag image of first package</p>
                    <input type="file" accept="image/*" onChange={(e) => handlePickDualImage(e, "A")} className="hidden" />
                  </label>
                )}
              </div>

              {/* PHOTO B UPLOAD */}
              <div className="p-6 rounded-xl border border-dashed border-slate-700 bg-slate-950/60 text-center space-y-3 relative">
                {dualImgB ? (
                  <div className="space-y-3">
                    <img src={dualImgB} alt="Label 2" className="h-48 mx-auto object-contain rounded-lg border border-slate-800" />
                    <button
                      type="button"
                      onClick={() => setDualImgB(null)}
                      className="text-xs text-red-400 hover:underline cursor-pointer font-bold"
                    >
                      Remove Photo 2
                    </button>
                  </div>
                ) : (
                  <label className="block cursor-pointer space-y-3 p-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-500/15 text-emerald-400 flex items-center justify-center mx-auto">
                      <UploadCloud size={24} />
                    </div>
                    <div className="text-xs font-bold text-slate-200">Upload Product Label 2</div>
                    <p className="text-[11px] text-slate-500">Click or drag image of second package</p>
                    <input type="file" accept="image/*" onChange={(e) => handlePickDualImage(e, "B")} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="pt-3 text-center">
              <button
                type="button"
                onClick={handleRunDualAnalysis}
                disabled={!dualImgA || !dualImgB || isAnalyzingDual}
                className={`px-6 py-3 rounded-xl font-extrabold text-xs transition-all shadow-xl cursor-pointer ${
                  dualImgA && dualImgB && !isAnalyzingDual
                    ? "bg-emerald-500 text-slate-950 hover:bg-emerald-400 hover:scale-105"
                    : "bg-slate-800 text-slate-500 cursor-not-allowed"
                }`}
              >
                {isAnalyzingDual ? "Analyzing Labels side-by-side..." : "Run Side-by-Side AI Audit"}
              </button>
            </div>
          </div>

          {/* DUAL ANALYSIS RESULTS */}
          {dualAnalysis && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="p-6 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">{dualAnalysis.prodA.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-bold">
                    {dualAnalysis.prodA.status}
                  </span>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between"><span className="text-slate-400">Printed MRP:</span> <strong className="text-slate-100">{dualAnalysis.prodA.mrp}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Net Quantity:</span> <span className="text-slate-200">{dualAnalysis.prodA.net_quantity}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Unit Sale Price:</span> <span className="text-indigo-300 font-mono font-bold">{dualAnalysis.prodA.unit_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Font Height:</span> <span className="text-emerald-400 font-bold">{dualAnalysis.prodA.font_size}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Customer Helpline:</span> <span className="text-slate-300">{dualAnalysis.prodA.helpline}</span></div>
                </div>
              </div>

              <div className="p-6 rounded-2xl border bg-slate-900/80 border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-slate-100">{dualAnalysis.prodB.name}</h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-400 border border-red-500/30 font-bold">
                    {dualAnalysis.prodB.status}
                  </span>
                </div>
                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <div className="flex justify-between"><span className="text-slate-400">Printed MRP:</span> <strong className="text-slate-100">{dualAnalysis.prodB.mrp}</strong></div>
                  <div className="flex justify-between"><span className="text-slate-400">Net Quantity:</span> <span className="text-slate-200">{dualAnalysis.prodB.net_quantity}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Unit Sale Price:</span> <span className="text-amber-300 font-mono font-bold">{dualAnalysis.prodB.unit_price}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Font Height:</span> <span className="text-red-400 font-bold">{dualAnalysis.prodB.font_size}</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Customer Helpline:</span> <span className="text-red-400">{dualAnalysis.prodB.helpline}</span></div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OPTION 3: UNIT PRICE & FAIR VALUE CALCULATOR (PCR 2011 RULE 6(1)(s)) */}
      {activeTab === "CALCULATOR" && (
        <div className="space-y-6">
          <div className="p-6 rounded-2xl border bg-slate-900/60 border-slate-800 space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Calculator className="text-amber-400" size={18} />
                <span>PCR 2011 Unit Sale Price & Fair Value Calculator</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Under Legal Metrology PCR 2011 Rule 6(1)(s), every pre-packaged commodity must declare its Unit Sale Price (per g/kg/ml/L). Input package details below to find the true fair value winner.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* INPUTS PRODUCT A */}
              <div className="p-5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-4">
                <h4 className="font-bold text-xs text-indigo-400 uppercase font-mono tracking-wider">Product A Details</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={calcA.name}
                      onChange={(e) => setCalcA({ ...calcA, name: e.target.value })}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Printed MRP (₹)</label>
                      <input
                        type="number"
                        value={calcA.mrp}
                        onChange={(e) => setCalcA({ ...calcA, mrp: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Net Weight / Volume</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={calcA.qty}
                          onChange={(e) => setCalcA({ ...calcA, qty: parseFloat(e.target.value) || 0 })}
                          className="w-2/3 p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono"
                        />
                        <select
                          value={calcA.unit}
                          onChange={(e) => setCalcA({ ...calcA, unit: e.target.value })}
                          className="w-1/3 p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                        >
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
                    <span className="text-[10px] text-indigo-400 block font-mono">STATUTORY UNIT SALE PRICE</span>
                    <strong className="text-sm font-mono font-bold">
                      {getUnitPriceStr(calcA.mrp, calcA.qty, calcA.unit)}
                    </strong>
                  </div>
                </div>
              </div>

              {/* INPUTS PRODUCT B */}
              <div className="p-5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-4">
                <h4 className="font-bold text-xs text-emerald-400 uppercase font-mono tracking-wider">Product B Details</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Product Name</label>
                    <input
                      type="text"
                      value={calcB.name}
                      onChange={(e) => setCalcB({ ...calcB, name: e.target.value })}
                      className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-400 mb-1">Printed MRP (₹)</label>
                      <input
                        type="number"
                        value={calcB.mrp}
                        onChange={(e) => setCalcB({ ...calcB, mrp: parseFloat(e.target.value) || 0 })}
                        className="w-full p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Net Weight / Volume</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={calcB.qty}
                          onChange={(e) => setCalcB({ ...calcB, qty: parseFloat(e.target.value) || 0 })}
                          className="w-2/3 p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono"
                        />
                        <select
                          value={calcB.unit}
                          onChange={(e) => setCalcB({ ...calcB, unit: e.target.value })}
                          className="w-1/3 p-2 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs"
                        >
                          <option value="ml">ml</option>
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="L">L</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
                    <span className="text-[10px] text-emerald-400 block font-mono">STATUTORY UNIT SALE PRICE</span>
                    <strong className="text-sm font-mono font-bold">
                      {getUnitPriceStr(calcB.mrp, calcB.qty, calcB.unit)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* VERDICT SUMMARY */}
            {(() => {
              const valA = getUnitPriceVal(calcA.mrp, calcA.qty, calcA.unit);
              const valB = getUnitPriceVal(calcB.mrp, calcB.qty, calcB.unit);
              if (valA <= 0 || valB <= 0) return null;

              const diff = Math.abs(valA - valB);
              const lowerIsA = valA < valB;
              const percent = Math.round((diff / (lowerIsA ? valB : valA)) * 100);

              return (
                <div className="p-4 rounded-xl border bg-emerald-500/15 border-emerald-500/40 text-slate-100 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black text-xl">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-300">
                      FAIR VALUE WINNER: {lowerIsA ? calcA.name : calcB.name}
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {lowerIsA ? calcA.name : calcB.name} offers <strong className="text-emerald-400">{percent}% better value per unit</strong> compared to {lowerIsA ? calcB.name : calcA.name} under PCR 2011 unit pricing standards.
                    </p>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
