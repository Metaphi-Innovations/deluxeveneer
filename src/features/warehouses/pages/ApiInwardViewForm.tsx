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
import { useNavigate } from "react-router";

import { MasterSectionCard } from "../../masters/shared";
import { getInwardGstMode } from "../../masters/shared/masterDefinitions";
import { canAccessPermission } from "../../permissions";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";
import { InventoryPageShell } from "../../inventory/shared/InventoryPageShell";
import {
  fetchInwardById,
  type InwardDetail,
  type InwardItemDetail,
} from "../api/inwardApi";
import {
  slugFromInventoryTypeLabel,
  type ApiSupportedInwardSlug,
} from "../inward/supportedInwardTypes";

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

function formatMoney(value: number | null | undefined): string {
  return formatAmountShared(value ?? 0);
}

function formatMeasure(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
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
  const canEdit = canAccessPermission(
    getDynamicWarehousePermissionKey(warehouseId),
    "edit",
  );
  const [detail, setDetail] = useState<InwardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const result = await fetchInwardById(inwardId);
        if (!ignore) {
          setDetail(result);
        }
      } catch (error) {
        if (!ignore) {
          setDetail(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load inward record.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [inwardId]);

  const overallQc = useMemo(
    () => normalizeQcLabel(detail?.qcStatus),
    [detail?.qcStatus],
  );

  const gstMode = useMemo(
    () =>
      getInwardGstMode(
        detail?.warehouseState ?? "",
        detail?.supplierState ?? "",
      ),
    [detail?.supplierState, detail?.warehouseState],
  );

  const inventorySlug = useMemo(
    () => slugFromInventoryTypeLabel(detail?.inventoryType),
    [detail?.inventoryType],
  );

  const itemTableHeaders = useMemo(() => {
    const taxHeaders =
      gstMode === "inter" ? (["IGST"] as const) : (["CGST", "SGST"] as const);

    if (inventorySlug === "raw-veneer") {
      return [
        "Item Name",
        "Sub Category",
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
        "QC",
        "QC Remark",
        "Remark",
      ];
    }

    if (inventorySlug === "plywood") {
      return [
        "Item Name",
        "Sub Category",
        "HSN",
        "Batch No",
        "Pallet",
        "L",
        "W",
        "Thk",
        "Sheets",
        "SQM",
        "Rate",
        "Amount",
        ...taxHeaders,
        "Total",
        "QC",
        "QC Remark",
        "Remark",
      ];
    }

    return [
      "Item Name",
      "Sub Category",
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
      "QC",
      "QC Remark",
      "Remark",
    ];
  }, [gstMode, inventorySlug]);

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
      {
        label: "Attachment",
        value: detail.attachmentUrl?.trim() ? detail.attachmentUrl : "—",
      },
      { label: "Inward Type", value: detail.inventoryType || "—" },
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
        subtitle="Review supplier invoice and inward stock details."
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            Loading inward record...
          </Typography>
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
      subtitle="Review supplier invoice and inward stock details."
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
          {canEdit ? (
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
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 0.75,
              minWidth: 120,
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
            <Chip
              label={overallQc}
              color={qcChipColor(overallQc)}
              size="small"
              sx={{ width: "fit-content", fontWeight: 600 }}
            />
          </Box>
          <SummaryMetric
            emphasize
            label="Grand Total"
            value={formatMoney(detail.grandTotal)}
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
                        gstMode={gstMode}
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

        <Box sx={formSectionCardSx(theme)}>
          <Stack spacing={1.25}>
            <FormSectionHeader title="Other Consumables" />
            {detail.otherConsumables.length > 0 ? (
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
                        Consumable Name
                      </TableCell>
                      <TableCell
                        align="right"
                        sx={getViewHeaderCellSx(theme)}
                      >
                        Price
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {detail.otherConsumables.map((row, index) => (
                      <TableRow
                        key={row.id}
                        sx={{
                          backgroundColor:
                            index % 2 === 1
                              ? theme.customTokens.surfaces.alt
                              : undefined,
                        }}
                      >
                        <TableCell sx={getViewBodyCellSx(theme)}>
                          {row.consumableName}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            ...getViewBodyCellSx(theme),
                            fontVariantNumeric: "tabular-nums",
                            fontWeight: 600,
                          }}
                        >
                          {formatMoney(row.price)}
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
                No other consumables.
              </Typography>
            )}
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

              <Box sx={{ pt: 0.5, maxWidth: 360, minHeight: 120 }}>
                <FormSectionHeader title="Remark" />
                <Typography
                  sx={{
                    mt: 0.75,
                    fontSize: "0.8125rem",
                    color: theme.customTokens.text.primary,
                    whiteSpace: "pre-wrap",
                    minHeight: 88,
                  }}
                >
                  {detail.remarks?.trim() || detail.remark?.trim() || "—"}
                </Typography>
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
              <TotalsLine label="Item Sub Total" value={detail.itemSubTotal} />
              {gstMode === "intra" ? (
                <>
                  <TotalsLine label="CGST" value={detail.cgstTotal} />
                  <TotalsLine label="SGST" value={detail.sgstTotal} />
                </>
              ) : (
                <TotalsLine label="IGST" value={detail.igstTotal} />
              )}
              <TotalsLine
                label="Other Consumables"
                value={detail.otherConsumablesTotal}
              />
              <TotalsLine
                label="Additional Charges"
                value={detail.additionalChargesTotal}
              />
              <Box
                sx={{
                  borderTop: `1px solid ${theme.customTokens.borders.default}`,
                  pt: 0.85,
                  mt: 0.25,
                }}
              >
                <TotalsLine
                  emphasize
                  label="Grand Total"
                  value={detail.grandTotal}
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
  emphasize = false,
  label,
  value,
}: {
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
        {formatMoney(value)}
      </Typography>
    </Box>
  );
}

function ItemRow({
  gstMode,
  inventorySlug,
  item,
  index,
}: {
  gstMode: "intra" | "inter";
  inventorySlug: ApiSupportedInwardSlug;
  item: InwardItemDetail;
  index: number;
}) {
  const theme = useTheme();
  const qcLabel = normalizeQcLabel(item.qcStatus);
  const isRawVeneer = inventorySlug === "raw-veneer";
  const isPlywood = inventorySlug === "plywood";

  return (
    <TableRow
      sx={{
        backgroundColor:
          index % 2 === 1 ? theme.customTokens.surfaces.alt : undefined,
      }}
    >
      <TableCell sx={getViewBodyCellSx(theme)}>{item.itemName || "—"}</TableCell>
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.itemSubCategoryName || "—"}
      </TableCell>
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.hsnCode || "—"}
      </TableCell>
      {isRawVeneer ? (
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
      ) : isPlywood ? (
        <>
          <TableCell sx={getViewBodyCellSx(theme)}>
            {item.batchNo || "—"}
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
        {formatMoney(item.amount)}
      </TableCell>
      {gstMode === "intra" ? (
        <>
          <TableCell sx={getMoneyCellSx(theme)}>
            {formatMoney(item.cgst)}
          </TableCell>
          <TableCell sx={getMoneyCellSx(theme)}>
            {formatMoney(item.sgst)}
          </TableCell>
        </>
      ) : (
        <TableCell sx={getMoneyCellSx(theme)}>
          {formatMoney(item.igst)}
        </TableCell>
      )}
      <TableCell sx={{ ...getMoneyCellSx(theme), fontWeight: 700 }}>
        {formatMoney(item.totalAmount)}
      </TableCell>
      <TableCell sx={getViewBodyCellSx(theme)}>
        <Chip
          label={qcLabel}
          color={qcChipColor(qcLabel)}
          size="small"
          sx={{ fontWeight: 600, height: 22 }}
        />
      </TableCell>
      <TableCell sx={getViewBodyCellSx(theme)}>
        {item.qcRemark?.trim() || "—"}
      </TableCell>
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
