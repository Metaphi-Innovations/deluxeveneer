import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

export interface ProductionInventoryItem {
  id: string;
  productionSrNo?: string | null | undefined;
  storageSrNo?: string | null | undefined;
  inwardDate: string | Date;
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
  sqm: string | number;
  totalSqm?: string | number | undefined;
  sqf: string | number;
  totalSqf?: string | number | undefined;
  grade?: string | undefined;
  currency?: string | undefined;
  amount: string | number;
  totalAmount?: string | number | undefined;
  remark?: string | undefined;
  updatedBy?: string | null | undefined;
  inventorySlug?: string | undefined;
  inventoryRecordId?: string | undefined;
  [key: string]: unknown;
}

export interface ProductionWarehouseFetchParams {
  warehouseId?: string | undefined;
  tab: "raw-veneer" | "plywood" | "mdf" | "sample-sheets";
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
  tab: "raw-veneer" | "plywood" | "mdf" | "sample-sheets";
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
  tab: "raw-veneer" | "plywood" | "mdf";
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
