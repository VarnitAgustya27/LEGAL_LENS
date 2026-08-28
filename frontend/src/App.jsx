import ApiService from "./services/api.js";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ClipboardList, FilePlus2, Package, FileText, ScrollText,
  Settings, Users, LogOut, Search, UploadCloud, Camera, ChevronRight, ChevronLeft,
  ChevronDown, CheckCircle2, XCircle, AlertTriangle, ZoomIn, X, Filter, Calendar,
  MapPin, Phone, Mail, ShieldCheck, ShieldAlert, ShieldQuestion, ScanLine,
  ArrowLeft, ArrowRight, Download, Eye, Loader2, Building2, Hash, Lock, Unlock,
  User, Plus, Info, Edit, Trash2, UserPlus, UserCheck, UserX, Shield, RefreshCw, Key,
  Sun, Moon, Sparkles, Database
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line,
} from "recharts";
import { supabase, isSupabaseConfigured } from "./supabaseClient";

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
      --ll-modal-overlay: rgba(19,34,56,0.6);
      --ll-hatch-line: rgba(19,34,56,0.05);
    }

    .ll-root.dark, .dark {
      --ll-bg-paper: #090E17;
      --ll-bg-paper-deep: #0F1726;
      --ll-bg-card: #131E30;
      --ll-bg-header: #0D1524;
      --ll-bg-sidebar: #070B12;
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
      --ll-modal-overlay: rgba(3,7,18,0.8);
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
    .ll-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .ll-scroll::-webkit-scrollbar-thumb { background: #556987; border-radius: 4px; }
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
  const pad = size === "sm" ? "2px 9px" : "5px 14px";
  const fs = size === "sm" ? 11 : 12.5;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-sm border transition-colors"
      style={{ background: m.bg, borderColor: m.bd, color: m.color, padding: pad, fontSize: fs, fontWeight: 600, letterSpacing: "0.03em", ...FONT.body }}
    >
      <m.Icon size={size === "sm" ? 12 : 14} strokeWidth={2.3} />
      {m.label.toUpperCase()}
    </span>
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
    <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5" style={{ background: m.bg, borderColor: m.bd, color: m.c, fontWeight: 700, fontSize: 11, letterSpacing: "0.04em" }}>
      <m.Icon size={12.5} /> {status}
    </span>
  );
}

function VerdictStamp({ status, caseNo }) {
  const m = StatusMeta(status);
  return (
    <div
      className="ll-stamp inline-flex flex-col items-center justify-center border-2 rounded-full px-6 py-4 transition-transform hover:rotate-0"
      style={{
        borderColor: m.color,
        color: m.color,
        transform: "rotate(-4deg)",
        background: "repeating-radial-gradient(circle at 50% 50%, transparent 0, transparent 2px)",
        minWidth: 190,
      }}
    >
      <div className="border rounded-full w-full h-full absolute inset-1 pointer-events-none" style={{ borderColor: m.color, opacity: 0.45 }} />
      <m.Icon size={22} strokeWidth={2} className="mb-1" />
      <div style={{ ...FONT.display, fontWeight: 700, fontSize: 15.5, letterSpacing: "0.06em", lineHeight: 1.1 }}>
        {m.label.toUpperCase()}
      </div>
      <div style={{ ...FONT.mono, fontSize: 9.5, letterSpacing: "0.08em", opacity: 0.8, marginTop: 3 }}>{caseNo}</div>
    </div>
  );
}

function Card({ children, className = "", style, padded = true }) {
  return (
    <div
      className={`border rounded-sm transition-colors shadow-sm ${className}`}
      style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-charcoal)", ...style }}
    >
      <div className={padded ? "p-5" : ""}>{children}</div>
    </div>
  );
}

function SectionLabel({ eyebrow, title, right }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        {eyebrow && <div style={{ ...FONT.mono, fontSize: 11, letterSpacing: "0.12em", color: C.gold, fontWeight: 600 }}>{eyebrow}</div>}
        <h2 style={{ ...FONT.display, fontSize: 20, color: C.ink, fontWeight: 600 }}>{title}</h2>
      </div>
      {right}
    </div>
  );
}

