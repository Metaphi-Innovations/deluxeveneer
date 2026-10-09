import { issueFactoryWork } from "../shared/factoryIssuedWorkStore";
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
  const availableSheets = selectedOrderItem
    ? getOrderLineItemSheetsNumber(selectedOrderItem)
    : 0;
  const issueSheets = Number(state.issueSheets);
  const hasValidIssueSheets =
    state.issueSheets.length === 0 ||
    (Number.isInteger(issueSheets) && issueSheets > 0 && issueSheets <= availableSheets);

  if (!hasValidIssueSheets) {
    return "invalid";
  }

  const destinationProcess =
    normalizeSplicingOrderType(state.orderType) === "Marquetry" ? "Marquetry" : "Pressing";
  const sourceRow = selectedOrderItem
    ? buildSplicingOrderIssueSourceRow(state, selectedOrder, selectedOrderItem)
    : state.row;

  issueFactoryWork({
    destinationProcess,
    purpose: "ORDER",
    orderNo: state.orderNo,
    orderItemNo: state.orderItemNo,
    sourceRow,
    sourceSlug,
    sourceProcess,
    sourceWarehouseName: getFactoryRowWarehouseName(sourceRow),
  });

  return "issued";
}
