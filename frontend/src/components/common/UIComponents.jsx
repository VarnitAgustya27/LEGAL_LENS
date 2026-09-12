import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info } from "lucide-react";
import { C, FONT, StatusMeta } from "../../constants.jsx";

export class ErrorBoundary extends React.Component {
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
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">⚠️</div>
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

export function StatusBadge({ status, size = "sm" }) {
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

export function ReqStatusChip({ status }) {
  const map = {
    PASS: { c: C.compliant, bg: C.compliantBg, bd: C.compliantBd, Icon: CheckCircle2 },
    FAIL: { c: C.violation, bg: C.violationBg, bd: C.violationBd, Icon: XCircle },
    REVIEW: { c: C.review, bg: C.reviewBg, bd: C.reviewBd, Icon: AlertTriangle },
    EXEMPT: { c: "#0284c7", bg: "rgba(2, 132, 199, 0.12)", bd: "rgba(2, 132, 199, 0.3)", Icon: Info },
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

export function VerdictStamp({ status, caseNo }) {
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

export function Card({ children, className = "", style, padded = true, hoverEffect = false, ...props }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        hoverEffect && !shouldReduceMotion
          ? { y: -4, transition: { duration: 0.25, ease: "easeOut" } }
          : {}
      }
      className={`border rounded-[22px] transition-all duration-300 ${className}`}
      style={{
        background: "var(--ll-bg-card)",
        borderColor: "var(--ll-color-line)",
        color: "var(--ll-color-charcoal)",
        boxShadow: "0 1px 2px rgba(0,0,0,0.02), 0 10px 30px rgba(0,0,0,0.045)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        overflow: "hidden",
        ...style
      }}
      {...props}
    >
      <div className={padded ? "p-5 sm:p-6" : ""}>{children}</div>
    </motion.div>
  );
}

export function SectionLabel({ eyebrow, title, right }) {
  return (
    <div className="flex items-end justify-between mb-5">
      <div>
        {eyebrow && (
          <div
            style={{
              ...FONT.body,
              fontSize: 10,
              letterSpacing: "0.12em",
              color: C.slate,
              fontWeight: 700,
              marginBottom: 6,
              textTransform: "uppercase",
            }}
          >
            {eyebrow}
          </div>
        )}
        <h2
          style={{
            ...FONT.display,
            fontSize: 24,
            lineHeight: 1.15,
            color: C.ink,
            fontWeight: 700,
            letterSpacing: "-0.035em",
          }}
        >
          {title}
        </h2>
      </div>
      {right}
    </div>
  );
}

export function Button({ children, variant = "primary", onClick, className = "", type = "button", size = "md", disabled = false, ...props }) {
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

export function Field({ label, children, required = false }) {
  return (
    <label className="block mb-4">
      <div style={{ ...FONT.body, fontSize: 12, fontWeight: 600, color: C.slate, marginBottom: 6, letterSpacing: "0.02em" }}>
        {label} {required && <span style={{ color: "var(--ll-violation)" }}>*</span>}
      </div>
      {children}
    </label>
  );
}

export function Icon({ name, size = 20 }) {
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
