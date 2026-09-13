# Google Play Store Metadata & Listing Guide

Use these pre-formatted fields when filling out your app listing on **Google Play Console** (https://play.google.com/console).

---

## 1. Main Store Listing Metadata

### App Title (max 30 characters)
`Legal Lens: FSSAI Compliance`

### Short Description (max 80 characters)
`Instant FSSAI & Legal Metrology food compliance checking for smart consumers.`

### Full Description (max 4,000 characters)
```text
Legal Lens is an intelligent consumer rights and food regulatory compliance verification app built to protect consumers and empower regulatory enforcement officers across India.

With Legal Lens, you can scan product barcodes or capture food packaging labels to instantly analyze compliance against Indian Legal Metrology Rules and FSSAI (Food Safety and Standards Authority of India) regulations.

KEY FEATURES:

🔍 INSTANT BARCODE & LABEL SCANNING
Scan any food product EAN/UPC barcode or photo to fetch verified product scorecards, ingredient breakdowns, nutritional facts, and legal compliance alerts.

⚠️ COMPLIANCE & SAFETY SCORECARD
Get a clear, automated legal compliance score evaluating:
- FSSAI License Number verification
- MRP & Unit Sale Price declaration checks
- Net Quantity & Weight compliance
- Manufacturer & Packer details verification
- Expiry date & Best Before declaration tracking

⚖️ CONSUMER RIGHTS & VIOLATION REPORTING
Identify non-compliant products, missing legal declarations, or deceptive packaging. Generate standardized violation reports to safeguard consumer interests.

🛡️ DEDICATED OFFICER DASHBOARD
Equipped with specialized tools for regulatory enforcement officers to log non-compliance, verify legal documentation, track consumer complaints, and streamline inspections.

⚡ FAST, PRIVACY-FOCUSED & LIGHTWEIGHT
Legal Lens processes scans instantly while prioritizing user privacy and data security.

Empower your shopping choices with verified regulatory insights. Download Legal Lens today!
```

---

## 2. Categorization & Contact Details

* **App Type:** Application
* **Category:** Productivity / Tools / Business
* **Tags:** `FSSAI`, `Food Safety`, `Consumer Rights`, `Barcode Scanner`, `Legal Metrology`, `Compliance`
* **Contact Email:** `support@legallens.app` (or your developer email)
* **Website:** `https://github.com/VarnitAgustya27/LEGAL_LENS`
* **Privacy Policy URL:** Host your `privacy_policy.md` on GitHub Pages or a public site (e.g. `https://github.com/VarnitAgustya27/LEGAL_LENS/blob/main/privacy_policy.md`)

---

## 3. Play Store Questionnaire Answers

### A. Content Rating
* **Category:** Utility, Productivity, Communication
* **Violence, Sexual Content, Nudity:** No
* **Profanity or Crude Humor:** No
* **Controlled Substances:** No
* **User-Generated Content:** No
* **Shares Physical Location:** No
* **Allows Purchases:** No
* **Expected Rating:** **PEGI 3 / Everyone**

### B. Target Audience & Content
* **Target Age Groups:** 13+, 18+ (Everyone)
* **Not primarily designed for children.**

### C. Data Safety Declarations
* **Data Collected:**
  * **Account Info:** Email, User Name (Optional, for login)
  * **Photos and Videos:** Camera photos captured during label scan (Processed for OCR compliance analysis)
  * **App Info & Performance:** Crash logs and diagnostics
* **Data Encryption:** All data encrypted in transit using SSL/TLS HTTPS protocols.
* **Account Deletion:** Users can request deletion of account data via privacy contact email.

---

## 4. How to Generate the Signed Release Bundle (`.aab`)

Google Play requires an **Android App Bundle (`.aab`)** signed with your keystore (`release-key.jks`).

### Method A: Via Android Studio (Easiest)
1. Open `frontend/android` in **Android Studio**.
2. Click **Build** menu $\rightarrow$ **Generate Signed Bundle / APK...**.
3. Select **Android App Bundle** and click **Next**.
4. Key store path: `frontend/android/app/release-key.jks`
5. Key store password: `LegalLens2026SecureKey`
6. Key alias: `legallens`
7. Key password: `LegalLens2026SecureKey`
8. Select **release** build variant and click **Create**.
9. The signed `.aab` will be generated at:
   `frontend/android/app/release/app-release.aab`

### Method B: Via Terminal (Gradle)
If JDK 17+ is installed and set in `JAVA_HOME`:
```cmd
cd frontend/android
gradlew bundleRelease
```
The resulting `.aab` file will be at `app/build/outputs/bundle/release/app-release.aab`.
