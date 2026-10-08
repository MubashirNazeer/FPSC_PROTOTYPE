/** GR 9-phase lifecycle (RFP Module 1 / BetaCodes prototype). */
export const GR_PHASES = [
  { key: "requisition", label: "Requisition", wing: "T&S" },
  { key: "syllabus", label: "Syllabus & paper", wing: "CR&C" },
  { key: "advertisement", label: "Advertisement", wing: "FS" },
  { key: "applications", label: "Applications", wing: "IT" },
  { key: "test", label: "Test conduct", wing: "T&S" },
  { key: "result", label: "Result", wing: "Secrecy" },
  { key: "scrutiny", label: "Scrutiny", wing: "T&S" },
  { key: "interview", label: "Interview", wing: "Program" },
  { key: "nomination", label: "Nomination", wing: "FS" },
] as const;

const STATUS_TO_PHASE: Record<string, number> = {
  DRAFT: 0,
  UNDER_RR: 0,
  COMMISSION: 0,
  SYLLABUS: 1,
  ADVERTISED: 2,
  APPLICATIONS: 3,
  PRE_EXAM: 4,
  EXAM: 4,
  RESULT: 5,
  SCRUTINY: 6,
  NOMINATION: 8,
  CLOSED: 8,
};

export function grStatusToPhase(status?: string): number {
  if (!status) return 0;
  return STATUS_TO_PHASE[status] ?? 0;
}
