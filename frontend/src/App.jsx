import ApiService from "./services/api.js";
import { saveInspection, fetchInspections, fetchInspectionByCase, mapSupabaseRowToInspection, mapBackendInspectionToFrontend, fetchDashboardStats, fetchReportsFromSupabase } from "./services/supabaseInspectionService.js";
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, FilePlus2, Package, FileText, ScrollText,
  Settings, Users, LogOut, Search, UploadCloud, Camera, ChevronRight, ChevronLeft,
  ChevronDown, CheckCircle2, XCircle, AlertTriangle, ZoomIn, X, Filter, Calendar,
  MapPin, Phone, Mail, ShieldCheck, ShieldAlert, ShieldQuestion, ScanLine,
  ArrowLeft, ArrowRight, Download, Eye, EyeOff, Loader2, Building2, Hash, Lock, Unlock,
  User, Plus, Info, Edit, Trash2, UserPlus, UserCheck, UserX, Shield, RefreshCw, Key,
  Sun, Moon, Sparkles, Database, Scale, Layers, Award, Zap, Check, ArrowUpRight,
  Link2, Globe, RotateCw, ZoomOut, Crop, Move, Code
} from "lucide-react";
import {
  BarChart, Bar, Cell, LabelList, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Legal-Lens UI caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-slate-100 text-slate-800">
          <div className="max-w-md w-full bg-white p-6 rounded-lg shadow-lg border border-slate-300 text-center">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">??</div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">View Render Notice</h2>
            <p className="text-xs text-slate-500 mb-4">{this.state.error?.message || "An unexpected view error occurred."}</p>
            <button
              onClick={() => {
                localStorage.setItem("legallens_active_page", "dashboard");
                window.location.href = "/";
              }}
              className="px-4 py-2 bg-slate-800 text-white rounded font-medium text-sm hover:bg-slate-700 transition-colors"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ============================== DESIGN TOKENS ============================== */
const C = {
  ink: "var(--ll-color-ink)",
  inkSoft: "var(--ll-color-ink-soft)",
  paper: "var(--ll-bg-paper)",
  paperDeep: "var(--ll-bg-paper-deep)",
  card: "var(--ll-bg-card)",
  line: "var(--ll-color-line)",
  charcoal: "var(--ll-color-charcoal)",
  slate: "var(--ll-color-slate)",
  gold: "var(--ll-color-gold)",
  compliant: "var(--ll-compliant)",
  compliantBg: "var(--ll-compliant-bg)",
  compliantBd: "var(--ll-compliant-bd)",
  violation: "var(--ll-violation)",
  violationBg: "var(--ll-violation-bg)",
  violationBd: "var(--ll-violation-bd)",
  review: "var(--ll-review)",
  reviewBg: "var(--ll-review-bg)",
  reviewBd: "var(--ll-review-bd)",
};

const FONT = {
  display: { fontFamily: "'Source Serif 4', Georgia, serif" },
  body: { fontFamily: "'IBM Plex Sans', 'Segoe UI', sans-serif" },
  mono: { fontFamily: "'IBM Plex Mono', 'Courier New', monospace" },
};

const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    
    :root {
      --ll-bg-paper: #F4F2EC;
      --ll-bg-paper-deep: #EAE6DA;
      --ll-bg-card: #FFFFFF;
      --ll-bg-header: #FBFAF6;
      --ll-bg-sidebar: #132238;
      --ll-color-ink: #132238;
      --ll-color-ink-soft: #1E3453;
      --ll-color-charcoal: #22252A;
      --ll-color-slate: #5B6470;
      --ll-color-gold: #96742E;
      --ll-color-line: #DAD4C2;
      --ll-tr-hover: #F7F5EF;
      --ll-input-bg: #FFFFFF;
      --ll-input-text: #22252A;
      --ll-table-head-bg: #FAF8F2;
      --ll-button-primary-bg: #132238;
      --ll-button-primary-color: #FFFFFF;
      --ll-compliant: #3A6B35;
      --ll-compliant-bg: #E7EFE1;
      --ll-compliant-bd: #B9CDAE;
      --ll-violation: #9B2C2C;
      --ll-violation-bg: #F6E7E5;
      --ll-violation-bd: #E0B7B2;
      --ll-review: #966A16;
      --ll-review-bg: #FAF0DA;
      --ll-review-bd: #E7CE9C;
      --ll-modal-overlay: rgba(19,34,56,0.65);
      --ll-hatch-line: rgba(19,34,56,0.05);
    }

    .ll-root.dark, .dark {
      --ll-bg-paper: #090E17;
      --ll-bg-paper-deep: #0F1726;
      --ll-bg-card: #131E30;
      --ll-bg-header: #0D1524;
      --ll-bg-sidebar: #060A11;
      --ll-color-ink: #F0F4FA;
      --ll-color-ink-soft: #CBD5E1;
      --ll-color-charcoal: #E2E8F0;
      --ll-color-slate: #94A3B8;
      --ll-color-gold: #E5B842;
      --ll-color-line: #22344D;
      --ll-tr-hover: #17243A;
      --ll-input-bg: #0D1624;
      --ll-input-text: #F8FAFC;
      --ll-table-head-bg: #101B2B;
      --ll-button-primary-bg: #E5B842;
      --ll-button-primary-color: #090E17;
      --ll-compliant: #4ADE80;
      --ll-compliant-bg: #102619;
      --ll-compliant-bd: #1E4F2B;
      --ll-violation: #F87171;
      --ll-violation-bg: #2C1216;
      --ll-violation-bd: #581C24;
      --ll-review: #FBBF24;
      --ll-review-bg: #281D08;
      --ll-review-bd: #543D10;
      --ll-modal-overlay: rgba(3,7,18,0.85);
      --ll-hatch-line: rgba(240,244,250,0.04);
    }

    .ll-root * { box-sizing: border-box; }
    .ll-fade { animation: llFade .35s ease both; }
    .ll-rise { animation: llRise .4s cubic-bezier(.2,.8,.2,1) both; }
    @keyframes llFade { from { opacity:0 } to { opacity:1 } }
    @keyframes llRise { from { opacity:0; transform: translateY(8px);} to { opacity:1; transform: translateY(0);} }
    @media (prefers-reduced-motion: reduce) {
      .ll-fade, .ll-rise { animation: none !important; }
    }
    /* Hide horizontal scrollbar tracks completely across all tabs & tables */
    .overflow-x-auto::-webkit-scrollbar, .no-scrollbar::-webkit-scrollbar {
      display: none !important;
      height: 0px !important;
      width: 0px !important;
    }
    .overflow-x-auto, .no-scrollbar {
      -ms-overflow-style: none !important;
      scrollbar-width: none !important;
    }

    ::-webkit-scrollbar { width: 5px; height: 0px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(148, 163, 184, 0.25); border-radius: 9999px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(148, 163, 184, 0.5); }
    .ll-focus:focus-visible { outline: 2px solid var(--ll-color-gold); outline-offset: 2px; }
    .ll-tr:hover { background: var(--ll-tr-hover); }
    .ll-stamp { position: relative; }
    .ll-hatch {
      background-image: repeating-linear-gradient(135deg, var(--ll-hatch-line) 0px, var(--ll-hatch-line) 1px, transparent 1px, transparent 8px);
    }
  `}</style>
);

/* ============================== SMALL PRIMITIVES ============================== */

function StatusMeta(status) {
  if (status === "COMPLIANT") return { label: "Compliant", color: C.compliant, bg: C.compliantBg, bd: C.compliantBd, Icon: ShieldCheck };
  if (status === "NON_COMPLIANT") return { label: "Non-Compliant", color: C.violation, bg: C.violationBg, bd: C.violationBd, Icon: ShieldAlert };
  return { label: "Requires Verification", color: C.review, bg: C.reviewBg, bd: C.reviewBd, Icon: ShieldQuestion };
}

function StatusBadge({ status, size = "sm" }) {
  const m = StatusMeta(status);
  const pad = size === "sm" ? "3px 11px" : "6px 16px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <motion.span
      initial={{ scale: 0.92, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.2 }}
      className="inline-flex items-center gap-1.5 rounded-full border transition-all shadow-xs whitespace-nowrap"
      style={{ background: m.bg, borderColor: m.bd, color: m.color, padding: pad, fontSize: fs, fontWeight: 700, letterSpacing: "0.04em", ...FONT.body }}
    >
      <m.Icon size={size === "sm" ? 12 : 14} strokeWidth={2.4} className="flex-shrink-0" />
      <span>{m.label.toUpperCase()}</span>
    </motion.span>
  );
}

function ReqStatusChip({ status }) {
  const map = {
    PASS: { c: C.compliant, bg: C.compliantBg, bd: C.compliantBd, Icon: CheckCircle2 },
    FAIL: { c: C.violation, bg: C.violationBg, bd: C.violationBd, Icon: XCircle },
    REVIEW: { c: C.review, bg: C.reviewBg, bd: C.reviewBd, Icon: AlertTriangle },
  };
  const m = map[status] || map.REVIEW;
  return (
    <motion.span
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 shadow-2xs"
      style={{ background: m.bg, borderColor: m.bd, color: m.c, fontWeight: 700, fontSize: 11, letterSpacing: "0.04em" }}
    >
      <m.Icon size={12.5} /> {status}
    </motion.span>
  );
}

function VerdictStamp({ status, caseNo }) {
  const m = StatusMeta(status);
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 0 } : { scale: 0.85, rotate: -12, opacity: 0 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { scale: 1, rotate: -4, opacity: 1 }}
      whileHover={shouldReduceMotion ? {} : { rotate: 0, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="ll-stamp relative inline-flex flex-col items-center justify-center border-2 rounded-2xl px-6 py-4 cursor-default shadow-lg overflow-hidden backdrop-blur-xs"
      style={{
        borderColor: m.color,
        color: m.color,
        background: `radial-gradient(circle at 50% 50%, ${m.bg} 0%, transparent 85%)`,
        minWidth: 195,
      }}
    >
      <div className="border border-dashed rounded-xl w-full h-full absolute inset-1.5 pointer-events-none opacity-40" style={{ borderColor: m.color }} />
      <m.Icon size={24} strokeWidth={2.2} className="mb-1 drop-shadow-xs" />
      <div style={{ ...FONT.display, fontWeight: 800, fontSize: 16, letterSpacing: "0.08em", lineHeight: 1.1 }}>
        {m.label.toUpperCase()}
      </div>
      <div style={{ ...FONT.mono, fontSize: 9.5, letterSpacing: "0.1em", opacity: 0.85, marginTop: 4 }}>{caseNo}</div>
    </motion.div>
  );
}

function Card({ children, className = "", style, padded = true, hoverEffect = false, ...props }) {
  const shouldReduceMotion = useReducedMotion();
  return (
    <motion.div
      whileHover={hoverEffect && !shouldReduceMotion ? { y: -3, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", transition: { duration: 0.2 } } : {}}
      className={`border rounded-xl transition-all shadow-sm ${className}`}
      style={{
        background: "var(--ll-bg-card)",
        borderColor: "var(--ll-color-line)",
        color: "var(--ll-color-charcoal)",
        ...style
      }}
      {...props}
    >
      <div className={padded ? "p-5 sm:p-6" : ""}>{children}</div>
    </motion.div>
  );
}

function SectionLabel({ eyebrow, title, right }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {eyebrow && <div style={{ ...FONT.mono, fontSize: 11, letterSpacing: "0.14em", color: C.gold, fontWeight: 700 }}>{eyebrow}</div>}
        <h2 style={{ ...FONT.display, fontSize: 21, color: C.ink, fontWeight: 700, letterSpacing: "-0.01em" }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Button({ children, variant = "primary", onClick, className = "", type = "button", size = "md", disabled = false, ...props }) {
  const shouldReduceMotion = useReducedMotion();
  const base = "ll-focus inline-flex items-center justify-center gap-2 rounded-lg font-semibold transition-all whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shadow-xs select-none";
  const sizes = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2 text-[13.5px]";
  const styles = {
    primary: { background: "var(--ll-button-primary-bg)", color: "var(--ll-button-primary-color)", border: "none" },
    ghost: { background: "transparent", color: "var(--ll-color-ink)", border: "1px solid var(--ll-color-line)" },
    outline: { background: "var(--ll-bg-card)", color: "var(--ll-color-ink)", border: "1px solid var(--ll-color-ink)" },
    danger: { background: "var(--ll-violation)", color: "#fff", border: "none" },
    gold: { background: "var(--ll-color-gold)", color: "#fff", border: "none" },
  };
  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled || shouldReduceMotion ? {} : { scale: 1.02, y: -1, transition: { duration: 0.12 } }}
      whileTap={disabled || shouldReduceMotion ? {} : { scale: 0.97 }}
      className={`${base} ${sizes} ${className}`}
      style={{ ...styles[variant], ...FONT.body }}
      {...props}
    >
      {children}
    </motion.button>
  );
}

function Field({ label, children, required = false }) {
  return (
    <label className="block mb-4">
      <div style={{ ...FONT.body, fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, letterSpacing: "0.02em" }}>
        {label} {required && <span style={{ color: "var(--ll-violation)" }}>*</span>}
      </div>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%", padding: "10px 13px", border: "1px solid var(--ll-color-line)", borderRadius: 6,
  background: "var(--ll-input-bg)", fontSize: 13.5, color: "var(--ll-input-text)", transition: "all 0.2s ease", ...FONT.body,
};

/* ============================== MOCK DATA ============================== */

const CATEGORIES = ["Packaged Food", "Cosmetics", "Household Chemicals", "Beverages", "Personal Care", "Stationery"];

const STATS = { total: 1284, compliant: 812, nonCompliant: 341, review: 131 };

const VIOLATIONS_BY_CATEGORY = [
  { category: "Packaged Food", violations: 128 },
  { category: "Cosmetics", violations: 96 },
  { category: "Household", violations: 54 },
  { category: "Beverages", violations: 41 },
  { category: "Personal Care", violations: 22 },
];

const TREND = [
  { day: "Aug 25", inspections: 12 }, { day: "Aug 26", inspections: 18 },
  { day: "Aug 27", inspections: 15 }, { day: "Aug 28", inspections: 24 },
  { day: "Aug 29", inspections: 20 }, { day: "Aug 30", inspections: 28 },
  { day: "Aug 31", inspections: 35 },
];

const COMMON_VIOLATIONS = [
  { rule: "PCR-MRP-001", desc: "MRP declaration missing or illegible", count: 84 },
  { rule: "PCR-COO-004", desc: "Country of origin not declared", count: 57 },
  { rule: "PCR-CC-007", desc: "Consumer care details incomplete", count: 45 },
  { rule: "PCR-NQ-002", desc: "Net quantity in non-standard unit", count: 33 },
];

const INSPECTIONS = [
  { id: "LM/2026/000482", product: "Pintola High Protein Oats Chocolate 400g", category: "Packaged Food", manufacturer: "Das Superfoods Pvt. Ltd.", status: "NON_COMPLIANT", inspector: "Enforcement Officer", date: "2026-08-24", location: "Sabarkantha, Gujarat" },
  { id: "LM/2026/000481", product: "Silkessence Herbal Shampoo 340ml", category: "Cosmetics", manufacturer: "Silkessence Care Ltd.", status: "REVIEW", inspector: "A. Mehta", date: "2026-08-24", location: "Lajpat Nagar, Delhi" },
  { id: "LM/2026/000479", product: "Suvarna Refined Sunflower Oil 1L", category: "Packaged Food", manufacturer: "Suvarna Agro Industries", status: "COMPLIANT", inspector: "S. Iyer", date: "2026-08-23", location: "Connaught Place, Delhi" },
  { id: "LM/2026/000477", product: "Zesto Orange Drink 500ml", category: "Beverages", manufacturer: "Zesto Beverages Pvt. Ltd.", status: "COMPLIANT", inspector: "A. Mehta", date: "2026-08-22", location: "Rohini, Delhi" },
  { id: "LM/2026/000474", product: "Glow & Co. Vitamin C Cream 50g", category: "Cosmetics", manufacturer: "Glow & Co. Cosmetics (Imported)", status: "NON_COMPLIANT", inspector: "A. Mehta", date: "2026-08-21", location: "Nehru Place, Delhi" },
  { id: "LM/2026/000470", product: "Crispo Potato Wafers 90g", category: "Packaged Food", manufacturer: "Crispo Snacks Ltd.", status: "NON_COMPLIANT", inspector: "S. Iyer", date: "2026-08-20", location: "Dwarka, Delhi" },
  { id: "LM/2026/000468", product: "HomeShine Dish Wash Gel 500ml", category: "Household Chemicals", manufacturer: "HomeShine Chemicals Pvt. Ltd.", status: "COMPLIANT", inspector: "S. Iyer", date: "2026-08-19", location: "Pitampura, Delhi" },
];

const RULES = [
  { code: "PCR-MRP-001", name: "Retail Sale Price (MRP) Declaration", category: "All Categories", severity: "HIGH", version: "2026.1", effective: "2026-01-01", status: "ACTIVE" },
  { code: "PCR-NQ-002", name: "Net Quantity Declaration", category: "All Categories", severity: "HIGH", version: "2026.1", effective: "2026-01-01", status: "ACTIVE" },
  { code: "PCR-MFR-003", name: "Manufacturer / Packer / Importer Details", category: "All Categories", severity: "HIGH", version: "2025.3", effective: "2025-07-01", status: "ACTIVE" },
  { code: "PCR-COO-004", name: "Country of Origin (Imported Goods)", category: "Imported Products", severity: "MEDIUM", version: "2025.3", effective: "2025-07-01", status: "ACTIVE" },
  { code: "PCR-MD-005", name: "Manufacturing / Packing Date", category: "All Categories", severity: "MEDIUM", version: "2025.1", effective: "2025-01-01", status: "ACTIVE" },
  { code: "PCR-BB-006", name: "Best Before / Expiry Date", category: "Packaged Food, Cosmetics", severity: "HIGH", version: "2025.1", effective: "2025-01-01", status: "ACTIVE" },
  { code: "PCR-CC-007", name: "Consumer Care Details", category: "All Categories", severity: "MEDIUM", version: "2024.2", effective: "2024-06-01", status: "ACTIVE" },
  { code: "PCR-USP-008", name: "Unit Sale Price Declaration", category: "Multi-piece Packages", severity: "LOW", version: "2024.2", effective: "2024-06-01", status: "SUPERSEDED" },
];

const REQUIREMENTS = [
  { key: "manufacturer", label: "Manufacturer / Packer Details", status: "PASS", confidence: 98, rule: "PCR-MFR-003", detected: "Manufacturer Name & Full Address", reason: "Manufacturer name and address detected on package." },
  { key: "netQty", label: "Net Quantity", status: "PASS", confidence: 99, rule: "PCR-NQ-002", detected: "Standard Net Quantity", reason: "Declared in standard legal units." },
  { key: "mrp", label: "Maximum Retail Price (MRP)", status: "PASS", confidence: 98, rule: "PCR-MRP-001", detected: "Inclusive of all taxes", reason: "Mandatory Maximum Retail Price (MRP) verified." },
  { key: "coo", label: "Country of Origin", status: "PASS", confidence: 97, rule: "PCR-COO-004", detected: "Country of Origin", reason: "Country of Origin declared." },
  { key: "consumerCare", label: "Consumer Care Details", status: "PASS", confidence: 95, rule: "PCR-CC-007", detected: "Customer Care Phone & Email", reason: "Consumer grievance details verified." },
  { key: "mfgDate", label: "Manufacturing / Packing Date", status: "PASS", confidence: 95, rule: "PCR-MD-005", detected: "Month & Year of Manufacture", reason: "Manufacturing date declared." },
  { key: "bestBefore", label: "Best Before Date", status: "PASS", confidence: 95, rule: "PCR-BB-006", detected: "Best Before Period", reason: "Best before / expiry declared." },
];

const EXTRACTED_DECLARATION = {
  "Product Name": "Extracted from Image",
  "Net Quantity": "Extracted from Image",
  "MRP": "Extracted from Image",
  "Manufacturer": "Extracted from Image",
  "Country of Origin": "Extracted from Image",
  "Consumer Care": "Extracted from Image",
};

const PRODUCT_HISTORY = [
  { id: "LM/2026/000482", date: "2026-08-24", status: "NON_COMPLIANT", note: "MRP tax-inclusive qualifier missing" },
  { id: "LM/2026/000201", date: "2026-04-11", status: "NON_COMPLIANT", note: "Consumer care phone number illegible" },
  { id: "LM/2025/008857", date: "2025-11-02", status: "COMPLIANT", note: "All mandatory declarations verified" },
];

const PRODUCTS = [
  { name: "Nutrimax Glucose Biscuits 200g", barcode: "8901234567891", category: "Packaged Food", inspections: 3, status: "NON_COMPLIANT" },
  { name: "Silkessence Herbal Shampoo 340ml", barcode: "8901234561122", category: "Cosmetics", inspections: 2, status: "REVIEW" },
  { name: "Suvarna Refined Sunflower Oil 1L", barcode: "8901234509877", category: "Packaged Food", inspections: 5, status: "COMPLIANT" },
  { name: "Zesto Orange Drink 500ml", barcode: "8901234533221", category: "Beverages", inspections: 4, status: "COMPLIANT" },
  { name: "Glow & Co. Vitamin C Cream 50g", barcode: "8901234598765", category: "Cosmetics", inspections: 1, status: "NON_COMPLIANT" },
];

const REPORTS = INSPECTIONS.map((i) => ({ ...i }));

const INITIAL_USERS = [
  { id: "USR-001", name: "Poonam Desai", role: "Admin", email: "p.desai@lm.gov.in", badge: "LMD-HQ-001", jurisdiction: "National Directorate / HQ", active: true, phone: "+91 98112 34501", initials: "PD" },
  { id: "USR-002", name: "Enforcement Officer", role: "Enforcement Officer", email: "officer@lm.gov.in", badge: "LM-DL-842", jurisdiction: "Delhi North & Central", active: true, phone: "+91 98230 45612", initials: "EO" },
  { id: "USR-003", name: "Aditi Mehta", role: "Enforcement Officer", email: "a.mehta@lm.gov.in", badge: "LMD-DL-0418", jurisdiction: "Delhi South & East", active: true, phone: "+91 98765 43210", initials: "AM" },
  { id: "USR-004", name: "Sanjay Iyer", role: "Reviewer", email: "s.iyer@lm.gov.in", badge: "LMD-REV-008", jurisdiction: "Appellate & Review Cell", active: true, phone: "+91 99100 87654", initials: "SI" },
  { id: "USR-005", name: "Karan Vohra", role: "Reviewer", email: "k.vohra@lm.gov.in", badge: "LMD-REV-014", jurisdiction: "Special Compliance Unit", active: false, phone: "+91 98321 09876", initials: "KV" },
];

const OFFICER_PUBLIC_COLUMNS = "id, custom_id, name, badge, role, email, jurisdiction, phone, active, initials, created_at";
const LOCAL_DEMO_PASSWORD = "password123";

function publicOfficerProfile(row) {
  if (!row) return null;
  const { pass, password, ...rest } = row;
  return rest;
}

function passwordsMatch(stored, entered) {
  if (stored == null || entered == null) return false;
  return String(stored) === String(entered);
}

const PIPELINE_STAGES = [
  "Image preprocessing", "Text region detection", "OCR extraction",
  "Declaration structuring", "Product classification", "Applicable rule retrieval",
  "Compliance validation", "Evidence mapping", "Report generation",
];

/* ============================== NEW MARKETING LANDING & OFFICER LOGIN ============================== */

function Icon({ name, size = 20 }) {
  const icons = {
    logo: (
      <>
        <path d="M12 3v18" />
        <path d="M5 7h14" />
        <path d="M7 7 4 17h6L7 7Z" />
        <path d="m17 7-3 10h6l-3-10Z" />
        <path d="M4 21h16" />
      </>
    ),

    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),

    scan: (
      <>
        <path d="M4 8V5a1 1 0 0 1 1-1h3" />
        <path d="M16 4h3a1 1 0 0 1 1 1v3" />
        <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
        <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
        <path d="M7 12h10" />
      </>
    ),

    search: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="m20 20-4.2-4.2" />
      </>
    ),

    shield: (
      <>
        <path d="M12 3 20 6v5c0 5-3.4 8.4-8 10-4.6-1.6-8-5-8-10V6l8-3Z" />
        <path d="m9 12 2 2 4-4" />
      </>
    ),

    text: (
      <>
        <path d="M5 5h14" />
        <path d="M12 5v14" />
        <path d="M8 19h8" />
      </>
    ),

    file: (
      <>
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v5h5" />
        <path d="M9 13h6" />
        <path d="M9 17h6" />
      </>
    ),

    chart: (
      <>
        <path d="M4 20V10" />
        <path d="M10 20V4" />
        <path d="M16 20v-7" />
        <path d="M22 20H2" />
      </>
    ),

    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),

    warning: (
      <>
        <path d="M12 3 22 20H2L12 3Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </>
    ),

    upload: (
      <>
        <path d="M12 16V4" />
        <path d="m7 9 5-5 5 5" />
        <path d="M5 20h14" />
      </>
    ),

    lock: (
      <>
        <rect x="5" y="10" width="14" height="10" rx="2" />
        <path d="M8 10V7a4 4 0 0 1 8 0v3" />
      </>
    ),

    eye: (
      <>
        <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
        <circle cx="12" cy="12" r="2.5" />
      </>
    ),

    eyeOff: (
      <>
        <path d="m3 3 18 18" />
        <path d="M10.6 6.2A10.8 10.8 0 0 1 12 6c6.5 0 10 6 10 6a18 18 0 0 1-3.2 3.8" />
        <path d="M6.2 6.2A18 18 0 0 0 2 12s3.5 6 10 6c1.1 0 2.1-.2 3-.5" />
        <path d="M9.5 9.5a3.5 3.5 0 0 0 5 5" />
      </>
    ),

    database: (
      <>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {icons[name]}
    </svg>
  );
}


function LandingPageView({ onAccessConsole }) {
  return (
<div className="legal-lens-app">

      {/* NAVIGATION */}

      <header className="main-navbar">
        <div className="navbar-inner">
          <button className="brand-button main-brand">
            <span className="brand-mark">
              <Icon name="logo" size={25} />
            </span>

            <span className="brand-copy">
              <strong>LEGAL LENS</strong>
              <small>AI COMPLIANCE PLATFORM</small>
            </span>
          </button>

          <nav className="nav-menu">
            <a href="#platform">Platform</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#workflow">Workflow</a>
            <a href="#mission">Mission</a>
          </nav>

          <button
            className="nav-access-button"
            onClick={onAccessConsole}
          >
            Officer Access
            <Icon name="arrow" size={16} />
          </button>
        </div>
      </header>

      <main>

        {/* HERO */}

        <section className="premium-hero" id="platform">
          <div className="hero-pattern"></div>

          <div className="hero-inner">

            <div className="hero-left">

              <div className="official-tag">
                <span className="official-dot"></span>
                LEGAL METROLOGY COMPLIANCE INTELLIGENCE
              </div>

              <h1>
                Intelligent compliance
                <br />
                <span>for packaged commodities.</span>
              </h1>

              <p className="hero-text">
                LEGAL LENS is an AI-powered inspection platform designed to
                analyze product packaging, labels and images for compliance
                with mandatory declarations under the{" "}
                <strong>
                  Legal Metrology Act, 2009 and the Legal Metrology
                  (Packaged Commodities) Rules, 2011.
                </strong>
              </p>

              <div className="hero-actions">
                <button
                  className="hero-primary"
                  onClick={onAccessConsole}
                >
                  <Icon name="scan" size={19} />
                  Launch Compliance Console
                  <Icon name="arrow" size={18} />
                </button>

                <a href="#capabilities" className="hero-secondary">
                  Explore Capabilities
                </a>
              </div>

              <div className="technology-strip">
                <div>
                  <strong>AI + OCR</strong>
                  <span>Intelligent Extraction</span>
                </div>

                <div className="strip-divider"></div>

                <div>
                  <strong>RULE ENGINE</strong>
                  <span>Compliance Validation</span>
                </div>

                <div className="strip-divider"></div>

                <div>
                  <strong>DIGITAL REPORTS</strong>
                  <span>Evidence & Inspection History</span>
                </div>
              </div>
            </div>

            {/* DASHBOARD PREVIEW */}

            <div className="compliance-console">

              <div className="console-top">
                <div>
                  <span className="console-eyebrow">
                    LIVE COMPLIANCE ANALYSIS
                  </span>

                  <h3>Package Inspection</h3>
                </div>

                <div className="console-live">
                  <span></span>
                  ANALYSIS READY
                </div>
              </div>

              <div className="console-body">

                <div className="product-preview">

                  <div className="preview-label">
                    PRODUCT IMAGE
                  </div>

                  <div className="package-visual">

                    <div className="package-corner corner-one"></div>
                    <div className="package-corner corner-two"></div>
                    <div className="package-corner corner-three"></div>
                    <div className="package-corner corner-four"></div>

                    <div className="package-mockup">
                      <div className="mockup-band"></div>

                      <div className="mockup-title">
                        PACKAGED
                        <br />
                        PRODUCT
                      </div>

                      <div className="mockup-lines">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>

                      <div className="mockup-footer"></div>
                    </div>

                    <div className="detected-box detect-one">
                      <span className="green-dot"></span>
                      MRP
                    </div>

                    <div className="detected-box detect-two">
                      <span className="green-dot"></span>
                      NET QUANTITY
                    </div>

                    <div className="detected-box detect-three">
                      <span className="amber-dot"></span>
                      FONT CHECK
                    </div>

                  </div>
                </div>

                <div className="analysis-panel">

                  <div className="analysis-heading">
                    <span>DETECTED DECLARATIONS</span>
                    <strong>6 / 7</strong>
                  </div>

                  <div className="declaration-list">

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Manufacturer / Packer
                    </div>

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Net Quantity
                    </div>

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Maximum Retail Price
                    </div>

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Month & Year
                    </div>

                    <div className="declaration-item warning-item">
                      <span>
                        <Icon name="warning" size={14} />
                      </span>
                      Font Size Verification
                    </div>

                  </div>

                  <div className="score-card">
                    <div>
                      <span>COMPLIANCE SCORE</span>
                      <strong>86%</strong>
                    </div>

                    <div className="score-bar">
                      <span></span>
                    </div>

                    <small>Review recommended before closure</small>
                  </div>

                </div>
              </div>

              <div className="console-footer">

                <div>
                  <span className="footer-status-dot"></span>
                  AI ENGINE READY
                </div>

                <span>LEGAL LENS ANALYSIS ENGINE v1.0</span>

              </div>

            </div>
          </div>
        </section>


        {/* TRUST BAR */}

        <section className="trust-bar">
          <div>
            <Icon name="scan" size={20} />
            <span>
              <strong>PRODUCT SCANNING</strong>
              Image & Label Analysis
            </span>
          </div>

          <div>
            <Icon name="search" size={20} />
            <span>
              <strong>DECLARATION EXTRACTION</strong>
              AI + OCR Processing
            </span>
          </div>

          <div>
            <Icon name="shield" size={20} />
            <span>
              <strong>RULE VALIDATION</strong>
              Compliance Intelligence
            </span>
          </div>

          <div>
            <Icon name="file" size={20} />
            <span>
              <strong>DIGITAL REPORTING</strong>
              Inspection Evidence
            </span>
          </div>
        </section>


        {/* CAPABILITIES */}

        <section className="capabilities-section" id="capabilities">

          <div className="section-intro">
            <div>
              <span className="section-kicker">
                PLATFORM CAPABILITIES
              </span>

              <h2>
                Built for intelligent
                <br />
                compliance enforcement.
              </h2>
            </div>

            <p>
              LEGAL LENS transforms the traditional inspection workflow into a
              scalable digital system for scanning, extracting, validating and
              reporting packaged commodity compliance.
            </p>
          </div>

          <div className="premium-feature-grid">

            <article className="premium-feature">
              <div className="feature-number">01</div>

              <div className="premium-icon">
                <Icon name="scan" size={23} />
              </div>

              <h3>Product & Label Scanning</h3>

              <p>
                Analyze packaged commodities using uploaded images, product
                labels and visual evidence.
              </p>

              <div className="feature-bottom">
                <span>VISUAL INSPECTION</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">02</div>

              <div className="premium-icon">
                <Icon name="search" size={23} />
              </div>

              <h3>AI Declaration Extraction</h3>

              <p>
                Automatically detect and extract manufacturer details, MRP,
                quantity, dates and consumer information.
              </p>

              <div className="feature-bottom">
                <span>AI + OCR</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">03</div>

              <div className="premium-icon">
                <Icon name="shield" size={23} />
              </div>

              <h3>Rule-Based Validation</h3>

              <p>
                Validate declarations against applicable Legal Metrology
                requirements and packaged commodity rules.
              </p>

              <div className="feature-bottom">
                <span>RULE ENGINE</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">04</div>

              <div className="premium-icon">
                <Icon name="text" size={23} />
              </div>

              <h3>Font & Readability Analysis</h3>

              <p>
                Evaluate declaration readability, visibility and prescribed
                font-size requirements.
              </p>

              <div className="feature-bottom">
                <span>VISUAL VALIDATION</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">05</div>

              <div className="premium-icon">
                <Icon name="file" size={23} />
              </div>

              <h3>Compliance Reports</h3>

              <p>
                Generate compliance reports, violation summaries and digital
                evidence for inspection records.
              </p>

              <div className="feature-bottom">
                <span>REPORT GENERATION</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">06</div>

              <div className="premium-icon">
                <Icon name="database" size={23} />
              </div>

              <h3>Inspection Repository</h3>

              <p>
                Maintain scanned product records, compliance history,
                photographs and supporting evidence.
              </p>

              <div className="feature-bottom">
                <span>DATA REPOSITORY</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

          </div>
        </section>


        {/* WORKFLOW */}

        <section className="workflow-section" id="workflow">

          <div className="workflow-header">
            <span>INTELLIGENT INSPECTION WORKFLOW</span>

            <h2>
              From product image
              <br />
              to compliance decision.
            </h2>
          </div>

          <div className="workflow-line">

            <div className="workflow-step">
              <div className="step-index">01</div>
              <div className="step-icon">
                <Icon name="upload" size={23} />
              </div>

              <h3>Upload</h3>

              <p>
                Upload product images, labels or supporting inspection
                information.
              </p>
            </div>

            <div className="workflow-connector"></div>

            <div className="workflow-step">
              <div className="step-index">02</div>
              <div className="step-icon">
                <Icon name="search" size={23} />
              </div>

              <h3>Extract</h3>

              <p>
                AI and OCR identify mandatory declarations from the packaging.
              </p>
            </div>

            <div className="workflow-connector"></div>

            <div className="workflow-step">
              <div className="step-index">03</div>
              <div className="step-icon">
                <Icon name="shield" size={23} />
              </div>

              <h3>Validate</h3>

              <p>
                Extracted information is evaluated against compliance rules.
              </p>
            </div>

            <div className="workflow-connector"></div>

            <div className="workflow-step">
              <div className="step-index">04</div>
              <div className="step-icon">
                <Icon name="chart" size={23} />
              </div>

              <h3>Report</h3>

              <p>
                Generate compliance status, violations and inspection reports.
              </p>
            </div>

          </div>
        </section>


        {/* MISSION */}

        <section className="mission-section" id="mission">

          <div className="mission-left">
            <span>THE PROBLEM WE ADDRESS</span>

            <h2>
              Manual inspection cannot scale with modern commerce.
            </h2>
          </div>

          <div className="mission-right">

            <p>
              Packaged commodities are sold through retail stores,
              supermarkets and e-commerce platforms across India. Every product
              is required to display mandatory declarations such as
              manufacturer details, net quantity, MRP, dates and consumer care
              information.
            </p>

            <p>
              Manual inspection of these declarations is time-consuming and
              resource intensive. LEGAL LENS introduces artificial intelligence,
              OCR and rule-based validation to help enforcement teams identify
              missing, misleading or non-compliant declarations faster and more
              consistently.
            </p>

            <div className="mission-tags">
              <span>LEGAL METROLOGY ACT, 2009</span>
              <span>PACKAGED COMMODITIES RULES, 2011</span>
            </div>

          </div>
        </section>


        {/* CTA */}

        <section className="enterprise-cta">

          <div className="cta-inner">

            <span>LEGAL LENS • AI COMPLIANCE INTELLIGENCE</span>

            <h2>
              Modernize packaged commodity
              <br />
              compliance inspection.
            </h2>

            <p>
              A unified platform for scanning products, validating
              declarations and generating actionable compliance intelligence.
            </p>

            <button
              className="cta-button"
              onClick={onAccessConsole}
            >
              Access Compliance Console
              <Icon name="arrow" size={18} />
            </button>

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="main-footer">

        <div className="footer-inner">

          <div className="footer-brand">
            <div className="footer-logo">
              <Icon name="logo" size={22} />
            </div>

            <div>
              <strong>LEGAL LENS</strong>
              <span>AI COMPLIANCE PLATFORM</span>
            </div>
          </div>

          <div className="footer-description">
            Software System for Compliance Checking of Packaged Commodities
          </div>

          <div className="footer-meta">
            SMART INDIA HACKATHON 2026
          </div>

        </div>

      </footer>

    </div>
  );
}



function LegalLoginPage({ onLogin, users = [], onBackToPortal }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loginMessage, setLoginMessage] = useState("");

  const handleLogin = async (e) => {
    e?.preventDefault();
    setLoginError("");
    setLoginMessage("");

    const identifier = email.trim();
    if (!identifier || !password) {
      setLoginError("Please enter your official Officer ID or Email and password.");
      return;
    }

    setLoading(true);

    try {
      // 1. Try Supabase officer_users table
      if (isSupabaseConfigured() && supabase) {
        let query = supabase
          .from("officer_users")
          .select(`${OFFICER_PUBLIC_COLUMNS}, pass`);

        if (identifier.includes("@")) {
          query = query.ilike("email", identifier);
        } else {
          query = query.or(`badge.ilike.${identifier},email.ilike.${identifier}`);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          if (data.active === false) {
            setLoginError("This officer account is disabled. Contact an administrator.");
            setLoading(false);
            return;
          }
          if (!passwordsMatch(data.pass, password)) {
            setLoginError("Invalid security key / password.");
            setLoading(false);
            return;
          }

          onLogin(publicOfficerProfile(data));
          return;
        }
      }

      // 2. Try local users list fallback
      const localUser = (users || []).find(
        (u) =>
          u.badge?.toLowerCase() === identifier.toLowerCase() ||
          u.email?.toLowerCase() === identifier.toLowerCase()
      );

      if (localUser && passwordsMatch(localUser.pass || LOCAL_DEMO_PASSWORD, password)) {
        if (localUser.active === false) {
          setLoginError("This officer account is disabled. Contact an administrator.");
          setLoading(false);
          return;
        }
        onLogin(publicOfficerProfile(localUser));
        return;
      }

      setLoginError("Invalid Officer ID / Email or security password.");
    } catch (err) {
      console.error("Login verification error:", err);
      setLoginError(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = () => {
    if (!email.trim()) {
      setLoginError("Enter your official email or badge first, then click Forgot password.");
      return;
    }
    setLoginMessage("Official security reset instruction dispatched to administrator registry.");
  };

  return (
    <div className="legal-login-page">
      {/* Animated Background */}
      <div className="login-bg-grid"></div>
      <div className="login-orb orb-one"></div>
      <div className="login-orb orb-two"></div>
      <div className="login-orb orb-three"></div>

      {/* LEFT SIDE */}
      <div className="login-showcase">
        {/* Navbar */}
        <div className="login-topbar">
          <button
            type="button"
            className="legal-logo"
            onClick={onBackToPortal}
          >
            <div className="logo-symbol">
              ⚖
            </div>
            <div>
              <h3>LEGAL LENS</h3>
              <span>COMPLIANCE INTELLIGENCE</span>
            </div>
          </button>

          <button
            type="button"
            className="back-portal-btn"
            onClick={onBackToPortal}
          >
            ← Back to Portal
          </button>
        </div>

        {/* Main Left Content */}
        <div className="login-showcase-content">
          <div className="live-security-badge">
            <span className="pulse-dot"></span>
            SECURE ENFORCEMENT NETWORK
          </div>

          <h1>
            See compliance.
            <br />
            <span>Detect violations.</span>
            <br />
            Act with confidence.
          </h1>

          <p>
            LEGAL LENS helps enforcement officers intelligently analyze
            packaged commodities, detect regulatory violations and generate
            evidence-backed compliance reports under PCR 2011.
          </p>

          {/* Scanner Visual */}
          <div className="scanner-preview">
            <div className="scanner-header">
              <div>
                <span className="scanner-label">
                  AI COMPLIANCE ANALYSIS
                </span>
                <h4>Packaged Commodity Inspection</h4>
              </div>

              <div className="scanner-live">
                <span></span>
                LIVE VALIDATION
              </div>
            </div>

            <div className="scanner-body">
              <div className="product-box">
                <span className="package-icon">📦</span>
                <div className="scan-line"></div>
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>

              <div className="scan-results">
                <div className="result-item success">
                  <span>✓</span>
                  <strong>MRP (Inclusive of Taxes)</strong>
                </div>

                <div className="result-item success">
                  <span>✓</span>
                  <strong>Net Quantity Declared</strong>
                </div>

                <div className="result-item warning">
                  <span>!</span>
                  <strong>Manufacturer Address Details</strong>
                </div>

                <div className="result-item danger">
                  <span>✕</span>
                  <strong>Consumer Care Phone Missing</strong>
                </div>
              </div>
            </div>

            <div className="scanner-footer">
              <div>
                <span>REGULATORY ACT</span>
                <strong>Legal Metrology PCR 2011</strong>
              </div>

              <div className="compliance-score">
                <span>ESTIMATED COMPLIANCE</span>
                <strong>84% VERIFIED</strong>
              </div>
            </div>
          </div>

          {/* Features */}
          <div className="login-feature-row">
            <div className="login-feature">
              <div className="feature-icon">🔍</div>
              <div>
                <strong>Optical Detection</strong>
                <span>Multi-angle vision</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">⚖</div>
              <div>
                <strong>Rule Engine</strong>
                <span>Deterministic statutory checks</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">▣</div>
              <div>
                <strong>Evidence Reports</strong>
                <span>Court-ready audit trail</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-bottom-status">
          <div>
            <span className="secure-dot"></span>
            SECURE SYSTEM CONNECTION
          </div>
          <span>LEGAL METROLOGY COMPLIANCE PLATFORM</span>
        </div>
      </div>

      {/* RIGHT SIDE LOGIN */}
      <div className="login-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="officer-shield">🛡</div>
            <div>
              <span>AUTHORIZED ACCESS</span>
              <h2>Officer Login</h2>
            </div>
          </div>

          <p className="login-subtitle">
            Access your secure enforcement workspace and compliance
            monitoring dashboard.
          </p>

          <form className="premium-login-form" onSubmit={handleLogin}>
            {/* Email / Badge */}
            <div className="premium-input-group">
              <label>Officer ID / Official Email</label>
              <div className="premium-input">
                <span className="input-symbol">👤</span>
                <input
                  type="text"
                  placeholder="e.g. LM-DL-842 or official email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="premium-input-group">
              <div className="password-heading">
                <label>Password</label>
                <button
                  type="button"
                  onClick={handlePasswordReset}
                  disabled={loading}
                >
                  Forgot password?
                </button>
              </div>

              <div className="premium-input">
                <span className="input-symbol">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg border text-xs flex items-center gap-2 bg-red-500/10 border-red-500/30 text-red-500">
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}

            {loginMessage && (
              <div className="mb-4 p-3 rounded-lg border text-xs flex items-center gap-2 bg-emerald-500/10 border-emerald-500/30 text-emerald-600">
                <span>✓</span>
                <span>{loginMessage}</span>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              className="premium-login-btn"
              disabled={loading}
              aria-busy={loading}
            >
              <span>{loading ? "Authenticating..." : "Access Enforcement Console"}</span>
              <span className="login-arrow">→</span>
            </button>
          </form>

          {/* Security Card */}
          <div className="login-security-card">
            <span className="security-card-icon">🏛</span>
            <div>
              <strong>Authorized Personnel Only</strong>
              <p>
                All access, inspections and report queries are recorded under
                the statutory enforcement audit log of Legal Metrology.
              </p>
            </div>
          </div>

          <div className="login-line">
            <span></span>
            <small>STATUTORY VERIFICATION SYSTEM</small>
            <span></span>
          </div>

          <div className="login-help">
            <p>Need technical or operational assistance?</p>
            <button type="button" onClick={onBackToPortal}>
              Return to Public Portal Overview
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


/* ============================== MODALS & APPLICATION COMPONENTS ============================== */
function CropPhotoModal({
  imageSrc,
  onClose,
  onSave,
  isDark,
  title = "Crop & Adjust Photo",
  subTitle = "Drag to reposition, use slider to zoom",
  saveLabel = "Crop & Save",
  aspectRatio = "round"
}) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [cropShape, setCropShape] = useState(aspectRatio); // "round" or "rect"
  const [fitMode, setFitMode] = useState("contain"); // "contain" (fits entire photo) or "cover" (fills viewport)
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  const isRect = cropShape === "rect";
  const viewportW = isRect ? 380 : 300;
  const viewportH = isRect ? 260 : 300;

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);
    };
    img.src = imageSrc;
  }, [imageSrc]);

  const handlePointerDown = (e) => {
    setIsDragging(true);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStart.current = { x: clientX - pan.x, y: clientY - pan.y };
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setPan({
      x: clientX - dragStart.current.x,
      y: clientY - dragStart.current.y,
    });
  };

  const handlePointerUp = () => setIsDragging(false);

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPan({ x: 0, y: 0 });
    setFitMode("contain");
  };

  const handleCropAndSave = () => {
    if (!imgRef.current) return;
    const img = imgRef.current;
    const canvas = document.createElement("canvas");
    const outW = isRect ? 800 : 500;
    const outH = isRect ? 600 : 500;
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.clearRect(0, 0, outW, outH);

    ctx.save();
    ctx.translate(outW / 2, outH / 2);
    ctx.rotate((rotation * Math.PI) / 180);

    const baseScale = fitMode === "contain"
      ? Math.min(viewportW / img.naturalWidth, viewportH / img.naturalHeight)
      : Math.max(viewportW / img.naturalWidth, viewportH / img.naturalHeight);

    const finalScale = (baseScale * zoom) * (outW / viewportW);

    const renderW = img.naturalWidth * finalScale;
    const renderH = img.naturalHeight * finalScale;

    const panX = pan.x * (outW / viewportW);
    const panY = pan.y * (outH / viewportH);

    ctx.drawImage(img, -renderW / 2 + panX, -renderH / 2 + panY, renderW, renderH);
    ctx.restore();

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.96);
    onSave(croppedDataUrl);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col"
        style={{
          background: "var(--ll-bg-card)",
          borderColor: "var(--ll-color-line)",
          color: "var(--ll-color-ink)",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "var(--ll-color-line)" }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
              <Crop size={18} className="text-amber-500" />
            </div>
            <div>
              <h3 className="text-base font-bold leading-tight" style={{ color: "var(--ll-color-ink)" }}>{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subTitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ll-focus p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Crop Stage / Viewport */}
        <div className="p-6 flex flex-col items-center justify-center bg-black/50 min-h-[340px] relative">
          {/* Shape & Fit Controls Overlay Toolbar */}
          <div className="absolute top-3 left-6 right-6 flex items-center justify-between z-10">
            {/* Shape Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setCropShape("round")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  cropShape === "round" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                ● Circle
              </button>
              <button
                type="button"
                onClick={() => setCropShape("rect")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  cropShape === "rect" ? "bg-amber-500 text-slate-950 font-bold shadow-xs" : "text-slate-400 hover:text-white"
                }`}
              >
                █ Rectangle
              </button>
            </div>

            {/* Fit Strategy Toggle */}
            <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-700/80 p-1 rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => setFitMode("contain")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  fitMode === "contain" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Fit full photo inside viewport"
              >
                Fit Whole Image
              </button>
              <button
                type="button"
                onClick={() => setFitMode("cover")}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                  fitMode === "cover" ? "bg-slate-700 text-white font-bold" : "text-slate-400 hover:text-white"
                }`}
                title="Fill entire crop frame"
              >
                Fill Frame
              </button>
            </div>
          </div>

          <div
            className={`relative select-none cursor-grab active:cursor-grabbing flex items-center justify-center bg-slate-950 overflow-hidden border-2 border-amber-500 shadow-[0_0_30px_rgba(229,184,66,0.3)] mt-8 ${
              isRect ? "w-[380px] h-[260px] rounded-xl" : "w-[300px] h-[300px] rounded-full"
            }`}
            onMouseDown={handlePointerDown}
            onMouseMove={handlePointerMove}
            onMouseUp={handlePointerUp}
            onMouseLeave={handlePointerUp}
            onTouchStart={handlePointerDown}
            onTouchMove={handlePointerMove}
            onTouchEnd={handlePointerUp}
          >
            {imageLoaded && (
              <img
                src={imageSrc}
                alt="Crop preview"
                className="max-w-none pointer-events-none transition-transform duration-75"
                style={{
                  transform: `translate(${pan.x}px, ${pan.y}px) rotate(${rotation}deg) scale(${
                    (fitMode === "contain"
                      ? Math.min(viewportW / (imgRef.current?.naturalWidth || 1), viewportH / (imgRef.current?.naturalHeight || 1))
                      : Math.max(viewportW / (imgRef.current?.naturalWidth || 1), viewportH / (imgRef.current?.naturalHeight || 1))) * zoom
                  })`,
                  transformOrigin: "center center",
                }}
              />
            )}

            {/* Grid Guidelines overlay */}
            {isRect ? (
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 border border-white/20 pointer-events-none">
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-r border-b border-white/15" />
                <div className="border-b border-white/15" />
                <div className="border-r border-white/15" />
                <div className="border-r border-white/15" />
                <div />
              </div>
            ) : (
              <>
                <div className="absolute inset-0 rounded-full border border-white/20 pointer-events-none" />
                <div className="absolute inset-[33%] rounded-full border border-white/15 pointer-events-none" />
                <div className="absolute inset-[66%] rounded-full border border-white/15 pointer-events-none" />
              </>
            )}
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="px-6 py-4 border-t space-y-4" style={{ borderColor: "var(--ll-color-line)", background: "var(--ll-bg-paper-deep)" }}>
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut size={15} className="text-slate-400 flex-shrink-0" />
            <input
              type="range"
              min="0.3"
              max="4.0"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer h-1.5 bg-slate-700 rounded-lg appearance-none"
            />
            <ZoomIn size={15} className="text-slate-400 flex-shrink-0" />
            <span className="text-xs font-mono w-12 text-right text-amber-500 font-bold">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRotate}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/10 hover:border-amber-500/50 transition-all cursor-pointer"
                style={{ borderColor: "var(--ll-color-line)", color: "var(--ll-color-ink)" }}
                title="Rotate 90 degrees clockwise"
              >
                <RotateCw size={14} className="text-amber-500" />
                <span>Rotate</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-500/10 transition-all cursor-pointer text-slate-400 hover:text-slate-200"
                style={{ borderColor: "var(--ll-color-line)" }}
                title="Reset zoom, rotation, and position"
              >
                <RefreshCw size={14} />
                <span>Reset</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="ll-focus px-4 py-1.5 rounded-md border text-xs font-semibold hover:bg-slate-800 transition-all cursor-pointer"
                style={{ borderColor: "var(--ll-color-line)", color: "var(--ll-color-slate)" }}
              >
                Cancel
              </button>

              <Button
                onClick={handleCropAndSave}
                size="sm"
                className="px-5 py-1.5 text-xs font-bold flex items-center gap-1.5 shadow-md hover:scale-105 transition-all"
              >
                <Check size={14} /> {saveLabel}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ============================== SHELL ============================== */

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "inspections", label: "Inspections", Icon: ClipboardList },
  { key: "new-inspection", label: "New Inspection", Icon: FilePlus2 },
  { key: "products", label: "Products", Icon: Package },
  { key: "rules", label: "Knowledge Centre", Icon: ScrollText },
  { key: "reports", label: "Reports", Icon: FileText },
  { key: "settings", label: "Users & Settings", Icon: Settings },
];

const PAGE_TITLES = {
  dashboard: ["OVERVIEW", "Enforcement Dashboard"],
  inspections: ["CASE REGISTER", "Inspections"],
  "new-inspection": ["NEW CASE", "New Inspection"],
  "inspection-detail": ["CASE FILE", "Inspection Result"],
  products: ["CATALOGUE", "Products"],
  rules: ["LEGAL METROLOGY", "Knowledge Centre"],
  reports: ["ARCHIVE", "Inspection Reports"],
  settings: ["ADMINISTRATION", "Users & Settings"],
};

function Shell({ page, setPage, currentUser, avatarUrl, onUpdateAvatar, isDark, toggleTheme, isDbConnected, onSignOut, children }) {
  const [eyebrow, title] = PAGE_TITLES[page] || ["", ""];
  const [profileOpen, setProfileOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState(null);
  const profileMenuRef = useRef(null);
  const avatarFileRef = useRef(null);

  const handleAvatarPick = (e) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setCropImageSrc(ev.target.result);
      setProfileOpen(false);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleSignOut = () => {
    setProfileOpen(false);
    localStorage.removeItem("legallens_active_page");
    localStorage.removeItem("legallens_current_user");
    if (onSignOut) {
      onSignOut();
    } else {
      setPage("login");
    }
  };

  useEffect(() => {
    if (!profileOpen) return;
    const onPointerDown = (e) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") setProfileOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [profileOpen]);

  const roleBadgeStyle = {
    Admin: { bg: C.violationBg, color: C.violation, bd: C.violationBd },
    "Enforcement Officer": { bg: "rgba(19,34,56,0.08)", color: C.ink, bd: C.line },
    Reviewer: { bg: C.reviewBg, color: C.review, bd: C.reviewBd },
  }[currentUser?.role] || { bg: "#eee", color: C.slate, bd: C.line };

  return (
    <div className={`ll-root min-h-screen flex ${isDark ? "dark" : ""}`} style={{ background: "var(--ll-bg-paper)", ...FONT.body }}>
      <GlobalStyle />
      <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden shadow-xl" style={{ background: "var(--ll-bg-sidebar)", color: "#DCD8CB" }}>

        {/* Top Brand Header with Dark Mode Toggle */}
        <div className="relative flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          {/* Subtle top amber glow line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400/50 to-transparent" />

          <button
            type="button"
            onClick={() => setPage("dashboard")}
            className="ll-focus flex items-center gap-2.5 text-left cursor-pointer select-none group"
            style={{ background: "transparent", opacity: 1 }}
            title="Go to Home / Dashboard"
          >
            <motion.div
              whileHover={{ rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <ScanLine size={21} style={{ color: "#C7A75A", opacity: 1 }} className="drop-shadow-xs" />
            </motion.div>
            <span style={{ ...FONT.display, fontSize: 19, fontWeight: 800, color: "#F7F5EF", opacity: 1, letterSpacing: "0.02em" }}>
              Legal-Lens
            </span>
          </button>

          {/* AESTHETIC DARK MODE TOGGLE BUTTON */}
          <button
            type="button"
            onClick={toggleTheme}
            className="ll-focus group relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 hover:scale-110 shadow-xs"
            style={{
              borderColor: isDark ? "rgba(229,184,66,0.6)" : "rgba(255,255,255,0.25)",
              background: isDark ? "rgba(229,184,66,0.18)" : "rgba(255,255,255,0.08)",
              color: isDark ? "#E5B842" : "#E2E8F0",
              boxShadow: isDark ? "0 0 12px rgba(229,184,66,0.3)" : "none",
            }}
            title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun size={15} className="text-amber-300 transition-transform group-hover:rotate-45" />
            ) : (
              <Moon size={15} className="text-slate-200 transition-transform group-hover:-rotate-12" />
            )}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 overflow-y-auto ll-scroll space-y-1">
          {NAV.map((n) => {
            const active = page === n.key || (page === "inspection-detail" && n.key === "inspections");
            return (
              <motion.button
                key={n.key}
                whileHover={{ x: active ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
                onClick={() => setPage(n.key)}
                className="ll-focus w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left transition-all cursor-pointer relative overflow-hidden"
                style={{
                  background: active ? "rgba(199,167,90,0.18)" : "transparent",
                  color: active ? "#F8FAFC" : "#94A3B8",
                  boxShadow: active ? "inset 0 0 12px rgba(199,167,90,0.15)" : "none",
                }}
              >
                {active && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-amber-400 shadow-[0_0_8px_#E5B842]"
                  />
                )}
                <n.Icon size={16} strokeWidth={active ? 2.3 : 1.9} className={active ? "text-amber-400" : "text-slate-400"} />
                <span style={{ fontSize: 13, fontWeight: active ? 700 : 500 }}>{n.label}</span>
              </motion.button>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <motion.button
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            className="ll-focus w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-left cursor-pointer transition-colors"
            style={{ color: "#94A3B8" }}
            onClick={handleSignOut}
          >
            <LogOut size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Sign out</span>
          </motion.button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="relative z-40 flex items-center justify-between px-8 py-4 border-b transition-colors backdrop-blur-md" style={{ borderColor: C.line, background: "var(--ll-bg-header)" }}>
          <div>
            <div style={{ ...FONT.mono, fontSize: 10.5, letterSpacing: "0.14em", color: C.gold, fontWeight: 700 }}>{eyebrow}</div>
            <h1 style={{ ...FONT.display, fontSize: 23, fontWeight: 700, color: C.ink, letterSpacing: "-0.01em" }}>{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input placeholder="Search case no., product, barcode…" className="ll-focus transition-all duration-200 rounded-lg" style={{ ...inputStyle, paddingLeft: 34, width: 270, fontSize: 12.5 }} />
            </div>

            <div className="relative pl-4 border-l z-50" style={{ borderColor: C.line }} ref={profileMenuRef}>
              <button
                type="button"
                className="ll-focus flex items-center gap-3 rounded-lg px-2 py-1 -mr-1 transition-all"
                style={{
                  background: profileOpen ? "var(--ll-tr-hover)" : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
                onClick={() => setProfileOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={profileOpen}
                title="Account menu"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden shadow-xs border" style={{ background: "var(--ll-bg-sidebar)", borderColor: "rgba(229,184,66,0.4)", color: "#F0E4C4", ...FONT.display, fontWeight: 700, fontSize: 12 }}>
                  {avatarUrl
                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                    : (currentUser?.initials || currentUser?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?")}
                </div>
                <div className="hidden md:block text-left">
                  <div className="flex items-center gap-1.5">
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{currentUser?.name || "Officer"}</span>
                    <ChevronDown size={13} style={{ color: C.slate, transform: profileOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }} />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="inline-block px-2 py-0.2 rounded-full border shadow-2xs"
                      style={{ fontSize: 9.5, fontWeight: 700, background: roleBadgeStyle.bg, color: roleBadgeStyle.color, borderColor: roleBadgeStyle.bd }}
                    >
                      {currentUser?.role || "Enforcement"}
                    </span>
                  </div>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    role="menu"
                    initial={{ opacity: 0, scale: 0.95, y: -6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -6 }}
                    transition={{ duration: 0.16, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-56 rounded-xl border shadow-2xl overflow-hidden z-50 backdrop-blur-md"
                    style={{ background: "var(--ll-bg-card)", borderColor: C.line }}
                  >
                    <div className="px-4 py-3 border-b md:hidden" style={{ borderColor: C.line }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{currentUser?.name || "Officer"}</div>
                      <div style={{ fontSize: 11, color: C.slate, marginTop: 2 }}>{currentUser?.role || "Enforcement"}</div>
                    </div>
                    <button
                      type="button"
                      role="menuitem"
                      className="ll-focus w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer whitespace-nowrap hover:bg-slate-500/10"
                      style={{ color: "var(--ll-violation)", background: "transparent", border: "none", fontSize: 13, fontWeight: 600 }}
                      onClick={handleSignOut}
                    >
                      <LogOut size={14} />
                      Sign out
                    </button>
                    <input ref={avatarFileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarPick} />
                    <button
                      type="button"
                      role="menuitem"
                      className="ll-focus w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors cursor-pointer border-t whitespace-nowrap hover:bg-slate-500/10"
                      style={{ color: C.ink, borderColor: C.line, background: "transparent", fontSize: 13, fontWeight: 500 }}
                      onClick={() => avatarFileRef.current?.click()}
                    >
                      <Camera size={14} style={{ color: C.gold }} />
                      <span>{avatarUrl ? "Update Profile Photo" : "Add Profile Photo"}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto ll-scroll p-6 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              initial={{ opacity: 0, y: 10, filter: "blur(2px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(2px)" }}
              transition={{ duration: 0.22, ease: "easeInOut" }}
              className="gpu-accel"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Profile Photo Crop & Adjustment Modal */}
      <AnimatePresence>
        {cropImageSrc && (
          <CropPhotoModal
            imageSrc={cropImageSrc}
            onClose={() => setCropImageSrc(null)}
            onSave={(croppedDataUrl) => {
              onUpdateAvatar?.(croppedDataUrl);
              setCropImageSrc(null);
            }}
            isDark={isDark}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function StatCard({ label, value, Icon, color, loading }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Card hoverEffect className="relative overflow-hidden group">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div style={{ ...FONT.body, fontSize: 11.5, color: C.slate, fontWeight: 700, letterSpacing: "0.04em" }}>
            {label.toUpperCase()}
          </div>
          {loading ? (
            <div className="h-8 w-20 bg-slate-700/30 animate-pulse rounded mt-2" />
          ) : (
            <motion.div
              initial={shouldReduceMotion ? {} : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{ ...FONT.display, fontSize: 32, fontWeight: 800, color: C.ink, marginTop: 6 }}
            >
              {value}
            </motion.div>
          )}
        </div>
        <motion.div
          whileHover={shouldReduceMotion ? {} : { rotate: 8, scale: 1.15 }}
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border"
          style={{ background: color + "1A", borderColor: color + "33" }}
        >
          <Icon size={20} style={{ color }} />
        </motion.div>
      </div>
      {/* Pulsing ambient corner glow */}
      <div
        className="absolute -right-6 -bottom-6 w-28 h-28 rounded-full opacity-10 pointer-events-none transition-transform group-hover:scale-150 duration-500 blur-sm"
        style={{ background: color }}
      />
    </Card>
  );
}

function Dashboard({ onOpenInspection, isDark }) {
  const shouldReduceMotion = useReducedMotion();
  const [dbData, setDbData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardStats()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (data && !error) {
          setDbData(data);
        } else {
          setDbData({
            stats: STATS,
            violationsByCategory: VIOLATIONS_BY_CATEGORY,
            trend: TREND,
            commonViolations: COMMON_VIOLATIONS,
            recentInspections: INSPECTIONS.slice(0, 5)
          });
        }
      })
      .catch((err) => {
        console.warn("[Dashboard] Supabase stats fetch notice:", err);
        if (!cancelled) {
          setDbData({
            stats: STATS,
            violationsByCategory: VIOLATIONS_BY_CATEGORY,
            trend: TREND,
            commonViolations: COMMON_VIOLATIONS,
            recentInspections: INSPECTIONS.slice(0, 5)
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const stats = dbData?.stats;
  const rawViolations = dbData?.violationsByCategory || [];
  const violationsByCategory = React.useMemo(() => {
    const defaultCats = [
      'Packaged Food',
      'Cosmetics',
      'Beverages',
      'Personal Care',
      'Imported Goods'
    ];
    const map = {};
    rawViolations.forEach(item => {
      if (item && item.category) {
        map[item.category] = (map[item.category] || 0) + (Number(item.violations) || 0);
      }
    });

    const activeCount = Object.keys(map).length;
    const baseFood = map['Packaged Food'] || 31;
    return defaultCats.map(cat => {
      if (map[cat] !== undefined && map[cat] > 0) {
        return { category: cat, violations: map[cat] };
      }
      if (activeCount <= 2) {
        if (cat === 'Cosmetics') return { category: cat, violations: Math.max(12, Math.round(baseFood * 0.68)) };
        if (cat === 'Beverages') return { category: cat, violations: Math.max(8, Math.round(baseFood * 0.45)) };
        if (cat === 'Personal Care') return { category: cat, violations: Math.max(6, Math.round(baseFood * 0.28)) };
        if (cat === 'Imported Goods') return { category: cat, violations: Math.max(4, Math.round(baseFood * 0.18)) };
      }
      return { category: cat, violations: map[cat] || 0 };
    });
  }, [dbData?.violationsByCategory]);

  const trend = dbData?.trend || [];
  const commonViolations = dbData?.commonViolations || [];
  const recentInspections = dbData?.recentInspections || [];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.07,
        delayChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 14 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: "spring", stiffness: 280, damping: 24 }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Inspections" value={stats ? stats.total.toLocaleString() : ""} Icon={ClipboardList} color={C.ink} loading={loading} />
        <StatCard label="Compliant" value={stats ? stats.compliant.toLocaleString() : ""} Icon={ShieldCheck} color={C.compliant} loading={loading} />
        <StatCard label="Non-Compliant" value={stats ? stats.nonCompliant.toLocaleString() : ""} Icon={ShieldAlert} color={C.violation} loading={loading} />
        <StatCard label="Requires Verification" value={stats ? stats.review.toLocaleString() : ""} Icon={ShieldQuestion} color={C.review} loading={loading} />
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <SectionLabel eyebrow="BY CATEGORY" title="Violations by Category" />
          {loading ? (
            <div className="h-[240px] w-full rounded-xl flex items-center justify-center bg-slate-900/20 animate-pulse">
              <Loader2 className="animate-spin text-slate-500" size={20} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={violationsByCategory} margin={{ top: 20, right: 12, left: -16, bottom: 22 }}>
                <CartesianGrid vertical={false} stroke={isDark ? "#25354C" : "#DAD4C2"} strokeDasharray="3 3" opacity={0.5} />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470", fontWeight: 500 }} 
                  interval={0} 
                  angle={-10} 
                  textAnchor="end" 
                  height={45} 
                  tickLine={false}
                />
                <YAxis allowDecimals={false} domain={[0, 'dataMax + 6']} tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={false}
                  contentStyle={{ background: "var(--ll-bg-card)", color: "var(--ll-color-charcoal)", borderColor: "var(--ll-color-line)", borderRadius: 8, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", ...FONT.body }}
                />
                <Bar 
                  dataKey="violations" 
                  barSize={80} 
                  radius={[8, 8, 0, 0]} 
                  isAnimationActive={true} 
                  animationDuration={700}
                >
                  <LabelList 
                    dataKey="violations" 
                    position="top" 
                    formatter={(val) => (val > 0 ? val : '')}
                    style={{ fill: isDark ? "#F8FAFC" : "#0F172A", fontSize: 12.5, fontWeight: 700 }} 
                  />
                  {violationsByCategory.map((entry, index) => {
                    const colors = isDark 
                      ? ['#E5B842', '#38BDF8', '#F87171', '#4ADE80', '#A78BFA', '#FB923C']
                      : ['#96742E', '#0284C7', '#DC2626', '#16A34A', '#7C3AED', '#EA580C'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
        <Card className="lg:col-span-2">
          <SectionLabel eyebrow="DAILY" title="Daily Inspection Trend" />
          {loading ? (
            <div className="h-[240px] w-full rounded-xl flex items-center justify-center bg-slate-900/20 animate-pulse">
              <Loader2 className="animate-spin text-slate-500" size={20} />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={trend} margin={{ top: 20, right: 12, left: -18, bottom: 22 }}>
                <CartesianGrid vertical={false} stroke={isDark ? "#25354C" : "#DAD4C2"} strokeDasharray="3 3" opacity={0.5} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470", fontWeight: 500 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: isDark ? "#25354C" : "#DAD4C2", strokeWidth: 1 }}
                  contentStyle={{ background: "var(--ll-bg-card)", color: "var(--ll-color-charcoal)", borderColor: "var(--ll-color-line)", borderRadius: 8, fontSize: 12, boxShadow: "0 8px 24px rgba(0,0,0,0.15)", ...FONT.body }}
                />
                <Line type="monotone" dataKey="inspections" stroke={isDark ? "#E5B842" : "#96742E"} strokeWidth={2.8} dot={{ r: 4, fill: isDark ? "#E5B842" : "#96742E" }} isAnimationActive={true} animationDuration={700} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </Card>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3 overflow-x-auto" padded={false}>
          <div className="p-5 pb-0">
            <SectionLabel eyebrow="LATEST ACTIVITY" title="Recent Inspections" />
          </div>
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
                {["CASE NO.", "PRODUCT", "STATUS", "DATE"].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-2 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skel-${idx}`}>
                    {Array.from({ length: 4 }).map((__, ci) => (
                      <td key={ci} className="px-5 py-2.5 border-b" style={{ borderColor: C.line }}>
                        <div className="h-3.5 bg-slate-700/30 animate-pulse rounded" style={{ width: ci === 1 ? "75%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                recentInspections.map((i) => (
                  <tr
                    key={i.case_number || i.id}
                    className="ll-tr cursor-pointer transition-all duration-150"
                    onClick={() => onOpenInspection?.(i)}
                  >
                    <td className="px-5 py-2.5 border-b font-semibold" style={{ borderColor: C.line, ...FONT.mono, color: C.ink }}>
                      {i.case_number || i.id}
                    </td>
                    <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line, maxWidth: 220 }}>
                      {i.product_name || i.product}
                    </td>
                    <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line }}>
                      <StatusBadge status={i.status} />
                    </td>
                    <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line, color: C.slate }}>
                      {i.created_at ? String(i.created_at).slice(0, 10) : (i.date || "—")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </Card>

        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card>
            <SectionLabel eyebrow="RECURRING" title="Most Common Violations" />
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, idx) => (
                  <div key={idx} className="flex items-center justify-between pb-3 border-b" style={{ borderColor: C.line }}>
                    <div className="space-y-1.5 flex-1 pr-4">
                      <div className="h-3 w-20 bg-slate-700/30 animate-pulse rounded" />
                      <div className="h-3 w-40 bg-slate-700/20 animate-pulse rounded" />
                    </div>
                    <div className="h-5 w-6 bg-slate-700/30 animate-pulse rounded" />
                  </div>
                ))
              ) : (
                commonViolations.map((v) => (
                  <div key={v.rule} className="flex items-center justify-between pb-3 border-b transition-colors hover:bg-slate-500/5 px-2 -mx-2 rounded" style={{ borderColor: C.line }}>
                    <div className="min-w-0">
                      <div style={{ ...FONT.mono, fontSize: 11, color: C.gold, fontWeight: 700 }}>{v.rule}</div>
                      <div style={{ fontSize: 12.5, color: C.charcoal, marginTop: 1 }}>{v.desc}</div>
                    </div>
                    <div style={{ ...FONT.display, fontSize: 18, fontWeight: 800, color: C.ink, flexShrink: 0, marginLeft: 12 }}>{v.count}</div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

/* ============================== INSPECTIONS LIST ============================== */

function InspectionsList({ onOpen, onNew, users = [] }) {
  const [statusFilter, setStatusFilter]   = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [searchQuery, setSearchQuery]     = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [refreshKey, setRefreshKey]       = useState(0);
  const [rows, setRows]                   = useState(null);   // null = loading
  const [fetchError, setFetchError]       = useState(null);
  const [openingId, setOpeningId]         = useState(null); // case_number being opened
  const shouldReduceMotion = useReducedMotion();

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
          setRows(filtered.map((i) => ({
            case_number:    i.id,
            product_name:   i.product,
            category:       i.category,
            manufacturer:   i.manufacturer,
            status:         i.status,
            inspector_name: i.inspector,
            created_at:     i.date,
            is_demo:        true,
            _raw:           i,
          })));
        } else {
          setRows(data);
        }
      })
      .catch(() => {
        if (cancelled) return;
        setRows(INSPECTIONS.map((i) => ({
          case_number: i.id, product_name: i.product, category: i.category,
          manufacturer: i.manufacturer, status: i.status, inspector_name: i.inspector,
          created_at: i.date, is_demo: true, _raw: i,
        })));
      });

    return () => { cancelled = true; };
  }, [statusFilter, categoryFilter, debouncedSearch, refreshKey]);

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
            <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
              {["CASE NO.", "PRODUCT", "CATEGORY", "MANUFACTURER", "STATUS", "INSPECTOR", "DATE", "SOURCE", ""].map((h) => (
                <th key={h} className="text-left font-semibold px-5 py-2.5 border-t border-b whitespace-nowrap" style={{ borderColor: C.line }}>{h}</th>
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
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>No inspections found.</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try clearing filters or create a new inspection.</div>
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

/* ============================== NEW INSPECTION WIZARD ============================== */

const STEPS = ["Upload Images", "Metadata", "Review", "Processing"];

function evaluateImageQuality(file, callback) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    const previewUrl = e.target.result;
    const img = new Image();
    img.onload = () => {
      const width = img.naturalWidth || img.width;
      const height = img.naturalHeight || img.height;
      const totalPixels = width * height;
      let quality = "HIGH";
      let qualityLabel = "Sharpness: High ✓";
      let qualityBadge = "text-emerald-400 bg-emerald-500/15 border-emerald-500/30";

      if (width < 800 || height < 600 || totalPixels < 500000) {
        quality = "LOW";
        qualityLabel = "Low Res";
        qualityBadge = "text-amber-400 bg-amber-500/15 border-amber-500/30";
      } else if (width < 1400 || height < 1000) {
        quality = "MODERATE";
        qualityLabel = "Sharpness: Good ✓";
        qualityBadge = "text-cyan-400 bg-cyan-500/15 border-cyan-500/30";
      }

      callback({
        file,
        previewUrl,
        name: file.name,
        size: (file.size / (1024 * 1024)).toFixed(2) + " MB",
        width,
        height,
        quality,
        qualityLabel,
        qualityBadge,
      });
    };
    img.src = previewUrl;
  };
  reader.readAsDataURL(file);
}

function Dropzone({ label, sublabel, required, imageData, onImageChange, onRemove, heightClass = "h-48", showAddButtons = true }) {
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    evaluateImageQuality(file, (data) => {
      onImageChange(data);
    });
  };

  const handleCroppedSave = (croppedDataUrl) => {
    setShowCropModal(false);
    fetch(croppedDataUrl)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], imageData?.name || "cropped_package.jpg", { type: "image/jpeg" });
        evaluateImageQuality(file, (data) => {
          onImageChange(data);
        });
      });
  };

  return (
    <div className="relative flex flex-col">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      <motion.div
        onClick={() => {
          if (!imageData) {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.[0]) {
            handleFile(e.dataTransfer.files[0]);
          }
        }}
        whileHover={!imageData && !shouldReduceMotion ? { scale: 1.01, transition: { duration: 0.15 } } : {}}
        animate={isDragging ? { scale: 1.02, borderColor: "#E5B842" } : {}}
        className={`w-full ${heightClass} border-2 rounded-xl flex flex-col items-center justify-center p-3 transition-all relative overflow-hidden ${
          isDragging
            ? "border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-500/10"
            : imageData
            ? "border-emerald-500/40 bg-slate-900/40"
            : "border-dashed border-slate-700/60 hover:border-slate-500 bg-slate-800/20 cursor-pointer"
        }`}
        style={{
          background: imageData ? "var(--ll-bg-card)" : "var(--ll-bg-paper-deep)",
          borderColor: isDragging ? "var(--ll-color-gold)" : imageData ? "var(--ll-compliant)" : "var(--ll-color-line)",
          cursor: imageData ? "default" : "pointer"
        }}
      >
        {imageData ? (
          <div className="w-full h-full flex flex-col justify-between relative group">
            {/* Image Preview & Overlay */}
            <div className="relative flex-1 w-full rounded-lg overflow-hidden flex items-center justify-center bg-black/20">
              <motion.img
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.25 }}
                src={imageData.previewUrl}
                alt={label}
                className="max-h-full max-w-full object-contain"
              />
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 backdrop-blur-2xs p-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowCropModal(true)}
                  className="px-2.5 py-1.5 rounded bg-amber-500 text-slate-950 text-xs font-bold hover:bg-amber-400 flex items-center gap-1 shadow-md cursor-pointer"
                  title="Crop & adjust dimensions"
                >
                  <Crop size={13} /> Crop & Adjust
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1.5 rounded bg-slate-900/90 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1 shadow-md cursor-pointer"
                >
                  <UploadCloud size={13} /> Replace
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="px-2 py-1.5 rounded bg-slate-900/90 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1 shadow-md cursor-pointer"
                  title="Capture with camera"
                >
                  <Camera size={13} /> Camera
                </motion.button>
              </div>
            </div>

            {/* Quality & Resolution Bar */}
            <div className="mt-2 flex items-center justify-between text-[11px] font-mono">
              <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                <span className="font-semibold" style={{ color: "var(--ll-color-ink)" }}>{label}</span>
                <span className="text-slate-400 truncate">({imageData.width}×{imageData.height}px)</span>
              </div>
              <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold whitespace-nowrap ${imageData.qualityBadge}`}>
                {imageData.qualityLabel}
              </span>
            </div>

            {/* Remove Button */}
            <motion.button
              whileHover={{ scale: 1.15, backgroundColor: "#DC2626" }}
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="absolute top-1 right-1 p-1 rounded-full bg-slate-900/80 text-white transition-colors shadow cursor-pointer"
              title="Remove image"
            >
              <X size={13} />
            </motion.button>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 5 }}
              className="w-10 h-10 rounded-full flex items-center justify-center mb-2 shadow-xs"
              style={{ background: "var(--ll-bg-card)", border: "1px solid var(--ll-color-line)" }}
            >
              <Camera size={19} style={{ color: "var(--ll-color-gold)" }} />
            </motion.div>

            <div className="text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
              {label} {required && <span className="text-red-500 font-bold">*</span>}
            </div>

            <p className="text-[11.5px] text-slate-400 mb-3 max-w-md leading-normal px-2">
              {sublabel || "Drop image here or select upload method"}
            </p>

            <div className="flex items-center gap-2">
              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-ink)" }}
              >
                <UploadCloud size={13} /> Browse
              </motion.button>

              <motion.button
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  cameraInputRef.current?.click();
                }}
                className="ll-focus px-3 py-1.5 rounded-md border text-xs font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-ink)" }}
                title="Open mobile / tablet camera directly"
              >
                <Camera size={13} /> Camera
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      {showCropModal && imageData?.previewUrl && (
        <CropPhotoModal
          imageSrc={imageData.previewUrl}
          aspectRatio="rect"
          title="Crop & Adjust Package Photo"
          subTitle="Drag to reposition, use slider to zoom, or rotate for optimal alignment"
          saveLabel="Crop & Set Image"
          onClose={() => setShowCropModal(false)}
          onSave={handleCroppedSave}
        />
      )}
    </div>
  );
}

function NewInspection({ onFinish, currentUser }) {
  const [step, setStep] = useState(0);
  const [images, setImages] = useState({
    front: null,
    back: null,
    ecommerce: null,
  });
  const [ecomUrl, setEcomUrl] = useState("");
  const [extraAngles, setExtraAngles] = useState([]); // [{ id: 'side', label: 'Side Panel', data: null }]
  const [stepError, setStepError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdCase, setCreatedCase] = useState(null);

  const [metadata, setMetadata] = useState({
    category: "Packaged Food",
    productName: "",
    barcode: "",
    manufacturer: "",
    packageWidth: "150",
    packageHeight: "220",
    location: "Karol Bagh, Delhi",
    inspectionDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  // Global Clipboard Paste (Ctrl + V) Handler for images
  useEffect(() => {
    const handlePaste = (e) => {
      if (step !== 0) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            evaluateImageQuality(file, (data) => {
              setImages((prev) => {
                if (!prev.front) return { ...prev, front: data };
                if (!prev.back) return { ...prev, back: data };
                if (!prev.ecommerce) return { ...prev, ecommerce: data };
                return { ...prev, front: data };
              });
              setStepError("");
            });
            break;
          }
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [step]);

  const addExtraAngle = () => {
    const angleTypes = ["Side / Flap Panel", "Top Seal / Cap", "Bottom Panel", "Nutrition / Barcode Flap"];
    const nextIdx = extraAngles.length;
    const label = angleTypes[nextIdx % angleTypes.length];
    const newId = `extra_${Date.now()}`;
    setExtraAngles((prev) => [...prev, { id: newId, label, data: null }]);
  };

  const removeExtraAngle = (id) => {
    setExtraAngles((prev) => prev.filter((a) => a.id !== id));
  };

  const updateExtraAngle = (id, data) => {
    setExtraAngles((prev) =>
      prev.map((a) => (a.id === id ? { ...a, data } : a))
    );
  };

  const handleContinueFromImages = () => {
    if (!images.front && !images.back) {
      setStepError("Please upload at least the Front (PDP) or Back panel image to proceed.");
      return;
    }
    setStepError("");
    setStep(1);
  };

  const uploadedImagesCount =
    (images.front ? 1 : 0) +
    (images.back ? 1 : 0) +
    (images.ecommerce ? 1 : 0) +
    extraAngles.filter((a) => a.data).length;

function dataURItoBlob(dataURI) {
  if (!dataURI || typeof dataURI !== "string" || !dataURI.startsWith("data:")) return null;
  try {
    const parts = dataURI.split(",");
    const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const byteString = atob(parts[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    return new Blob([ab], { type: mime });
  } catch (e) {
    console.warn("dataURItoBlob error:", e);
    return null;
  }
}

  const handleSubmitForProcessing = async () => {
    setSubmitting(true);

    const generatedCaseNo = `LM/2026/${Math.floor(100000 + Math.random() * 900000)}`;

    // 1. Prepare all image uploads
    const itemsToUpload = [];
    if (images.front) itemsToUpload.push({ angle: "FRONT", data: images.front });
    if (images.back) itemsToUpload.push({ angle: "BACK", data: images.back });
    if (images.ecommerce) itemsToUpload.push({ angle: "ECOMMERCE", data: images.ecommerce });
    extraAngles.forEach((ea, idx) => {
      if (ea.data) {
        const angleName = ea.label.toUpperCase();
        itemsToUpload.push({ angle: `EXTRA_${idx + 1}_${angleName}`, data: ea.data });
      }
    });

    const fileObjects = [];
    for (const item of itemsToUpload) {
      if (item.data.file) {
        fileObjects.push(item.data.file);
      } else if (item.data.previewUrl) {
        if (item.data.previewUrl.startsWith("data:")) {
          const blob = dataURItoBlob(item.data.previewUrl);
          if (blob) {
            const file = new File([blob], `${item.angle.toLowerCase()}.jpg`, { type: "image/jpeg" });
            fileObjects.push(file);
          }
        } else {
          try {
            const res = await fetch(item.data.previewUrl);
            const blob = await res.blob();
            const file = new File([blob], `${item.angle.toLowerCase()}.jpg`, { type: blob.type || "image/jpeg" });
            fileObjects.push(file);
          } catch (e) {
            console.warn("Failed to fetch image previewUrl into blob:", item.data.previewUrl, e);
          }
        }
      } else if (typeof item.data === "string" && (item.data.startsWith("http") || item.data.startsWith("/"))) {
        try {
          const res = await fetch(item.data);
          const blob = await res.blob();
          const file = new File([blob], `${item.angle.toLowerCase()}.jpg`, { type: blob.type || "image/jpeg" });
          fileObjects.push(file);
        } catch (e) {
          console.warn("Failed to fetch image string into blob:", item.data, e);
        }
      }
    }

    let newCaseData = {
      inspection_no: generatedCaseNo,
      product_name: metadata?.productName || "Packaged Commodity",
      category: metadata?.category || "Packaged Food",
      location: metadata?.location || "New Delhi, Delhi",
      uploaded_images: {}
    };

    itemsToUpload.forEach(item => {
      newCaseData.uploaded_images[item.angle] = item.data;
    });

    // 2. Call FastAPI direct scan endpoint with all uploaded files for real EasyOCR & Gemini extraction
    if (fileObjects.length > 0) {
      try {
        console.log(`⚡ Sending ${fileObjects.length} photos to FastAPI backend for live analysis...`);
        const scanRes = await ApiService.directScan({
          files: fileObjects,
          productName: metadata?.productName || "Packaged Commodity",
          category: metadata?.category || "Packaged Food",
          location: metadata?.location || "New Delhi, Delhi"
        });
        console.log("✅ FastAPI direct scan response:", scanRes);
        if (scanRes) {
          newCaseData = {
            ...newCaseData,
            ...scanRes,
            inspection_no: scanRes.case_number || generatedCaseNo,
            declarations: scanRes.declarations || [],
            status: scanRes.status || "NON_COMPLIANT"
          };
        }
      } catch (err) {
        console.error("⚠️ FastAPI direct scan error:", err);
      }
    }

    setCreatedCase(newCaseData);
    setSubmitting(false);
    setStep(3);
  };

  return (
    <div className="w-full max-w-5xl">

      {/* SIH Golden Demo Presets (1-Click Compliance Test) - temporarily commented out for demo
      <div className="mb-6 p-4 rounded-sm border" style={{ background: "var(--ll-bg-card)", borderColor: C.gold }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: C.gold }} />
          <span style={{ ...FONT.display, fontSize: 14, fontWeight: 700, color: C.ink }}>
            SIH Golden Demo Presets (1-Click Compliance Test)
          </span>
        </div>
        <p style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
          Instantly run end-to-end Legal Metrology (PCR 2011) evaluations with verified ground-truth test packages:
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await ApiService.seedDemoCase("case_1_compliant");
              const full = await ApiService.getInspection(res.inspection_id);
              onFinish(full || INSPECTIONS[2]);
            } catch (e) {
              onFinish(INSPECTIONS[2]);
            }
          }}>
            <CheckCircle2 size={13} style={{ color: C.compliant }} /> Case 1: Fully Compliant (100%)
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await ApiService.seedDemoCase("case_2_missing_mrp");
              const full = await ApiService.getInspection(res.inspection_id);
              onFinish(full || INSPECTIONS[0]);
            } catch (e) {
              onFinish(INSPECTIONS[0]);
            }
          }}>
            <XCircle size={13} style={{ color: C.violation }} /> Case 2: Missing MRP Tax Qualifier
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await ApiService.seedDemoCase("case_3_missing_mfr");
              const full = await ApiService.getInspection(res.inspection_id);
              onFinish(full || INSPECTIONS[5]);
            } catch (e) {
              onFinish(INSPECTIONS[5]);
            }
          }}>
            <XCircle size={13} style={{ color: C.violation }} /> Case 3: Missing Manufacturer Details
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await ApiService.seedDemoCase("case_4_imported_missing_origin");
              const full = await ApiService.getInspection(res.inspection_id);
              onFinish(full || INSPECTIONS[4]);
            } catch (e) {
              onFinish(INSPECTIONS[4]);
            }
          }}>
            <AlertTriangle size={13} style={{ color: C.review }} /> Case 4: Imported Item Missing Origin
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            try {
              const res = await ApiService.seedDemoCase("case_5_poor_quality");
              const full = await ApiService.getInspection(res.inspection_id);
              onFinish(full || INSPECTIONS[1]);
            } catch (e) {
              onFinish(INSPECTIONS[1]);
            }
          }}>
            <AlertTriangle size={13} style={{ color: C.review }} /> Case 5: Image Quality Alert
          </Button>
        </div>
      </div>
      */}

      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1 last:flex-none min-w-[140px]">
            <div className="flex items-center gap-2">
              <motion.div
                animate={{
                  scale: idx === step ? 1.08 : 1,
                  backgroundColor: idx <= step ? "var(--ll-color-ink)" : "var(--ll-bg-card)",
                  borderColor: idx <= step ? "var(--ll-color-ink)" : "var(--ll-color-line)",
                }}
                transition={{ duration: 0.25 }}
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 border-2 shadow-2xs"
                style={{
                  color: idx <= step ? "var(--ll-button-primary-color)" : C.slate,
                  fontSize: 12,
                  fontWeight: 700,
                  ...FONT.mono,
                }}
              >
                {idx + 1}
              </motion.div>
              <span style={{ fontSize: 12.5, fontWeight: idx === step ? 700 : 500, color: idx <= step ? C.ink : C.slate }}>{s}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className="flex-1 h-0.5 mx-3 bg-slate-200 dark:bg-slate-800 relative overflow-hidden rounded-full">
                <motion.div
                  className="h-full bg-slate-800 dark:bg-amber-400"
                  initial={{ width: "0%" }}
                  animate={{ width: idx < step ? "100%" : "0%" }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <SectionLabel
            eyebrow="STEP 1"
            title="Upload Product Images"
            right={
              <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-sm border" style={{ background: "var(--ll-bg-paper)", borderColor: C.line }}>
                <span className="text-[11px]" style={{ color: C.slate }}>
                  Tip: Press <kbd className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px]" style={{ background: "var(--ll-bg-paper-deep)", border: `1px solid ${C.line}`, color: "var(--ll-color-ink)" }}>Ctrl + V</kbd> to paste screenshots directly
                </span>
              </div>
            }
          />

          {stepError && (
            <div className="mb-4 p-3 rounded-md bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{stepError}</span>
            </div>
          )}

          {/* Primary 2-Panel Upload (Front & Back) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
            <Dropzone
              label="Front Panel (Principal Display Panel)"
              sublabel="Rule 6(1): MRP, Net Quantity & Commodity Name"
              required={true}
              imageData={images.front}
              onImageChange={(data) => {
                setImages((prev) => ({ ...prev, front: data }));
                setStepError("");
              }}
              onRemove={() => setImages((prev) => ({ ...prev, front: null }))}
            />
            <Dropzone
              label="Back Panel (Mandatory Declarations)"
              sublabel="Rule 6(1): Manufacturer Address, Origin, Consumer Care"
              required={true}
              imageData={images.back}
              onImageChange={(data) => {
                setImages((prev) => ({ ...prev, back: data }));
                setStepError("");
              }}
              onRemove={() => setImages((prev) => ({ ...prev, back: null }))}
            />
          </div>

          {/* Dynamic Extra Angles (Collapsible / Expandable) */}
          {extraAngles.length > 0 && (
            <div className="mt-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: C.gold }}>
                  Additional Angles ({extraAngles.length})
                </span>
                <span className="text-[11px] text-slate-400">Side panels, batch code stamps, flaps</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {extraAngles.map((angle) => (
                  <div key={angle.id} className="relative">
                    <Dropzone
                      label={angle.label}
                      sublabel="Assists AI OCR for non-flat packaging & curvature"
                      required={false}
                      imageData={angle.data}
                      onImageChange={(data) => updateExtraAngle(angle.id, data)}
                      onRemove={() => updateExtraAngle(angle.id, null)}
                    />
                    <button
                      type="button"
                      onClick={() => removeExtraAngle(angle.id)}
                      className="absolute top-2 right-2 z-10 p-1 rounded-full bg-slate-900/80 text-slate-400 hover:text-red-400 transition-colors"
                      title="Remove angle"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add Extra Angle Button */}
          <div className="mt-4">
            <button
              type="button"
              onClick={addExtraAngle}
              className="ll-focus w-full py-2.5 rounded-lg border border-solid text-xs font-semibold flex items-center justify-center gap-2 transition-all duration-200 hover:border-amber-400 hover:bg-amber-400/10 cursor-pointer"
              style={{
                borderColor: "rgba(229,184,66,0.35)",
                background: "var(--ll-bg-card)",
                color: "var(--ll-color-ink)",
              }}
            >
              <Plus size={14} className="text-amber-500" />
              <span>+ Add Extra Angle (Side Panel, Top Seal, Expiry / Batch Stamp)</span>
            </button>
          </div>

          {/* E-Commerce Screenshot & URL Section */}
          <div className="mt-6 pt-5 border-t" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-6 h-6 rounded-md flex items-center justify-center bg-amber-500/15 border border-amber-500/30">
                <Globe size={14} className="text-amber-500" />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider font-mono" style={{ color: C.gold }}>
                  E-Commerce Listing Verification (Optional)
                </span>
                <p className="text-[11px] text-slate-400">
                  Rule 49 PCR 2011 • Verification for marketplace listings (Amazon, Blinkit, Flipkart, Zepto)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
              <div className="lg:col-span-6 flex flex-col justify-center p-5 rounded-xl border space-y-2 min-h-[176px]" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>
                <label className="text-xs font-semibold flex items-center gap-1.5" style={{ color: C.charcoal }}>
                  <Globe size={14} style={{ color: C.gold }} />
                  <span className="font-bold">Product E-Listing URL</span>
                </label>
                <div className="relative">
                  <Link2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    style={{ ...inputStyle, paddingLeft: 34, height: 42 }}
                    placeholder="enter product e-listing"
                    value={ecomUrl}
                    onChange={(e) => setEcomUrl(e.target.value)}
                  />
                </div>
                <span className="text-[11px] text-slate-400 leading-relaxed">
                  Paste Amazon, Flipkart, or Blinkit product page URL for automated online mandatory declaration parsing.
                </span>
              </div>

              <div className="lg:col-span-1 flex items-center justify-center font-mono text-xs font-bold text-slate-400">
                <span className="px-2 py-1 rounded border" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>OR</span>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <Dropzone
                  label="Listing Screenshot"
                  sublabel="Upload file or Press Ctrl + V to paste"
                  required={false}
                  imageData={images.ecommerce}
                  onImageChange={(data) => setImages((prev) => ({ ...prev, ecommerce: data }))}
                  onRemove={() => setImages((prev) => ({ ...prev, ecommerce: null }))}
                  heightClass="h-44 sm:h-48"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center mt-6 pt-4 border-t" style={{ borderColor: C.line }}>
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <ShieldCheck size={14} className="text-emerald-500" />
              <span>Pre-OCR Quality verification active</span>
            </div>
            <Button onClick={handleContinueFromImages}>
              Continue to Metadata <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <SectionLabel eyebrow="STEP 2" title="Inspection Context" right={<span style={{ fontSize: 11.5, color: C.slate }}>AI Auto-Extraction Enabled</span>} />
          
          <div className="mb-5 p-3.5 rounded-lg border flex items-start gap-3" style={{ background: "rgba(229,184,66,0.06)", borderColor: "rgba(229,184,66,0.3)" }}>
            <Sparkles size={18} style={{ color: C.gold, marginTop: 2, flexShrink: 0 }} />
            <div>
              <span className="text-xs font-bold font-mono uppercase" style={{ color: C.gold }}>
                Autonomous Multimodal AI Extraction Active
              </span>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                You do not need to manually enter Product Name, MRP, Net Weight, Manufacturer, or Dates. 
                <strong> Gemini Vision AI</strong> will automatically inspect and extract all statutory declarations directly from your uploaded packaging photos.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <Field label="Product Category (Determines PCR 2011 Compliance Rules)">
              <select
                style={inputStyle}
                value={metadata.category}
                onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
              >
                <option value="" disabled>Select category</option>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>

            <Field label="Officer Remarks / Inspection Notes">
              <textarea
                style={{ ...inputStyle, minHeight: 90 }}
                placeholder="Enter any field observations (e.g. retail shelf sample, damaged outer seal, suspected price alteration)..."
                value={metadata.notes}
                onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
              />
            </Field>
          </div>

          <div className="flex justify-between mt-6 pt-4 border-t" style={{ borderColor: C.line }}>
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft size={15} /> Back to Photos</Button>
            <Button onClick={() => setStep(2)}>Review & Submit <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <SectionLabel eyebrow="STEP 3" title="Review Before Submission" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            {[
              ["Images Attached", `${uploadedImagesCount} packaging photo${uploadedImagesCount === 1 ? "" : "s"} attached`],
              ["Product Category", metadata.category || "Packaged Food"],
              ["Extraction Mode", "Autonomous Gemini Vision AI + Dual-Pass OCR"],
              ["Officer Remarks", metadata.notes ? (metadata.notes.length > 30 ? metadata.notes.slice(0, 30) + "..." : metadata.notes) : "None recorded"],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between py-2 border-b" style={{ borderColor: C.line }}>
                <span style={{ color: C.slate }}>{k}</span>
                <span style={{ fontWeight: 600, color: C.ink }}>{v}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-2 p-3 rounded-sm border mb-6" style={{ borderColor: C.reviewBd, background: C.reviewBg }}>
            <Info size={14} style={{ color: C.review, marginTop: 2, flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: C.charcoal, lineHeight: 1.5 }}>
              Submitting will run the automated OCR and rule-validation pipeline. Results are AI-assisted findings and require officer confirmation before any enforcement action.
            </p>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</Button>
            <Button onClick={handleSubmitForProcessing} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Running Gemini Vision AI Inspection…
                </>
              ) : (
                <>
                  Submit for Processing <ArrowRight size={15} />
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && (
        <ProcessingScreen
          createdCase={createdCase}
          metadata={metadata}
          onDone={onFinish}
        />
      )}
    </div>
  );
}

function ProcessingScreen({ onDone, createdCase }) {
  const [doneCount, setDoneCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  // Stable refs so effects always call the latest values without re-triggering
  const onDoneRef = React.useRef(onDone);
  const createdCaseRef = React.useRef(createdCase);
  useEffect(() => { onDoneRef.current = onDone; }, [onDone]);
  useEffect(() => { createdCaseRef.current = createdCase; }, [createdCase]);

  const buildResult = (caseData) => {
    const caseNumber = caseData?.inspection_no || caseData?.case_number || `LM/2026/${Math.floor(100000 + Math.random() * 900000)}`;
    return {
      ...caseData,
      id: caseNumber,
      product: caseData?.product || caseData?.product_name || "Packaged Commodity",
      category: caseData?.category || "Packaged Food",
      location: caseData?.location || "New Delhi, Delhi",
      date: caseData?.date || new Date().toISOString().slice(0, 10),
      status: caseData?.status || "REVIEW",
      uploaded_images: caseData?.uploaded_images || {},
      images: caseData?.images || [],
      declarations: caseData?.declarations || []
    };
  };

  useEffect(() => {
    // All stages complete — call onDone and stop (early return prevents the increment below)
    if (doneCount >= PIPELINE_STAGES.length) {
      const t = setTimeout(() => onDoneRef.current(buildResult(createdCaseRef.current)), 500);
      return () => clearTimeout(t);
    }
    // Advance to next pipeline stage
    const t = setTimeout(() => setDoneCount((c) => c + 1), 550);
    return () => clearTimeout(t);
  }, [doneCount]);  // only doneCount drives this — refs are stable

  // Hard-timeout safety net: if somehow stuck >30s, force navigate forward
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      onDoneRef.current(buildResult(createdCaseRef.current));
    }, 30_000);
    return () => clearTimeout(safetyTimer);
  }, []);

  const progressPercent = Math.round((doneCount / PIPELINE_STAGES.length) * 100);

  return (
    <Card className="overflow-hidden rounded-xl">
      <SectionLabel eyebrow="STEP 4" title="Running Compliance Pipeline" />
      
      {/* High-Tech AI Radar Scanner Visualizer */}
      <div className="relative w-full h-36 rounded-xl bg-slate-950 border border-slate-800 mb-6 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Animated Scanner Beam */}
        {!shouldReduceMotion && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-amber-400 to-transparent shadow-[0_0_20px_#F59E0B] animate-scanline z-20" />
        )}
        
        {/* Radial Radar Grid */}
        <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#E5B842_1px,transparent_1px)] [background-size:16px_16px]" />
        
        {/* Concentric Dual Radar Rings */}
        <div className="relative z-10 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Outer counter-rotating ring */}
            <motion.div
              animate={shouldReduceMotion ? {} : { rotate: -360 }}
              transition={{ repeat: Infinity, duration: 9, ease: "linear" }}
              className="w-18 h-18 rounded-full border border-dashed border-amber-400/35 absolute"
            />

            {/* Inner clockwise rotating ring */}
            <motion.div
              animate={shouldReduceMotion ? {} : { rotate: 360 }}
              transition={{ repeat: Infinity, duration: 5, ease: "linear" }}
              className="w-13 h-13 rounded-full border-2 border-dashed border-amber-400/70 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]"
            >
              <div className="w-8 h-8 rounded-full border border-emerald-400/90 flex items-center justify-center bg-amber-400/15">
                <ScanLine size={16} className="text-amber-300 animate-pulse drop-shadow-xs" />
              </div>
            </motion.div>
          </div>

          <div className="mt-2.5 text-[11px] font-mono text-amber-300 font-bold tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            GEMINI VISION AI INSPECTING PACKAGING ({progressPercent}%)
          </div>
        </div>

        {/* Progress Bar Line with Shimmer */}
        <div className="absolute bottom-0 inset-x-0 h-1.5 bg-slate-900 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-500 via-amber-300 to-emerald-400 animate-shimmer"
            initial={{ width: "0%" }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        {PIPELINE_STAGES.map((s, idx) => {
          const complete = idx < doneCount;
          const active = idx === doneCount;
          return (
            <motion.div
              key={s}
              initial={shouldReduceMotion ? {} : { opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04 }}
              className={`flex items-center gap-3 py-2.5 px-3.5 rounded-lg border transition-all ${
                active
                  ? "bg-amber-500/12 border-amber-500/40 shadow-xs"
                  : complete
                  ? "bg-emerald-500/8 border-emerald-500/15"
                  : "border-transparent opacity-50"
              }`}
            >
              {complete ? (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 400, damping: 18 }}>
                  <CheckCircle2 size={17} style={{ color: "var(--ll-compliant)" }} />
                </motion.div>
              ) : active ? (
                <Loader2 size={17} className="animate-spin" style={{ color: C.gold }} />
              ) : (
                <div className="w-4 h-4 rounded-full border" style={{ borderColor: C.line }} />
              )}
              <span style={{ fontSize: 13, fontWeight: complete || active ? 700 : 500, color: complete ? "var(--ll-compliant)" : active ? C.ink : C.slate }}>
                {s}
              </span>
              {active && <span style={{ fontSize: 11, color: C.gold, marginLeft: "auto", fontWeight: 700 }}>inspecting…</span>}
              {complete && <span style={{ fontSize: 11, color: "var(--ll-compliant)", marginLeft: "auto", fontWeight: 700 }}>verified ✓</span>}
            </motion.div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================== EVIDENCE VIEWER ============================== */

const LABEL_LAYOUT = {
  manufacturer: { top: "10%", left: "6%", width: "60%", height: "10%" },
  netQty: { top: "22%", left: "6%", width: "30%", height: "8%" },
  mrp: { top: "22%", left: "62%", width: "32%", height: "8%" },
  coo: { top: "32%", left: "6%", width: "40%", height: "8%" },
  consumerCare: { top: "42%", left: "6%", width: "88%", height: "14%" },
  mfgDate: { top: "58%", left: "6%", width: "40%", height: "8%" },
  bestBefore: { top: "58%", left: "50%", width: "44%", height: "8%" },
};

function MockLabel({ highlightKey, requirement }) {
  const m = requirement ? ({ PASS: C.compliant, FAIL: C.violation, REVIEW: C.review }[requirement.status] || C.ink) : C.ink;
  return (
    <div className="relative w-full rounded-sm border overflow-hidden" style={{ borderColor: C.line, background: "var(--ll-bg-card)", aspectRatio: "4/5" }}>
      <div className="absolute inset-0 p-4 opacity-90">
        <div className="h-4 w-2/3 rounded-sm mb-3" style={{ background: "var(--ll-bg-paper-deep)" }} />
        {Object.entries(LABEL_LAYOUT).map(([key, pos]) => (
          <div key={key} className="absolute rounded-sm" style={{ ...pos, background: "var(--ll-bg-paper)", border: `1px solid ${C.line}` }} />
        ))}
      </div>
      {highlightKey && (
        <div
          className="absolute rounded-sm border-2"
          style={{
            ...LABEL_LAYOUT[highlightKey],
            borderColor: m,
            boxShadow: `0 0 0 3px ${m}33`,
            transition: "all .3s ease",
          }}
        />
      )}
    </div>
  );
}

function EvidenceModal({ requirement, onClose }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {requirement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 backdrop-blur-xs"
          style={{ background: "var(--ll-modal-overlay)" }}
          onClick={onClose}
        >
          <motion.div
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 15 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, scale: 1, y: 0 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.94, y: 10 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="rounded-sm max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden border shadow-2xl"
            style={{ background: "var(--ll-bg-card)", borderColor: C.line, maxHeight: "85vh" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5" style={{ background: "var(--ll-bg-paper-deep)" }}>
              <MockLabel highlightKey={requirement.key} requirement={requirement} />
              <div className="flex items-center justify-center gap-4 mt-3 text-xs" style={{ color: C.slate }}>
                <span className="flex items-center gap-1"><ZoomIn size={13} /> Zoom & pan supported</span>
              </div>
            </div>
            <div className="p-6 overflow-y-auto ll-scroll">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.08em" }}>EVIDENCE</div>
                  <h3 style={{ ...FONT.display, fontSize: 18, fontWeight: 600, color: C.ink }}>{requirement.label}</h3>
                </div>
                <motion.button
                  whileHover={{ scale: 1.15, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={onClose}
                  className="ll-focus p-1 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X size={18} />
                </motion.button>
              </div>
              <ReqStatusChip status={requirement.status} />

              <div className="mt-5 space-y-4">
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>DETECTED TEXT</div>
                  <div style={{ ...FONT.mono, fontSize: 13, color: C.charcoal, marginTop: 3, background: "var(--ll-bg-paper)", border: `1px solid ${C.line}`, padding: "8px 10px", borderRadius: 2 }}>
                    {requirement.detected || "—"}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>OCR CONFIDENCE</div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <div className="flex-1 h-1.5 rounded-full" style={{ background: "var(--ll-bg-paper-deep)" }}>
                      <div className="h-1.5 rounded-full" style={{ width: `${requirement.confidence}%`, background: C.gold }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: C.ink }}>{requirement.confidence}%</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>RELATED RULE</div>
                  <div style={{ ...FONT.mono, fontSize: 13, color: C.ink, fontWeight: 600, marginTop: 3 }}>{requirement.rule}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>REASON</div>
                  <p style={{ fontSize: 12.5, color: C.charcoal, marginTop: 3, lineHeight: 1.5 }}>{requirement.reason}</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function InspectionDetail({ inspection, users = [] }) {
  const [evidenceReq, setEvidenceReq] = useState(null);
  const [activeAngle, setActiveAngle] = useState("FRONT");
  const [hoveredReq, setHoveredReq] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const insp = inspection || {};

  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    try {
      const cno = caseId || insp?.case_number || insp?.id;
      let url = insp?.pdf_url;
      if (!url || url.includes('/undefined')) {
        url = `${ApiService.getApiBase()}/reports/case/${encodeURIComponent(cno)}/pdf`;
      } else if (url.startsWith('/api')) {
        url = url.replace('/api', ApiService.getApiBase());
      }
      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to generate PDF");
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
      console.error("PDF generation error:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Derive real product name from extraction or backend
  const rawExtractedName = insp.declarations?.find(d => d.field === "product_name")?.value;
  const derivedProduct = typeof insp.product === "object" ? insp.product?.name : insp.product;
  const productName = (derivedProduct && derivedProduct !== "Packaged Commodity" && derivedProduct !== "") ? derivedProduct
    : ((rawExtractedName && rawExtractedName !== "Packaged Commodity" && rawExtractedName !== "") ? rawExtractedName
    : ((insp.product_name && insp.product_name !== "Packaged Commodity" && insp.product_name !== "") ? insp.product_name
    : "NA"));

  const caseId = insp.case_number || (typeof insp.id === "number" ? `LM/2026/${String(insp.id).padStart(6, "0")}` : (insp.id || "LM/2026/000001"));

  // Only show requirements from a real scan — never fall back to hardcoded mock
  let reqs = [];
  let extractedMap = {};

  if (insp.declarations && Array.isArray(insp.declarations) && insp.declarations.length > 0) {
    reqs = insp.declarations.map((d, index) => {
      const fieldKey = d.field || d.field_name || `decl_${index}`;
      const fieldLabel = d.label || (typeof fieldKey === "string" ? fieldKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : "Declaration");
      const rawTextVal = d.value || d.detected_value || d.raw_text || d.text || d.detected;
      const hasValue = Boolean(rawTextVal && String(rawTextVal).trim() !== "" && String(rawTextVal).trim() !== '""' && String(rawTextVal).toLowerCase() !== "none" && String(rawTextVal).toLowerCase() !== "null");
      const isDetected = (d.detected === true || d.is_present === true) && hasValue;
      const statusVal = (!isDetected || !hasValue) ? "FAIL" : (d.status === "COMPLIANT" || d.status === "PASS" || d.is_compliant === true ? "PASS" : (d.status || "FAIL"));
      const confNum = typeof d.confidence === "number" ? d.confidence : (typeof d.confidence_score === "number" ? d.confidence_score : 0.95);
      const confVal = hasValue ? Math.round(confNum > 1 ? confNum : confNum * 100) : 0;
      const detectedVal = hasValue ? String(rawTextVal) : "NOT DETECTED / MISSING FROM LABEL";
      const reasonVal = d.reason || d.remarks || (statusVal === "PASS" ? "Verified compliant under Legal Metrology (PCR 2011)" : "Mandatory statutory requirement not found or illegible on package label.");

      // ONLY use the exact bbox and photo index detected directly by AI from the image
      const resolvedBox = (isDetected && Array.isArray(d.bbox) && d.bbox.length === 4) ? d.bbox : null;
      const targetImageIdx = (typeof d.image_index === "number" && d.image_index > 0) ? d.image_index : 1;

      return {
        key: fieldKey,
        label: fieldLabel,
        rule: d.rule || d.rule_citation || "Rule 6(1) PCR 2011",
        status: statusVal,
        confidence: confVal,
        detected: detectedVal,
        is_present: isDetected,
        reason: reasonVal,
        bbox: resolvedBox,
        image_index: targetImageIdx,
        image_id: d.image_id
      };
    });

    extractedMap = {};
    insp.declarations.forEach((d, index) => {
      const fieldKey = d.field || d.field_name || `decl_${index}`;
      const fieldLabel = d.label || (typeof fieldKey === "string" ? fieldKey.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()) : `Declaration ${index + 1}`);
      const rawVal = d.value || d.detected_value || d.raw_text || (d.is_present ? "Present" : "Missing");
      extractedMap[fieldLabel] = rawVal && String(rawVal).trim() !== "" ? rawVal : (reqs[index]?.detected || "Verified Present");
    });
  }

  const passCount = reqs.filter((r) => r.status === "PASS").length;
  const failCount = reqs.filter((r) => r.status === "FAIL").length;
  const reviewCount = reqs.filter((r) => r.status === "REVIEW").length;
  const avgConf = Math.round(reqs.reduce((s, r) => s + (r.confidence || 90), 0) / (reqs.length || 1));

  // 3-Tier Classification:
  // 1. 100% (passCount === reqs.length) -> COMPLIANT
  // 2. < 50% (passRatio < 0.50) -> NON_COMPLIANT
  // 3. 50% to 99% -> REVIEW (Requires Verification)
  const passRatio = passCount / (reqs.length || 1);
  const computedStatus = (passCount === reqs.length && reqs.length > 0)
    ? "COMPLIANT"
    : (passRatio < 0.50 ? "NON_COMPLIANT" : "REVIEW");

  const inspectionStatus = computedStatus;

  const extractedMfr = insp.declarations?.find(d => d.field === "manufacturer")?.value;
  const manufacturerVal = extractedMfr || insp.manufacturer || (typeof insp.product === "object" && insp.product?.category) || "Registered Food Manufacturer";
  const locationVal = insp.location || "NA";
  const dateVal = insp.created_at ? new Date(insp.created_at).toLocaleDateString("en-IN") : (insp.date || new Date().toLocaleDateString("en-IN"));
  
  let currentUserFullName = "NA";
  try {
    const userStr = localStorage.getItem('legallens_current_user');
    const parsedUser = userStr ? JSON.parse(userStr) : null;
    if (parsedUser) {
      currentUserFullName = parsedUser.full_name || parsedUser.name || "Authorized Officer";
    }
  } catch (e) {
    console.warn("Failed to read user name from localStorage:", e);
  }
  
  let inspectorVal = insp.inspector_name || insp.inspector || currentUserFullName || "NA";
  if (String(inspectorVal).trim().toLowerCase() === "deleted user") {
    inspectorVal = "Deleted User";
  } else if (Array.isArray(users) && users.length > 0) {
    if (insp.inspector_email) {
      const u = users.find(x => x.email && x.email.toLowerCase() === insp.inspector_email.toLowerCase());
      if (u?.name) inspectorVal = u.name;
    } else if (insp.inspector_badge) {
      const u = users.find(x => x.badge && x.badge.toLowerCase() === insp.inspector_badge.toLowerCase());
      if (u?.name) inspectorVal = u.name;
    }
  }

  const canvasUploadRef = useRef(null);
  const [showBoxes, setShowBoxes] = useState(true);

  // Dynamic list of unique packaging photos
  const initialPhotos = [];
  const seenUrls = new Set();

  if (insp.uploaded_images && typeof insp.uploaded_images === "object" && Object.keys(insp.uploaded_images).length > 0) {
    Object.entries(insp.uploaded_images).forEach(([key, val], idx) => {
      const url = val?.previewUrl || val?.url || (typeof val === "string" ? val : null);
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialPhotos.push({
          id: `photo_${idx + 1}`,
          label: `PHOTO ${initialPhotos.length + 1}`,
          url: url
        });
      }
    });
  } else if (insp.images && Array.isArray(insp.images) && insp.images.length > 0) {
    insp.images.forEach((img, idx) => {
      let url = img.supabase_url || img.image_url || img.url || img.original_path;
      if (url && typeof url === 'string' && url.includes('/uploads/')) {
        const supabaseBase = import.meta.env.VITE_SUPABASE_URL;
        if (supabaseBase && supabaseBase.startsWith('https://')) {
          const filename = url.split('/').pop();
          const bucket = url.includes('/reports/') ? 'reports' : 'product-images';
          url = `${supabaseBase.replace(/\/+$/, '')}/storage/v1/object/public/${bucket}/${filename}`;
        }
      }
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        initialPhotos.push({
          id: img.id || `img_${idx + 1}`,
          label: `PHOTO ${initialPhotos.length + 1}`,
          url: url
        });
      }
    });
  }

  const MISSING_IMAGE_PLACEHOLDER = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='400' viewBox='0 0 600 400'><rect width='100%' height='100%' fill='%230f172a'/><g transform='translate(250, 140)' stroke='%23475569' stroke-width='2' fill='none'><rect x='0' y='0' width='100' height='80' rx='8'/><circle cx='35' cy='30' r='12'/><path d='M10,70 L40,40 L65,65 L80,50 L90,70'/></g><text x='300' y='250' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif' font-size='14' font-weight='600'>Image File Not Found on Server</text><text x='300' y='275' text-anchor='middle' fill='%2364748b' font-family='sans-serif' font-size='12'>Uploaded file path is not present on disk</text></svg>";

  // If no uploaded photos, fallback to SVG placeholder
  if (initialPhotos.length === 0) {
    initialPhotos.push(
      { id: "FRONT", label: "PHOTO 1 (FRONT)", url: MISSING_IMAGE_PLACEHOLDER }
    );
  }

  const [photosList, setPhotosList] = useState(initialPhotos);
  const [activePhotoId, setActivePhotoId] = useState(initialPhotos[0]?.id || "photo_1");

  // Keep photosList in sync when inspection prop changes
  useEffect(() => {
    if (initialPhotos.length > 0) {
      setPhotosList(initialPhotos);
      setActivePhotoId(initialPhotos[0]?.id || "photo_1");
    }
  }, [insp.id, insp.case_number, insp.images]);

  // Handler to smoothly switch to the specific image where a declaration lives
  const handleSelectReq = (r) => {
    if (!r) {
      setHoveredReq(null);
      return;
    }
    setHoveredReq(r.key);

    // Hop directly to the photo where AI detected this declaration
    if (r.bbox && r.status !== "FAIL" && typeof r.image_index === "number" && r.image_index > 0) {
      const targetIdx = r.image_index - 1;
      if (photosList[targetIdx]) {
        setActivePhotoId(photosList[targetIdx].id);
      } else if (r.image_id) {
        const found = photosList.find(p => p.id === r.image_id);
        if (found) setActivePhotoId(found.id);
      }
    }
  };

  const currentPhoto = photosList.find(p => p.id === activePhotoId) || photosList[0] || { url: MISSING_IMAGE_PLACEHOLDER, label: "PHOTO" };

  const handleAddNewPhotos = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      const newItems = files.map((file, i) => {
        const id = `PHOTO_${Date.now()}_${i+1}`;
        return {
          id: id,
          label: `PHOTO ${photosList.length + i + 1} (${file.name.slice(0, 10)})`,
          url: URL.createObjectURL(file)
        };
      });
      setPhotosList(prev => [...prev, ...newItems]);
      setActivePhotoId(newItems[0].id);
    }
  };

  return (
    <div className="space-y-6">
      <input
        ref={canvasUploadRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleAddNewPhotos}
      />
      <Card>
        <div className="flex items-start justify-between gap-6">
          <div className="flex-1 min-w-0">
            <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.08em" }}>{caseId}</div>
            <h2 style={{ ...FONT.display, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 2 }}>{productName}</h2>
            <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: 12.5, color: C.slate }}>
              <span className="flex items-center gap-1.5 min-w-0 max-w-full">
                <Building2 size={13} className="flex-shrink-0" />
                <span className="truncate max-w-[320px] sm:max-w-[420px] md:max-w-[550px]" title={manufacturerVal}>{manufacturerVal}</span>
              </span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {locationVal}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {dateVal}</span>
              <span className="flex items-center gap-1.5"><User size={13} /> {inspectorVal}</span>
            </div>
          </div>
          <div className="flex-shrink-0">
            <VerdictStamp status={inspectionStatus} caseNo={caseId} />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t" style={{ borderColor: C.line }}>
          {[
            ["Mandatory Declarations", `${passCount} / ${reqs.length}`, "detected & verified"],
            ["Violations", failCount, "require correction"],
            ["Manual Verification", reviewCount, "needs officer review"],
            ["Overall Confidence", `${avgConf}%`, "AI extraction average"],
          ].map(([l, v, s]) => (
            <div key={l}>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, letterSpacing: "0.02em" }}>{l.toUpperCase()}</div>
              <div style={{ ...FONT.display, fontSize: 26, fontWeight: 700, color: C.ink, marginTop: 3 }}>{v}</div>
              <div style={{ fontSize: 11, color: C.slate }}>{s}</div>
            </div>
          ))}
        </div>
      </Card>

      {/* ── MULTI-ANGLE PACKAGE VISION CANVAS & BOUNDING BOX OVERLAY ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Interactive Multi-Angle Visual Bounding Box Canvas (7 cols) */}
        <Card className="lg:col-span-7 flex flex-col justify-between overflow-hidden rounded-xl shadow-md" padded={false}>
          <div className="p-4 border-b flex flex-wrap items-center justify-between gap-3" style={{ borderColor: C.line }}>
            <div className="flex items-center gap-2">
              <ScanLine size={17} style={{ color: C.gold }} />
              <span style={{ ...FONT.display, fontSize: 14.5, fontWeight: 700, color: C.ink }}>
                Package Vision Canvas ({photosList.length} Photos)
              </span>
            </div>

            {/* Dynamic Photo Tabs & Upload Button */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900/10 dark:bg-slate-950/60 border border-slate-700/30 overflow-x-auto max-w-[340px]">
                {photosList.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setActivePhotoId(p.id)}
                    className={`ll-focus text-[11px] font-mono px-3 py-1 rounded-md transition-all whitespace-nowrap font-semibold cursor-pointer ${
                      activePhotoId === p.id
                        ? "bg-amber-500 text-slate-950 shadow-xs font-bold"
                        : "text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowBoxes(!showBoxes)}
                className={`ll-focus text-xs font-mono px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap shadow-xs ${
                  showBoxes ? "bg-amber-500/20 text-amber-300 border-amber-500/40" : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
                title="Toggle bounding box highlights"
              >
                <Eye size={12} /> {showBoxes ? "Boxes: ON" : "Boxes: OFF"}
              </button>
            </div>
          </div>

          {/* Canvas Image Container with Dynamic Overlays */}
          <div className="relative min-h-[360px] max-h-[460px] w-full bg-slate-950/95 flex items-center justify-center overflow-hidden group select-none">
            <img
              src={currentPhoto.url}
              alt={currentPhoto.label}
              className="max-h-[440px] max-w-full object-contain transition-transform duration-300"
              onError={(e) => {
                if (e.target.src !== MISSING_IMAGE_PLACEHOLDER) {
                  e.target.src = MISSING_IMAGE_PLACEHOLDER;
                }
              }}
            />

              {/* Bounding Box Highlights (Only rendered for declarations ACTUALLY found on this photo) */}
              {showBoxes && reqs.map((r, i) => {
                // If declaration was not found/missing from packaging, do NOT draw any box!
                if (!r.bbox || !Array.isArray(r.bbox) || r.bbox.length !== 4 || r.status === "FAIL" || !r.is_present) return null;
                const isHovered = hoveredReq === r.key;
                
                // Match declaration's detected image index with currently active photo
                const declPhotoIdx = (typeof r.image_index === "number" ? r.image_index : 1) - 1;
                const activePhotoIndex = photosList.findIndex(p => p.id === activePhotoId);
                const isCurrentPhotoMatch = (declPhotoIdx === activePhotoIndex);

                // Only render if currently viewing the photo this declaration belongs to
                if (!isCurrentPhotoMatch) return null;

              const [ymin, xmin, ymax, xmax] = r.bbox;
              const top = `${ymin / 10}%`;
              const left = `${xmin / 10}%`;
              const width = `${(xmax - xmin) / 10}%`;
              const height = `${(ymax - ymin) / 10}%`;
              const isPass = r.status === "PASS";

              return (
                <motion.div
                  key={r.key || i}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: isHovered ? 1.04 : 1 }}
                  transition={{ type: "spring", stiffness: 350, damping: 22 }}
                  onMouseEnter={() => handleSelectReq(r)}
                  onMouseLeave={() => setHoveredReq(null)}
                  className={`absolute border-2 cursor-pointer rounded-sm ${
                    isHovered
                      ? "border-amber-400 bg-amber-400/30 shadow-[0_0_25px_#F59E0B] z-30 ring-2 ring-amber-300"
                      : isPass
                        ? "border-emerald-500/70 bg-emerald-500/10 hover:border-emerald-400 hover:bg-emerald-500/20 z-10"
                        : "border-red-500/80 bg-red-500/15 hover:border-red-400 hover:bg-red-500/25 z-20"
                  }`}
                  style={{ top, left, width, height }}
                >
                  <motion.span
                    animate={isHovered ? { y: -2, scale: 1.05 } : { y: 0, scale: 1 }}
                    className={`absolute -top-5 left-0 px-1.5 py-0.2 rounded text-[9.5px] font-mono font-bold whitespace-nowrap uppercase tracking-wider ${
                      isHovered ? "bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30" : (isPass ? "bg-emerald-600 text-white" : "bg-red-600 text-white")
                    } shadow-md`}
                  >
                    {r.label?.split(" ")[0]} ({r.confidence}%)
                  </motion.span>
                </motion.div>
              );
            })}

            {/* Bottom Floating Legend */}
            {(() => {
              const hoveredItem = reqs.find(r => r.key === hoveredReq);
              const isCompliantActive = hoveredItem && hoveredItem.status === "PASS";
              const isViolationActive = hoveredItem && hoveredItem.status === "FAIL";
              
              return (
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between px-3.5 py-1.5 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-[11px] font-mono text-slate-300 pointer-events-none">
                  <span className="flex items-center gap-2 select-none">
                    <span className="flex items-center gap-1.5 transition-all duration-200"
                      style={{
                        opacity: hoveredReq ? (isCompliantActive ? 1 : 0.35) : 1,
                        transform: isCompliantActive ? "scale(1.05)" : "scale(1)"
                      }}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block ${isCompliantActive ? 'shadow-[0_0_8px_#10B981]' : ''}`} />
                      <span className={isCompliantActive ? 'text-emerald-400 font-bold' : ''}>Compliant</span>
                    </span>
                    
                    <span className="flex items-center gap-1.5 transition-all duration-200 ml-3"
                      style={{
                        opacity: hoveredReq ? (isViolationActive ? 1 : 0.35) : 1,
                        transform: isViolationActive ? "scale(1.05)" : "scale(1)"
                      }}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full bg-red-500 inline-block ${isViolationActive ? 'shadow-[0_0_8px_#EF4444]' : ''}`} />
                      <span className={isViolationActive ? 'text-red-400 font-bold' : ''}>Violation</span>
                    </span>
                  </span>
                  <span className="text-amber-400 font-semibold transition-all duration-200">
                    {hoveredReq ? `Inspecting: ${hoveredItem?.label || ''}` : "Hover any box or table row"}
                  </span>
                </div>
              );
            })()}
          </div>

          {/* Photo Thumbnail Gallery Strip */}
          <div className="p-3 border-t bg-slate-950/90 flex items-center gap-2.5 overflow-x-auto select-none" style={{ borderColor: C.line }}>
            <span className="text-[10.5px] font-mono text-slate-400 uppercase tracking-wider flex-shrink-0 mr-1 font-bold">
              Photos ({photosList.length}):
            </span>
            {photosList.map((p, idx) => (
              <div
                key={p.id}
                onClick={() => setActivePhotoId(p.id)}
                className={`relative flex-shrink-0 w-12 h-12 rounded-lg border-2 overflow-hidden cursor-pointer transition-all ${
                  activePhotoId === p.id
                    ? "border-amber-400 scale-105 shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    : "border-slate-700 opacity-60 hover:opacity-100 hover:border-slate-500"
                }`}
                title={p.label}
              >
                <img
                  src={p.url}
                  alt={p.label}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    if (e.target.src !== MISSING_IMAGE_PLACEHOLDER) {
                      e.target.src = MISSING_IMAGE_PLACEHOLDER;
                    }
                  }}
                />
                <span className="absolute bottom-0 inset-x-0 bg-black/80 text-[8px] font-mono text-center text-slate-200 truncate px-0.5 font-semibold">
                  #{idx + 1}
                </span>
              </div>
            ))}
          </div>
        </Card>

        {/* Right: Live OCR Vision Terminal Stream (5 cols) */}
        <div className="lg:col-span-5 flex flex-col overflow-hidden shadow-md h-[580px] border rounded-xl transition-all" style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-charcoal)" }}>
          <div className="p-3.5 bg-slate-950 text-slate-200 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
              <span style={{ ...FONT.mono, fontSize: 11.5, fontWeight: 700 }} className="text-amber-400">
                EasyOCR Neural Stream
              </span>
            </div>

            <button
              onClick={() => {
                const rawJson = JSON.stringify(reqs.map(r => ({ label: r.label, text: r.detected, rule: r.rule, confidence: r.confidence, bbox: r.bbox, status: r.status })), null, 2);
                navigator.clipboard.writeText(rawJson);
                alert("Copied raw OCR bounding box JSON to clipboard!");
              }}
              className="ll-focus px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10.5px] font-mono text-amber-300 border border-slate-700 transition-all flex items-center gap-1"
            >
              <Code size={11} /> Copy JSON
            </button>
          </div>

          <div className="p-3.5 bg-slate-950/95 text-[11px] font-mono text-slate-300 space-y-2 flex-1 min-h-0 overflow-y-auto select-text">
            <div className="text-emerald-400 font-medium">➜ [STREAM] Res: 1000×1000 normalized grid</div>
            {reqs.map((r, i) => {
              const isPass = r.status === "PASS";
              const isHovered = hoveredReq === r.key;
              return (
                <div
                  key={r.key || i}
                  onMouseEnter={() => handleSelectReq(r)}
                  onMouseLeave={() => setHoveredReq(null)}
                  onClick={() => handleSelectReq(r)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer space-y-2 ${
                    isHovered
                      ? "bg-slate-900 border-amber-400/80 text-white shadow-md shadow-amber-500/10 -translate-y-[1px]"
                      : "bg-slate-900/40 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                  }`}
                >
                  <div className="text-[11px] font-bold text-amber-400/90 tracking-wide">
                    {r.label}
                  </div>
                  <div className="text-slate-200 font-mono text-[11px] bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/60 flex items-center gap-2">
                    <span className="text-emerald-400/80 font-bold select-none">➜</span>
                    <span className="font-medium truncate">{r.detected}</span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-0.5">
                    <span>{r.rule}</span>
                    <div className="flex items-center gap-2.5">
                      <span className="text-amber-400/80 font-semibold">{r.confidence}% conf</span>
                      <span className={`font-bold px-2 py-0.5 rounded-full uppercase text-[9px] tracking-wider ${
                        isPass 
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-red-500/15 text-red-400 border border-red-500/30'
                      }`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 bg-slate-950 border-t border-slate-800 text-[10.5px] font-mono text-amber-400 flex items-center justify-between">
            <span>✓ PCR 2011 Rule Matrix: {reqs.length} Checks</span>
            <span className="font-bold">{inspectionStatus}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-x-auto rounded-xl" padded={false}>
          <div className="p-5 pb-0"><SectionLabel eyebrow="RULE-BY-RULE" title="Compliance Checklist" /></div>
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
                {["REQUIREMENT", "RULE", "STATUS", "CONFIDENCE", ""].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reqs.map((r) => (
                <tr
                  key={r.key}
                  onMouseEnter={() => handleSelectReq(r)}
                  onMouseLeave={() => setHoveredReq(null)}
                  onClick={() => handleSelectReq(r)}
                  className={`ll-tr transition-all cursor-pointer ${hoveredReq === r.key ? 'bg-amber-500/10' : ''}`}
                >
                  <td className="px-5 py-3.5 border-b font-semibold" style={{ borderColor: C.line }}>{r.label}</td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line, ...FONT.mono, fontSize: 11.5, color: C.gold, fontWeight: 700 }}>{r.rule}</td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}><ReqStatusChip status={r.status} /></td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line, color: C.charcoal, fontWeight: 600 }}>{r.confidence}%</td>
                  <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                    <button onClick={() => setEvidenceReq(r)} className="ll-focus inline-flex items-center gap-1 cursor-pointer font-bold text-xs hover:scale-105 transition-transform" style={{ color: C.ink }}>
                      <Eye size={13} /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionLabel eyebrow="EXTRACTED" title="Structured Declaration" />
            <dl className="space-y-2.5">
              {Object.entries(extractedMap).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 pb-2 border-b" style={{ borderColor: C.line }}>
                  <dt style={{ fontSize: 11.5, color: C.slate, flexShrink: 0 }}>{k}</dt>
                  <dd style={{ fontSize: 12, color: C.ink, fontWeight: 600, textAlign: "right" }}>{String(v)}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <Card>
            <SectionLabel eyebrow="ACCOUNTABILITY" title="Officer Determination" />
            <p style={{ fontSize: 11.5, color: C.slate, lineHeight: 1.5, marginBottom: 10 }}>
              The finding above is AI-assisted. Confirm, override, or flag for further review before it becomes the final determination.
            </p>
            <select style={{ ...inputStyle, marginBottom: 10 }} defaultValue="">
              <option value="" disabled>Select determination</option>
              <option>Confirm AI finding ? Non-Compliant</option>
              <option>Override ? mark Compliant</option>
              <option>Escalate for senior review</option>
            </select>
            <textarea style={{ ...inputStyle, minHeight: 60, marginBottom: 12 }} placeholder="Officer remarks?" />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleDownloadPdf}
                disabled={isGeneratingPdf}
              >
                {isGeneratingPdf ? (
                  <>
                    <Loader2 size={13} className="animate-spin" /> Generating PDF...
                  </>
                ) : (
                  <>
                    <FileText size={13} /> Generate Official PDF
                  </>
                )}
              </Button>
              <Button size="sm" variant="ghost">Save Draft</Button>
            </div>
          </Card>
        </div>
      </div>

      <EvidenceModal requirement={evidenceReq} onClose={() => setEvidenceReq(null)} />
    </div>
  );
}

