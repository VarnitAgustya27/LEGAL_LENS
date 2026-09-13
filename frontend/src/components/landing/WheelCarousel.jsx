import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Scan, Search, Shield, FileText, Database, UploadCloud,
  ChevronLeft, ChevronRight, Play, Pause, RotateCw, Sparkles, CheckCircle2, Zap
} from "lucide-react";

const CAPABILITIES = [
  {
    id: "01",
    title: "Product & Label Scanning",
    tag: "VISUAL INSPECTION",
    icon: Scan,
    color: "#E5B842", // Gold
    bg: "rgba(229,184,66,0.12)",
    border: "rgba(229,184,66,0.35)",
    desc: "Analyze packaged commodities using high-resolution uploaded images, packaging label scans, and visual evidence.",
    details: "Supports multi-angle package capture, QR/EAN barcode decoding, and curvature distortion correction."
  },
  {
    id: "02",
    title: "AI Declaration Extraction",
    tag: "AI + OCR ENGINE",
    icon: Search,
    color: "#38BDF8", // Cyan
    bg: "rgba(56,189,248,0.12)",
    border: "rgba(56,189,248,0.35)",
    desc: "Automatically detect and extract manufacturer details, MRP, net quantity, dates, and mandatory consumer care information.",
    details: "Powered by Gemini 1.5 Vision AI and EasyOCR dual-pass neural bounding-box extraction."
  },
  {
    id: "03",
    title: "Rule-Based Validation",
    tag: "RULE ENGINE",
    icon: Shield,
    color: "#10B981", // Emerald
    bg: "rgba(16,185,129,0.12)",
    border: "rgba(16,185,129,0.35)",
    desc: "Validate extracted declarations against applicable Legal Metrology Act 2009 & Packaged Commodities Rules 2011.",
    details: "Instant statutory verification of Rule 6(1) mandatory declarations and digital e-commerce exemptions under Rule 6(10)."
  },
  {
    id: "04",
    title: "Font & Readability Analysis",
    tag: "VISUAL VALIDATION",
    icon: FileText,
    color: "#F59E0B", // Amber
    bg: "rgba(245,158,11,0.12)",
    border: "rgba(245,158,11,0.35)",
    desc: "Evaluate declaration readability, contrast, visibility, and prescribed statutory font-height requirements.",
    details: "Measures printed font height in millimeters against minimum package principal display area ratios."
  },
  {
    id: "05",
    title: "Compliance Reports",
    tag: "REPORT GENERATION",
    icon: Sparkles,
    color: "#A855F7", // Purple
    bg: "rgba(168,85,247,0.12)",
    border: "rgba(168,85,247,0.35)",
    desc: "Generate official compliance reports, violation summaries, and digital evidence dossiers for inspection records.",
    details: "Generates tamper-proof legal PDFs complete with officer signatures and exact rule citations."
  },
  {
    id: "06",
    title: "Inspection Repository",
    tag: "DATA REPOSITORY",
    icon: Database,
    color: "#EC4899", // Pink
    bg: "rgba(236,72,153,0.12)",
    border: "rgba(236,72,153,0.35)",
    desc: "Maintain scanned product records, compliance audit history, photographs, and supporting legal evidence.",
    details: "Role-isolated secure cloud ledger ensuring consumer and officer case privacy."
  }
];

