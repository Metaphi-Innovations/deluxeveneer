import { useCallback, useEffect, useMemo, useState } from "react";

import { formatMasterValue } from "../../masters/shared";
import {
  appendCreatedOrderToStore,
  getOrderLineItems,
  type OrderCreateVariant,
  type OrderLineItem,
  type OrderModuleConfig,
  type OrderRecord,
  useOrderRecords,
} from "../shared/ordersStore";
import { canAccessPermission } from "../../permissions";
import {
  fetchOrderDropdownsApi,
  fetchOrdersPaginatedApi,
  mapBackendOrderToOrderRecord,
  type OrderListQueryParams,
} from "../api/ordersApi";

export type OrderListingTab = OrderCreateVariant;

export type OrderListingRow = OrderRecord & {
  designCode?: string | undefined;
  dispatchQuantity: string;
  issuedQuantity: string;
  orderId: string;
  orderItemNumber: string;
  orderLineItemId: string;
  rawMaterial: string;
  structuredCode?: string | undefined;
};

export function useOrderList({
  moduleConfig,
  requestedTab,
  viewOrderId,
}: {
  moduleConfig: OrderModuleConfig;
  requestedTab: OrderListingTab | null;
  viewOrderId: string | undefined;
}) {
  const localRows = useOrderRecords();
  const [activeTab, setActiveTab] = useState<OrderListingTab>("order");
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [serverRows, setServerRows] = useState<OrderRecord[]>([]);
  const [serverLineItems, setServerLineItems] = useState<Map<string, OrderLineItem[]>>(new Map());
  const [columnFilters, setColumnFilters] = useState<Partial<Record<string, any>>>({});
  const [sortConfig, setSortConfig] = useState<{
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
  }>({
    sortBy: null,
    sortOrder: null,
  });

  // Debounce search input by 350ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue.trim());
      setPage(1); // Reset page on new search
    }, 350);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    setActiveTab("order");
  }, [moduleConfig, requestedTab]);

  const [hasLoadedServer, setHasLoadedServer] = useState(false);

  const serializedFilters = useMemo(() => {
    return JSON.stringify(columnFilters);
  }, [columnFilters]);

  // Server-side fetch orders
  const loadOrders = useCallback(async () => {
    const canView = canAccessPermission("placeOrder", "view");
    if (!canView) {
      setServerRows([]);
      setTotalCount(0);
      setIsLoading(false);
      setHasLoadedServer(true);
      return;
    }

    setIsLoading(true);
    try {
      const parsedFilters = JSON.parse(serializedFilters);
      const filterParams: Record<string, string[]> = {};
      Object.entries(parsedFilters).forEach(([colKey, colVal]: [string, any]) => {
        if (!colVal) return;
        // EnterpriseDataTable column filters are { type: 'multiSelect', values: string[] }
        if (colVal && typeof colVal === "object" && Array.isArray(colVal.values)) {
          if (colVal.values.length > 0) {
            filterParams[colKey] = colVal.values;
          }
        } else if (Array.isArray(colVal) && colVal.length > 0) {
          filterParams[colKey] = colVal;
        } else if (typeof colVal === "string" && colVal.trim()) {
          filterParams[colKey] = [colVal.trim()];
        }
      });

      let dateFromParam: string | undefined = undefined;
      let dateToParam: string | undefined = undefined;

      // Check if orderDate or deliveryDate has dateFrom / dateTo audit tokens
      const dateKeys = ["orderDate", "deliveryDate"];
      for (const dKey of dateKeys) {
        const dVals = filterParams[dKey];
        if (Array.isArray(dVals)) {
          const fromToken = dVals.find((v) => v.startsWith("__audit_date_from__:"));
          const toToken = dVals.find((v) => v.startsWith("__audit_date_to__:"));
          if (fromToken) dateFromParam = fromToken.replace("__audit_date_from__:", "");
          if (toToken) dateToParam = toToken.replace("__audit_date_to__:", "");
        }
      }

      const params: OrderListQueryParams = {
        page,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
        sortBy: sortConfig.sortBy || "orderDate",
        sortOrder: sortConfig.sortOrder || "latest",
        customerName: filterParams.customerName?.[0] || undefined,
        dateFrom: dateFromParam,
        dateTo: dateToParam,
        filters: Object.keys(filterParams).length > 0 ? filterParams : undefined,
      };

      const result = await fetchOrdersPaginatedApi(params);

      const mappedRecords: OrderRecord[] = [];
      const itemMap = new Map<string, OrderLineItem[]>();

      result.items.forEach((backendOrder) => {
        const { record, lineItems } = mapBackendOrderToOrderRecord(backendOrder);
        mappedRecords.push(record);
        itemMap.set(record.id, lineItems);
      });

      setServerRows(mappedRecords);
      setServerLineItems(itemMap);
      setTotalCount(result.pagination.total);
      setHasLoadedServer(true);
    } catch {
      // Keep current data or empty on network error
      setHasLoadedServer(true);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, page, rowsPerPage, serializedFilters, sortConfig.sortBy, sortConfig.sortOrder]);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const canView = canAccessPermission("placeOrder", "view");
  const activeRows = !canView ? [] : serverRows.length > 0 ? serverRows : (hasLoadedServer ? [] : localRows);

  const listingRows = useMemo(() => {
    // Deduplicate by order id / orderNo so there is strictly 1 row per order
    const uniqueOrders = new Map<string, OrderRecord>();
    activeRows.forEach((row) => {
      const key = (row.orderNo || row.id).trim().toLowerCase();
      if (!uniqueOrders.has(key)) {
        uniqueOrders.set(key, row);
      }
    });

    return Array.from(uniqueOrders.values()).flatMap((row) =>
      buildOrderListingRows(row, serverLineItems.get(row.id))
    );
  }, [activeRows, serverLineItems]);

  const filteredRows = useMemo(() => {
    // When connected to backend, server already filters, searches, and paginates
    if (hasLoadedServer) {
      return listingRows;
    }

    // Local fallback filter
    return listingRows.filter((row) => {
      if (searchValue.trim().length === 0) {
        return true;
      }

      return Object.values(row).some((value) =>
        formatMasterValue(value)
          .toLowerCase()
          .includes(searchValue.trim().toLowerCase()),
      );
    });
  }, [hasLoadedServer, listingRows, searchValue]);

  const viewRecord = useMemo(
    () => activeRows.find((row) => row.id === viewOrderId) || localRows.find((row) => row.id === viewOrderId),
    [activeRows, localRows, viewOrderId],
  );

  useEffect(() => {
    setActiveTab("order");
  }, [viewRecord?.id]);

  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});

  const handleColumnFilterOpen = useCallback((columnKey: string) => {
    const dropdownType =
      columnKey === "customerName"
        ? "customers"
        : columnKey === "itemName" || columnKey === "productCategory"
          ? "items"
          : "all";

    void fetchOrderDropdownsApi({ type: dropdownType })
      .then((data) => {
        if (!data) return;
        const optionsMap: Record<string, Array<{ value: string; label: string }>> = {};
        if (data.customers) {
          optionsMap.customerName = data.customers.map((c) => ({
            value: c.customerName || c.name || "",
            label: c.customerName || c.name || "",
          }));
        }
        if (data.items) {
          optionsMap.itemName = data.items.map((i) => ({
            value: i.name || i.label || "",
            label: i.name || i.label || "",
          }));
          optionsMap.productCategory = Array.from(
            new Set(data.items.map((i) => i.category).filter(Boolean)),
          ).map((cat) => ({ value: cat!, label: cat! }));
        }
        const targetOptions = optionsMap[columnKey];
        if (targetOptions) {
          setFilterOptionsByColumn((prev) => ({
            ...prev,
            [columnKey]: targetOptions,
          }));
        }
      })
      .catch(() => {});
  }, []);

  return {
    activeTab,
    columnFilters,
    filterOptionsByColumn,
    filteredRows,
    handleColumnFilterOpen,
    isLoading,
    page,
    rowsPerPage,
    searchValue,
    setActiveTab,
    setColumnFilters,
    setPage,
    setRowsPerPage,
    setSearchValue,
    setSortConfig,
    sortConfig,
    totalCount,
    viewRecord,
    reloadOrders: loadOrders,
    cancelOrderRow: (orderId: string, orderItemId?: string) => {
      if (orderItemId) {
        setServerLineItems((prev) => {
          const next = new Map(prev);
          const currentItems = next.get(orderId);
          if (currentItems) {
            const updated = currentItems.map((item) =>
              item.id === orderItemId || item.orderItemNo === orderItemId
                ? { ...item, status: "Cancelled" }
                : item
            );
            next.set(orderId, updated);

            const allCancelled = updated.every(
              (item) => String(item.status ?? "").toLowerCase() === "cancelled"
            );
            if (allCancelled) {
              setServerRows((prevRows) =>
                prevRows.map((r) =>
                  r.id === orderId || r.orderNo === orderId ? { ...r, status: "Cancelled" } : r
                )
              );
            }
          }
          return next;
        });
      } else {
        setServerRows((prev) =>
          prev.map((r) =>
            r.id === orderId || r.orderNo === orderId ? { ...r, status: "Cancelled" } : r
          )
        );
      }
    },
  };
}

