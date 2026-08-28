# AGENTS.md {#agentsmd}

## Legal-Lens --- AI-Powered Legal Metrology Compliance & Inspection Platform {#Legal-Lens--ai-powered-legal-metrology-compliance--inspection-platform}

This file is the operating guide for AI coding agents working on the
Legal-Lens repository.

Legal-Lens is an AI-assisted inspection and compliance platform for packaged
commodities under the Legal Metrology Act, 2009 and the Legal Metrology
(Packaged Commodities) Rules, 2011, including applicable amendments.

------------------------------------------------------------------------

## 1. Mission {#1-mission}

Build a credible, modular and demonstrable system that transforms:

``` text
Product Images / E-commerce Listing
        ↓
Image Preprocessing
        ↓
OCR + Computer Vision
        ↓
Structured Declaration Extraction
        ↓
Applicable Rule Retrieval
        ↓
Deterministic Rule Engine
        ↓
Compliance Findings
        ↓
Visual Evidence
        ↓
Inspection Report
        ↓
Inspection History
```

**Core principle: AI extracts. Rules decide. Officers verify.**

Legal-Lens is an enforcement-assistance system, not an autonomous legal
decision maker.

------------------------------------------------------------------------

## 2. Technology Stack {#2-technology-stack}

### Frontend

-   Next.js
-   TypeScript
-   Tailwind CSS
-   shadcn/ui
-   Recharts

### Backend

-   Python
-   FastAPI
-   REST APIs

### Supabase

Use Supabase as the primary application backend infrastructure:

-   PostgreSQL
-   Authentication
-   Storage
-   Row Level Security
-   pgvector
-   Realtime

Do not introduce a separate database unless there is a documented
architectural reason.

### AI / Computer Vision {#ai--computer-vision}

-   OpenCV
-   PaddleOCR
-   YOLO/object detection only where justified
-   LLM for structured extraction and normalization
-   RAG for legal-document assistance

### Reports

-   ReportLab or an equivalent Python reporting layer

### Deployment

-   Docker
-   Docker Compose
-   Supabase
-   Appropriate frontend/backend hosting

------------------------------------------------------------------------

## 3. Architecture Rules {#3-architecture-rules}

Keep a clear separation:

``` text
Next.js
   ↓
FastAPI
   ↓
Application Services
   ↓
AI / Compliance Services
   ↓
Supabase
```

Do not put business logic inside React components.

Do not put legal rules inside frontend code.

Do not couple the application to one OCR or LLM provider.

Prefer service abstractions such as:

``` text
OCRService
ImageProcessingService
DeclarationExtractionService
ProductClassificationService
RuleRepository
ComplianceEngine
EvidenceService
ReportService
LegalKnowledgeService
```

Start with a modular monolith. Do not introduce microservices,
Kubernetes or complex infrastructure unless there is a demonstrated
need.

------------------------------------------------------------------------

## 4. Legal Source of Truth {#4-legal-source-of-truth}

Legal requirements must come from verified official Government of India
/ Department of Consumer Affairs material.

Never:

-   invent a legal requirement
-   treat an LLM response as an authoritative rule
-   silently use an outdated rule
-   fabricate citations

Every production rule should store source metadata.

Example:

``` json
{
  "rule_code": "PCR-MRP-001",
  "source": "Official Government Source",
  "version": "2026",
  "effective_from": "2026-01-01"
}
```

Unverified rules must be explicitly marked:

``` text
DRAFT / UNVERIFIED
```

------------------------------------------------------------------------

## 5. Rule Versioning {#5-rule-versioning}

Rules can change over time.

Never assume the original 2011 rules are the complete current legal
state.

Rules should support:

-   version
-   effective_from
-   effective_until
-   source/amendment
-   product category
-   applicability conditions
-   validation logic
-   severity

Compliance should conceptually work as:

``` text
Inspection Date
      +
Product Context
      ↓
Applicable Rule Version
      ↓
Applicable Rules
      ↓
Validation
```

Do not hard-code date-specific legal logic in application code. Prefer
data-driven rules.

------------------------------------------------------------------------

## 6. Compliance Outcomes {#6-compliance-outcomes}

Use three primary automated outcomes:

``` text
PASS
FAIL
REVIEW
```

### PASS

Available evidence sufficiently supports compliance.

### FAIL

Available evidence sufficiently indicates that the configured
requirement is not satisfied.