const WORKFLOW = [
  {
    id: "01",
    title: "Upload Packaging Photo",
    tag: "STEP 1: CAPTURE",
    icon: UploadCloud,
    color: "#38BDF8",
    bg: "rgba(56,189,248,0.15)",
    border: "rgba(56,189,248,0.4)",
    desc: "Upload product images, packaging label scans, or paste live e-commerce product URLs for automated scanning.",
    details: "Supports JPEG, PNG, web camera snaps, and direct clipboard image pasting (Ctrl + V)."
  },
  {
    id: "02",
    title: "AI & OCR Extraction",
    tag: "STEP 2: EXTRACT",
    icon: Search,
    color: "#E5B842",
    bg: "rgba(229,184,66,0.15)",
    border: "rgba(229,184,66,0.4)",
    desc: "Dual-engine AI OCR parses mandatory declarations from packaging surface with normalized bounding-box coordinates.",
    details: "Extracts MRP, Net Qty, Mfg Date, Expiry Date, FSSAI Lic, and Manufacturer Address."
  },
  {
    id: "03",
    title: "Rule-Engine Validation",
    tag: "STEP 3: VALIDATE",
    icon: Shield,
    color: "#10B981",
    bg: "rgba(16,185,129,0.15)",
    border: "rgba(16,185,129,0.4)",
    desc: "Extracted data is checked against Legal Metrology PCR 2011 statutory rules and unit-pricing rules.",
    details: "Automatically tags Compliant, Non-Compliant, or Exempt status with specific rule references."
  },
  {
    id: "04",
    title: "Generate Case Report",
    tag: "STEP 4: REPORT",
    icon: CheckCircle2,
    color: "#A855F7",
    bg: "rgba(168,85,247,0.15)",
    border: "rgba(168,85,247,0.4)",
    desc: "Generates digital inspection records, violation notes, officer determinations, or consumer grievance filings.",
    details: "Enables instant PDF export and official legal case logging."
  }
];

