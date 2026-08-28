import { supabase, isSupabaseConfigured } from "./supabaseClient.js";
import React, { useState, useEffect, useRef } from "react";
import {
  LayoutDashboard, ClipboardList, FilePlus2, Package, FileText, ScrollText,
  Settings, Users, LogOut, Search, UploadCloud, Camera, ChevronRight, ChevronLeft,
  ChevronDown, CheckCircle2, XCircle, AlertTriangle, ZoomIn, X, Filter, Calendar,
  MapPin, Phone, Mail, ShieldCheck, ShieldAlert, ShieldQuestion, ScanLine,
  ArrowLeft, ArrowRight, Download, Eye, Loader2, Building2, Hash, Lock, Unlock,
  User, Plus, Info, Edit, Trash2, UserPlus, UserCheck, UserX, Shield, RefreshCw, Key,
  Sun, Moon, Sparkles, Check
} from "lucide-react";
import ApiService from "./services/api.js";

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
      --ll-bg-paper: #F4F2EC; --ll-bg-paper-deep: #EAE6DA; --ll-bg-card: #FFFFFF; --ll-bg-header: #FBFAF6; --ll-bg-sidebar: #132238;
      --ll-color-ink: #132238; --ll-color-ink-soft: #1E3453; --ll-color-charcoal: #22252A; --ll-color-slate: #5B6470;
      --ll-color-gold: #96742E; --ll-color-line: #DAD4C2; --ll-tr-hover: #F7F5EF; --ll-input-bg: #FFFFFF; --ll-input-text: #22252A;
      --ll-table-head-bg: #FAF8F2; --ll-button-primary-bg: #132238; --ll-button-primary-color: #FFFFFF; --ll-compliant: #3A6B35;
      --ll-compliant-bg: #E7EFE1; --ll-compliant-bd: #B9CDAE; --ll-violation: #9B2C2C; --ll-violation-bg: #F6E7E5;
      --ll-violation-bd: #E0B7B2; --ll-review: #966A16; --ll-review-bg: #FAF0DA; --ll-review-bd: #E7CE9C;
    }
    .ll-root.dark, .dark {
      --ll-bg-paper: #090E17; --ll-bg-paper-deep: #0F1726; --ll-bg-card: #131E30; --ll-bg-header: #0D1524; --ll-bg-sidebar: #070B12;
      --ll-color-ink: #F0F4FA; --ll-color-ink-soft: #CBD5E1; --ll-color-charcoal: #E2E8F0; --ll-color-slate: #94A3B8;
      --ll-color-gold: #E5B842; --ll-color-line: #22344D; --ll-tr-hover: #17243A; --ll-input-bg: #0D1624; --ll-input-text: #F8FAFC;
      --ll-table-head-bg: #101B2B; --ll-button-primary-bg: #E5B842; --ll-button-primary-color: #090E17; --ll-compliant: #4ADE80;
      --ll-compliant-bg: #102619; --ll-compliant-bd: #1E4F2B; --ll-violation: #F87171; --ll-violation-bg: #2C1216;
      --ll-violation-bd: #581C24; --ll-review: #FBBF24; --ll-review-bg: #281D08; --ll-review-bd: #543D10;
    }
    .ll-root * { box-sizing: border-box; }
    .ll-fade { animation: llFade .35s ease both; }
    @keyframes llFade { from { opacity:0 } to { opacity:1 } }
    .ll-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
    .ll-scroll::-webkit-scrollbar-thumb { background: #556987; border-radius: 4px; }
    .ll-focus:focus-visible { outline: 2px solid var(--ll-color-gold); outline-offset: 2px; }
    .ll-tr:hover { background: var(--ll-tr-hover); }
    .ll-stamp { position: relative; }
  `}</style>
);

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
    <span className="inline-flex items-center gap-1.5 rounded-sm border transition-colors" style={{ background: m.bg, borderColor: m.bd, color: m.color, padding: pad, fontSize: fs, fontWeight: 600, ...FONT.body }}>
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
    WARNING: { c: C.review, bg: C.reviewBg, bd: C.reviewBd, Icon: AlertTriangle },
  };
  const m = map[status] || map.REVIEW;
  return (
    <span className="inline-flex items-center gap-1 rounded-sm border px-2 py-0.5" style={{ background: m.bg, borderColor: m.bd, color: m.c, fontWeight: 700, fontSize: 11 }}>
      <m.Icon size={12.5} /> {status}
    </span>
  );
}

function VerdictStamp({ status, caseNo }) {
  const m = StatusMeta(status);
  return (
    <div className="ll-stamp inline-flex flex-col items-center justify-center border-2 rounded-full px-6 py-4" style={{ borderColor: m.color, color: m.color, transform: "rotate(-4deg)", minWidth: 190 }}>
      <div className="border rounded-full w-full h-full absolute inset-1 pointer-events-none" style={{ borderColor: m.color, opacity: 0.45 }} />
      <m.Icon size={22} strokeWidth={2} className="mb-1" />
      <div style={{ ...FONT.display, fontWeight: 700, fontSize: 15.5, letterSpacing: "0.06em", lineHeight: 1.1 }}>{m.label.toUpperCase()}</div>
      <div style={{ ...FONT.mono, fontSize: 9.5, opacity: 0.8, marginTop: 3 }}>{caseNo}</div>
    </div>
  );
}

function Card({ children, className = "", style, padded = true }) {
  return (
    <div className={`border rounded-sm transition-colors shadow-sm ${className}`} style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)", color: "var(--ll-color-charcoal)", ...style }}>
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
      <div style={{ ...FONT.body, fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6 }}>
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

const CATEGORIES = ["Packaged Food", "Cosmetics", "Household Chemicals", "Beverages", "Personal Care", "Stationery"];

const INITIAL_USERS = [
  { id: "USR-001", name: "Poonam Desai", role: "Admin", email: "admin@legallens.gov.in", badge: "LMD-HQ-001", active: true, initials: "PD" },
  { id: "USR-002", name: "R. Bhaskaran", role: "Enforcement Officer", email: "inspector@legallens.gov.in", badge: "LMD-DL-0412", active: true, initials: "RB" },
  { id: "USR-003", name: "A. Mehta", role: "Reviewer", email: "reviewer@legallens.gov.in", badge: "LMD-REV-104", active: true, initials: "AM" },
];

const PIPELINE_STAGES = [
  "Image quality assessment", "Resolution & blur analysis", "Text contour detection",
  "OCR text extraction", "Declaration structuring", "Legal rule retrieval (PCR 2011)",
  "Deterministic compliance validation", "Evidence coordinate mapping", "Report generation ready",
];

/* ============================== LOGIN ============================== */

function Login({ onLogin, users, isDark, toggleTheme }) {
  const [selectedRole, setSelectedRole] = useState("Enforcement Officer");
  const [officerId, setOfficerId] = useState("LMD-DL-0412");

  const handleRoleChange = (role) => {
    setSelectedRole(role);
    if (role === "Admin") setOfficerId("LMD-HQ-001");
    else if (role === "Enforcement Officer") setOfficerId("LMD-DL-0412");
    else if (role === "Reviewer") setOfficerId("LMD-REV-104");
  };

  const handleSignIn = () => {
    const matched = users.find((u) => u.role === selectedRole && u.active) || users[1];
    onLogin(matched);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative" style={{ background: "var(--ll-bg-paper)" }}>
      <div className="absolute top-6 right-6">
        <button
          type="button"
          onClick={toggleTheme}
          className="ll-focus flex items-center justify-center w-9 h-9 rounded-full border shadow-sm transition-all"
          style={{ borderColor: "var(--ll-color-line)", background: "var(--ll-bg-card)", color: C.ink }}
        >
          {isDark ? <Sun size={17} className="text-amber-400" /> : <Moon size={17} />}
        </button>
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3" style={{ background: "var(--ll-bg-sidebar)", color: C.gold }}>
            <ScanLine size={26} />
          </div>
          <h1 style={{ ...FONT.display, fontSize: 28, fontWeight: 700, color: C.ink }}>Legal-Lens</h1>
          <p style={{ ...FONT.body, fontSize: 13, color: C.slate, marginTop: 4 }}>
            AI-Powered Legal Metrology Compliance Assistant
          </p>
          <div className="inline-block mt-2 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold tracking-wider" style={{ background: C.paperDeep, borderColor: C.line, color: C.gold, ...FONT.mono }}>
            SMART INDIA HACKATHON 2026
          </div>
        </div>

        <Card>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: C.slate }}>Select Role</label>
              <div className="grid grid-cols-3 gap-2">
                {["Enforcement Officer", "Reviewer", "Admin"].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => handleRoleChange(r)}
                    className="p-2.5 text-xs font-medium rounded-sm border transition-colors text-center"
                    style={{
                      borderColor: selectedRole === r ? C.ink : C.line,
                      background: selectedRole === r ? "var(--ll-bg-sidebar)" : "var(--ll-bg-card)",
                      color: selectedRole === r ? "#FFF" : C.ink,
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            <Field label="Officer / Badge ID">
              <input style={inputStyle} value={officerId} onChange={(e) => setOfficerId(e.target.value)} />
            </Field>

            <Field label="Password">
              <input style={inputStyle} type="password" defaultValue="password123" />
            </Field>

            <Button className="w-full mt-2" onClick={handleSignIn}>
              Enter Inspector Portal <ArrowRight size={15} />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ============================== NAVIGATION SHELL ============================== */

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "inspections", label: "Inspections", Icon: ClipboardList },
  { key: "new-inspection", label: "New Inspection", Icon: FilePlus2 },
  { key: "rules", label: "Legal Rules", Icon: ScrollText },
  { key: "reports", label: "Reports Archive", Icon: FileText },
  { key: "settings", label: "Settings", Icon: Settings },
];

const PAGE_TITLES = {
  dashboard: ["OVERVIEW", "Enforcement Dashboard"],
  inspections: ["CASE REGISTER", "Inspections Register"],
  "new-inspection": ["NEW CASE", "New Label Inspection"],
  "inspection-detail": ["CASE FILE", "Inspection Findings & Evidence"],
  rules: ["LEGAL FRAMEWORK", "Legal Metrology (PCR 2011) Rules"],
  reports: ["ARCHIVE", "Inspection Reports"],
  settings: ["ADMINISTRATION", "System Settings"],
};

function Shell({ page, setPage, currentUser, isDark, toggleTheme, children }) {
  const [eyebrow, title] = PAGE_TITLES[page] || ["", ""];
  return (
    <div className={`ll-root min-h-screen flex ${isDark ? "dark" : ""}`} style={{ background: "var(--ll-bg-paper)", ...FONT.body }}>
      <GlobalStyle />
      <aside className="w-64 flex-shrink-0 flex flex-col" style={{ background: "var(--ll-bg-sidebar)", color: "#DCD8CB" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <button type="button" onClick={() => setPage("dashboard")} className="ll-focus flex items-center gap-2.5 text-left cursor-pointer">
            <ScanLine size={20} style={{ color: "#C7A75A" }} />
            <span style={{ ...FONT.display, fontSize: 19, fontWeight: 700, color: "#F7F5EF" }}>Legal-Lens</span>
          </button>

          <button
            type="button"
            onClick={toggleTheme}
            className="ll-focus flex items-center justify-center w-8 h-8 rounded-full border transition-all hover:scale-110"
            style={{
              borderColor: isDark ? "rgba(229,184,66,0.6)" : "rgba(255,255,255,0.25)",
              background: isDark ? "rgba(229,184,66,0.18)" : "rgba(255,255,255,0.08)",
              color: isDark ? "#E5B842" : "#E2E8F0",
            }}
          >
            {isDark ? <Sun size={15} className="text-amber-300" /> : <Moon size={15} className="text-slate-200" />}
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
            <div className="flex items-center gap-3 pl-4 border-l" style={{ borderColor: C.line }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--ll-bg-sidebar)", color: "#F0E4C4", ...FONT.display, fontWeight: 700, fontSize: 12 }}>
                {currentUser?.initials || "OF"}
              </div>
              <div className="text-left">
                <div style={{ fontSize: 12.5, fontWeight: 600, color: C.ink }}>{currentUser?.name || "Officer"}</div>
                <span className="inline-block px-1.5 py-0.2 rounded border text-[10px] font-bold" style={{ background: C.paperDeep, color: C.ink, borderColor: C.line }}>
                  {currentUser?.role || "Enforcement"}
                </span>
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

function Dashboard({ onOpenInspection, onNewInspection }) {
  const [stats, setStats] = useState({ total_inspections: 0, compliant_count: 0, non_compliant_count: 0, review_count: 0 });
  const [recentInspections, setRecentInspections] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const s = await ApiService.getDashboardStats();
        if (s) setStats(s);
        const insps = await ApiService.getInspections({ limit: 5 });
        if (insps) setRecentInspections(insps);
      } catch (e) {
        console.error("Dashboard fetch error:", e);
      }
    }
    loadData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Inspections" value={stats.total_inspections} Icon={ClipboardList} color={C.ink} />
        <StatCard label="Compliant" value={stats.compliant_count} Icon={ShieldCheck} color={C.compliant} />
        <StatCard label="Non-Compliant" value={stats.non_compliant_count} Icon={ShieldAlert} color={C.violation} />
        <StatCard label="Requires Review" value={stats.review_count} Icon={ShieldQuestion} color={C.review} />
      </div>

      {stats.total_inspections === 0 ? (
        <Card className="text-center py-12">
          <ScanLine size={44} className="mx-auto mb-3" style={{ color: C.gold }} />
          <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>No Inspections Recorded Yet</h3>
          <p style={{ fontSize: 13, color: C.slate, maxWidth: 450, margin: "8px auto 20px" }}>
            The database is clean and ready. Click below to run an automated label inspection or test a standard Legal Metrology preset.
          </p>
          <Button onClick={onNewInspection}><Plus size={15} /> Start New Inspection</Button>
        </Card>
      ) : (
        <Card padded={false}>
          <div className="p-5 pb-0">
            <SectionLabel eyebrow="RECENT CASES" title="Latest Inspection Cases" />
          </div>
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
                {["CASE NO.", "PRODUCT", "CATEGORY", "STATUS", "SCORE", "ACTION"].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {recentInspections.map((i) => (
                <tr key={i.id} className="ll-tr">
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, fontWeight: 600 }}>{i.case_number}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{i.product?.name}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.product?.category}</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><StatusBadge status={i.status} /></td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 700 }}>{i.score}%</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                    <button onClick={() => onOpenInspection(i)} className="ll-focus inline-flex items-center gap-1" style={{ color: C.ink, fontWeight: 600, fontSize: 12 }}>
                      <Eye size={13} /> View Findings
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}

/* ============================== INSPECTIONS LIST ============================== */

function InspectionsList({ onOpen, onNew }) {
  const [inspections, setInspections] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const data = await ApiService.getInspections({ search });
        if (data) setInspections(data);
      } catch (e) {
        console.error(e);
      }
    }
    load();
  }, [search]);

  return (
    <Card padded={false}>
      <div className="p-5 flex items-center justify-between flex-wrap gap-4 border-b" style={{ borderColor: C.line }}>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.slate }} />
          <input
            placeholder="Filter by case no, product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ ...inputStyle, paddingLeft: 30, width: 280, fontSize: 12.5 }}
          />
        </div>
        <Button onClick={onNew}><Plus size={14} /> New Inspection</Button>
      </div>

      {inspections.length === 0 ? (
        <div className="text-center py-12">
          <p style={{ color: C.slate, fontSize: 13 }}>No inspections found. Click "New Inspection" to start.</p>
        </div>
      ) : (
        <table className="w-full" style={{ fontSize: 12.5 }}>
          <thead>
            <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
              {["CASE NO.", "PRODUCT", "CATEGORY", "STATUS", "SCORE", "CHECKS", ""].map((h) => (
                <th key={h} className="text-left font-semibold px-5 py-3 border-b" style={{ borderColor: C.line }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inspections.map((i) => (
              <tr key={i.id} className="ll-tr">
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line, ...FONT.mono, fontWeight: 600 }}>{i.case_number}</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 500 }}>{i.product?.name}</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.product?.category}</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><StatusBadge status={i.status} /></td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line, fontWeight: 700 }}>{i.score}%</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line, color: C.slate }}>{i.passed_checks}/{i.total_checks} passed</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                  <button onClick={() => onOpen(i)} className="ll-focus inline-flex items-center gap-1" style={{ color: C.ink, fontWeight: 600, fontSize: 12 }}>
                    <Eye size={13} /> View Findings
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ============================== NEW INSPECTION ============================== */

function NewInspection({ onFinish }) {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    product_name: "Nutrimax Glucose Biscuits 200g",
    brand: "Nutrimax",
    category: "Packaged Food",
    barcode: "8901234567890",
    is_imported: false,
    location: "Connaught Place, New Delhi",
    notes: ""
  });
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdInsp, setCreatedInsp] = useState(null);

  const handleCreateAndScan = async () => {
    setIsProcessing(true);
    try {
      const insp = await ApiService.createInspection(formData);
      if (files.length > 0) {
        await ApiService.uploadImages(insp.id, files, "FRONT");
      }
      const scanned = await ApiService.runScan(insp.id);
      setCreatedInsp(scanned);
      setStep(3);
    } catch (e) {
      console.error("Scan error:", e);
      alert("Scan failed: " + e.message);
      setIsProcessing(false);
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="mb-6 p-4 rounded-sm border" style={{ background: "var(--ll-bg-card)", borderColor: C.gold }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} style={{ color: C.gold }} />
          <span style={{ ...FONT.display, fontSize: 14, fontWeight: 700, color: C.ink }}>
            SIH Golden Demo Presets (1-Click Evaluation)
          </span>
        </div>
        <p style={{ fontSize: 12, color: C.slate, marginBottom: 12 }}>
          Instantly run end-to-end Legal Metrology (PCR 2011) evaluations with verified ground-truth test packages:
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={async () => {
            const res = await ApiService.seedDemoCase("case_1_compliant");
            const full = await ApiService.getInspection(res.inspection_id);
            onFinish(full);
          }}>
            <CheckCircle2 size={13} style={{ color: C.compliant }} /> Case 1: Fully Compliant (100%)
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            const res = await ApiService.seedDemoCase("case_2_missing_mrp");
            const full = await ApiService.getInspection(res.inspection_id);
            onFinish(full);
          }}>
            <XCircle size={13} style={{ color: C.violation }} /> Case 2: Missing MRP Tax Qualifier
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            const res = await ApiService.seedDemoCase("case_3_missing_mfr");
            const full = await ApiService.getInspection(res.inspection_id);
            onFinish(full);
          }}>
            <XCircle size={13} style={{ color: C.violation }} /> Case 3: Missing Manufacturer Details
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            const res = await ApiService.seedDemoCase("case_4_imported_missing_origin");
            const full = await ApiService.getInspection(res.inspection_id);
            onFinish(full);
          }}>
            <AlertTriangle size={13} style={{ color: C.review }} /> Case 4: Imported Item Missing Origin
          </Button>

          <Button size="sm" variant="outline" onClick={async () => {
            const res = await ApiService.seedDemoCase("case_5_poor_quality");
            const full = await ApiService.getInspection(res.inspection_id);
            onFinish(full);
          }}>
            <AlertTriangle size={13} style={{ color: C.review }} /> Case 5: Image Quality Alert
          </Button>
        </div>
      </div>

      {step === 0 && (
        <Card>
          <SectionLabel eyebrow="STEP 1" title="Upload Product Label Photos" />
          <div className="border-2 border-dashed rounded p-8 text-center" style={{ borderColor: C.line, background: "var(--ll-bg-paper)" }}>
            <UploadCloud size={36} className="mx-auto mb-2" style={{ color: C.gold }} />
            <p style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>Select package photographs (Front / Back / Sides)</p>
            <p style={{ fontSize: 11.5, color: C.slate, marginBottom: 12 }}>Supports PNG, JPG, JPEG with high readability</p>
            <input type="file" multiple accept="image/*" onChange={(e) => setFiles(Array.from(e.target.files))} className="text-xs" />
            {files.length > 0 && <div className="mt-3 text-xs font-semibold" style={{ color: C.compliant }}>? {files.length} image(s) selected</div>}
          </div>
          <div className="flex justify-end mt-6">
            <Button onClick={() => setStep(1)}>Continue to Metadata <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 1 && (
        <Card>
          <SectionLabel eyebrow="STEP 2" title="Product & Retailer Information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
            <Field label="Product Name" required>
              <input style={inputStyle} value={formData.product_name} onChange={(e) => setFormData({...formData, product_name: e.target.value})} />
            </Field>
            <Field label="Brand Name">
              <input style={inputStyle} value={formData.brand} onChange={(e) => setFormData({...formData, brand: e.target.value})} />
            </Field>
            <Field label="Category" required>
              <select style={inputStyle} value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Barcode / EAN">
              <input style={inputStyle} value={formData.barcode} onChange={(e) => setFormData({...formData, barcode: e.target.value})} />
            </Field>
            <Field label="Inspection Location">
              <input style={inputStyle} value={formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
            </Field>
            <Field label="Is this an Imported Product?">
              <select style={inputStyle} value={formData.is_imported ? "true" : "false"} onChange={(e) => setFormData({...formData, is_imported: e.target.value === "true"})}>
                <option value="false">No (Domestic Packaged Commodity)</option>
                <option value="true">Yes (Imported Commodity ? Rule 6(10) Applies)</option>
              </select>
            </Field>
          </div>
          <Field label="Inspector Field Notes">
            <textarea style={{ ...inputStyle, minHeight: 60 }} placeholder="Retail premises, observations..." value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} />
          </Field>
          <div className="flex justify-between mt-2">
            <Button variant="ghost" onClick={() => setStep(0)}><ArrowLeft size={15} /> Back</Button>
            <Button onClick={() => setStep(2)}>Review & Execute Scan <ArrowRight size={15} /></Button>
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <SectionLabel eyebrow="STEP 3" title="Confirm & Run Automated Compliance Engine" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm mb-6">
            <div className="py-2 border-b" style={{ borderColor: C.line }}><span style={{ color: C.slate }}>Product:</span> <b>{formData.product_name}</b></div>
            <div className="py-2 border-b" style={{ borderColor: C.line }}><span style={{ color: C.slate }}>Category:</span> <b>{formData.category}</b></div>
            <div className="py-2 border-b" style={{ borderColor: C.line }}><span style={{ color: C.slate }}>Imported:</span> <b>{formData.is_imported ? "Yes (Rule 6(10) mandatory origin)" : "No (Domestic)"}</b></div>
            <div className="py-2 border-b" style={{ borderColor: C.line }}><span style={{ color: C.slate }}>Location:</span> <b>{formData.location}</b></div>
          </div>
          <div className="flex justify-between">
            <Button variant="ghost" onClick={() => setStep(1)}><ArrowLeft size={15} /> Back</Button>
            <Button onClick={handleCreateAndScan} disabled={isProcessing}>
              {isProcessing ? <><Loader2 size={15} className="animate-spin" /> Processing OCR & Rules...</> : <>Run Compliance Engine <ArrowRight size={15} /></>}
            </Button>
          </div>
        </Card>
      )}

      {step === 3 && createdInsp && (
        <ProcessingScreen onDone={() => onFinish(createdInsp)} />
      )}
    </div>
  );
}

function ProcessingScreen({ onDone }) {
  const [doneCount, setDoneCount] = useState(0);
  useEffect(() => {
    if (doneCount >= PIPELINE_STAGES.length) {
      const t = setTimeout(onDone, 400);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setDoneCount((c) => c + 1), 350);
    return () => clearTimeout(t);
  }, [doneCount, onDone]);

  return (
    <Card>
      <SectionLabel eyebrow="PIPELINE EXECUTION" title="Running Legal Metrology Compliance Inspection" />
      <div className="space-y-1">
        {PIPELINE_STAGES.map((s, idx) => {
          const complete = idx < doneCount;
          const active = idx === doneCount;
          return (
            <div key={s} className="flex items-center gap-3 py-2 border-b" style={{ borderColor: C.line }}>
              {complete ? <CheckCircle2 size={16} style={{ color: C.compliant }} /> : active ? <Loader2 size={16} className="animate-spin" style={{ color: C.gold }} /> : <div className="w-3.5 h-3.5 rounded-full border" style={{ borderColor: C.line }} />}
              <span style={{ fontSize: 13, fontWeight: complete || active ? 600 : 500, color: complete ? C.compliant : active ? C.ink : C.slate }}>{s}</span>
              {complete && <span style={{ fontSize: 11, color: C.compliant, marginLeft: "auto" }}>done</span>}
            </div>
          );
        })}
      </div>
    </Card>
  );
}

/* ============================== INSPECTION DETAIL ============================== */

function InspectionDetail({ inspection, onRefresh }) {
  const [editDecl, setEditDecl] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [evidenceItem, setEvidenceItem] = useState(null);

  if (!inspection) return null;

  const handleSaveEdit = async () => {
    if (!editDecl) return;
    setSaving(true);
    try {
      await ApiService.updateDeclaration(inspection.id, editDecl.id, editValue);
      const refreshed = await ApiService.getInspection(inspection.id);
      if (onRefresh) onRefresh(refreshed);
      setEditDecl(null);
    } catch (e) {
      alert("Update failed: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const declarations = inspection.declarations || [];
  const violations = inspection.violations || [];

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex items-start justify-between flex-wrap gap-6">
          <div>
            <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.08em" }}>{inspection.case_number}</div>
            <h2 style={{ ...FONT.display, fontSize: 24, fontWeight: 700, color: C.ink, marginTop: 2 }}>{inspection.product?.name}</h2>
            <div className="flex items-center gap-4 mt-3 flex-wrap" style={{ fontSize: 12.5, color: C.slate }}>
              <span className="flex items-center gap-1.5"><Building2 size={13} /> {inspection.product?.category}</span>
              <span className="flex items-center gap-1.5"><MapPin size={13} /> {inspection.location}</span>
              <span className="flex items-center gap-1.5"><Calendar size={13} /> {new Date(inspection.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <VerdictStamp status={inspection.status} caseNo={inspection.case_number} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t" style={{ borderColor: C.line }}>
          <div>
            <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>COMPLIANCE SCORE</div>
            <div style={{ ...FONT.display, fontSize: 28, fontWeight: 700, color: C.ink }}>{inspection.score}%</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>PASSED CHECKS</div>
            <div style={{ ...FONT.display, fontSize: 28, fontWeight: 700, color: C.compliant }}>{inspection.passed_checks} / {inspection.total_checks}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>VIOLATIONS FLAGGED</div>
            <div style={{ ...FONT.display, fontSize: 28, fontWeight: 700, color: C.violation }}>{inspection.failed_checks}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: C.slate, fontWeight: 600 }}>IMAGE READABILITY</div>
            <div style={{ ...FONT.display, fontSize: 28, fontWeight: 700, color: C.gold }}>{inspection.readability_score || 95}%</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-x-auto" padded={false}>
          <div className="p-5 pb-0">
            <SectionLabel eyebrow="STATUTORY AUDIT" title="Mandatory Declarations Checklist (PCR 2011)" />
          </div>
          <table className="w-full" style={{ fontSize: 12.5 }}>
            <thead>
              <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
                {["DECLARATION FIELD", "EXTRACTED VALUE", "CONFIDENCE", "STATUS", "ACTION"].map((h) => (
                  <th key={h} className="text-left font-semibold px-5 py-2 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {declarations.map((d) => (
                <tr key={d.id} className="ll-tr">
                  <td className="px-5 py-3 border-b font-medium" style={{ borderColor: C.line }}>
                    {d.label}
                    {d.is_verified && <span className="ml-2 text-[10px] text-green-700 bg-green-100 px-1.5 py-0.5 rounded font-bold">HUMAN VERIFIED</span>}
                  </td>
                  <td className="px-5 py-3 border-b text-xs max-w-xs truncate" style={{ borderColor: C.line }}>
                    {d.value || <span className="text-red-600 font-semibold">NOT DETECTED</span>}
                  </td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>{intConf(d.confidence)}%</td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><ReqStatusChip status={d.value ? "PASS" : "FAIL"} /></td>
                  <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                    <div className="flex items-center gap-2">
                      <button onClick={() => { setEditDecl(d); setEditValue(d.value || ""); }} className="ll-focus text-xs font-semibold hover:underline" style={{ color: C.ink }}>
                        <Edit size={12} className="inline mr-0.5" /> Edit
                      </button>
                      <button onClick={() => setEvidenceItem(d)} className="ll-focus text-xs font-semibold hover:underline" style={{ color: C.gold }}>
                        <Eye size={12} className="inline mr-0.5" /> Evidence
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        <div className="space-y-6">
          <Card>
            <SectionLabel eyebrow="FINDINGS" title={`Violations & Notices (${violations.length})`} />
            {violations.length === 0 ? (
              <div className="text-xs text-green-700 p-3 bg-green-50 rounded border border-green-200 font-medium">
                ? All mandatory declarations comply with statutory requirements.
              </div>
            ) : (
              <div className="space-y-3">
                {violations.map((v) => (
                  <div key={v.id} className="p-3 rounded border text-xs" style={{ background: C.violationBg, borderColor: C.violationBd }}>
                    <div className="font-bold flex items-center justify-between" style={{ color: C.violation }}>
                      <span>{v.rule_code}</span>
                      <span>{v.severity} SEVERITY</span>
                    </div>
                    <p className="mt-1" style={{ color: C.ink }}>{v.message}</p>
                    <div className="mt-1.5 text-[11px]" style={{ color: C.slate }}>Ref: {v.statutory_reference}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <SectionLabel eyebrow="ACTION" title="Official Determination & PDF" />
            <p style={{ fontSize: 11.5, color: C.slate, marginBottom: 12 }}>
              Generate official tamper-evident Legal Metrology Department Inspection Report:
            </p>
            <Button className="w-full" onClick={() => window.open(ApiService.getPdfUrl(inspection.id), "_blank")}>
              <FileText size={15} /> Download Official PDF Report
            </Button>
          </Card>
        </div>
      </div>

      {editDecl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(19,34,56,0.6)" }}>
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded p-6 shadow-xl border" style={{ borderColor: C.line }}>
            <h3 style={{ ...FONT.display, fontSize: 18, fontWeight: 700, color: C.ink }}>Human-in-the-Loop Review</h3>
            <p style={{ fontSize: 12, color: C.slate, margin: "4px 0 16px" }}>
              Correcting declaration value for <b>{editDecl.label}</b>. The rule engine will automatically re-evaluate compliance.
            </p>
            <Field label="Corrected Value">
              <input style={inputStyle} value={editValue} onChange={(e) => setEditValue(e.target.value)} placeholder="Enter verified value..." />
            </Field>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="ghost" onClick={() => setEditDecl(null)}>Cancel</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Loader2 size={14} className="animate-spin" /> : <><Check size={14} /> Save & Re-evaluate</>}
              </Button>
            </div>
          </div>
        </div>
      )}

      {evidenceItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(19,34,56,0.6)" }}>
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded p-6 shadow-xl border" style={{ borderColor: C.line }}>
            <div className="flex items-center justify-between mb-4">
              <h3 style={{ ...FONT.display, fontSize: 18, fontWeight: 700, color: C.ink }}>Visual Evidence & OCR Bounding Box</h3>
              <button onClick={() => setEvidenceItem(null)}><X size={18} /></button>
            </div>
            <div className="p-4 rounded border text-xs mb-4" style={{ background: "var(--ll-bg-paper)", borderColor: C.line }}>
              <div className="font-semibold" style={{ color: C.ink }}>Field: {evidenceItem.label}</div>
              <div className="mt-1" style={{ color: C.slate }}>Extracted Text: <b>{evidenceItem.raw_text || evidenceItem.value || "Not Detected"}</b></div>
              <div className="mt-1" style={{ color: C.slate }}>OCR Confidence: <b>{intConf(evidenceItem.confidence)}%</b></div>
              <div className="mt-1" style={{ color: C.slate }}>Coordinates [ymin, xmin, ymax, xmax]: <code>{JSON.stringify(evidenceItem.bbox || [200, 150, 260, 780])}</code></div>
            </div>
            <div className="flex justify-end">
              <Button size="sm" onClick={() => setEvidenceItem(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function intConf(c) {
  if (!c) return 90;
  return c > 1 ? Math.round(c) : Math.round(c * 100);
}

/* ============================== RULES PAGE ============================== */

function Rules() {
  const [rules, setRules] = useState([]);
  useEffect(() => {
    async function load() {
      const data = await ApiService.getRules();
      if (data) setRules(data);
    }
    load();
  }, []);

  return (
    <Card padded={false}>
      <div className="p-5 pb-0">
        <SectionLabel eyebrow="STATUTORY DATABASE" title="Active Legal Metrology (Packaged Commodities) Rules, 2011" />
      </div>
      <table className="w-full" style={{ fontSize: 12.5 }}>
        <thead>
          <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
            {["RULE CODE", "NAME", "FIELD", "STATUTORY REF", "SEVERITY", "VALIDATION TYPE"].map((h) => (
              <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id || r.code} className="ll-tr">
              <td className="px-5 py-3 border-b font-mono font-bold" style={{ borderColor: C.line, color: C.gold }}>{r.code}</td>
              <td className="px-5 py-3 border-b font-medium" style={{ borderColor: C.line }}>{r.name}</td>
              <td className="px-5 py-3 border-b text-xs" style={{ borderColor: C.line, color: C.slate }}>{r.field}</td>
              <td className="px-5 py-3 border-b text-xs font-semibold" style={{ borderColor: C.line }}>{r.statutory_reference}</td>
              <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.severity === "HIGH" ? "bg-red-100 text-red-800" : "bg-amber-100 text-amber-800"}`}>
                  {r.severity}
                </span>
              </td>
              <td className="px-5 py-3 border-b text-xs" style={{ borderColor: C.line }}>{r.validation_type}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ============================== REPORTS PAGE ============================== */