### REVIEW

Evidence is incomplete, ambiguous, low-confidence, or requires
human/legal judgment.

Never force uncertain evidence into PASS or FAIL.

------------------------------------------------------------------------

## 7. AI Confidence {#7-ai-confidence}

AI-derived findings should expose confidence where meaningful.

Example:

``` json
{
  "field": "mrp",
  "value": "₹120",
  "confidence": 0.94
}
```

Confidence is **not legal certainty**.

Good:

> OCR confidence: 94%

Bad:

> 94% legally compliant

------------------------------------------------------------------------

## 8. Evidence-First Design {#8-evidence-first-design}

Every potential violation should be traceable to evidence.

Evidence can contain:

-   source image
-   bounding box
-   OCR text
-   OCR confidence
-   extracted value
-   rule ID
-   reason
-   timestamp

Example:

``` json
{
  "image_id": "img_001",
  "bbox": [120, 340, 420, 410],
  "text": "MRP ₹120",
  "rule_id": "PCR-MRP-001",
  "reason": "..."
}
```

When adding a compliance feature, always ask:

> Can the officer see why the system produced this finding?

If not, improve the evidence model.

------------------------------------------------------------------------

## 9. Image Pipeline {#9-image-pipeline}

Use this conceptual flow:

``` text
Original Image
      ↓
Validation
      ↓
Resize / Crop
      ↓
Perspective Correction
      ↓
Deskew
      ↓
Noise / Contrast Enhancement
      ↓
OCR / Detection
```

Never overwrite the original evidence image.

Keep:

1.  original image
2.  processed image when useful
3.  derived crops/evidence

------------------------------------------------------------------------

## 10. OCR {#10-ocr}

OCR results should preserve:

-   text
-   confidence
-   bounding box
-   source image ID
-   processing metadata

Example:

``` json
{
  "text": "Net Quantity 500 g",
  "confidence": 0.97,
  "bbox": [50, 100, 400, 150],
  "image_id": "img_001"
}
```

Do not discard bounding boxes.

They are required for visual evidence.

------------------------------------------------------------------------

## 11. Declaration Extraction {#11-declaration-extraction}

Convert OCR output into normalized structured data.

Example:

``` json
{
  "net_quantity": {
    "value": 500,
    "unit": "g"
  },
  "mrp": {
    "value": 120,
    "currency": "INR"
  }
}
```

Prefer deterministic parsing for predictable fields:

-   MRP
-   quantities
-   units
-   dates
-   phone numbers
-   email addresses
-   barcodes

Use an LLM when semantic interpretation or normalization genuinely adds
value.

Never use an LLM where a deterministic parser is more reliable.

------------------------------------------------------------------------

## 12. LLM Rules {#12-llm-rules}

LLMs may assist with:

-   semantic normalization
-   structured extraction from messy OCR
-   wording variations
-   explanation
-   report drafting
-   RAG-based legal Q&A

LLMs must never:

-   invent legal rules
-   modify rule definitions without explicit logic
-   make the final legal determination
-   fabricate citations
-   override deterministic compliance logic

Validate all structured LLM output against a schema.

------------------------------------------------------------------------

## 13. Rule Engine {#13-rule-engine}

The compliance engine must be deterministic and testable.

Preferred interface:

``` python
result = compliance_engine.evaluate(
    declarations=declarations,
    product_context=product_context,
    inspection_date=inspection_date
)
```

Return structured findings:

``` json
{
  "rule_id": "PCR-NQ-001",
  "status": "PASS",
  "severity": "HIGH",
  "confidence": 0.98,
  "reason": "Net quantity detected.",
  "evidence_ids": ["ev_001"]
}
```

Keep legal/business logic in the compliance layer, not route handlers,
UI components or database triggers.

------------------------------------------------------------------------

## 14. Rule Data Model {#14-rule-data-model}

Rules should support at least:

``` text
id
rule_code
name
description
category
applicable_conditions
required_field
validation_type
severity
source
version
effective_from
effective_until
status
created_at
updated_at
```

Potential validation types:

``` text
EXISTS
NOT_EMPTY
PATTERN
NUMERIC_RANGE
UNIT_VALIDATION
DATE_VALIDATION
CONDITIONAL
MANUAL_REVIEW
```

------------------------------------------------------------------------

## 15. Product Categories {#15-product-categories}

