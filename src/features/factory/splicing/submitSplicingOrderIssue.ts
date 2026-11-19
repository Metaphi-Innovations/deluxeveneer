import {
  completeFactoryIssuedWork,
  issueFactoryWork,
  updateFactoryIssuedWorkSnapshot,
} from "../shared/factoryIssuedWorkStore";
import { formatSQF, formatSQM, parseNumericValue, SQM_TO_SQF } from "../../shared/numberFormat";
import {
  buildSplicingOrderIssueSourceRow,
  getFactoryRowWarehouseName,
  getOrderLineItemSheetsNumber,
  getSplicingSelectedOrder,
  getSplicingSelectedOrderItem,
  normalizeSplicingOrderType,
  type SplicingOrderIssueState,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";
import type { OrderRecord } from "../../orders/shared/ordersStore";

export function submitSplicingOrderIssue<Row extends FactoryRecord>({
  orderRecords,
  sourceProcess,
  sourceSlug,
  state,
}: {
  orderRecords: readonly OrderRecord[];
  sourceProcess: string;
  sourceSlug: string;
  state: SplicingOrderIssueState<Row>;
}): "invalid" | "issued" {
  const selectedOrder = getSplicingSelectedOrder(orderRecords, state.orderNo);
  const selectedOrderItem = getSplicingSelectedOrderItem(orderRecords, state);
  const orderAvailableSheets = selectedOrderItem
    ? getOrderLineItemSheetsNumber(selectedOrderItem)
    : 0;
  const sourceAvailableSheets = Math.max(
    0,
    Math.floor(
      parseNumericValue(
        state.row.availableNoOfLeaves ??
          state.row.availableSheets ??
          state.row.noOfSheets ??
          state.row.noOfLeaves,
      ) ?? 0,
    ),
  );
  const issueSheets = Number(state.issueSheets);
  const hasValidIssueSheets =
    state.issueSheets.length > 0 &&
    Number.isInteger(issueSheets) &&
    issueSheets > 0 &&
    issueSheets <= Math.min(orderAvailableSheets, sourceAvailableSheets);

  if (!hasValidIssueSheets) {
    return "invalid";
  }

  let destinationProcess =
    normalizeSplicingOrderType(state.orderType) === "Marquetry" ? "Marquetry" : "Pressing";
  if (sourceSlug === "finishing" || sourceProcess.toLowerCase().includes("finishing")) {
    destinationProcess = "Packing";
  }

  const builtSourceRow = selectedOrderItem
    ? buildSplicingOrderIssueSourceRow(state, selectedOrder, selectedOrderItem)
    : state.row;
  const receivedSheets = Math.max(
    sourceAvailableSheets,
    Math.floor(
      parseNumericValue(
        state.row.receivedNoOfLeaves ?? state.row.noOfSheets ?? state.row.noOfLeaves,
      ) ?? 0,
    ),
  );
  const sourceSqm = parseNumericValue(state.row.sqm) ?? 0;
  const issuedSqm = receivedSheets > 0 ? (sourceSqm * issueSheets) / receivedSheets : 0;
  const productType = String(
    builtSourceRow.productType ||
      builtSourceRow.finishedType ||
      builtSourceRow.orderType ||
      state.orderType ||
      "",
  ).trim();
  const sourceRow = {
    ...builtSourceRow,
    itemName: state.row.itemName || state.row.productName,
    itemSubCategory: state.row.itemSubCategory || state.row.subCategory,
    subCategory: state.row.subCategory || state.row.itemSubCategory,
    productName: state.row.productName || state.row.itemName,
    length: state.row.length,
    width: state.row.width,
    thickness: state.row.thickness || state.row.height,
    height: state.row.height || state.row.thickness,
    noOfLeaves: String(issueSheets),
    noOfSheets: String(issueSheets),
    issuedLeafCount: String(issueSheets),
    receivedNoOfLeaves: String(issueSheets),
    availableNoOfLeaves: String(issueSheets),
    sourceAvailableLeaves: String(issueSheets),
    ...(productType
      ? {
          productType,
          finishedType: productType,
          orderType: productType,
          issuedFor: productType,
          issuePurpose: "Order",
          purpose: "ORDER",
          for: "Order",
          forLabel: "Order",
        }
      : {}),
    sqm: issuedSqm > 0 ? formatSQM(issuedSqm) : state.row.sqm,
    sqf: issuedSqm > 0 ? formatSQF(issuedSqm * SQM_TO_SQF) : state.row.sqf,
  } as Row;
  const { workItemId: _sourceWorkItemId, ...downstreamSourceRow } = sourceRow;

  issueFactoryWork({
    destinationProcess,
    purpose: "ORDER",
    orderNo: state.orderNo,
    orderItemNo: state.orderItemNo,
    sourceRow: downstreamSourceRow as Row,
    sourceSlug,
    sourceProcess,
    sourceWarehouseName: getFactoryRowWarehouseName(sourceRow),
  });

  const sourceWorkItemId =
    typeof state.row.workItemId === "string" && state.row.workItemId
      ? state.row.workItemId
      : String(state.row.id).startsWith("factory-work-")
        ? String(state.row.id)
        : "";
  if (sourceWorkItemId) {
    const remainingSheets = Math.max(0, sourceAvailableSheets - issueSheets);
    updateFactoryIssuedWorkSnapshot(sourceWorkItemId, {
      availableNoOfLeaves: String(remainingSheets),
      availableSheets: String(remainingSheets),
      sourceAvailableLeaves: String(remainingSheets),
    });
  } else {
    const remainingSheets = Math.max(0, sourceAvailableSheets - issueSheets);
    if (remainingSheets > 0) {
      const remainingSqm =
        receivedSheets > 0 ? (sourceSqm * remainingSheets) / receivedSheets : 0;
      const remainingRow = {
        ...state.row,
        id: `splicing-done-balance-${state.row.id}-${Date.now()}`,
        noOfLeaves: String(remainingSheets),
        noOfSheets: String(remainingSheets),
        issuedLeafCount: String(remainingSheets),
        receivedNoOfLeaves: String(remainingSheets),
        availableNoOfLeaves: String(remainingSheets),
        sourceAvailableLeaves: String(remainingSheets),
        sqm: remainingSqm > 0 ? formatSQM(remainingSqm) : state.row.sqm,
        sqf:
          remainingSqm > 0
            ? formatSQF(remainingSqm * SQM_TO_SQF)
            : state.row.sqf,
      } as Row;
      const replacement = issueFactoryWork({
        destinationProcess: "Splicing",
        sourceProcess: "Splicing",
        sourceRow: remainingRow,
        sourceSlug: "splicing",
      });
      completeFactoryIssuedWork(replacement.id, remainingRow);
    }
  }

  return "issued";
}

