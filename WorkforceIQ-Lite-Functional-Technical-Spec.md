# WorkforceIQ Lite — Functional & Technical Specification (v1.0)

**Document purpose:** This is the baseline specification to kick off development of WorkforceIQ Lite. It defines scope, functional requirements per module, data model, architecture, APIs, security, compliance, and deployment requirements. Treat this as a living document — refine per module as sprints progress.

---

## 1. Product Overview

WorkforceIQ Lite is an AI-powered HR and Payroll platform for the full employee lifecycle, targeting SMEs, MFIs, banks, NGOs, schools, and healthcare institutions — designed to be **deployed in any country** by configuring country-specific compliance rules (income tax brackets, statutory deductions, leave laws, pension/provident fund, public holidays, calendar system, currency, and language) without code changes.

**Core pillars:**
- Employee Management
- Attendance
- Leave
- Payroll (multi-country compliance: configurable income tax, statutory deductions, pension/provident fund)
- Reporting & Analytics
- AI Assistant (HR support, payroll validation, insights, document generation)
- Employee Self-Service
- Enterprise Security (JWT, RBAC, audit logging, encryption, HTTPS)
- Multi-branch, high-availability architecture
- SaaS + On-Premises deployment

**Out of scope for v1** (recommend explicitly, to protect the timeline): recruitment/ATS, performance management (OKRs/appraisals), full LMS/training modules, benefits marketplace. These can be phase 2+.

---

## 2. User Roles (initial RBAC model)

| Role | Description |
|---|---|
| Super Admin | Full system + tenant configuration access (SaaS ops) |
| Org Admin / HR Admin | Full access within their organization |
| Branch/Department Manager | Access scoped to their branch/team (approvals, reports) |
| Payroll Officer | Payroll processing, validation, disbursement |
| Employee | Self-service only (profile, payslips, leave, attendance) |
| Auditor (read-only) | Read-only access to audit logs, payroll history, reports |

Permissions should be modeled as granular capabilities (e.g. `payroll.run`, `leave.approve`, `employee.edit`) grouped into roles, not hardcoded role checks — this makes future custom roles easy.

---

## 3. Functional Requirements by Module

### 3.1 Employee Management
- Employee profile CRUD: personal info, employment info (title, department, branch, employment type, start date), documents (ID, contracts), emergency contacts, bank details
- Org structure: company → branch → department → position hierarchy
- Employment lifecycle events: onboarding, transfers, promotions, termination/offboarding, with history log
- Document storage per employee (contracts, ID scans, certifications) with expiry tracking (e.g., work permits)
- Bulk import/export (CSV/Excel) for onboarding existing staff
- Custom fields per organization (configurable HR data points)

### 3.2 Attendance
- Clock-in/clock-out (web + mobile; optional biometric/device integration hook for later)
- Shift and schedule management per branch/department
- Late arrival, early departure, absence tracking with configurable grace periods
- Manual attendance correction with approval workflow and audit trail
- Attendance summary feeding directly into payroll (hours worked, overtime)

### 3.3 Leave Management
- Configurable leave types (annual, sick, maternity/paternity, unpaid, compassionate, etc.) — seeded with the defaults for the organization's country, fully editable by HR Admin
- Leave accrual rules (e.g., monthly accrual, carry-over caps, pro-ration for new hires) — configurable per leave type and per country profile
- Leave request → approval workflow (manager → HR, configurable chain)
- Leave balance visibility for employee and manager
- Public holiday calendar — country-specific public holiday sets loaded from the country profile; supports custom org holidays on top; calendar system awareness per §3.9

### 3.4 Payroll (Multi-Country Compliant)
- Payroll run per pay period (monthly default, configurable), per branch or consolidated
- Salary structure: basic salary, allowances (taxable/non-taxable), deductions, overtime, bonuses — all component types configurable per org
- **Income tax calculation** via a country's active `TaxRuleSet` — progressive bracket tables, flat rates, or formula-based — versioned and effective-dated so government-issued rate changes require only a new rule version, never a code deploy
- **Statutory deductions** (pension, provident fund, social security, health levy, etc.) via a country's `StatutoryDeductionRuleSet` — employee and employer contribution rates, applicability conditions (employment type, salary threshold), and ceiling caps are all data-driven
- Statutory rule sets ship as **Country Compliance Packages** (seed data files): a new country is onboarded by importing its package. Example package fields: `incomeTaxBrackets`, `pensionEmployeeRate`, `pensionEmployerRate`, `pensionCeiling`, `applicableEmploymentTypes`, `effectiveDate`
- Other deduction hooks: court-ordered garnishments, salary advances, loans, custom cost-sharing
- Payslip generation (PDF) and distribution via self-service
- Payroll validation step before disbursement (AI-assisted anomaly detection — see §3.6)
- Bank disbursement file export (format configurable per bank; CSV/Excel to start, integration later)
- Payroll history and audit trail — every run immutable once finalized, corrections via new adjustment entries, never silent edits
- **No hardcoded currency** — currency is a property of the Organization record; all monetary values stored with currency code

