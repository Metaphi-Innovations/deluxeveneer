import type { FactoryRecord } from "../shared/types";

export function getPressingDoneIssuedForLabel(value: unknown) {
  const issuedFor = typeof value === "string" ? value.trim() : "";

  if (issuedFor === "Fluted") {
    return "Fluting";
  }

  if (issuedFor === "Embossed") {
    return "Embossing";
  }

  return issuedFor;
}

export function applyPressingIssuedForLabels<Row extends FactoryRecord>(
  rows: readonly Row[],
): Row[] {
  return rows.map(
    (row) =>
      ({
        ...row,
        issuedFor: getPressingDoneIssuedForLabel(row.issuedFor),
      }) as Row,
  );
}