Make the system category-aware.

Possible initial categories:

``` text
Food
Cosmetics
Household Products
Garments
Electronics
Imported Products
Other
```

This is an extensible application taxonomy, not a claim that these
categories exhaust the legal framework.

------------------------------------------------------------------------

## 16. Supabase Data Architecture {#16-supabase-data-architecture}

Use Supabase PostgreSQL for structured data.

Core entities:

``` text
users
products
inspections
inspection_images
ocr_results
declarations
rules
rule_versions
compliance_checks
violations
evidence
reports
audit_logs
```

Use foreign keys and appropriate indexes.

Store large files in Supabase Storage. Store metadata and storage paths
in PostgreSQL.

Suggested storage buckets:

``` text
product-images
processed-images
evidence
reports
```

Protect inspection data with authenticated access/signed URLs where
appropriate.

------------------------------------------------------------------------

## 17. Authentication & Authorization {#17-authentication--authorization}

Roles:

``` text
ADMIN
OFFICER
REVIEWER
```

Authorization must be enforced server-side.

Use Supabase Row Level Security where appropriate.

Remember:

> A hidden frontend button is not a security control.

Never expose the Supabase service-role key to the browser.

------------------------------------------------------------------------

## 18. API Design {#18-api-design}

Prefer resource-oriented REST endpoints:

``` text
POST   /auth/login

POST   /inspections
GET    /inspections
GET    /inspections/{id}

POST   /inspections/{id}/images
POST   /inspections/{id}/process

GET    /inspections/{id}/results
GET    /inspections/{id}/evidence

GET    /products
GET    /products/{id}
GET    /products/{id}/history

GET    /rules
POST   /rules
GET    /rules/{id}
PUT    /rules/{id}

GET    /reports/{inspection_id}

GET    /dashboard/metrics
```

Use dedicated request/response schemas.

Do not expose internal database models directly when an API schema is
more appropriate.

------------------------------------------------------------------------

## 19. API Errors {#19-api-errors}

Use predictable application errors.

Example:

``` json
{
  "error": {
    "code": "INSPECTION_NOT_FOUND",
    "message": "Inspection could not be found."
  }
}
```

Do not expose stack traces to users.

Log technical details server-side.

------------------------------------------------------------------------

## 20. Frontend Principles {#20-frontend-principles}

The UI should feel like a serious government/enforcement application.

Prioritize:

-   clarity
-   accessibility
-   evidence
-   tables
-   workflow
-   status
-   traceability

Avoid excessive:

-   gradients
-   decorative animation
-   marketing language
-   fake AI effects

Important routes:

``` text
/login
/dashboard
/inspections
/inspections/new
/inspections/[id]
/products
/products/[id]
/reports
/rules
/rules/[id]
/users
/settings
```

------------------------------------------------------------------------

## 21. Inspection Workflow {#21-inspection-workflow}

The primary workflow:

``` text
Create Inspection
       ↓
Upload Images
       ↓
Enter Optional Metadata
       ↓
Start Processing
       ↓
Processing Status
       ↓
Results
       ↓
Evidence Review
       ↓
Officer Review
       ↓
Generate Report
       ↓
Store History
```

The user should not need to understand the AI internals.

------------------------------------------------------------------------

## 22. Processing UX {#22-processing-ux}

For long-running processing, show stages:

``` text
✓ Image validation
✓ Image preprocessing
✓ OCR
✓ Declaration extraction
⏳ Compliance validation
○ Evidence generation
○ Report generation
```

Keep the API contract compatible with a future background-job/worker
implementation.

------------------------------------------------------------------------

## 23. Product History {#23-product-history}

Maintain historical inspection records.

Example:

``` text
Product
  ↓
Inspection #1 — FAIL
Inspection #2 — REVIEW
Inspection #3 — PASS
```

Inspection history should remain auditable.

Do not delete official inspection records casually.

------------------------------------------------------------------------

## 24. Reports {#24-reports}

Reports should contain:

-   inspection ID
-   product information
-   inspector
-   date/time
-   product images
-   extracted declarations
-   compliance checks
-   violations
-   evidence
-   rule references
-   AI confidence
-   officer notes
-   final status

Clearly distinguish:

``` text
AI-assisted finding
```

from:

``` text
Final officer determination
```

------------------------------------------------------------------------