> **Critical architectural principle:** All tax, pension, and statutory deduction logic is driven by versioned, effective-dated rule sets stored as data — **never as code constants**. Adding or updating compliance for a country is a data operation, not a deployment. This is the single most important architectural decision in the payroll module and must be enforced as a non-negotiable constraint across the entire codebase.

### 3.5 Employee Self-Service (ESS)
- View/download payslips
- Submit/track leave requests and view balances
- View/update permitted profile fields (address, phone, emergency contact, bank details — with approval gate for sensitive fields)
- View attendance history
- Access AI assistant for HR queries (policy questions, "how many leave days do I have," etc.)

### 3.6 AI Assistant
- **HR support chatbot:** answer policy/FAQ questions using org-specific HR policy documents (RAG over uploaded policy docs)
- **Payroll validation:** flag anomalies before disbursement (e.g., salary变ance >X% month-over-month, missing tax IDs, duplicate bank accounts, negative net pay)
- **Insights:** attrition trend, absenteeism patterns, headcount cost trend — surfaced to HR Admin dashboard
- **Document generation:** offer letters, employment contracts, termination letters, HR letters — templated + AI-drafted, always with human review/approval step before finalization
- All AI outputs on payroll/compliance-sensitive actions should be **advisory, not auto-executing** — a human approves before anything financial or legal is finalized

### 3.7 Reporting
- Standard reports: headcount, payroll cost summary, leave liability, attendance summary, turnover
- Statutory reports: income tax remittance report, pension/statutory deduction remittance report — report templates and labels sourced from the active Country Compliance Package so they match local submission requirements
- Export to PDF/Excel
- Scheduled report delivery (email) — phase 2 candidate if timeline is tight

### 3.8 Security & Compliance
- JWT-based authentication, refresh token rotation
- RBAC enforced at API layer (not just UI)
- Audit logging: who did what, when, on which record — immutable log, queryable by Auditor role
- Encryption at rest (DB-level or field-level for sensitive fields: national ID, bank account, salary) and in transit (HTTPS/TLS everywhere, no exceptions)
- Password policy + optional MFA for admin/payroll roles (recommend mandatory MFA for Payroll Officer and above)
- Session management, account lockout on repeated failed logins
- Data residency consideration for on-prem deployments (relevant for regulated clients like banks/MFIs)

### 3.9 Multi-Country Localization
- **Calendar system:** the system stores and processes all dates in Gregorian (ISO 8601) internally. A pluggable `CalendarAdapter` per country profile handles dual display (e.g., Ethiopian 13-month, Hijri, Persian, Hebrew). Adding a new calendar requires only a new adapter implementation — core payroll logic is never aware of the calendar variant.
- **Language / i18n:** all UI strings externalised via i18n keys (e.g., `i18next`). Language packs are swappable per organization locale setting. Payslips and employee-facing screens render in the org's configured language. First-class support can be added per country without touching core code.
- **Currency:** currency code and formatting rules (symbol position, decimal separator, thousands separator) are properties of the Organization record. No currency is hardcoded anywhere in the system.
- **Date format and number format:** derived from the organization's `locale` setting (e.g., `en-ET`, `en-KE`, `ar-EG`), applied at the presentation layer only — data layer always stores ISO/numeric forms.
- **Country Compliance Package structure** (loaded at org setup or country onboarding):
  ```
  CountryProfile
    ├── countryCode (ISO 3166-1 alpha-2)
    ├── currencyCode (ISO 4217)
    ├── defaultLocale
    ├── calendarSystem (gregorian | ethiopian | hijri | ...)
    ├── publicHolidays[]
    ├── defaultLeaveTypes[]
    ├── TaxRuleSet[] (versioned, effective-dated)
    └── StatutoryDeductionRuleSet[] (versioned, effective-dated)
  ```
