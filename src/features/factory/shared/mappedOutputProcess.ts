import type { MasterFieldValue } from "../../masters/shared";
import {
  completeFactoryIssuedWork,
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkForListing,
  issueFactoryWork,
  removeFactoryIssuedWork,
  updateFactoryIssuedWorkSnapshot,
} from "./factoryIssuedWorkStore";
import { getFactoryRowsForTab } from "./factoryUtils";
import type { FactoryRecord } from "./types";

export function isMappedOutputSlug(slug: string) {
  return slug === "cnc-fluting" || slug === "embossing" || slug === "finishing";
}

export type MappedOutputEditContext = {
  processRunId: string;
  rows: FactoryRecord[];
  sourceRow: FactoryRecord;
};

export function getMappedOutputEditContext(
  slug: string,
  selectedId: string | undefined,
  definitionRows: readonly FactoryRecord[],
  passedRecord?: FactoryRecord,
): MappedOutputEditContext | null {
  if (!selectedId) {
    return null;
  }

  const doneRows = listMappedOutputDoneRows(slug, definitionRows);
  const selected =
    doneRows.find(
      (row) =>
        String(row.id) === selectedId || String(row.workItemId ?? "") === selectedId,
    ) ??
    (passedRecord && String(passedRecord.id) === selectedId ? passedRecord : undefined);

  if (!selected) {
    return null;
  }

  const processRunId = readText(selected.outputProcessRunId);
  const grouped = processRunId
    ? doneRows.filter((row) => readText(row.outputProcessRunId) === processRunId)
    : [selected];
  const rows = grouped.length > 0 ? grouped : [selected];

  return {
    processRunId,
    rows,
    sourceRow: rows[0]!,
  };
}

export function readMappedOutputDate(row: FactoryRecord | undefined) {
  return (
    row?.cncDate ??
    row?.embossingDate ??
    row?.finishingDate ??
    row?.processDate ??
    row?.issuedDate ??
    row?.issueDate
  );
}

export function saveMappedOutputProcess({
  formValues,
  isEdit,
  lineItems,
  listPath,
  navigate,
  originalRows,
  slug,
  sourceRow,
  title,
  workItemId,
}: {
  formValues: Record<string, MasterFieldValue>;
  isEdit: boolean;
  lineItems: readonly { id: string; values: Record<string, string> }[];
  listPath: string;
  navigate: (path: string) => void;
  originalRows: readonly FactoryRecord[];
  slug: string;
  sourceRow?: FactoryRecord | undefined;
  title: string;
  workItemId?: string | undefined;
}) {
  const processRunId =
    readText(originalRows[0]?.outputProcessRunId) || `${slug}-run-${Date.now()}`;
  const previousWorkIds = originalRows.map(readWorkItemId).filter(Boolean);
  const kept = new Set<string>();
  const formSnapshot = serializeFormValues(formValues);

  if (isEdit && previousWorkIds.length === 0) {
    navigate(listPath);
    return;
  }

  lineItems.forEach((lineItem, index) => {
    const matched =
      originalRows.find((row) => String(row.id) === lineItem.id) ??
      originalRows.find((row) => readWorkItemId(row) === lineItem.id);
    const snapshot: Record<string, unknown> = {
      ...(sourceRow ?? {}),
      ...(matched ?? {}),
      ...formSnapshot,
      ...lineItem.values,
      listingState: "done",
      outputProcessRunId: processRunId,
    };

    const existingWorkId = matched ? readWorkItemId(matched) : "";
    if (existingWorkId) {
      updateFactoryIssuedWorkSnapshot(existingWorkId, snapshot);
      kept.add(existingWorkId);
      return;
    }

    if (!isEdit && index === 0 && workItemId) {
      completeFactoryIssuedWork(workItemId, snapshot);
      kept.add(workItemId);
      return;
    }

    const issued = issueFactoryWork({
      destinationProcess: title,
      sourceProcess: title,
      sourceRow: {
        ...(snapshot as FactoryRecord),
        id: `${slug}-line-${lineItem.id}-${index}`,
      },
      sourceSlug: slug,
    });
    completeFactoryIssuedWork(issued.id, snapshot);
  });

  if (isEdit) {
    previousWorkIds.forEach((id) => {
      if (!kept.has(id)) {
        removeFactoryIssuedWork(id);
      }
    });
  }

  navigate(listPath);
}

function listMappedOutputDoneRows(
  slug: string,
  definitionRows: readonly FactoryRecord[],
) {
  const issuedRows = getFactoryIssuedWorkForListing(slug, "done").map((item) =>
    factoryIssuedWorkToRow(item),
  );
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

function readWorkItemId(row: FactoryRecord) {
  if (typeof row.workItemId === "string" && row.workItemId.trim()) {
    return row.workItemId;
  }

  const id = String(row.id ?? "");
  return id.startsWith("factory-work-") ? id : "";
}

function readText(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function serializeFormValues(values: Record<string, MasterFieldValue>) {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (value instanceof Date && !Number.isNaN(value.getTime())) {
        const month = String(value.getMonth() + 1).padStart(2, "0");
        const day = String(value.getDate()).padStart(2, "0");
        return [key, `${value.getFullYear()}-${month}-${day}`];
      }

      return [key, value];
    }),
  );
}
