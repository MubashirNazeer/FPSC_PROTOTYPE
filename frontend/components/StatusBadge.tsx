import styles from "./StatusBadge.module.css";

const STATUS_MAP: Record<string, string> = {
  DRAFT: "neutral",
  PENDING: "warn",
  IN_PROGRESS: "info",
  LIVE: "success",
  SUBMITTED: "success",
  AUTO_SUBMITTED: "success",
  APPROVED: "success",
  REJECTED: "danger",
  ACTIVE: "success",
  CLOSED: "neutral",
  FEE_PENDING: "warn",
  FEE_PAID: "info",
  UNDER_SCRUTINY: "info",
  ADMIT_ISSUED: "success",
  PUBLISHED: "success",
  ELIGIBLE: "success",
  SHORTLISTED: "success",
  NOMINATED: "success",
  SCHEDULED: "info",
  UNDER_RR: "warn",
  COMMISSION: "info",
  SYLLABUS: "info",
  ADVERTISED: "success",
  APPLICATIONS: "info",
  PRE_EXAM: "info",
  EXAM: "info",
  RESULT: "success",
  SCRUTINY: "warn",
  NOMINATION: "success",
};

type Props = {
  status?: string | null;
};

export function StatusBadge({ status }: Props) {
  const raw = (status ?? "").toString().trim();
  const key = raw || "UNKNOWN";
  const tone = STATUS_MAP[key] || "neutral";
  const label = raw ? raw.replace(/_/g, " ") : "—";
  return <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>;
}
