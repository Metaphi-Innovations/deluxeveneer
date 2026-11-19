import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Link,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { PackageCheck, Warehouse } from "lucide-react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router";
import { InventoryPageShell } from "../../../inventory/shared/InventoryPageShell";
import { MasterSectionCard } from "../../../masters/shared";
import { recordFormActionButtonSx } from "../../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpSelectField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { fetchWarehouseMasterDetail } from "../../../masters/warehouse-location-master/api/warehouseMasterApi";
import { fetchOrdersPaginatedApi } from "../../../orders/api/ordersApi";
import { canAccessPermission } from "../../../permissions";
import { getDynamicWarehousePermissionKey } from "../../../shared/warehousePermission";
import { invalidateWarehouseProduction } from "../../../../query/queryClient";
import {
  fetchProductionInventoryById,
  fetchProductionWarehouseInventory,
} from "../api/productionWarehouseApi";
import {
  buildIssueSummaryLines,
  formatAreaDecimal,
  materialLabel,
  todayInputValue,
  unitForMaterial,
  validateIssueStockForPacking,
} from "./issueStockForPacking.logic";
import {
  getIssueStockForPackingPath,
  mapOrdersToIssueOptions,
  mapProductionItemToIssueStockRow,
} from "./issueStockForPacking.mappers";
import { getIssueStockDummyOrders } from "./issueStockForOrder.dummy";
import { previewLineIssue, submitIssueStockForPacking } from "./issueStockForPackingSubmit";
import type {
  IssueStockLineDraft,
  IssueStockMaterial,
  IssueStockOrderItemOption,
  IssueStockOrderOption,
  IssueStockRow,
} from "./issueStockForPacking.types";

function FieldLabel({
  children,
  required,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Typography
      sx={(theme) => ({
        color: theme.customTokens.text.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 700,
      })}
    >
      {children}
      {required ? " *" : ""}
    </Typography>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <Stack spacing={0.75}>
      <FieldLabel>{label}</FieldLabel>
      <TextField
        fullWidth
        value={value || "—"}
        slotProps={{ input: { readOnly: true } }}
        sx={getCompactFieldSx(theme, "readOnly")}
      />
    </Stack>
  );
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <Box sx={(theme) => formSectionCardSx(theme)}>
      <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
        <FormSectionHeader title={title} />
        {children}
      </Stack>
    </Box>
  );
}

function fieldGridSx(columns: number) {
  return {
    display: "grid",
    gap: 2,
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, minmax(0, 1fr))",
      md: `repeat(${columns}, minmax(0, 1fr))`,
    },
  } as const;
}

function parseMaterial(slug: string): IssueStockMaterial | null {
  const normalized = slug.trim().toLowerCase();
  if (normalized === "raw-veneer") return "raw-veneer";
  if (normalized === "plywood") return "plywood";
  if (normalized === "mdf") return "mdf";
  return null;
}

