import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ClipboardList, FilePlus2, Package, ScrollText, FileText, Settings,
  ScanLine, Sun, Moon, LogOut, Search, ChevronDown, Camera, Scale, User
} from "lucide-react";
import { C, FONT, GlobalStyle, inputStyle } from "../../constants.jsx";
import CropPhotoModal from "../modals/CropPhotoModal.jsx";

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
  dashboard: ["OVERVIEW", "Dashboard Overview"],
  compare: ["PRODUCT COMPARISON", "Compare Packaged Products"],
  inspections: ["SCANNED HISTORY", "Scanned Products & Grievances"],
  "new-inspection": ["LABEL SCANNER", "Scan Product Label"],
  "inspection-detail": ["PRODUCT RESULT", "Scan Inspection Result"],
  products: ["CATALOGUE", "Verified Products"],
  rules: ["LEGAL FRAMEWORK", "Legal Metrology Rule Repository"],
  reports: ["ARCHIVE", "Inspection Reports"],
  settings: ["ADMINISTRATION", "Users & Settings"],
  account: ["PROFILE", "Manage Account & Preferences"],
};

export default function Shell({ page, setPage, currentUser, avatarUrl, onUpdateAvatar, isDark, toggleTheme, isDbConnected, onSignOut, children }) {
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

  const isConsumer = currentUser?.role === "Consumer";

  const consumerNav = [
    { key: "dashboard", label: "Consumer Hub", Icon: LayoutDashboard },
    { key: "new-inspection", label: "Scan Product", Icon: ScanLine },
    { key: "compare", label: "Compare Products", Icon: Scale },
    { key: "inspections", label: "Scanned History", Icon: ClipboardList },
    { key: "rules", label: "Rule Repository", Icon: ScrollText },
    { key: "account", label: "Manage Account", Icon: User },
  ];

  const filteredNav = isConsumer ? consumerNav : NAV;

  const roleBadgeStyle = {
    Admin: { bg: C.violationBg, color: C.violation, bd: C.violationBd },
    "Enforcement Officer": { bg: "rgba(19,34,56,0.08)", color: C.ink, bd: C.line },
    Reviewer: { bg: C.reviewBg, color: C.review, bd: C.reviewBd },
    Consumer: { bg: "rgba(16,185,129,0.15)", color: "#10B981", bd: "rgba(16,185,129,0.3)" },
  }[currentUser?.role] || { bg: "#eee", color: C.slate, bd: C.line };

  return (
    <div className={`ll-root min-h-screen flex ${isDark ? "dark" : ""}`} style={{ background: "var(--ll-bg-paper)", ...FONT.body }}>
      <GlobalStyle />
      <aside className="w-64 flex-shrink-0 flex flex-col h-screen sticky top-0 overflow-hidden" style={{ background: "var(--ll-bg-sidebar)", color: "#DCD8CB" }}>

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
          {filteredNav.map((n) => {
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
        <div className="flex-1 overflow-y-auto ll-scroll p-4 sm:p-8 pb-24 lg:pb-8">
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

      {/* ANDROID NATIVE MOBILE BOTTOM NAVIGATION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md px-2 py-2 flex items-center justify-around shadow-2xl">
        {filteredNav.slice(0, 5).map((n, idx) => {
          const active = page === n.key || (page === "inspection-detail" && n.key === "inspections");
          const isCenterScan = n.key === "new-inspection";

          if (isCenterScan) {
            return (
              <button
                key={n.key}
                type="button"
                onClick={() => setPage(n.key)}
                className="flex flex-col items-center -mt-5 cursor-pointer group"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-active:scale-95 transition-transform border-2 border-slate-950 font-bold">
                  <n.Icon size={22} />
                </div>
                <span className="text-[10px] font-bold text-emerald-400 mt-1">{n.label}</span>
              </button>
            );
          }

          return (
            <button
              key={n.key}
              type="button"
              onClick={() => setPage(n.key)}
              className={`flex flex-col items-center py-1 px-2.5 rounded-xl transition-all cursor-pointer ${
                active ? "text-amber-400 font-bold" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <n.Icon size={19} strokeWidth={active ? 2.3 : 1.8} />
              <span className="text-[10px] mt-0.5">{n.label.replace("Catalogue", "").replace("Repository", "")}</span>
            </button>
          );
        })}
      </div>

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
