import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";

import styles from "./flows.module.css";

const USE_CASES = [
  {
    title: "Candidate — Apply to a GR post",
    actors: "Candidate",
    steps: [
      "Register / login on Candidate Portal (CNIC-based profile)",
      "Open published Consolidated Advertisement",
      "Submit application against a post/requisition",
      "Pay fee (mock payment gateway)",
      "Download admit card after roll number / centre allotment",
      "Sit CBT (if MCQ) and track result / scrutiny status",
    ],
  },
  {
    title: "Staff — General Recruitment case",
    actors: "T&S → R&R → Commission → CR&C → FS → IT → Secrecy → Program",
    steps: [
      "Receive & register ministry requisition (GR-1.1)",
      "R&R verification / auto-flag mismatches (GR-1.1)",
      "Commission approval, then syllabus workflow (GR-1.2)",
      "Publish consolidated advertisement (GR-1.3)",
      "Monitor applications, centres, admit cards (GR-1.4–1.5)",
      "Conduct exam / compile result (GR-1.6)",
      "Document scrutiny & interview (GR-1.7–1.8)",
      "Issue nomination (GR-1.9)",
    ],
  },
  {
    title: "Staff — CSS / MPT cycle",
    actors: "Secrecy, CE Wing, IT, Program, Commission",
    steps: [
      "Examiner panel & paper preparation via QDBMS (CE-2.1)",
      "MPT advertisement & online applications (CE-2.2)",
      "Centres, admit cards, CBT delivery (CE-2.3–2.4)",
      "Written / psych / medical / viva scheduling (CE-2.5–2.8)",
      "Final merit & group/service allocation (CE-2.9)",
    ],
  },
  {
    title: "Secrecy — Question bank & paper",
    actors: "Author, Reviewer, Approver (dual auth)",
    steps: [
      "Author MCQ items with taxonomy & difficulty",
      "Review → Approve → Activate workflow",
      "Generate paper from blueprint constraints",
      "Two distinct officers authorize export/use",
      "Paper used in a CBT sitting",
    ],
  },
  {
    title: "Invigilator — CBT exam day",
    actors: "Invigilator, Candidate",
    steps: [
      "Sitting goes LIVE; encrypted package metadata recorded",
      "Candidate biometric check (mock NADRA)",
      "Start timed session with randomized questions/options",
      "Invigilator board shows live progress & anomaly flags",
      "Submit / auto-submit; scores sync to application",
    ],
  },
];

export default function FlowsPage() {
  return (
    <AppShell>
      <div className={`container ${styles.wrap}`}>
        <h1 className="page-title">Use cases & process flows</h1>
        <p className="page-lead">
          These diagrams are taken from the FPSC RFP PDF (pages 12, 14, and 24).
          The MVP implements the happy-path of each flow with staff EMS,
          candidate portal, QDBMS, and CBT.
        </p>

        <section className={styles.block}>
          <h2>1. General Recruitment lifecycle (RFP p.12)</h2>
          <img
            className={styles.diagram}
            src="/rfp-flows/page12_img1.png"
            alt="FPSC General Recruitment process flow diagram from RFP"
          />
        </section>

        <section className={styles.block}>
          <h2>2. Competitive Examination / CSS lifecycle (RFP p.14)</h2>
          <img
            className={styles.diagram}
            src="/rfp-flows/page14_img1.png"
            alt="FPSC CSS Competitive Examination process flow diagram from RFP"
          />
        </section>

        <section className={styles.block}>
          <h2>3. Architecture / deployment view (RFP p.24)</h2>
          <img
            className={styles.diagram}
            src="/rfp-flows/page24_img1.png"
            alt="FPSC system architecture diagram from RFP"
          />
        </section>

        <section className={styles.block}>
          <h2>Demo use cases (how to walk the system)</h2>
          <div className={styles.cases}>
            {USE_CASES.map((uc) => (
              <article key={uc.title} className="card">
                <h3>{uc.title}</h3>
                <p className={styles.actors}>
                  <strong>Actors:</strong> {uc.actors}
                </p>
                <ol>
                  {uc.steps.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </article>
            ))}
          </div>
          <div className={styles.cta}>
            <Button href="/portal/login" variant="primary">
              Try Candidate Portal
            </Button>
            <Button href="/staff/login" variant="secondary">
              Open Staff EMS
            </Button>
            <Button href="/ads" variant="ghost">
              Browse Advertisements
            </Button>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