export function IssueStockForPackingPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ warehouseId: string; materialType: string }>();
  const [searchParams] = useSearchParams();
  const warehouseId = params.warehouseId ?? "";
  const material = parseMaterial(params.materialType ?? "");
  const preselectInventoryId = searchParams.get("inventoryId")?.trim() || "";

  const warehousePermissionKey = warehouseId
    ? getDynamicWarehousePermissionKey(warehouseId)
    : "warehouseC";
  const canEdit = canAccessPermission(warehousePermissionKey, "edit");

  const [warehouseName, setWarehouseName] = useState("Warehouse C");
  const [stockRows, setStockRows] = useState<IssueStockRow[]>([]);
  const [stockLoading, setStockLoading] = useState(false);
  const [orders, setOrders] = useState<IssueStockOrderOption[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedOrderItemId, setSelectedOrderItemId] = useState("");
  const [lines, setLines] = useState<IssueStockLineDraft[]>([]);
  const [issueDate, setIssueDate] = useState(todayInputValue());
  const [remark, setRemark] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "error" | "success" | "info" | "warning";
  } | null>(null);
  const [success, setSuccess] = useState<{
    warehousePath: string;
    orderNo: string;
    orderItemNo: string;
    totalQty: number;
    unit: string;
  } | null>(null);

  const returnTo = warehouseId
    ? `/warehouses/${warehouseId}?section=inventory&inventory=${material ?? "raw-veneer"}`
    : "/dashboard";

  useEffect(() => {
    if (!warehouseId) return;
    let ignore = false;
    void fetchWarehouseMasterDetail(warehouseId)
      .then((record) => {
        if (ignore) return;
        setWarehouseName(
          String(record.warehouseName || "Warehouse C").trim() || "Warehouse C",
        );
      })
      .catch(() => {
        if (!ignore) setWarehouseName("Warehouse C");
      });
    return () => {
      ignore = true;
    };
  }, [warehouseId]);

  useEffect(() => {
    if (!warehouseId || !material) return;
    let ignore = false;
    setStockLoading(true);
    void fetchProductionWarehouseInventory({
      warehouseId,
      tab: material,
      page: 1,
      limit: 200,
    })
      .then(async (result) => {
        if (ignore) return;
        const items = (result?.items ?? []).map((item) =>
          mapProductionItemToIssueStockRow(item, material),
        );
        if (
          preselectInventoryId &&
          !items.some((row) => row.id === preselectInventoryId)
        ) {
          try {
            const detail = await fetchProductionInventoryById(preselectInventoryId);
            items.unshift(mapProductionItemToIssueStockRow(detail, material));
          } catch {
            // Preselect row may already be exhausted.
          }
        }
        setStockRows(items.filter((row) => row.availableQty > 0));
      })
      .catch(() => {
        if (!ignore) setStockRows([]);
      })
      .finally(() => {
        if (!ignore) setStockLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [material, preselectInventoryId, warehouseId]);

  useEffect(() => {
    if (!material) return;
    let ignore = false;
    setOrdersLoading(true);
    setSelectedOrderId("");
    setSelectedOrderItemId("");
    const dummies = getIssueStockDummyOrders(material);
    const productType =
      material === "plywood"
        ? "Plywood"
        : material === "mdf"
          ? "MDF"
          : undefined;
    void fetchOrdersPaginatedApi({
      page: 1,
      limit: 200,
      ...(productType ? { productType } : {}),
      sortBy: "orderDate",
      sortOrder: "desc",
    })
      .then((result) => {
        if (ignore) return;
        const live = mapOrdersToIssueOptions(result.items ?? [], material);
        // Prefer live orders; keep dummy orders available so Order No / Item No always work.
        const liveIds = new Set(live.map((order) => order.id));
        const liveNos = new Set(live.map((order) => order.orderNo));
        const merged = [
          ...live,
          ...dummies.filter(
            (order) => !liveIds.has(order.id) && !liveNos.has(order.orderNo),
          ),
        ];
        setOrders(merged.length > 0 ? merged : dummies);
      })
      .catch(() => {
        if (!ignore) setOrders(dummies);
      })
      .finally(() => {
        if (!ignore) setOrdersLoading(false);
      });
    return () => {
      ignore = true;
    };
  }, [material]);

  useEffect(() => {
    if (!preselectInventoryId) return;
    setLines((current) => {
      if (current.some((line) => line.inventoryId === preselectInventoryId)) {
        return current;
      }
      return [{ inventoryId: preselectInventoryId, qtyToIssue: "" }, ...current];
    });
  }, [preselectInventoryId]);

  const stockById = useMemo(() => {
    const map = new Map<string, IssueStockRow>();
    for (const row of stockRows) map.set(row.id, row);
    return map;
  }, [stockRows]);

  const selectedOrder =
    orders.find((order) => order.id === selectedOrderId) ?? null;
  const selectedOrderItem: IssueStockOrderItemOption | null =
    selectedOrder?.items.find((item) => item.id === selectedOrderItemId) ??
    null;

  const validation = useMemo(
    () =>
      material
        ? validateIssueStockForPacking({
            material,
            stockById,
            order: selectedOrder,
            orderItem: selectedOrderItem,
            issueDate,
            lines,
          })
        : {
            ok: false,
            formError: "Invalid material type.",
            lineErrors: {},
            fieldErrors: {},
          },
    [
      issueDate,
      lines,
      material,
      selectedOrder,
      selectedOrderItem,
      stockById,
    ],
  );

  const summaryLines = useMemo(
    () =>
      material
        ? buildIssueSummaryLines({ material, stockById, lines })
        : [],
    [lines, material, stockById],
  );

  const stockSelectOptions = stockRows.map((row) => ({
    value: row.id,
    label: `${row.productionSrNo || row.storageSrNo || row.id} · ${row.itemName}`,
  }));
  const selectedStockLabels = stockSelectOptions
    .filter((option) =>
      lines.some((line) => line.inventoryId === option.value),
    )
    .map((option) => option.label);

  const pageTitle = material
    ? `Issue ${materialLabel(material)} for Order`
    : "Issue Stock for Order";

  if (!material || !warehouseId) {
    return (
      <InventoryPageShell
        breadcrumbs={[{ label: "Warehouses" }, { label: "Issue Stock for Order" }]}
        icon={Warehouse}
        title="Issue Stock for Order"
      >
        <MasterSectionCard>
          <Alert severity="error">Invalid warehouse or material type.</Alert>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (!canEdit) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: warehouseName, to: returnTo },
          { label: "Issue Stock for Order" },
        ]}
        icon={Warehouse}
        title={pageTitle}
      >
        <MasterSectionCard>
          <Alert severity="warning">
            You do not have permission to issue stock from this warehouse.
          </Alert>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (success) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: warehouseName, to: returnTo },
          { label: "Issue Stock for Order" },
        ]}
        icon={PackageCheck}
        title="Issued for Order"
      >
        <MasterSectionCard>
          <Stack spacing={1.5}>
            <Alert severity="success">
              Issued {success.totalQty} {success.unit.toLowerCase()} to order{" "}
              {success.orderNo} / {success.orderItemNo} successfully.
            </Alert>
            <Link component={RouterLink} to={success.warehousePath}>
              Back to {warehouseName}
            </Link>
          </Stack>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  return (
    <InventoryPageShell
      backNav={{ label: `Back to ${warehouseName}`, to: returnTo }}
      breadcrumbs={[
        { label: warehouseName, to: returnTo },
        { label: "Issue Stock for Order" },
      ]}
      icon={Warehouse}
      subtitle={``}
      title={pageTitle}
    >
      <Stack spacing={1.5}>
        <FormSection title="Stock Details">
          <Stack spacing={1.25}>
            <Box sx={{ maxWidth: { xs: "100%", md: 520 } }}>
              <FieldLabel>Select stock rows</FieldLabel>
              <ErpSelectField
                multiple
                closeOnSelect={false}
                maxListItems={5}
                onChange={(label) => {
                  if (!label.trim()) {
                    setLines([]);
                    return;
                  }
                  const matched = stockSelectOptions.find(
                    (option) => option.label === label,
                  );
                  if (!matched) return;
                  setLines((current) => {
                    if (current.some((line) => line.inventoryId === matched.value)) {
                      return current.filter(
                        (line) => line.inventoryId !== matched.value,
                      );
                    }
                    return [
                      ...current,
                      { inventoryId: matched.value, qtyToIssue: "" },
                    ];
                  });
                }}
                options={stockSelectOptions.map((option) => option.label)}
                placeholder={
                  stockLoading
                    ? "Loading stock..."
                    : stockSelectOptions.length === 0
                      ? "No available stock"
                      : "Select one or more stock rows"
                }
                selectedValues={selectedStockLabels}
                size="dense"
                state={
                  stockLoading || stockSelectOptions.length === 0
                    ? "disabled"
                    : "default"
                }
                value=""
              />
            </Box>

            <Box
              sx={(t) => ({
                maxHeight: 5 * 40 + 40,
                overflowX: "auto",
                overflowY: "auto",
                border: `1px solid ${t.customTokens.borders.default}`,
                borderRadius: 1,
                scrollbarWidth: "thin",
                scrollbarColor: `${t.customTokens.brand.primary} ${t.customTokens.surfaces.alt}`,
                "&::-webkit-scrollbar": {
                  width: 3,
                  height: 3,
                },
                "&::-webkit-scrollbar-track": {
                  backgroundColor: t.customTokens.surfaces.alt,
                  borderRadius: 999,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: t.customTokens.brand.primary,
                  borderRadius: 999,
                },
              })}
            >
              <Table
                size="small"
                stickyHeader
                sx={{
                  "& .MuiTableCell-root": {
                    whiteSpace: "nowrap",
                    py: 0.75,
                    lineHeight: 1.25,
                  },
                }}
              >
                <TableHead>
                  <TableRow>
                    {[
                      "Storage Sr No.",
                      "Production Sr No.",
                      ...(material === "raw-veneer" ? [] : ["Pallet No."]),
                      "Batch No.",
                      "Item Name",
                      "Subcategory",
                      "Grade",
                      "Colour",
                      "L × W × T",
                      "Received",
                      "Available",
                      "Available SQM",
                      "Available SQF",
                      `Qty (${unitForMaterial(material)})`,
                      "Issued SQM",
                      "Issued SQF",
                      "",
                    ].map((label) => (
                      <TableCell
                        key={label}
                        sx={{
                          fontWeight: 700,
                          backgroundColor: (t) => t.customTokens.surfaces.surface,
                        }}
                      >
                        {label}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lines.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={16}>
                        <Typography sx={{ fontSize: "0.875rem" }}>
                          No stock selected yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    lines.map((line) => {
                      const stock = stockById.get(line.inventoryId);
                      const area = stock
                        ? previewLineIssue(stock, line.qtyToIssue)
                        : { sqm: 0, sqf: 0 };
                      const lineError = hasSubmitted
                        ? validation.lineErrors[line.inventoryId]
                        : "";
                      return (
                        <TableRow key={line.inventoryId} sx={{ height: 40 }}>
                          <TableCell>{stock?.storageSrNo || "—"}</TableCell>
                          <TableCell>{stock?.productionSrNo || "—"}</TableCell>
                          {material === "raw-veneer" ? null : (
                            <TableCell>{stock?.palletNo || "—"}</TableCell>
                          )}
                          <TableCell>{stock?.batchNo || "—"}</TableCell>
                          <TableCell>{stock?.itemName || "—"}</TableCell>
                          <TableCell>{stock?.subCategory || "—"}</TableCell>
                          <TableCell>{stock?.grade || "—"}</TableCell>
                          <TableCell>{stock?.color || "—"}</TableCell>
                          <TableCell>
                            {stock
                              ? `${stock.length} × ${stock.width} × ${stock.thickness}`
                              : "—"}
                          </TableCell>
                          <TableCell>{stock?.receivedQty ?? "—"}</TableCell>
                          <TableCell>{stock?.availableQty ?? "—"}</TableCell>
                          <TableCell>
                            {formatAreaDecimal(stock?.availableSqm)}
                          </TableCell>
                          <TableCell>
                            {formatAreaDecimal(stock?.availableSqf)}
                          </TableCell>
                          <TableCell sx={{ minWidth: 96 }}>
                            <TextField
                              error={Boolean(lineError)}
                              title={lineError || undefined}
                              size="small"
                              value={line.qtyToIssue}
                              onChange={(event) => {
                                const next = event.target.value.replace(/\D/g, "");
                                setLines((current) =>
                                  current.map((entry) =>
                                    entry.inventoryId === line.inventoryId
                                      ? { ...entry, qtyToIssue: next }
                                      : entry,
                                  ),
                                );
                              }}
                              sx={{
                                ...getCompactFieldSx(
                                  theme,
                                  lineError ? "error" : "default",
                                ),
                                "& .MuiFormHelperText-root": { display: "none" },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {area.sqm > 0 ? formatAreaDecimal(area.sqm) : "—"}
                          </TableCell>
                          <TableCell>
                            {area.sqf > 0 ? formatAreaDecimal(area.sqf) : "—"}
                          </TableCell>
                          <TableCell>
                            <Button
                              onClick={() =>
                                setLines((current) =>
                                  current.filter(
                                    (entry) => entry.inventoryId !== line.inventoryId,
                                  ),
                                )
                              }
                              size="small"
                            >
                              Remove
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </FormSection>

        <FormSection title="Order Details">
          <Stack spacing={1.25}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(5, minmax(0, 1fr))",
                },
              }}
            >
              <Stack spacing={0.75}>
                <FieldLabel required>Order No</FieldLabel>
                <ErpSelectField
                  onChange={(value) => {
                    const next =
                      orders.find((order) => order.orderNo === value) ?? null;
                    setSelectedOrderId(next?.id ?? "");
                    setSelectedOrderItemId("");
                  }}
                  options={orders.map((order) => order.orderNo)}
                  placeholder={
                    ordersLoading
                      ? "Loading orders..."
                      : orders.length === 0
                        ? "No active orders with matching items"
                        : "Select order"
                  }
                  size="dense"
                  state={ordersLoading ? "disabled" : "default"}
                  value={selectedOrder?.orderNo ?? ""}
                />
              </Stack>
              <Stack spacing={0.75}>
                <FieldLabel required>Order Item No</FieldLabel>
                <ErpSelectField
                  onChange={(value) => {
                    const next =
                      selectedOrder?.items.find(
                        (item) => item.orderItemNo === value,
                      ) ?? null;
                    setSelectedOrderItemId(next?.id ?? "");
                  }}
                  options={(selectedOrder?.items ?? []).map(
                    (item) => item.orderItemNo,
                  )}
                  placeholder={
                    !selectedOrder
                      ? "Select an order first"
                      : selectedOrder.items.length === 0
                        ? "No compatible order items"
                        : "Select order item"
                  }
                  size="dense"
                  state={
                    ordersLoading || !selectedOrder ? "disabled" : "default"
                  }
                  value={selectedOrderItem?.orderItemNo ?? ""}
                />
              </Stack>
              <ReadOnlyField
                label="Customer"
                value={selectedOrder?.customerName || "—"}
              />
              <ReadOnlyField
                label="Order Date"
                value={selectedOrder?.orderDate || "—"}
              />
              <ReadOnlyField
                label="Delivery Date"
                value={selectedOrder?.deliveryDate || "—"}
              />
            </Box>

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(6, minmax(0, 1fr))",
                },
              }}
            >
              <ReadOnlyField
                label="Item Name"
                value={selectedOrderItem?.itemName || "—"}
              />
              <ReadOnlyField
                label="Grade"
                value={selectedOrderItem?.grade || "—"}
              />
              <ReadOnlyField
                label="Dimensions (L × W × T)"
                value={
                  selectedOrderItem
                    ? `${selectedOrderItem.length} × ${selectedOrderItem.width} × ${selectedOrderItem.thickness}`
                    : "—"
                }
              />
              <ReadOnlyField
                label={`Ordered ${unitForMaterial(material)}`}
                value={
                  selectedOrderItem
                    ? String(selectedOrderItem.orderedQty)
                    : "—"
                }
              />
              <ReadOnlyField
                label="Previously Issued"
                value={
                  selectedOrderItem
                    ? String(selectedOrderItem.previouslyIssuedQty)
                    : "—"
                }
              />
              <ReadOnlyField
                label="Remaining Requirement"
                value={
                  selectedOrderItem?.remainingQty == null
                    ? "—"
                    : String(selectedOrderItem.remainingQty)
                }
              />
            </Box>
          </Stack>
        </FormSection>

        <FormSection title="Issue Details">
          <Stack spacing={1.25}>
            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(6, minmax(0, 1fr))",
                },
              }}
            >
              <Stack spacing={0.75}>
                <FieldLabel required>Issue Date</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  type="date"
                  value={issueDate}
                  onChange={(event) => setIssueDate(event.target.value)}
                  sx={getCompactFieldSx(theme)}
                />
              </Stack>
              <ReadOnlyField label="Unit" value={unitForMaterial(material)} />
              <ReadOnlyField label="Destination" value="Order" />
              <ReadOnlyField
                label="Total Issue Qty"
                value={String(
                  summaryLines.reduce((sum, line) => sum + line.qty, 0) || "—",
                )}
              />
              <ReadOnlyField
                label="Total Issued SQM"
                value={
                  summaryLines.length
                    ? formatAreaDecimal(
                        summaryLines.reduce((sum, line) => sum + line.sqm, 0),
                      )
                    : "—"
                }
              />
              <ReadOnlyField
                label="Total Issued SQF"
                value={
                  summaryLines.length
                    ? formatAreaDecimal(
                        summaryLines.reduce((sum, line) => sum + line.sqf, 0),
                      )
                    : "—"
                }
              />
            </Box>
            <Box sx={{ maxWidth: { xs: "100%", md: 360 } }}>
              <Stack spacing={0.75}>
                <FieldLabel>Remark</FieldLabel>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Optional remark"
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  sx={getCompactFieldSx(theme)}
                />
              </Stack>
            </Box>
          </Stack>
        </FormSection>

        <FormSection title="Issue Summary">
          <Box sx={fieldGridSx(4)}>
            <ReadOnlyField label="Warehouse Source" value={warehouseName} />
            <ReadOnlyField label="Material" value={materialLabel(material)} />
            <ReadOnlyField
              label="Order"
              value={
                selectedOrder && selectedOrderItem
                  ? `${selectedOrder.orderNo} / ${selectedOrderItem.orderItemNo}`
                  : "—"
              }
            />
            <ReadOnlyField
              label="Customer"
              value={selectedOrder?.customerName || "—"}
            />
            <ReadOnlyField
              label="Stock Refs"
              value={
                summaryLines
                  .map(
                    (line) =>
                      line.productionSrNo || line.storageSrNo || line.inventoryId,
                  )
                  .join(", ") || "—"
              }
            />
            <ReadOnlyField
              label="Batch / Pallet"
              value={
                summaryLines
                  .map((line) =>
                    [line.batchNo, line.palletNo].filter(Boolean).join(" / "),
                  )
                  .filter(Boolean)
                  .join(", ") || "—"
              }
            />
            <ReadOnlyField
              label="Quantity"
              value={
                summaryLines.length
                  ? `${summaryLines.reduce((sum, line) => sum + line.qty, 0)} ${unitForMaterial(material)}`
                  : "—"
              }
            />
            <ReadOnlyField label="Destination" value="Order" />
          </Box>
        </FormSection>

        <Stack direction="row" spacing={1.25} justifyContent="flex-end">
          <Button
            onClick={() => navigate(returnTo)}
            sx={recordFormActionButtonSx}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => {
              void (async () => {
                setHasSubmitted(true);
                if (!validation.ok || !selectedOrder || !selectedOrderItem) {
                  const firstLineError = Object.values(validation.lineErrors)[0];
                  setToastNotification({
                    severity: "error",
                    message:
                      validation.formError ||
                      firstLineError ||
                      validation.fieldErrors.orderId ||
                      validation.fieldErrors.orderItemId ||
                      validation.fieldErrors.issueDate ||
                      "Fix validation errors before submitting.",
                  });
                  return;
                }
                setSubmitting(true);
                try {
                  const result = await submitIssueStockForPacking({
                    warehouseId,
                    material,
                    stockById,
                    order: selectedOrder,
                    orderItem: selectedOrderItem,
                    issueDate,
                    remark,
                    lines,
                  });
                  void invalidateWarehouseProduction();
                  setSuccess({
                    totalQty: result.totalQty,
                    unit: result.unit,
                    orderNo: selectedOrder.orderNo,
                    orderItemNo: selectedOrderItem.orderItemNo,
                    warehousePath: returnTo,
                  });
                } catch (error) {
                  setToastNotification({
                    severity: "error",
                    message:
                      error instanceof Error
                        ? error.message
                        : "Failed to issue stock for order.",
                  });
                } finally {
                  setSubmitting(false);
                }
              })();
            }}
            sx={recordFormActionButtonSx}
            variant="contained"
          >
            {submitting ? "Issuing..." : "Issue for Order"}
          </Button>
        </Stack>
      </Stack>

      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={4500}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            variant="filled"
            sx={{
              width: "100%",
              fontWeight: 600,
              boxShadow: "0 8px 16px rgba(0,0,0,0.15)",
              borderRadius: 1.5,
            }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </InventoryPageShell>
  );
}

export { getIssueStockForPackingPath };