## 25. Legal RAG Assistant {#25-legal-rag-assistant}

Build RAG over verified official legal documents.

Preferred flow:

``` text
Question
   ↓
Embedding
   ↓
pgvector Search
   ↓
Relevant Official Documents
   ↓
LLM
   ↓
Answer + Source
```

The assistant should:

-   provide sources
-   identify rule/version where possible
-   avoid unsupported conclusions
-   state uncertainty
-   never invent missing information

Do not build this before the core inspection pipeline works.

------------------------------------------------------------------------

## 26. E-Commerce Module {#26-e-commerce-module}

The architecture may support uploaded product listing screenshots.

Flow:

``` text
Screenshot / Listing
        ↓
OCR / Text Extraction
        ↓
Declaration Extraction
        ↓
Applicable E-Commerce Rules
        ↓
Compliance Checks
```

Keep this modular.

------------------------------------------------------------------------

## 27. Testing {#27-testing}

Every important compliance validator must have tests.

Include cases such as:

``` text
MRP present
MRP missing
Net quantity present
Net quantity missing
Invalid quantity unit
Manufacturer present
Manufacturer missing
Country of origin applicable
Country of origin not applicable
Consumer care present
Ambiguous OCR
Low-confidence extraction
Expired rule version
Future rule version
```

AI evaluation should track:

-   precision
-   recall
-   false positives
-   false negatives
-   review rate

------------------------------------------------------------------------

## 28. Mock Mode {#28-mock-mode}

The project must support demo/mock mode during development.

Mock mode may contain:

-   sample inspections
-   sample OCR
-   sample declarations
-   sample violations
-   sample evidence
-   sample reports

Clearly label it:

``` text
DEMO DATA
```

or:

``` text
MOCK PROCESSING MODE
```

Never make hard-coded demo output appear to be real AI processing.

------------------------------------------------------------------------

## 29. Environment Variables {#29-environment-variables}

Never commit secrets.

Use `.env` / `.env.local` locally and maintain `.env.example`.

Potential variables:

``` text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
DATABASE_URL
LLM_API_KEY
OCR_PROVIDER_KEY
STORAGE_BUCKET
API_BASE_URL
```

The service-role key is server-only.

------------------------------------------------------------------------

## 30. Coding Standards {#30-coding-standards}

### TypeScript

-   strict typing
-   reusable components
-   small focused functions
-   avoid `any` unless justified
-   keep server/client boundaries clear

### Python

-   type hints
-   Pydantic models
-   small testable services
-   clear exceptions
-   dependency injection where useful
-   keep rule logic testable as pure functions where practical

Avoid giant API route handlers.

------------------------------------------------------------------------

## 31. Naming {#31-naming}

Use descriptive names:

``` text
ComplianceEngine
DeclarationExtractor
InspectionService
EvidenceViewer
RuleRepository
```

Avoid vague names such as:

``` text
Helper
Manager
Thing
Temp
Utils2
```

unless their responsibility is genuinely clear.

------------------------------------------------------------------------

## 32. Git Workflow {#32-git-workflow}

Prefer small, meaningful commits:

``` text
feat: add inspection upload workflow
feat: integrate PaddleOCR service
feat: add MRP compliance validator
fix: preserve OCR bounding boxes
refactor: separate rule engine from API routes
docs: update architecture
test: add quantity normalization tests
```

Avoid giant commits containing unrelated changes.

------------------------------------------------------------------------

## 33. Working With AI Coding Agents {#33-working-with-ai-coding-agents}

Before changing code:

1.  Read `README.md`.
2.  Read `AGENTS.md`.
3.  Inspect the existing repository.
4.  Identify existing patterns.
5.  Reuse existing components/services.
6.  Determine which layer owns the feature.
7.  Check whether schema/API/RLS changes are needed.
8.  Implement the smallest coherent change.
9.  Run relevant tests/checks.
10. Report what changed and what remains.

Do not regenerate the whole application to fix a small feature.

------------------------------------------------------------------------

## 34. Before Implementing a Non-Trivial Feature {#34-before-implementing-a-non-trivial-feature}

Answer:

``` text
Which layer owns this?
What data does it require?
What API contract is required?
Does the database change?
Does RLS change?
Does the rule engine change?
How is evidence stored?
How is uncertainty represented?
How will it be tested?
```

Then implement.

------------------------------------------------------------------------

