# RFP Full Compliance Matrix — Built Scope

RFP: **FPSC/PISC/SW/2026/01**

Status: **F** Fully demoable in software · **M** Mocked external dependency · **L** Limited depth vs 12-month production

## §2.1 Delay solutions

| Capability | Status | Where |
|------------|--------|-------|
| QDBMS + paper gen + CBT | F | Staff QDBMS, CBT |
| Automated CBT scoring | F | CBT submit |
| Automated scrutiny | F | GR scrutiny rules engine |
| eCase / digital approvals | F | Workflow + Advance |
| Notification engine | F/M | Templates + outbox (gateway mocked) |
| Unified EMS DB | F | Django apps |
| Executive DSS | F | /dashboard + reports |
| Audit trail | F | AuditLog + case logs |

## Module 3 UEM

| Ref | Status | Implementation |
|-----|--------|----------------|
| UEM-3.1 | F | Exam type generator UI/API |
| UEM-3.2 | F | UEM requisitions register/search |
| UEM-3.3 | F | Shared candidate portal apply/dashboard |
| UEM-3.4 | F | Ads + quota roster API/UI |
| UEM-3.5 | F | Pre-exam report pack generator |
| UEM-3.6 | F | Rule-based scrutiny (shared) |
| UEM-3.7 | F | Marksheets, schedule slots, merit list |
| UEM-3.8 | F/M | Intimations/correspondence + mock pay/biometric |

## Module 4 Website

| Ref | Status |
|-----|--------|
| WEB-4.1 CMS | F |
| WEB-4.2 Responsive | F |
| WEB-4.3 Accessibility | L (contrast + labels; full WCAG audit later) |
| WEB-4.4 SEO | F (metadata/keywords/OG) |
| WEB-4.5 IA | F |
| WEB-4.6 Cross-browser | F |
| WEB-4.7 Nav/search/404 | F |
| WEB-4.8 Errors/forms | F |
| WEB-4.9 Contrast | F |
| WEB-4.10 Analytics | M (env NEXT_PUBLIC_GA_ID) |
| WEB-4.11 Forms | F |
| WEB-4.12 Social | F (footer links) |
| WEB-4.13 Staff CMS RBAC | F |

## Still not production hardware/integrations

Real NADRA Verisys live API, SEB binary lockdown packaging, NTC HA/DR, 3,000 concurrent load certification, and writing 1M question items remain outside pure software MVP / separate tenders — adapters are in place.
