import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

export interface ProductionInventoryItem {
  id: string;
  productionSrNo?: string | null | undefined;
  storageSrNo?: string | null | undefined;
  inwardDate: string | Date;
  inwardItemCode?: string | null | undefined;
  factoryCode?: string | null | undefined;
  itemName: string;
  subCategory: string;
  color?: string | undefined;
  mdfType?: string | undefined;
  length: string | number;
  width: string | number;
  thickness: string | number;
  noOfLeaves?: string | number | undefined;
  noOfSheets?: string | number | undefined;
  totalNoOfSheets?: string | number | undefined;
  receivedQuantity?: string | number | undefined;
  availableQuantity?: string | number | undefined;
  sqm: string | number;
  totalSqm?: string | number | undefined;
  sqf: string | number;
  totalSqf?: string | number | undefined;
  grade?: string | undefined;
  currency?: string | undefined;
  amount: string | number;
  totalAmount?: string | number | undefined;
  remark?: string | undefined;
  createdBy?: string | null | undefined;
  updatedBy?: string | null | undefined;
  inventorySlug?: string | undefined;
  inventoryRecordId?: string | undefined;
  [key: string]: unknown;
}

export interface ProductionWarehouseFetchParams {
  warehouseId?: string | undefined;
  tab: "raw-veneer" | "plywood" | "mdf" | "consumables" | "sample-sheets" | "sawing";
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  filters?: Record<string, string[]> | undefined;
}

export interface ProductionInventoryResponse {
  items: ProductionInventoryItem[];
  total: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export async function fetchProductionWarehouseInventory(
  params: ProductionWarehouseFetchParams,
): Promise<ProductionInventoryResponse | null> {
  try {
    const query = new URLSearchParams();
    if (params.warehouseId) query.append("warehouseId", params.warehouseId);
    if (params.tab) query.append("tab", params.tab);
    if (params.search) query.append("search", params.search);
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.limit !== undefined) query.append("limit", String(params.limit));
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);
    if (params.filters && Object.keys(params.filters).length > 0) {
      query.append("filters", JSON.stringify(params.filters));
    }

    const res = await apiRequest<ApiResponse<ProductionInventoryResponse>>(
      `/warehouse/production/inventory?${query.toString()}`,
      { method: "GET" },
    );

    if (res?.success && res.data) {
      return res.data;
    }
  } catch {
    // Backend unavailable — return null so callers show an empty list.
  }
  return null;
}

export async function fetchProductionColumnDropdown(params: {
  warehouseId: string;
  tab: "raw-veneer" | "plywood" | "mdf" | "consumables" | "sample-sheets" | "sawing";
  column: string;
}): Promise<{ options: Array<{ value: string; label: string }> }> {
  const query = new URLSearchParams();
  query.append("warehouseId", params.warehouseId);
  query.append("tab", params.tab);
  query.append("column", params.column);

  const res = await apiRequest<
    ApiResponse<{ options: Array<{ value: string; label: string }> }>
  >(`/warehouse/production/inventory/dropdowns?${query.toString()}`, {
    method: "GET",
  });

  return res.data ?? { options: [] };
}

export async function exportProductionInventoryApi(params: {
  warehouseId: string;
  tab: "raw-veneer" | "plywood" | "mdf" | "consumables";
  search?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  filters?: Record<string, string[]> | undefined;
}): Promise<ProductionInventoryItem[]> {
  const query = new URLSearchParams();
  query.append("warehouseId", params.warehouseId);
  query.append("tab", params.tab);
  if (params.search?.trim()) query.append("search", params.search.trim());
  if (params.sortBy) query.append("sortBy", params.sortBy);
  if (params.sortOrder) query.append("sortOrder", params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.append("filters", JSON.stringify(params.filters));
  }

  const res = await apiRequest<
    ApiResponse<{ items: ProductionInventoryItem[] }>
  >(`/warehouse/production/inventory/export?${query.toString()}`, {
    method: "GET",
  });

  return res.data?.items ?? [];
}

export async function fetchProductionInventoryById(
  id: string,
): Promise<ProductionInventoryItem> {
  const res = await apiRequest<ApiResponse<ProductionInventoryItem>>(
    `/warehouse/production/inventory/${id}`,
    { method: "GET" },
  );
  return res.data;
}

export async function updateProductionInventoryApi(
  id: string,
  body: { remark?: string | null },
): Promise<ProductionInventoryItem> {
  const res = await apiRequest<ApiResponse<ProductionInventoryItem>>(
    `/warehouse/production/inventory/${id}`,
    { method: "PATCH", body },
  );
  return res.data;
}

