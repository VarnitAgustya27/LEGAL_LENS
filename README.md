<div align="center">

# ⚖️ Legal-Lens

### AI-Powered Legal Metrology Compliance & Inspection Platform

**Enforcement-assistance software for detecting, validating, and reporting packaged commodity label compliance under the Legal Metrology Act, 2009 and the Legal Metrology (Packaged Commodities) Rules, 2011.**

*Built for Smart India Hackathon 2026*

<br/>

[![Status](https://img.shields.io/badge/status-prototype-orange?style=for-the-badge)](#)
[![License](https://img.shields.io/badge/license-MIT-blue?style=for-the-badge)](#-license)
[![SIH 2026](https://img.shields.io/badge/Smart%20India%20Hackathon-2026-1f6feb?style=for-the-badge)](#)
[![Made with Next.js](https://img.shields.io/badge/frontend-Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)](#)
[![Made with FastAPI](https://img.shields.io/badge/backend-FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)](#)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](#)

<br/>

`Upload` → `Scan` → `Extract` → `Validate` → `Flag Violations` → `Review Evidence` → `Generate Report`

</div>

<br/>

> **⚠️ Important**
> Metria is an **enforcement-assistance system**, not an autonomous legal decision-maker. Every AI output carries a confidence score, uncertain findings are flagged **`REQUIRES MANUAL VERIFICATION`**, and the final legal determination always rests with the authorized enforcement officer.

<br/>

## 📖 Table of Contents

- [Overview](#-overview)
- [Core Idea](#-core-idea)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [AI Pipeline](#-ai-pipeline)
- [Database Schema](#-database-schema-overview)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Roles & Access](#-roles--access)
- [Development Roadmap](#-development-roadmap)
- [Engineering Principles](#-engineering-principles)
- [Screens](#-application-screens)
- [Disclaimer](#-disclaimer)
- [License](#-license)

<br/>

## 🧭 Overview

Packaged commodities sold in Indian retail, supermarket, and e-commerce channels must carry mandatory declarations — manufacturer/packer/importer details, product name, net quantity, MRP, dates of manufacture/packing, country of origin, and consumer-care information — as prescribed under the **Legal Metrology (Packaged Commodities) Rules, 2011** and subsequent amendments.

Manual inspection of these declarations at scale is slow, inconsistent, and hard to audit. **Metria** gives enforcement officers an AI-assisted toolkit to scan product labels, automatically extract declarations, validate them against a versioned rule set, and generate defensible, evidence-backed inspection reports — without ever letting the AI make the final legal call.

<br/>

## 💡 Core Idea

```
Image  →  AI Extraction (with confidence)  →  Deterministic Rule Engine  →  Human Review
```

The AI never outputs a verdict directly. It only ever produces **structured, confidence-scored data**. A transparent, versioned, rule-based engine decides `COMPLIANT` / `NON_COMPLIANT` / `REVIEW` — and every decision is traceable back to a specific rule and a specific piece of visual evidence.

<br/>

## ✨ Key Features

| Category | Capabilities |
|---|---|
| 🖼️ **Image Intake** | Multi-angle upload (front/back/side/additional), e-commerce screenshots, metadata capture |
| 🔍 **OCR & Extraction** | Text + bounding-box detection, per-field confidence scores, pluggable OCR backend |
| 🧾 **Structured Declarations** | Deterministic regex-first parsing with LLM fallback for hard normalization cases |
| ⚖️ **Rule Engine** | Versioned, effective-dated, category-aware rules evaluated deterministically |
| 🚦 **Compliance Verdicts** | `PASS` / `FAIL` / `REVIEW` per requirement, with an overall product status |
| 🔦 **Visual Evidence** | Click-to-zoom bounding-box highlights tied to each violation |
| 📏 **Readability Analysis** | Blur, contrast, orientation, obstruction, and calibrated character-height checks |
| 🕘 **Inspection History** | Full per-product timeline of past inspections and outcomes |
| 🔎 **Search & Filter** | By product, barcode, manufacturer, category, status, inspector, date range |
| 📄 **Report Generation** | PDF/editable reports separating *AI-assisted findings* from *officer determination* |
| 🗂️ **Rule Repository** | Admin UI to add, edit, version, and activate/deactivate legal rules |
| 🤖 **Knowledge Assistant** | RAG-based Q&A over official Legal Metrology documents, with citations |
| 🛒 **E-commerce Analysis** | Optional module for validating online listing screenshots |
| 📊 **Dashboards** | Inspection volume, violation trends, category breakdowns, recent activity |
| 🔐 **Access Control** | JWT auth with Admin / Enforcement Officer / Reviewer roles |
| 🧮 **Full Auditability** | Every inspection action is logged for accountability |

<br/>

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Frontend**
- Next.js + TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- Fully responsive design

**AI / Processing**
- PaddleOCR (text detection & OCR)
- OpenCV (image preprocessing)
- YOLO (optional object detection)
- LLM (structured extraction & explanation *only* — never the final verdict)

</td>
<td valign="top" width="50%">

**Backend**
- Python + FastAPI
- REST APIs

**Data & Storage**
- PostgreSQL
- pgvector (vector search for RAG)
- MinIO / S3-compatible object storage

**Platform**
- JWT authentication + RBAC
- Docker + docker-compose

</td>
</tr>
</table>

<br/>

## 🏗️ System Architecture

```
┌────────────┐   ┌──────────────┐   ┌───────────┐   ┌──────────────┐
│  Next.js   │──▶│   FastAPI    │──▶│ PostgreSQL │   │  MinIO / S3  │
│  Frontend  │◀──│   Backend    │◀──│ + pgvector │   │ (images/docs)│
└────────────┘   └──────┬───────┘   └───────────┘   └──────────────┘
                         │
        ┌────────────────┼─────────────────┐
        ▼                ▼                 ▼
 ┌─────────────┐  ┌──────────────┐  ┌──────────────┐
 │ OCRService   │  │ Declaration  │  │ Compliance   │
 │ (PaddleOCR)  │  │ Extraction   │  │ RuleEngine   │
 │              │  │ Service      │  │(deterministic)│
 └─────────────┘  └──────────────┘  └──────────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │  RAG Legal    │
                 │  Assistant    │
                 └───────────────┘
```

Every AI capability sits behind a clean **service interface** (`OCRService`, `DeclarationExtractionService`, `ComplianceEngine`), so providers can be swapped without touching application logic — and a **mock mode** lets the full UI be demoed before the real pipeline is wired in.

<br/>

## 🔬 AI Pipeline

```
Product Image
   │
   ▼
Image Preprocessing
   │
   ▼
Text / Region Detection
   │
   ▼
OCR
   │
   ▼
Structured Declaration Extraction
   │
   ▼
Product Category Detection
   │
   ▼
Applicable Rule Retrieval
   │
   ▼
Deterministic Rule Engine   ◀── never Image → LLM → Verdict
   │
   ▼
Compliance Result
   │
   ▼
Evidence Mapping
   │
   ▼
Report Generation
```

> The rule engine is **deterministic and explainable by design**. LLMs assist with extraction and normalization — they do not decide compliance.

<br/>

## 🗄️ Database Schema (Overview)

<details>
<summary><strong>Click to expand core tables</strong></summary>

<br/>

| Table | Purpose |
|---|---|
| `users` / `roles` | Authentication and role-based access |
| `products` | Canonical product records (linked by barcode) |
| `inspections` | One record per inspection event |
| `inspection_images` | Uploaded images per inspection |
| `ocr_results` | Raw OCR text, bounding boxes, confidence |
| `declarations` | Structured, normalized declaration data |
| `rules` / `rule_versions` | Versioned, effective-dated legal rules |
| `compliance_checks` | Per-requirement PASS/FAIL/REVIEW outcomes |
| `violations` | Flagged non-compliances with severity |
| `evidence` | Bounding-box ↔ violation ↔ image mapping |
| `reports` | Generated PDF/editable inspection reports |
| `audit_logs` | Full action trail for accountability |

</details>

<br/>

## 🚀 Getting Started

```bash
# 1. Clone the repository
git clone https://github.com/<your-org>/metria.git
cd metria

# 2. Configure environment variables
cp .env.example .env

# 3. Launch the full stack
docker-compose up --build

# 4. Access the app
# Frontend → http://localhost:3000
# API docs → http://localhost:8000/docs
```

> During early development, `OCRService` and `DeclarationExtractionService` run in **mock mode** so the entire inspection workflow can be demoed end-to-end before the real AI pipeline is connected.

<br/>

## 👥 Roles & Access

| Role | Permissions |
|---|---|
| **Admin** | Manage users, manage rule repository, full system access |
| **Enforcement Officer** | Create inspections, review results, generate reports |
| **Reviewer** | View inspections, verify `REVIEW`-flagged findings |

<br/>

## 🗺️ Development Roadmap

- [x] **Phase 1** — Frontend shell, auth, dashboard, inspection creation, image upload, database
- [ ] **Phase 2** — OCR service, bounding boxes, structured declaration extraction
- [ ] **Phase 3** — Deterministic compliance engine, rule repository, violation detection
- [ ] **Phase 4** — Evidence viewer, confidence scoring, inspection history, reports
- [ ] **Phase 5** — Readability/font analysis, e-commerce analysis, RAG legal assistant, advanced analytics

<br/>

## 🧱 Engineering Principles

1. AI must not directly make legal decisions.
2. Rule validation is deterministic and explainable.
3. Every violation must have supporting evidence.
4. Every AI extraction carries a confidence score.
5. Uncertain cases are marked `REVIEW`, never guessed.
6. Rules are versioned — legal requirements change over time.
7. Product category determines applicable rules.
8. All inspection actions are auditable.
9. Images and reports are stored securely.
10. Legal rules are never hard-coded into the frontend.
11. AI/OCR/LLM providers sit behind swappable interfaces.
12. The MVP ships before advanced AI features.

<br/>

## 🖥️ Application Screens

| Route | Purpose |
|---|---|
| `/login` | Authentication |
| `/dashboard` | Compliance metrics, trends, recent activity |
| `/inspections` | Inspection list & filters |
| `/inspections/new` | Multi-image upload + metadata intake |
| `/inspections/[id]` | Processing status, results, evidence |
| `/products/[id]` | Per-product inspection history |
| `/reports` | Generated inspection reports |
| `/rules` | Versioned rule repository (admin) |
| `/settings` / `/users` | System & user administration |

<br/>

## ⚠️ Disclaimer

Metria is a **prototype built for Smart India Hackathon 2026**. All rule IDs used during development that are not sourced from verified official notifications are **clearly marked as placeholders**. Automated findings are AI-assisted evidence, not legal conclusions — final compliance determinations require review by an authorized Legal Metrology enforcement officer.

<br/>

## 📄 License

Licensed under the [MIT License](LICENSE).

<br/>

<div align="center">

**Built with love for Smart India Hackathon 2026**

</div>
burnit🔥🔥🔥
