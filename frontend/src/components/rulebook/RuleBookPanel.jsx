import React, { useMemo, useState } from "react";
import { RULE_BOOK_DATA } from "./ruleBookData.js";
import {
  BookOpen,
  Search,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Shield,
  Layers,
  Scale,
  Sparkles,
  Info
} from "lucide-react";

// Statutory Rule Metadata & Legal Citations
const STATUTORY_DETAILS = {
  "PCR-MRP-001": {
    statutory_ref: "Rule 6(1)(e) of PCR, 2011",
    penalty_section: "Section 36(1) of Legal Metrology Act, 2009",
    fine: "₹25,000 (1st offense) • ₹50,000 (2nd) • Up to ₹1,00,000 / 1 yr imprisonment (subsequent)",
    terms: ["MRP", "Maximum Retail Price", "Rs.", "₹", "(Inclusive of all taxes)", "Incl. of all taxes"],
    rationale: "Retail sale price must be declared in standard currency format with unambiguous inclusion of all local and statutory taxes."
  },
  "PCR-NQ-002": {
    statutory_ref: "Rule 6(1)(c), Rules 11, 12, 13 of PCR, 2011",
    penalty_section: "Section 36(1) of Legal Metrology Act, 2009 & Rule 32",
    fine: "₹25,000 (1st offense) • ₹50,000 (2nd offense)",
    terms: ["Net Quantity", "Net Qty", "Net Wt", "g", "kg", "ml", "L", "units", "N", "U"],
    rationale: "Net quantity must be declared in prescribed SI metric units. Non-standard or imperial units (lbs, oz) are strictly prohibited as primary declaration."
  },
  "PCR-MFR-003": {
    statutory_ref: "Rule 6(1)(a) of PCR, 2011",
    penalty_section: "Section 36(1) of Legal Metrology Act, 2009",
    fine: "₹25,000 to ₹50,000 compounding fine",
    terms: ["Manufactured by", "Mfg by", "Packed by", "Marketed by", "Full Postal Address", "PIN Code"],
    rationale: "Complete corporate or manufacturing name and full postal address including city, state, and pin code must be clearly legible on package."
  },
  "PCR-COO-004": {
    statutory_ref: "Rule 6(1)(f), Rule 6(10) of PCR, 2011 (2020 Amendment)",
    penalty_section: "Section 36(1) & Consumer Protection (E-Commerce) Rules",
    fine: "₹25,000 (1st offense) • ₹50,000 (subsequent)",
    terms: ["Country of Origin", "Made in", "Product of", "Imported from"],
    rationale: "Mandatory declaration of country of origin on all imported packaged goods and digital e-commerce commodity listings."
  },
  "PCR-MD-005": {
    statutory_ref: "Rule 6(1)(d) of PCR, 2011",
    penalty_section: "Section 36(1) of Legal Metrology Act, 2009",
    fine: "₹25,000 compounding fine",
    terms: ["Mfg Date", "MFD", "PKD", "Date of Packing", "MM/YYYY", "Month & Year"],
    rationale: "Month and year of manufacture, packing, or import must be declared on the principal display panel."
  },
  "PCR-BB-006": {
    statutory_ref: "Rule 6(1)(d) & FSSAI / Drugs & Cosmetics Regulations",
    penalty_section: "Section 36(1) & FSS Act Section 52",
    fine: "₹25,000 (LM Act) • Up to ₹3,00,000 for misbranded food (FSSAI)",
    terms: ["Best Before", "Expiry Date", "EXP", "Use by", "Months from Packaging"],
    rationale: "Expiry date or 'Best Before X Months' is mandatory for all perishable food items, beverages, and cosmetic commodities."
  },
  "PCR-CC-007": {
    statutory_ref: "Rule 6(1)(da) of PCR, 2011",
    penalty_section: "Section 36(1) of Legal Metrology Act, 2009",
    fine: "₹25,000 compounding fine",
    terms: ["Customer Care", "Consumer Care", "Toll Free Helpline", "Email Address", "Officer Address"],
    rationale: "Name, address, working telephone/helpline number, and email address of grievance redressal officer must be stated."
  },
  "PCR-USP-008": {
    statutory_ref: "Rule 6(11) of PCR, 2011 (2022 Amendment)",
    penalty_section: "Section 36(1) of Legal Metrology Act, 2009",
    fine: "₹25,000 compounding fine",
    terms: ["Unit Sale Price", "USP", "₹ per g", "₹ per kg", "₹ per ml", "₹ per unit"],
    rationale: "Declaration of Unit Sale Price rounded to the nearest two decimal places for retail multi-piece packages or weights exceeding standard units."
  }
};

