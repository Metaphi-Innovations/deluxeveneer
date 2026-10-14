import type { MarquetrySelectedDraft } from "./MarquetrySelectedItems";
import type { MarquetryOrderDetailsValue } from "./MarquetryOrderDetails";
import {
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkForListing,
} from "../shared/factoryIssuedWorkStore";
import { getFactoryRowsForTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

export type MarquetryEditContext = {
  processId: string;
  rows: FactoryRecord[];
};

export function getMarquetryEditContext(
  selectedId: string | undefined,
  definitionRows: readonly FactoryRecord[],
): MarquetryEditContext | null {
  if (!selectedId) {
    return null;
  }

  const doneRows = listMarquetryDoneRows(definitionRows);
  const selected = doneRows.find(
    (row) => String(row.id) === selectedId || String(row.workItemId ?? "") === selectedId,
  );
  if (!selected) {
    return null;
  }

  const processId = readText(selected.marquetryProcessId);
  const rows = processId
    ? doneRows.filter((row) => readText(row.marquetryProcessId) === processId)
    : groupLegacyMarquetryRows(doneRows, selected);

  return {
    processId,
    rows: rows.length > 0 ? rows : [selected],
  };
}

export function readMarquetryOrderDetails(
  row: FactoryRecord | undefined,
): MarquetryOrderDetailsValue {
  return {
    orderItemNo: readText(row?.orderItemNo),
    orderNo: readText(row?.orderNo),
    purpose: "Order",
  };
}

export function readMarquetryDrafts(
  rows: readonly FactoryRecord[],
): Record<string, MarquetrySelectedDraft> {
  return Object.fromEntries(
    rows.map((row) => [
      String(row.id),
      {
        leavesUsed: readText(row.leavesUsed),
        remark: readText(row.remark),
      },
    ]),
  );
}

function listMarquetryDoneRows(definitionRows: readonly FactoryRecord[]) {
  const issuedRows = getFactoryIssuedWorkForListing("marquetry", "done").map((item) => {
    const row = factoryIssuedWorkToRow(item);
    const snapshotRemark = item.sourceSnapshot.remark;
    const snapshotLeaves = item.sourceSnapshot.leavesUsed;

    return {
      ...row,
      leavesUsed:
        typeof snapshotLeaves === "number" && Number.isFinite(snapshotLeaves)
          ? String(snapshotLeaves)
          : typeof snapshotLeaves === "string"
            ? snapshotLeaves
            : row.leavesUsed,
      remark: typeof snapshotRemark === "string" ? snapshotRemark : "",
    } as FactoryRecord;
  });
  const localRows = getFactoryRowsForTab(definitionRows, "done");
  const seen = new Set<string>();

  return [...issuedRows, ...localRows].filter((row) => {
    const id = String(row.id);
    if (seen.has(id)) {
      return false;
    }
    seen.add(id);
    return true;
  });
}

function groupLegacyMarquetryRows(
  doneRows: readonly FactoryRecord[],
  selected: FactoryRecord,
) {
  if (!String(selected.id).startsWith("factory-work-")) {
    return [selected];
  }

  const selectedKey = legacyMarquetryKey(selected);
  if (!selectedKey) {
    return [selected];
  }

  const matched = doneRows.filter(
    (row) =>
      String(row.id).startsWith("factory-work-") &&
      !readText(row.marquetryProcessId) &&
      legacyMarquetryKey(row) === selectedKey,
  );

  return matched.length > 0 ? matched : [selected];
}

function legacyMarquetryKey(row: FactoryRecord) {
  const orderNo = readText(row.orderNo);
  const orderItemNo = readText(row.orderItemNo);
  const processDate = readDateKey(
    row.groupingDate ?? row.marquetryDate ?? row.processDate,
  );

  if (!orderNo || !orderItemNo || !processDate) {
    return "";
  }

  return `${orderNo}|${orderItemNo}|${processDate}`;
}

function readDateKey(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${value.getFullYear()}-${month}-${day}`;
  }

  const match = /^(\d{4}-\d{2}-\d{2})/u.exec(String(value ?? "").trim());
  return match?.[1] ?? "";
}

function readText(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

export function readMarquetryWorkItemId(row: FactoryRecord) {
  if (typeof row.workItemId === "string" && row.workItemId.trim()) {
    return row.workItemId;
  }

  const id = String(row.id);
  return id.startsWith("factory-work-") ? id : "";
}
