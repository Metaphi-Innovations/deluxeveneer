import {
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkForListing,
} from "../shared/factoryIssuedWorkStore";
import { getFactoryRowsForTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";
import type { PressingProcessValues } from "./PressingProcessFields";
import type { PressingPurpose } from "./PressingPurposeChoice";
import type { PressingRejectValues } from "./PressingRejectDetails";
import { mapPressingIssuedListingRow, pressingText } from "./pressingQuantity";
import type { PressingBaseMaterialType } from "./usePressingBaseStock";
import type { PressingUsageDraft } from "./pressingQuantity";

export type PressingEditContext = {
  processId: string;
  rows: FactoryRecord[];
};

export type PressingEditForm = {
  baseDrafts: Record<string, PressingUsageDraft>;
  baseIds: string[];
  baseRows: FactoryRecord[];
  baseType: PressingBaseMaterialType;
  orderItemNo: string;
  orderNo: string;
  processValues: PressingProcessValues;
  purpose: PressingPurpose;
  rejectValues: PressingRejectValues;
  sampleNo: string;
  veneerDrafts: Record<string, PressingUsageDraft>;
  veneerIds: string[];
};

const emptyRejectValues: PressingRejectValues = {
  itemName: "",
  length: "",
  quantity: "",
  remark: "",
  thickness: "",
  type: "",
  width: "",
};

export function getPressingEditContext(
  selectedId: string | undefined,
  definitionRows: readonly FactoryRecord[],
): PressingEditContext | null {
  if (!selectedId) {
    return null;
  }

  const doneRows = listPressingDoneRows(definitionRows);
  const selected = doneRows.find(
    (row) => String(row.id) === selectedId || String(row.workItemId ?? "") === selectedId,
  );
  if (!selected) {
    return null;
  }

  const processId = pressingText(selected.pressingProcessId);
  const rows = processId
    ? doneRows.filter((row) => pressingText(row.pressingProcessId) === processId)
    : groupLegacyPressingRows(doneRows, selected);

  return {
    processId,
    rows: rows.length > 0 ? rows : [selected],
  };
}

export function readPressingEditForm(
  context: PressingEditContext,
  pressingDate: string,
): PressingEditForm {
  const row = context.rows[0];
  const purpose = readPressingPurpose(row);
  const baseRows = readPressingBaseRows(row);
  const baseType = readBaseType(row, baseRows);

  return {
    baseDrafts: Object.fromEntries(
      baseRows.map((baseRow) => [
        String(baseRow.id),
        {
          qtyToUse: pressingText(baseRow.sheetsToUse) || pressingText(baseRow.qtyToUse),
          remark: pressingText(baseRow.remark),
        },
      ]),
    ),
    baseIds: baseRows.map((baseRow) => String(baseRow.id)),
    baseRows,
    baseType,
    orderItemNo: pressingText(row?.orderItemNo),
    orderNo: purpose === "Order" ? pressingText(row?.orderNo) : "",
    processValues: {
      cutColor: pressingText(row?.cutColor),
      grade: pressingText(row?.grade),
      itemSubCategory: pressingText(row?.itemSubCategory),
      length: pressingText(row?.length),
      noOfSheets: pressingText(row?.noOfSheets),
      outputItemName: pressingText(row?.outputItemName) || pressingText(row?.itemName),
      pressingDate: readDateKey(row?.pressingDate) || pressingDate,
      remark: context.rows.map((entry) => pressingText(entry.processRemark)).find(Boolean) ?? "",
      thickness: pressingText(row?.thickness),
      width: pressingText(row?.width),
    },
    purpose,
    rejectValues: readRejectValues(row),
    sampleNo:
      purpose === "Sample Sheet"
        ? pressingText(row?.sampleNo) || pressingText(row?.orderNo)
        : "",
    veneerDrafts: Object.fromEntries(
      context.rows.map((entry) => [
        String(entry.id),
        {
          qtyToUse: pressingText(entry.qtyToUse),
          remark: pressingText(entry.remark),
        },
      ]),
    ),
    veneerIds: context.rows.map((entry) => String(entry.id)),
  };
}

export function readPressingVeneerRows(rows: readonly FactoryRecord[]) {
  return rows.map((row) => {
    const source = readPressingSourceRecord(row);

    return mapPressingIssuedListingRow({
      ...source,
      id: String(row.id),
      orderItemNo: pressingText(source.orderItemNo) || pressingText(row.orderItemNo),
      orderNo: pressingText(source.orderNo) || pressingText(row.orderNo),
      qtyToUse: pressingText(row.qtyToUse),
      remark: pressingText(row.remark),
      sampleNo: pressingText(source.sampleNo) || pressingText(row.sampleNo),
      workItemId: readPressingWorkItemId(row) || row.workItemId,
    });
  });
}

export function readPressingSourceSnapshot(row: FactoryRecord) {
  const source = readPressingSourceRecord(row);
  const snapshot = { ...(source as Record<string, unknown>) };
  delete snapshot.baseMaterialType;
  delete snapshot.outputItemName;
  delete snapshot.pressingDate;
  delete snapshot.pressingFor;
  delete snapshot.pressingProcessId;
  delete snapshot.pressingSourceItem;
  delete snapshot.processRemark;
  delete snapshot.qtyToUse;
  delete snapshot.rejectDetails;
  delete snapshot.selectedBaseMaterial;
  return snapshot;
}

export function mergePressingBaseRows(
  stockRows: readonly FactoryRecord[],
  savedRows: readonly FactoryRecord[],
) {
  const stockIds = new Set(stockRows.map((row) => String(row.id)));
  const extras = savedRows.filter((row) => !stockIds.has(String(row.id)));
  return [...extras, ...stockRows];
}

export function readPressingWorkItemId(row: FactoryRecord) {
  if (typeof row.workItemId === "string" && row.workItemId.trim()) {
    return row.workItemId;
  }

  const id = String(row.id);
  return id.startsWith("factory-work-") ? id : "";
}

function listPressingDoneRows(definitionRows: readonly FactoryRecord[]) {
  const issuedRows = getFactoryIssuedWorkForListing("pressing", "done").map((item) => {
    const row = factoryIssuedWorkToRow(item);
    const snapshot = item.sourceSnapshot;

    return {
      ...row,
      ...(snapshot.pressingProcessId ? { pressingProcessId: snapshot.pressingProcessId } : {}),
      ...(isRecord(snapshot.pressingSourceItem)
        ? { pressingSourceItem: snapshot.pressingSourceItem }
        : {}),
      ...(snapshot.selectedBaseMaterial
        ? { selectedBaseMaterial: snapshot.selectedBaseMaterial }
        : {}),
      ...(isRecord(snapshot.rejectDetails) ? { rejectDetails: snapshot.rejectDetails } : {}),
      ...(snapshot.processRemark ? { processRemark: snapshot.processRemark } : {}),
      qtyToUse: snapshot.qtyToUse ?? row.qtyToUse,
    } as unknown as FactoryRecord;
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

function groupLegacyPressingRows(
  doneRows: readonly FactoryRecord[],
  selected: FactoryRecord,
) {
  if (!String(selected.id).startsWith("factory-work-")) {
    return [selected];
  }

  const selectedKey = legacyPressingKey(selected);
  if (!selectedKey) {
    return [selected];
  }

  const matched = doneRows.filter(
    (row) =>
      String(row.id).startsWith("factory-work-") &&
      !pressingText(row.pressingProcessId) &&
      legacyPressingKey(row) === selectedKey,
  );

  return matched.length > 0 ? matched : [selected];
}

function legacyPressingKey(row: FactoryRecord) {
  const purpose = readPressingPurpose(row);
  const target =
    purpose === "Sample Sheet"
      ? pressingText(row.sampleNo) || pressingText(row.orderNo)
      : `${pressingText(row.orderNo)}|${pressingText(row.orderItemNo)}`;
  const date = readDateKey(row.pressingDate);
  const output = pressingText(row.outputItemName) || pressingText(row.itemName);
  const bases = readPressingBaseRows(row)
    .map((baseRow) => String(baseRow.id))
    .sort()
    .join(",");

  if (!purpose || !target || target === "|" || !date || !output) {
    return "";
  }

  return `${purpose}|${target}|${date}|${output}|${bases}`;
}

function readPressingPurpose(row: FactoryRecord | undefined): PressingPurpose {
  const pressingFor = pressingText(row?.pressingFor);
  if (pressingFor === "Order" || pressingFor === "Sample Sheet") {
    return pressingFor;
  }

  if (
    pressingText(row?.purpose) === "SAMPLE" ||
    pressingText(row?.for) === "Sample" ||
    pressingText(row?.forLabel) === "Sample"
  ) {
    return "Sample Sheet";
  }

  if (pressingText(row?.orderNo)) {
    return "Order";
  }

  return "";
}

function readBaseType(
  row: FactoryRecord | undefined,
  baseRows: readonly FactoryRecord[],
): PressingBaseMaterialType {
  const value = pressingText(row?.baseMaterialType) || pressingText(baseRows[0]?.materialType);
  return value === "Plywood" || value === "MDF" ? value : "";
}

function readPressingBaseRows(row: FactoryRecord | undefined): FactoryRecord[] {
  const value = row?.selectedBaseMaterial;
  if (!Array.isArray(value)) {
    return [];
  }

  const materialType = pressingText(row?.baseMaterialType);

  return value.flatMap((entry) => {
    if (!isRecord(entry)) {
      return [];
    }

    const id = pressingText(entry.id);
    if (!id) {
      return [];
    }

    return [
      {
        ...(entry as unknown as FactoryRecord),
        id,
        materialType: pressingText(entry.materialType) || materialType,
      },
    ];
  });
}

function readRejectValues(row: FactoryRecord | undefined): PressingRejectValues {
  const details = row?.rejectDetails;
  if (!isRecord(details)) {
    return emptyRejectValues;
  }

  const record = details;
  return {
    itemName: pressingText(record.itemName),
    length: pressingText(record.length),
    quantity: pressingText(record.quantity),
    remark: pressingText(record.remark),
    thickness: pressingText(record.thickness),
    type: pressingText(record.type),
    width: pressingText(record.width),
  };
}

function readPressingSourceRecord(row: FactoryRecord) {
  const source = row.pressingSourceItem;
  if (isRecord(source)) {
    return source as unknown as FactoryRecord;
  }

  return row;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date);
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
