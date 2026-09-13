import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, ShieldAlert, Database, Users, Shield, UserCheck, User, Search,
  UserPlus, Edit, UserX, Trash2, Lock, X, AlertTriangle, Key, CheckCircle2, XCircle
} from "lucide-react";
import { C, FONT, inputStyle } from "../../constants.jsx";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import { Card, SectionLabel, Button, Field } from "../common/UIComponents.jsx";

export function AddUserModal({ onClose, onAdd }) {
  const [formData, setFormData] = useState({
    name: "",
    badge: `LMD-DL-${Math.floor(1000 + Math.random() * 9000)}`,
    role: "Enforcement Officer",
    email: "",
    jurisdiction: "Delhi Central Division",
    phone: "",
    active: true,
    pass: "",
  });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (val) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const rawDigits = val.replace(/\D/g, "");
    if (!val.trim()) {
      setPhoneError("");
    } else if (rawDigits.length > 10 && !(rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError(`Exceeds 10 digits (${rawDigits.length} digits entered)`);
    } else if (rawDigits.length === 10 || (rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone.trim()) {
      const phoneVal = validateMobileNumber(formData.phone);
      if (!phoneVal.valid) {
        setPhoneError(phoneVal.error);
      } else {
        setPhoneError("");
      }
    }
  };

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
    const phoneVal = validateMobileNumber(formData.phone);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error);
      return;
    }
    if (!formData.pass || formData.pass.length < 4) {
      setError("Set a login password of at least 4 characters.");
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
      phone: phoneVal.formatted,
      id: `USR-${Date.now().toString().slice(-4)}`,
      initials: initials || "OF",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ background: "var(--ll-modal-overlay)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="max-w-lg w-full"
      >
        <Card padded={false}>
          <div className="p-6 overflow-y-auto max-h-[90vh] ll-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-4 mb-4 border-b" style={{ borderColor: C.line }}>
              <div>
                <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.1em" }}>PROVISION ACCOUNT</div>
                <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>Add New Officer</h3>
              </div>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </motion.button>
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

                <Field label="Official Email" required={true}>
                  <input
                    style={inputStyle}
                    type="email"
                    placeholder="officer@lm.gov.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Field label="Jurisdiction / Division">
                  <input
                    style={inputStyle}
                    placeholder="e.g. West Delhi Division"
                    value={formData.jurisdiction}
                    onChange={(e) => setFormData({ ...formData, jurisdiction: e.target.value })}
                  />
                </Field>

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.charcoal }}>
                    Contact Mobile (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      borderColor: phoneError ? "#EF4444" : undefined,
                      boxShadow: phoneError ? "0 0 0 1px #EF4444" : undefined,
                    }}
                    placeholder="e.g. 9812345678"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                  />
                  {phoneError && (
                    <div className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label="Login Password" required={true}>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    style={{ ...inputStyle, paddingLeft: 32 }}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Password stored in officer_users.pass"
                    value={formData.pass}
                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                    required
                  />
                </div>
              </Field>

              <div className="p-3 rounded border text-xs text-slate-400 flex items-start gap-2" style={{ background: "var(--ll-bg-paper-deep)", borderColor: C.line }}>
                <Key size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span>
                  This password is saved to the officer’s <strong>pass</strong> column and is required at sign-in together with the badge ID.
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
      </motion.div>
    </motion.div>
  );
}

