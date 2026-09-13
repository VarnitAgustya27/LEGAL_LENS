import React, { useState } from "react";
import { User, Mail, Shield, Bell, Key, Check, Camera, Sparkles } from "lucide-react";
import { C, FONT } from "../../constants.jsx";

export default function CustomerAccountSettings({ currentUser, avatarUrl, onUpdateAvatar, isDark }) {
  const [name, setName] = useState(currentUser?.name || "Rajesh Kumar (Citizen)");
  const [email, setEmail] = useState(currentUser?.email || "customer@gmail.com");
  const [savedMsg, setSavedMsg] = useState("");
  const [notifications, setNotifications] = useState(true);

  const handleSaveProfile = (e) => {
    e?.preventDefault();
    setSavedMsg("Account profile updated successfully.");
    setTimeout(() => setSavedMsg(""), 4000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* HEADER */}
      <div className="p-6 rounded-2xl border bg-slate-900/60 border-slate-800 flex items-center justify-between">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold mb-2 bg-purple-500/15 text-purple-300 border border-purple-500/30">
            <User size={14} />
            <span>CONSUMER PROFILE & PREFERENCES</span>
          </div>
          <h2 className="text-2xl font-extrabold text-slate-100">Manage Account</h2>
          <p className="text-slate-400 text-xs mt-1">
            Update your public citizen details, notification preferences, and account security.
          </p>
        </div>

        <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center justify-center font-bold text-xl overflow-hidden shadow-inner">
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            currentUser?.initials || "RK"
          )}
        </div>
      </div>

      {savedMsg && (
        <div className="p-4 rounded-xl border bg-emerald-500/15 border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <Check size={16} />
          <span>{savedMsg}</span>
        </div>
      )}

      {/* PROFILE FORM */}
      <div className="p-6 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-6">
        <h3 className="text-sm font-bold text-slate-200 uppercase font-mono tracking-wider">
          Personal Information
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-9 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Email Address</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">✉️</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-400 font-medium mb-1">Citizen Registration Badge</label>
              <input
                type="text"
                disabled
                value={currentUser?.badge || "CITIZEN-DL-901"}
                className="w-full p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-medium mb-1">Jurisdiction / Portal Access</label>
              <input
                type="text"
                disabled
                value={currentUser?.jurisdiction || "Public Consumer Portal"}
                className="w-full p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 text-xs cursor-not-allowed"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all cursor-pointer shadow-md"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* NOTIFICATIONS & SECURITY */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Bell size={16} className="text-emerald-400" />
            <span>Notification Preferences</span>
          </div>
          <p className="text-xs text-slate-400">Receive email alerts for filed grievances & PCR rule updates.</p>
          <label className="flex items-center gap-3 text-xs text-slate-300 cursor-pointer pt-2">
            <input
              type="checkbox"
              checked={notifications}
              onChange={(e) => setNotifications(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-700"
            />
            <span>Enable Email Notifications for Grievance Updates</span>
          </label>
        </div>

        <div className="p-6 rounded-2xl border bg-slate-900/40 border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-200">
            <Shield size={16} className="text-purple-400" />
            <span>Account Security</span>
          </div>
          <p className="text-xs text-slate-400">Password protected public consumer account.</p>
          <button
            type="button"
            onClick={() => alert("Password reset link dispatched to your email address.")}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <Key size={14} />
            <span>Change Account Password</span>
          </button>
        </div>
      </div>
    </div>
  );
}