export async function issueOrderToProduction(payload: {
  orderNo: string;
  orderItemNo: string;
  warehouseId?: string | undefined;
  inventoryType?: string | undefined;
}) {
  return await apiRequest<ApiResponse<any>>(`/warehouse/production/issue-order`, {
    method: "POST",
    body: payload,
  });
}

export type BoardMaterialType = "PLYWOOD" | "MDF";

export interface BoardIssueEligibleInventoryItem {
  id: string;
  productionSrNo: string | null;
  storageSrNo: string | null;
  palletNo: string | null;
  itemName: string;
  subCategory: string;
  color?: string;
  mdfType?: string;
  length: string;
  width: string;
  thickness: string;
  availableSheets: number;
  availableSqm: number;
  availableSqf: number;
  grade?: string | null;
  factoryCode?: string | null;
  inwardItemCode?: string | null;
}

export interface BoardIssueOrderContext {
  orderId: string;
  orderNo: string;
  orderItemId: string;
  orderItemNo: string;
  productCategory: string;
  itemName: string;
  orderedSheets: number;
  previouslyIssuedSheets: number;
  remainingRequirementSheets: number | null;
  length: string;
  width: string;
  thickness: string;
  sqm: number;
  totalSqf: number;
}

export interface BoardIssueOrderResult {
  id: string;
  orderNo: string;
  orderItemNo: string;
  orderId: string;
  orderItemId: string;
  inventoryId: string;
  materialType: BoardMaterialType;
  issuedSheets: number;
  issuedSqm: number;
  issuedSqf: number;
  remainingInventorySheets: number;
  issuedDate: string;
}

export async function fetchBoardIssueEligibleInventory(params: {
  warehouseId: string;
  materialType: BoardMaterialType;
  search?: string;
}): Promise<BoardIssueEligibleInventoryItem[]> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  query.set("materialType", params.materialType);
  if (params.search?.trim()) {
    query.set("search", params.search.trim());
  }
  const res = await apiRequest<
    ApiResponse<{ items: BoardIssueEligibleInventoryItem[] }>
  >(`/warehouse/production/issue-order/board/inventory?${query.toString()}`, {
    method: "GET",
  });
  return res.data?.items ?? [];
}

export async function fetchBoardIssueOrderContext(params: {
  warehouseId: string;
  materialType: BoardMaterialType;
  orderId: string;
  orderItemId: string;
}): Promise<BoardIssueOrderContext> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  query.set("materialType", params.materialType);
  query.set("orderId", params.orderId);
  query.set("orderItemId", params.orderItemId);
  const res = await apiRequest<ApiResponse<BoardIssueOrderContext>>(
    `/warehouse/production/issue-order/board/context?${query.toString()}`,
    { method: "GET" },
  );
  if (!res.data) {
    throw new Error(res.message || "Failed to load order issue context.");
  }
  return res.data;
}

export async function issueBoardOrderToProduction(payload: {
  warehouseId: string;
  materialType: BoardMaterialType;
  orderId: string;
  orderItemId: string;
  inventoryId: string;
  issueSheets: number;
  remarks?: string | null;
}): Promise<BoardIssueOrderResult> {
  const res = await apiRequest<ApiResponse<BoardIssueOrderResult>>(
    `/warehouse/production/issue-order/board`,
    { method: "POST", body: payload },
  );
  if (!res.data) {
    throw new Error(res.message || "Failed to issue stock to order.");
  }
  return res.data;
}

export function getBoardIssueToOrderPath(input: {
  warehouseId: string;
  materialType: "plywood" | "mdf";
}): string {
  return `/warehouses/${input.warehouseId}/issue-order/${input.materialType}`;
}

export function boardMaterialTypeFromSlug(
  slug: string,
): BoardMaterialType | null {
  const normalized = slug.trim().toLowerCase();
  if (normalized === "plywood") return "PLYWOOD";
  if (normalized === "mdf") return "MDF";
  return null;
}

export interface ProductionKpiData {
  totalStock: { count: number; secondary: number };
  receivedToday: { count: number; secondary: number };
  outToday?: { count: number; secondary: number };
  issueMarquetry?: { count: number; secondary: number };
  issueGrouping?: { count: number; secondary: number };
  sawingIn?: { count: number; secondary: number };
  sawingIssued?: { count: number; secondary: number };
}

export async function fetchProductionKpisApi(params: {
  warehouseId: string;
  tab: string;
}): Promise<ProductionKpiData> {
  const query = new URLSearchParams();
  query.set("warehouseId", params.warehouseId);
  query.set("tab", params.tab);

  const res = await apiRequest<ApiResponse<ProductionKpiData>>(
    `/warehouse/production/inventory/kpi?${query.toString()}`,
    { method: "GET" }
  );

  return res.data;
}