export function EditUserModal({ user, onClose, onSave }) {
  const [formData, setFormData] = useState({
    name: user.name,
    badge: user.badge || "LMD-DL-xxxx",
    role: user.role,
    email: user.email,
    jurisdiction: user.jurisdiction || "Delhi Division",
    phone: user.phone || "",
    active: user.active,
    pass: "",
  });
  const [error, setError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  const handlePhoneChange = (val) => {
    setFormData((prev) => ({ ...prev, phone: val }));
    const rawDigits = val.replace(/\D/g, "");
    if (!val.trim()) {
      setPhoneError("");
    } else if (rawDigits.length > 10 && !(rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError(`Exceeds 10 digits (${rawDigits.length} digits entered)`);
    } else if (rawDigits.length === 10 || (rawDigits.length === 12 && rawDigits.startsWith("91"))) {
      setPhoneError("");
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone.trim()) {
      const phoneVal = validateMobileNumber(formData.phone);
      if (!phoneVal.valid) {
        setPhoneError(phoneVal.error);
      } else {
        setPhoneError("");
      }
    }
  };

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
    const phoneVal = validateMobileNumber(formData.phone);
    if (!phoneVal.valid) {
      setPhoneError(phoneVal.error);
      return;
    }

    const initials = formData.name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

    const payload = {
      ...formData,
      phone: phoneVal.formatted,
      initials: initials || user.initials || "OF",
    };
    if (!payload.pass) delete payload.pass;
    onSave(payload);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
      style={{ background: "var(--ll-modal-overlay)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: "spring", stiffness: 320, damping: 26 }}
        className="max-w-lg w-full"
      >
        <Card padded={false}>
          <div className="p-6 overflow-y-auto max-h-[90vh] ll-scroll" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between pb-4 mb-4 border-b" style={{ borderColor: C.line }}>
              <div>
                <div style={{ ...FONT.mono, fontSize: 10.5, color: C.gold, letterSpacing: "0.1em" }}>MODIFICATION</div>
                <h3 style={{ ...FONT.display, fontSize: 20, fontWeight: 700, color: C.ink }}>Edit Officer Profile</h3>
              </div>
              <motion.button whileHover={{ scale: 1.15, rotate: 90 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="ll-focus p-1 text-slate-400 hover:text-slate-200 cursor-pointer">
                <X size={18} />
              </motion.button>
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

                <div>
                  <label className="block text-xs font-semibold mb-1" style={{ color: C.charcoal }}>
                    Contact Mobile (10 Digits) <span className="text-red-500">*</span>
                  </label>
                  <input
                    style={{
                      ...inputStyle,
                      borderColor: phoneError ? "#EF4444" : undefined,
                      boxShadow: phoneError ? "0 0 0 1px #EF4444" : undefined,
                    }}
                    placeholder="e.g. 9812345678"
                    value={formData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onBlur={handlePhoneBlur}
                    required
                  />
                  {phoneError && (
                    <div className="mt-1 text-[11px] text-red-500 font-medium flex items-center gap-1">
                      <AlertTriangle size={12} className="flex-shrink-0" />
                      <span>{phoneError}</span>
                    </div>
                  )}
                </div>
              </div>

              <Field label="New Login Password">
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    style={{ ...inputStyle, paddingLeft: 32 }}
                    type="password"
                    autoComplete="new-password"
                    placeholder="Leave blank to keep existing password"
                    value={formData.pass}
                    onChange={(e) => setFormData({ ...formData, pass: e.target.value })}
                  />
                </div>
              </Field>

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
      </motion.div>
    </motion.div>
  );
}

function validateMobileNumber(phoneStr) {
  if (!phoneStr || !phoneStr.trim()) {
    return { valid: false, error: "Please enter a 10-digit mobile number." };
  }
  const digits = phoneStr.replace(/\D/g, "");
  let tenDigits = "";
  if (digits.length === 10) {
    tenDigits = digits;
  } else if (digits.length === 12 && digits.startsWith("91")) {
    tenDigits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith("0")) {
    tenDigits = digits.slice(1);
  } else {
    return {
      valid: false,
      error: `Mobile number must contain exactly 10 digits (currently ${digits.length} digit${digits.length === 1 ? "" : "s"}).`,
    };
  }
  return { valid: true, formatted: `+91 ${tenDigits.slice(0, 5)} ${tenDigits.slice(5)}`, raw: tenDigits };
}

export default function SettingsPage({ users, onAddUser, onUpdateUser, onDeleteUser, currentUser, onSwitchRole, isDbConnected, onRefreshDb, onSeedDb, loadingDb }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [avatarMap, setAvatarMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("legallens_avatars") || "{}");
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from("officer_avatars")
        .select("badge, avatar_url")
        .then(({ data, error }) => {
          if (!error && data?.length) {
            setAvatarMap((prev) => {
              const updated = { ...prev };
              data.forEach((row) => {
                if (row.badge && row.avatar_url) {
                  updated[row.badge.trim()] = row.avatar_url;
                }
              });
              localStorage.setItem("legallens_avatars", JSON.stringify(updated));
              return updated;
            });
          }
        })
        .catch(() => { });
    }
  }, []);

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
          className="fixed bottom-6 right-6 z-50 ll-rise flex items-center gap-3 px-4 py-3 rounded-xl border shadow-xl backdrop-blur-md"
          style={{ background: "var(--ll-bg-sidebar)", color: "#fff", borderColor: C.gold }}
        >
          <CheckCircle2 size={18} style={{ color: "#C7A75A" }} />
          <span style={{ fontSize: 13, fontWeight: 600 }}>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-slate-300 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Database Connection & Role Status Banner */}
      <Card className="border-l-4 rounded-xl shadow-md" style={{ borderLeftColor: isAdmin ? "var(--ll-compliant)" : "var(--ll-review)" }}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-xs border"
              style={{
                background: isAdmin ? "var(--ll-compliant-bg)" : "var(--ll-review-bg)",
                borderColor: isAdmin ? "var(--ll-compliant-bd)" : "var(--ll-review-bd)"
              }}
            >
              {isAdmin ? (
                <ShieldCheck size={22} style={{ color: "var(--ll-compliant)" }} />
              ) : (
                <ShieldAlert size={22} style={{ color: "var(--ll-review)" }} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 style={{ ...FONT.display, fontSize: 16.5, fontWeight: 800, color: C.ink }}>
                  {isAdmin ? "Administrator Authority Active" : "Restricted Officer View — Read Only"}
                </h3>
                <span
                  className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold uppercase tracking-wider border shadow-2xs"
                  style={{
                    background: isAdmin ? "var(--ll-compliant-bg)" : "var(--ll-review-bg)",
                    color: isAdmin ? "var(--ll-compliant)" : "var(--ll-review)",
                    borderColor: isAdmin ? "var(--ll-compliant-bd)" : "var(--ll-review-bd)",
                  }}
                >
                  {currentUser?.role}
                </span>

                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border shadow-2xs"
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
          <Card key={label} padded={false} hoverEffect className="rounded-xl">
            <div className="p-5 flex items-center justify-between">
              <div>
                <div style={{ fontSize: 11, color: C.slate, fontWeight: 700, letterSpacing: "0.04em" }}>{label.toUpperCase()}</div>
                <div style={{ ...FONT.display, fontSize: 26, fontWeight: 800, color: C.ink, marginTop: 3 }}>{val}</div>
              </div>
              <motion.div
                whileHover={{ rotate: 10, scale: 1.15 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className="w-10 h-10 rounded-xl flex items-center justify-center border shadow-xs"
                style={{ background: col + "1A", borderColor: col + "33" }}
              >
                <Icon size={18} style={{ color: col }} />
              </motion.div>
            </div>
          </Card>
        ))}
      </div>

      {/* Directory Table Card */}
      <Card padded={false} className="rounded-xl overflow-hidden shadow-md">
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
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 overflow-hidden border shadow-sm"
                          style={{
                            background: "var(--ll-bg-sidebar)",
                            borderColor: "var(--ll-color-line)",
                            color: "#F0E4C4",
                          }}
                        >
                          {avatarMap[u.badge?.trim()] ? (
                            <img src={avatarMap[u.badge?.trim()]} alt={u.name} className="w-full h-full object-cover" />
                          ) : (
                            u.initials || (u.name ? u.name.slice(0, 2).toUpperCase() : "OF")
                          )}
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

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
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
      </AnimatePresence>

      <AnimatePresence>
        {deletingUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xs"
            style={{ background: "var(--ll-modal-overlay)" }}
            onClick={() => setDeletingUser(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="max-w-md w-full"
            >
              <Card padded={false}>
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
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
