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
  UNDER_SCRUTINY: "info",
  ADMIT_ISSUED: "success",
};

type Props = {
  status: string;
};

export function StatusBadge({ status }: Props) {
  const tone = STATUS_MAP[status] || "neutral";
  const label = status.replace(/_/g, " ");
  return (
    <span className={`${styles.badge} ${styles[tone]}`}>{label}</span>
  );
}
