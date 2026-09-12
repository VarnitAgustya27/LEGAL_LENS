import React from "react";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

export const C = {
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

export const FONT = {
  display: { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Segoe UI", sans-serif' },
  body: { fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Roboto, sans-serif' },
  mono: { fontFamily: '"SF Mono", "SFMono-Regular", Consolas, "Liberation Mono", monospace' },
};

export const GlobalStyle = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,500;8..60,600;8..60,700&family=IBM+Plex+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
    
    :root {
      --ll-bg-paper: #F5F5F7;
      --ll-bg-paper-deep: #ECECF0;
      --ll-bg-card: rgba(255,255,255,0.82);
      --ll-bg-header: rgba(255,255,255,0.78);
      --ll-bg-sidebar: #111318;
      --ll-color-ink: #1D1D1F;
      --ll-color-ink-soft: #3A3A3C;
      --ll-color-charcoal: #1D1D1F;
      --ll-color-slate: #6E6E73;
      --ll-color-gold: #A67C35;
      --ll-color-line: rgba(60,60,67,0.14);
      --ll-tr-hover: rgba(0,122,255,0.045);
      --ll-input-bg: rgba(255,255,255,0.90);
      --ll-input-text: #1D1D1F;
      --ll-table-head-bg: rgba(245,245,247,0.90);
      --ll-button-primary-bg: #1D1D1F;
      --ll-button-primary-color: #FFFFFF;
      --ll-compliant: #248A3D;
      --ll-compliant-bg: rgba(52,199,89,0.10);
      --ll-compliant-bd: rgba(52,199,89,0.22);
      --ll-violation: #D92D20;
      --ll-violation-bg: rgba(255,69,58,0.10);
      --ll-violation-bd: rgba(255,69,58,0.22);
      --ll-review: #B7791F;
      --ll-review-bg: rgba(255,159,10,0.11);
      --ll-review-bd: rgba(255,159,10,0.24);
      --ll-modal-overlay: rgba(0,0,0,0.45);
      --ll-hatch-line: rgba(29,29,31,0.035);
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

export function StatusMeta(status) {
  if (status === "COMPLIANT") return { label: "Compliant", color: C.compliant, bg: C.compliantBg, bd: C.compliantBd, Icon: ShieldCheck };
  if (status === "NON_COMPLIANT") return { label: "Non-Compliant", color: C.violation, bg: C.violationBg, bd: C.violationBd, Icon: ShieldAlert };
  return { label: "Requires Verification", color: C.review, bg: C.reviewBg, bd: C.reviewBd, Icon: ShieldQuestion };
}

export const inputStyle = {
  width: "100%", padding: "10px 13px", border: "1px solid var(--ll-color-line)", borderRadius: 6,
  background: "var(--ll-input-bg)", fontSize: 13.5, color: "var(--ll-input-text)", transition: "all 0.2s ease", ...FONT.body,
};

export const CATEGORIES = ["Packaged Food", "Cosmetics", "Household Chemicals", "Beverages", "Personal Care", "Stationery"];

export const STATS = { total: 1284, compliant: 812, nonCompliant: 341, review: 131 };

export const VIOLATIONS_BY_CATEGORY = [
  { category: "Packaged Food", violations: 128 },
  { category: "Cosmetics", violations: 96 },
  { category: "Household", violations: 54 },
  { category: "Beverages", violations: 41 },
  { category: "Personal Care", violations: 22 },
];

export const TREND = [
  { day: "Aug 25", inspections: 12 }, { day: "Aug 26", inspections: 18 },
  { day: "Aug 27", inspections: 15 }, { day: "Aug 28", inspections: 24 },
  { day: "Aug 29", inspections: 20 }, { day: "Aug 30", inspections: 28 },
  { day: "Aug 31", inspections: 35 },
];

export const COMMON_VIOLATIONS = [
  { rule: "PCR-MRP-001", desc: "MRP declaration missing or illegible", count: 84 },
  { rule: "PCR-COO-004", desc: "Country of origin not declared", count: 57 },
  { rule: "PCR-CC-007", desc: "Consumer care details incomplete", count: 45 },
  { rule: "PCR-NQ-002", desc: "Net quantity in non-standard unit", count: 33 },
];

export const INSPECTIONS = [
  { id: "LM/2026/000482", product: "Pintola High Protein Oats Chocolate 400g", category: "Packaged Food", manufacturer: "Das Superfoods Pvt. Ltd.", status: "NON_COMPLIANT", inspector: "Enforcement Officer", date: "2026-08-24", location: "Sabarkantha, Gujarat" },
  { id: "LM/2026/000481", product: "Silkessence Herbal Shampoo 340ml", category: "Cosmetics", manufacturer: "Silkessence Care Ltd.", status: "REVIEW", inspector: "A. Mehta", date: "2026-08-24", location: "Lajpat Nagar, Delhi" },
  { id: "LM/2026/000479", product: "Suvarna Refined Sunflower Oil 1L", category: "Packaged Food", manufacturer: "Suvarna Agro Industries", status: "COMPLIANT", inspector: "S. Iyer", date: "2026-08-23", location: "Connaught Place, Delhi" },
  { id: "LM/2026/000477", product: "Zesto Orange Drink 500ml", category: "Beverages", manufacturer: "Zesto Beverages Pvt. Ltd.", status: "COMPLIANT", inspector: "A. Mehta", date: "2026-08-22", location: "Rohini, Delhi" },
  { id: "LM/2026/000474", product: "Glow & Co. Vitamin C Cream 50g", category: "Cosmetics", manufacturer: "Glow & Co. Cosmetics (Imported)", status: "NON_COMPLIANT", inspector: "A. Mehta", date: "2026-08-21", location: "Nehru Place, Delhi" },
  { id: "LM/2026/000470", product: "Crispo Potato Wafers 90g", category: "Packaged Food", manufacturer: "Crispo Snacks Ltd.", status: "NON_COMPLIANT", inspector: "S. Iyer", date: "2026-08-20", location: "Dwarka, Delhi" },
  { id: "LM/2026/000468", product: "HomeShine Dish Wash Gel 500ml", category: "Household Chemicals", manufacturer: "HomeShine Chemicals Pvt. Ltd.", status: "COMPLIANT", inspector: "S. Iyer", date: "2026-08-19", location: "Pitampura, Delhi" },
];

export const RULES = [
  { code: "PCR-MRP-001", name: "Retail Sale Price (MRP) Declaration", category: "All Categories", severity: "HIGH", version: "2026.1", effective: "2026-01-01", status: "ACTIVE" },
  { code: "PCR-NQ-002", name: "Net Quantity Declaration", category: "All Categories", severity: "HIGH", version: "2026.1", effective: "2026-01-01", status: "ACTIVE" },
  { code: "PCR-MFR-003", name: "Manufacturer / Packer / Importer Details", category: "All Categories", severity: "HIGH", version: "2025.3", effective: "2025-07-01", status: "ACTIVE" },
  { code: "PCR-COO-004", name: "Country of Origin (Imported Goods)", category: "Imported Products", severity: "MEDIUM", version: "2025.3", effective: "2025-07-01", status: "ACTIVE" },
  { code: "PCR-MD-005", name: "Manufacturing / Packing Date", category: "All Categories", severity: "MEDIUM", version: "2025.1", effective: "2025-01-01", status: "ACTIVE" },
  { code: "PCR-BB-006", name: "Best Before / Expiry Date", category: "Packaged Food, Cosmetics", severity: "HIGH", version: "2025.1", effective: "2025-01-01", status: "ACTIVE" },
  { code: "PCR-CC-007", name: "Consumer Care Details", category: "All Categories", severity: "MEDIUM", version: "2024.2", effective: "2024-06-01", status: "ACTIVE" },
  { code: "PCR-USP-008", name: "Unit Sale Price Declaration", category: "Multi-piece Packages", severity: "LOW", version: "2024.2", effective: "2024-06-01", status: "SUPERSEDED" },
];

export const REQUIREMENTS = [
  { key: "manufacturer", label: "Manufacturer / Packer Details", status: "PASS", confidence: 98, rule: "PCR-MFR-003", detected: "Manufacturer Name & Full Address", reason: "Manufacturer name and address detected on package." },
  { key: "netQty", label: "Net Quantity", status: "PASS", confidence: 99, rule: "PCR-NQ-002", detected: "Standard Net Quantity", reason: "Declared in standard legal units." },
  { key: "mrp", label: "Maximum Retail Price (MRP)", status: "PASS", confidence: 98, rule: "PCR-MRP-001", detected: "Inclusive of all taxes", reason: "Mandatory Maximum Retail Price (MRP) verified." },
  { key: "coo", label: "Country of Origin", status: "PASS", confidence: 97, rule: "PCR-COO-004", detected: "Country of Origin", reason: "Country of Origin declared." },
  { key: "consumerCare", label: "Consumer Care Details", status: "PASS", confidence: 95, rule: "PCR-CC-007", detected: "Customer Care Phone & Email", reason: "Consumer grievance details verified." },
  { key: "mfgDate", label: "Manufacturing / Packing Date", status: "PASS", confidence: 95, rule: "PCR-MD-005", detected: "Month & Year of Manufacture", reason: "Manufacturing date declared." },
  { key: "bestBefore", label: "Best Before Date", status: "PASS", confidence: 95, rule: "PCR-BB-006", detected: "Best Before Period", reason: "Best before / expiry declared." },
];

export const EXTRACTED_DECLARATION = {
  "Product Name": "Extracted from Image",
  "Net Quantity": "Extracted from Image",
  "MRP": "Extracted from Image",
  "Manufacturer": "Extracted from Image",
  "Country of Origin": "Extracted from Image",
  "Consumer Care": "Extracted from Image",
};

export const PRODUCT_HISTORY = [
  { id: "LM/2026/000482", date: "2026-08-24", status: "NON_COMPLIANT", note: "MRP tax-inclusive qualifier missing" },
  { id: "LM/2026/000201", date: "2026-04-11", status: "NON_COMPLIANT", note: "Consumer care phone number illegible" },
  { id: "LM/2025/008857", date: "2025-11-02", status: "COMPLIANT", note: "All mandatory declarations verified" },
];

export const PRODUCTS = [
  { name: "Nutrimax Glucose Biscuits 200g", barcode: "8901234567891", category: "Packaged Food", inspections: 3, status: "NON_COMPLIANT" },
  { name: "Silkessence Herbal Shampoo 340ml", barcode: "8901234561122", category: "Cosmetics", inspections: 2, status: "REVIEW" },
  { name: "Suvarna Refined Sunflower Oil 1L", barcode: "8901234509877", category: "Packaged Food", inspections: 5, status: "COMPLIANT" },
  { name: "Zesto Orange Drink 500ml", barcode: "8901234533221", category: "Beverages", inspections: 4, status: "COMPLIANT" },
  { name: "Glow & Co. Vitamin C Cream 50g", barcode: "8901234598765", category: "Cosmetics", inspections: 1, status: "NON_COMPLIANT" },
];

export const REPORTS = INSPECTIONS.map((i) => ({ ...i }));

export const INITIAL_USERS = [
  { id: "USR-001", name: "Poonam Desai", role: "Admin", email: "p.desai@lm.gov.in", badge: "LMD-HQ-001", jurisdiction: "National Directorate / HQ", active: true, phone: "+91 98112 34501", initials: "PD" },
  { id: "USR-002", name: "Enforcement Officer", role: "Enforcement Officer", email: "officer@lm.gov.in", badge: "LM-DL-842", jurisdiction: "Delhi North & Central", active: true, phone: "+91 98230 45612", initials: "EO" },
  { id: "USR-003", name: "Aditi Mehta", role: "Enforcement Officer", email: "a.mehta@lm.gov.in", badge: "LMD-DL-0418", jurisdiction: "Delhi South & East", active: true, phone: "+91 98765 43210", initials: "AM" },
  { id: "USR-004", name: "Sanjay Iyer", role: "Reviewer", email: "s.iyer@lm.gov.in", badge: "LMD-REV-008", jurisdiction: "Appellate & Review Cell", active: true, phone: "+91 99100 87654", initials: "SI" },
  { id: "USR-005", name: "Karan Vohra", role: "Reviewer", email: "k.vohra@lm.gov.in", badge: "LMD-REV-014", jurisdiction: "Special Compliance Unit", active: false, phone: "+91 98321 09876", initials: "KV" },
  { id: "USR-006", name: "Rajesh Kumar (Citizen)", role: "Consumer", email: "consumer@gmail.com", badge: "CITIZEN-DL-901", jurisdiction: "Public Consumer Portal", active: true, phone: "+91 98100 12345", initials: "RK" },
];

export const ROLE_PERMISSIONS = {
  "Admin": { canManageUsers: true, canSubmitVerdict: true, canExportPDF: true, canFileGrievance: false, canViewSettings: true },
  "Enforcement Officer": { canManageUsers: false, canSubmitVerdict: true, canExportPDF: true, canFileGrievance: false, canViewSettings: false },
  "Reviewer": { canManageUsers: false, canSubmitVerdict: true, canExportPDF: true, canFileGrievance: false, canViewSettings: false },
  "Consumer": { canManageUsers: false, canSubmitVerdict: false, canExportPDF: false, canFileGrievance: true, canViewSettings: false },
};

export const OFFICER_PUBLIC_COLUMNS = "id, custom_id, name, badge, role, email, jurisdiction, phone, active, initials, created_at";
export const LOCAL_DEMO_PASSWORD = "password123";

export function publicOfficerProfile(row) {
  if (!row) return null;
  const { pass, password, ...rest } = row;
  return rest;
}

export function passwordsMatch(stored, entered) {
  if (stored == null || entered == null) return false;
  return String(stored) === String(entered);
}

export const PIPELINE_STAGES = [
  "Image preprocessing", "Text region detection", "OCR extraction",
  "Declaration structuring", "Product classification", "Applicable rule retrieval",
  "Compliance validation", "Evidence mapping", "Report generation",
];
