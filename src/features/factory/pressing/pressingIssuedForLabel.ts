import type { FactoryRecord } from "../shared/types";

const pressingRouteLabels = [
  ["emboss", "Embossing"],
  ["flut", "Fluting"],
  ["finish", "Finishing"],
  ["marquetry", "Marquetry"],
  ["decor", "Decorative"],
] as const;

function pressingString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function getPressingRouteLabel(row: FactoryRecord) {
  const candidates = [
    row.issueTo,
    row.nextProcess,
    row.targetProcess,
    row.productType,
    row.orderType,
    row.issuedFor,
  ];

  for (const candidate of candidates) {
    const normalized = pressingString(candidate).toLowerCase();
    const match = pressingRouteLabels.find(([keyword]) => normalized.includes(keyword));
    if (match) return match[1];
  }

  return "";
}

export function getPressingForLabel(row: FactoryRecord) {
  const sampleValues = [
    row.purpose,
    row.pressingFor,
    row.for,
    row.forLabel,
    row.issuePurpose,
  ];
  const isSample =
    row.isSample === true ||
    Boolean(pressingString(row.sampleNo)) ||
    sampleValues.some((value) => pressingString(value).toLowerCase().includes("sample"));
  const route = getPressingRouteLabel(row);

  if (isSample) {
    return route ? `Sample Sheet - ${route}` : "Sample Sheet";
  }

  return route || "Order";
}

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
        for: getPressingForLabel(row),
        forLabel: getPressingForLabel(row),
      }) as Row,
  );
}
