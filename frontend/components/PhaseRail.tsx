import { GR_PHASES } from "@/lib/grPhases";

import styles from "./PhaseRail.module.css";

type Props = {
  phase: number;
  /** Compact bar used in tables */
  compact?: boolean;
  /** Show labeled 9-column rail (dashboard / detail) */
  labeled?: boolean;
};

export function PhaseRail({ phase, compact, labeled }: Props) {
  const hasPhase = phase >= 0;
  const idx = hasPhase
    ? Math.max(0, Math.min(phase, GR_PHASES.length - 1))
    : -1;

  if (labeled) {
    return (
      <div className={styles.railBig}>
        {GR_PHASES.map((g, i) => (
          <div
            key={g.key}
            className={`${styles.st} ${
              hasPhase && i < idx ? styles.stDone : ""
            } ${hasPhase && i === idx ? styles.stCur : ""}`}
          >
            <b>{g.label}</b>
            <small>{g.wing}</small>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className={compact ? styles.railCompact : styles.rail}
      title={`${GR_PHASES[idx].label} (${idx + 1}/${GR_PHASES.length})`}
      aria-label={`Phase ${idx + 1} of ${GR_PHASES.length}: ${GR_PHASES[idx].label}`}
    >
      {GR_PHASES.map((g, i) => (
        <span
          key={g.key}
          className={
            i < idx ? styles.done : i === idx ? styles.cur : undefined
          }
          title={g.label}
        />
      ))}
    </div>
  );
}
