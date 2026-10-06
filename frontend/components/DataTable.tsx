import styles from "./DataTable.module.css";

export type Column<T> = {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
};

type Props<T> = {
  columns: Column<T>[];
  rows: T[];
  emptyMessage?: string;
  getRowKey?: (row: T, index: number) => string | number;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  emptyMessage = "No records found.",
  getRowKey,
}: Props<T>) {
  if (!rows.length) {
    return <p className="muted">{emptyMessage}</p>;
  }
  return (
    <div className={styles.wrap}>
      <table className={styles.table}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={getRowKey ? getRowKey(row, idx) : idx}>
              {columns.map((col) => (
                <td key={col.key}>
                  {col.render
                    ? col.render(row)
                    : String(row[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