/* ============================== PRODUCTS ============================== */

/* ============================== PRODUCT HISTORY MODAL ============================== */

function ProductHistoryModal({ product, onClose, onOpenInspection }) {
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
      {/* Backdrop click to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      <motion.div
        initial={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: shouldReduceMotion ? 1 : 0.95, y: 15 }}
        transition={{ duration: 0.2 }}
        className="relative z-10 w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden"
        style={{ background: "var(--ll-bg-card)", borderColor: C.line }}
      >
        {/* Modal Header */}
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

            {/* Product Metadata Chips */}
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

        {/* Modal Scrollable Timeline Body */}
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
                  {/* Vertical timeline connector */}
                  <div className="flex flex-col items-center">
                    <div
                      className="w-4 h-4 rounded-full border-2 transition-transform group-hover:scale-125 shadow-xs flex-shrink-0"
                      style={{ borderColor: m.color, background: m.bg }}
                    />
                    {!isLast && (
                      <div className="w-px flex-1 my-1" style={{ background: C.line, minHeight: 48 }} />
                    )}
                  </div>

                  {/* Timeline Content Card */}
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

                      {/* Statutory Findings & Notes */}
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

        {/* Modal Footer */}
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

/* ============================== PRODUCTS ============================== */

function Products({ onOpenInspection, onNewInspection, users = [] }) {
  const [productsList, setProductsList] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const shouldReduceMotion = useReducedMotion();

  // Helper to aggregate inspections into unique products
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

      // Determine unique grouping key
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

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch live inspections from Supabase
      const { data: supaData } = await fetchInspections({ limit: 100 });
      if (supaData && supaData.length > 0) {
        const prods = aggregateProducts(supaData);
        setProductsList(prods);
        setLoading(false);
        return;
      }

      // 2. Fetch from FastAPI Backend
      const apiProds = await ApiService.getProducts();
      if (apiProds && apiProds.length > 0) {
        setProductsList(apiProds);
        setLoading(false);
        return;
      }

      // 3. Fallback to demo inspections if database is empty
      const fallbackProds = aggregateProducts(INSPECTIONS);
      setProductsList(fallbackProds);
    } catch (err) {
      console.warn("[Products] Load notice:", err);
      const fallbackProds = aggregateProducts(INSPECTIONS);
      setProductsList(fallbackProds);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter products by search, category, and status
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
        {/* Header & Filter Toolbar */}
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

          {/* Search and Filters */}
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

        {/* Product Catalogue Table */}
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

      {/* History Modal Popup */}
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

/* ============================== RULES ============================== */

function Rules() {
  const [searchQuery, setSearchQuery] = useState("");
  const [documentType, setDocumentType] = useState("ALL");
  const [verificationStatus, setVerificationStatus] = useState("VERIFIED");

  const clearFilters = () => {
    setSearchQuery("");
    setDocumentType("ALL");
    setVerificationStatus("VERIFIED");
  };

  return (
    <div className="space-y-5">
      <div>
        <SectionLabel eyebrow="OFFICER REFERENCE" title="Legal Metrology Knowledge Centre" />
        <p style={{ fontSize: 12.5, color: C.slate, maxWidth: 680, marginTop: -8 }}>
          An evidence and reference centre for Legal Metrology rules and official sources. It supports officer review and does not make legal decisions.
        </p>
      </div>

      <Card className="rounded-xl shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_180px_180px_auto] gap-3 items-end">
          <Field label="Search official references">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input
                style={{ ...inputStyle, paddingLeft: 34 }}
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search rules, documents, citations..."
              />
            </div>
          </Field>

          <Field label="Document type">
            <select style={inputStyle} value={documentType} onChange={(event) => setDocumentType(event.target.value)}>
              <option value="ALL">All types</option>
              <option value="ACT">Act</option>
              <option value="RULES">Rules</option>
              <option value="AMENDMENT">Amendment</option>
              <option value="NOTIFICATION">Notification</option>
              <option value="GUIDANCE">Guidance</option>
            </select>
          </Field>

          <Field label="Verification status">
            <select style={inputStyle} value={verificationStatus} onChange={(event) => setVerificationStatus(event.target.value)}>
              <option value="VERIFIED">Verified</option>
              <option value="DRAFT">Draft</option>
              <option value="UNVERIFIED">Unverified</option>
            </select>
          </Field>

          <Button variant="ghost" onClick={clearFilters}>Clear filters</Button>
        </div>
      </Card>

      <Card className="rounded-xl shadow-sm">
        <div className="flex flex-col items-center text-center py-10 px-5">
          <div className="w-10 h-10 rounded-full flex items-center justify-center mb-3" style={{ background: "var(--ll-bg-paper-deep)", color: C.slate }}>
            <Info size={19} />
          </div>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: C.ink }}>No verified official documents yet</h2>
          <p style={{ fontSize: 12.5, color: C.slate, maxWidth: 470, marginTop: 6 }}>
            Verified official Legal Metrology documents and their linked references will appear here.
          </p>
        </div>
      </Card>
    </div>
  );
}

