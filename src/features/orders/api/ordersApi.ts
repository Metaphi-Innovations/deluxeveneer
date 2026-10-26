import { apiRequest, type ApiResponse } from '../../../lib/apiClient';
import type { OrderDraft, OrderLineItem, OrderRecord } from '../shared/ordersStore';

export interface BackendOrderItem {
  id: string;
  orderId: string;
  orderItemNo: string;
  productCategory: string;
  itemId: string | null;
  itemName: string;
  salesItemName: string | null;
  subCategory: string | null;
  series: string | null;
  gradeId: string | null;
  gradeName: string | null;
  length: string | number;
  width: string | number;
  thickness: string | number;
  quantitySheets: number | null;
  noOfLeaves: number | null;
  logNo: string | null;
  batchNo: string | null;
  cbm: string | number | null;
  cbf: string | number | null;
  ratePerCbm: string | number | null;
  groupNo: string | null;
  photoNo: string | null;
  sqm: string | number;
  totalSqf: string | number;
  ratePerSqf: string | number;
  amount: string | number;
  baseType: string | null;
  baseName: string | null;
  baseLength: string | number | null;
  baseWidth: string | number | null;
  baseThickness: string | number | null;
  designCode: string | null;
  structuredCode: string | null;
  status: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BackendOrder {
  id: string;
  orderNo: string;
  orderDate: string;
  requiredDeliveryDate: string;
  customerId: string | null;
  customerName: string;
  orderType: string;
  priority: string;
  status: string;
  salesCoordinator: string | null;
  totalSheets: number | null;
  totalSqm: string | number | null;
  totalSqf: string | number | null;
  totalAmount: string | number | null;
  remark: string | null;
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    customerName: string;
    companyName: string;
    customerType: string;
    email: string;
    phoneNumber: string;
  } | null;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  updatedBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  } | null;
  items: BackendOrderItem[];
}

export interface CreateOrderPayload {
  orderNo?: string | undefined;
  orderDate?: string | Date | undefined;
  requiredDeliveryDate?: string | Date | undefined;
  customerId?: string | undefined;
  customerName?: string | undefined;
  orderType?: string | undefined;
  priority?: string | undefined;
  salesCoordinator?: string | undefined;
  remark?: string | undefined;
  lineItems?: Array<{
    id?: string | undefined;
    orderItemNo?: string | undefined;
    productCategory: string;
    itemId?: string | undefined;
    itemName: string;
    salesItemName?: string | undefined;
    subCategory?: string | undefined;
    series?: string | undefined;
    gradeId?: string | undefined;
    grade?: string | undefined;
    gradeName?: string | undefined;
    length: number | string;
    width: number | string;
    thickness: number | string;
    quantitySheets?: number | string | undefined;
    noOfLeaves?: number | string | undefined;
    logNo?: string | undefined;
    batchNo?: string | undefined;
    cbm?: number | string | undefined;
    cbf?: number | string | undefined;
    ratePerCbm?: number | string | undefined;
    groupNo?: string | undefined;
    photoNo?: string | undefined;
    sqm: number | string;
    totalSqm: number | string;
    ratePerSqf: number | string;
    amount: number | string;
    baseType?: string | undefined;
    baseName?: string | undefined;
    baseLength?: number | string | undefined;
    baseWidth?: number | string | undefined;
    baseThickness?: number | string | undefined;
    designCode?: string | undefined;
    structuredCode?: string | undefined;
    remark?: string | undefined;
  }> | undefined;
}

