# RFP Traceability Matrix — MVP

RFP: **FPSC/PISC/SW/2026/01**

Legend: **I** = Implemented in MVP · **P** = Partial / stub · **D** = Deferred (interface ready)

## Module coverage

| RFP Ref | Capability | Status | Implementation |
|---------|------------|--------|----------------|
| GR-1.1 | Requisition receipt, R&R flags, Commission path | I | `apps.gr` Requisition + workflow |
| GR-1.2 | Syllabus prep / Secrecy link to QDB | P | Syllabus fields + QDB cross-module |
| GR-1.3 | Consolidated advertisement + publish | I | Advertisement model + CMS/public |
| GR-1.4 | Online applicant profile & apply | I | Candidate portal + Application |
| GR-1.5 | Centres, admit cards, intimations | I | ExamCentre, AdmitCard, notifications |
| GR-1.6 | Result / scores | P | Application.score via CBT |
| GR-1.7 | Document scrutiny rule engine | P | Configurable scoring stub |
| GR-1.8 | Interview panels | I | InterviewPanel |
| GR-1.9 | Nomination | I | Nomination + status |
| CE-2.1–2.9 | CSS lifecycle phases | I | CompetitiveExamCycle + advance |
| CE allocation | Group/service allocation | P | Merit stub allocator |
| UEM-3.1–3.8 | Configurable exam types | I | ExamType stages + instances |
| WEB-4.1–4.13 | Website/CMS | I | Pages, News, SiteSettings + Next public site |
| QDB-5.1–5.12 | Question bank lifecycle | I | Taxonomy, versioning, workflow, CSV import |
| QDB-5.7–5.8 | Dual-auth paper generation | I | ExamPaper authorize + blueprint |
| QDB-5.9–5.10 | Psychometrics | P | Facility/discrimination fields + flag |
| CBT-5.14–5.17 | Session, timer, randomization | I | ExamSession services |
| CBT-5.15 | SEB lockdown | D | Config flag only |
| CBT-5.18 | NADRA biometric | P | Mock adapter |
| CBT-5.19 | Invigilator dashboard | I | `/cbt/sittings/{id}/invigilator/` |
| CBT-5.20–5.25 | Offline/edge, encryption, device swap | P | Mode + package hash + swap API |
| SUP-6.1–6.7 | Duties, inventory, transport, leave, library, DSS | I | `apps.supporting` + dashboard |
| IAM / RBAC | Roles & audit | I | `apps.accounts` |
| Workflow / eCase | Transitions, dual-auth, comments | I | `apps.workflow` |
| Integrations | NADRA, Pay, SMS | P | Mock adapters under `apps.integrations` |
| Notifications | Email/SMS outbox | I | Celery eager + outbox |
| Analytics | Executive dashboards | I | `/api/v1/dashboard/` |
| SA-01–08 | Stateless API, modular apps, OpenAPI | I | DRF + spectacular |
| Real SEB / NTC DR / MPLS / 3000 CU load | Production infra | D | Out of MVP |

## API base

`/api/v1/` — OpenAPI at `/api/docs/`
