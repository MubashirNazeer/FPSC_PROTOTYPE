# Minutes of Meeting — FPSC Digitalization ERP MVP (Updated)

**RFP Ref:** FPSC/PISC/SW/2026/01  
**Sources:** Section 2.1 Current State · Section 3.4 UEM · Section 3.5 Website/Portal · Modules 1–6  

---

## 1. Agenda / purpose

Capture what the RFP requires (problem + modules), the **feature names**, and **what the MVP does today** — in MoM form for demos and internal alignment.

---

## 2. Project background (RFP §2.1) — why the system exists

### 2.1 Current state (as stated in RFP)

- FPSC runs many exam types: **CSS**, **GB Competitive**, **GR**, **FPOE**, **SOPE**, Section Officers APT, GB Recruitment, PMS-to-PAS Induction, Regularization, and other Federal Govt–referred exams.
- ~**0.8 million applications / year**.
- CSS annual; **GR ongoing** all year.
- Typical **GR cycle: 150–450 days**; 12-step process from requisition to nomination.
- Mostly **manual**: physical files, paper, external examiners, OMR, manual scrutiny.
- Pre-exam partly automated **except requisition management**.

### 2.2 Top delays → root cause → required system capability

| Delay | Root cause | Required feature / solution | RFP refs | MVP status |
|-------|------------|-----------------------------|----------|------------|
| Question paper preparation | Manual examiner coordination, physical papers, fictitious numbering | **QDBMS** + automated paper gen + encrypted CBT | §3.6, §4.6 | **I** — author/review/approve, blueprint, dual-auth paper, CBT package hash |
| Result compilation | Manual OMR, physical answer books, tabulation | **Automated CBT scoring** | GR-1.6, CE-2.4, Module 5B | **I** — CBT auto-score on submit; OMR path stubbed |
| Eligibility scrutiny | Manual document verification | **Automated scrutiny / rule engine** | GR-1.7, CE-2.8, CC-03 | **I** — weighted rules + fails; NADRA mock |
| Inter-departmental approvals | Physical file movement | **eCase / workflow digital approvals** | GR-1.12, CE-2.10, TAB-04 | **I** — workflow engine + advance + audit |
| Candidate communication | Manual notifications | **Notification engine** | CC-02, MOB-04 | **I** — templates + outbox (gateway mocked) |
| No centralised records | Excel/Word silos | **Unified ERP / EMS database** | §3, §4 | **I** — single Postgres/SQLite EMS |
| Weak operational visibility | No dashboards | **Executive DSS / dashboards** | SUP-6.6, TAB-01–05 | **I** — staff dashboard KPIs |
| Weak auditability | Fragmented approvals | **Audit trail & workflow logging** | CC-01 | **I** — AuditLog + case transition logs |

Legend: **I** = Implemented in MVP · **P** = Partial / stub · **D** = Deferred  

---

## 3. Feature catalogue (module names as in RFP)

| # | Feature / module name | Code | Purpose |
|---|----------------------|------|---------|
| 1 | General Recruitment | **GR** | Ex-cadre posts BPS-16+ full lifecycle |
| 2 | Competitive Examination (CSS) | **CE** | MPT → written → psych → medical → viva → allocation |
| 3 | Unified Examination Module | **UEM** | Configurable engine for all other exam types |
| 4 | Official Website + Candidate Portal | **WEB / Portal** | Public CMS + candidate self-service |
| 5A | Question Data Bank Management System | **QDBMS** | Question lifecycle + paper generation |
| 5B | Computer-Based Testing | **CBT** | Secure MCQ delivery + invigilator board |
| 6 | Supporting Module | **SUP** | Duty, inventory, transport, DSS |
| — | Workflow / eCase | **Workflow** | Digital approvals across wings |
| — | Identity & Access | **IAM / RBAC** | Roles per wing |
| — | Notifications | **Notify** | SMS/email/push outbox |
| — | Integrations | **INT** | NADRA, payment, SMS adapters |

### Exam types UEM must cover (RFP §3.4)

FPOE, SOPE, Civil Judges, AD Survey of Pakistan, GB Competitive Examinations, internal recruitments, psychological assessments, situational tests, **+ admin-defined types without code changes**.

---

## 4. Module 3 — UEM requirements vs MVP