export function mapBackendOrderToOrderRecord(backendOrder: BackendOrder): {
  record: OrderRecord;
  lineItems: OrderLineItem[];
} {
  const lineItems: OrderLineItem[] = (backendOrder.items || []).map((item) => ({
    id: item.id,
    productCategory: item.productCategory,
    finishedType: item.productCategory,
    salesItemName: item.salesItemName || '',
    itemName: item.itemName,
    subCategory: item.subCategory || '',
    series: item.series || '',
    grade: item.gradeName || '',
    length: String(item.length),
    width: String(item.width),
    thickness: String(item.thickness),
    quantitySheets: String(item.quantitySheets ?? 0),
    noOfLeaves: item.noOfLeaves !== null && item.noOfLeaves !== undefined ? String(item.noOfLeaves) : undefined,
    groupNo: item.groupNo ?? undefined,
    photoNo: item.photoNo ?? undefined,
    logNo: item.logNo ?? undefined,
    batchNo: item.batchNo ?? undefined,
    cbm: item.cbm !== null && item.cbm !== undefined ? String(item.cbm) : undefined,
    cbf: item.cbf !== null && item.cbf !== undefined ? String(item.cbf) : undefined,
    ratePerCbm: item.ratePerCbm !== null && item.ratePerCbm !== undefined ? String(item.ratePerCbm) : undefined,
    sqm: String(item.sqm),
    totalSqm: String(item.totalSqf),
    ratePerSqf: String(item.ratePerSqf),
    baseType: item.baseType || '',
    baseName: item.baseName || '',
    baseLength: item.baseLength !== null && item.baseLength !== undefined ? String(item.baseLength) : '',
    baseWidth: item.baseWidth !== null && item.baseWidth !== undefined ? String(item.baseWidth) : '',
    baseThickness: item.baseThickness !== null && item.baseThickness !== undefined ? String(item.baseThickness) : '',
    amount: String(item.amount),
    designCode: item.designCode ?? undefined,
    structuredCode: item.structuredCode ?? undefined,
    remark: item.remark || '',
  }));

  const firstItem = lineItems[0];
  const createdByName = backendOrder.createdBy
    ? `${backendOrder.createdBy.firstName} ${backendOrder.createdBy.lastName}`.trim()
    : 'System';
  const updatedByName = backendOrder.updatedBy
    ? `${backendOrder.updatedBy.firstName} ${backendOrder.updatedBy.lastName}`.trim()
    : createdByName;

  const record: OrderRecord = {
    id: backendOrder.id,
    orderNo: backendOrder.orderNo,
    orderDate: new Date(backendOrder.orderDate),
    deliveryDate: new Date(backendOrder.requiredDeliveryDate),
    customerName: backendOrder.customerName,
    orderType: backendOrder.orderType,
    priority: backendOrder.priority === 'URGENT' ? 'Urgent' : 'Standard',
    status: backendOrder.status === 'DRAFT' ? 'Draft' : backendOrder.status,
    salesCoordinator: backendOrder.salesCoordinator || 'Aarav Bansal',
    productCategory: firstItem?.productCategory || 'Raw Veneer',
    itemName: firstItem?.itemName || '',
    subCategory: firstItem?.subCategory || '',
    series: firstItem?.series || '',
    grade: firstItem?.grade || '',
    length: firstItem?.length || '',
    width: firstItem?.width || '',
    thickness: firstItem?.thickness || '',
    quantitySheets: String(backendOrder.totalSheets ?? firstItem?.quantitySheets ?? 0),
    sqm: String(backendOrder.totalSqm ?? firstItem?.sqm ?? 0),
    totalSqm: String(backendOrder.totalSqf ?? firstItem?.totalSqm ?? 0),
    amount: String(backendOrder.totalAmount ?? firstItem?.amount ?? 0),
    remark: backendOrder.remark || '',
    createdBy: createdByName,
    updatedBy: updatedByName,
    createdDate: new Date(backendOrder.createdAt),
    updatedDate: new Date(backendOrder.updatedAt),
  };

  return { record, lineItems };
}

export async function createOrderApi(payload: Partial<OrderDraft>): Promise<BackendOrder> {
  const requestBody: CreateOrderPayload = {
    orderNo: payload.orderNo,
    orderDate: payload.orderDate instanceof Date ? payload.orderDate.toISOString() : new Date().toISOString(),
    requiredDeliveryDate: payload.deliveryDate instanceof Date ? payload.deliveryDate.toISOString() : new Date().toISOString(),
    customerName: String(payload.customerName || '').trim(),
    orderType: payload.orderType || 'Order',
    priority: payload.priority || 'Standard',
    salesCoordinator: payload.salesCoordinator,
    remark: payload.remark,
    lineItems: (payload.lineItems || []).map((item) => ({
      orderItemNo: item.id?.startsWith('order-line-item-') ? undefined : undefined,
      productCategory: item.productCategory || item.finishedType || 'Raw Veneer',
      itemName: item.itemName,
      salesItemName: item.salesItemName,
      subCategory: item.subCategory,
      series: item.series,
      grade: item.grade,
      length: item.length,
      width: item.width,
      thickness: item.thickness,
      quantitySheets: item.quantitySheets,
      noOfLeaves: item.noOfLeaves,
      logNo: item.logNo,
      batchNo: item.batchNo,
      cbm: item.cbm,
      cbf: item.cbf,
      ratePerCbm: item.ratePerCbm,
      groupNo: item.groupNo,
      photoNo: item.photoNo,
      sqm: item.sqm,
      totalSqm: item.totalSqm,
      ratePerSqf: item.ratePerSqf,
      amount: item.amount,
      baseType: item.baseType,
      baseName: item.baseName,
      baseLength: item.baseLength,
      baseWidth: item.baseWidth,
      baseThickness: item.baseThickness,
      designCode: item.designCode,
      structuredCode: item.structuredCode,
      remark: item.remark,
    })),
  };

  const response = await apiRequest<ApiResponse<BackendOrder>>('/orders', {
    method: 'POST',
    body: requestBody,
  });

  if (!response?.success || !response.data) {
    throw new Error(response?.message || 'Failed to create order on server.');
  }

  return response.data;
}

