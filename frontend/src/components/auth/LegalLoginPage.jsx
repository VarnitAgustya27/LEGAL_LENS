import React, { useState } from "react";
import { supabase, isSupabaseConfigured } from "../../supabaseClient";
import {
  OFFICER_PUBLIC_COLUMNS,
  LOCAL_DEMO_PASSWORD,
  passwordsMatch,
  publicOfficerProfile
} from "../../constants.jsx";

// ── DEDICATED CUSTOMER LOGIN & SIGNUP PAGE ──
export function CustomerLoginPage({ onLogin, users = [], onBackToPortal, onSwitchToOfficer }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleCustomerSubmit = async (e) => {
    e?.preventDefault();
    setLoginError("");

    const identifier = email.trim().toLowerCase();

    // ── SIGN UP MODE ──
    if (isSignUp) {
      if (!name.trim()) {
        setLoginError("Please enter your full name.");
        return;
      }
      if (!identifier || !identifier.includes("@")) {
        setLoginError("Please enter a valid email address.");
        return;
      }
      if (!password) {
        setLoginError("Please create a password.");
        return;
      }
      if (password.length < 4) {
        setLoginError("Password must be at least 4 characters long.");
        return;
      }
      if (password !== confirmPassword) {
        setLoginError("Passwords do not match. Please verify your password.");
        return;
      }

      setLoading(true);

      const parts = name.trim().split(" ");
      const initials = (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase() || "RK";

      const newCustomer = {
        id: `USR-CUST-${Date.now().toString().slice(-4)}`,
        name: name.trim(),
        role: "Consumer",
        email: identifier,
        badge: `CITIZEN-${Math.floor(1000 + Math.random() * 9000)}`,
        jurisdiction: "Public Consumer Portal",
        active: true,
        initials: initials
      };

      if (isSupabaseConfigured() && supabase) {
        try {
          await supabase.from("officer_users").insert([{
            custom_id: newCustomer.id,
            name: newCustomer.name,
            badge: newCustomer.badge,
            role: "Consumer",
            email: newCustomer.email,
            jurisdiction: "Public Consumer Portal",
            active: true,
            initials: newCustomer.initials,
            pass: password
          }]);
        } catch (err) {
          console.warn("Supabase customer registration note:", err);
        }
      }

      setLoading(false);
      onLogin(publicOfficerProfile(newCustomer));
      return;
    }

    // ── SIGN IN MODE ──
    if (!identifier) {
      setLoginError("Please enter your email address.");
      return;
    }
    if (!password) {
      setLoginError("Please enter your password.");
      return;
    }

    const consumerUser = (users || []).find(
      (u) => u.email?.toLowerCase() === identifier || u.role === "Consumer"
    ) || {
      id: "USR-006",
      name: "Rajesh Kumar (Citizen)",
      role: "Consumer",
      email: identifier.includes("@") ? identifier : "customer@gmail.com",
      badge: "CITIZEN-DL-901",
      jurisdiction: "Public Consumer Portal",
      active: true,
      initials: "RK"
    };

    onLogin(publicOfficerProfile(consumerUser));
  };

  return (
    <div className="legal-login-page">
      <div className="login-bg-grid"></div>
      <div className="login-orb orb-one" style={{ background: "rgba(16,185,129,0.15)" }}></div>
      <div className="login-orb orb-two"></div>

      {/* LEFT SIDE SHOWCASE */}
      <div className="login-showcase">
        <div className="login-topbar">
          <button type="button" className="legal-logo" onClick={onBackToPortal}>
            <div className="logo-symbol" style={{ background: "#10B981" }}>⚖</div>
            <div>
              <h3>LEGAL LENS</h3>
              <span>PUBLIC CITIZEN PORTAL</span>
            </div>
          </button>

          <button type="button" className="back-portal-btn" onClick={onBackToPortal}>
            ← Back to Main Page
          </button>
        </div>

        <div className="login-showcase-content">
          <div className="live-security-badge" style={{ background: "rgba(16,185,129,0.15)", color: "#34D399", borderColor: "rgba(16,185,129,0.3)" }}>
            <span className="pulse-dot" style={{ background: "#10B981" }}></span>
            PUBLIC CONSUMER PROTECTION NETWORK
          </div>

          <h1>
            Empowering Citizens.
            <br />
            <span style={{ color: "#34D399" }}>Verify Product MRP & Labels.</span>
            <br />
            Lodge Instant Grievances.
          </h1>

          <p>
            LEGAL LENS enables everyday consumers across India to verify mandatory Legal Metrology declarations on packaged goods, detect illegal overpricing beyond printed MRP, and submit evidence-backed complaints directly under PCR 2011.
          </p>

          {/* Scanner Visual for Citizen */}
          <div className="scanner-preview" style={{ borderColor: "rgba(16,185,129,0.3)" }}>
            <div className="scanner-header">
              <div>
                <span className="scanner-label" style={{ color: "#34D399" }}>
                  CITIZEN PRODUCT VERIFICATION
                </span>
                <h4>Package Declaration Check</h4>
              </div>

              <div className="scanner-live" style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}>
                <span style={{ background: "#10B981" }}></span>
                ONLINE VERIFICATION
              </div>
            </div>

            <div className="scanner-body">
              <div className="product-box">
                <span className="package-icon">🛍</span>
                <div className="scan-line" style={{ background: "linear-gradient(90deg, transparent, #10B981, transparent)" }}></div>
                <div className="corner top-left" style={{ borderColor: "#10B981" }}></div>
                <div className="corner top-right" style={{ borderColor: "#10B981" }}></div>
                <div className="corner bottom-left" style={{ borderColor: "#10B981" }}></div>
                <div className="corner bottom-right" style={{ borderColor: "#10B981" }}></div>
              </div>

              <div className="scan-results">
                <div className="result-item success">
                  <span>✓</span>
                  <strong>MRP Compliance Verified</strong>
                </div>

                <div className="result-item success">
                  <span>✓</span>
                  <strong>Manufacturer Address Details</strong>
                </div>

                <div className="result-item warning">
                  <span>!</span>
                  <strong>Manufacturing Date Audit</strong>
                </div>

                <div className="result-item danger">
                  <span>✕</span>
                  <strong>Customer Helpline Missing</strong>
                </div>
              </div>
            </div>

            <div className="scanner-footer">
              <div>
                <span>CITIZEN RIGHTS</span>
                <strong>Legal Metrology PCR 2011</strong>
              </div>

              <div className="compliance-score">
                <span>LABEL SCORE</span>
                <strong style={{ color: "#34D399" }}>PASSED CHECK</strong>
              </div>
            </div>
          </div>

          <div className="login-feature-row mt-6">
            <div className="login-feature">
              <div className="feature-icon">🛍</div>
              <div>
                <strong>MRP Overcharge Check</strong>
                <span>Verify printed prices</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">📦</div>
              <div>
                <strong>Label Declaration Audit</strong>
                <span>Check packer & net quantity</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">⚖</div>
              <div>
                <strong>Lodge Grievance</strong>
                <span>Direct statutory reporting</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-bottom-status">
          <div>
            <span className="secure-dot" style={{ background: "#10B981" }}></span>
            PUBLIC CITIZEN ACCESS NETWORK
          </div>
          <span>LEGAL METROLOGY CONSUMER RIGHTS PORTAL</span>
        </div>
      </div>

      {/* RIGHT SIDE CUSTOMER FORM (WITH SIGN IN / SIGN UP TOGGLE) */}
      <div className="login-panel">
        <div className="login-form-container">
          
          {/* Mode Switcher Tabs */}
          <div className="mb-5 p-1 rounded-xl bg-slate-900/90 border border-slate-700/80 flex gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setLoginError("");
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                !isSignUp
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>🔑</span> Customer Sign In
            </button>

            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setLoginError("");
              }}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                isSignUp
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs"
                  : "text-slate-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>✨</span> Create Account
            </button>
          </div>

          <div className="login-form-header">
            <div className="officer-shield text-emerald-400" style={{ background: "rgba(16,185,129,0.18)", borderColor: "rgba(16,185,129,0.4)" }}>🛍</div>
            <div>
              <span className="text-emerald-400 font-mono text-[10px] tracking-wider uppercase font-bold">PUBLIC CITIZEN PORTAL</span>
              <h2>{isSignUp ? "Create Account" : "Customer Login"}</h2>
            </div>
          </div>

          <p className="login-subtitle">
            {isSignUp
              ? "Register your public citizen account to verify product labels, audit MRP compliance, and lodge legal grievances."
              : "Welcome back! Sign in to verify packaged product declarations, inspect retail prices, and lodge statutory grievances."}
          </p>

          <form className="premium-login-form" onSubmit={handleCustomerSubmit}>
            {/* Full Name field (Sign Up mode only) */}
            {isSignUp && (
              <div className="premium-input-group">
                <label>Full Name</label>
                <div className="premium-input">
                  <span className="input-symbol">👤</span>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {/* Email Address */}
            <div className="premium-input-group">
              <label>Customer Email Address</label>
              <div className="premium-input">
                <span className="input-symbol">✉️</span>
                <input
                  type="email"
                  placeholder="e.g. customer@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="premium-input-group">
              <div className="password-heading">
                <label>{isSignUp ? "Create Password" : "Password"}</label>
              </div>

              <div className="premium-input">
                <span className="input-symbol">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={isSignUp ? "Create a password (min 4 chars)" : "Enter your password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  required
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm Password (Sign Up mode only) */}
            {isSignUp && (
              <div className="premium-input-group">
                <div className="password-heading">
                  <label>Confirm Password</label>
                </div>

                <div className="premium-input">
                  <span className="input-symbol">🔒</span>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Re-enter your password to confirm"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required={isSignUp}
                  />
                </div>
              </div>
            )}

            {loginError && (
              <div className="mb-4 p-3 rounded-lg border text-xs flex items-center gap-2 bg-red-500/10 border-red-500/30 text-red-500">
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="premium-login-btn font-bold cursor-pointer mt-2"
              style={{ background: "#10B981", color: "#060A11" }}
              disabled={loading}
            >
              <span>
                {loading
                  ? "Processing..."
                  : isSignUp
                  ? "Create Account & Access Portal →"
                  : "Sign In to Consumer Portal →"}
              </span>
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="mt-5 pt-3 border-t border-slate-800/80 text-center text-xs text-slate-400">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(false);
                    setLoginError("");
                  }}
                  className="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer"
                >
                  Sign In →
                </button>
              </>
            ) : (
              <>
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(true);
                    setLoginError("");
                  }}
                  className="text-emerald-400 font-bold hover:underline ml-1 cursor-pointer"
                >
                  Create Account / Sign Up →
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── DEDICATED OFFICER LOGIN PAGE ──
export function OfficerLoginPage({ onLogin, users = [], onBackToPortal, onSwitchToCustomer }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const handleOfficerLogin = async (e) => {
    e?.preventDefault();
    setLoginError("");

    const identifier = email.trim();
    if (!identifier || !password) {
      setLoginError("Please enter your official Officer ID / Email and security password.");
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured() && supabase) {
        let query = supabase
          .from("officer_users")
          .select(`${OFFICER_PUBLIC_COLUMNS}, pass`);

        if (identifier.includes("@")) {
          query = query.ilike("email", identifier);
        } else {
          query = query.or(`badge.ilike.${identifier},email.ilike.${identifier}`);
        }

        const { data, error } = await query.maybeSingle();

        if (!error && data) {
          if (data.active === false) {
            setLoginError("This officer account is disabled. Contact an administrator.");
            setLoading(false);
            return;
          }
          if (!passwordsMatch(data.pass, password)) {
            setLoginError("Invalid security key / password.");
            setLoading(false);
            return;
          }

          onLogin(publicOfficerProfile(data));
          return;
        }
      }

      const localUser = (users || []).find(
        (u) =>
          u.badge?.toLowerCase() === identifier.toLowerCase() ||
          u.email?.toLowerCase() === identifier.toLowerCase()
      );

      if (localUser && passwordsMatch(localUser.pass || LOCAL_DEMO_PASSWORD, password)) {
        if (localUser.active === false) {
          setLoginError("This officer account is disabled. Contact an administrator.");
          setLoading(false);
          return;
        }
        onLogin(publicOfficerProfile(localUser));
        return;
      }

      setLoginError("Invalid Officer ID / Email or security password.");
    } catch (err) {
      console.error("Login verification error:", err);
      setLoginError(err?.message || "Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="legal-login-page">
      <div className="login-bg-grid"></div>
      <div className="login-orb orb-one"></div>
      <div className="login-orb orb-two"></div>

      {/* LEFT SIDE SHOWCASE */}
      <div className="login-showcase">
        <div className="login-topbar">
          <button type="button" className="legal-logo" onClick={onBackToPortal}>
            <div className="logo-symbol">⚖</div>
            <div>
              <h3>LEGAL LENS</h3>
              <span>ENFORCEMENT CONSOLE</span>
            </div>
          </button>

          <button type="button" className="back-portal-btn" onClick={onBackToPortal}>
            ← Back to Main Page
          </button>
        </div>

        <div className="login-showcase-content">
          <div className="live-security-badge">
            <span className="pulse-dot"></span>
            RESTRICTED ENFORCEMENT NETWORK
          </div>

          <h1>
            Intelligent Enforcement.
            <br />
            <span>Detect Label Violations.</span>
            <br />
            Court-Ready Evidence.
          </h1>

          <p>
            LEGAL LENS provides enforcement officers with AI optical vision, multi-angle OCR extraction, and deterministic statutory rule validation under Legal Metrology PCR 2011 to identify violations and generate seizure reports.
          </p>

          {/* Scanner Visual for Officer */}
          <div className="scanner-preview">
            <div className="scanner-header">
              <div>
                <span className="scanner-label">
                  AI STATUTORY ENFORCEMENT
                </span>
                <h4>Packaged Commodity Inspection</h4>
              </div>

              <div className="scanner-live">
                <span></span>
                ENFORCEMENT LIVE
              </div>
            </div>

            <div className="scanner-body">
              <div className="product-box">
                <span className="package-icon">📦</span>
                <div className="scan-line"></div>
                <div className="corner top-left"></div>
                <div className="corner top-right"></div>
                <div className="corner bottom-left"></div>
                <div className="corner bottom-right"></div>
              </div>

              <div className="scan-results">
                <div className="result-item success">
                  <span>✓</span>
                  <strong>MRP (Inclusive of Taxes)</strong>
                </div>

                <div className="result-item success">
                  <span>✓</span>
                  <strong>Net Quantity Declared</strong>
                </div>

                <div className="result-item warning">
                  <span>!</span>
                  <strong>Manufacturer Address Details</strong>
                </div>

                <div className="result-item danger">
                  <span>✕</span>
                  <strong>Consumer Care Phone Missing</strong>
                </div>
              </div>
            </div>

            <div className="scanner-footer">
              <div>
                <span>STATUTORY FRAMEWORK</span>
                <strong>Legal Metrology Act 2009</strong>
              </div>

              <div className="compliance-score">
                <span>ENFORCEMENT RATING</span>
                <strong>84% AUDITED</strong>
              </div>
            </div>
          </div>

          <div className="login-feature-row mt-6">
            <div className="login-feature">
              <div className="feature-icon">🔍</div>
              <div>
                <strong>Optical Detection</strong>
                <span>Multi-angle vision extraction</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">⚙</div>
              <div>
                <strong>Rule Engine</strong>
                <span>Deterministic PCR 2011 checks</span>
              </div>
            </div>

            <div className="login-feature">
              <div className="feature-icon">📄</div>
              <div>
                <strong>Audit Reports</strong>
                <span>Court-ready legal evidence</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-bottom-status">
          <div>
            <span className="secure-dot"></span>
            RESTRICTED GOVERNMENT SYSTEM CONNECTION
          </div>
          <span>LEGAL METROLOGY ENFORCEMENT SYSTEM</span>
        </div>
      </div>

      {/* RIGHT SIDE OFFICER FORM */}
      <div className="login-panel">
        <div className="login-form-container">
          <div className="login-form-header">
            <div className="officer-shield">🛡</div>
            <div>
              <span>AUTHORIZED ENFORCEMENT ACCESS</span>
              <h2>Officer Login</h2>
            </div>
          </div>

          <p className="login-subtitle">
            Restricted access for Legal Metrology Enforcement Officers, Inspectors, and System Administrators.
          </p>

          <form className="premium-login-form" onSubmit={handleOfficerLogin}>
            <div className="premium-input-group">
              <label>Officer Badge ID or Official Email</label>
              <div className="premium-input">
                <span className="input-symbol">👤</span>
                <input
                  type="text"
                  placeholder="e.g. LMD-DL-842 or officer@lm.gov.in"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="premium-input-group">
              <div className="password-heading">
                <label>Security Password / Key</label>
              </div>

              <div className="premium-input">
                <span className="input-symbol">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your security password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="show-password-btn"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg border text-xs flex items-center gap-2 bg-red-500/10 border-red-500/30 text-red-500">
                <span>⚠</span>
                <span>{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              className="premium-login-btn font-bold cursor-pointer mt-2"
              disabled={loading}
            >
              <span>{loading ? "Authenticating..." : "Access Enforcement Workspace →"}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function LegalLoginPage({ onLogin, users = [], onBackToPortal, initialTab = "officer" }) {
  const [activePage, setActivePage] = useState(initialTab);

  React.useEffect(() => {
    setActivePage(initialTab);
  }, [initialTab]);

  if (activePage === "customer") {
    return (
      <CustomerLoginPage
        onLogin={onLogin}
        users={users}
        onBackToPortal={onBackToPortal}
        onSwitchToOfficer={() => setActivePage("officer")}
      />
    );
  }

  return (
    <OfficerLoginPage
      onLogin={onLogin}
      users={users}
      onBackToPortal={onBackToPortal}
      onSwitchToCustomer={() => setActivePage("customer")}
    />
  );
}
