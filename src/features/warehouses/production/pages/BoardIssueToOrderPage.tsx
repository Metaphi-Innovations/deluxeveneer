import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Warehouse } from "lucide-react";
import { useNavigate, useParams } from "react-router";
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
import {
  fetchOrdersPaginatedApi,
  type BackendOrder,
  type BackendOrderItem,
} from "../../../orders/api/ordersApi";
import { canAccessPermission } from "../../../permissions";
import { getDynamicWarehousePermissionKey } from "../../../shared/warehousePermission";
import { invalidateWarehouseProduction } from "../../../../query/queryClient";
import { BoardIssuePalletSelectionTable } from "../components/BoardIssuePalletSelectionTable";
import {
  boardMaterialTypeFromSlug,
  fetchBoardIssueEligibleInventory,
  fetchBoardIssueOrderContext,
  issueBoardOrderToProduction,
  type BoardIssueEligibleInventoryItem,
  type BoardIssueOrderContext,
  type BoardMaterialType,
} from "../api/productionWarehouseApi";

function roundArea(value: number) {
  return Math.round(value * 1000) / 1000;
}

function splitIssueQuantities(input: {
  availableSheets: number;
  issueSheets: number;
  totalSqm: number;
  totalSqf: number;
}) {
  const ratio =
    input.availableSheets > 0 ? input.issueSheets / input.availableSheets : 0;
  const issuedSqm = roundArea(input.totalSqm * ratio);
  const issuedSqf = roundArea(input.totalSqf * ratio);
  return {
    remainingSheets: input.availableSheets - input.issueSheets,
    issuedSqm,
    issuedSqf,
    remainingSqm: roundArea(input.totalSqm - issuedSqm),
    remainingSqf: roundArea(input.totalSqf - issuedSqf),
  };
}

function orderItemMatchesMaterial(
  productCategory: string,
  materialType: BoardMaterialType,
) {
  const normalized = productCategory.trim().toLowerCase();
  if (materialType === "PLYWOOD") {
    return normalized.includes("plywood");
  }
  return normalized.includes("mdf");
}

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

