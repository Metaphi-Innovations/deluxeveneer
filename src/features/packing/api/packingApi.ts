import { apiRequest, type ApiResponse } from "../../../lib/apiClient";

const BASE_PATH = "/packing";

export interface PackingApiItem {
  id: string;
  packingId: string | null;
  orderNo: string;
  orderItemNo: string;
  customerName: string;
  orderType: string;
  productCategory: string;
  itemName: string;
  noOfSheets: number;
  length: string;
  width: string;
  thickness: string;
  sqm: string;
  sqf: string;
  ratePerSqf: string;
  amount: string;
  series: string;
  grade: string;
  issuedFrom: string;
  sourceRef: string;
  preparedBy: string;
  checkedBy: string;
  remark: string;
  packingDate: string | null;
  dispatchDate: string | null;
  packingState: "issued" | "done" | "dispatchIssued" | "dispatched" | "reverted";
  createdBy: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedPackingResponse {
  items: PackingApiItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PackingQueryParams {
  tab?: "issued" | "done" | undefined;
  search?: string | undefined;
  page?: number | undefined;
  limit?: number | undefined;
  sortBy?: string | undefined;
  sortOrder?: "asc" | "desc" | undefined;
  filters?: Record<string, string[]> | undefined;
}

export interface OrderNumberDropdownItem {
  id: string;
  orderNo: string;
  orderType: string;
  customerId: string | null;
  customerName: string;
  priority: string;
  items: Array<{
    id: string;
    orderItemNo: string;
    productCategory: string;
    itemName: string;
    salesItemName: string | null;
    length: string | number;
    width: string | number;
    thickness: string | number;
    quantitySheets: number | null;
    noOfLeaves: number | null;
    sqm: string | number;
    totalSqf: string | number;
    ratePerSqf: string | number;
    amount: string | number;
    groupNo: string | null;
    baseType: string | null;
    baseName: string | null;
    baseLength: string | number | null;
    baseWidth: string | number | null;
    baseThickness: string | number | null;
    designCode: string | null;
    structuredCode: string | null;
    remark: string | null;
    status: string;
  }>;
}

export interface CreatePackingPayload {
  packingDate?: string | Date | undefined;
  preparedBy?: string | undefined;
  checkedBy?: string | undefined;
  remark?: string | undefined;
  completeImmediately?: boolean;
  items: Array<{
    orderId?: string | undefined;
    orderNo: string;
    orderItemId?: string | undefined;
    orderItemNo: string;
    customerId?: string | undefined;
    customerName: string;
    orderType?: string | undefined;
    productCategory?: string | undefined;
    issuedFrom?: string | undefined;
    sourceRef?: string | undefined;
    preparedBy?: string | undefined;
    checkedBy?: string | undefined;
    itemId?: string | undefined;
    itemName: string;
    series?: string | undefined;
    gradeId?: string | undefined;
    gradeName?: string | undefined;
    length: number;
    width: number;
    thickness: number;
    noOfSheets: number;
    sqm?: number | undefined;
    sqf?: number | undefined;
    ratePerSqf?: number | undefined;
    amount?: number | undefined;
    baseType?: string | undefined;
    baseName?: string | undefined;
    baseLength?: number | undefined;
    baseWidth?: number | undefined;
    baseThickness?: number | undefined;
    designCode?: string | undefined;
    structuredCode?: string | undefined;
    remark?: string | undefined;
  }>;
}

export interface UpdatePackingPayload {
  packingDate?: string | Date | undefined;
  preparedBy?: string | undefined;
  checkedBy?: string | undefined;
  remark?: string | undefined;
  length?: number | undefined;
  width?: number | undefined;
  thickness?: number | undefined;
  noOfSheets?: number | undefined;
  sqm?: number | undefined;
  sqf?: number | undefined;
  amount?: number | undefined;
  ratePerSqf?: number | undefined;
  packingState?: "issued" | "done" | "dispatchIssued" | "dispatched" | "reverted" | undefined;
}

// ==========================================
// 1. Listing & Filtering APIs
// ==========================================
export async function fetchPackingList(
  params: PackingQueryParams = {}
): Promise<PaginatedPackingResponse> {
  const hasColumnFilters = Boolean(params.filters && Object.keys(params.filters).length > 0);
  const searchTrimmed = params.search?.trim();

  let response: ApiResponse<PaginatedPackingResponse>;

  if (hasColumnFilters) {
    // POST /api/packing/filter with payload
    response = await apiRequest<ApiResponse<PaginatedPackingResponse>>(`${BASE_PATH}/filter`, {
      method: "POST",
      body: {
        tab: params.tab ?? "issued",
        page: params.page ?? 1,
        limit: params.limit ?? 10,
        search: searchTrimmed || undefined,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder ?? "desc",
        filters: params.filters,
      },
    });
  } else {
    // GET /api/packing with query parameters
    const qs = new URLSearchParams();
    qs.set("tab", params.tab ?? "issued");
    qs.set("page", String(params.page ?? 1));
    qs.set("limit", String(params.limit ?? 10));
    if (searchTrimmed) qs.set("search", searchTrimmed);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);

    response = await apiRequest<ApiResponse<PaginatedPackingResponse>>(
      `${BASE_PATH}?${qs.toString()}`,
      { method: "GET" }
    );
  }

  return (
    response.data ?? {
      items: [],
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 1,
    }
  );
}

// ==========================================
// 2. View API
// ==========================================
export async function fetchPackingById(id: string): Promise<PackingApiItem> {
  const response = await apiRequest<ApiResponse<PackingApiItem>>(`${BASE_PATH}/${id}`, {
    method: "GET",
  });
  return response.data;
}

// ==========================================
// 3. Create API
// ==========================================
export async function createPackingApi(
  payload: CreatePackingPayload
): Promise<PackingApiItem[]> {
  const response = await apiRequest<ApiResponse<PackingApiItem[]>>(`${BASE_PATH}`, {
    method: "POST",
    body: payload,
  });
  return response.data;
}

// ==========================================
// 4. Edit API
// ==========================================
export async function updatePackingApi(
  id: string,
  payload: UpdatePackingPayload
): Promise<PackingApiItem> {
  const response = await apiRequest<ApiResponse<PackingApiItem>>(`${BASE_PATH}/${id}`, {
    method: "PATCH",
    body: payload,
  });
  return response.data;
}

// ==========================================
// 5. Dynamic Dropdown API
// ==========================================
export async function fetchPackingColumnDropdown(
  column: string,
  tab: "issued" | "done" = "issued"
): Promise<string[]> {
  const qs = new URLSearchParams();
  qs.set("tab", tab);
  qs.set("column", column);

  const response = await apiRequest<ApiResponse<string[]>>(
    `${BASE_PATH}/dropdowns?${qs.toString()}`,
    { method: "GET" }
  );
  return response.data ?? [];
}

// ==========================================
// 6. Order Number Dropdown API
// ==========================================
export async function fetchPackingOrderNumberDropdown(params: {
  search?: string;
  customerName?: string;
  customerId?: string;
  limit?: number;
} = {}): Promise<OrderNumberDropdownItem[]> {
  const qs = new URLSearchParams();
  if (params.search?.trim()) qs.set("search", params.search.trim());
  if (params.customerName?.trim()) qs.set("customerName", params.customerName.trim());
  if (params.customerId) qs.set("customerId", params.customerId);
  if (params.limit) qs.set("limit", String(params.limit));

  const response = await apiRequest<ApiResponse<OrderNumberDropdownItem[]>>(
    `${BASE_PATH}/order-numbers?${qs.toString()}`,
    { method: "GET" }
  );
  return response.data ?? [];
}

// ==========================================
// 7. Export API
// ==========================================
export async function exportPackingApi(
  params: Omit<PackingQueryParams, "page" | "limit"> = {}
): Promise<PackingApiItem[]> {
  const hasColumnFilters = Boolean(params.filters && Object.keys(params.filters).length > 0);
  const searchTrimmed = params.search?.trim();

  let response: ApiResponse<PackingApiItem[]>;

  if (hasColumnFilters) {
    response = await apiRequest<ApiResponse<PackingApiItem[]>>(`${BASE_PATH}/export`, {
      method: "POST",
      body: {
        tab: params.tab ?? "issued",
        search: searchTrimmed || undefined,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder ?? "desc",
        filters: params.filters,
      },
    });
  } else {
    const qs = new URLSearchParams();
    qs.set("tab", params.tab ?? "issued");
    if (searchTrimmed) qs.set("search", searchTrimmed);
    if (params.sortBy) qs.set("sortBy", params.sortBy);
    if (params.sortOrder) qs.set("sortOrder", params.sortOrder);

    response = await apiRequest<ApiResponse<PackingApiItem[]>>(
      `${BASE_PATH}/export?${qs.toString()}`,
      { method: "GET" }
    );
  }

  return response.data ?? [];
}

