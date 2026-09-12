import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Search, RefreshCw, Loader2, Eye, Download, FileText, Calendar } from "lucide-react";
import { C, FONT, inputStyle } from "../../constants.jsx";
import ApiService from "../../services/api.js";
import { fetchInspectionByCase, mapSupabaseRowToInspection, mapBackendInspectionToFrontend } from "../../services/supabaseInspectionService.js";
import { Card, StatusBadge } from "../common/UIComponents.jsx";

export default function Reports({ onOpenInspection, users = [] }) {
  const [reportsList, setReportsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openingCase, setOpeningCase] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [downloadingPdfCase, setDownloadingPdfCase] = useState(null);
  const shouldReduceMotion = useReducedMotion();

  // Helper to dynamically resolve inspector name from users list while strictly preserving Deleted User
  const resolveInspectorName = (r) => {
    const raw = r?.inspector_name || r?.inspector || r?.generated_by || "";
    if (String(raw).trim().toLowerCase() === "deleted user") {
      return "Deleted User";
    }
    if (Array.isArray(users) && users.length > 0) {
      if (r?.inspector_email) {
        const found = users.find(u => u.email && u.email.toLowerCase() === r.inspector_email.toLowerCase());
        if (found?.name) return found.name;
      }
      if (r?.inspector_badge) {
        const found = users.find(u => u.badge && u.badge.toLowerCase() === r.inspector_badge.toLowerCase());
        if (found?.name) return found.name;
      }
      if (raw && raw !== "—") {
        const found = users.find(u => u.name && u.name.toLowerCase() === raw.toLowerCase());
        if (found?.name) return found.name;
      }
    }
    return raw || "—";
  };

  const handleDownloadPdf = async (r) => {
    const cno = r.case_number || r.id;
    if (!cno || downloadingPdfCase === cno) return;
    setDownloadingPdfCase(cno);
    try {
      let url = r.pdf_url;
      if (!url || url.includes('/undefined')) {
        url = `${ApiService.getApiBase()}/reports/case/${encodeURIComponent(cno)}/pdf`;
      } else if (url.startsWith('/api')) {
        url = url.replace('/api', ApiService.getApiBase());
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to download PDF");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `Report_${(cno || 'inspection').replace(/\//g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    } catch (err) {
      console.error("PDF download error:", err);
    } finally {
      setDownloadingPdfCase(null);
    }
  };

  const loadReports = async () => {
    setLoading(true);
    try {
      const apiData = await ApiService.getReports();
      setReportsList(Array.isArray(apiData) ? apiData : []);
    } catch (e) {
      setReportsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = reportsList.filter((r) => {
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const resolvedInspector = resolveInspectorName(r).toLowerCase();
      const match = (r.case_number && r.case_number.toLowerCase().includes(q)) ||
        (r.product_name && r.product_name.toLowerCase().includes(q)) ||
        (r.product && r.product.toLowerCase().includes(q)) ||
        resolvedInspector.includes(q) ||
        (r.inspector_name && r.inspector_name.toLowerCase().includes(q)) ||
        (r.inspector && r.inspector.toLowerCase().includes(q));
      if (!match) return false;
    }
    if (statusFilter !== "ALL" && (r.status || "REVIEW").toUpperCase() !== statusFilter) return false;
    return true;
  });

  const handleViewInspection = async (r) => {
    const cno = r.case_number || r.id;
    if (!cno) return;
    setOpeningCase(cno);
    try {
      // 1. Try Supabase query
      const { data: supaData } = await fetchInspectionByCase(cno);
      if (supaData && Array.isArray(supaData.declarations) && supaData.declarations.length > 0) {
        onOpenInspection?.(mapSupabaseRowToInspection(supaData));
        setOpeningCase(null);
        return;
      }

      // 2. Try FastAPI Backend query by case number
      const backendData = await ApiService.getInspectionByCase(cno);
      if (backendData && Array.isArray(backendData.declarations) && backendData.declarations.length > 0) {
        onOpenInspection?.(mapBackendInspectionToFrontend(backendData));
        setOpeningCase(null);
        return;
      }

      // 3. Try FastAPI Backend query by numeric ID
      if (typeof r.id === "number") {
        const idData = await ApiService.getInspection(r.id);
        if (idData && Array.isArray(idData.declarations) && idData.declarations.length > 0) {
          onOpenInspection?.(mapBackendInspectionToFrontend(idData));
          setOpeningCase(null);
          return;
        }
      }

      // 4. Fallback to Supabase / Backend metadata if available
      if (supaData) {
        onOpenInspection?.(mapSupabaseRowToInspection(supaData));
        setOpeningCase(null);
        return;
      }
      if (backendData) {
        onOpenInspection?.(mapBackendInspectionToFrontend(backendData));
        setOpeningCase(null);
        return;
      }

      // 5. Basic fallback
      onOpenInspection?.({
        id: cno,
        case_number: cno,
        product: r.product_name || r.product || "Packaged Commodity",
        product_name: r.product_name || r.product || "Packaged Commodity",
        status: r.status || "REVIEW",
        score: r.score || 0.0,
        inspector_name: r.inspector_name || r.inspector || "Enforcement Officer",
        date: r.date || "2026-08-31",
        declarations: [],
        images: [],
        violations: []
      });
    } catch (err) {
      console.warn("View inspection fetch note:", err);
    } finally {
      setOpeningCase(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="space-y-6"
    >
      <Card padded={false} className="overflow-x-auto ll-scroll relative rounded-xl shadow-sm">
        {/* Header & Filter Toolbar */}
        <div className="p-6 border-b space-y-4" style={{ borderColor: C.line, background: "var(--ll-bg-card)" }}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div style={{ ...FONT.mono, fontSize: 11, letterSpacing: "0.12em", color: C.gold, fontWeight: 700 }}>
                GENERATED DOSSIERS
              </div>
              <h2 style={{ ...FONT.display, fontSize: 21, color: C.ink, fontWeight: 700, letterSpacing: "-0.01em", marginTop: 2 }}>
                Inspection Reports
              </h2>
              <p style={{ fontSize: 12.5, color: C.slate, marginTop: 4 }}>
                Official bilingual legal metrology inspection reports, enforcement notices, and audit records.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs px-3.5 py-1.5 rounded-full border font-mono font-semibold shadow-2xs" style={{ borderColor: C.line, color: C.slate, background: "var(--ll-bg-page)" }}>
                {reportsList.length} Unique Inspection Cases
              </span>
              <button
                onClick={loadReports}
                className="ll-focus p-2 rounded-lg border hover:bg-slate-500/10 transition-colors cursor-pointer"
                style={{ borderColor: C.line, color: C.slate }}
                title="Refresh reports"
              >
                <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {/* Search & Status Filter */}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input
                placeholder="Search case no, product or inspector…"
                className="ll-focus transition-all duration-200 rounded-lg"
                style={{ ...inputStyle, paddingLeft: 34, fontSize: 12.5, width: "100%" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

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

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="animate-spin" size={18} /> Loading Official PDF Reports...
          </div>
        ) : (
          <table className="w-full text-left" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.05em", background: "var(--ll-table-head-bg)" }}>
                <th className="font-semibold px-6 py-2.5 border-b w-44 text-left" style={{ borderColor: C.line }}>CASE NO.</th>
                <th className="font-semibold px-5 py-2.5 border-b text-left min-w-[280px]" style={{ borderColor: C.line }}>PRODUCT NAME</th>
                <th className="font-semibold px-5 py-2.5 border-b w-44 text-left" style={{ borderColor: C.line }}>INSPECTOR</th>
                <th className="font-semibold px-5 py-2.5 border-b w-32 text-left" style={{ borderColor: C.line }}>DATE</th>
                <th className="font-semibold px-5 py-2.5 border-b w-44 text-center" style={{ borderColor: C.line }}>STATUS</th>
                <th className="font-semibold px-6 py-2.5 border-b w-52 text-right" style={{ borderColor: C.line }}></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center">
                    <FileText size={32} className="mx-auto mb-2 opacity-40" style={{ color: C.slate }} />
                    <p style={{ fontSize: 13, color: C.slate, fontWeight: 500 }}>No inspection reports match your filter criteria.</p>
                    <button
                      onClick={() => { setSearchTerm(""); setStatusFilter("ALL"); }}
                      className="mt-3 text-xs font-semibold hover:underline"
                      style={{ color: C.gold }}
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredReports.map((r) => {
                  const cnoKey = r.case_number || r.id;
                  const isOpening = openingCase === cnoKey;

                  return (
                    <tr key={cnoKey} className="ll-tr">
                      <td className="px-6 py-2.5 border-b font-semibold text-left" style={{ borderColor: C.line }}>
                        <span className="inline-block px-2.5 py-0.5 rounded font-mono text-xs border" style={{ borderColor: C.line, background: "var(--ll-bg-page)", color: C.ink }}>
                          {cnoKey}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 border-b font-semibold text-left" style={{ borderColor: C.line, color: C.ink }}>
                        {r.product_name || r.product}
                      </td>
                      <td className="px-5 py-2.5 border-b text-left" style={{ borderColor: C.line, color: C.slate }}>
                        {resolveInspectorName(r)}
                      </td>
                      <td className="px-5 py-2.5 border-b text-left" style={{ borderColor: C.line, color: C.slate }}>
                        <span className="flex items-center gap-1.5">
                          <Calendar size={12} className="opacity-60" /> {r.date}
                        </span>
                      </td>
                      <td className="px-5 py-2.5 border-b text-center" style={{ borderColor: C.line }}>
                        <StatusBadge status={r.status} />
                      </td>
                      <td className="px-6 py-2.5 border-b text-right" style={{ borderColor: C.line }}>
                        <div className="flex items-center justify-end gap-3">
                          <button
                            onClick={() => handleViewInspection(r)}
                            disabled={isOpening}
                            className="ll-focus inline-flex items-center gap-1.5 cursor-pointer font-bold text-xs hover:scale-105 transition-transform px-2.5 py-1 rounded border"
                            style={{ color: C.ink, borderColor: C.line, background: "var(--ll-bg-page)" }}
                          >
                            {isOpening ? <Loader2 size={12} className="animate-spin" /> : <Eye size={12} />}
                            View
                          </button>
                          <button
                            onClick={() => handleDownloadPdf(r)}
                            disabled={downloadingPdfCase === cnoKey}
                            className="ll-focus inline-flex items-center gap-1.5 cursor-pointer font-bold text-xs whitespace-nowrap hover:scale-105 transition-transform px-3 py-1.5 rounded border shadow-2xs"
                            style={{ color: "var(--ll-button-primary-color)", background: "var(--ll-button-primary-bg)", borderColor: "transparent" }}
                          >
                            {downloadingPdfCase === cnoKey ? (
                              <>
                                <Loader2 size={12} className="animate-spin" /> Downloading...
                              </>
                            ) : (
                              <>
                                <Download size={12} /> Download PDF
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </Card>
    </motion.div>
  );
}