- New country support = create and import a new `CountryProfile` data file. Zero code changes required.

### 3.10 Multi-Branch / Scalability
- Branch-level data scoping (users see only their branch unless role grants broader access)
- Consolidated org-wide views for HR Admin/Super Admin
- Designed for horizontal scaling (stateless app layer, externalized session store)

---

## 4. Technical Architecture

### 4.1 Three-Tier Architecture

WorkforceIQ Lite follows a classic three-tier architecture. This keeps the system easy to reason about, secure by default (no tier is trusted to skip another), and equally deployable in SaaS or on-prem mode.

**Tier 1 — Presentation (Client)**
- Web app (React/Next.js) for Admin, HR, Payroll Officer, and Manager dashboards
- Employee self-service portal — payslips, leave requests, profile, AI assistant chat
- Mobile app (Phase 2/3) — attendance and self-service on the go
- Communicates with the backend only via HTTPS/REST (or GraphQL if adopted) — never touches the database directly

**Tier 2 — Application / Logic (Server)**
- API layer (NestJS or Django/FastAPI) containing all business logic:
  - Authentication & RBAC enforcement
  - Employee, Attendance, Leave, and Payroll modules
  - Country-agnostic tax & statutory deductions rules engine (versioned, effective-dated `TaxRuleSet` / `StatutoryDeductionRuleSet` per country)
  - AI assistant orchestration (calls out to the Claude API)
  - Audit logging on every write operation
- Background job workers (payroll runs, payslip PDF generation, scheduled reports) — async, queue-based
- This tier is where every security, RBAC, and compliance rule is enforced — the presentation tier is never trusted to enforce these independently

**Tier 3 — Data**
- PostgreSQL — employees, payroll, leave, audit logs, versioned tax/pension rule tables
- Redis — sessions, caching, job queues
- Object storage (S3-compatible, or MinIO for on-prem) — documents, payslip PDFs, contracts
- Accessed only by the application tier — no other tier connects to it directly

```
┌─────────────────────────────┐
│   Tier 1 — Presentation      │
│   Web App | Self-Service |    │
│   Mobile (phase 2/3)          │
└──────────────┬────────────────┘
               │ HTTPS / REST
┌──────────────▼────────────────┐
│   Tier 2 — Application/Logic   │
│   API + RBAC + Payroll Engine  │
│   AI Orchestration + Audit Log │
│   Background Job Workers       │
└──────────────┬────────────────┘
               │
┌──────────────▼────────────────┐
│   Tier 3 — Data                │
│   PostgreSQL | Redis |         │
│   Object Storage                │
└─────────────────────────────┘
```

**Deployment mapping:**
- **SaaS:** each tier scales independently — stateless app servers behind a load balancer, managed PostgreSQL with read replicas, Redis cluster, cloud object storage
- **On-premises:** all three tiers ship as containers in a single Docker Compose or Helm bundle on the client's infrastructure — same codebase, different topology, no code changes required between modes

