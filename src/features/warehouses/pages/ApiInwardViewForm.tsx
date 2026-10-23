import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  Building2,
  Calendar,
  DollarSign,
  FileCheck,
  FileSpreadsheet,
  MessageSquare,
  Package2,
  Pencil,
  Receipt,
  Truck,
  UserCheck,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import { MasterSectionCard } from "../../masters/shared";
import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import { getInwardGstMode } from "../../masters/shared/masterDefinitions";
import { canAccessPermission } from "../../permissions";
import { ContentLoader } from "../../../components/feedback/ContentLoader";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";
import { InventoryPageShell } from "../../inventory/shared/InventoryPageShell";
import { AttachmentPreview } from "../components/AttachmentPreview";
import {
  fetchInwardById,
  isInwardEditLockedByQc,
  type InwardDetail,
  type InwardItemDetail,
} from "../api/inwardApi";
import {
  getInwardStockLabel,
  slugFromInventoryTypeLabel,
  type ApiSupportedInwardSlug,
} from "../inward/supportedInwardTypes";
import { buildInvoiceTotalsSummary } from "../shared/invoiceTotalsSummary";

interface ApiInwardViewFormProps {
  inwardId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
  listPath: string;
  editPath: string;
}

function formatDateDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | null | undefined, currency?: string | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "0.00";
  }
  return formatAmountShared(value, currency ? { currency, withSymbol: false } : { withSymbol: false });
}

function formatMeasure(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function formatAuditUserName(
  user?: {
    firstName: string | null;
    lastName: string | null;
  } | null,
): string {
  if (!user) return "—";
  const name = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim();
  return name || "—";
}

function formatDisplayDateTime(dateVal?: unknown): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}

function normalizeQcLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pass") return "Pass";
  if (normalized === "fail") return "Fail";
  return "Pending";
}

function qcChipColor(
  label: string,
): "default" | "success" | "error" | "warning" {
  if (label === "Pass") return "success";
  if (label === "Fail") return "error";
  return "warning";
}

