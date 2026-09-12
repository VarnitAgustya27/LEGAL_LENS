import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  ScanLine, Scale, ClipboardList, ScrollText, User, ChevronRight,
  ShieldCheck, ShieldAlert, AlertTriangle, Eye, ArrowUpRight, CheckCircle2,
  Package, Plus, Sparkles, FileText, ExternalLink
} from "lucide-react";
import { C, FONT } from "../../constants.jsx";
import { fetchInspections } from "../../services/supabaseInspectionService.js";

export default function CustomerDashboard({
  currentUser,
  isDark,
  onNewInspection,
  onCompareProducts,
  onOpenHistory,
  onOpenRules,
  onOpenAccount,
  onOpenInspection
}) {
  const [scans, setScans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadScans() {
      try {
        setLoading(true);
        const res = await fetchInspections();
        const scanArray = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
        const userScans = scanArray.filter(item => {
          if (!currentUser?.email) return false;
          return item.inspector_email && item.inspector_email.toLowerCase() === currentUser.email.toLowerCase();
        });
        setScans(userScans);
      } catch (err) {
        console.warn("Could not load customer scans:", err);
        setScans([]);
      } finally {
        setLoading(false);
      }
    }
    loadScans();
  }, [currentUser]);

  const safeScans = Array.isArray(scans) ? scans : [];
  const totalScans = safeScans.length;
  const compliantScans = safeScans.filter((s) => s.status === "Compliant" || s.compliance_score >= 80).length;
  const grievancesFiled = safeScans.filter((s) => s.grievance_filed || s.status === "Violation").length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* HERO WELCOME BANNER */}
      <div
        className="relative overflow-hidden rounded-2xl p-6 sm:p-8 border shadow-xl backdrop-blur-md"
        style={{
          background: isDark
            ? "linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(6,10,17,0.85) 100%)"
            : "linear-gradient(135deg, rgba(16,185,129,0.1) 0%, rgba(245,245,247,0.95) 100%)",
          borderColor: isDark ? "rgba(16,185,129,0.3)" : "rgba(16,185,129,0.2)",
        }}
      >
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-3 border bg-emerald-500/15 text-emerald-400 border-emerald-500/30">
              <Sparkles size={13} />
              <span>PUBLIC CITIZEN CONSUMER PORTAL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
              Welcome back, {currentUser?.name || "Valued Consumer"}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-xl">
              Verify packaged product declarations, check printed MRP accuracy against statutory Legal Metrology PCR 2011 rules, and compare products side-by-side.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onNewInspection}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-lg hover:scale-105 cursor-pointer"
              style={{ background: "#10B981", color: "#060A11" }}
            >
              <ScanLine size={16} />
              <span>Scan New Product</span>
            </button>
            <button
              type="button"
              onClick={onCompareProducts}
              className="px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all border cursor-pointer hover:bg-white/5"
              style={{ borderColor: "rgba(16,185,129,0.4)", color: "#34D399" }}
            >
              <Scale size={16} />
              <span>Compare Products</span>
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ACTION NAVIGATION GRID */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3.5">
        <button
          type="button"
          onClick={onNewInspection}
          className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ScanLine size={20} />
          </div>
          <div className="text-sm font-bold text-slate-200">Scan Product</div>
          <div className="text-[11px] text-slate-400 mt-0.5">AI Label Verification</div>
        </button>

        <button
          type="button"
          onClick={onCompareProducts}
          className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <Scale size={20} />
          </div>
          <div className="text-sm font-bold text-slate-200">Compare Products</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Side-by-side audit</div>
        </button>

        <button
          type="button"
          onClick={onOpenHistory}
          className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-cyan-500/15 text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ClipboardList size={20} />
          </div>
          <div className="text-sm font-bold text-slate-200">Scanned History</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Past Product Audits</div>
        </button>

        <button
          type="button"
          onClick={onOpenRules}
          className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm"
          style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ScrollText size={20} />
          </div>
          <div className="text-sm font-bold text-slate-200">Rule Repository</div>
          <div className="text-[11px] text-slate-400 mt-0.5">PCR 2011 Rules</div>
        </button>

        <button
          type="button"
          onClick={onOpenAccount}
          className="p-4 rounded-xl border text-left transition-all hover:scale-[1.02] cursor-pointer group shadow-sm col-span-2 md:col-span-1"
          style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}
        >
          <div className="w-10 h-10 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <User size={20} />
          </div>
          <div className="text-sm font-bold text-slate-200">Manage Account</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Profile & Settings</div>
        </button>
      </div>

      {/* METRICS SUMMARY */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center font-bold text-xl">
            <ScanLine size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{totalScans}</div>
            <div className="text-xs text-slate-400 font-medium">Total Products Scanned</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center font-bold text-xl">
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{compliantScans}</div>
            <div className="text-xs text-slate-400 font-medium">Compliant Labels Verified</div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-slate-900/60 border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-xl">
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="text-2xl font-black text-slate-100">{grievancesFiled}</div>
            <div className="text-xs text-slate-400 font-medium">Violations & Grievances</div>
          </div>
        </div>
      </div>

      {/* RECENT SCANNED PRODUCTS HISTORY TABLE */}
      <div className="rounded-2xl border overflow-hidden shadow-md" style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}>
        <div className="p-5 border-b flex items-center justify-between gap-4" style={{ borderColor: "var(--ll-color-line)" }}>
          <div>
            <h3 className="text-base font-bold text-slate-100">Recent Scanned Products</h3>
            <p className="text-xs text-slate-400">Products scanned by you for Legal Metrology compliance</p>
          </div>
          <button
            type="button"
            onClick={onOpenHistory}
            className="text-xs font-bold text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View Full History</span>
            <ChevronRight size={14} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-sm">Loading scanned products...</div>
        ) : scans.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <Package size={36} className="mx-auto text-slate-600" />
            <div className="text-sm font-bold text-slate-300">No scanned products yet</div>
            <p className="text-xs max-w-sm mx-auto text-slate-500">
              Start by scanning a packaged commodity label to verify printed MRP, packer details, and net weight under PCR 2011.
            </p>
            <button
              type="button"
              onClick={onNewInspection}
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer inline-flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>Scan Your First Product</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3.5 pl-5">Product / Case No.</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">MRP Printed</th>
                  <th className="p-3.5">Compliance Result</th>
                  <th className="p-3.5 text-right pr-5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {scans.slice(0, 5).map((scan, idx) => {
                  const score = scan.compliance_score ?? 84;
                  const isPass = score >= 80 || scan.status === "Compliant";
                  return (
                    <tr key={scan.id || scan.case_number || idx} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-5 font-medium text-slate-200">
                        <div className="font-bold text-slate-100">{scan.product_name || scan.commodity || "Packaged Product"}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{scan.case_number || `CASE-${scan.id}`}</div>
                      </td>
                      <td className="p-3.5 text-slate-400">{scan.category || "Packaged Commodity"}</td>
                      <td className="p-3.5 font-mono text-emerald-400 font-bold">{scan.mrp || "₹ 150.00"}</td>
                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          isPass
                            ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/15 text-red-400 border-red-500/30"
                        }`}>
                          {isPass ? <ShieldCheck size={12} /> : <ShieldAlert size={12} />}
                          <span>{isPass ? "COMPLIANT" : "VIOLATION DETECTED"}</span>
                        </span>
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        <button
                          type="button"
                          onClick={() => onOpenInspection && onOpenInspection(scan)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-[11px] transition-colors inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>View Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CONSUMER RIGHTS & PCR 2011 REFERENCE */}
      <div className="p-6 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <ScrollText size={18} />
            <span>Consumer Rights under Legal Metrology PCR 2011</span>
          </div>
          <button
            type="button"
            onClick={onOpenRules}
            className="text-xs font-bold text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Open Complete Rulebook</span>
            <ArrowUpRight size={13} />
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs text-slate-300">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <strong className="text-slate-100 block mb-1">1. MRP Inclusivity</strong>
            Every printed MRP must state "Inclusive of all taxes". Charging above printed MRP is a statutory offense.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <strong className="text-slate-100 block mb-1">2. Manufacturer & Packer</strong>
            Complete name and address of packer/manufacturer or importer must be clearly legibly printed.
          </div>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
            <strong className="text-slate-100 block mb-1">3. Net Quantity & Care</strong>
            Net weight/volume and official customer care phone & email must be provided on every pre-packaged product.
          </div>
        </div>
      </div>
    </div>
  );
}
