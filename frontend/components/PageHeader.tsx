import type { ReactNode } from "react";

import styles from "./PageHeader.module.css";

type Props = {
  title: string;
  lead?: string;
  refs?: string[];
  actions?: ReactNode;
};

export function PageHeader({ title, lead, refs, actions }: Props) {
  return (
    <div className={styles.ph}>
      <div>
        <h1 className={styles.title}>{title}</h1>
        {lead ? <p className={styles.lead}>{lead}</p> : null}
      </div>
      <div className={styles.right}>
        {refs?.length ? (
          <div className={styles.refs}>
            {refs.map((r) => (
              <span key={r} className={styles.ref} title="RFP reference">
                {r}
              </span>
            ))}
          </div>
        ) : null}
        {actions}
      </div>
    </div>
  );
}
