import type {
  IssueStockLineDraft,
  IssueStockMaterial,
  IssueStockOrderItemOption,
  IssueStockOrderOption,
  IssueStockRow,
  IssueStockUnit,
  IssueStockValidationResult,
} from "./issueStockForPacking.types";

export function unitForMaterial(material: IssueStockMaterial): IssueStockUnit {
  return material === "raw-veneer" ? "Leaves" : "Sheets";
}

export function materialLabel(material: IssueStockMaterial) {
  if (material === "raw-veneer") return "Raw Veneer";
  if (material === "plywood") return "Plywood";
  return "MDF";
}

export function orderItemMatchesMaterial(
  productCategory: string,
  material: IssueStockMaterial,
) {
  const normalized = productCategory
    .trim()
    .toLowerCase()
    .replace(/\s*\((?:raw|finished|wood|pressed veneer)\)$/i, "");
  if (material === "raw-veneer") {
    return (
      normalized.includes("veneer") ||
      normalized === "raw" ||
      normalized === ""
    );
  }
  if (material === "plywood") {
    return normalized.includes("plywood") || normalized === "";
  }
  return normalized.includes("mdf") || normalized === "";
}

export function isActiveRawOrder(order: Pick<IssueStockOrderOption, "status" | "orderType">) {
  const status = order.status.trim().toLowerCase();
  const orderType = order.orderType.trim().toLowerCase();
  const inactive =
    status === "cancelled" ||
    status === "inactive" ||
    status === "closed" ||
    status === "completed" ||
    status === "dispatched";
  const isFinished =
    orderType.includes("finished") || orderType.includes("finish");
  return !inactive && !isFinished;
}

function normalizeDimension(value: string) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/mm$/i, "");
}

export function dimensionsMatch(
  stock: Pick<IssueStockRow, "length" | "width" | "thickness">,
  orderItem: Pick<IssueStockOrderItemOption, "length" | "width" | "thickness">,
) {
  return (
    normalizeDimension(stock.length) === normalizeDimension(orderItem.length) &&
    normalizeDimension(stock.width) === normalizeDimension(orderItem.width) &&
    normalizeDimension(stock.thickness) ===
      normalizeDimension(orderItem.thickness)
  );
}

export function parseWholeQuantity(value: string) {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : null;
}

export function roundArea(value: number) {
  return Math.round(value * 1000) / 1000;
}

/** Display helper — always 3 decimal places for SQM/SQF. */
export function formatAreaDecimal(value: number | null | undefined) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) {
    return "—";
  }
  return roundArea(Number(value)).toFixed(3);
}

export function calculateIssuedArea(input: {
  availableQty: number;
  availableSqm: number;
  availableSqf: number;
  qtyToIssue: number;
}) {
  if (input.availableQty <= 0 || input.qtyToIssue <= 0) {
    return { sqm: 0, sqf: 0 };
  }
  const ratio = input.qtyToIssue / input.availableQty;
  return {
    sqm: roundArea(input.availableSqm * ratio),
    sqf: roundArea(input.availableSqf * ratio),
  };
}

export function todayInputValue(date = new Date()) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

export function filterCompatibleOrderItems(
  items: readonly IssueStockOrderItemOption[],
  material: IssueStockMaterial,
) {
  return items.filter((item) =>
    orderItemMatchesMaterial(item.productCategory, material),
  );
}