### 4.2 High-Level Architecture
Recommend a modular monolith for v1 (faster to build, easier to deploy on-prem for clients who don't want microservices ops overhead), with clear internal module boundaries so it can be split into services later if a SaaS client needs that scale.

```
┌─────────────────────────────────────────────┐
│              Client Layer                     │
│   Web App (React/Next.js)  |  Mobile (later)  │
└───────────────────┬───────────────────────────┘
                     │ HTTPS / REST (JSON) or GraphQL
┌───────────────────▼───────────────────────────┐
│                API Gateway / BFF                │
│      Auth (JWT) · Rate limiting · Routing        │
└───────────────────┬───────────────────────────┘
                     │
┌───────────────────▼───────────────────────────┐
│           Application Layer (Modular)            │
│  Employee | Attendance | Leave | Payroll |        │
│  Reporting | AI Assistant | Notifications | Audit │
└───────────────────┬───────────────────────────┘
                     │
┌───────────────────▼───────────────────────────┐
│                  Data Layer                      │
│   PostgreSQL (primary) · Redis (cache/session)   │
│   Object storage (documents/payslips)            │
└───────────────────────────────────────────────┘
```

### 4.3 Suggested Tech Stack

| Layer | Recommendation | Rationale |
|---|---|---|
| Frontend | React + TypeScript (Next.js) | SSR for performance, strong ecosystem, easy to hire for |
| Backend | Node.js (NestJS) **or** Python (Django/FastAPI) | Both fit modular monolith well; NestJS if team is TS-heavy, Django if payroll/rules-engine logic benefits from Python's readability |
| Database | PostgreSQL | Strong relational integrity for payroll/financial data, JSONB for flexible custom fields |
| Cache/Session | Redis | Session store, rate limiting, job queues |
| Auth | JWT (access + refresh tokens), bcrypt/argon2 for password hashing | Industry standard, stateless-friendly |
| File/Doc storage | S3-compatible object storage (works for both SaaS and on-prem via MinIO) | Same code path for SaaS and on-prem deployment |
| Background jobs | Queue (BullMQ if Node, Celery if Python) | Payroll runs, report generation, notifications should be async |
| AI layer | Anthropic Claude API (Claude Sonnet or Haiku depending on task cost/latency needs) via a dedicated internal AI service | Isolates AI logic, lets you swap/version prompts without touching core modules |
| Reporting/PDF | Headless rendering (e.g., Puppeteer or a PDF library) for payslips/reports | Consistent, brandable output |
| Deployment | Docker containers; Kubernetes optional for SaaS scale, Docker Compose acceptable for on-prem/smaller clients | Same containers for both deployment modes |

### 4.4 Data Model (Core Entities — starting point)

```
CountryProfile (ISO country code, currency, locale, calendarSystem, dataRetentionDays)
 ├── PublicHoliday[]
 ├── DefaultLeaveType[]
 ├── TaxRuleSet[] (versioned, effectiveDate, expiryDate, brackets[])
 └── StatutoryDeductionRuleSet[] (versioned, effectiveDate, rules[{ name, employeeRate, employerRate, ceiling, applicableTo }])

Organization (tenant)
 ├── countryCode → CountryProfile
 ├── currencyCode
 ├── locale
 └── Branch
      └── Department
           └── Employee
                ├── EmploymentHistory
                ├── Document
                ├── AttendanceRecord
                ├── LeaveRequest (→ LeaveType, LeaveBalance)
                ├── SalaryStructure
                └── PayrollLineItem (→ PayrollRun)

PayrollRun
 ├── PayrollLineItem (per employee)
 ├── taxRuleSetId → TaxRuleSet (snapshot of active rule version on pay date)
 ├── statutoryDeductionRuleSetId → StatutoryDeductionRuleSet (snapshot)
 └── PayslipDocument

User (auth identity, linked to Employee or standalone admin)
 └── Role → Permission[]

AuditLog (entity_type, entity_id, actor, action, before/after, timestamp)
AIInteractionLog (prompt context, response, module, human-approved flag)
```

Key design principle: **all country compliance rules — tax brackets, statutory deduction rates, leave law defaults, public holidays — are versioned, effective-dated data records** stored in `CountryProfile`-scoped rule sets. Every payroll run references the rule versions active on its pay date. This is critical for audit defensibility, multi-country operation, and for absorbing government directive changes without any code deployment.

### 4.5 API Design
- RESTful JSON API (or GraphQL if the frontend team prefers — REST recommended for v1 for simplicity and easier on-prem client integration)
- Versioned endpoints (`/api/v1/...`)
- Consistent error envelope, pagination, filtering conventions
- Every write endpoint enforces RBAC + writes an audit log entry
- Example core endpoint groups:
  - `/auth` — login, refresh, logout, MFA
  - `/employees`, `/branches`, `/departments`
  - `/attendance`
  - `/leave-types`, `/leave-requests`, `/leave-balances`
  - `/payroll-runs`, `/payslips`, `/tax-rule-sets`, `/statutory-deduction-rule-sets`
  - `/country-profiles`, `/country-profiles/:code/compliance-package`
  - `/reports`
  - `/ai/assistant`, `/ai/payroll-validate`, `/ai/generate-document`
  - `/audit-logs` (Auditor/Admin only)

### 4.6 Security Requirements (Technical)
- TLS 1.2+ enforced everywhere, HSTS enabled
- JWT short-lived access tokens (e.g., 15 min) + rotating refresh tokens, refresh tokens revocable server-side
- Field-level encryption for: national ID number, bank account number, salary figures (encrypt at rest, decrypt only in-process)
- RBAC middleware on every API route — deny by default
- Full audit trail: immutable, append-only log table, separate from operational tables
- Input validation and output encoding to prevent injection/XSS
- Rate limiting on auth endpoints
- Secrets management via environment/vault, never committed to code
- Regular dependency vulnerability scanning in CI

### 4.7 Deployment Requirements
- **SaaS:** multi-tenant architecture, tenant isolation at the data layer (row-level `organization_id` scoping enforced in every query, or schema-per-tenant if stronger isolation is required by larger clients like banks)
- **On-premises:** containerized deployment package (Docker Compose or Helm chart), installation/runbook documentation, offline-capable licensing check
- CI/CD pipeline: automated tests → build → deploy to staging → manual promote to production
- Environments: dev, staging, production (minimum)
- Backup strategy: automated daily DB backups, tested restore procedure (especially critical for payroll data)
- High availability: stateless app tier behind load balancer, DB with replication/failover for SaaS tier; on-prem HA is client-dependent (document as optional add-on)

### 4.8 Non-Functional Requirements
| Requirement | Target |
|---|---|
| API response time | <300ms p95 for standard reads |
| Payroll run (500 employees) | Completes in <2 minutes |
| Uptime (SaaS) | 99.5%+ |
| Concurrent users per org | Design for 200+ without degradation |
| Data retention | Payroll/audit records retained per the applicable labor/tax law of each organization's country — minimum retention period is a configurable field on the `CountryProfile`; confirm with legal/compliance per jurisdiction before finalizing |

---

## 5. Suggested Build Phasing

**Phase 1 (MVP core):** Employee Management, Attendance, Leave, Payroll engine (income tax + statutory deductions rules engine, first-launch country compliance package), basic Reporting, Auth/RBAC/Audit, Self-service (view-only + leave requests)

**Phase 2:** AI Assistant (HR chatbot, payroll validation), Document generation, advanced reporting, additional language packs and calendar adapters as needed per active client countries

**Phase 3:** Multi-branch HA hardening, on-prem packaging polish, integrations (biometric devices, bank disbursement APIs), mobile app

Recommend confirming Phase 1 scope with stakeholders before sprint planning — payroll + compliance engine is the highest-risk, highest-effort component and should be prioritized early so compliance logic gets the most testing time.

---

## 6. Sprint 0 Decisions — Resolved

All pre-development decisions are closed. The table below is the authoritative record.

| # | Question | Decision |
|---|---|---|
| 1 | Launch country | **Ethiopia only** (v1). Architecture supports adding countries via `CountryProfile` seed files — no code changes required. |
| 2 | Compliance data sources | **ERCA** for income tax brackets; **Proclamation No. 715/2011** for private-sector pension (employee 7%, employer 11%); **Labour Proclamation No. 1156/2019** for leave law minimums. All values must be verified against the latest ERCA directive before go-live as brackets can change by directive. |
| 3 | Calendar system at launch | **Gregorian only in Phase 1.** `CalendarAdapter` interface wired from day one; Ethiopian 13-month display adapter deferred to **Phase 2**. |
| 4 | Language packs at launch | **English in Phase 1.** i18n key structure wired from day one. Amharic (Ethiopic script, Noto Sans Ethiopic font) deferred to **Phase 2**. |
| 5 | Tenant isolation model | **Shared schema + PostgreSQL Row-Level Security (RLS)** enforced on `organization_id`. Schema-per-tenant available as a future enterprise-tier option via `TenantIsolationStrategy` interface — no v1 scope. |
| 6 | MFA mandatory roles | **Mandatory** for Super Admin, Org Admin / HR Admin, Payroll Officer. Optional (user-elected) for Branch/Department Manager. Not required for Employee or Auditor. |
| 7 | Bank disbursement formats | **Generic CSV/Excel in Phase 1.** Bank-specific format (CBE, Awash, Dashen, etc.) implemented when pilot bank is confirmed — Phase 1 late or Phase 2. |
| 8 | Data retention | **10 years (3 650 days)** per ERCA regulations. Encoded as `dataRetentionDays: 3650` in the Ethiopia `CountryProfile`. Automated retention enforcement job is Phase 2. |

---

*This document is intended as a starting baseline. Each module above should be broken into detailed user stories/acceptance criteria during sprint planning.*