export function ApiInwardViewForm({
  inwardId,
  warehouseId,
  warehouseName,
  warehouseRootPath,
  listPath,
  editPath,
}: ApiInwardViewFormProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  /** Storage warehouse view: hide QC status + rejected stock (not relevant after QC pass). */
  const isStorageWarehouseView = searchParams.get("warehouse") === "warehouse-b";
  const canEdit = canAccessPermission(
    getDynamicWarehousePermissionKey(warehouseId),
    "edit",
  );
  const [detail, setDetail] = useState<InwardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadInward = async () => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const result = await fetchInwardById(inwardId);
      setDetail(result);
    } catch (error) {
      setDetail(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load inward record.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadInward();
  }, [inwardId]);

  const overallQc = useMemo(
    () => normalizeQcLabel(detail?.qcStatus),
    [detail?.qcStatus],
  );
  const editLocked = isInwardEditLockedByQc({
    qcStatus: detail?.qcStatus,
    items: detail?.items,
  });

  const qcCounts = useMemo(() => {
    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;

    for (const item of detail?.items ?? []) {
      const normalized = (item.qcStatus ?? "").trim().toUpperCase();
      if (normalized === "PASS") {
        passCount += 1;
      } else if (normalized === "FAIL") {
        failCount += 1;
      } else {
        pendingCount += 1;
      }
    }

    return {
      passCount,
      failCount,
      pendingCount,
      totalCount: (detail?.items ?? []).length,
    };
  }, [detail?.items]);

  const gstMode = useMemo(
    () =>
      getInwardGstMode(
        detail?.warehouseState ?? "",
        detail?.supplierState ?? "",
      ),
    [detail?.supplierState, detail?.warehouseState],
  );

  const invoiceSummary = useMemo(
    () =>
      buildInvoiceTotalsSummary({
        itemSubTotal: detail?.itemSubTotal ?? 0,
        additionalCharges: detail?.additionalChargesTotal ?? 0,
        cgst: detail?.cgstTotal ?? 0,
        sgst: detail?.sgstTotal ?? 0,
        igst: detail?.igstTotal ?? 0,
        gstMode,
      }),
    [
      detail?.additionalChargesTotal,
      detail?.cgstTotal,
      detail?.igstTotal,
      detail?.itemSubTotal,
      detail?.sgstTotal,
      gstMode,
    ],
  );

  const inventorySlug = useMemo(
    () => slugFromInventoryTypeLabel(detail?.inventoryType),
    [detail?.inventoryType],
  );

  const itemTableHeaders = useMemo(() => {
    const taxHeaders =
      gstMode === "inter" ? (["IGST"] as const) : (["CGST", "SGST"] as const);
    const qcHeaders = isStorageWarehouseView
      ? (["Available Stock", "Remark"] as const)
      : ([
          "QC",
          "Available Stock",
          "Rejected Stock",
          "QC Remark",
          "Attachment",
          "Remark",
        ] as const);

    if (inventorySlug === "raw-veneer") {
      return [
        "Inward Item Code",
        "Item Name",
        "Factory Code",
        "HSN",
        "Log Code",
        "Bundle",
        "Pallet",
        "L",
        "W",
        "Thk",
        "Leaves",
        "SQM",
        "Rate",
        "Amount",
        ...taxHeaders,
        "Total",
        ...qcHeaders,
      ];
    }

    if (inventorySlug === "plywood" || inventorySlug === "mdf") {
      return [
        "Inward Item Code",
        "Item Name",
        "Factory Code",
        "HSN",
        "Pallet No",
        "L",
        "W",
        "Thk",
        "Sheets",
        "SQM",
        "Rate",
        "Amount",
        ...taxHeaders,
        "Total",
        ...qcHeaders,
      ];
    }

    if (inventorySlug === "consumables") {
      return [
        "Inward Item Code",
        "Item Name",
        "Factory Code",
        "Sub Category",
        "HSN",
        "Specification / Model",
        "Brand / Make",
        "Batch / Lot No",
        "Quantity",
        "Unit",
        "Rate",
        "Amount",
        ...taxHeaders,
        "Total",
        ...qcHeaders,
      ];
    }

    return [
      "Inward Item Code",
      "Item Name",
      "Factory Code",
      "HSN",
      "Log No",
      "L",
      "W",
      "H",
      "CBM",
      "Rate",
      "Amount",
      ...taxHeaders,
      "Total",
      ...qcHeaders,
    ];
  }, [gstMode, inventorySlug, isStorageWarehouseView]);

  const headerFields = useMemo(() => {
    if (!detail) return [];
    return [
      { label: "Inward Date", value: formatDateDisplay(detail.inwardDate) },
      { label: "Supplier", value: detail.supplierName || "—" },
      { label: "Invoice No", value: detail.invoiceNo || "—" },
      { label: "Currency", value: detail.currency || "—" },
      { label: "Mode", value: detail.mode || "—" },
      { label: "ETA", value: formatDateDisplay(detail.eta) },
      { label: "ETD", value: formatDateDisplay(detail.etd) },
      {
        label: "Exchange Rate",
        value:
          detail.exchangeRate === null || detail.exchangeRate === undefined
            ? "—"
            : String(detail.exchangeRate),
      },
      { label: "Inward Type", value: detail.inventoryType || "—" },
      {
        label: "Updated By",
        value: formatAuditUserName(detail.updatedBy),
      },
    ];
  }, [detail]);

  const [leaveConfirmation, setLeaveConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => undefined,
  });

  const closeForm = () => {
    navigate(listPath, { replace: true, flushSync: true });
  };

  const viewStockTitle = `View ${getInwardStockLabel(inventorySlug)}`;

  if (isLoading) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: warehouseName, to: warehouseRootPath },
          { label: viewStockTitle },
        ]}
        title={viewStockTitle}
        subtitle=" "
      >
        <MasterSectionCard>
          <ContentLoader label="Loading inward record..." minHeight={220} />
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (!detail) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: warehouseName, to: warehouseRootPath },
          { label: viewStockTitle },
        ]}
        title={viewStockTitle}
      >
        <MasterSectionCard>
          <Alert severity="error">
            {errorMessage || "The requested inward record could not be found."}
          </Alert>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  return (
    <InventoryPageShell
      backNav={{
        label: `Back to ${getInwardStockLabel(inventorySlug)}`,
        to: listPath,
        onBack: closeForm,
      }}
      breadcrumbs={[
        { label: "Warehouses" },
        { label: warehouseName, to: warehouseRootPath },
        { label: viewStockTitle },
      ]}
      subtitle=" "
      title={viewStockTitle}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {canEdit && !editLocked && !isStorageWarehouseView ? (
            <Button
              variant="contained"
              startIcon={<Pencil size={16} />}
              onClick={() => navigate(editPath)}
              sx={recordViewActionButtonSx}
            >
              Edit
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Stack spacing={1.5}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {/* Header Identity Card */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1.5,
            flexWrap: "wrap",
            px: 1.75,
            py: 1,
            borderRadius: "8px",
            border: `1px solid ${theme.customTokens.borders.default}`,
            backgroundColor: theme.customTokens.surfaces.surface,
          }}
        >
          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ minWidth: 0, flex: "1 1 auto" }}>
            <Avatar
              sx={{
                width: 40,
                height: 40,
                bgcolor: theme.customTokens.brand.primaryScale[100],
                color: theme.customTokens.brand.primary,
                borderRadius: "8px",
                flexShrink: 0,
              }}
            >
              <Package2 size={20} />
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography
                  sx={{
                    fontSize: "1.0625rem",
                    fontWeight: 700,
                    color: theme.customTokens.text.primary,
                    lineHeight: 1.25,
                  }}
                >
                  {detail.invoiceNo ? `Invoice #${detail.invoiceNo}` : detail.inwardSrNo ? `Inward #${detail.inwardSrNo}` : "Inward Record"}
                </Typography>
                {detail.inwardSrNo && detail.invoiceNo ? (
                  <Chip
                    label={`Inward #${detail.inwardSrNo}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: theme.customTokens.surfaces.paper,
                      border: `1px solid ${theme.customTokens.borders.default}`,
                    }}
                  />
                ) : null}
              </Stack>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.75 }}
              >
                {detail.supplierName ? (
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                    }}
                  >
                    Supplier: {detail.supplierName}
                  </Typography>
                ) : null}

                {detail.inventoryType ? (
                  <Chip
                    label={detail.inventoryType}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.75rem",
                      fontWeight: 500,
                      backgroundColor: theme.customTokens.surfaces.paper,
                      border: `1px solid ${theme.customTokens.borders.default}`,
                    }}
                  />
                ) : null}

                {detail.inwardDate ? (
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Calendar size={13} style={{ color: theme.customTokens.text.secondary }} />
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        color: theme.customTokens.text.secondary,
                      }}
                    >
                      {formatDateDisplay(detail.inwardDate)}
                    </Typography>
                  </Stack>
                ) : null}
              </Stack>
            </Box>
          </Stack>

          {!isStorageWarehouseView ? (
            <Chip
              label={`QC: ${overallQc}`}
              size="small"
              sx={{
                alignSelf: { xs: "flex-start", sm: "center" },
                height: 24,
                fontSize: "0.75rem",
                fontWeight: 600,
                backgroundColor:
                  overallQc === "Pass"
                    ? "rgba(46, 125, 50, 0.12)"
                    : overallQc === "Fail"
                      ? "rgba(211, 47, 47, 0.12)"
                      : "rgba(237, 108, 2, 0.12)",
                color:
                  overallQc === "Pass"
                    ? "#2E7D32"
                    : overallQc === "Fail"
                      ? "#D32F2F"
                      : "#ED6C02",
                border: `1px solid ${
                  overallQc === "Pass"
                    ? "rgba(46, 125, 50, 0.3)"
                    : overallQc === "Fail"
                      ? "rgba(211, 47, 47, 0.3)"
                      : "rgba(237, 108, 2, 0.3)"
                }`,
              }}
            />
          ) : null}
        </Box>

        {/* 2-Column Master Information Cards Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, minmax(0, 1fr))",
            },
            gap: 1.25,
          }}
        >
          {/* Inward & Supplier Details Card */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              icon={Receipt}
              title="Inward & Supplier Details"
              variant="cardTop"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                columnGap: 2.5,
                rowGap: 1,
                mt: 1,
              }}
            >
              <ProfileField label="Inward Date" value={formatDateDisplay(detail.inwardDate)} />
              <ProfileField label="Inward Sr No" value={detail.inwardSrNo || "—"} />
              <ProfileField label="Invoice No" value={detail.invoiceNo || "—"} />
              <ProfileField label="Supplier" value={detail.supplierName || "—"} />
              <ProfileField label="Inward Type" value={detail.inventoryType || "—"} />
              <ProfileField label="Warehouse" value={warehouseName || detail.warehouseName || "—"} />
            </Box>
          </Box>

          {/* Logistics, Currency & Attachment Card */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              icon={Truck}
              title="Logistics & Finance"
              variant="cardTop"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                },
                columnGap: 2.5,
                rowGap: 1,
                mt: 1,
              }}
            >
              <ProfileField label="Mode of Transport" value={detail.mode || "—"} />
              <ProfileField label="Currency" value={detail.currency || "—"} />
              <ProfileField label="ETA" value={formatDateDisplay(detail.eta)} />
              <ProfileField label="ETD" value={formatDateDisplay(detail.etd)} />
              <ProfileField
                label="Exchange Rate"
                value={
                  detail.exchangeRate === null || detail.exchangeRate === undefined
                    ? "—"
                    : String(detail.exchangeRate)
                }
              />
              <Box sx={{ minWidth: 0, py: 0.1 }}>
                <Typography
                  sx={{
                    fontSize: "0.71875rem",
                    fontWeight: 700,
                    color: theme.customTokens.text.secondary,
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                    lineHeight: 1.25,
                    mb: 0.2,
                  }}
                >
                  Attachment
                </Typography>
                <AttachmentPreview
                  url={detail.attachmentUrl}
                  title="Inward Attachment"
                />
              </Box>
            </Box>
          </Box>
        </Box>

        <Box
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            borderRadius: "8px",
          })}
        >
          <Stack spacing={1.25}>
            <FormSectionHeader
              icon={FileSpreadsheet}
              title="Item Details"
              variant="cardTop"
            />
            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              }}
            >
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 1100 }}>
                  <TableHead>
                    <TableRow
                      sx={{
                        backgroundColor: theme.customTokens.surfaces.alt,
                      }}
                    >
                      {itemTableHeaders.map((label) => (
                        <TableCell
                          key={label}
                          sx={getViewHeaderCellSx(theme)}
                        >
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.items.map((item, index) => (
                      <ItemRow
                        key={item.id}
                        currency={detail.currency || undefined}
                        gstMode={gstMode}
                        hideQcFields={isStorageWarehouseView}
                        inventorySlug={inventorySlug}
                        item={item}
                        index={index}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(280px, 340px)",
            },
            alignItems: "start",
          }}
        >
          {/* Additional Charges & Remarks Column */}
          <Stack spacing={2}>
            <Box
              sx={(theme) => ({
                ...formSectionCardSx(theme),
                borderRadius: "8px",
              })}
            >
              <Stack spacing={1.25}>
                <FormSectionHeader
                  icon={DollarSign}
                  title="Additional Charges"
                  variant="cardTop"
                />
                {detail.additionalCharges.length > 0 ? (
                  <Box
                    sx={{
                      border: `1px solid ${theme.customTokens.borders.default}`,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      overflow: "hidden",
                    }}
                  >
                    <Table size="small">
                      <TableHead>
                        <TableRow
                          sx={{
                            backgroundColor: theme.customTokens.surfaces.alt,
                          }}
                        >
                          <TableCell sx={getViewHeaderCellSx(theme)}>
                            Charge Name
                          </TableCell>
                          <TableCell
                            align="right"
                            sx={getViewHeaderCellSx(theme)}
                          >
                            Amount
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {detail.additionalCharges.map((charge, index) => (
                          <TableRow
                            key={charge.id}
                            sx={{
                              backgroundColor:
                                index % 2 === 1
                                  ? theme.customTokens.surfaces.alt
                                  : undefined,
                            }}
                          >
                            <TableCell sx={getViewBodyCellSx(theme)}>
                              {charge.chargeName}
                            </TableCell>
                            <TableCell
                              align="right"
                              sx={{
                                ...getViewBodyCellSx(theme),
                                fontVariantNumeric: "tabular-nums",
                                fontWeight: 600,
                              }}
                            >
                              {formatMoney(charge.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: theme.customTokens.text.secondary,
                    }}
                  >
                    No additional charges.
                  </Typography>
                )}
              </Stack>
            </Box>

            {/* Remarks Section */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                })}
              >
                <FormSectionHeader
                  icon={MessageSquare}
                  title="Remarks"
                  variant="cardTop"
                />
                <Box sx={{ mt: 1.5 }}>
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: theme.customTokens.text.primary,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      p: 1.5,
                      borderRadius: "6px",
                      backgroundColor: theme.customTokens.surfaces.paper,
                      border: `1px solid ${theme.customTokens.borders.default}`,
                    }}
                  >
                    {detail.remarks?.trim() || detail.remark?.trim() || "No remarks provided."}
                  </Typography>
                </Box>
              </Box>
            </Stack>

            {/* Cost Summary Column */}
            <Box
              sx={{
                ...formSectionCardSx(theme),
                borderRadius: "8px",
                backgroundColor: theme.customTokens.surfaces.alt,
              }}
            >
              <Stack spacing={1}>
                <FormSectionHeader
                  icon={Receipt}
                  title="Cost Summary"
                  variant="cardTop"
                />
                <TotalsLine
                  currency={detail.currency || undefined}
                  label="Sub Total"
                  value={invoiceSummary.subTotal}
                />
                <TotalsLine
                  currency={detail.currency || undefined}
                  label="Additional Charges"
                  value={invoiceSummary.additionalCharges}
                />
                <TotalsLine
                  currency={detail.currency || undefined}
                  label="Taxable Amount"
                  value={invoiceSummary.taxableAmount}
                />
                {invoiceSummary.gstLines.map((line) => (
                  <TotalsLine
                    key={line.label}
                    currency={detail.currency || undefined}
                    label={line.label}
                    value={line.value}
                  />
                ))}
                <Box
                  sx={{
                    borderTop: `1px solid ${theme.customTokens.borders.default}`,
                    pt: 1,
                    mt: 0.5,
                  }}
                >
                  <TotalsLine
                    currency={detail.currency || undefined}
                    emphasize
                    label="Grand Total"
                    value={invoiceSummary.total}
                  />
                </Box>
              </Stack>
            </Box>
          </Box>

        {/* Audit Information Card */}
        {(detail.createdBy || detail.updatedBy || detail.createdAt || detail.updatedAt) ? (
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
            })}
          >
            <FormSectionHeader
              icon={UserCheck}
              title="Audit Information"
              variant="cardTop"
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                columnGap: 2.5,
                rowGap: 1,
                mt: 1,
              }}
            >
              <ProfileField
                label="Created By"
                value={formatAuditUserName(detail.createdBy)}
              />
              <ProfileField
                label="Created Date"
                value={formatDisplayDateTime(detail.createdAt)}
              />
              <ProfileField
                label="Updated By"
                value={formatAuditUserName(detail.updatedBy)}
              />
              <ProfileField
                label="Updated Date"
                value={formatDisplayDateTime(detail.updatedAt)}
              />
            </Box>
          </Box>
        ) : null}
      </Stack>

      <ConfirmationDialog
        cancelLabel="Stay on Page"
        confirmLabel="Leave"
        description={leaveConfirmation.description}
        onClose={() => setLeaveConfirmation((c) => ({ ...c, open: false }))}
        onConfirm={() => {
          const act = leaveConfirmation.action;
          setLeaveConfirmation((c) => ({ ...c, open: false }));
          act();
        }}
        open={leaveConfirmation.open}
        title={leaveConfirmation.title}
        tone="default"
      />
    </InventoryPageShell>
  );
}


function ProfileField({
  label,
  value,
  isPhone = false,
  allowWrap = false,
}: {
  label: string;
  value?: string | number | null | undefined;
  isPhone?: boolean | undefined;
  allowWrap?: boolean | undefined;
}) {
  const theme = useTheme();
  const rawValue =
    value !== undefined && value !== null ? String(value).trim() : "";
  const hasValue = Boolean(rawValue);

  return (
    <Box sx={{ minWidth: 0, py: 0.1 }}>
      <Typography
        sx={{
          fontSize: "0.71875rem",
          fontWeight: 700,
          color: theme.customTokens.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.25,
          mb: 0.2,
        }}
      >
        {label}
      </Typography>

      {isPhone && hasValue ? (
        <Typography
          component="a"
          href={`tel:${rawValue.replace(/[^\d+]/g, "")}`}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: theme.customTokens.brand.primary,
            lineHeight: 1.4,
            textDecoration: "none",
            display: "inline-block",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {rawValue}
        </Typography>
      ) : (
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: hasValue
              ? theme.customTokens.text.primary
              : theme.customTokens.text.secondary,
            lineHeight: 1.4,
            whiteSpace: allowWrap ? "normal" : "nowrap",
            overflow: allowWrap ? "visible" : "hidden",
            textOverflow: allowWrap ? "clip" : "ellipsis",
          }}
        >
          {hasValue ? rawValue : "—"}
        </Typography>
      )}
    </Box>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  const theme = useTheme();

  return (
    <Stack spacing={0.35} sx={{ minWidth: 0 }}>
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: theme.customTokens.text.secondary,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: theme.customTokens.text.primary,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Stack>
  );
}

function TotalsLine({
  currency,
  emphasize = false,
  label,
  value,
}: {
  currency?: string | undefined;
  emphasize?: boolean;
  label: string;
  value: number;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography
        sx={{
          fontSize: emphasize ? "0.875rem" : "0.8125rem",
          fontWeight: emphasize ? 700 : 500,
          color: emphasize
            ? theme.palette.text.primary
            : theme.customTokens.text.secondary,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: emphasize ? "0.9375rem" : "0.8125rem",
          fontWeight: emphasize ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatMoney(value, currency)}
      </Typography>
    </Box>
  );
}

function ItemRow({
  currency,
  gstMode,
  hideQcFields = false,
  inventorySlug,
  item,
  index,
}: {
  currency?: string | undefined;
  gstMode: "intra" | "inter";
  hideQcFields?: boolean;
  inventorySlug: ApiSupportedInwardSlug;
  item: InwardItemDetail;
  index: number;
}) {
  const theme = useTheme();
  const qcLabel = normalizeQcLabel(item.qcStatus);
  const isRawVeneer = inventorySlug === "raw-veneer";
  const isSheetBased = inventorySlug === "plywood" || inventorySlug === "mdf";
  const isConsumables = inventorySlug === "consumables";

  return (
    <TableRow
      sx={{
        backgroundColor:
          index % 2 === 1 ? theme.customTokens.surfaces.alt : undefined,
      }}
    >
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.inwardItemCode || "—"}
      </TableCell>
      <TableCell sx={getViewBodyCellSx(theme)}>{item.itemName || "—"}</TableCell>
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.factoryCode || "—"}
      </TableCell>
      {isConsumables ? (
        <TableCell sx={getViewBodyCellSx(theme)}>
          {item.itemSubCategoryName || "—"}
        </TableCell>
      ) : null}
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.hsnCode || "—"}
      </TableCell>
      {isConsumables ? (
        <>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.specification || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.brandName || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.batchNo || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.quantity)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.unitName || "—"}
          </TableCell>
        </>
      ) : isRawVeneer ? (
        <>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.logCode || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.bundleNumber || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.palletNo || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.length)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.width)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.thickness)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.noOfLeaves)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.totalSqMeter)}
          </TableCell>
        </>
      ) : isSheetBased ? (
        <>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.palletNo || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.length)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.width)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.thickness)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.sheets)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.totalSqMeter)}
          </TableCell>
        </>
      ) : (
        <>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.batchNo || item.logCode || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.length)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.width)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.height)}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.cbm)}
          </TableCell>
        </>
      )}
      <TableCell sx={getViewBodyCellSx(theme)}>
        {formatMeasure(item.rate)}
      </TableCell>
      <TableCell sx={getMoneyCellSx(theme)}>
        {formatMoney(item.amount, currency)}
      </TableCell>
      {gstMode === "intra" ? (
        <>
          <TableCell sx={getMoneyCellSx(theme)}>
            {formatMoney(item.cgst, currency)}
          </TableCell>
          <TableCell sx={getMoneyCellSx(theme)}>
            {formatMoney(item.sgst, currency)}
          </TableCell>
        </>
      ) : (
        <TableCell sx={getMoneyCellSx(theme)}>
          {formatMoney(item.igst, currency)}
        </TableCell>
      )}
      <TableCell sx={{ ...getMoneyCellSx(theme), fontWeight: 700 }}>
        {formatMoney(item.totalAmount, currency)}
      </TableCell>
      {!hideQcFields ? (
        <TableCell sx={getViewBodyCellSx(theme)}>
          <Chip
            label={qcLabel}
            color={qcChipColor(qcLabel)}
            size="small"
            sx={{ fontWeight: 600, height: 22 }}
          />
        </TableCell>
      ) : null}
      <TableCell sx={{ ...getViewBodyCellSx(theme), fontWeight: 600, color: theme.customTokens.text.primary }}>
        {item.availableStock !== undefined && item.availableStock !== null
          ? formatMeasure(item.availableStock)
          : "—"}
      </TableCell>
      {!hideQcFields ? (
        <>
          <TableCell sx={{ ...getViewBodyCellSx(theme), fontWeight: 600, color: item.rejectedStock ? "error.main" : theme.customTokens.text.secondary }}>
            {item.rejectedStock !== undefined && item.rejectedStock !== null
              ? formatMeasure(item.rejectedStock)
              : "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.qcRemark?.trim() || "—"}
          </TableCell>
          <TableCell sx={{ ...getViewBodyCellSx(theme), whiteSpace: "normal" }}>
            <AttachmentPreview
              compact
              url={item.qcAttachmentUrl}
              title="QC Attachment"
            />
          </TableCell>
        </>
      ) : null}
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.remark?.trim() || "—"}
      </TableCell>
    </TableRow>
  );
}

function getViewHeaderCellSx(theme: Theme) {
  return {
    fontSize: "0.6875rem",
    fontWeight: 700,
    letterSpacing: "0.03em",
    textTransform: "uppercase" as const,
    color: theme.customTokens.text.secondary,
    whiteSpace: "nowrap" as const,
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    py: 1,
  };
}

function getViewBodyCellSx(theme: Theme) {
  return {
    fontSize: "0.8125rem",
    color: theme.customTokens.text.primary,
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
    py: 1.1,
    whiteSpace: "nowrap" as const,
  };
}

function getMoneyCellSx(theme: Theme) {
  return {
    ...getViewBodyCellSx(theme),
    fontVariantNumeric: "tabular-nums" as const,
    fontWeight: 600,
    textAlign: "right" as const,
  };
}
