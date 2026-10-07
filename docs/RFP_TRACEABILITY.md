# RFP Traceability Matrix — Built Prototype

RFP: **FPSC/PISC/SW/2026/01**

Legend: **F** = Fully demoable · **M** = Mocked external · **L** = Limited depth · **D** = Deferred infra

Companion: [`RFP_COMPLIANCE_FULL.md`](./RFP_COMPLIANCE_FULL.md) · [`MOM_FPSC_MVP.md`](./MOM_FPSC_MVP.md)

## §2.1 Delay → solution

| Delay | Solution | Status |
|-------|----------|--------|
| Paper prep | QDBMS + dual-auth + CBT | F |
| Result compilation | CBT auto-score | F |
| Eligibility scrutiny | Rule engine GR/UEM | F |
| Approvals | eCase / workflow | F |
| Candidate comms | Templates + outbox | F/M |
| Siloed records | Unified EMS DB | F |
| Visibility | DSS dashboard + reports | F |
| Audit | AuditLog + case logs | F |

## Module 1 — GR

| Ref | Capability | Status | Where |
|-----|------------|--------|-------|
| GR-1.1 | Requisition receipt / pipeline | F | Staff GR · `/requisitions/` |
| GR-1.2 | Syllabus / Secrecy link | L | Syllabus fields + QDB |
| GR-1.3 | Consolidated advertisement | F | Ads + public `/ads` |
| GR-1.4 | Online apply / profile | F | Candidate portal |
| GR-1.5 | Centres, admit, intimations | F | AdmitCard + templates |
| GR-1.6 | Result / scores | F | CBT score → application |
| GR-1.7 | Document scrutiny engine | F | Weighted rules + fails |
| GR-1.8 | Interview panels | F | InterviewPanel API |
| GR-1.9 | Nomination | F | Nomination model |
| Appeals | Appeal / restoration | F | Staff GR Appeals tab |
| Hearings | Personal hearing diary | F | Staff GR Hearings |
| Attendance | Exam attendance | F | Staff GR Attendance |

## Module 2 — CE

| Ref | Capability | Status | Where |
|-----|------------|--------|-------|
| CE-2.1–2.9 | CSS phase lifecycle | F | Staff CE Cycles |
| Psych / medical / viva | Progress tracking | F | Staff CE Progress |
| Schedule | Event diary | F | Staff CE Schedule |
| Examiner panels | Commission approve | F | Staff CE Panels |
| Allocation | Group/service | F/L | Merit allocator |

## Module 3 — UEM

| Ref | Capability | Status |
|-----|------------|--------|
| UEM-3.1 | Exam type generator | F |
| UEM-3.2 | Requisitions register | F |
| UEM-3.3 | Candidate portal share | F |
| UEM-3.4 | Ads + quota roster | F |
| UEM-3.5 | Pre-exam report pack | F |
| UEM-3.6 | Scrutiny (shared) | F |
| UEM-3.7 | Marksheet / schedule / merit | F |
| UEM-3.8 | Intimations / correspondence | F/M |

## Module 4 — Website / Portal

| Ref | Status |
|-----|--------|
| WEB-4.1 CMS | F |
| WEB-4.2 Responsive | F |
| WEB-4.3 A11y | L |
| WEB-4.4 SEO | F |
| WEB-4.5 IA | F |
| WEB-4.6 Cross-browser | F |
| WEB-4.7 Nav / search / 404 | F |
| WEB-4.8 Errors / forms | F |
| WEB-4.9 Contrast | F |
| WEB-4.10 Analytics | M (`NEXT_PUBLIC_GA_ID`) |
| WEB-4.11 Forms | F |
| WEB-4.12 Social | F |
| WEB-4.13 Staff CMS RBAC | F |

## Modules 5–6 + cross-cutting

| Ref | Status | Notes |
|-----|--------|-------|
| QDB-5.1–5.12 | F | Taxonomy, workflow, CSV, dual-auth papers |
| QDB psychometrics | L | Facility/discrimination fields |
| CBT-5.14–5.17 | F | Session, timer, randomize |
| CBT SEB | D/M | Config flag |
| CBT NADRA biometric | M | Mock adapter |
| CBT invigilator | F | Staff sitting console |
| Offline / edge / swap | L | Mode + package hash + swap API |
| SUP-6.1–6.7 | F | Duties, inventory, transport, leave, library, DSS |
| IAM / RBAC / audit | F | |
| Workflow eCase | F | |
| Integrations | M | NADRA / Pay / SMS mocks |
| Notification templates | F | Staff Notifications |
| Reports | F | Dashboard, centre-workload, scrutiny |

## Explicitly out of pure-software MVP

Live NADRA Verisys contract, SEB binary packaging, NTC HA/DR/MPLS, 3,000 concurrent certification, and seeding ~1M questions — adapters/interfaces exist; production infra separate.

## API

Base: `/api/v1/` · OpenAPI: `/api/docs/`