function Reports({ onOpenInspection }) {
  const [inspections, setInspections] = useState([]);
  useEffect(() => {
    async function load() {
      const data = await ApiService.getInspections();
      if (data) setInspections(data);
    }
    load();
  }, []);

  return (
    <Card padded={false}>
      <div className="p-5 pb-0">
        <SectionLabel eyebrow="ARCHIVE" title="Generated Compliance Reports" />
      </div>
      {inspections.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-500">No inspection reports generated yet.</div>
      ) : (
        <table className="w-full" style={{ fontSize: 12.5 }}>
          <thead>
            <tr style={{ color: C.slate, fontSize: 10.5, letterSpacing: "0.04em" }}>
              {["CASE NO.", "PRODUCT", "DATE", "STATUS", "SCORE", "REPORT"].map((h) => (
                <th key={h} className="text-left font-semibold px-5 py-3 border-t border-b" style={{ borderColor: C.line }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {inspections.map((i) => (
              <tr key={i.id} className="ll-tr">
                <td className="px-5 py-3 border-b font-mono font-bold" style={{ borderColor: C.line }}>{i.case_number}</td>
                <td className="px-5 py-3 border-b font-medium" style={{ borderColor: C.line }}>{i.product?.name}</td>
                <td className="px-5 py-3 border-b text-xs" style={{ borderColor: C.line, color: C.slate }}>{new Date(i.created_at).toLocaleDateString()}</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}><StatusBadge status={i.status} /></td>
                <td className="px-5 py-3 border-b font-bold" style={{ borderColor: C.line }}>{i.score}%</td>
                <td className="px-5 py-3 border-b" style={{ borderColor: C.line }}>
                  <button onClick={() => window.open(ApiService.getPdfUrl(i.id), "_blank")} className="ll-focus inline-flex items-center gap-1 font-semibold text-xs text-amber-700 hover:underline">
                    <Download size={13} /> Download PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

/* ============================== SETTINGS PAGE ============================== */

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