function Button({ children, variant = "primary", onClick, className = "", type = "button", size = "md", disabled = false }) {
  const base = "ll-focus inline-flex items-center justify-center gap-2 rounded-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "px-3 py-1.5 text-[12.5px]" : "px-4 py-2.5 text-[13.5px]";
  const styles = {
    primary: { background: "var(--ll-button-primary-bg)", color: "var(--ll-button-primary-color)", border: "none" },
    ghost: { background: "transparent", color: "var(--ll-color-ink)", border: "1px solid var(--ll-color-line)" },
    outline: { background: "var(--ll-bg-card)", color: "var(--ll-color-ink)", border: "1px solid var(--ll-color-ink)" },
    danger: { background: "var(--ll-violation)", color: "#fff", border: "none" },
    gold: { background: "var(--ll-color-gold)", color: "#fff", border: "none" },
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${base} ${sizes} ${className}`} style={{ ...styles[variant], ...FONT.body }}>
      {children}
    </button>
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
  width: "100%", padding: "9px 11px", border: "1px solid var(--ll-color-line)", borderRadius: 2,
  background: "var(--ll-input-bg)", fontSize: 13.5, color: "var(--ll-input-text)", ...FONT.body,
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
  { month: "Mar", inspections: 96 }, { month: "Apr", inspections: 121 },
  { month: "May", inspections: 142 }, { month: "Jun", inspections: 158 },
  { month: "Jul", inspections: 176 }, { month: "Aug", inspections: 203 },
];

const COMMON_VIOLATIONS = [
  { rule: "PCR-MRP-001", desc: "MRP declaration missing or illegible", count: 84 },
  { rule: "PCR-COO-004", desc: "Country of origin not declared", count: 57 },
  { rule: "PCR-CC-007", desc: "Consumer care details incomplete", count: 45 },
  { rule: "PCR-NQ-002", desc: "Net quantity in non-standard unit", count: 33 },
];

const INSPECTIONS = [
  { id: "LM/2026/000482", product: "Nutrimax Glucose Biscuits 200g", category: "Packaged Food", manufacturer: "Nutrimax Foods Pvt. Ltd.", status: "NON_COMPLIANT", inspector: "R. Bhaskaran", date: "2026-08-24", location: "Karol Bagh, Delhi" },
  { id: "LM/2026/000481", product: "Silkessence Herbal Shampoo 340ml", category: "Cosmetics", manufacturer: "Silkessence Care Ltd.", status: "REVIEW", inspector: "A. Mehta", date: "2026-08-24", location: "Lajpat Nagar, Delhi" },
  { id: "LM/2026/000479", product: "Suvarna Refined Sunflower Oil 1L", category: "Packaged Food", manufacturer: "Suvarna Agro Industries", status: "COMPLIANT", inspector: "S. Iyer", date: "2026-08-23", location: "Connaught Place, Delhi" },
  { id: "LM/2026/000477", product: "Zesto Orange Drink 500ml", category: "Beverages", manufacturer: "Zesto Beverages Pvt. Ltd.", status: "COMPLIANT", inspector: "R. Bhaskaran", date: "2026-08-22", location: "Rohini, Delhi" },
  { id: "LM/2026/000474", product: "Glow & Co. Vitamin C Cream 50g", category: "Cosmetics", manufacturer: "Glow & Co. Cosmetics (Imported)", status: "NON_COMPLIANT", inspector: "A. Mehta", date: "2026-08-21", location: "Nehru Place, Delhi" },
  { id: "LM/2026/000470", product: "Crispo Potato Wafers 90g", category: "Packaged Food", manufacturer: "Crispo Snacks Ltd.", status: "NON_COMPLIANT", inspector: "S. Iyer", date: "2026-08-20", location: "Dwarka, Delhi" },
  { id: "LM/2026/000468", product: "HomeShine Dish Wash Gel 500ml", category: "Household Chemicals", manufacturer: "HomeShine Chemicals Pvt. Ltd.", status: "COMPLIANT", inspector: "R. Bhaskaran", date: "2026-08-19", location: "Pitampura, Delhi" },
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
  { key: "manufacturer", label: "Manufacturer / Packer Details", status: "PASS", confidence: 98, rule: "PCR-MFR-003", reason: "Manufacturer name and full address detected and legible." },
  { key: "netQty", label: "Net Quantity", status: "PASS", confidence: 99, rule: "PCR-NQ-002", reason: "Declared as 200 g, standard unit, consistent with package size." },
  { key: "mrp", label: "Maximum Retail Price (MRP)", status: "FAIL", confidence: 94, rule: "PCR-MRP-001", reason: "MRP field is present but the 'inclusive of all taxes' qualifier is missing." },
  { key: "coo", label: "Country of Origin", status: "PASS", confidence: 97, rule: "PCR-COO-004", reason: "Not applicable — domestically manufactured; declaration correctly omitted." },
  { key: "consumerCare", label: "Consumer Care Details", status: "REVIEW", confidence: 71, rule: "PCR-CC-007", reason: "Phone number partially obstructed by a fold in the packaging; manual check advised." },
  { key: "mfgDate", label: "Manufacturing / Packing Date", status: "PASS", confidence: 96, rule: "PCR-MD-005", reason: "Packing date clearly printed and within expected format." },
  { key: "bestBefore", label: "Best Before Date", status: "PASS", confidence: 95, rule: "PCR-BB-006", reason: "Best before period declared and legible." },
];

const EXTRACTED_DECLARATION = {
  "Product Name": "Nutrimax Glucose Biscuits",
  "Generic Name": "Glucose Biscuits",
  "Net Quantity": "200 g",
  "MRP": "₹ 20.00 (tax qualifier missing)",
  "Manufacturer": "Nutrimax Foods Pvt. Ltd., Sonepat, Haryana",
  "Packing Date": "07/2026",
  "Best Before": "12 months from packing",
  "Consumer Care": "1800-XXX-XX99 (partially obstructed)",
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
  { id: "USR-002", name: "Rangan Bhaskaran", role: "Enforcement Officer", email: "r.bhaskaran@lm.gov.in", badge: "LMD-DL-0412", jurisdiction: "Delhi North & Central", active: true, phone: "+91 98230 45612", initials: "RB" },
  { id: "USR-003", name: "Aditi Mehta", role: "Enforcement Officer", email: "a.mehta@lm.gov.in", badge: "LMD-DL-0418", jurisdiction: "Delhi South & East", active: true, phone: "+91 98765 43210", initials: "AM" },
  { id: "USR-004", name: "Sanjay Iyer", role: "Reviewer", email: "s.iyer@lm.gov.in", badge: "LMD-REV-008", jurisdiction: "Appellate & Review Cell", active: true, phone: "+91 99100 87654", initials: "SI" },
  { id: "USR-005", name: "Karan Vohra", role: "Reviewer", email: "k.vohra@lm.gov.in", badge: "LMD-REV-014", jurisdiction: "Special Compliance Unit", active: false, phone: "+91 98321 09876", initials: "KV" },
];

const PIPELINE_STAGES = [
  "Image preprocessing", "Text region detection", "OCR extraction",
  "Declaration structuring", "Product classification", "Applicable rule retrieval",
  "Compliance validation", "Evidence mapping", "Report generation",
];

/* ============================== LOGIN ============================== */

function Login({ onLogin, users, isDark, toggleTheme }) {
  const [selectedRole, setSelectedRole] = useState("Admin");
  const [officerId, setOfficerId] = useState("LMD-HQ-001");

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === "Admin") setOfficerId("LMD-HQ-001");
    else if (role === "Enforcement Officer") setOfficerId("LMD-DL-0412");
    else if (role === "Reviewer") setOfficerId("LMD-REV-008");
  };

  const handleSignIn = () => {
    const matched = users.find((u) => u.role === selectedRole && u.active) || {
      id: "USR-TEMP",
      name: selectedRole === "Admin" ? "Poonam Desai" : selectedRole === "Reviewer" ? "Sanjay Iyer" : "Rangan Bhaskaran",
      role: selectedRole,
      email: `${selectedRole.toLowerCase().replace(" ", ".")}@lm.gov.in`,
      badge: officerId,
      jurisdiction: "Delhi Division",
      active: true,
      initials: selectedRole === "Admin" ? "PD" : selectedRole === "Reviewer" ? "SI" : "RB"
    };
    onLogin(matched);
  };

  return (
    <div className="min-h-screen w-full flex" style={{ background: "var(--ll-bg-paper)" }}>
      <div className="hidden md:flex w-[42%] flex-col justify-between p-12 ll-hatch" style={{ background: "var(--ll-bg-sidebar)", color: "#EDEAE0" }}>
        <div>
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <ScanLine size={22} strokeWidth={2.2} style={{ color: "#C7A75A" }} />
              <span style={{ ...FONT.mono, fontSize: 12, letterSpacing: "0.22em", color: "#C7A75A" }}>LEGAL METROLOGY DIVISION</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="ll-focus flex items-center justify-center w-8 h-8 rounded-full border transition-all hover:scale-105"
              style={{
                borderColor: isDark ? "rgba(229,184,66,0.5)" : "rgba(255,255,255,0.25)",
                background: isDark ? "rgba(229,184,66,0.15)" : "rgba(255,255,255,0.1)",
                color: isDark ? "#E5B842" : "#E2E8F0",
              }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
          <h1 style={{ ...FONT.display, fontSize: 42, fontWeight: 700, letterSpacing: "0.01em", marginTop: 18, color: "#F7F5EF" }}>
            Legal-Lens
          </h1>
          <p style={{ ...FONT.body, fontSize: 14.5, color: "#C7C2B4", maxWidth: 360, marginTop: 14, lineHeight: 1.6 }}>
            AI-assisted compliance inspection for packaged commodities under the Legal Metrology Act, 2009 and the Packaged Commodities Rules, 2011.
          </p>
        </div>
        <div className="border-t pt-6" style={{ borderColor: "rgba(255,255,255,0.15)" }}>
          <div className="grid grid-cols-3 gap-6">
            {[["1284", "Inspections logged"], ["63%", "First-pass compliance"], ["8", "Active rule sets"]].map(([n, l]) => (
              <div key={l}>
                <div style={{ ...FONT.display, fontSize: 22, fontWeight: 700, color: "#F7F5EF" }}>{n}</div>
                <div style={{ ...FONT.body, fontSize: 11.5, color: "#A9A392", marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
          <p style={{ ...FONT.mono, fontSize: 10.5, color: "#847E6E", marginTop: 24, letterSpacing: "0.04em" }}>
            PROTOTYPE — SMART INDIA HACKATHON 2026 · ENFORCEMENT-ASSISTANCE SYSTEM · NOT AN AUTONOMOUS LEGAL AUTHORITY
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm ll-rise">
          <div className="mb-8 md:hidden flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ScanLine size={20} style={{ color: C.gold }} />
              <span style={{ ...FONT.display, fontSize: 22, fontWeight: 700, color: C.ink }}>Legal-Lens</span>
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className="w-8 h-8 rounded-full border flex items-center justify-center"
              style={{ borderColor: "var(--ll-color-line)", color: C.gold }}
            >
              {isDark ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
          <div style={{ ...FONT.mono, fontSize: 11, letterSpacing: "0.14em", color: C.gold, fontWeight: 600 }}>OFFICER SIGN-IN</div>
          <h2 style={{ ...FONT.display, fontSize: 24, fontWeight: 600, color: C.ink, marginTop: 4, marginBottom: 24 }}>Access the inspection console</h2>

          <Field label="Role / Authority Level">
            <div className="relative">
              <select
                className="ll-focus appearance-none"
                style={{ ...inputStyle, paddingRight: 30, fontWeight: 600 }}
                value={selectedRole}
                onChange={(e) => handleRoleChange(e.target.value)}
              >
                <option value="Admin">Admin (Full User & Rule Management)</option>
                <option value="Enforcement Officer">Enforcement Officer (Inspections & Cases)</option>
                <option value="Reviewer">Reviewer (Appeals & Determinations)</option>
              </select>
              <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.slate }} />
            </div>
          </Field>

          <Field label="Officer ID / Badge">
            <div className="relative">
              <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input
                className="ll-focus"
                style={{ ...inputStyle, paddingLeft: 34 }}
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
              />
            </div>
          </Field>

          <Field label="Security Key / Password">
            <div className="relative">
              <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input type="password" className="ll-focus" style={{ ...inputStyle, paddingLeft: 34 }} defaultValue="••••••••••" />
            </div>
          </Field>

          <Button className="w-full mt-2" onClick={handleSignIn}>
            Sign in as {selectedRole} <ArrowRight size={15} />
          </Button>

          <div className="flex items-start gap-2 mt-6 p-3 rounded-sm border" style={{ borderColor: C.line, background: C.paperDeep }}>
            <Info size={14} style={{ color: C.slate, marginTop: 2, flexShrink: 0 }} />
            <p style={{ ...FONT.body, fontSize: 11.5, color: C.slate, lineHeight: 1.5 }}>
              <strong>Tip for Testing:</strong> Select <em>Admin</em> to add and edit user accounts in the Users & Settings section.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== SHELL ============================== */

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "inspections", label: "Inspections", Icon: ClipboardList },
  { key: "new-inspection", label: "New Inspection", Icon: FilePlus2 },
  { key: "products", label: "Products", Icon: Package },
  { key: "rules", label: "Rule Repository", Icon: ScrollText },
  { key: "reports", label: "Reports", Icon: FileText },
  { key: "settings", label: "Users & Settings", Icon: Settings },
];

const PAGE_TITLES = {
  dashboard: ["OVERVIEW", "Enforcement Dashboard"],
  inspections: ["CASE REGISTER", "Inspections"],
  "new-inspection": ["NEW CASE", "New Inspection"],
  "inspection-detail": ["CASE FILE", "Inspection Result"],
  products: ["CATALOGUE", "Products"],
  rules: ["LEGAL FRAMEWORK", "Rule Repository"],
  reports: ["ARCHIVE", "Inspection Reports"],
  settings: ["ADMINISTRATION", "Users & Settings"],
};

function Shell({ page, setPage, currentUser, isDark, toggleTheme, isDbConnected, children }) {
  const [eyebrow, title] = PAGE_TITLES[page] || ["", ""];
  const roleBadgeStyle = {
    Admin: { bg: C.violationBg, color: C.violation, bd: C.violationBd },
    "Enforcement Officer": { bg: "rgba(19,34,56,0.08)", color: C.ink, bd: C.line },
    Reviewer: { bg: C.reviewBg, color: C.review, bd: C.reviewBd },
  }[currentUser?.role] || { bg: "#eee", color: C.slate, bd: C.line };

  return (
    <div className={`ll-root min-h-screen flex ${isDark ? "dark" : ""}`} style={{ background: "var(--ll-bg-paper)", ...FONT.body }}>
      <GlobalStyle />
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: "var(--ll-bg-sidebar)", color: "#DCD8CB" }}>
        
        {/* Top Brand Header with Dark Mode Toggle placed directly to the right of Legal-Lens */}
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button
            type="button"
            onClick={() => setPage("dashboard")}
            className="ll-focus flex items-center gap-2.5 text-left cursor-pointer select-none"
            style={{ background: "transparent", opacity: 1 }}
            title="Go to Home / Dashboard"
          >
            <ScanLine size={20} style={{ color: "#C7A75A", opacity: 1 }} />
            <span style={{ ...FONT.display, fontSize: 19, fontWeight: 700, color: "#F7F5EF", opacity: 1, letterSpacing: "0.02em" }}>
              Legal-Lens
            </span>
          </button>

          {/* AESTHETIC DARK MODE TOGGLE BUTTON */}
          <button
            type="button"
            onClick={toggleTheme}
            className="ll-focus group relative flex items-center justify-center w-8 h-8 rounded-full border transition-all duration-300 hover:scale-110"
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

        <nav className="flex-1 py-4 px-3">
          {NAV.map((n) => {
            const active = page === n.key || (page === "inspection-detail" && n.key === "inspections");
            return (
              <button
                key={n.key}
                onClick={() => setPage(n.key)}
                className="ll-focus w-full flex items-center gap-3 px-3 py-2.5 rounded-sm mb-1 text-left transition-colors"
                style={{
                  background: active ? "rgba(199,167,90,0.16)" : "transparent",
                  color: active ? "#F0E4C4" : "#B7B2A2",
                  borderLeft: active ? "2px solid #C7A75A" : "2px solid transparent",
                }}
              >
                <n.Icon size={16} strokeWidth={2} />
                <span style={{ fontSize: 13, fontWeight: active ? 600 : 500 }}>{n.label}</span>
              </button>
            );
          })}
        </nav>
        <div className="px-3 pb-4">
          <button className="ll-focus w-full flex items-center gap-3 px-3 py-2.5 rounded-sm text-left" style={{ color: "#B7B2A2" }} onClick={() => setPage("login")}>
            <LogOut size={16} />
            <span style={{ fontSize: 13, fontWeight: 500 }}>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="flex items-center justify-between px-8 py-4 border-b transition-colors" style={{ borderColor: C.line, background: "var(--ll-bg-header)" }}>
          <div>
            <div style={{ ...FONT.mono, fontSize: 10.5, letterSpacing: "0.14em", color: C.gold, fontWeight: 600 }}>{eyebrow}</div>
            <h1 style={{ ...FONT.display, fontSize: 23, fontWeight: 600, color: C.ink }}>{title}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
              <input placeholder="Search case no., product, barcode…" className="ll-focus" style={{ ...inputStyle, paddingLeft: 30, width: 260, fontSize: 12.5 }} />
            </div>

            <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: C.line }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--ll-bg-sidebar)", color: "#F0E4C4", ...FONT.display, fontWeight: 700, fontSize: 12 }}>
                {currentUser?.initials || "OF"}
              </div>
              <div className="hidden md:block text-left">
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{currentUser?.name || "Officer"}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span
                    className="inline-block px-1.5 py-0.2 rounded border"
                    style={{ fontSize: 10, fontWeight: 700, background: roleBadgeStyle.bg, color: roleBadgeStyle.color, borderColor: roleBadgeStyle.bd }}
                  >
                    {currentUser?.role || "Enforcement"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 overflow-y-auto ll-scroll p-8">
          <div key={page} className="ll-fade">{children}</div>
        </div>
      </main>
    </div>
  );
}

/* ============================== DASHBOARD ============================== */

function StatCard({ label, value, Icon, color }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <div style={{ ...FONT.body, fontSize: 11.5, color: C.slate, fontWeight: 600, letterSpacing: "0.03em" }}>{label.toUpperCase()}</div>
          <div style={{ ...FONT.display, fontSize: 32, fontWeight: 700, color: C.ink, marginTop: 6 }}>{value}</div>
        </div>
        <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: color + "1A" }}>
          <Icon size={17} style={{ color }} />
        </div>
      </div>
    </Card>
  );
}

function Dashboard({ onOpenInspection, isDark }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Inspections" value={STATS.total.toLocaleString()} Icon={ClipboardList} color={C.ink} />
        <StatCard label="Compliant" value={STATS.compliant} Icon={ShieldCheck} color={C.compliant} />
        <StatCard label="Non-Compliant" value={STATS.nonCompliant} Icon={ShieldAlert} color={C.violation} />
        <StatCard label="Requires Verification" value={STATS.review} Icon={ShieldQuestion} color={C.review} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <Card className="lg:col-span-3">
          <SectionLabel eyebrow="BY CATEGORY" title="Violations by Category" />
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={VIOLATIONS_BY_CATEGORY} margin={{ left: -18 }}>
              <CartesianGrid vertical={false} stroke={isDark ? "#25354C" : "#DAD4C2"} />
              <XAxis dataKey="category" tick={{ fontSize: 10.5, fill: isDark ? "#94A3B8" : "#5B6470" }} interval={0} angle={-12} textAnchor="end" height={50} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470" }} />
              <Tooltip
                cursor={false}
                contentStyle={{ background: "var(--ll-bg-card)", color: "var(--ll-color-charcoal)", borderColor: "var(--ll-color-line)", borderRadius: 4, fontSize: 12, ...FONT.body }}
              />
              <Bar dataKey="violations" fill={isDark ? "#E5B842" : "#132238"} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="lg:col-span-2">
          <SectionLabel eyebrow="MONTHLY" title="Inspection Trend" />
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={TREND} margin={{ left: -18 }}>
              <CartesianGrid vertical={false} stroke={isDark ? "#25354C" : "#DAD4C2"} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470" }} />
              <YAxis tick={{ fontSize: 11, fill: isDark ? "#94A3B8" : "#5B6470" }} />
              <Tooltip
                cursor={{ stroke: isDark ? "#25354C" : "#DAD4C2", strokeWidth: 1 }}
                contentStyle={{ background: "var(--ll-bg-card)", color: "var(--ll-color-charcoal)", borderColor: "var(--ll-color-line)", borderRadius: 4, fontSize: 12, ...FONT.body }}
              />
              <Line type="monotone" dataKey="inspections" stroke={isDark ? "#E5B842" : "#96742E"} strokeWidth={2.5} dot={{ r: 3, fill: isDark ? "#E5B842" : "#96742E" }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
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
              {INSPECTIONS.slice(0, 5).map((i) => (
                <tr key={i.id} className="ll-tr cursor-pointer" onClick={() => onOpenInspection(i)}>
                  <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line, ...FONT.mono, color: C.ink }}>{i.id}</td>
                  <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line, maxWidth: 220 }}>{i.product}</td>
                  <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line }}><StatusBadge status={i.status} /></td>
                  <td className="px-5 py-2.5 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <Card className="lg:col-span-2">
          <SectionLabel eyebrow="RECURRING" title="Most Common Violations" />
          <div className="space-y-3">
            {COMMON_VIOLATIONS.map((v) => (
              <div key={v.rule} className="flex items-center justify-between pb-3 border-b" style={{ borderColor: C.line }}>
                <div className="min-w-0">
                  <div style={{ ...FONT.mono, fontSize: 11, color: C.gold, fontWeight: 600 }}>{v.rule}</div>
                  <div style={{ fontSize: 12.5, color: C.charcoal, marginTop: 1 }}>{v.desc}</div>
                </div>
                <div style={{ ...FONT.display, fontSize: 18, fontWeight: 700, color: C.ink, flexShrink: 0, marginLeft: 12 }}>{v.count}</div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== INSPECTIONS LIST ============================== */

function InspectionsList({ onOpen, onNew }) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const filtered = statusFilter === "ALL" ? INSPECTIONS : INSPECTIONS.filter((i) => i.status === statusFilter);
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
            <input placeholder="Search inspections…" className="ll-focus" style={{ ...inputStyle, paddingLeft: 30, width: 240, fontSize: 12.5 }} />
          </div>
          <select className="ll-focus" style={{ ...inputStyle, width: 170, fontSize: 12.5 }} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="COMPLIANT">Compliant</option>
            <option value="NON_COMPLIANT">Non-Compliant</option>
            <option value="REVIEW">Requires Verification</option>
          </select>
          <select className="ll-focus" style={{ ...inputStyle, width: 170, fontSize: 12.5 }} defaultValue="">
            <option value="">All categories</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <Button variant="ghost" size="sm"><Filter size={13} /> More filters</Button>
        </div>
        <Button onClick={onNew}><FilePlus2 size={15} /> New Inspection</Button>
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 12.5 }}>
          <thead>
            <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
              {["CASE NO.", "PRODUCT", "CATEGORY", "MANUFACTURER", "STATUS", "INSPECTOR", "DATE", ""].map((h) => (
                <th key={h} className="text-left font-semibold px-4 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((i) => (
              <tr key={i.id} className="ll-tr">
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, color: C.ink }}>{i.id}</td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{i.product}</td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.category}</td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.manufacturer}</td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line }}><StatusBadge status={i.status} /></td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.inspector}</td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.date}</td>
                <td className="px-4 py-3 border-b" style={{ borderColor: C.line }}>
                  <button onClick={() => onOpen(i)} className="ll-focus inline-flex items-center gap-1" style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>
                    View <ChevronRight size={13} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

/* ============================== NEW INSPECTION WIZARD ============================== */

const STEPS = ["Upload Images", "Metadata", "Review", "Processing"];

function Dropzone({ label, required }) {
  const [fileName, setFileName] = useState(null);
  const ref = useRef(null);
  return (
    <div>
      <input ref={ref} type="file" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="ll-focus w-full h-32 border-2 border-dashed rounded-sm flex flex-col items-center justify-center gap-2 transition-colors"
        style={{ borderColor: fileName ? "var(--ll-compliant)" : "var(--ll-color-line)", background: fileName ? "var(--ll-compliant-bg)" : "var(--ll-bg-paper-deep)" }}
      >
        {fileName ? <CheckCircle2 size={20} style={{ color: "var(--ll-compliant)" }} /> : <Camera size={20} style={{ color: C.slate }} />}
        <span style={{ fontSize: 12, fontWeight: 600, color: fileName ? "var(--ll-compliant)" : "var(--ll-color-charcoal)" }}>{label}{required && <span style={{ color: "var(--ll-violation)" }}> *</span>}</span>
        <span style={{ fontSize: 10.5, color: C.slate, maxWidth: 180, textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {fileName || "Click to upload or capture"}
        </span>
      </button>
    </div>
  );
}

function NewInspection({ onFinish }) {
  const [step, setStep] = useState(0);
  return (
    <div className="max-w-4xl">

      {/* SIH Golden Demo Presets (1-Click Compliance Test) */}
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
            } catch(e) {
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
            } catch(e) {
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
            } catch(e) {
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
            } catch(e) {
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
            } catch(e) {
              onFinish(INSPECTIONS[1]);
            }
          }}>
            <AlertTriangle size={13} style={{ color: C.review }} /> Case 5: Image Quality Alert
          </Button>
        </div>
      </div>

      <div className="flex items-center mb-8 overflow-x-auto pb-2">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1 last:flex-none min-w-[140px]">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{
                background: idx <= step ? C.ink : "var(--ll-bg-card)", border: `1.5px solid ${idx <= step ? C.ink : "var(--ll-color-line)"}`,
                color: idx <= step ? "var(--ll-button-primary-color)" : C.slate, fontSize: 12, fontWeight: 700, ...FONT.mono,
              }}>{idx + 1}</div>
              <span style={{ fontSize: 12.5, fontWeight: idx === step ? 700 : 500, color: idx <= step ? C.ink : C.slate }}>{s}</span>
            </div>
            {idx < STEPS.length - 1 && <div className="flex-1 h-px mx-3" style={{ background: idx < step ? C.ink : "var(--ll-color-line)" }} />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <Card>
          <SectionLabel eyebrow="STEP 1" title="Upload Product Images" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <Dropzone label="Front" required />
            <Dropzone label="Back" required />
            <Dropzone label="Side" />
            <Dropzone label="Additional" />
          </div>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: C.line }}>
            <Dropzone label="E-commerce listing screenshot (optional)" />
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(1)}>Continue <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <SectionLabel eyebrow="STEP 2" title="Inspection Metadata" right={<span style={{ fontSize: 11.5, color: C.slate }}>All fields optional</span>} />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label="Product Category">
              <select style={inputStyle} defaultValue="">
                <option value="" disabled>Select category</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Product Name">
              <input style={inputStyle} placeholder="e.g. Nutrimax Glucose Biscuits 200g" />
            </Field>
            <Field label="Barcode">
              <input style={inputStyle} placeholder="EAN / UPC" />
            </Field>
            <Field label="Manufacturer">
              <input style={inputStyle} placeholder="Registered manufacturer name" />
            </Field>
            <Field label="Package Width (mm)">
              <input style={inputStyle} type="number" placeholder="For readability calibration" />
            </Field>
            <Field label="Package Height (mm)">
              <input style={inputStyle} type="number" placeholder="For readability calibration" />
            </Field>
            <Field label="Inspection Location">
              <input style={inputStyle} placeholder="Store / market, area, city" />
            </Field>
            <Field label="Inspection Date">
              <input style={inputStyle} type="date" defaultValue="2026-08-28" />
            </Field>
          </div>
          <Field label="Inspector Notes">
            <textarea style={{ ...inputStyle, minHeight: 70 }} placeholder="Observations at point of inspection…" />
          </Field>
          <div className="flex justify-between mt-2">
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft size={15} /> Back</Button>
            <Button onClick={() => setStep(2)}>Continue <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <SectionLabel eyebrow="STEP 3" title="Review Before Submission" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            {[["Images attached", "2 of 4 uploaded"], ["Category", "Packaged Food"], ["Location", "Karol Bagh, Delhi"], ["Inspection Date", "2026-08-28"]].map(([k, v]) => (
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
            <Button onClick={() => setStep(3)}>Submit for Processing <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 3 && <ProcessingScreen onDone={onFinish} />}
    </div>
  );
}

function ProcessingScreen({ onDone }) {
  const [doneCount, setDoneCount] = useState(0);
  useEffect(() => {
    if (doneCount >= PIPELINE_STAGES.length) {
      const t = setTimeout(() => onDone(INSPECTIONS[0]), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDoneCount((c) => c + 1), 550);
    return () => clearTimeout(t);
  }, [doneCount]);

  return (
    <Card>
      <SectionLabel eyebrow="STEP 4" title="Running Compliance Pipeline" />
      <div className="space-y-1">
        {PIPELINE_STAGES.map((s, idx) => {
          const complete = idx < doneCount;
          const active = idx === doneCount;
          return (
            <div key={s} className="flex items-center gap-3 py-2.5 border-b" style={{ borderColor: C.line }}>
              {complete ? <CheckCircle2 size={17} style={{ color: "var(--ll-compliant)" }} /> : active ? <Loader2 size={17} className="animate-spin" style={{ color: C.gold }} /> : <div className="w-4 h-4 rounded-full border" style={{ borderColor: C.line }} />}
              <span style={{ fontSize: 13, fontWeight: complete || active ? 600 : 500, color: complete ? "var(--ll-compliant)" : active ? C.ink : C.slate }}>{s}</span>
              {active && <span style={{ fontSize: 11, color: C.slate, marginLeft: "auto" }}>processing…</span>}
              {complete && <span style={{ fontSize: 11, color: "var(--ll-compliant)", marginLeft: "auto" }}>done</span>}
            </div>
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
  if (!requirement) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ background: "var(--ll-modal-overlay)" }} onClick={onClose}>
      <div className="ll-rise rounded-sm max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 overflow-hidden border shadow-2xl" style={{ background: "var(--ll-bg-card)", borderColor: C.line, maxHeight: "85vh" }} onClick={(e) => e.stopPropagation()}>
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
            <button onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200"><X size={18} /></button>
          </div>
          <ReqStatusChip status={requirement.status} />

          <div className="mt-5 space-y-4">
            <div>
              <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>DETECTED TEXT</div>
              <div style={{ ...FONT.mono, fontSize: 13, color: C.charcoal, marginTop: 3, background: "var(--ll-bg-paper)", border: `1px solid ${C.line}`, padding: "8px 10px", borderRadius: 2 }}>
                {EXTRACTED_DECLARATION[Object.keys(EXTRACTED_DECLARATION).find((k) => k.toLowerCase().includes(requirement.label.split(" ")[0].toLowerCase())) || "Product Name"] || "MRP ₹20.00"}
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
      </div>
    </div>
  );
}

/* ============================== INSPECTION DETAIL ============================== */

function InspectionDetail({ inspection }) {
  const [evidenceReq, setEvidenceReq] = useState(null);
  const insp = inspection || INSPECTIONS[0];
  const passCount = REQUIREMENTS.filter((r) => r.status === "PASS").length;
  const failCount = REQUIREMENTS.filter((r) => r.status === "FAIL").length;
  const reviewCount = REQUIREMENTS.filter((r) => r.status === "REVIEW").length;
  const avgConf = Math.round(REQUIREMENTS.reduce((s, r) => s + r.confidence, 0) / REQUIREMENTS.length);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.08em" }}>{insp.id}</div>
            <h2 style={{ ...FONT.display, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 2 }}>{insp.product}</h2>
            <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: 12.5, color: C.slate }}>
              <span className="flex items-center gap-1.5"><Building2 size={13} /> {insp.manufacturer}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {insp.location}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {insp.date}</span>
              <span className="flex items-center gap-1.5"><User size={13} /> {insp.inspector}</span>
            </div>
          </div>
          <VerdictStamp status={insp.status} caseNo={insp.id} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t" style={{ borderColor: C.line }}>
          {[
            ["Mandatory Declarations", `${passCount} / ${REQUIREMENTS.length}`, "detected & verified"],
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-x-auto" padded={false}>
          <div className="p-5 pb-0"><SectionLabel eyebrow="RULE-BY-RULE" title="Compliance Checklist" /></div>
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
                {["REQUIREMENT", "RULE", "STATUS", "CONFIDENCE", ""].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-2 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {REQUIREMENTS.map((r) => (
                <tr key={r.key} className="ll-tr">
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{r.label}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, fontSize: 11.5, color: C.gold }}>{r.rule}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><ReqStatusChip status={r.status} /></td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.charcoal }}>{r.confidence}%</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                    <button onClick={() => setEvidenceReq(r)} className="ll-focus inline-flex items-center gap-1" style={{ color: C.ink, fontWeight: 600, fontSize: 12 }}>
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
              {Object.entries(EXTRACTED_DECLARATION).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 pb-2 border-b" style={{ borderColor: C.line }}>
                  <dt style={{ fontSize: 11.5, color: C.slate, flexShrink: 0 }}>{k}</dt>
                  <dd style={{ fontSize: 12, color: C.ink, fontWeight: 600, textAlign: "right" }}>{v}</dd>
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
              <option>Confirm AI finding — Non-Compliant</option>
              <option>Override — mark Compliant</option>
              <option>Escalate for senior review</option>
            </select>
            <textarea style={{ ...inputStyle, minHeight: 60, marginBottom: 12 }} placeholder="Officer remarks…" />
            <div className="flex gap-2">
              <Button size="sm" onClick={() => window.open(ApiService.getPdfUrl(insp?.id && typeof insp.id === "number" ? insp.id : 1), "_blank")}><FileText size={13} /> Generate Official PDF</Button>
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

function Products({ onOpen }) {
  return (
    <Card padded={false}>
      <div className="p-5 pb-0"><SectionLabel eyebrow="ALL PRODUCTS" title="Product Catalogue" /></div>
      <table className="w-full" style={{ fontSize: 12.5 }}>
        <thead>
          <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
            {["PRODUCT", "BARCODE", "CATEGORY", "INSPECTIONS", "CURRENT STATUS", ""].map((h) => (
              <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRODUCTS.map((p) => (
            <tr key={p.barcode} className="ll-tr">
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{p.name}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, fontSize: 11.5, color: C.slate }}>{p.barcode}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{p.category}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{p.inspections}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><StatusBadge status={p.status} /></td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                <button onClick={() => onOpen(p)} className="ll-focus inline-flex items-center gap-1" style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}>History <ChevronRight size={13} /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="p-5 border-t" style={{ borderColor: C.line }}>
        <SectionLabel eyebrow="CASE HISTORY" title={`Timeline — ${PRODUCTS[0].name}`} />
        <div className="space-y-0">
          {PRODUCT_HISTORY.map((h, idx) => {
            const m = StatusMeta(h.status);
            return (
              <div key={h.id} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: m.color, background: "var(--ll-bg-card)" }} />
                  {idx < PRODUCT_HISTORY.length - 1 && <div className="w-px flex-1" style={{ background: C.line, minHeight: 34 }} />}
                </div>
                <div className="pb-6">
                  <div className="flex items-center gap-3">
                    <span style={{ ...FONT.mono, fontSize: 11.5, color: C.ink, fontWeight: 600 }}>{h.id}</span>
                    <StatusBadge status={h.status} />
                    <span style={{ fontSize: 11.5, color: C.slate }}>{h.date}</span>
                  </div>
                  <p style={{ fontSize: 12.5, color: C.charcoal, marginTop: 3 }}>{h.note}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

/* ============================== RULES ============================== */

function Rules() {
  const [showAdd, setShowAdd] = useState(false);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p style={{ fontSize: 12.5, color: C.slate, maxWidth: 520 }}>
          Rules are versioned so amendments to the Packaged Commodities Rules can be added without changing application code. The deterministic engine always evaluates against the currently active version.
        </p>
        <Button onClick={() => setShowAdd(true)}><Plus size={15} /> Add Rule</Button>
      </div>

      <Card padded={false} className="overflow-x-auto">
        <table className="w-full" style={{ fontSize: 12.5 }}>
          <thead>
            <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
              {["RULE CODE", "NAME", "APPLICABLE CATEGORY", "SEVERITY", "VERSION", "EFFECTIVE FROM", "STATUS"].map((h) => (
                <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {RULES.map((r) => {
              const sevColor = r.severity === "HIGH" ? C.violation : r.severity === "MEDIUM" ? C.review : C.slate;
              return (
                <tr key={r.code} className="ll-tr">
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, fontWeight: 600, color: C.ink }}>{r.code}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{r.name}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{r.category}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                    <span style={{ color: sevColor, fontWeight: 700, fontSize: 11 }}>{r.severity}</span>
                  </td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, fontSize: 11.5 }}>{r.version}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{r.effective}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                    <span style={{
                      fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 2,
                      background: r.status === "ACTIVE" ? "var(--ll-compliant-bg)" : "var(--ll-bg-paper-deep)",
                      color: r.status === "ACTIVE" ? "var(--ll-compliant)" : C.slate,
                    }}>{r.status}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6" style={{ background: "var(--ll-modal-overlay)" }} onClick={() => setShowAdd(false)}>
          <Card className="ll-rise max-w-lg w-full">
            <div onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <SectionLabel eyebrow="RULE REPOSITORY" title="Add New Rule Version" />
                <button onClick={() => setShowAdd(false)} className="ll-focus p-1 text-slate-400 hover:text-slate-200"><X size={18} /></button>
              </div>
              <div className="grid grid-cols-2 gap-x-4">
                <Field label="Rule Code"><input style={inputStyle} placeholder="e.g. PCR-MRP-001" /></Field>
                <Field label="Severity">
                  <select style={inputStyle}><option>HIGH</option><option>MEDIUM</option><option>LOW</option></select>
                </Field>
                <Field label="Rule Name" ><input style={inputStyle} placeholder="Short descriptive name" /></Field>
                <Field label="Version"><input style={inputStyle} placeholder="e.g. 2026.2" /></Field>
                <Field label="Effective From"><input style={inputStyle} type="date" /></Field>
                <Field label="Applicable Category">
                  <select style={inputStyle}><option>All Categories</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
                </Field>
              </div>
              <Field label="Description & Source"><textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Legal text reference / gazette citation" /></Field>
              <div className="flex justify-end gap-2 mt-2">
                <Button variant="ghost" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={() => setShowAdd(false)}>Save Rule</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ============================== REPORTS ============================== */

function Reports() {
  return (
    <Card padded={false} className="overflow-x-auto">
      <div className="p-5 pb-0"><SectionLabel eyebrow="GENERATED" title="Inspection Reports" /></div>
      <table className="w-full" style={{ fontSize: 12.5 }}>
        <thead>
          <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
            {["CASE NO.", "PRODUCT", "INSPECTOR", "DATE", "STATUS", ""].map((h) => (
              <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {REPORTS.map((r) => (
            <tr key={r.id} className="ll-tr">
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, color: C.ink }}>{r.id}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{r.product}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{r.inspector}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{r.date}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><StatusBadge status={r.status} /></td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                <div className="flex gap-3">
                  <button className="ll-focus inline-flex items-center gap-1" style={{ color: C.ink, fontWeight: 600, fontSize: 12 }}><Eye size={13} /> View</button>
                  <button onClick={() => window.open(ApiService.getPdfUrl(1), "_blank")} className="ll-focus inline-flex items-center gap-1" style={{ color: C.gold, fontWeight: 600, fontSize: 12 }}><Download size={13} /> Official PDF</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
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
          className="fixed bottom-6 right-6 z-50 ll-rise flex items-center gap-3 px-4 py-3 rounded border shadow-lg"
          style={{ background: "var(--ll-bg-sidebar)", color: "#fff", borderColor: C.gold }}
        >
          <CheckCircle2 size={18} style={{ color: "#C7A75A" }} />
          <span style={{ fontSize: 13, fontWeight: 500 }}>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Database Connection & Role Status Banner */}
      <Card className="border-l-4" style={{ borderLeftColor: isAdmin ? "var(--ll-compliant)" : "var(--ll-review)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
              style={{ background: isAdmin ? "var(--ll-compliant-bg)" : "var(--ll-review-bg)" }}
            >
              {isAdmin ? (
                <ShieldCheck size={22} style={{ color: "var(--ll-compliant)" }} />
              ) : (
                <ShieldAlert size={22} style={{ color: "var(--ll-review)" }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ ...FONT.display, fontSize: 16, fontWeight: 700, color: C.ink }}>
                  {isAdmin ? "Administrator Authority Active" : "Restricted Officer View — Read Only"}
                </h3>
                <span
                  className="px-2 py-0.5 rounded text-[10.5px] font-bold uppercase tracking-wider border"
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
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border"
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

          {/* Quick Actions & Role Switcher */}
          <div className="flex flex-col gap-2 items-end">
            <div className="p-2 rounded border" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>
              <div style={{ ...FONT.mono, fontSize: 10, color: C.slate, fontWeight: 600, letterSpacing: "0.08em", marginBottom: 4 }}>
                SIMULATE ROLE (DEMO)
              </div>
              <div className="flex gap-1.5">
                {["Admin", "Enforcement Officer", "Reviewer"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      onSwitchRole(r);
                      showToast(`Switched active session to ${r}`);
                    }}
                    className={`ll-focus px-2 py-0.5 text-xs font-semibold rounded transition-all ${
                      currentUser?.role === r ? "shadow-sm font-bold" : "opacity-75 hover:opacity-100"
                    }`}
                    style={{
                      background: currentUser?.role === r ? C.ink : "var(--ll-bg-card)",
                      color: currentUser?.role === r ? "var(--ll-button-primary-color)" : C.charcoal,
                      border: `1px solid ${currentUser?.role === r ? C.ink : C.line}`,
                    }}
                  >
                    {r === "Admin" ? "★ Admin" : r}
                  </button>
                ))}
              </div>
            </div>

            {isDbConnected && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onRefreshDb}
                  disabled={loadingDb}
                  className="ll-focus inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border hover:bg-slate-700/10 text-slate-400"
                  style={{ borderColor: C.line }}
                >
                  <RefreshCw size={11} className={loadingDb ? "animate-spin" : ""} /> Refresh DB
                </button>
                {users.length === 0 && (
                  <button
                    type="button"
                    onClick={onSeedDb}
                    disabled={loadingDb}
                    className="ll-focus inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-amber-500/20 text-amber-500 border border-amber-500/40 hover:bg-amber-500/30 font-semibold"
                  >
                    <Plus size={11} /> Seed Sample Officers
                  </button>
                )}
              </div>
            )}
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
          <Card key={label} padded={false}>
            <div className="p-4 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 11, color: C.slate, fontWeight: 600, letterSpacing: "0.03em" }}>{label.toUpperCase()}</div>
                <div style={{ ...FONT.display, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 3 }}>{val}</div>
              </div>
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "rgba(199,167,90,0.15)" }}>
                <Icon size={16} style={{ color: col }} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Directory Table Card */}
      <Card padded={false}>
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
                          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                          style={{ background: "var(--ll-bg-sidebar)", color: "#F0E4C4" }}
                        >
                          {u.initials || (u.name ? u.name.slice(0, 2).toUpperCase() : "OF")}
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

      {/* EDIT USER MODAL (ADMIN ONLY) */}
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

      {/* DELETE CONFIRMATION MODAL (ADMIN ONLY) */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--ll-modal-overlay)" }} onClick={() => setDeletingUser(null)}>
          <Card className="ll-rise max-w-md w-full" padded={false}>
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
        </div>
      )}
    </div>
  );
}

/* ============================== ADD USER MODAL ============================== */

function AddUserModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    badge: `LMD-DL-${Math.floor(1000 + Math.random() * 9000)}`,
    role: "Enforcement Officer",
    email: "",
    jurisdiction: "Delhi Central Division",
    phone: "+91 98",
    active: true,
  });
  const [error, setError] = useState("");

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
    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    onAdd({
      ...formData,
      id: `USR-${Date.now().toString().slice(-4)}`,
      initials: initials || "OF",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--ll-modal-overlay)" }} onClick={onClose}>
      <Card className="ll-rise max-w-lg w-full" padded={false}>
        <div className="p-6 overflow-y-auto max-h-[90vh] ll-scroll" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between pb-4 mb-4 border-b" style={{ borderColor: C.line }}>
            <div>
              <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.1em" }}>PROVISION ACCOUNT</div>
              <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>Add New Officer</h3>
            </div>
            <button onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
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

              <Field label="Status">
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
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  style={{ ...inputStyle, paddingLeft: 32 }}
                  type="email"
                  placeholder="v.sharma@lm.gov.in"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Jurisdiction / Division">
                <input
                  style={inputStyle}
                  placeholder="e.g. West Delhi Division"
                  value={formData.jurisdiction}
                  onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                />
              </Field>

              <Field label="Contact Phone">
                <input
                  style={inputStyle}
                  placeholder="+91 98123 45678"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>
            </div>

            <div className="p-3 rounded border text-xs text-slate-400 flex items-start gap-2" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>
              <Key size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <span>
                A temporary single-use activation credential will be automatically generated and linked to this official badge ID.
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
    </div>
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
    phone: user.phone || "+91 ",
    active: user.active,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    onSave({
      ...formData,
      initials: initials || user.initials || "OF",
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "var(--ll-modal-overlay)" }} onClick={onClose}>
      <Card className="ll-rise max-w-lg w-full" padded={false}>
        <div className="p-6 overflow-y-auto max-h-[90vh] ll-scroll" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-start justify-between pb-4 mb-4 border-b" style={{ borderColor: C.line }}>
            <div>
              <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.1em" }}>MODIFICATION</div>
              <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>Edit Officer Profile</h3>
            </div>
            <button onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200">
              <X size={18} />
            </button>
          </div>

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

              <Field label="Contact Phone">
                <input
                  style={inputStyle}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </Field>
            </div>

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
    </div>
  );
}

/* ============================== ROOT APP ============================== */

export default function App() {
  const [page, setPage] = useState("login");
  const [selectedInspection, setSelectedInspection] = useState(INSPECTIONS[0]);
  const [users, setUsers] = useState(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState(INITIAL_USERS[0]); // Default to Admin Poonam Desai
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
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.warn("Supabase fetch error, fallback to local:", error.message);
        return;
      }

      if (data && data.length > 0) {
        setUsers(data);
        setIsDbConnected(true);
        // Sync current user if present
        const currentFound = data.find((u) => u.email === currentUser.email) || data[0];
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
    setUsers((prev) => [newUser, ...prev]);

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
    setUsers((prev) =>
      prev.map((u) => (u.email === targetEmail ? { ...u, ...updatedFields } : u))
    );
    if (currentUser?.email === targetEmail) {
      setCurrentUser((prev) => ({ ...prev, ...updatedFields }));
    }

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("officer_users")
          .update(updatedFields)
          .eq("email", targetEmail);
        if (error) console.error("Supabase update error:", error);
      } catch (err) {
        console.error("Supabase update exception:", err);
      }
    }
  };

  // Delete User Handler (optimistic + Supabase persistence)
  const handleDeleteUser = async (targetEmail) => {
    setUsers((prev) => prev.filter((u) => u.email !== targetEmail));

    if (isSupabaseConfigured() && supabase) {
      try {
        const { error } = await supabase
          .from("officer_users")
          .delete()
          .eq("email", targetEmail);
        if (error) console.error("Supabase delete error:", error);
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

  const handleSwitchRole = (newRole) => {
    const found = users.find((u) => u.role === newRole) || {
      id: "DEMO",
      name: newRole === "Admin" ? "Poonam Desai" : newRole === "Reviewer" ? "Sanjay Iyer" : "Rangan Bhaskaran",
      role: newRole,
      email: `${newRole.toLowerCase().replace(" ", ".")}@lm.gov.in`,
      badge: newRole === "Admin" ? "LMD-HQ-001" : "LMD-DL-0412",
      jurisdiction: "Delhi Division",
      active: true,
      initials: newRole === "Admin" ? "PD" : "RB",
    };
    setCurrentUser(found);
  };

  if (page === "login") {
    return (
      <div className={`ll-root min-h-screen ${isDark ? "dark" : ""}`}>
        <GlobalStyle />
        <Login
          users={users}
          isDark={isDark}
          toggleTheme={toggleTheme}
          onLogin={(user) => {
            setCurrentUser(user);
            setPage("dashboard");
          }}
        />
      </div>
    );
  }

  return (
    <Shell
      page={page}
      setPage={setPage}
      currentUser={currentUser}
      isDark={isDark}
      toggleTheme={toggleTheme}
      isDbConnected={isDbConnected}
    >
      {page === "dashboard" && (
        <Dashboard
          isDark={isDark}
          onOpenInspection={(i) => { setSelectedInspection(i); setPage("inspection-detail"); }}
        />
      )}
      {page === "inspections" && (
        <InspectionsList
          onOpen={(i) => { setSelectedInspection(i); setPage("inspection-detail"); }}
          onNew={() => setPage("new-inspection")}
        />
      )}
      {page === "new-inspection" && (
        <NewInspection onFinish={(i) => { setSelectedInspection(i); setPage("inspection-detail"); }} />
      )}
      {page === "inspection-detail" && <InspectionDetail inspection={selectedInspection} />}
      {page === "products" && <Products onOpen={() => { }} />}
      {page === "rules" && <Rules />}
      {page === "reports" && <Reports />}
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
  );
}