export function validateIssueStockForPacking(input: {
  material: IssueStockMaterial;
  stockById: ReadonlyMap<string, IssueStockRow>;
  order: IssueStockOrderOption | null;
  orderItem: IssueStockOrderItemOption | null;
  issueDate: string;
  lines: readonly IssueStockLineDraft[];
}): IssueStockValidationResult {
  const fieldErrors: IssueStockValidationResult["fieldErrors"] = {};
  const lineErrors: Record<string, string> = {};
  let formError = "";

  if (!input.issueDate.trim()) {
    fieldErrors.issueDate = "Issue date is required.";
  }
  if (!input.order) {
    fieldErrors.orderId = "Select an active Raw order.";
  }
  if (!input.orderItem) {
    fieldErrors.orderItemId = "Select an order item.";
  }

  if (input.lines.length === 0) {
    formError = "Add at least one stock row to issue.";
  }

  const seen = new Set<string>();
  let totalIssueQty = 0;

  for (const line of input.lines) {
    if (seen.has(line.inventoryId)) {
      lineErrors[line.inventoryId] = "Duplicate stock row is not allowed.";
      formError = "Remove duplicate stock rows before submitting.";
      continue;
    }
    seen.add(line.inventoryId);

    const stock = input.stockById.get(line.inventoryId);
    if (!stock) {
      lineErrors[line.inventoryId] =
        "Selected stock is no longer available. Refresh and try again.";
      formError = "One or more stock rows are stale.";
      continue;
    }

    if (stock.materialType !== input.material) {
      lineErrors[line.inventoryId] =
        `Stock material (${materialLabel(stock.materialType)}) does not match ${materialLabel(input.material)}.`;
      formError =
        "Incompatible material selected. Choose stock that matches the warehouse tab.";
      continue;
    }

    if (
      input.orderItem &&
      !orderItemMatchesMaterial(input.orderItem.productCategory, input.material)
    ) {
      formError =
        "Selected order item material does not match warehouse stock type.";
    }

    const isDummyOrderItem = Boolean(
      input.orderItem?.id.startsWith("dummy-") ||
        input.order?.id.startsWith("dummy-"),
    );
    if (
      input.orderItem &&
      !isDummyOrderItem &&
      !dimensionsMatch(stock, input.orderItem)
    ) {
      lineErrors[line.inventoryId] =
        "Stock dimensions do not match the selected order item.";
      formError =
        "Dimension mismatch: stock length/width/thickness must match the order item.";
      continue;
    }

    const qty = parseWholeQuantity(line.qtyToIssue);
    if (qty === null) {
      lineErrors[line.inventoryId] = "Enter a positive whole number.";
      continue;
    }
    if (qty <= 0) {
      lineErrors[line.inventoryId] = "Quantity must be greater than zero.";
      continue;
    }
    if (qty > stock.availableQty) {
      lineErrors[line.inventoryId] =
        `Cannot exceed available ${unitForMaterial(input.material).toLowerCase()} (${stock.availableQty}).`;
      continue;
    }

    totalIssueQty += qty;
  }

  if (
    input.orderItem &&
    input.orderItem.remainingQty !== null &&
    totalIssueQty > input.orderItem.remainingQty
  ) {
    formError = `Total issue quantity (${totalIssueQty}) exceeds remaining requirement (${input.orderItem.remainingQty}).`;
  }

  const hasLineErrors = Object.keys(lineErrors).length > 0;
  const hasFieldErrors = Object.keys(fieldErrors).length > 0;

  return {
    ok: !formError && !hasLineErrors && !hasFieldErrors,
    formError,
    lineErrors,
    fieldErrors,
  };
}

export function buildIssueSummaryLines(input: {
  material: IssueStockMaterial;
  stockById: ReadonlyMap<string, IssueStockRow>;
  lines: readonly IssueStockLineDraft[];
}) {
  return input.lines
    .map((line) => {
      const stock = input.stockById.get(line.inventoryId);
      const qty = parseWholeQuantity(line.qtyToIssue) ?? 0;
      if (!stock || qty <= 0) return null;
      const area = calculateIssuedArea({
        availableQty: stock.availableQty,
        availableSqm: stock.availableSqm,
        availableSqf: stock.availableSqf,
        qtyToIssue: qty,
      });
      return {
        inventoryId: stock.id,
        storageSrNo: stock.storageSrNo,
        productionSrNo: stock.productionSrNo,
        palletNo: stock.palletNo,
        batchNo: stock.batchNo,
        itemName: stock.itemName,
        qty,
        unit: unitForMaterial(input.material),
        sqm: area.sqm,
        sqf: area.sqf,
      };
    })
    .filter((row): row is NonNullable<typeof row> => Boolean(row));
}

export function encodePackingSourceRef(input: {
  warehouseIssueId: string;
  inventoryId: string;
  storageSrNo: string;
  productionSrNo: string;
  palletNo: string;
  batchNo: string;
}) {
  return [
    `WHC-ISSUE:${input.warehouseIssueId || "-"}`,
    `INV:${input.inventoryId}`,
    `STG:${input.storageSrNo || "-"}`,
    `PRS:${input.productionSrNo || "-"}`,
    `PAL:${input.palletNo || "-"}`,
    `BATCH:${input.batchNo || "-"}`,
  ].join("|");
}

export function parsePackingSourceRef(sourceRef: string | null | undefined) {
  const raw = String(sourceRef ?? "");
  const read = (key: string) => {
    const match = raw.match(new RegExp(`${key}:([^|]+)`));
    const value = match?.[1]?.trim() ?? "";
    return !value || value === "-" ? "" : value;
  };
  return {
    warehouseIssueId: read("WHC-ISSUE"),
    inventoryId: read("INV"),
    storageSrNo: read("STG"),
    productionSrNo: read("PRS"),
    palletNo: read("PAL"),
    batchNo: read("BATCH"),
  };
}
