import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, AlertTriangle, ShieldCheck, CheckCircle2, Upload, FileText } from "lucide-react";
import { C, FONT, inputStyle } from "../../constants.jsx";

export default function ConsumerGrievanceModal({ open, onClose, inspection, currentUser, onSubmitGrievance }) {
  const [violationType, setViolationType] = useState("OVERCHARGING_MRP");
  const [storeLocation, setStoreLocation] = useState(inspection?.location || "Local Supermarket / Retail Store");
  const [consumerNotes, setConsumerNotes] = useState("");
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || "");
  const [contactEmail, setContactEmail] = useState(currentUser?.email || "");
  const [submitting, setSubmitting] = useState(false);
  const [successRef, setSuccessRef] = useState(null);

  if (!open) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    const grievanceId = `GRV/2026/${Math.floor(100000 + Math.random() * 900000)}`;

    const grievancePayload = {
      ...inspection,
      case_number: grievanceId,
      id: grievanceId,
      product_name: inspection?.product_name || inspection?.product || "Packaged Commodity",
      category: inspection?.category || "Packaged Food",
      status: "REVIEW",
      score: inspection?.score || 60,
      inspector_name: `Citizen Grievance (${currentUser?.name || "Consumer"})`,
      inspector_email: contactEmail,
      inspector_badge: currentUser?.badge || "CITIZEN-PORTAL",
      location: storeLocation,
      notes: `[CONSUMER GRIEVANCE - ${violationType}]: ${consumerNotes}`,
      is_grievance: true,
      created_at: new Date().toISOString(),
    };

    try {
      if (onSubmitGrievance) {
        await onSubmitGrievance(grievancePayload);
      }
      setSuccessRef(grievanceId);
    } catch (err) {
      console.error("Grievance submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="max-w-lg w-full rounded-2xl overflow-hidden border shadow-2xl"
        style={{ background: "var(--ll-bg-card)", borderColor: "var(--ll-color-line)" }}
      >
        <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--ll-color-line)" }}>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm">
              ⚖
            </div>
            <div>
              <h3 style={{ ...FONT.display, fontSize: 16, fontWeight: 700, color: "var(--ll-color-ink)" }}>
                Lodge Consumer Grievance
              </h3>
              <p className="text-[11px] text-slate-400">Legal Metrology (Packaged Commodities) Rules, 2011</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white">
            <X size={18} />
          </button>
        </div>

        {successRef ? (
          <div className="p-6 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto text-2xl font-bold">
              ✓
            </div>
            <h4 className="text-lg font-bold text-slate-100">Grievance Successfully Registered</h4>
            <p className="text-xs text-slate-300">
              Your grievance has been submitted directly to the Legal Metrology Officers' inspection portal.
            </p>
            <div className="p-3 rounded-xl bg-slate-900/80 border border-emerald-500/30 text-xs font-mono text-emerald-300">
              Reference Tracking ID: <strong>{successRef}</strong>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-colors"
            >
              Done & Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-start gap-2">
              <AlertTriangle size={16} className="flex-shrink-0 mt-0.5" />
              <div>
                <strong>Public Consumer Right:</strong> Selling packaged goods above MRP, without manufacturer details, or with misleading net quantity is an offense punishable under Section 36 of the Legal Metrology Act, 2009.
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
                Product Name
              </label>
              <input
                style={inputStyle}
                value={inspection?.product_name || inspection?.product || "Packaged Commodity"}
                readOnly
                className="opacity-75 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
                  Primary Violation Category <span className="text-red-500">*</span>
                </label>
                <select
                  style={inputStyle}
                  value={violationType}
                  onChange={(e) => setViolationType(e.target.value)}
                >
                  <option value="OVERCHARGING_MRP">Overcharging Above Declared MRP</option>
                  <option value="MISSING_MANUFACTURER">Missing Manufacturer / Packer Info</option>
                  <option value="MISSING_NET_QTY">Misleading or Short Net Quantity</option>
                  <option value="MISSING_DATE">Missing Manufacturing / Expiry Date</option>
                  <option value="NO_CUSTOMER_CARE">No Consumer Care Number / Email</option>
                  <option value="STICKER_OVER_MRP">Sticker Pasted Over Original MRP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
                  Store / Platform Name & Location
                </label>
                <input
                  style={inputStyle}
                  placeholder="e.g. Metro Mart, Connaught Place, New Delhi"
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
                Grievance Details & Evidence Description <span className="text-red-500">*</span>
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: 70 }}
                placeholder="Describe where and how the violation occurred (e.g. Charged ₹150 for a bottle with MRP declared as ₹120)..."
                value={consumerNotes}
                onChange={(e) => setConsumerNotes(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
                  Contact Mobile Number
                </label>
                <input
                  style={inputStyle}
                  placeholder="+91 98100 12345"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1" style={{ color: "var(--ll-color-ink)" }}>
                  Contact Email
                </label>
                <input
                  style={inputStyle}
                  type="email"
                  placeholder="consumer@example.com"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: "var(--ll-color-line)" }}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>{submitting ? "Submitting..." : "Submit Grievance to Officers →"}</span>
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