## 35. Do Not Over-Engineer the MVP {#35-do-not-over-engineer-the-mvp}

Prioritize the reliable end-to-end path:

``` text
Upload
 ↓
OCR
 ↓
Extraction
 ↓
Rules
 ↓
Violations
 ↓
Evidence
 ↓
Report
```

before:

-   Kubernetes
-   distributed microservices
-   custom foundation models
-   complex agent orchestration
-   nationwide analytics

A modular monolith is preferred for the SIH prototype.

------------------------------------------------------------------------

## 36. Development Phases {#36-development-phases}

### Phase 0 --- Architecture {#phase-0--architecture}

-   database schema
-   API specification
-   repository structure
-   rule-engine design
-   security model
-   AI pipeline design

### Phase 1 --- Scaffold {#phase-1--scaffold}

-   Next.js
-   FastAPI
-   Supabase
-   authentication
-   dashboard
-   inspection workflow
-   mock data

### Phase 2 --- AI {#phase-2--ai}

-   image upload
-   OpenCV preprocessing
-   PaddleOCR
-   bounding boxes
-   declaration extraction

### Phase 3 --- Compliance {#phase-3--compliance}

-   rule repository
-   rule versioning
-   validators
-   compliance checks
-   violations
-   evidence

### Phase 4 --- Inspection Platform {#phase-4--inspection-platform}

-   history
-   search
-   reports
-   audit logs
-   reviewer workflow

### Phase 5 --- Advanced {#phase-5--advanced}

-   font/readability analysis
-   obstruction detection
-   e-commerce analysis
-   legal RAG assistant
-   analytics

------------------------------------------------------------------------

## 37. Definition of Done {#37-definition-of-done}

A feature is not complete just because the UI exists.

A normal feature should include:

``` text
UI
+
API
+
Database
+
Validation
+
Error Handling
+
Authorization
+
Tests
+
Documentation
```

An AI feature should additionally include:

``` text
AI Output
+
Confidence
+
Fallback
+
Evidence
+
Evaluation
```

A compliance feature should additionally include:

``` text
Rule Source
+
Rule Version
+
Deterministic Validation
+
Explainable Reason
```

------------------------------------------------------------------------

## 38. Ambiguous Requirements {#38-ambiguous-requirements}

For technical ambiguity:

-   choose the simplest extensible solution
-   document the assumption

For legal ambiguity:

-   mark the finding as `REVIEW`
-   preserve evidence/context
-   do not invent a rule
-   require verification against an official source

------------------------------------------------------------------------

## 39. SIH Demo Priority {#39-sih-demo-priority}

Optimize for one polished end-to-end scenario:

``` text
Officer Login
     ↓
New Inspection
     ↓
Upload Product Images
     ↓
Processing
     ↓
OCR Result
     ↓
Extracted Declarations
     ↓
Compliance Findings
     ↓
Highlighted Evidence
     ↓
Rule Reference
     ↓
Officer Review
     ↓
PDF Report
     ↓
Inspection History
```

A reliable three-minute workflow is more valuable than many unfinished
features.

------------------------------------------------------------------------

## 40. Product Philosophy {#40-product-philosophy}

Legal-Lens should be:

``` text
FAST
EXPLAINABLE
EVIDENCE-DRIVEN
AUDITABLE
RULE-AWARE
OFFICER-CENTRIC
```

It is not merely an OCR application or chatbot.

Its value comes from connecting:

``` text
Computer Vision
      +
OCR
      +
Structured Extraction
      +
Legal Rule Engine
      +
Evidence
      +
Inspection Workflow
```

------------------------------------------------------------------------

## 41. Final Agent Instruction {#41-final-agent-instruction}

When modifying Legal-Lens, optimize for:

> **Correctness \> Explainability \> Maintainability \> Security \> Demo
> polish \> Complexity**

Never sacrifice legal traceability merely to make the demo look
intelligent.

When uncertain, prefer:

``` text
REVIEW
```

over an unsupported legal conclusion.

When a rule is uncertain, prefer:

``` text
UNVERIFIED
```

over invented legal content.

When AI is uncertain, preserve the evidence and expose the uncertainty.

When adding a capability, keep it modular so the OCR engine, LLM
provider, storage layer or legal rule set can evolve independently.

**Build Legal-Lens as an enforcement-assistance platform, not as a chatbot
with a dashboard.**