const inFlightOrderById = new Map<string, Promise<BackendOrder>>();

export async function fetchOrderByIdApi(id: string): Promise<BackendOrder> {
  const existingPromise = inFlightOrderById.get(id);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = apiRequest<ApiResponse<BackendOrder>>(`/orders/${id}`, {
    method: 'GET',
  })
    .then((response) => {
      if (!response?.success || !response.data) {
        throw new Error(response?.message || 'Failed to fetch order details from server.');
      }
      return response.data;
    })
    .finally(() => {
      inFlightOrderById.delete(id);
    });

  inFlightOrderById.set(id, promise);
  return promise;
}

export async function updateOrderApi(
  id: string,
  payload: Partial<OrderDraft>
): Promise<BackendOrder> {
  const requestBody: Partial<CreateOrderPayload> = {
    orderNo: payload.orderNo,
    orderDate: payload.orderDate instanceof Date ? payload.orderDate.toISOString() : undefined,
    requiredDeliveryDate: payload.deliveryDate instanceof Date ? payload.deliveryDate.toISOString() : undefined,
    customerName: payload.customerName ? String(payload.customerName).trim() : undefined,
    orderType: payload.orderType,
    priority: payload.priority,
    salesCoordinator: payload.salesCoordinator,
    remark: payload.remark,
    lineItems: payload.lineItems
      ? payload.lineItems.map((item) => ({
          id: item.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(item.id)
            ? item.id
            : undefined,
          productCategory: item.productCategory || item.finishedType || 'Raw Veneer',
          itemName: item.itemName,
          salesItemName: item.salesItemName,
          subCategory: item.subCategory,
          series: item.series,
          grade: item.grade,
          length: item.length,
          width: item.width,
          thickness: item.thickness,
          quantitySheets: item.quantitySheets,
          noOfLeaves: item.noOfLeaves,
          logNo: item.logNo,
          batchNo: item.batchNo,
          cbm: item.cbm,
          cbf: item.cbf,
          ratePerCbm: item.ratePerCbm,
          groupNo: item.groupNo,
          photoNo: item.photoNo,
          sqm: item.sqm,
          totalSqm: item.totalSqm,
          ratePerSqf: item.ratePerSqf,
          amount: item.amount,
          baseType: item.baseType,
          baseName: item.baseName,
          baseLength: item.baseLength,
          baseWidth: item.baseWidth,
          baseThickness: item.baseThickness,
          designCode: item.designCode,
          structuredCode: item.structuredCode,
          remark: item.remark,
        }))
      : undefined,
  };

  const response = await apiRequest<ApiResponse<BackendOrder>>(`/orders/${id}`, {
    method: 'PATCH',
    body: requestBody,
  });

  if (!response?.success || !response.data) {
    throw new Error(response?.message || 'Failed to update order on server.');
  }

  return response.data;
}

export interface OrderDropdownOption {
  id: string;
  label: string;
  name?: string;
  customerName?: string;
  companyName?: string;
  customerType?: string;
  email?: string;
  phoneNumber?: string;
  gstNo?: string;
  panNo?: string;
  pincode?: string;
  country?: string;
  state?: string;
  city?: string;
  remark?: string;
  category?: string;
  subCategory?: string;
  categoryName?: string;
}

export interface OrderDropdownsResponse {
  customers: OrderDropdownOption[];
  items: OrderDropdownOption[];
  grades: OrderDropdownOption[];
  categories: OrderDropdownOption[];
  subCategories: OrderDropdownOption[];
  productTypes: string[];
}

/**
 * Cancel an order via backend API
 */
export async function cancelOrderApi(id: string, reason?: string): Promise<BackendOrder> {
  const response = await apiRequest<ApiResponse<BackendOrder>>(`/orders/${id}/cancel`, {
    method: 'POST',
    body: { reason: reason || 'Cancelled by user' },
  });

  if (!response?.success || !response.data) {
    throw new Error(response?.message || 'Failed to cancel order on server.');
  }

  return response.data;
}

