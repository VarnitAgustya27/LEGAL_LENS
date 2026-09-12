import React from "react";
import { Icon } from "../common/UIComponents.jsx";

export default function LandingPageView({ onAccessConsole }) {
  return (
    <div className="legal-lens-app">

      {/* NAVIGATION */}

      <header className="main-navbar">
        <div className="navbar-inner">
          <button className="brand-button main-brand">
            <span className="brand-mark">
              <Icon name="logo" size={25} />
            </span>

            <span className="brand-copy">
              <strong>LEGAL LENS</strong>
              <small>AI COMPLIANCE PLATFORM</small>
            </span>
          </button>

          <nav className="nav-menu">
            <a href="#platform">Platform</a>
            <a href="#capabilities">Capabilities</a>
            <a href="#workflow">Workflow</a>
            <a href="#mission">Mission</a>
          </nav>

          <div className="flex items-center gap-2">
            <button
              className="px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:brightness-110"
              onClick={() => onAccessConsole && onAccessConsole("Customer")}
              style={{ background: "#10B981", color: "#060A11" }}
            >
              <span>🛍</span> Customer Login
            </button>
            <button
              className="nav-access-button"
              onClick={() => onAccessConsole && onAccessConsole("Officer")}
            >
              Officer Access
              <Icon name="arrow" size={16} />
            </button>
          </div>
        </div>
      </header>

      <main>

        {/* HERO */}

        <section className="premium-hero" id="platform">
          <div className="hero-pattern"></div>

          <div className="hero-inner">

            <div className="hero-left">

              <div className="official-tag">
                <span className="official-dot"></span>
                LEGAL METROLOGY COMPLIANCE & CITIZEN INTELLIGENCE
              </div>

              <h1>
                Intelligent compliance
                <br />
                <span>for officers & consumers.</span>
              </h1>

              <div className="hero-actions flex flex-wrap gap-3">
                <button
                  className="hero-primary"
                  onClick={() => onAccessConsole && onAccessConsole("Officer")}
                >
                  <Icon name="scan" size={19} />
                  Officer Console
                  <Icon name="arrow" size={18} />
                </button>

                <button
                  className="hero-primary font-bold shadow-lg flex items-center gap-2 cursor-pointer transition-all hover:scale-105"
                  onClick={() => onAccessConsole && onAccessConsole("Customer")}
                  style={{ background: "#10B981", color: "#060A11", borderColor: "#10B981" }}
                >
                  <span>🛍</span> Customer Login
                </button>

                <a href="#capabilities" className="hero-secondary">
                  Explore Capabilities
                </a>
              </div>

              <div className="technology-strip">
                <div>
                  <strong>AI + OCR</strong>
                  <span>Intelligent Extraction</span>
                </div>

                <div className="strip-divider"></div>

                <div>
                  <strong>RULE ENGINE</strong>
                  <span>Compliance Validation</span>
                </div>

                <div className="strip-divider"></div>

                <div>
                  <strong>DIGITAL REPORTS</strong>
                  <span>Evidence & Inspection History</span>
                </div>
              </div>
            </div>

            {/* DASHBOARD PREVIEW */}

            <div className="compliance-console">

              <div className="console-top">
                <div>
                  <span className="console-eyebrow">
                    LIVE COMPLIANCE ANALYSIS
                  </span>

                  <h3>Package Inspection</h3>
                </div>

                <div className="console-live">
                  <span></span>
                  ANALYSIS READY
                </div>
              </div>

              <div className="console-body">

                <div className="product-preview">

                  <div className="preview-label">
                    PRODUCT IMAGE
                  </div>

                  <div className="package-visual">

                    <div className="package-corner corner-one"></div>
                    <div className="package-corner corner-two"></div>
                    <div className="package-corner corner-three"></div>
                    <div className="package-corner corner-four"></div>

                    <div className="package-mockup">
                      <div className="mockup-band"></div>

                      <div className="mockup-title">
                        PACKAGED
                        <br />
                        PRODUCT
                      </div>

                      <div className="mockup-lines">
                        <span></span>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>

                      <div className="mockup-footer"></div>
                    </div>

                    <div className="detected-box detect-one">
                      <span className="green-dot"></span>
                      MRP
                    </div>

                    <div className="detected-box detect-two">
                      <span className="green-dot"></span>
                      NET QUANTITY
                    </div>

                    <div className="detected-box detect-three">
                      <span className="amber-dot"></span>
                      FONT CHECK
                    </div>

                  </div>
                </div>

                <div className="analysis-panel">

                  <div className="analysis-heading">
                    <span>DETECTED DECLARATIONS</span>
                    <strong>6 / 7</strong>
                  </div>

                  <div className="declaration-list">

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Manufacturer / Packer
                    </div>

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Net Quantity
                    </div>

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Maximum Retail Price
                    </div>

                    <div className="declaration-item success-item">
                      <span>
                        <Icon name="check" size={14} />
                      </span>
                      Month & Year
                    </div>

                    <div className="declaration-item warning-item">
                      <span>
                        <Icon name="warning" size={14} />
                      </span>
                      Font Size Verification
                    </div>

                  </div>

                  <div className="score-card">
                    <div>
                      <span>COMPLIANCE SCORE</span>
                      <strong>86%</strong>
                    </div>

                    <div className="score-bar">
                      <span></span>
                    </div>

                    <small>Review recommended before closure</small>
                  </div>

                </div>
              </div>

              <div className="console-footer">

                <div>
                  <span className="footer-status-dot"></span>
                  AI ENGINE READY
                </div>

                <span>LEGAL LENS ANALYSIS ENGINE v1.0</span>

              </div>

            </div>
          </div>
        </section>


        {/* TRUST BAR */}

        <section className="trust-bar">
          <div>
            <Icon name="scan" size={20} />
            <span>
              <strong>PRODUCT SCANNING</strong>
              Image & Label Analysis
            </span>
          </div>

          <div>
            <Icon name="search" size={20} />
            <span>
              <strong>DECLARATION EXTRACTION</strong>
              AI + OCR Processing
            </span>
          </div>

          <div>
            <Icon name="shield" size={20} />
            <span>
              <strong>RULE VALIDATION</strong>
              Compliance Intelligence
            </span>
          </div>

          <div>
            <Icon name="file" size={20} />
            <span>
              <strong>DIGITAL REPORTING</strong>
              Inspection Evidence
            </span>
          </div>
        </section>


        {/* CAPABILITIES */}

        <section className="capabilities-section" id="capabilities">

          <div className="section-intro">
            <div>
              <span className="section-kicker">
                PLATFORM CAPABILITIES
              </span>

              <h2>
                Built for intelligent
                <br />
                compliance enforcement.
              </h2>
            </div>

            <p>
              LEGAL LENS transforms the traditional inspection workflow into a
              scalable digital system for scanning, extracting, validating and
              reporting packaged commodity compliance.
            </p>
          </div>

          <div className="premium-feature-grid">

            <article className="premium-feature">
              <div className="feature-number">01</div>

              <div className="premium-icon">
                <Icon name="scan" size={23} />
              </div>

              <h3>Product & Label Scanning</h3>

              <p>
                Analyze packaged commodities using uploaded images, product
                labels and visual evidence.
              </p>

              <div className="feature-bottom">
                <span>VISUAL INSPECTION</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">02</div>

              <div className="premium-icon">
                <Icon name="search" size={23} />
              </div>

              <h3>AI Declaration Extraction</h3>

              <p>
                Automatically detect and extract manufacturer details, MRP,
                quantity, dates and consumer information.
              </p>

              <div className="feature-bottom">
                <span>AI + OCR</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">03</div>

              <div className="premium-icon">
                <Icon name="shield" size={23} />
              </div>

              <h3>Rule-Based Validation</h3>

              <p>
                Validate declarations against applicable Legal Metrology
                requirements and packaged commodity rules.
              </p>

              <div className="feature-bottom">
                <span>RULE ENGINE</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">04</div>

              <div className="premium-icon">
                <Icon name="text" size={23} />
              </div>

              <h3>Font & Readability Analysis</h3>

              <p>
                Evaluate declaration readability, visibility and prescribed
                font-size requirements.
              </p>

              <div className="feature-bottom">
                <span>VISUAL VALIDATION</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">05</div>

              <div className="premium-icon">
                <Icon name="file" size={23} />
              </div>

              <h3>Compliance Reports</h3>

              <p>
                Generate compliance reports, violation summaries and digital
                evidence for inspection records.
              </p>

              <div className="feature-bottom">
                <span>REPORT GENERATION</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

            <article className="premium-feature">
              <div className="feature-number">06</div>

              <div className="premium-icon">
                <Icon name="database" size={23} />
              </div>

              <h3>Inspection Repository</h3>

              <p>
                Maintain scanned product records, compliance history,
                photographs and supporting evidence.
              </p>

              <div className="feature-bottom">
                <span>DATA REPOSITORY</span>
                <Icon name="arrow" size={17} />
              </div>
            </article>

          </div>
        </section>


        {/* WORKFLOW */}

        <section className="workflow-section" id="workflow">

          <div className="workflow-header">
            <span>INTELLIGENT INSPECTION WORKFLOW</span>

            <h2>
              From product image
              <br />
              to compliance decision.
            </h2>
          </div>

          <div className="workflow-line">

            <div className="workflow-step">
              <div className="step-index">01</div>
              <div className="step-icon">
                <Icon name="upload" size={23} />
              </div>

              <h3>Upload</h3>

              <p>
                Upload product images, labels or supporting inspection
                information.
              </p>
            </div>

            <div className="workflow-connector"></div>

            <div className="workflow-step">
              <div className="step-index">02</div>
              <div className="step-icon">
                <Icon name="search" size={23} />
              </div>

              <h3>Extract</h3>

              <p>
                AI and OCR identify mandatory declarations from the packaging.
              </p>
            </div>

            <div className="workflow-connector"></div>

            <div className="workflow-step">
              <div className="step-index">03</div>
              <div className="step-icon">
                <Icon name="shield" size={23} />
              </div>

              <h3>Validate</h3>

              <p>
                Extracted information is evaluated against compliance rules.
              </p>
            </div>

            <div className="workflow-connector"></div>

            <div className="workflow-step">
              <div className="step-index">04</div>
              <div className="step-icon">
                <Icon name="chart" size={23} />
              </div>

              <h3>Report</h3>

              <p>
                Generate compliance status, violations and inspection reports.
              </p>
            </div>

          </div>
        </section>


        {/* MISSION */}

        <section className="mission-section" id="mission">

          <div className="mission-left">
            <span>THE PROBLEM WE ADDRESS</span>

            <h2>
              Manual inspection cannot scale with modern commerce.
            </h2>
          </div>

          <div className="mission-right">

            <p>
              Packaged commodities are sold through retail stores,
              supermarkets and e-commerce platforms across India. Every product
              is required to display mandatory declarations such as
              manufacturer details, net quantity, MRP, dates and consumer care
              information.
            </p>

            <p>
              Manual inspection of these declarations is time-consuming and
              resource intensive. LEGAL LENS introduces artificial intelligence,
              OCR and rule-based validation to help enforcement teams identify
              missing, misleading or non-compliant declarations faster and more
              consistently.
            </p>

            <div className="mission-tags">
              <span>LEGAL METROLOGY ACT, 2009</span>
              <span>PACKAGED COMMODITIES RULES, 2011</span>
            </div>

          </div>
        </section>


        {/* CTA */}

        <section className="enterprise-cta">

          <div className="cta-inner">

            <span>LEGAL LENS • AI COMPLIANCE INTELLIGENCE</span>

            <h2>
              Modernize packaged commodity
              <br />
              compliance inspection.
            </h2>

            <p>
              A unified platform for scanning products, validating
              declarations and generating actionable compliance intelligence.
            </p>

            <button
              className="cta-button"
              onClick={onAccessConsole}
            >
              Access Compliance Console
              <Icon name="arrow" size={18} />
            </button>

          </div>

        </section>

      </main>


      {/* FOOTER */}

      <footer className="main-footer">

        <div className="footer-inner">

          <div className="footer-brand">
            <div className="footer-logo">
              <Icon name="logo" size={22} />
            </div>

            <div>
              <strong>LEGAL LENS</strong>
              <span>AI COMPLIANCE PLATFORM</span>
            </div>
          </div>

          <div className="footer-description">
            Software System for Compliance Checking of Packaged Commodities
          </div>

          <div className="footer-meta">
            SMART INDIA HACKATHON 2026
          </div>

        </div>

      </footer>

    </div>
  );
}
