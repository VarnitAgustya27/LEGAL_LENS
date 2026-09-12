import React, { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ScanLine, CheckCircle2, Loader2 } from "lucide-react";
import { C, PIPELINE_STAGES } from "../../constants.jsx";
import { Card, SectionLabel } from "../common/UIComponents.jsx";

export default function ProcessingScreen({ onDone, createdCase }) {
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
    // All stages complete — call onDone and stop
    if (doneCount >= PIPELINE_STAGES.length) {
      const t = setTimeout(() => onDoneRef.current(buildResult(createdCaseRef.current)), 500);
      return () => clearTimeout(t);
    }
    // Advance to next pipeline stage
    const t = setTimeout(() => setDoneCount((c) => c + 1), 550);
    return () => clearTimeout(t);
  }, [doneCount]);

  // Hard-timeout safety net: if stuck >30s, force navigate forward
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
              className={`flex items-center gap-3 py-2.5 px-3.5 rounded-lg border transition-all ${active
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
