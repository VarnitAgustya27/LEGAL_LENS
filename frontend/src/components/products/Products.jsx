import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Shield, X, Calendar, ArrowRight, Loader2, Package, Search, RefreshCw, ChevronRight } from "lucide-react";
import { C, FONT, CATEGORIES, INSPECTIONS, inputStyle, StatusMeta } from "../../constants.jsx";
import ApiService from "../../services/api.js";
import { fetchInspections, fetchInspectionByCase, mapSupabaseRowToInspection, mapBackendInspectionToFrontend } from "../../services/supabaseInspectionService.js";
import { Card, Button, StatusBadge } from "../common/UIComponents.jsx";

export function ProductHistoryModal({ product, onClose, onOpenInspection }) {
  const [openingId, setOpeningId] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!product) return null;

  const handleOpenReport = async (histItem) => {
    const caseNo = histItem.id || histItem.case_number;
    if (!caseNo) return;
    setOpeningId(caseNo);
    try {
      const { data: supaData } = await fetchInspectionByCase(caseNo);
      if (supaData) {
        onClose();
        onOpenInspection?.(mapSupabaseRowToInspection(supaData));
        return;
      }
      const backendData = await ApiService.getInspectionByCase(caseNo);
      if (backendData) {
        onClose();
        onOpenInspection?.(mapBackendInspectionToFrontend(backendData));
        return;
      }
      onClose();
      onOpenInspection?.(mapSupabaseRowToInspection(histItem.raw || histItem));
    } catch (e) {
      console.warn("[Products] Open inspection notice:", e);
      onClose();
      onOpenInspection?.(mapSupabaseRowToInspection(histItem.raw || histItem));
    } finally {
      setOpeningId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-xs">
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: "var(--ll-bg-card)", borderColor: C.line }}
      >
        <div className="p-6 border-b flex items-start justify-between gap-4" style={{ borderColor: C.line, background: "var(--ll-bg-card)" }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Shield size={16} style={{ color: C.gold }} />
              <span style={{ ...FONT.display, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", color: C.gold }}>
                CASE AUDIT TRAIL • LEGAL METROLOGY ACT, 2009
              </span>
            </div>
            <h2 style={{ ...FONT.display, fontSize: 22, fontWeight: 800, color: C.ink }}>
              {product.name}
            </h2>

            <div className="flex flex-wrap items-center gap-2 mt-2.5">
              <span className="text-xs px-3 py-1 rounded-full font-semibold border" style={{ background: "var(--ll-bg-page)", borderColor: C.line, color: C.charcoal }}>
                {product.category}
              </span>
              <span className="text-xs px-3 py-1 rounded-full font-mono border" style={{ background: "var(--ll-bg-page)", borderColor: C.line, color: C.slate }}>
                Barcode: {product.barcode}
              </span>
              {product.manufacturer && product.manufacturer !== "—" && (
                <span className="text-xs px-3 py-1 rounded-full border truncate max-w-[260px]" style={{ background: "var(--ll-bg-page)", borderColor: C.line, color: C.slate }}>
                  Mfg: {product.manufacturer}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full border font-semibold" style={{ background: "var(--ll-bg-page)", borderColor: C.line, color: C.gold }}>
                {product.history?.length || 1} Total Test{(product.history?.length || 1) === 1 ? '' : 's'}
              </span>
              <StatusBadge status={product.status} />
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-500/10 text-slate-400 hover:text-white transition-colors"
            title="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-0 ll-scroll" style={{ background: "var(--ll-bg-page)" }}>
          <div className="mb-4">
            <span style={{ fontSize: 11.5, fontWeight: 700, color: C.slate, letterSpacing: "0.06em" }}>
              CHRONOLOGICAL INSPECTION TIMELINE (NEWEST FIRST)
            </span>
          </div>

          {(!product.history || product.history.length === 0) ? (
            <div className="py-12 text-center">
              <Package size={32} className="mx-auto mb-2 opacity-40" style={{ color: C.slate }} />
              <p style={{ fontSize: 13, color: C.slate }}>No past inspection records found for this product.</p>
            </div>
          ) : (
            product.history.map((h, idx) => {
              const m = StatusMeta(h.status);
              const isLast = idx === product.history.length - 1;
              const isOpening = openingId === h.id;

              return (
                <div key={h.id + idx} className="flex gap-4 group">
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 shadow-xs flex-shrink-0"
                      style={{ borderColor: m.color, background: m.bg }}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 my-1" style={{ background: C.line, minHeight: 48 }} />
                    )}
                  </div>

                  <div className="pb-6 flex-1">
                    <div
                      className="p-4 rounded-xl border transition-all hover:border-[var(--ll-gold)] shadow-xs duration-150"
                      style={{ borderColor: C.line, background: "var(--ll-bg-card)" }}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <span style={{ ...FONT.mono, fontSize: 13, color: C.ink, fontWeight: 700 }}>
                            {h.id}
                          </span>
                          <StatusBadge status={h.status} />
                          <span className="flex items-center gap-1 text-xs" style={{ color: C.slate }}>
                            <Calendar size={11} /> {h.date}
                          </span>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenReport(h)}
                          disabled={isOpening}
                          className="text-xs gap-1 py-1 px-3 h-7 rounded-lg font-semibold"
                        >
                          {isOpening ? (
                            <>
                              <Loader2 size={12} className="animate-spin" /> Loading…
                            </>
                          ) : (
                            <>
                              View Full Report <ArrowRight size={12} />
                            </>
                          )}
                        </Button>
                      </div>

                      <div className="mt-3 pt-2.5 border-t flex flex-wrap items-center justify-between gap-2" style={{ borderColor: C.line }}>
                        <p style={{ fontSize: 12.5, color: C.charcoal, lineHeight: 1.4, maxWidth: "75%" }}>
                          {h.note}
                        </p>
                        <span className="text-xs flex items-center gap-1 font-medium" style={{ color: C.slate }}>
                          <Shield size={11} /> Inspector: {h.inspector}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between" style={{ borderColor: C.line, background: "var(--ll-bg-card)" }}>
          <span style={{ fontSize: 11.5, color: C.slate }}>
            Section 29/36 Legal Metrology Act, 2009 • Verified Audit Records
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default function Products({ onOpenInspection, onNewInspection, users = [], currentUser }) {
  const [productsList, setProductsList] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const shouldReduceMotion = useReducedMotion();
  const isConsumer = currentUser?.role === "Consumer";

  const aggregateProducts = (inspections) => {
    if (!Array.isArray(inspections) || inspections.length === 0) {
      return [];
    }

    const productMap = new Map();

    const generateBarcode = (name) => {
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = (hash << 5) - hash + name.charCodeAt(i);
        hash |= 0;
      }
      const abs = Math.abs(hash).toString().padEnd(10, "0").slice(0, 10);
      return `890${abs}`;
    };

    for (const item of inspections) {
      const rawName = item.product_name || item.product || item.name || "Packaged Commodity";
      const cleanName = rawName.trim();
      const manufacturer = (item.manufacturer || item.retailer_name || "").trim();
      const cno = item.case_number || item.id || String(Math.random());

      let barcode = item.barcode;
      if (!barcode && Array.isArray(item.declarations)) {
        const bDecl = item.declarations.find(d => d.field === "barcode" || d.field === "gtin" || d.field === "ean");
        if (bDecl?.value) barcode = bDecl.value;
      }
      if (!barcode) {
        barcode = generateBarcode(cleanName + cno);
      }

      let key = cleanName.toLowerCase();
      let displayName = cleanName;

      if (barcode && !barcode.startsWith("890")) {
        key = `barcode:${barcode}`;
      } else if (["packaged commodity", "unknown product", "commodity", "packaged food", "packaged product"].includes(cleanName.toLowerCase())) {
        if (manufacturer && manufacturer !== "—") {
          key = `mfr:${manufacturer.toLowerCase()}`;
          displayName = `Packaged Commodity (${manufacturer.length > 30 ? manufacturer.slice(0, 30) + '...' : manufacturer})`;
        } else {
          key = `case:${cno}`;
          displayName = `Packaged Commodity (${cno})`;
        }
      } else {
        key = `name:${cleanName.toLowerCase()}`;
      }

      let note = "All mandatory declarations verified under PCR 2011";
      const rawStat = (item.status || "REVIEW").toUpperCase();
      if (rawStat === "NON_COMPLIANT" || rawStat === "REVIEW") {
        if (Array.isArray(item.violations) && item.violations.length > 0) {
          note = item.violations.map(v => v.description || v.title || v.rule_code || v.reason || v).slice(0, 2).join(" • ");
        } else if (Array.isArray(item.declarations) && item.declarations.length > 0) {
          const missing = item.declarations
            .filter(d => d.status === "FAIL" || !d.value || d.detected === false)
            .map(d => d.label || d.field);
          if (missing.length > 0) {
            note = `Missing or non-compliant: ${missing.slice(0, 2).join(", ")}`;
          } else {
            note = rawStat === "NON_COMPLIANT" ? "Statutory non-compliance detected" : "Requires manual officer verification";
          }
        } else if (item.notes) {
          note = item.notes;
        } else {
          note = rawStat === "NON_COMPLIANT" ? "Statutory non-compliance detected" : "Requires manual officer verification";
        }
      }

      let inspectorName = item.inspector_name || item.inspector || "Authorized Officer";
      if (String(inspectorName).trim().toLowerCase() === "deleted user") {
        inspectorName = "Deleted User";
      } else if (Array.isArray(users) && users.length > 0) {
        if (item.inspector_email) {
          const u = users.find(x => x.email && x.email.toLowerCase() === item.inspector_email.toLowerCase());
          if (u?.name) inspectorName = u.name;
        } else if (item.inspector_badge) {
          const u = users.find(x => x.badge && x.badge.toLowerCase() === item.inspector_badge.toLowerCase());
          if (u?.name) inspectorName = u.name;
        }
      }

      const historyEntry = {
        id: cno,
        date: String(item.created_at || item.date || new Date().toISOString()).slice(0, 10),
        status: rawStat,
        inspector: inspectorName,
        score: typeof item.score === "number" ? item.score : (rawStat === "COMPLIANT" ? 100 : 50),
        note: note,
        raw: item
      };

      if (!productMap.has(key)) {
        productMap.set(key, {
          name: displayName,
          barcode: barcode,
          category: item.category || "Packaged Food",
          manufacturer: manufacturer || "—",
          inspections: 1,
          status: rawStat,
          latest_date: historyEntry.date,
          history: [historyEntry],
          raw: item
        });
      } else {
        const existing = productMap.get(key);
        existing.inspections += 1;
        existing.history.push(historyEntry);
        if ((!existing.manufacturer || existing.manufacturer === "—") && manufacturer) {
          existing.manufacturer = manufacturer;
        }
      }
    }

    const list = Array.from(productMap.values()).map(p => {
      p.history.sort((a, b) => new Date(b.date) - new Date(a.date));
      p.status = p.history[0]?.status || p.status;
      p.latest_date = p.history[0]?.date || p.latest_date;
      return p;
    });

    list.sort((a, b) => new Date(b.latest_date) - new Date(a.latest_date));
    return list;
  };

  const filterForUser = (items) => {
    if (!isConsumer || !items) return items;
    if (!currentUser?.email) return [];
    return items.filter(item => item.inspector_email && item.inspector_email.toLowerCase() === currentUser.email.toLowerCase());
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const { data: supaData } = await fetchInspections({ limit: 100 });
      if (supaData && supaData.length > 0) {
        const filtered = filterForUser(supaData);
        const prods = aggregateProducts(filtered);
        setProductsList(prods);
        setLoading(false);
        return;
      }

      const apiProds = await ApiService.getProducts();
      if (apiProds && apiProds.length > 0) {
        setProductsList(apiProds);
        setLoading(false);
        return;
      }

      const fallbackProds = aggregateProducts(filterForUser(INSPECTIONS));
      setProductsList(fallbackProds);
    } catch (err) {
      console.warn("[Products] Load notice:", err);
      const fallbackProds = aggregateProducts(filterForUser(INSPECTIONS));
      setProductsList(fallbackProds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser, isConsumer]);

  const filteredProducts = productsList.filter(p => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.manufacturer && p.manufacturer.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (categoryFilter !== "ALL" && p.category !== categoryFilter) return false;
    if (statusFilter !== "ALL" && p.status !== statusFilter) return false;
    return true;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Card padded={false} className="rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 border-b space-y-4" style={{ borderColor: C.line, background: "var(--ll-bg-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div style={{ ...FONT.mono, fontSize: 11, letterSpacing: "0.12em", color: C.gold, fontWeight: 700 }}>
                ALL PRODUCTS
              </div>
              <h2 style={{ ...FONT.display, fontSize: 21, color: C.ink, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 2 }}>
                Product Catalogue
              </h2>
              <p style={{ fontSize: 12.5, color: C.slate, marginTop: 4 }}>
                Aggregated compliance records and inspection history for all packaged commodities evaluated by enforcement officers.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3.5 py-1.5 rounded-full border font-mono font-semibold shadow-2xs" style={{ borderColor: C.line, color: C.slate, background: "var(--ll-bg-page)" }}>
                {productsList.length} Products Registered
              </span>
              <button
                onClick={loadData}
                className="ll-focus p-2 rounded-lg border hover:bg-slate-500/10 transition-colors cursor-pointer"
                style={{ borderColor: C.line, color: C.slate }}
                title="Refresh product catalogue"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input
                placeholder="Search by product name, barcode, manufacturer…"
                className="ll-focus transition-all duration-200 rounded-lg"
                style={{ ...inputStyle, paddingLeft: 34, width: "100%", fontSize: 12.5 }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="ll-focus cursor-pointer transition-all duration-200 rounded-lg"
              style={{ ...inputStyle, width: 180, fontSize: 12.5 }}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="ALL">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>

            <select
              className="ll-focus cursor-pointer transition-all duration-200 rounded-lg"
              style={{ ...inputStyle, width: 180, fontSize: 12.5 }}
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              <option value="COMPLIANT">Compliant</option>
              <option value="NON_COMPLIANT">Non-Compliant</option>
              <option value="REVIEW">Requires Verification</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto ll-scroll">
          <table className="w-full text-left" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.05em", background: "var(--ll-table-head-bg)" }}>
                <th className="font-semibold px-6 py-2.5 border-b text-left min-w-[320px]" style={{ borderColor: C.line }}>PRODUCT & MANUFACTURER</th>
                <th className="font-semibold px-5 py-2.5 border-b w-40 text-left" style={{ borderColor: C.line }}>BARCODE</th>
                <th className="font-semibold px-5 py-2.5 border-b w-36 text-left" style={{ borderColor: C.line }}>CATEGORY</th>
                <th className="font-semibold px-5 py-2.5 border-b w-28 text-center" style={{ borderColor: C.line }}>INSPECTIONS</th>
                <th className="font-semibold px-5 py-2.5 border-b w-44 text-center" style={{ borderColor: C.line }}>CURRENT STATUS</th>
                <th className="font-semibold px-6 py-2.5 border-b w-24 text-right" style={{ borderColor: C.line }}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <tr key={idx} className="border-b" style={{ borderColor: C.line }}>
                    <td className="px-6 py-2.5"><div className="h-4 w-48 bg-slate-700/20 animate-pulse rounded" /></td>
                    <td className="px-5 py-2.5"><div className="h-4 w-24 bg-slate-700/20 animate-pulse rounded" /></td>
                    <td className="px-5 py-2.5"><div className="h-4 w-20 bg-slate-700/20 animate-pulse rounded" /></td>
                    <td className="px-5 py-2.5 text-center"><div className="h-4 w-10 bg-slate-700/20 animate-pulse rounded mx-auto" /></td>
                    <td className="px-5 py-2.5 text-center"><div className="h-6 w-28 bg-slate-700/20 animate-pulse rounded mx-auto" /></td>
                    <td className="px-6 py-2.5 text-right"><div className="h-4 w-16 bg-slate-700/20 animate-pulse rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <Package size={32} className="mx-auto mb-2 opacity-40" style={{ color: C.slate }} />
                    <p style={{ fontSize: 13, color: C.slate, fontWeight: 500 }}>No products match your filter criteria.</p>
                    <button
                      onClick={() => { setSearchQuery(""); setCategoryFilter("ALL"); setStatusFilter("ALL"); }}
                      className="mt-3 text-xs font-semibold hover:underline"
                      style={{ color: C.gold }}
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  return (
                    <tr
                      key={p.name + p.barcode}
                      onClick={() => setModalProduct(p)}
                      className="ll-tr cursor-pointer transition-all duration-150"
                    >
                      <td className="px-6 py-2.5 border-b" style={{ borderColor: C.line }}>
                        <div style={{ fontWeight: 600, color: C.ink, fontSize: 13 }}>{p.name}</div>
                        {p.manufacturer && p.manufacturer !== "—" && (
                          <div style={{ fontSize: 11.5, color: C.slate, marginTop: 2, lineHeight: 1.4 }} className="line-clamp-2">
                            {p.manufacturer}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-2.5 border-b text-left" style={{ borderColor: C.line }}>
                        <span className="inline-block px-2.5 py-0.5 rounded font-mono text-xs border" style={{ borderColor: C.line, background: "var(--ll-bg-page)", color: C.slate }}>
                          {p.barcode}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 border-b text-left" style={{ borderColor: C.line, color: C.slate }}>
                        {p.category}
                      </td>
                      <td className="px-5 py-2.5 border-b text-center" style={{ borderColor: C.line }}>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border shadow-2xs" style={{ background: "var(--ll-bg-page)", color: C.charcoal, borderColor: C.line }}>
                          {p.inspections} test{p.inspections === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-5 py-4 border-b text-center" style={{ borderColor: C.line }}>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="px-6 py-4 border-b text-right" style={{ borderColor: C.line }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); setModalProduct(p); }}
                          className="ll-focus inline-flex items-center gap-1 transition-transform hover:translate-x-1 font-bold text-xs cursor-pointer"
                          style={{ color: C.gold }}
                        >
                          History <ChevronRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {modalProduct && (
        <ProductHistoryModal
          product={modalProduct}
          onClose={() => setModalProduct(null)}
          onOpenInspection={onOpenInspection}
        />
      )}
    </motion.div>
  );
}
