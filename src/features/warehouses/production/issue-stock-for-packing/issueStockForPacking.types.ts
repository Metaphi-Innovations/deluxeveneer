export type IssueStockMaterial = "raw-veneer" | "plywood" | "mdf" | "sawing";

export type IssueStockUnit = "Leaves" | "Sheets" | "Pieces" | "CBM";

export interface IssueStockRow {
  id: string;
  storageSrNo: string;
  productionSrNo: string;
  palletNo: string;
  batchNo: string;
  itemName: string;
  subCategory: string;
  materialType: IssueStockMaterial;
  grade: string;
  color: string;
  length: string;
  width: string;
  thickness: string;
  receivedQty: number;
  availableQty: number;
  availableSqm: number;
  availableSqf: number;
}

export interface IssueStockOrderOption {
  id: string;
  orderNo: string;
  orderDate: string;
  deliveryDate: string;
  customerName: string;
  customerId?: string;
  status: string;
  orderType: string;
  items: IssueStockOrderItemOption[];
}

export interface IssueStockOrderItemOption {
  id: string;
  orderItemNo: string;
  productCategory: string;
  itemName: string;
  grade: string;
  length: string;
  width: string;
  thickness: string;
  orderedQty: number;
  previouslyIssuedQty: number;
  remainingQty: number | null;
  sqm: number;
  sqf: number;
}

export interface IssueStockLineDraft {
  inventoryId: string;
  qtyToIssue: string;
}

export interface IssueStockFormState {
  issueDate: string;
  remark: string;
  orderId: string;
  orderItemId: string;
  lines: IssueStockLineDraft[];
}

export interface IssueStockValidationResult {
  ok: boolean;
  formError: string;
  lineErrors: Record<string, string>;
  fieldErrors: {
    orderId?: string;
    orderItemId?: string;
    issueDate?: string;
  };
}
