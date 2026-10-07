# Minutes of Meeting — FPSC Digitalization ERP MVP

**Project:** Software Development Services for Digitalization of In-House Processes and Automation of Examination System of FPSC  
**RFP Ref:** FPSC/PISC/SW/2026/01  
**Prepared for:** Internal walkthrough / stakeholder briefing  
**System:** FPSC_PROTOTYPE (MVP demo)

---

## 1. Purpose of the meeting note

To record, in plain language:

1. What the RFP actually required  
2. The official feature / module names  
3. What this MVP currently does (and what it only simulates)

---

## 2. What was actually required (RFP summary)

FPSC asked for an **integrated software platform** (not hardware) to:

| Need | Meaning |
|------|---------|
| Digitalize in-house processes | Replace paper/manual handoffs between wings with one system |
| Automate recruitment & exams | From requisition / advertisement to nomination / allocation |
| Question Data Bank (QDBMS) | Secure lifecycle for MCQ items and paper generation |
| Computer-Based Testing (CBT) | Deliver MCQ exams at labs with invigilation controls |
| Website + Candidate Portal | Public notices/ads + candidate self-service |
| Supporting ops | Duty, inventory, logistics, executive dashboards |
| Integrations | NADRA biometric, payment, SMS/email (interfaces) |
| Governance | RBAC, audit trail, workflow approvals, dual-auth for papers |

**Out of this software tender (separate procurements):** hardware, data centre, civil works, writing the actual one million questions.

**Contractual modules (six + portal):**

1. General Recruitment (GR)  
2. Competitive Examination (CE / CSS)  
3. Unified Examination Module (UEM)  
4. Official Website & Candidate Portal  
5. CBT + QDBMS  
6. Supporting Module  

---

## 3. Feature names (how to refer to them)

| Feature name | Short code | Who uses it |
|--------------|------------|-------------|
| General Recruitment | GR / EMS-GR | T&S, R&R, Commission, FS, IT, Program |
| Competitive Examination (CSS) | CE | CE Wing, Secrecy, IT, Program, Commission |
| Unified Examination Module | UEM | IT/Admin for FPOE, SOPE, Civil Judges, etc. |
| Official Website (CMS) | WEB | Public + FS/IT content editors |
| Candidate Portal | Portal | Applicants |
| Question Data Bank Management System | QDBMS | Authors, Reviewers, Approvers, Secrecy |
| Computer-Based Testing | CBT | Candidates + Invigilators |
| Invigilator Dashboard | CBT Invigilator | Exam-day staff |
| Workflow / eCase Engine | Workflow | All staff wings |
| Identity & Access (RBAC) | IAM | All users |
| Notifications (SMS/Email outbox) | Notify | System → candidates/staff |
| Executive Dashboard / Decision Support | DSS | Management / IT |
| Supporting Services | SUP | HR, Logistics (duty, inventory, transport) |
| Integrations (NADRA / Pay / SMS) | INT | Mocked in MVP |

**Main process flows (from RFP diagrams):**

- **GR Process Flow** (RFP p.12): Ministry requisition → FPSC scrutiny → Commission → syllabus/QDB → advertise → apply → test → scrutiny → interview → nomination  
- **CE/CSS Process Flow** (RFP p.14): MPT ad → apply → MPT/CBT → written → psych/medical/viva → group allocation  
- **Architecture view** (RFP p.24): how portal, EMS, CBT, QDB, and hosting fit together  

---

## 4. What is happening in this MVP (current system behaviour)

### 4.1 Public website
- Shows FPSC branding, notices, consolidated advertisements  
- Shows RFP process-flow images on **Process Flows** page  
- Staff/Candidate entry points in the navbar  

### 4.2 Candidate Portal
- Candidate registers/logs in  
- Browses ads and applies  
- Pays fee (mock payment)  
- Sees **advertisement name**, **ref**, **last date to apply**, status  
- Downloads admit card  
- Enters CBT for seeded demo sitting  

### 4.3 Staff EMS
- Login with wing/role accounts  
- **GR:** move requisitions through lifecycle phases (Advance)  
- **CE:** view CSS cycle phase  
- **UEM:** exam types (FPOE/SOPE/etc.) and stage  
- **QDB:** questions + dual-authorize papers  
- **CBT:** sittings, go-live, invigilator board  
- **Supporting:** duties + inventory  
- **CMS:** news/pages  
- **Dashboard:** live counts (apps, questions, CBT, etc.)  

### 4.4 QDBMS + CBT
- 200+ seeded active questions  
- Blueprint → generated paper → two officers authorize  
- Live sitting with randomized questions/options, timer, flag, submit  
- Invigilator sees session status / anomalies  

### 4.5 What is simulated (not production-real)
- NADRA biometric (mock)  
- Payment gateway (mock)  
- SMS/email (logged to outbox, not real telco)  
- Safe Exam Browser lockdown (not packaged)  
- Full edge offline multi-site DR / 3,000 concurrent load  

---

## 5. Demo accounts (for walkthrough)

**Password (all):** `Fpsc@2026`

| Username | Role / purpose |
|----------|----------------|
| `candidate1` | Candidate portal + CBT |
| `admin` | Full staff EMS |
| `secrecy` / `approver` | QDB dual authorization |
| `invigilator` | CBT invigilator view |
| `ts.officer`, `ce.officer`, etc. | Wing-specific staff |

**URLs**

- Frontend: http://localhost:3000  
- API docs: http://localhost:8000/api/docs/  
- Flows guide: http://localhost:3000/flows  

---

## 6. Decisions / understanding recorded

1. Scope of **this delivery** = working **MVP / prototype** covering all six module areas with happy-path demos — not the full 12-month production contract.  
2. Feature naming should follow **RFP module names** (GR, CE, UEM, Portal, QDBMS, CBT, Supporting).  
3. RFP **process diagrams** are part of the product narrative and are shown in-app under Process Flows.  
4. Candidate applications must show **advertisement title** and **last submission date** (implemented).  

---

## 7. Action items (suggested)

| # | Action | Owner |
|---|--------|--------|
| 1 | Walk GR flow with staff account (`admin`) | Demo lead |
| 2 | Walk candidate apply → fee → admit card → CBT (`candidate1`) | Demo lead |
| 3 | Show Process Flows page with RFP diagrams | Demo lead |
| 4 | Note gaps for next sprint (real NADRA/Pay/SEB, deeper CE micro-activities) | Product / tech |

---

## 8. One-line closing

**Requirement:** FPSC ERP for recruitment + exams + QDB + CBT + portal.  
**Features:** GR, CE, UEM, Website/Portal, QDBMS, CBT, Supporting, IAM, Workflow, Dashboard.  
**Happening now:** End-to-end demoable MVP with seeded ads, roles, papers, and live CBT sitting; external gov integrations mocked.