export default function WheelCarousel({ onSelectAction }) {
  const [activeTab, setActiveTab] = useState("CAPABILITIES"); // "CAPABILITIES" | "WORKFLOW"
  const items = activeTab === "CAPABILITIES" ? CAPABILITIES : WORKFLOW;

  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(true);

  // Reset index on tab change
  useEffect(() => {
    setActiveIndex(0);
  }, [activeTab]);

  // Auto rotation timer
  useEffect(() => {
    if (!isAutoPlay) return undefined;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % items.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlay, items.length]);

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  };

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % items.length);
  };

  const activeItem = items[activeIndex] || items[0];

  return (
    <div className="w-full max-w-6xl mx-auto my-12 px-4 select-none">
      {/* SECTION HEADER */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-amber-500/15 text-amber-300 border border-amber-500/30">
          <RotateCw size={13} className="animate-spin text-amber-400" style={{ animationDuration: "8s" }} />
          <span>Interactive 3D Wheel Showcase</span>
        </div>

        <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-100 tracking-tight">
          Explore Legal Metrology Platform Capabilities
        </h2>

        <p className="text-slate-400 text-xs sm:text-sm max-w-2xl mx-auto leading-relaxed">
          Rotate the interactive wheel below to inspect platform capabilities, AI vision extraction features, and our end-to-end Legal Metrology inspection workflow.
        </p>

        {/* TAB TOGGLE SWITCH */}
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            type="button"
            onClick={() => setActiveTab("CAPABILITIES")}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              activeTab === "CAPABILITIES"
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-lg shadow-amber-500/20 font-extrabold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Capabilities Wheel (6 Features)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("WORKFLOW")}
            className={`px-4 py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer border ${
              activeTab === "WORKFLOW"
                ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow-lg shadow-emerald-500/20 font-extrabold"
                : "bg-slate-900/60 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            Workflow Wheel (4 Steps)
          </button>
        </div>
      </div>

      {/* WHEEL ANIMATION CONTAINER */}
      <div className="relative rounded-3xl border bg-slate-950/90 border-slate-800 p-6 sm:p-10 shadow-2xl overflow-hidden min-h-[520px] flex flex-col items-center justify-between">
        {/* Background Ambient Glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none transition-all duration-700"
          style={{ background: activeItem.color }}
        />

        {/* TOP TOOLBAR CONTROLS */}
        <div className="w-full flex items-center justify-between z-20 pb-4 border-b border-slate-800/60">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span className="font-bold text-slate-200">{activeItem.tag}</span>
            <span>• Node {activeIndex + 1} of {items.length}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`px-3 py-1.5 rounded-lg border text-[11px] font-mono font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                isAutoPlay
                  ? "bg-amber-500/15 text-amber-300 border-amber-500/40"
                  : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
              }`}
            >
              {isAutoPlay ? <Pause size={12} /> : <Play size={12} />}
              <span>{isAutoPlay ? "Auto-Rotate ON" : "Auto-Rotate Paused"}</span>
            </button>

            <button
              type="button"
              onClick={handlePrev}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Rotate Counter-Clockwise"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-all cursor-pointer"
              title="Rotate Clockwise"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        {/* 3D WHEEL CANVAS STAGE */}
        <div className="relative w-full h-[320px] flex items-center justify-center my-4">
          {/* CENTRAL RADAR HUB */}
          <div className="absolute w-44 h-44 sm:w-56 sm:h-56 rounded-full border border-dashed border-slate-800/80 flex items-center justify-center pointer-events-none">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full border border-slate-800 flex items-center justify-center animate-pulse">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center transition-all duration-500 shadow-xl"
                style={{
                  borderColor: activeItem.color,
                  backgroundColor: activeItem.bg,
                  boxShadow: `0 0 30px ${activeItem.color}44`
                }}
              >
                <activeItem.icon size={28} style={{ color: activeItem.color }} />
              </div>
            </div>
          </div>

          {/* CIRCULAR SPOKE CARDS / NODES */}
          {items.map((item, index) => {
            const count = items.length;
            // Calculate angle offset relative to activeIndex so active is at top (0 deg / 270 deg)
            const angleStep = (2 * Math.PI) / count;
            const currentAngle = (index - activeIndex) * angleStep - Math.PI / 2;

            // Radius in pixels for desktop & mobile
            const radius = typeof window !== 'undefined' && window.innerWidth < 640 ? 120 : 160;

            const x = Math.cos(currentAngle) * radius;
            const y = Math.sin(currentAngle) * radius;

            const isActive = index === activeIndex;
            const distance = Math.min(
              Math.abs(index - activeIndex),
              count - Math.abs(index - activeIndex)
            );

            // Scale and opacity based on distance from active front node
            const scale = isActive ? 1.15 : Math.max(0.75, 1 - distance * 0.18);
            const opacity = isActive ? 1 : Math.max(0.45, 1 - distance * 0.3);
            const zIndex = isActive ? 30 : 20 - distance;

            const ItemIcon = item.icon;

            return (
              <motion.div
                key={item.id}
                initial={false}
                animate={{
                  x,
                  y,
                  scale,
                  opacity,
                }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                onClick={() => {
                  setActiveIndex(index);
                  setIsAutoPlay(false);
                }}
                className={`absolute w-36 sm:w-44 p-3 rounded-2xl border cursor-pointer backdrop-blur-md transition-all ${
                  isActive
                    ? "bg-slate-900 shadow-2xl z-30 ring-2"
                    : "bg-slate-950/80 hover:bg-slate-900/90 hover:opacity-100"
                }`}
                style={{
                  borderColor: isActive ? item.color : "rgba(148,163,184,0.2)",
                  boxShadow: isActive ? `0 0 25px ${item.color}55` : "none",
                  zIndex,
                }}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span
                    className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                    style={{ backgroundColor: item.bg, color: item.color }}
                  >
                    #{item.id}
                  </span>
                  <div
                    className="w-6 h-6 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: item.bg }}
                  >
                    <ItemIcon size={13} style={{ color: item.color }} />
                  </div>
                </div>

                <div className="text-xs font-extrabold text-slate-100 truncate">
                  {item.title}
                </div>

                <div className="text-[10px] text-slate-400 truncate mt-0.5 font-mono">
                  {item.tag}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ACTIVE ITEM EXPANDED DETAIL PANEL */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="w-full mt-4 p-5 rounded-2xl border bg-slate-900/90 border-slate-800 space-y-3 z-20"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border"
                  style={{ borderColor: activeItem.border, backgroundColor: activeItem.bg }}
                >
                  <activeItem.icon size={20} style={{ color: activeItem.color }} />
                </div>

                <div>
                  <div className="text-[10.5px] font-mono font-bold uppercase tracking-wider" style={{ color: activeItem.color }}>
                    {activeItem.tag}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-100">
                    {activeItem.title}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onSelectAction && onSelectAction(activeItem)}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 hover:brightness-110 active:scale-95"
                  style={{ backgroundColor: activeItem.color, color: "#060A11" }}
                >
                  <Zap size={14} />
                  <span>Launch Feature</span>
                </button>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {activeItem.desc}
            </p>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={13} style={{ color: activeItem.color }} />
                {activeItem.details}
              </span>
              <span className="text-slate-500 hidden sm:inline">Use Prev / Next buttons to rotate wheel</span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
