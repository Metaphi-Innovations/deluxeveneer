import { useEffect, useMemo, useState } from "react";
import {
  Alert,
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
import { ChevronLeft, Pencil } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import { MasterSectionCard } from "../../masters/shared";
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
        "HSN",
        "Unit",
        "Qty",
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
      "Batch No",
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

  const closeForm = () => {
    navigate(listPath, { replace: true, flushSync: true });
  };

  if (isLoading) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: warehouseName, to: warehouseRootPath },
          { label: "View Stock" },
        ]}
        title="View Stock"
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
          { label: "View Stock" },
        ]}
        title="View Stock"
      >
        <MasterSectionCard>
          <Alert severity="error">
            {errorMessage || "The requested inward record could not be found."}
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={closeForm}>
              Back
            </Button>
          </Box>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  return (
    <InventoryPageShell
      breadcrumbs={[
        { label: "Warehouses" },
        { label: warehouseName, to: warehouseRootPath },
        { label: "View Stock" },
      ]}
      subtitle=" "
      title="View Stock"
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            variant="outlined"
            startIcon={<ChevronLeft size={16} />}
            onClick={closeForm}
            sx={recordViewActionButtonSx}
          >
            Back
          </Button>
          {canEdit && !editLocked ? (
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

        <Box
          sx={{
            ...formSectionCardSx(theme),
            display: "flex",
            flexWrap: "wrap",
            alignItems: "stretch",
            gap: 2,
            px: 2,
            py: 1.75,
          }}
        >
          <Stack spacing={0.5} sx={{ flex: "1 1 220px", minWidth: 0 }}>
            <Typography
              sx={{
                fontSize: "0.6875rem",
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: theme.customTokens.text.secondary,
              }}
            >
              Inward Sr No
            </Typography>
            <Typography
              sx={{
                fontSize: "1.25rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                color: theme.customTokens.text.primary,
              }}
            >
              {detail.inwardSrNo || "—"}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: theme.customTokens.text.secondary,
              }}
            >
              {detail.supplierName || "—"} · Invoice {detail.invoiceNo || "—"}
            </Typography>
          </Stack>

          <SummaryMetric
            label="Inward Date"
            value={formatDateDisplay(detail.inwardDate)}
          />
          <SummaryMetric label="Currency" value={detail.currency || "—"} />
          {!isStorageWarehouseView ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                gap: 0.5,
                minWidth: 140,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  textTransform: "uppercase",
                  color: theme.customTokens.text.secondary,
                }}
              >
                QC Status
              </Typography>
              <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                <Chip
                  label={`${qcCounts.passCount} Pass`}
                  size="small"
                  variant="outlined"
                  color="success"
                  sx={{
                    height: 22,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    "& .MuiChip-label": { px: 0.85 },
                  }}
                />
                <Chip
                  label={`${qcCounts.failCount} Fail`}
                  size="small"
                  variant="outlined"
                  color="error"
                  sx={{
                    height: 22,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    "& .MuiChip-label": { px: 0.85 },
                  }}
                />
              </Stack>
            </Box>
          ) : null}
          <SummaryMetric
            emphasize
            label="Total"
            value={formatMoney(invoiceSummary.total)}
          />
        </Box>

        <Box sx={formSectionCardSx(theme)}>
          <Stack spacing={1.25}>
            <FormSectionHeader title="Inward Details" />
            <Box
              sx={{
                display: "grid",
                gap: 1.5,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(3, minmax(0, 1fr))",
                  lg: "repeat(5, minmax(0, 1fr))",
                },
              }}
            >
              {headerFields.map((field) => (
                <DetailField
                  key={field.label}
                  label={field.label}
                  value={field.value}
                />
              ))}
              <Stack spacing={0.35} sx={{ minWidth: 0, gridColumn: { xs: "1", sm: "span 2", md: "span 1", lg: "span 2" } }}>
                <Typography
                  sx={{
                    fontSize: "0.6875rem",
                    fontWeight: 600,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                    color: theme.customTokens.text.secondary,
                  }}
                >
                  Attachment
                </Typography>
                <AttachmentPreview
                  url={detail.attachmentUrl}
                  title="Inward Attachment"
                />
              </Stack>
            </Box>
          </Stack>
        </Box>

        <Box sx={formSectionCardSx(theme)}>
          <Stack spacing={1.25}>
            <FormSectionHeader title="Item Details" />
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
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(0, 1fr) minmax(260px, 320px)",
            },
            alignItems: "start",
          }}
        >
          <Box sx={formSectionCardSx(theme)}>
            <Stack spacing={1.25}>
              <FormSectionHeader title="Additional Charges" />
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
                        Remark
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell
                        sx={{
                          ...getViewBodyCellSx(theme),
                          verticalAlign: "top",
                        }}
                      >
                        <Box
                          sx={{
                            minHeight: 88,
                            whiteSpace: "pre-wrap",
                            fontSize: "0.8125rem",
                          }}
                        >
                          {detail.remarks?.trim() || detail.remark?.trim() || "—"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </Box>

          <Box
            sx={{
              ...formSectionCardSx(theme),
              backgroundColor: theme.customTokens.surfaces.alt,
            }}
          >
            <Stack spacing={0.85}>
              <Typography
                sx={{
                  mb: 0.5,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  color: theme.customTokens.text.secondary,
                }}
              >
                Cost Summary
              </Typography>
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
                  pt: 0.85,
                  mt: 0.25,
                }}
              >
                <TotalsLine
                  currency={detail.currency || undefined}
                  emphasize
                  label="Total"
                  value={invoiceSummary.total}
                />
              </Box>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </InventoryPageShell>
  );
}

function SummaryMetric({
  emphasize = false,
  label,
  value,
}: {
  emphasize?: boolean;
  label: string;
  value: string;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        gap: 0.35,
        minWidth: emphasize ? 140 : 110,
      }}
    >
      <Typography
        sx={{
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: theme.customTokens.text.secondary,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: emphasize ? "1.125rem" : "0.9375rem",
          fontWeight: emphasize ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
          color: theme.customTokens.text.primary,
          lineHeight: 1.25,
        }}
      >
        {value}
      </Typography>
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
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.hsnCode || "—"}
      </TableCell>
      {isConsumables ? (
        <>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.unitName || "—"}
          </TableCell>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {formatMeasure(item.quantity)}
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
            {item.batchNo || "—"}
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