export function BoardIssueToOrderPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ warehouseId: string; materialType: string }>();
  const warehouseId = params.warehouseId ?? "";
  const materialSlug = params.materialType ?? "";
  const materialType = boardMaterialTypeFromSlug(materialSlug);

  const warehousePermissionKey = warehouseId
    ? getDynamicWarehousePermissionKey(warehouseId)
    : "warehouseC";
  const canEdit = canAccessPermission(warehousePermissionKey, "edit");

  const [warehouseName, setWarehouseName] = useState("Warehouse");
  const warehouseRootPath = warehouseId ? `/warehouses/${warehouseId}` : "/dashboard";
  const returnTo = warehouseId
    ? `/warehouses/${warehouseId}?section=inventory&inventory=${materialSlug || "plywood"}`
    : "/dashboard";

  const [orders, setOrders] = useState<BackendOrder[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<BackendOrder | null>(null);
  const [selectedOrderItem, setSelectedOrderItem] =
    useState<BackendOrderItem | null>(null);
  const [orderContext, setOrderContext] =
    useState<BoardIssueOrderContext | null>(null);

  const [pallets, setPallets] = useState<BoardIssueEligibleInventoryItem[]>([]);
  const [palletsLoading, setPalletsLoading] = useState(false);
  const [selectedInventoryId, setSelectedInventoryId] = useState<string | null>(
    null,
  );

  const selectedPallet = useMemo(() => {
    if (!selectedInventoryId) {
      return null;
    }
    return (
      pallets.find((item) => String(item.id) === String(selectedInventoryId)) ??
      null
    );
  }, [pallets, selectedInventoryId]);

  const [issueSheetsInput, setIssueSheetsInput] = useState("");
  const [remarks, setRemarks] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const materialLabel = materialType === "MDF" ? "MDF" : "Plywood";

  useEffect(() => {
    if (!warehouseId) {
      return;
    }
    let ignore = false;
    void fetchWarehouseMasterDetail(warehouseId)
      .then((record) => {
        if (ignore) return;
        const name =
          typeof record.warehouseName === "string" && record.warehouseName.trim()
            ? record.warehouseName.trim()
            : "Warehouse";
        setWarehouseName(name);
      })
      .catch(() => {
        if (!ignore) {
          setWarehouseName("Warehouse");
        }
      });
    return () => {
      ignore = true;
    };
  }, [warehouseId]);

  useEffect(() => {
    if (!warehouseId || !materialType) {
      return;
    }
    let ignore = false;
    setOrdersLoading(true);
    void fetchOrdersPaginatedApi({
      page: 1,
      limit: 200,
      productType: materialLabel,
      sortBy: "orderDate",
      sortOrder: "desc",
    })
      .then((result) => {
        if (!ignore) {
          setOrders(result.items ?? []);
        }
      })
      .catch(() => {
        if (!ignore) {
          setOrders([]);
        }
      })
      .finally(() => {
        if (!ignore) {
          setOrdersLoading(false);
        }
      });
    return () => {
      ignore = true;
    };
  }, [materialLabel, materialType, warehouseId]);

  const orderItemOptions = useMemo(() => {
    if (!selectedOrder?.items?.length) {
      return [];
    }
    return selectedOrder.items.filter((item) =>
      orderItemMatchesMaterial(item.productCategory, materialType ?? "PLYWOOD"),
    );
  }, [materialType, selectedOrder]);

  useEffect(() => {
    if (!warehouseId || !materialType || !selectedOrder || !selectedOrderItem) {
      setOrderContext(null);
      return;
    }
    let ignore = false;
    void fetchBoardIssueOrderContext({
      warehouseId,
      materialType,
      orderId: selectedOrder.id,
      orderItemId: selectedOrderItem.id,
    })
      .then((context) => {
        if (!ignore) {
          setOrderContext(context);
        }
      })
      .catch((error) => {
        if (!ignore) {
          setOrderContext(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load order item details.",
          );
        }
      });
    return () => {
      ignore = true;
    };
  }, [materialType, selectedOrder, selectedOrderItem, warehouseId]);

  const loadPallets = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!warehouseId || !materialType) {
        return;
      }
      if (!options?.silent) {
        setPalletsLoading(true);
      }
      try {
        const items = await fetchBoardIssueEligibleInventory({
          warehouseId,
          materialType,
        });
        setPallets(items);
      } catch {
        setPallets([]);
      } finally {
        if (!options?.silent) {
          setPalletsLoading(false);
        }
      }
    },
    [materialType, warehouseId],
  );

  useEffect(() => {
    void loadPallets();
  }, [loadPallets]);

  const issueSheets = useMemo(() => {
    const parsed = Number(issueSheetsInput);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    return parsed;
  }, [issueSheetsInput]);

  const issuePreview = useMemo(() => {
    if (!selectedPallet || issueSheets === null) {
      return null;
    }
    return splitIssueQuantities({
      availableSheets: selectedPallet.availableSheets,
      issueSheets,
      totalSqm: selectedPallet.availableSqm,
      totalSqf: selectedPallet.availableSqf,
    });
  }, [issueSheets, selectedPallet]);

  const issueValidationError = useMemo(() => {
    if (!selectedOrder || !selectedOrderItem) {
      return "Select an order and order item.";
    }
    if (!selectedPallet) {
      return "Select a pallet with available stock.";
    }
    if (issueSheetsInput.trim() === "") {
      return "Issue sheets is required.";
    }
    if (issueSheets === null || !Number.isInteger(issueSheets)) {
      return "Issue sheets must be a whole number.";
    }
    if (issueSheets <= 0) {
      return "Issue sheets must be greater than zero.";
    }
    if (issueSheets > selectedPallet.availableSheets) {
      return "Issue sheets cannot exceed available sheets on the selected pallet.";
    }
    return "";
  }, [
    issueSheets,
    issueSheetsInput,
    selectedOrder,
    selectedOrderItem,
    selectedPallet,
  ]);

  const palletSelectionError = useMemo(() => {
    if (!hasSubmitted || !selectedOrder || !selectedOrderItem) {
      return "";
    }
    if (!selectedPallet) {
      return "Select a pallet with available stock.";
    }
    if (issueSheetsInput.trim() === "") {
      return "Issue sheets is required.";
    }
    if (issueSheets === null || !Number.isInteger(issueSheets)) {
      return "Issue sheets must be a whole number.";
    }
    if (issueSheets <= 0) {
      return "Issue sheets must be greater than zero.";
    }
    if (issueSheets > selectedPallet.availableSheets) {
      return "Issue sheets cannot exceed available sheets on the selected pallet.";
    }
    return "";
  }, [
    hasSubmitted,
    issueSheets,
    issueSheetsInput,
    selectedOrder,
    selectedOrderItem,
    selectedPallet,
  ]);

  const closeForm = () => {
    navigate(returnTo, { replace: true, flushSync: true });
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }
    setHasSubmitted(true);
    if (
      !warehouseId ||
      !materialType ||
      !selectedOrder ||
      !selectedOrderItem ||
      !selectedPallet ||
      issueValidationError
    ) {
      setErrorMessage(issueValidationError || "Complete all required fields.");
      return;
    }
    if (issueSheets === null) {
      return;
    }

    setSubmitting(true);
    setErrorMessage("");
    try {
      await issueBoardOrderToProduction({
        warehouseId,
        materialType,
        orderId: selectedOrder.id,
        orderItemId: selectedOrderItem.id,
        inventoryId: selectedPallet.id,
        issueSheets,
        remarks: remarks.trim() || null,
      });
      void invalidateWarehouseProduction();
      navigate(returnTo, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to issue stock to order.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const pageTitle = `Issue to Order — ${materialLabel}`;
  const breadcrumbs = [
    { label: "Warehouses" },
    { label: warehouseName, to: warehouseRootPath },
    { label: materialLabel, to: returnTo },
    { label: "Issue to Order" },
  ];
  const backNav = {
    label: `Back to ${warehouseName}`,
    to: returnTo,
    onBack: closeForm,
  };

  if (!materialType || !warehouseId) {
    return (
      <InventoryPageShell
        breadcrumbs={[{ label: "Warehouses" }, { label: "Issue to Order" }]}
        icon={Warehouse}
        title="Issue to Order"
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
        backNav={backNav}
        breadcrumbs={breadcrumbs}
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

  const orderNoOptions = orders.map((order) => order.orderNo);
  const orderItemNoOptions = orderItemOptions.map((item) => item.orderItemNo);

  return (
    <InventoryPageShell
      backNav={backNav}
      breadcrumbs={breadcrumbs}
      icon={Warehouse}
      subtitle={`Issue ${materialLabel} stock from ${warehouseName} to a sales order line.`}
      title={pageTitle}
    >
      <Stack spacing={1.5}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <FormSection title="Order Details">
          <Box sx={fieldGridSx(2)}>
            <Stack spacing={0.75}>
              <FieldLabel required>Order No</FieldLabel>
              <ErpSelectField
                onChange={(value) => {
                  const nextOrder =
                    orders.find((order) => order.orderNo === value) ?? null;
                  setSelectedOrder(nextOrder);
                  setSelectedOrderItem(null);
                  setOrderContext(null);
                  setErrorMessage("");
                }}
                options={orderNoOptions}
                placeholder={ordersLoading ? "Loading orders..." : "Select order no"}
                size="dense"
                state={ordersLoading || orderNoOptions.length === 0 ? "disabled" : "default"}
                value={selectedOrder?.orderNo ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <FieldLabel required>Order Item No</FieldLabel>
              <ErpSelectField
                onChange={(value) => {
                  const nextItem =
                    orderItemOptions.find((item) => item.orderItemNo === value) ??
                    null;
                  setSelectedOrderItem(nextItem);
                  setErrorMessage("");
                }}
                options={orderItemNoOptions}
                placeholder="Select order item no"
                size="dense"
                state={!selectedOrder ? "disabled" : "default"}
                value={selectedOrderItem?.orderItemNo ?? ""}
              />
            </Stack>
          </Box>

          {orderContext ? (
            <Box sx={fieldGridSx(4)}>
              <ReadOnlyField label="Item" value={orderContext.itemName} />
              <ReadOnlyField
                label="Product Type"
                value={orderContext.productCategory}
              />
              <ReadOnlyField
                label="Dimensions (L × W × T)"
                value={`${orderContext.length} × ${orderContext.width} × ${orderContext.thickness}`}
              />
              <ReadOnlyField
                label="Ordered Sheets"
                value={String(orderContext.orderedSheets)}
              />
              <ReadOnlyField
                label="Previously Issued"
                value={String(orderContext.previouslyIssuedSheets)}
              />
              <ReadOnlyField
                label="Remaining Requirement"
                value={
                  orderContext.remainingRequirementSheets === null
                    ? "—"
                    : String(orderContext.remainingRequirementSheets)
                }
              />
              <ReadOnlyField
                label="Order Line SQM"
                value={String(orderContext.sqm)}
              />
              <ReadOnlyField
                label="Order Line SQF"
                value={String(orderContext.totalSqf)}
              />
            </Box>
          ) : null}
        </FormSection>

        <BoardIssuePalletSelectionTable
          issueSheetsInput={issueSheetsInput}
          issueSqf={
            issuePreview ? String(issuePreview.issuedSqf) : ""
          }
          issueSqm={
            issuePreview ? String(issuePreview.issuedSqm) : ""
          }
          materialLabel={materialLabel}
          onIssueSheetsChange={(value) => {
            setIssueSheetsInput(value);
            setErrorMessage("");
          }}
          onRefreshPallets={() => {
            void loadPallets({ silent: true });
          }}
          onSelectPallet={(nextPallet) => {
            setSelectedInventoryId(nextPallet ? String(nextPallet.id) : null);
            setIssueSheetsInput("");
            setErrorMessage("");
          }}
          pallets={pallets}
          palletsLoading={palletsLoading}
          selectedPallet={selectedPallet}
          selectionError={palletSelectionError}
          showErrors={hasSubmitted}
          warehouseName={warehouseName}
        />

        <FormSection title="Remarks">
          <Box sx={fieldGridSx(1)}>
            <Stack spacing={0.75}>
              <FieldLabel>Remark</FieldLabel>
              <TextField
                fullWidth
                minRows={2}
                multiline
                placeholder="Optional remark"
                value={remarks}
                onChange={(event) => setRemarks(event.target.value)}
                sx={getCompactFieldSx(theme)}
              />
            </Stack>
          </Box>
        </FormSection>

        <FormSection title="Issue Summary">
          <Box sx={fieldGridSx(4)}>
            <ReadOnlyField
              label="Order No"
              value={selectedOrder?.orderNo ?? "—"}
            />
            <ReadOnlyField
              label="Order Item No"
              value={selectedOrderItem?.orderItemNo ?? "—"}
            />
            <ReadOnlyField label="Material Type" value={materialLabel} />
            <ReadOnlyField
              label="Pallet No"
              value={selectedPallet?.palletNo ?? "—"}
            />
            <ReadOnlyField
              label="Item Details"
              value={
                selectedPallet
                  ? `${selectedPallet.itemName} · ${selectedPallet.length} × ${selectedPallet.width} × ${selectedPallet.thickness}`
                  : "—"
              }
            />
            <ReadOnlyField
              label="Available Quantity"
              value={
                selectedPallet ? String(selectedPallet.availableSheets) : "—"
              }
            />
            <ReadOnlyField
              label="Issue Quantity"
              value={
                issueSheets !== null && Number.isInteger(issueSheets)
                  ? String(issueSheets)
                  : "—"
              }
            />
            <ReadOnlyField
              label="Remaining Warehouse Quantity"
              value={
                issuePreview
                  ? String(issuePreview.remainingSheets)
                  : selectedPallet
                    ? String(selectedPallet.availableSheets)
                    : "—"
              }
            />
          </Box>
        </FormSection>

        <Box
          sx={(currentTheme) => ({
            display: "flex",
            justifyContent: "flex-end",
            gap: currentTheme.spacing(1.5),
            flexWrap: "wrap",
            pt: currentTheme.spacing(0.5),
            borderTop: `1px solid ${currentTheme.customTokens.borders.divider}`,
          })}
        >
          <Button
            disabled={submitting}
            onClick={closeForm}
            sx={recordFormActionButtonSx}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={submitting}
            onClick={() => void handleSubmit()}
            sx={recordFormActionButtonSx}
            type="button"
            variant="contained"
          >
            {submitting ? "Submitting..." : "Submit Issue"}
          </Button>
        </Box>
      </Stack>
    </InventoryPageShell>
  );
}
