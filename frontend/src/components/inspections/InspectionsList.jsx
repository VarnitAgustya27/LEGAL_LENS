import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, RefreshCw, FilePlus2, Database, Loader2 } from "lucide-react";
import { C, FONT, CATEGORIES, INSPECTIONS, inputStyle } from "../../constants.jsx";
import {
  fetchInspections, fetchInspectionByCase, mapSupabaseRowToInspection
} from "../../services/supabaseInspectionService.js";
import { Card, Button, StatusBadge } from "../common/UIComponents.jsx";

export default function InspectionsList({ onOpen, onNew, users = [], currentUser }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [rows, setRows] = useState(null);   // null = loading
  const [fetchError, setFetchError] = useState(null);
  const [openingId, setOpeningId] = useState(null); // case_number being opened
  const shouldReduceMotion = useReducedMotion();
  const isConsumer = currentUser?.role === "Consumer";

  // Helper to dynamically resolve inspector name from users list while strictly preserving Deleted User
  const resolveInspectorName = (item) => {
    const raw = item?.inspector_name || item?.inspector || "";
    if (String(raw).trim().toLowerCase() === "deleted user") {
      return "Deleted User";
    }
    if (Array.isArray(users) && users.length > 0) {
      if (item?.inspector_email) {
        const found = users.find(u => u.email && u.email.toLowerCase() === item.inspector_email.toLowerCase());
        if (found?.name) return found.name;
      }
      if (item?.inspector_badge) {
        const found = users.find(u => u.badge && u.badge.toLowerCase() === item.inspector_badge.toLowerCase());
        if (found?.name) return found.name;
      }
      if (raw && raw !== "—") {
        const found = users.find(u => u.name && u.name.toLowerCase() === raw.toLowerCase());
        if (found?.name) return found.name;
      }
    }
    return raw || "—";
  };

  // Fetch full inspection data from Supabase then navigate to detail
  const handleOpenLive = async (row) => {
    if (!row?.case_number) return;
    setOpeningId(row.case_number);
    try {
      const { data, error } = await fetchInspectionByCase(row.case_number);
      if (data && !error) {
        const full = mapSupabaseRowToInspection(data);
        onOpen?.(full);
      } else {
        // Fallback: open with whatever partial data we have
        onOpen?.(mapSupabaseRowToInspection(row));
      }
    } catch (err) {
      console.warn('[InspectionsList] Full fetch failed, using partial data:', err);
      onOpen?.(mapSupabaseRowToInspection(row));
    } finally {
      setOpeningId(null);
    }
  };

  // Debounce search so we don't fire a query on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 380);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filterForUser = (items) => {
    if (!isConsumer || !items) return items;
    if (!currentUser?.email) return [];
    return items.filter(item => item.inspector_email && item.inspector_email.toLowerCase() === currentUser.email.toLowerCase());
  };

  // Fetch from Supabase whenever filters or refreshKey change
  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setFetchError(null);

    fetchInspections({ status: statusFilter, category: categoryFilter, search: debouncedSearch })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          // Supabase unavailable — fall back to static demo list
          const fallback = statusFilter === "ALL"
            ? INSPECTIONS
            : INSPECTIONS.filter((i) => i.status === statusFilter);
          const filtered = debouncedSearch
            ? fallback.filter((i) =>
              [i.id, i.product, i.manufacturer].some((v) =>
                (v || "").toLowerCase().includes(debouncedSearch.toLowerCase())
              )
            )
            : fallback;
          const mapped = filtered.map((i) => ({
            case_number: i.id,
            product_name: i.product,
            category: i.category,
            manufacturer: i.manufacturer,
            status: i.status,
            inspector_name: i.inspector,
            created_at: i.date,
            is_demo: true,
            is_officer_only: i.is_officer_only || Boolean(i.inspector_badge),
            _raw: i,
          }));
          setRows(filterForUser(mapped));
        } else {
          setRows(filterForUser(data));
        }
      })
      .catch(() => {
        if (cancelled) return;
        const mapped = INSPECTIONS.map((i) => ({
          case_number: i.id, product_name: i.product, category: i.category,
          manufacturer: i.manufacturer, status: i.status, inspector_name: i.inspector,
          created_at: i.date, is_demo: true, is_officer_only: i.is_officer_only || Boolean(i.inspector_badge), _raw: i,
        }));
        setRows(filterForUser(mapped));
      });

    return () => { cancelled = true; };
  }, [statusFilter, categoryFilter, debouncedSearch, refreshKey, currentUser, isConsumer]);

  const displayDate = (iso) => {
    if (!iso) return "—";
    return String(iso).slice(0, 10);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-4"
    >
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
            <input
              placeholder="Search inspections…"
              className="ll-focus transition-all duration-200"
              style={{ ...inputStyle, paddingLeft: 30, width: 240, fontSize: 12.5 }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          {/* Status */}
          <select
            className="ll-focus cursor-pointer transition-all duration-200"
            style={{ ...inputStyle, width: 170, fontSize: 12.5 }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
            <option value="REVIEW">Requires Verification</option>
          </select>
          {/* Category */}
          <select
            className="ll-focus cursor-pointer transition-all duration-200"
            style={{ ...inputStyle, width: 170, fontSize: 12.5 }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          {/* Refresh */}
          <button
            title="Refresh"
            onClick={() => {
              setRows(null);
              setRefreshKey((k) => k + 1);
            }}
            className="ll-focus flex items-center gap-1 px-2 py-1.5 rounded-sm border text-xs transition-all hover:opacity-80 cursor-pointer"
            style={{ borderColor: C.line, color: C.slate, background: "transparent" }}
          >
            <RefreshCw size={12} className={rows === null ? "animate-spin" : ""} />
          </button>
        </div>
        <Button onClick={onNew}><FilePlus2 size={15} /> New Inspection</Button>
      </div>

      {/* ── Table ── */}
      <Card padded={false} className="overflow-x-auto ll-scroll rounded-xl">
        <table className="w-full" style={{ fontSize: 12.5 }}>
          <thead>
            <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em", background: "var(--ll-table-head-bg)" }}>
              {["CASE NO.", "PRODUCT", "CATEGORY", "MANUFACTURER", "STATUS", "INSPECTOR", "DATE", "SOURCE", ""].map((h) => (
                <th key={h} className="text-left font-semibold px-5 py-2.5 border-b whitespace-nowrap" style={{ borderColor: C.line }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Loading skeleton */}
            {rows === null && Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`skel-${idx}`}>
                {Array.from({ length: 9 }).map((__, ci) => (
                  <td key={ci} className="px-5 py-2.5 border-b" style={{ borderColor: C.line }}>
                    <div className="h-3.5 rounded animate-pulse" style={{ background: C.line, width: ci === 1 ? "80%" : "60%" }} />
                  </td>
                ))}
              </tr>
            ))}

            {/* Empty state */}
            {rows !== null && rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-12 text-center" style={{ color: C.slate }}>
                  <Database size={32} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>
                    {isConsumer ? "No products scanned yet" : "No inspections found."}
                  </div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {isConsumer
                      ? "Your scanned product history is currently empty. Click 'New Inspection' to scan a product label."
                      : "Try clearing filters or create a new inspection."}
                  </div>
                  {isConsumer && (
                    <button
                      type="button"
                      onClick={onNew}
                      className="mt-3.5 px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-md"
                    >
                      <FilePlus2 size={14} />
                      <span>Scan Your First Product</span>
                    </button>
                  )}
                </td>
              </tr>
            )}

            {/* Data rows */}
            {(rows || []).map((i) => (
              <tr
                key={i.case_number}
                className="ll-tr transition-all duration-150"
                style={{ cursor: i.is_demo ? "default" : (openingId === i.case_number ? "wait" : "pointer") }}
                onClick={() => !i.is_demo && openingId === null && handleOpenLive(i)}
              >
                <td className="px-5 py-2.5 border-b whitespace-nowrap font-semibold" style={{ borderColor: C.line, ...FONT.mono, color: C.ink }}>
                  {i.case_number}
                </td>
                <td className="px-5 py-2.5 border-b font-semibold" style={{ borderColor: C.line, color: C.ink, minWidth: 140 }}>
                  {i.product_name}
                </td>
                <td className="px-5 py-2.5 border-b whitespace-nowrap" style={{ borderColor: C.line, color: C.slate }}>
                  {i.category}
                </td>
                <td className="px-5 py-2.5 border-b max-w-[260px]" style={{ borderColor: C.line, color: C.slate }}>
                  <div className="line-clamp-2" title={i.manufacturer || ""}>
                    {i.manufacturer || "—"}
                  </div>
                </td>
                <td className="px-5 py-2.5 border-b whitespace-nowrap" style={{ borderColor: C.line }}>
                  <StatusBadge status={(() => {
                    if (Array.isArray(i.declarations) && i.declarations.length > 0) {
                      const passes = i.declarations.filter(d => (d.status === "PASS" || d.status === "COMPLIANT") && d.value && String(d.value).trim() !== "" && String(d.value).toLowerCase() !== "null").length;
                      const ratio = passes / i.declarations.length;
                      if (passes === i.declarations.length) return "COMPLIANT";
                      if (ratio < 0.50) return "NON_COMPLIANT";
                      return "REVIEW";
                    }
                    return i.status;
                  })()} />
                </td>
                <td className="px-5 py-2.5 border-b whitespace-nowrap" style={{ borderColor: C.line, color: C.slate }}>
                  {resolveInspectorName(i)}
                </td>
                <td className="px-5 py-2.5 border-b whitespace-nowrap" style={{ borderColor: C.line, color: C.slate }}>
                  {displayDate(i.created_at)}
                </td>
                <td className="px-5 py-2.5 border-b whitespace-nowrap" style={{ borderColor: C.line }}>
                  {i.is_demo ? (
                    <span className="inline-flex items-center gap-1" style={{ fontSize: 10.5, color: C.slate, background: "var(--ll-bg-paper)", border: `1px solid ${C.line}`, borderRadius: 9999, padding: "2px 8px" }}>
                      Demo
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-semibold" style={{ fontSize: 10.5, color: C.compliant, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", borderRadius: 9999, padding: "2px 8px" }}>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                    </span>
                  )}
                </td>
                <td className="px-5 py-3.5 border-b whitespace-nowrap" style={{ borderColor: C.line }}>
                  {!i.is_demo && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenLive(i); }}
                      disabled={openingId === i.case_number}
                      className="ll-focus px-2.5 py-1 rounded-md border text-xs font-semibold transition-all hover:scale-105 flex items-center gap-1 shadow-xs"
                      style={{ borderColor: C.gold, color: C.gold, background: "transparent", fontSize: 11, opacity: openingId === i.case_number ? 0.6 : 1 }}
                    >
                      {openingId === i.case_number
                        ? <><Loader2 size={10} className="animate-spin" /> Loading…</>
                        : "View"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Footer count */}
        {rows !== null && rows.length > 0 && (
          <div className="px-4 py-2 border-t text-right" style={{ borderColor: C.line, fontSize: 11, color: C.slate }}>
            {rows.length} inspection{rows.length !== 1 ? "s" : ""} shown
            {rows.some((r) => !r.is_demo) && (
              <span style={{ color: C.compliant, marginLeft: 8 }}>
                ● {rows.filter((r) => !r.is_demo).length} live from Supabase
              </span>
            )}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