| Ref | Functionality | MVP |
|-----|---------------|-----|
| UEM-3.1 | Exam type generator (no code change) | **I** — create type + stages in Staff → UEM |
| UEM-3.2 | Requisitions registration / search / status | **P** — via shared GR requisitions + UEM instance tracking |
| UEM-3.3 | Candidate profile + online apply + dashboard | **I** — Candidate Portal (shared with GR/CE ads) |
| UEM-3.4 | Advertisement consolidation, R&R/quota | **P** — ads create/publish; quota rules stub |
| UEM-3.5 | Pre-exam reports, centres, admit cards | **P** — centres + admit cards; reports basic |
| UEM-3.6 | Document submission + automated CV scrutiny | **P** — scrutiny scoring stub (same engine as GR) |
| UEM-3.7 | Marksheet, recount, psych/medical/viva, merit | **P** — stage advancement; scheduling stubs |
| UEM-3.8 | Intimations, templates, case tracking, biometric, fee | **P** — notifications + mock pay + mock biometric |

**Design rule (RFP):** UEM reuses the **same workflow engine** as GR/CE with exam-type-specific configuration — implemented as configurable `stages[]` on `ExamType`.

---

## 5. Module 4 — Website & Candidate Portal vs MVP

| Ref | Functionality | MVP |
|-----|---------------|-----|
| WEB-4.1 | CMS without developer | **I** — Staff → CMS Management |
| WEB-4.2 | Mobile-responsive | **I** — responsive layout |
| WEB-4.3 | Accessibility provisions | **P** — contrast improved; full a11y audit later |
| WEB-4.4 | SEO | **P** — semantic pages; no full SEO toolkit |
| WEB-4.5 | Clear IA / navigation | **I** — About, Ads, Flows, Portal, Contact |
| WEB-4.6 | Cross-browser | **I** — modern browsers |
| WEB-4.7 | Nav, 404, header/footer | **P** — nav/header/footer; custom 404 optional |
| WEB-4.8 | Valid markup / errors | **I** — form validation + API errors |
| WEB-4.9 | Contrasting colours | **I** — white UI + green actions |
| WEB-4.10 | Google Analytics / Search Console | **D** — not wired |
| WEB-4.11 | Usable forms | **I** — portal/staff forms |
| WEB-4.12 | Social links | **D** — placeholder |
| WEB-4.13 | Staff RBAC CMS login | **I** — Staff EMS + CMS |

---

## 6. What is happening in the running MVP (operations view)

1. **Public** sees ads/notices and RFP process-flow diagrams (`/flows`).  
2. **Candidate** applies, pays (mock), sees ad name + last date, admit card, CBT.  
3. **Staff GR** manages requisitions → ads → applications → admit/scrutiny.  
4. **Staff CE** runs CSS cycle phases + group allocation.  
5. **Staff UEM** defines new exam types/stages and advances instances.  
6. **Staff QDBMS** adds questions, advances status, builds blueprints, generates & dual-authorizes papers.  
7. **Staff CBT** schedules sittings, enrolls candidates, goes live, invigilates.  
8. **Staff CMS / Supporting / Dashboard** content, duties/inventory, executive KPIs.  
9. **Workflow + Audit** log every advance/authorization for auditability.

**Demo password:** `Fpsc@2026` · **URLs:** http://localhost:3000 · http://localhost:8000/api/docs/

---

## 7. Decisions recorded

1. MVP addresses **every delay row** in §2.1 at least partially; paper prep, CBT scoring, workflow, central DB, dashboard, audit are demoable.  
2. UEM is the **configurable engine** for non-GR/non-CSS exams — not a third hardcoded copy of GR.  
3. Website + Portal replace the single public interaction point (WEB-4.x).  
4. Full production (real NADRA, SEB, Analytics, 0.8M scale) remains post-MVP.

---

## 8. Action items

| # | Action | Owner |
|---|--------|--------|
| 1 | Demo §2.1 delay table → live screens (QDB→CBT, GR advance, Portal apply, Dashboard) | Demo lead |
| 2 | Demo UEM: create exam type + advance instance | Demo lead |
| 3 | Demo CMS: publish notice without code | Demo lead |
| 4 | Next sprint: deepen UEM-3.5–3.7 reports/scheduling; WEB-4.10 analytics | Tech |

---

## 9. Closing one-liner

**Background:** Manual 150–450 day GR cycles and fragmented exam ops.  
**Features:** GR, CE, UEM, WEB/Portal, QDBMS, CBT, SUP + Workflow/IAM/Notify.  
**Now:** Working management consoles for each module; gov integrations mocked; maps directly to RFP delay-solution table.