export default function RuleBookPanel({ rules = [] }) {
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [expandedRuleCode, setExpandedRuleCode] = useState(null);

  const selectedCategoryData = useMemo(
    () => RULE_BOOK_DATA.find((item) => item.category === selectedCategory),
    [selectedCategory]
  );

  const products = selectedCategoryData?.products || [];

  const selectedProductData = products.find(
    (product) => product.name === selectedProduct
  );

  const handleCategoryChange = (cat) => {
    setSelectedCategory(cat);
    setSelectedProduct("");
  };

  // Filter rules based on category, product, search, and severity
  const filteredRules = useMemo(() => {
    let list = rules;

    // 1. If specific product selected, filter to product rules
    if (selectedProductData?.rules?.length) {
      const allowedCodes = new Set(selectedProductData.rules);
      list = list.filter((r) => allowedCodes.has(r.code));
    } else if (selectedCategory && selectedCategory !== "ALL") {
      // Find all rule codes across products in this category
      const catProducts = selectedCategoryData?.products || [];
      const catRuleCodes = new Set(catProducts.flatMap((p) => p.rules || []));
      
      list = list.filter(
        (r) =>
          catRuleCodes.has(r.code) ||
          r.category === "All Categories" ||
          r.category?.toLowerCase().includes(selectedCategory.toLowerCase())
      );
    }

    // 2. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (r) =>
          r.code.toLowerCase().includes(q) ||
          r.name.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          STATUTORY_DETAILS[r.code]?.statutory_ref?.toLowerCase().includes(q) ||
          STATUTORY_DETAILS[r.code]?.rationale?.toLowerCase().includes(q)
      );
    }

    // 3. Severity filter
    if (severityFilter !== "ALL") {
      list = list.filter((r) => r.severity === severityFilter);
    }

    return list;
  }, [rules, selectedCategory, selectedCategoryData, selectedProductData, searchQuery, severityFilter]);

  const categories = [
    { label: "All Categories", value: "ALL" },
    { label: "Packaged Food", value: "Packaged Food" },
    { label: "Beverages", value: "Beverages" },
    { label: "Cosmetics", value: "Cosmetics" },
    { label: "Household Products", value: "Household Products" },
    { label: "Imported Products", value: "Imported Products" }
  ];

  return (
    <div
      className="rounded-2xl border transition-all duration-200 overflow-hidden shadow-xl"
      style={{
        background: "var(--ll-bg-card)",
        borderColor: "var(--ll-color-line)"
      }}
    >
      {/* ── TOP HEADER ── */}
      <div
        className="p-6 border-b space-y-4"
        style={{
          borderColor: "var(--ll-color-line)",
          background: "linear-gradient(135deg, rgba(16, 27, 43, 0.95), rgba(9, 14, 23, 0.98))"
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10.5px] font-mono font-bold tracking-wider uppercase border"
                style={{
                  background: "rgba(229, 184, 66, 0.12)",
                  color: "var(--ll-color-gold)",
                  borderColor: "rgba(229, 184, 66, 0.28)"
                }}
              >
                <Scale size={11} />
                THE LEGAL METROLOGY ACT, 2009 & PCR 2011
              </span>
              <span
                className="text-[10.5px] font-mono px-2 py-0.5 rounded border"
                style={{
                  color: "var(--ll-color-slate)",
                  borderColor: "var(--ll-color-line)",
                  background: "rgba(255,255,255,0.02)"
                }}
              >
                Gazette Version 2026.1
              </span>
            </div>

            <h2
              className="text-2xl font-bold tracking-tight"
              style={{ color: "var(--ll-color-ink)" }}
            >
              Product Rule Book & Regulatory Matrix
            </h2>

            <p
              className="mt-1 text-xs max-w-3xl leading-relaxed"
              style={{ color: "var(--ll-color-slate)" }}
            >
              Interactive statutory requirement engine for packaged commodities. Filter by commodity category, inspect specific product mandates, and review compounding penalty provisions under Section 36 & 39.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="px-3.5 py-2 rounded-xl border flex items-center gap-2.5"
              style={{
                background: "rgba(10, 16, 27, 0.8)",
                borderColor: "var(--ll-color-line)"
              }}
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <div className="text-left font-mono">
                <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Rules</div>
                <div className="text-sm font-bold" style={{ color: "var(--ll-color-gold)" }}>
                  {filteredRules.length} / {rules.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
                style={{
                  background: isActive
                    ? "linear-gradient(135deg, rgba(229,184,66,0.22), rgba(229,184,66,0.08))"
                    : "rgba(255, 255, 255, 0.03)",
                  color: isActive ? "var(--ll-color-gold)" : "var(--ll-color-slate)",
                  border: isActive
                    ? "1px solid rgba(229,184,66,0.4)"
                    : "1px solid var(--ll-color-line)",
                  boxShadow: isActive ? "0 0 12px rgba(229,184,66,0.15)" : "none"
                }}
              >
                <Layers size={12} className={isActive ? "text-amber-400" : "opacity-50"} />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* ── FILTER TOOLBAR ── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search */}
          <div className="md:col-span-5 relative">
            <Search
              size={14}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
            <input
              type="text"
              placeholder="Search rule code, title, section, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-xs outline-none transition-all"
              style={{
                background: "rgba(8, 14, 24, 0.75)",
                borderColor: "var(--ll-color-line)",
                borderWidth: 1,
                color: "var(--ll-color-ink)"
              }}
            />
          </div>

          {/* Category Select */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer transition-all"
              style={{
                background: "rgba(8, 14, 24, 0.75)",
                borderColor: "var(--ll-color-line)",
                borderWidth: 1,
                color: "var(--ll-color-ink)"
              }}
            >
              {categories.map((c) => (
                <option key={c.value} value={c.value} className="bg-slate-900 text-slate-200">
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Product Select (Dynamically active when category chosen) */}
          <div className="md:col-span-2">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              disabled={selectedCategory === "ALL" || !products.length}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: "rgba(8, 14, 24, 0.75)",
                borderColor: "var(--ll-color-line)",
                borderWidth: 1,
                color: "var(--ll-color-ink)"
              }}
            >
              <option value="" className="bg-slate-900 text-slate-200">
                {selectedCategory === "ALL" ? "All Products" : "Filter Product..."}
              </option>
              {products.map((p) => (
                <option key={p.name} value={p.name} className="bg-slate-900 text-slate-200">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Severity Select */}
          <div className="md:col-span-2">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl text-xs outline-none cursor-pointer transition-all"
              style={{
                background: "rgba(8, 14, 24, 0.75)",
                borderColor: "var(--ll-color-line)",
                borderWidth: 1,
                color: "var(--ll-color-ink)"
              }}
            >
              <option value="ALL" className="bg-slate-900 text-slate-200">All Severities</option>
              <option value="HIGH" className="bg-slate-900 text-slate-200">High Severity</option>
              <option value="MEDIUM" className="bg-slate-900 text-slate-200">Medium Severity</option>
              <option value="LOW" className="bg-slate-900 text-slate-200">Low Severity</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── ACTIVE PRODUCT BANNER (IF SELECTED) ── */}
      {selectedProduct && (
        <div
          className="px-6 py-3.5 border-b flex flex-wrap items-center justify-between gap-3"
          style={{
            background: "rgba(229, 184, 66, 0.06)",
            borderColor: "rgba(229, 184, 66, 0.2)"
          }}
        >
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-amber-400" />
            <div>
              <span className="text-[11px] uppercase tracking-wider font-semibold text-amber-400">
                Active Commodity Focus:
              </span>
              <span className="ml-2 text-sm font-bold" style={{ color: "var(--ll-color-ink)" }}>
                {selectedProduct}
              </span>
              <span className="ml-2 text-xs text-slate-400">
                ({selectedCategory})
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold"
              style={{
                background: "rgba(229, 184, 66, 0.15)",
                color: "var(--ll-color-gold)",
                border: "1px solid rgba(229, 184, 66, 0.3)"
              }}
            >
              {filteredRules.length} Mandatory Declarations
            </span>
            <button
              onClick={() => setSelectedProduct("")}
              className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
            >
              Reset focus
            </button>
          </div>
        </div>
      )}

      {/* ── DYNAMIC RULES LIST / CARDS ── */}
      <div className="p-6">
        {filteredRules.length === 0 ? (
          <div
            className="py-14 text-center rounded-xl border border-dashed p-8"
            style={{ borderColor: "var(--ll-color-line)", background: "rgba(0,0,0,0.15)" }}
          >
            <BookOpen size={36} className="mx-auto mb-3 opacity-30 text-slate-400" />
            <h4 className="text-sm font-semibold text-slate-200">No matching statutory rules found</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your category selection, search terms, or clearing your active filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory("ALL");
                setSelectedProduct("");
                setSearchQuery("");
                setSeverityFilter("ALL");
              }}
              className="mt-4 px-4 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer"
              style={{
                borderColor: "rgba(229,184,66,0.3)",
                color: "var(--ll-color-gold)",
                background: "rgba(229,184,66,0.1)"
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredRules.map((rule) => {
              const meta = STATUTORY_DETAILS[rule.code] || {};
              const isExpanded = expandedRuleCode === rule.code;

              const sevBg =
                rule.severity === "HIGH"
                  ? "rgba(239, 68, 68, 0.12)"
                  : rule.severity === "MEDIUM"
                  ? "rgba(245, 158, 11, 0.12)"
                  : "rgba(148, 163, 184, 0.12)";
              const sevColor =
                rule.severity === "HIGH"
                  ? "#F87171"
                  : rule.severity === "MEDIUM"
                  ? "#FBBF24"
                  : "#94A3B8";
              const sevBorder =
                rule.severity === "HIGH"
                  ? "rgba(239, 68, 68, 0.25)"
                  : rule.severity === "MEDIUM"
                  ? "rgba(245, 158, 11, 0.25)"
                  : "rgba(148, 163, 184, 0.25)";

              return (
                <div
                  key={rule.code}
                  className="rounded-xl border transition-all duration-150 overflow-hidden"
                  style={{
                    background: isExpanded
                      ? "linear-gradient(145deg, rgba(16, 26, 42, 0.95), rgba(11, 18, 30, 0.95))"
                      : "rgba(11, 18, 30, 0.65)",
                    borderColor: isExpanded
                      ? "rgba(229, 184, 66, 0.35)"
                      : "var(--ll-color-line)",
                    boxShadow: isExpanded ? "0 8px 30px rgba(0,0,0,0.3)" : "none"
                  }}
                >
                  {/* Card Header Row */}
                  <div
                    onClick={() => setExpandedRuleCode(isExpanded ? null : rule.code)}
                    className="p-4.5 sm:p-5 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-[280px]">
                      {/* Code Badge */}
                      <span
                        className="px-3 py-1.5 rounded-lg text-xs font-mono font-bold tracking-wide border flex-shrink-0"
                        style={{
                          background: "rgba(10, 16, 27, 0.9)",
                          color: "var(--ll-color-gold)",
                          borderColor: "rgba(229, 184, 66, 0.3)"
                        }}
                      >
                        {rule.code}
                      </span>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className="text-sm font-bold"
                            style={{ color: "var(--ll-color-ink)" }}
                          >
                            {rule.name}
                          </h4>
                          {meta.statutory_ref && (
                            <span
                              className="text-[11px] font-mono px-2 py-0.5 rounded border"
                              style={{
                                color: "#38BDF8",
                                borderColor: "rgba(56, 189, 248, 0.25)",
                                background: "rgba(56, 189, 248, 0.08)"
                              }}
                            >
                              {meta.statutory_ref}
                            </span>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                          <span>Category: <strong className="text-slate-300 font-medium">{rule.category}</strong></span>
                          <span>•</span>
                          <span>Version: <span className="font-mono text-slate-300">{rule.version}</span></span>
                          <span>•</span>
                          <span>Effective: <span className="text-slate-300">{rule.effective}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action & Badges */}
                    <div className="flex items-center gap-3">
                      <span
                        className="px-2.5 py-1 rounded-full text-[10.5px] font-bold uppercase tracking-wider border"
                        style={{
                          background: sevBg,
                          color: sevColor,
                          borderColor: sevBorder
                        }}
                      >
                        {rule.severity} SEVERITY
                      </span>

                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-bold border"
                        style={{
                          background: "rgba(16, 185, 129, 0.12)",
                          color: "#34D399",
                          borderColor: "rgba(16, 185, 129, 0.25)"
                        }}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {rule.status}
                      </span>

                      <button
                        className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
                        title={isExpanded ? "Collapse rule details" : "Expand rule details"}
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* ── EXPANDED STATUTORY BREAKDOWN ── */}
                  {isExpanded && (
                    <div
                      className="px-5 pb-5 pt-1 border-t space-y-4"
                      style={{
                        borderColor: "rgba(229, 184, 66, 0.15)",
                        background: "rgba(7, 12, 20, 0.55)"
                      }}
                    >
                      {/* Legal Rationale */}
                      {meta.rationale && (
                        <div className="pt-2">
                          <p className="text-xs text-slate-300 leading-relaxed font-sans">
                            {meta.rationale}
                          </p>
                        </div>
                      )}

                      {/* Required Terms Pills */}
                      {meta.terms && (
                        <div>
                          <div className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            Prescribed Legal Keywords & Valid Standard Declarations:
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            {meta.terms.map((term, i) => (
                              <span
                                key={i}
                                className="px-2.5 py-1 rounded-md text-[11px] font-mono border"
                                style={{
                                  background: "rgba(16, 27, 43, 0.9)",
                                  borderColor: "var(--ll-color-line)",
                                  color: "var(--ll-color-ink)"
                                }}
                              >
                                {term}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Penalty & Statutory Compounding Box */}
                      {meta.penalty_section && (
                        <div
                          className="p-3.5 rounded-xl border flex items-start gap-3"
                          style={{
                            background: "rgba(239, 68, 68, 0.06)",
                            borderColor: "rgba(239, 68, 68, 0.2)"
                          }}
                        >
                          <Shield size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="text-xs">
                            <div className="font-bold text-red-300 mb-0.5">
                              Enforcement Penalty Provision ({meta.penalty_section})
                            </div>
                            <div className="text-slate-300 leading-normal">
                              {meta.fine}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── FOOTER LEGAL NOTE ── */}
      <div
        className="px-6 py-4 border-t flex flex-wrap items-center justify-between gap-3 text-xs"
        style={{
          borderColor: "var(--ll-color-line)",
          background: "rgba(6, 10, 18, 0.7)"
        }}
      >
        <div className="flex items-center gap-2 text-slate-400">
          <Info size={13} className="text-amber-400 flex-shrink-0" />
          <span>
            Statutory rule matrix verified under official Ministry of Consumer Affairs notifications.
          </span>
        </div>
        <div className="font-mono text-[11px] text-slate-500">
          Rule Engine: Deterministic Python Evaluation
        </div>
      </div>
    </div>
  );
}