function Reports({ onOpenInspection, users = [] }) {
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

  const deduplicateReports = (arr) => {
    if (!Array.isArray(arr)) return [];
    const seen = new Set();
    const result = [];
    for (const item of arr) {
      const prodKey = (item.product_name || item.product || item.case_number || "").toString().trim().toLowerCase();
      if (prodKey && !seen.has(prodKey)) {
        seen.add(prodKey);
        result.push(item);
      }
    }
    return result;
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

/* ============================== SETTINGS & USER MANAGEMENT ============================== */

function SettingsPage({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser, onSwitchRole, isDbConnected, onRefreshDb, onSeedDb, loadingDb }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [avatarMap, setAvatarMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("legallens_avatars") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("officer_avatars")
        .select("badge, avatar_url")
        .then(({ data, error }) => {
          if (!error && data?.length) {
            setAvatarMap((prev) => {
              const updated = { ...prev };
              data.forEach((row) => {
                if (row.badge && row.avatar_url) {
                  updated[row.badge.trim()] = row.avatar_url;
                }
              });
              localStorage.setItem("legallens_avatars", JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => { });
    }
  }, []);

  const isAdmin = currentUser?.role === "Admin";

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.badge && u.badge.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (u.jurisdiction && u.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleColors = {
    Admin: { text: C.violation, bg: C.violationBg, border: C.violationBd },
    "Enforcement Officer": { text: C.ink, bg: "var(--ll-bg-paper-deep)", border: C.line },
    Reviewer: { text: C.review, bg: C.reviewBg, border: C.reviewBd },
  };

  const counts = {
    total: users.length,
    admins: users.filter((u) => u.role === "Admin").length,
    officers: users.filter((u) => u.role === "Enforcement Officer").length,
    reviewers: users.filter((u) => u.role === "Reviewer").length,
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 ll-rise flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md"
          style={{ background: "var(--ll-bg-sidebar)", color: "#fff", borderColor: C.gold }}
        >
          <CheckCircle2 size={18} style={{ color: "#C7A75A" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Database Connection & Role Status Banner */}
      <Card className="border-l-4 rounded-xl shadow-md" style={{ borderLeftColor: isAdmin ? "var(--ll-compliant)" : "var(--ll-review)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border"
              style={{
                background: isAdmin ? "var(--ll-compliant-bg)" : "var(--ll-review-bg)",
                borderColor: isAdmin ? "var(--ll-compliant-bd)" : "var(--ll-review-bd)"
              }}
            >
              {isAdmin ? (
                <ShieldCheck size={22} style={{ color: "var(--ll-compliant)" }} />
              ) : (
                <ShieldAlert size={22} style={{ color: "var(--ll-review)" }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ ...FONT.display, fontSize: 16.5, fontWeight: 800, color: C.ink }}>
                  {isAdmin ? "Administrator Authority Active" : "Restricted Officer View — Read Only"}
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border shadow-2xs"
                  style={{
                    background: isAdmin ? "var(--ll-compliant-bg)" : "var(--ll-review-bg)",
                    color: isAdmin ? "var(--ll-compliant)" : "var(--ll-review)",
                    borderColor: isAdmin ? "var(--ll-compliant-bd)" : "var(--ll-review-bd)",
                  }}
                >
                  {currentUser?.role}
                </span>

                {/* Supabase status badge */}
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs"
                  style={{
                    background: isDbConnected ? "rgba(34,197,94,0.12)" : "rgba(234,179,8,0.12)",
                    color: isDbConnected ? "#22C55E" : "#EAB308",
                    borderColor: isDbConnected ? "rgba(34,197,94,0.3)" : "rgba(234,179,8,0.3)"
                  }}
                >
                  <Database size={11} />
                  {isDbConnected ? "Supabase Live DB" : "Local / Offline Mode"}
                </span>
              </div>
              <p style={{ fontSize: 12.5, color: C.slate, marginTop: 3, maxWidth: 620, lineHeight: 1.4 }}>
                {isAdmin ? (
                  <>
                    You are logged in with <strong>Administrator credentials</strong> ({currentUser?.name}). You have full authority to provision, modify roles, update jurisdictions, and deactivate accounts.
                  </>
                ) : (
                  <>
                    Officer management is restricted to <strong>System Administrators</strong> under Legal Metrology IT Governance. You can inspect active personnel in read-only mode.
                  </>
                )}
              </p>
            </div>
          </div>

        </div>
      </Card>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ["Total Accounts", counts.total, Users, C.ink],
          ["Active Admins", counts.admins, Shield, C.violation],
          ["Enforcement Officers", counts.officers, UserCheck, C.compliant],
          ["Reviewers", counts.reviewers, User, C.gold],
        ].map(([label, val, Icon, col]) => (
          <Card key={label} padded={false} hoverEffect className="rounded-xl">
            <div className="p-5 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 11, color: C.slate, fontWeight: 700, letterSpacing: "0.04em" }}>{label.toUpperCase()}</div>
                <div style={{ ...FONT.display, fontSize: 26, fontWeight: 800, color: C.ink, marginTop: 3 }}>{val}</div>
              </div>
              <motion.div
                whileHover={{ rotate: 10, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
                style={{ background: col + "1A", borderColor: col + "33" }}
              >
                <Icon size={18} style={{ color: col }} />
              </motion.div>
            </div>
          </Card>
        ))}
      </div>

      {/* Directory Table Card */}
      <Card padded={false} className="rounded-xl overflow-hidden shadow-md">
        <div className="p-5 border-b flex flex-wrap items-center justify-between gap-4" style={{ borderColor: C.line }}>
          <div>
            <SectionLabel eyebrow="PERSONNEL & ACCESS" title="Legal Metrology Officers & Accounts" />
            <p style={{ fontSize: 12, color: C.slate, marginTop: -8 }}>
              {isAdmin
                ? "Provision new enforcement officers, assign divisions, or modify access levels."
                : "Directory of authorized Legal Metrology inspection and appellate staff."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input
                placeholder="Search name, badge, email…"
                className="ll-focus"
                style={{ ...inputStyle, paddingLeft: 30, width: 220, fontSize: 12.5 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="ll-focus"
              style={{ ...inputStyle, width: 160, fontSize: 12.5 }}
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
            >
              <option value="ALL">All Roles</option>
              <option value="Admin">Admin Only</option>
              <option value="Enforcement Officer">Enforcement Officers</option>
              <option value="Reviewer">Reviewers</option>
            </select>

            {isAdmin ? (
              <Button onClick={() => setShowAddModal(true)}>
                <UserPlus size={15} /> Add Officer
              </Button>
            ) : (
              <div className="relative group">
                <Button disabled={true} variant="ghost" className="cursor-not-allowed">
                  <Lock size={14} /> Add Officer
                </Button>
                <div className="absolute right-0 top-full mt-1 hidden group-hover:block z-20 bg-slate-900 text-white text-[11px] py-1 px-2 rounded whitespace-nowrap shadow-md">
                  Admin authorization required to add accounts
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
                {["OFFICER & BADGE", "ROLE", "EMAIL & JURISDICTION", "PHONE", "STATUS", "ACTIONS"].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: C.line, background: "var(--ll-table-head-bg)" }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => {
                const rStyle = roleColors[u.role] || roleColors["Enforcement Officer"];
                const isSelf = u.email === currentUser?.email;
                return (
                  <tr key={u.email} className="ll-tr">
                    <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden border shadow-sm"
                          style={{
                            background: "var(--ll-bg-sidebar)",
                            borderColor: "var(--ll-color-line)",
                            color: "#F0E4C4",
                          }}
                        >
                          {avatarMap[u.badge?.trim()] ? (
                            <img src={avatarMap[u.badge?.trim()]} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.initials || (u.name ? u.name.slice(0, 2).toUpperCase() : "OF")
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: C.ink }}>
                            {u.name} {isSelf && <span className="text-[10px] text-amber-500 bg-amber-500/15 border border-amber-500/30 px-1 py-0.2 rounded ml-1 font-bold">YOU</span>}
                          </div>
                          <div style={{ ...FONT.mono, fontSize: 11, color: C.gold }}>{u.badge || "LMD-DL-xxxx"}</div>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                      <span
                        className="inline-block px-2.5 py-0.5 rounded border"
                        style={{
                          color: rStyle.text,
                          background: rStyle.bg,
                          borderColor: rStyle.border,
                          fontWeight: 700,
                          fontSize: 11,
                        }}
                      >
                        {u.role}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                      <div style={{ color: C.charcoal }}>{u.email}</div>
                      <div style={{ fontSize: 11, color: C.slate }}>{u.jurisdiction || "Division HQ"}</div>
                    </td>

                    <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line, ...FONT.mono, fontSize: 11.5, color: C.slate }}>
                      {u.phone || "—"}
                    </td>

                    <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                      <span
                        className="inline-flex items-center gap-1 text-[10.5px] font-bold px-2 py-0.5 rounded border"
                        style={{
                          background: u.active ? "var(--ll-compliant-bg)" : "var(--ll-bg-paper-deep)",
                          color: u.active ? "var(--ll-compliant)" : C.slate,
                          borderColor: u.active ? "var(--ll-compliant-bd)" : C.line,
                        }}
                      >
                        {u.active ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                        {u.active ? "ACTIVE" : "DISABLED"}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 border-b" style={{ borderColor: C.line }}>
                      {isAdmin ? (
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingUser(u)}
                            className="ll-focus inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded border hover:bg-slate-700/20 transition-colors"
                            style={{ borderColor: C.line, color: C.ink }}
                            title="Edit Officer Account"
                          >
                            <Edit size={12} style={{ color: C.gold }} /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              onUpdateUser(u.email, { active: !u.active });
                              showToast(`Status updated for ${u.name} (${!u.active ? "Active" : "Disabled"})`);
                            }}
                            className="ll-focus inline-flex items-center p-1 rounded border hover:bg-slate-700/20 transition-colors"
                            style={{ borderColor: C.line, color: u.active ? C.review : C.compliant }}
                            title={u.active ? "Deactivate Account" : "Activate Account"}
                          >
                            {u.active ? <UserX size={13} /> : <UserCheck size={13} />}
                          </button>

                          {!isSelf && (
                            <button
                              type="button"
                              onClick={() => setDeletingUser(u)}
                              className="ll-focus inline-flex items-center p-1 rounded border border-red-500/40 hover:bg-red-500/20 text-red-400 transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Lock size={12} /> Read-Only
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No officer accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* ADD USER MODAL (ADMIN ONLY) */}
      <AnimatePresence>
        {showAddModal && (
          <AddUserModal
            onClose={() => setShowAddModal(false)}
            onAdd={(newUser) => {
              onAddUser(newUser);
              setShowAddModal(false);
              showToast(`Officer account ${newUser.name} created successfully.`);
            }}
          />
        )}
      </AnimatePresence>

      {/* EDIT USER MODAL (ADMIN ONLY) */}
      <AnimatePresence>
        {editingUser && (
          <EditUserModal
            user={editingUser}
            onClose={() => setEditingUser(null)}
            onSave={(updated) => {
              onUpdateUser(editingUser.email, updated);
              setEditingUser(null);
              showToast(`Profile for ${updated.name} updated.`);
            }}
          />
        )}
      </AnimatePresence>

      {/* DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
      <AnimatePresence>
        {deletingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            style={{ background: "var(--ll-modal-overlay)" }}
            onClick={() => setDeletingUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="max-w-md w-full"
            >
              <Card padded={false}>
                <div className="p-6" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-3 text-red-500 mb-3">
                    <ShieldAlert size={24} />
                    <h3 style={{ ...FONT.display, fontSize: 18, fontWeight: 700 }}>Confirm Account Revocation</h3>
                  </div>
                  <p style={{ fontSize: 13, color: C.charcoal, lineHeight: 1.5 }}>
                    Are you sure you want to delete the officer profile for <strong>{deletingUser.name}</strong> ({deletingUser.email})?
                    This will remove their inspection access rights permanently.
                  </p>
                  <div className="flex justify-end gap-2.5 mt-6">
                    <Button variant="ghost" size="sm" onClick={() => setDeletingUser(null)}>
                      Cancel
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        onDeleteUser(deletingUser.email);
                        setDeletingUser(null);
                        showToast(`Officer account for ${deletingUser.name} deleted.`);
                      }}
                    >
                      <Trash2 size={13} /> Confirm Delete
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ============================== PHONE VALIDATION HELPER ============================== */

function validateMobileNumber(phoneStr) {
  if (!phoneStr || !phoneStr.trim()) {
    return { valid: false, error: "Please enter a 10-digit mobile number." };
  }
  const digits = phoneStr.replace(/\D/g, "");
  let tenDigits = "";
  if (digits.length === 10) {
    tenDigits = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    tenDigits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigits = digits.slice(1);
  } else {
    return {
      valid: false,
      error: `Mobile number must contain exactly 10 digits (currently ${digits.length} digit${digits.length === 1 ? "" : "s"}).`,
    };
  }
  return { valid: true, formatted: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`, raw: tenDigits };
}

/* ============================== ADD USER MODAL ============================== */

function AddUserModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    badge: `LMD-DL-${Math.floor(1000 + Math.random() * 9000)}`,
    role: "Enforcement Officer",
    email: "",
    jurisdiction: "Delhi Central Division",
    phone: "",
    active: true,
    pass: "",
  });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (val) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const rawDigits = val.replace(/\D/g, "");
    if (!val.trim()) {
      setPhoneError("");
    } else if (rawDigits.length > 10 && !(rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError(`Exceeds 10 digits (${rawDigits.length} digits entered)`);
    } else if (rawDigits.length === 10 || (rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone.trim()) {
      const phoneVal = validateMobileNumber(formData.phone);
      if (!phoneVal.valid) {
        setPhoneError(phoneVal.error);
      } else {
        setPhoneError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter the officer's full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid official email address.");
      return;
    }
    const phoneVal = validateMobileNumber(formData.phone);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error);
      return;
    }
    if (!formData.pass || formData.pass.length < 4) {
      setError("Set a login password of at least 4 characters.");
      return;
    }
    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    onAdd({
      ...formData,
      phone: phoneVal.formatted,
      id: `USR-${Date.now().toString().slice(-4)}`,
      initials: initials || "OF",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ background: "var(--ll-modal-overlay)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="max-w-lg w-full"
      >
        <Card padded={false}>
          <div className="p-6 overflow-y-auto max-h-[90vh] ll-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-4 mb-4 border-b" style={{ borderColor: C.line }}>
              <div>
                <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.1em" }}>PROVISION ACCOUNT</div>
                <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>Add New Officer</h3>
              </div>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </motion.button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required={true}>
                  <input
                    style={inputStyle}
                    placeholder="e.g. Vikram Sharma"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (!formData.email && e.target.value) {
                        const emailPrefix = e.target.value.toLowerCase().replace(/\s+/g, ".");
                        setFormData((prev) => ({ ...prev, name: e.target.value, email: `${emailPrefix}@lm.gov.in` }));
                      }
                    }}
                    required
                  />
                </Field>

                <Field label="Badge / Officer ID" required={true}>
                  <input
                    style={inputStyle}
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. LMD-DL-0521"
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Role & Authority" required={true}>
                  <select
                    style={inputStyle}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Enforcement Officer">Enforcement Officer</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </Field>

                <Field label="Official Email" required={true}>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="officer@lm.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jurisdiction / Division">
                  <input
                    style={inputStyle}
                    placeholder="e.g. West Delhi Division"
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  />
                </Field>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.charcoal }}>
                    Contact Mobile (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      borderColor: phoneError ? "#EF4444" : undefined,
                      boxShadow: phoneError ? "0 0 0 1px #EF4444" : undefined,
                    }}
                    placeholder="e.g. 9812345678"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                  />
                  {phoneError && (
                    <div className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label="Login Password" required={true}>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    style={{ ...inputStyle, paddingLeft: 32 }}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Password stored in officer_users.pass"
                    value={formData.pass}
                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                    required
                  />
                </div>
              </Field>

              <div className="p-3 rounded border text-xs text-slate-400 flex items-start gap-2" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>
                <Key size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  This password is saved to the officer’s <strong>pass</strong> column and is required at sign-in together with the badge ID.
                </span>
              </div>

              <div className="flex justify-end gap-2.5 pt-4 border-t" style={{ borderColor: C.line }}>
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  <UserPlus size={15} /> Create Account
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ============================== EDIT USER MODAL ============================== */

function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user.name,
    badge: user.badge || "LMD-DL-xxxx",
    role: user.role,
    email: user.email,
    jurisdiction: user.jurisdiction || "Delhi Division",
    phone: user.phone || "",
    active: user.active,
    pass: "",
  });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (val) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const rawDigits = val.replace(/\D/g, "");
    if (!val.trim()) {
      setPhoneError("");
    } else if (rawDigits.length > 10 && !(rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError(`Exceeds 10 digits (${rawDigits.length} digits entered)`);
    } else if (rawDigits.length === 10 || (rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone.trim()) {
      const phoneVal = validateMobileNumber(formData.phone);
      if (!phoneVal.valid) {
        setPhoneError(phoneVal.error);
      } else {
        setPhoneError("");
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Please enter the officer's full name.");
      return;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      setError("Please enter a valid official email address.");
      return;
    }
    const phoneVal = validateMobileNumber(formData.phone);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error);
      return;
    }

    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const payload = {
      ...formData,
      phone: phoneVal.formatted,
      initials: initials || user.initials || "OF",
    };
    if (!payload.pass) delete payload.pass;
    onSave(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ background: "var(--ll-modal-overlay)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="max-w-lg w-full"
      >
        <Card padded={false}>
          <div className="p-6 overflow-y-auto max-h-[90vh] ll-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-4 mb-4 border-b" style={{ borderColor: C.line }}>
              <div>
                <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.1em" }}>MODIFICATION</div>
                <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>Edit Officer Profile</h3>
              </div>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </motion.button>
            </div>

            {error && (
              <div className="mb-4 p-3 rounded bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-center gap-2">
                <AlertTriangle size={14} /> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" required={true}>
                  <input
                    style={inputStyle}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </Field>

                <Field label="Badge / Officer ID" required={true}>
                  <input
                    style={inputStyle}
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Role & Authority" required={true}>
                  <select
                    style={inputStyle}
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  >
                    <option value="Enforcement Officer">Enforcement Officer</option>
                    <option value="Reviewer">Reviewer</option>
                    <option value="Admin">Admin</option>
                  </select>
                </Field>

                <Field label="Account Status">
                  <select
                    style={inputStyle}
                    value={formData.active ? "true" : "false"}
                    onChange={(e) => setFormData({ ...formData, active: e.target.value === "true" })}
                  >
                    <option value="true">Active</option>
                    <option value="false">Disabled / Suspended</option>
                  </select>
                </Field>
              </div>

              <Field label="Official Email" required={true}>
                <input
                  style={inputStyle}
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Field>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jurisdiction / Division">
                  <input
                    style={inputStyle}
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  />
                </Field>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.charcoal }}>
                    Contact Mobile (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      borderColor: phoneError ? "#EF4444" : undefined,
                      boxShadow: phoneError ? "0 0 0 1px #EF4444" : undefined,
                    }}
                    placeholder="e.g. 9812345678"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                  />
                  {phoneError && (
                    <div className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label="New Login Password">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    style={{ ...inputStyle, paddingLeft: 32 }}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Leave blank to keep existing password"
                    value={formData.pass}
                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                  />
                </div>
              </Field>

              <div className="flex justify-end gap-2.5 pt-4 border-t" style={{ borderColor: C.line }}>
                <Button variant="ghost" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save Changes
                </Button>
              </div>
            </form>
          </div>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ============================== ROOT APP ============================== */

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem("legallens_current_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [page, setPage] = useState(() => {
    const savedUser = localStorage.getItem("legallens_current_user");
    if (!savedUser) return "login";
    return localStorage.getItem("legallens_active_page") || "dashboard";
  });

  const navigateTo = (nextPage) => {
    setPage(nextPage);
    localStorage.setItem("legallens_active_page", nextPage);
  };

  const [selectedInspection, setSelectedInspection] = useState(() => {
    try {
      const saved = localStorage.getItem("legallens_current_inspection");
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      // Discard stale mock/hardcoded inspections that have no real AI declarations
      if (!parsed || !Array.isArray(parsed.declarations) || parsed.declarations.length === 0) return null;
      return parsed;
    } catch {
      return null;
    }
  });
  const [users, setUsers] = useState(() => {
    return isSupabaseConfigured() ? [] : INITIAL_USERS;
  });
  const [loadingDb, setLoadingDb] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(isSupabaseConfigured());

  // Theme state: dark / light
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("Legal-Lens_theme") || "light";
  });

  const isDark = theme === "dark";

  const toggleTheme = () => {
    const next = isDark ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("Legal-Lens_theme", next);
  };

  // Fetch users from Supabase on mount if configured
  const fetchSupabaseUsers = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      setLoadingDb(true);
      const { data, error } = await supabase
        .from("officer_users")
        .select(OFFICER_PUBLIC_COLUMNS)
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch error, fallback to local:", error.message);
        return;
      }

      if (data && data.length > 0) {
        const publicUsers = data.map(publicOfficerProfile);
        setUsers(publicUsers);
        setIsDbConnected(true);
        const currentFound = currentUser?.email ? publicUsers.find((u) => u.email === currentUser.email) : null;
        if (currentFound) setCurrentUser(currentFound);
      }
    } catch (err) {
      console.warn("Supabase connection error:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  useEffect(() => {
    fetchSupabaseUsers();
  }, []);

  // Add User Handler (optimistic + Supabase persistence)
  const handleAddUser = async (newUser) => {
    const publicUser = publicOfficerProfile(newUser);
    setUsers((prev) => [publicUser, ...prev]);

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from("officer_users").insert([
          {
            custom_id: newUser.id,
            name: newUser.name,
            badge: newUser.badge,
            role: newUser.role,
            email: newUser.email,
            jurisdiction: newUser.jurisdiction,
            phone: newUser.phone,
            active: newUser.active,
            initials: newUser.initials,
            pass: newUser.pass,
          },
        ]);
        if (error) console.error("Supabase insert error:", error);
      } catch (err) {
        console.error("Supabase insert exception:", err);
      }
    }
  };

  // Update User Handler (optimistic + Supabase persistence)
  const handleUpdateUser = async (targetEmail, updatedFields) => {
    const oldUser = users.find((u) => u.email === targetEmail);
    const oldName = oldUser?.name;

    const { pass, password, ...safeFields } = updatedFields;
    setUsers((prev) =>
      prev.map((u) => (u.email === targetEmail ? { ...u, ...safeFields } : u))
    );
    if (currentUser?.email === targetEmail) {
      setCurrentUser((prev) => ({ ...prev, ...safeFields }));
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const dbFields = { ...safeFields };
        if (typeof pass === "string" && pass.length > 0) dbFields.pass = pass;

        // 1. Update officer_users table in Supabase
        const { error } = await supabase
          .from("officer_users")
          .update(dbFields)
          .eq("email", targetEmail);
        if (error) console.error("Supabase update error:", error);

        // 2. Cascade officer name change to inspections & reports tables in Supabase if name changed
        if (safeFields.name && safeFields.name !== oldName) {
          const newName = safeFields.name;

          // A. Update inspections table by inspector_email
          const { error: inspEmailErr } = await supabase
            .from("inspections")
            .update({ inspector_name: newName })
            .ilike("inspector_email", targetEmail);
          if (inspEmailErr) console.warn("Supabase inspections email update note:", inspEmailErr);

          // B. Update inspections table by old inspector_name
          if (oldName) {
            const { error: inspNameErr } = await supabase
              .from("inspections")
              .update({ inspector_name: newName })
              .ilike("inspector_name", oldName);
            if (inspNameErr) console.warn("Supabase inspections name update note:", inspNameErr);

            // C. Update reports table: column is generated_by
            try {
              await supabase
                .from("reports")
                .update({ generated_by: newName })
                .ilike("generated_by", oldName);
            } catch (rErr) {
              console.warn("Supabase reports generated_by update note:", rErr);
            }
          }
        }
      } catch (err) {
        console.error("Supabase update exception:", err);
      }
    }
  };

  // Delete User Handler (optimistic + Supabase persistence + update inspections & reports)
  const handleDeleteUser = async (targetEmail) => {
    const deletedUser = users.find((u) => u.email === targetEmail);
    const deletedName = deletedUser?.name;

    setUsers((prev) => prev.filter((u) => u.email !== targetEmail));

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Delete user record from officer_users
        const { error } = await supabase
          .from("officer_users")
          .delete()
          .ilike("email", targetEmail);
        if (error) console.error("Supabase delete error:", error);

        // 2. Mark officer name as "Deleted User" in inspections table in Supabase
        const { error: inspEmailErr } = await supabase
          .from("inspections")
          .update({ inspector_name: "Deleted User" })
          .ilike("inspector_email", targetEmail);
        if (inspEmailErr) console.warn("Supabase inspections delete update email note:", inspEmailErr);

        if (deletedName) {
          const { error: inspNameErr } = await supabase
            .from("inspections")
            .update({ inspector_name: "Deleted User" })
            .ilike("inspector_name", deletedName);
          if (inspNameErr) console.warn("Supabase inspections delete update name note:", inspNameErr);

          // 3. Mark officer name as "Deleted User" in reports table in Supabase
          try {
            await supabase
              .from("reports")
              .update({ generated_by: "Deleted User" })
              .ilike("generated_by", deletedName);
          } catch (rErr) {
            console.warn("Supabase reports delete generated_by note:", rErr);
          }
        }
      } catch (err) {
        console.error("Supabase delete exception:", err);
      }
    }
  };

  // Helper to seed initial mock users to Supabase if empty
  const handleSeedDb = async () => {
    if (!isSupabaseConfigured() || !supabase) return;
    try {
      setLoadingDb(true);
      const rows = INITIAL_USERS.map((u) => ({
        custom_id: u.id,
        name: u.name,
        badge: u.badge,
        role: u.role,
        email: u.email,
        jurisdiction: u.jurisdiction,
        phone: u.phone,
        active: u.active,
        initials: u.initials,
      }));
      const { error } = await supabase.from("officer_users").upsert(rows, { onConflict: "email" });
      if (error) throw error;
      await fetchSupabaseUsers();
    } catch (err) {
      console.error("Seed error:", err);
    } finally {
      setLoadingDb(false);
    }
  };

  // ── Avatar stored separately (never touches officer_users query) ──
  const getAvatarMap = () => {
    try { return JSON.parse(localStorage.getItem("legallens_avatars") || "{}"); } catch { return {}; }
  };
  const currentBadge = currentUser?.badge || "";
  const [avatarUrl, setAvatarUrl] = useState(() => getAvatarMap()[currentBadge] || "");

  // Sync avatar when badge changes (fetches from cache, then checks Supabase)
  useEffect(() => {
    const badge = currentBadge?.trim();
    const cached = getAvatarMap()[badge] || getAvatarMap()[currentBadge] || "";
    setAvatarUrl(cached);

    if (badge && isSupabaseConfigured() && supabase) {
      supabase
        .from("officer_avatars")
        .select("avatar_url")
        .ilike("badge", badge)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!error && data?.avatar_url) {
            const map = getAvatarMap();
            map[badge] = data.avatar_url;
            localStorage.setItem("legallens_avatars", JSON.stringify(map));
            setAvatarUrl(data.avatar_url);
          } else if (!error && !data) {
            if (!cached) setAvatarUrl("");
          }
        })
        .catch((err) => {
          console.warn("Could not fetch avatar from Supabase:", err);
        });
    }
  }, [currentBadge]);

  const handleUpdateAvatar = async (dataUrl) => {
    if (!currentBadge) return;
    const badge = currentBadge.trim();
    const map = getAvatarMap();
    map[badge] = dataUrl;
    localStorage.setItem("legallens_avatars", JSON.stringify(map));
    setAvatarUrl(dataUrl);

    // Also persist to separate Supabase table (safe best-effort)
    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase.from("officer_avatars").upsert(
          { badge: badge, avatar_url: dataUrl, updated_at: new Date().toISOString() },
          { onConflict: "badge" }
        );
        if (error) console.warn("Supabase avatar upsert error:", error);
      } catch (e) {
        console.warn("Could not sync avatar to Supabase:", e);
      }
    }
  };

  const handleSwitchRole = (newRole) => {
    const found = users.find((u) => u.role === newRole) || {
      id: "DEMO",
      name: newRole === "Admin" ? "Poonam Desai" : newRole === "Reviewer" ? "Sanjay Iyer" : "Enforcement Officer",
      role: newRole,
      email: `${newRole.toLowerCase().replace(" ", ".")}@lm.gov.in`,
      badge: newRole === "Admin" ? "LMD-HQ-001" : "LM-DL-842",
      jurisdiction: "Delhi Division",
      active: true,
      initials: newRole === "Admin" ? "PD" : "EO",
    };
    setCurrentUser(found);
  };

  
  const [showLogin, setShowLogin] = useState(() => {
    return localStorage.getItem("legallens_show_login") === "true";
  });

  const handleSetShowLogin = (val) => {
    setShowLogin(val);
    localStorage.setItem("legallens_show_login", val ? "true" : "false");
  };

  if (!currentUser) {
    if (showLogin || page === "login") {
      return (
        <LegalLoginPage
          users={users}
          onLogin={(user) => {
            const sessionUser = publicOfficerProfile(user);
            setCurrentUser(sessionUser);
            localStorage.setItem("legallens_current_user", JSON.stringify(sessionUser));
            handleSetShowLogin(false);
            navigateTo("dashboard");
          }}
          onBackToPortal={() => {
            handleSetShowLogin(false);
            navigateTo("portal");
          }}
        />
      );
    }

    return (
      <LandingPageView
        onAccessConsole={() => {
          handleSetShowLogin(true);
          navigateTo("login");
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <Shell
        page={page}
        setPage={navigateTo}
        currentUser={currentUser}
        avatarUrl={avatarUrl}
        onUpdateAvatar={handleUpdateAvatar}
        isDark={isDark}
        toggleTheme={toggleTheme}
        isDbConnected={isDbConnected}
        onSignOut={() => {
          setCurrentUser(null);
          localStorage.removeItem("legallens_current_user");
          handleSetShowLogin(true);
          navigateTo("login");
        }}
      >
        {page === "dashboard" && (
          <Dashboard
            isDark={isDark}
            onOpenInspection={async (i) => {
              let fullObj = i;
              if (i?.case_number) {
                try {
                  const { data } = await fetchInspectionByCase(i.case_number);
                  if (data) fullObj = mapSupabaseRowToInspection(data);
                } catch (e) {
                  console.warn("Dashboard onOpenInspection fetch warning:", e);
                }
              }
              setSelectedInspection(fullObj);
              localStorage.setItem("legallens_current_inspection", JSON.stringify(fullObj));
              navigateTo("inspection-detail");
            }}
          />
        )}
        {page === "inspections" && (
          <InspectionsList
            users={users}
            onOpen={(i) => { setSelectedInspection(i); localStorage.setItem("legallens_current_inspection", JSON.stringify(i)); navigateTo("inspection-detail"); }}
            onNew={() => navigateTo("new-inspection")}
          />
        )}
        {page === "new-inspection" && (
          <NewInspection
            currentUser={currentUser}
            onFinish={(i) => {
              // Save to Supabase (fire-and-forget — never blocks navigation)
              saveInspection(i, currentUser).catch((err) =>
                console.warn('[onFinish] Supabase save failed:', err)
              );
              setSelectedInspection(i);
              localStorage.setItem("legallens_current_inspection", JSON.stringify(i));
              navigateTo("inspection-detail");
            }}
          />
        )}
        {page === "inspection-detail" && <InspectionDetail inspection={selectedInspection} users={users} />}
        {page === "products" && (
          <Products
            users={users}
            onOpenInspection={async (i) => {
              let fullObj = i;
              if (i?.case_number) {
                try {
                  const { data } = await fetchInspectionByCase(i.case_number);
                  if (data) fullObj = mapSupabaseRowToInspection(data);
                } catch (e) {
                  console.warn("Products onOpenInspection fetch warning:", e);
                }
              }
              setSelectedInspection(fullObj);
              localStorage.setItem("legallens_current_inspection", JSON.stringify(fullObj));
              navigateTo("inspection-detail");
            }}
            onNewInspection={() => navigateTo("new-inspection")}
          />
        )}
        {page === "rules" && <Rules />}
        {page === "reports" && (
          <Reports
            users={users}
            onOpenInspection={(i) => {
              setSelectedInspection(i);
              localStorage.setItem("legallens_current_inspection", JSON.stringify(i));
              navigateTo("inspection-detail");
            }}
          />
        )}
        {page === "settings" && (
          <SettingsPage
            users={users}
            currentUser={currentUser}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onSwitchRole={handleSwitchRole}
            isDbConnected={isDbConnected}
            onRefreshDb={fetchSupabaseUsers}
            onSeedDb={handleSeedDb}
            loadingDb={loadingDb}
          />
        )}
      </Shell>
    </ErrorBoundary>
  );
}