let cachedOrderDropdowns: OrderDropdownsResponse | null = null;
let inFlightDropdownsPromise: Promise<OrderDropdownsResponse> | null = null;

/**
 * Fetch dynamic dropdown options for Orders module with caching & request deduplication
 */
export async function fetchOrderDropdownsApi(params?: {
  search?: string;
  category?: string;
  subCategory?: string;
  productType?: string;
  limit?: number;
}): Promise<OrderDropdownsResponse> {
  const isDefaultParams = !params?.search && !params?.category && !params?.subCategory && !params?.productType;

  // If asking for default general dropdowns and already cached, return immediately
  if (isDefaultParams && cachedOrderDropdowns) {
    return cachedOrderDropdowns;
  }

  // If a request for default dropdowns is already in flight, reuse it
  if (isDefaultParams && inFlightDropdownsPromise) {
    return inFlightDropdownsPromise;
  }

  const query = new URLSearchParams();
  if (params?.search) query.set('search', params.search);
  if (params?.category) query.set('category', params.category);
  if (params?.subCategory) query.set('subCategory', params.subCategory);
  if (params?.productType) query.set('productType', params.productType);
  query.set('limit', String(params?.limit || 500));

  const qs = query.toString();
  const endpoint = qs ? `/orders/dropdowns?${qs}` : '/orders/dropdowns';

  const fetchPromise = apiRequest<ApiResponse<OrderDropdownsResponse>>(endpoint)
    .then((response) => {
      if (!response?.success || !response.data) {
        throw new Error(response?.message || 'Failed to load order dropdowns.');
      }
      if (isDefaultParams) {
        cachedOrderDropdowns = response.data;
      }
      return response.data;
    })
    .finally(() => {
      if (isDefaultParams) {
        inFlightDropdownsPromise = null;
      }
    });

  if (isDefaultParams) {
    inFlightDropdownsPromise = fetchPromise;
  }

  return fetchPromise;
}

export interface OrderListQueryParams {
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  status?: string | undefined;
  priority?: string | undefined;
  orderType?: string | undefined;
  productType?: string | undefined;
  customerName?: string | undefined;
  dateFrom?: string | undefined;
  dateTo?: string | undefined;
  sortBy?: string | undefined;
  sortOrder?: 'asc' | 'desc' | 'latest' | undefined;
  filters?: Record<string, string[]> | undefined;
}

export interface PaginatedOrdersResponse {
  items: BackendOrder[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Fetch orders list from server with search, filters, pagination, and sorting
 */
export async function fetchOrdersPaginatedApi(
  params: OrderListQueryParams = {}
): Promise<PaginatedOrdersResponse> {
  const query = new URLSearchParams();
  if (params.page) query.set('page', String(params.page));
  if (params.limit) query.set('limit', String(params.limit));
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.orderType) query.set('orderType', params.orderType);
  if (params.productType) query.set('productType', params.productType);
  if (params.customerName) query.set('customerName', params.customerName);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set('filters', encodeURIComponent(JSON.stringify(params.filters)));
  }

  const qs = query.toString();
  const endpoint = qs ? `/orders?${qs}` : '/orders';

  const response = await apiRequest<ApiResponse<PaginatedOrdersResponse>>(endpoint);
  if (!response?.success || !response.data) {
    throw new Error(response?.message || 'Failed to fetch orders from server.');
  }

  return response.data;
}

/**
 * Export orders matching search/filters directly from backend
 */
export async function exportOrdersApi(
  params: OrderListQueryParams = {}
): Promise<any[]> {
  const query = new URLSearchParams();
  if (params.search?.trim()) query.set('search', params.search.trim());
  if (params.status) query.set('status', params.status);
  if (params.priority) query.set('priority', params.priority);
  if (params.orderType) query.set('orderType', params.orderType);
  if (params.productType) query.set('productType', params.productType);
  if (params.customerName) query.set('customerName', params.customerName);
  if (params.dateFrom) query.set('dateFrom', params.dateFrom);
  if (params.dateTo) query.set('dateTo', params.dateTo);
  if (params.sortBy) query.set('sortBy', params.sortBy);
  if (params.sortOrder) query.set('sortOrder', params.sortOrder);
  if (params.filters && Object.keys(params.filters).length > 0) {
    query.set('filters', encodeURIComponent(JSON.stringify(params.filters)));
  }

  const qs = query.toString();
  const endpoint = qs ? `/orders/export?${qs}` : '/orders/export';

  const response = await apiRequest<ApiResponse<any[]>>(endpoint);
  if (!response?.success || !response.data) {
    throw new Error(response?.message || 'Failed to export orders from server.');
  }

  return response.data;
}

