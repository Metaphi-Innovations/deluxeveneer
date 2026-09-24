import { apiRequest, type ApiResponse } from "../../../../lib/apiClient";

export interface ProductionInventoryItem {
  id: string;
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
  remark?: string | undefined;
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
}

export interface ProductionInventoryResponse {
  items: ProductionInventoryItem[];
  total: number;
  page?: number;
  limit?: number;
}

export async function fetchProductionWarehouseInventory(params: ProductionWarehouseFetchParams): Promise<ProductionInventoryResponse | null> {
  try {
    const query = new URLSearchParams();
    if (params.warehouseId) query.append("warehouseId", params.warehouseId);
    if (params.tab) query.append("tab", params.tab);
    if (params.search) query.append("search", params.search);
    if (params.page !== undefined) query.append("page", String(params.page));
    if (params.limit !== undefined) query.append("limit", String(params.limit));
    if (params.sortBy) query.append("sortBy", params.sortBy);
    if (params.sortOrder) query.append("sortOrder", params.sortOrder);

    const res = await apiRequest<ApiResponse<ProductionInventoryResponse>>(
      `/warehouse/production/inventory?${query.toString()}`,
      { method: "GET" }
    );

    if (res?.success && res.data) {
      return res.data;
    }
  } catch {
    // Backend unavailable — return null so callers show an empty list.
  }
  return null;
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