function buildOrderListingRows(record: OrderRecord, cachedItems?: OrderLineItem[]): OrderListingRow[] {
  const lineItems = cachedItems && cachedItems.length > 0 ? cachedItems : getOrderLineItems(record.id);

  if (lineItems.length === 0) {
    return [
      {
        ...record,
        dispatchQuantity: record.quantitySheets,
        issuedQuantity: record.quantitySheets,
        id: record.id,
        orderId: record.id,
        orderItemNumber: "OI-001",
        orderLineItemId: "",
        rawMaterial: record.productCategory || record.orderType,
      },
    ];
  }

  // Display each order item separately in its own row
  return lineItems.map((item, index) => {
    const rawMaterial =
      item.productCategory === "Finished"
        ? item.finishedType
        : item.productCategory || item.finishedType || record.productCategory;

    // Use orderItemNo if available, otherwise OI-001 formatting
    const orderItemNumber =
      item.orderItemNo ||
      (() => {
        const numericTail = String(item.id).match(/(\d+)$/)?.[1];
        const sequence = numericTail ? Number.parseInt(numericTail, 10) : index + 1;
        return `OI-${String(Number.isFinite(sequence) ? sequence : index + 1).padStart(3, "0")}`;
      })();

    // Status: inherit item's specific status if present, otherwise fallback to record status
    const itemStatus = item.status || record.status;

    return {
      ...record,
      ...getOrderLineItemListingValues(item),
      // Unique row ID for enterprise table keying
      id: `${record.id}-${item.id || index + 1}`,
      orderId: record.id,
      orderItemNumber,
      orderLineItemId: item.id,
      rawMaterial,
      status: itemStatus,
    };
  });
}

function getOrderLineItemListingValues(lineItem: OrderLineItem) {
  return {
    amount: lineItem.amount,
    designCode: lineItem.designCode,
    dispatchQuantity: lineItem.quantitySheets,
    grade: lineItem.grade,
    issuedQuantity: lineItem.quantitySheets,
    itemName: lineItem.itemName || lineItem.salesItemName,
    length: lineItem.length,
    productCategory: lineItem.productCategory || lineItem.finishedType,
    quantitySheets: lineItem.quantitySheets,
    remark: lineItem.remark,
    series: lineItem.series,
    sqm: lineItem.sqm,
    structuredCode: lineItem.structuredCode,
    subCategory: lineItem.subCategory,
    thickness: lineItem.thickness,
    totalSqm: lineItem.totalSqm,
    width: lineItem.width,
  };
}
