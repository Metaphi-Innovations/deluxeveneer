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
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  Building2,
  Calendar,
  ChevronLeft,
  FileSpreadsheet,
  Layers,
  MessageSquare,
  Package2,
  Receipt,
  Save,
  Tag,
  UserCheck,
} from "lucide-react";
import { useNavigate } from "react-router";

import { ContentLoader } from "../../../../components/feedback/ContentLoader";
import { InventoryPageShell } from "../../../inventory/shared/InventoryPageShell";
import { MasterSectionCard } from "../../../masters/shared";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  fetchProductionInventoryById,
  updateProductionInventoryApi,
  type ProductionInventoryItem,
} from "../api/productionWarehouseApi";
import { invalidateWarehouseProduction } from "../../../../query/queryClient";

function formatDateDisplay(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const raw =
    typeof value === "string"
      ? value.slice(0, 10)
      : value.toISOString().slice(0, 10);
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function display(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  return String(value);
}

interface ProductionInventoryRecordPageProps {
  inventoryId: string;
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
  listPath: string;
  inventorySlug: string;
  mode: "view" | "edit";
  editPath?: string;
}

export function ProductionInventoryRecordPage({
  inventoryId,
  warehouseId,
  warehouseName,
  warehouseRootPath,
  listPath,
  inventorySlug,
  mode,
}: ProductionInventoryRecordPageProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<ProductionInventoryItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [remark, setRemark] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resolvedWarehouseId =
    warehouseId ||
    (typeof detail?.warehouseId === "string" ? detail.warehouseId : "") ||
    "";
  const resolvedWarehouseName =
    (warehouseName && warehouseName !== "Warehouse"
      ? warehouseName
      : typeof detail?.warehouseName === "string" && detail.warehouseName
        ? detail.warehouseName
        : warehouseName) || "Warehouse";
  const resolvedWarehouseRootPath = resolvedWarehouseId
    ? `/warehouses/${resolvedWarehouseId}`
    : warehouseRootPath;
  useEffect(() => {
    let ignore = false;
    async function load() {
      setIsLoading(true);
      setErrorMessage("");
      try {
        const item = await fetchProductionInventoryById(inventoryId);
        if (!ignore) {
          setDetail(item);
          setRemark(String(item.remark ?? ""));
        }
      } catch (error) {
        if (!ignore) {
          setDetail(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load production inventory record.",
          );
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }
    void load();
    return () => {
      ignore = true;
    };
  }, [inventoryId]);

  const inventoryLabel =
    inventorySlug === "plywood"
      ? "Plywood"
      : inventorySlug === "mdf"
        ? "MDF"
        : "Raw Veneer";

  const headerFields = useMemo(() => {
    if (!detail) return [];
    return [
      { label: "Storage Sr No", value: display(detail.storageSrNo) },
      { label: "Inward Date", value: formatDateDisplay(detail.inwardDate) },
      { label: "Inventory Type", value: inventoryLabel },
      { label: "Grade", value: display(detail.grade) },
      { label: "Currency", value: display(detail.currency) },
      {
        label: "Total Amount",
        value: display(detail.totalAmount ?? detail.amount),
      },
      { label: "Warehouse", value: display(resolvedWarehouseName) },
      { label: "Updated By", value: display(detail.updatedBy) },
    ];
  }, [detail, inventoryLabel, resolvedWarehouseName]);

  const itemTableHeaders = useMemo(() => {
    if (inventorySlug === "plywood") {
      return [
        "Inward Item Code",
        "Item Name",
        "Factory Code",
        "Sub Category",
        "Color",
        "L",
        "W",
        "Thk",
        "Sheets",
        "SQM",
        "SQF",
        "Grade",
        "Currency",
        "Amount",
        "Total",
        "Remark",
      ];
    }
    if (inventorySlug === "mdf") {
      return [
        "Inward Item Code",
        "Item Name",
        "Factory Code",
        "MDF Type",
        "L",
        "W",
        "Thk",
        "Sheets",
        "SQM",
        "SQF",
        "Grade",
        "Currency",
        "Amount",
        "Total",
        "Remark",
      ];
    }
    return [
      "Inward Item Code",
      "Item Name",
      "Factory Code",
      "Sub Category",
      "L",
      "W",
      "Thk",
      "Leaves",
      "SQM",
      "SQF",
      "Grade",
      "Currency",
      "Amount",
      "Total",
      "Remark",
    ];
  }, [inventorySlug]);

  const handleSave = async () => {
    if (!detail || isSaving) return;
    setIsSaving(true);
    setErrorMessage("");
    try {
      const updated = await updateProductionInventoryApi(inventoryId, {
        remark: remark.trim() || null,
      });
      setDetail(updated);
      void invalidateWarehouseProduction();
      navigate(listPath, { replace: true });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to update production inventory record.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const closeForm = () => {
    navigate(listPath, { replace: true, flushSync: true });
  };

  const headerActions = (
    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
      <Button
        variant="outlined"
        startIcon={<ChevronLeft size={16} />}
        onClick={closeForm}
        sx={recordViewActionButtonSx}
      >
        Back
      </Button>
      {mode === "edit" ? (
        <Button
          variant="contained"
          startIcon={<Save size={16} />}
          disabled={isSaving}
          onClick={() => void handleSave()}
          sx={recordFormActionButtonSx}
        >
          {isSaving ? "Saving..." : "Save"}
        </Button>
      ) : null}
    </Stack>
  );

  if (isLoading) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: resolvedWarehouseName, to: resolvedWarehouseRootPath },
          { label: "View Stock" },
        ]}
        title={mode === "edit" ? "Edit Stock" : "View Stock"}
        subtitle="Review production stock details."
      >
        <MasterSectionCard>
          <ContentLoader label="Loading production stock..." minHeight={220} />
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (!detail) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: resolvedWarehouseName, to: resolvedWarehouseRootPath },
          { label: "View Stock" },
        ]}
        title={mode === "edit" ? "Edit Stock" : "View Stock"}
      >
        <MasterSectionCard>
          <Alert severity="error">
            {errorMessage ||
              "The requested production inventory record could not be found."}
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
        { label: resolvedWarehouseName, to: resolvedWarehouseRootPath },
        { label: mode === "edit" ? "Edit Stock" : "View Stock" },
      ]}
      title={mode === "edit" ? "Edit Stock" : "View Stock"}
      subtitle="Review production stock details."
      actions={headerActions}
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
                  {detail.storageSrNo ? `Storage Sr No: ${detail.storageSrNo}` : (detail.itemName || "Production Stock")}
                </Typography>
                {detail.productionSrNo ? (
                  <Chip
                    label={`Prod #${detail.productionSrNo}`}
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
                sx={{ mt: 0.25, flexWrap: "wrap", gap: 0.75 }}
              >
                {detail.itemName ? (
                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                    }}
                  >
                    Item: {detail.itemName}
                  </Typography>
                ) : null}

                {inventoryLabel ? (
                  <Chip
                    label={inventoryLabel}
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

                {detail.grade ? (
                  <Chip
                    label={`Grade: ${detail.grade}`}
                    size="small"
                    sx={{
                      height: 22,
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      backgroundColor: theme.customTokens.brand.primaryScale[100],
                      color: theme.customTokens.brand.primary,
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

          <Chip
            label={display(resolvedWarehouseName)}
            size="small"
            sx={{
              alignSelf: { xs: "flex-start", sm: "center" },
              height: 24,
              fontSize: "0.75rem",
              fontWeight: 600,
              backgroundColor: theme.customTokens.surfaces.paper,
              border: `1px solid ${theme.customTokens.borders.default}`,
              color: theme.customTokens.text.primary,
            }}
          />
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
          {/* Production & Item Identification Card */}
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
              title="Stock Identification"
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
              <ProfileField label="Storage Sr No" value={detail.storageSrNo} />
              <ProfileField label="Item Name" value={detail.itemName} />
              <ProfileField label="Factory Code" value={detail.factoryCode} />
              <ProfileField label="Inward Item Code" value={detail.inwardItemCode} />
              <ProfileField label="Sub Category" value={detail.subCategory || detail.mdfType} />
              <ProfileField label="Warehouse" value={resolvedWarehouseName} />
            </Box>
          </Box>

          {/* Classification & Financial Details Card */}
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              borderRadius: "8px",
              display: "flex",
              flexDirection: "column",
            })}
          >
            <FormSectionHeader
              icon={Tag}
              title="Classification & Financials"
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
              <ProfileField label="Grade" value={detail.grade} />
              <ProfileField label="Inventory Type" value={inventoryLabel} />
              <ProfileField label="Currency" value={detail.currency} />
              <ProfileField label="Amount" value={detail.amount ? String(detail.amount) : undefined} />
              <ProfileField label="Total Amount" value={detail.totalAmount ?? detail.amount ? String(detail.totalAmount ?? detail.amount) : undefined} />
            </Box>
          </Box>
        </Box>

        {/* Item Details Table Card */}
        <Box
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            borderRadius: "8px",
          })}
        >
          <Stack spacing={1.25}>
            <FormSectionHeader
              icon={FileSpreadsheet}
              title="Item Dimensions & Quantity"
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
                        <TableCell key={label} sx={getViewHeaderCellSx(theme)}>
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.inwardItemCode)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.itemName)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.factoryCode)}
                      </TableCell>
                      {inventorySlug === "mdf" ? (
                        <TableCell sx={getViewBodyCellSx(theme)}>
                          {display(detail.mdfType)}
                        </TableCell>
                      ) : (
                        <TableCell sx={getViewBodyCellSx(theme)}>
                          {display(detail.subCategory)}
                        </TableCell>
                      )}
                      {inventorySlug === "plywood" ? (
                        <TableCell sx={getViewBodyCellSx(theme)}>
                          {display(detail.color)}
                        </TableCell>
                      ) : null}
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.length)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.width)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.thickness)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {inventorySlug === "plywood" || inventorySlug === "mdf"
                          ? display(detail.noOfSheets ?? detail.totalNoOfSheets)
                          : display(detail.noOfLeaves)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.sqm ?? detail.totalSqm)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.sqf ?? detail.totalSqf)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.grade)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.currency)}
                      </TableCell>
                      <TableCell sx={getMoneyCellSx(theme)}>
                        {display(detail.amount)}
                      </TableCell>
                      <TableCell
                        sx={{ ...getMoneyCellSx(theme), fontWeight: 700 }}
                      >
                        {display(detail.totalAmount ?? detail.amount)}
                      </TableCell>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.remark)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Stack>
        </Box>

        {/* Remarks and Cost Summary Grid */}
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
            },
            alignItems: "stretch",
          }}
        >
          {/* Remarks Card */}
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
              {mode === "edit" ? (
                <TextField
                  fullWidth
                  multiline
                  minRows={4}
                  value={remark}
                  onChange={(event) => setRemark(event.target.value)}
                  placeholder="Add remark"
                />
              ) : (
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
                    minHeight: 88,
                  }}
                >
                  {display(detail.remark)}
                </Typography>
              )}
            </Box>
          </Box>

          {/* Amount Summary Card */}
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
                title="Amount Summary"
                variant="cardTop"
              />
              <TotalsLine label="Amount" value={display(detail.amount)} />
              <Box
                sx={{
                  borderTop: `1px solid ${theme.customTokens.borders.default}`,
                  pt: 1,
                  mt: 0.5,
                }}
              >
                <TotalsLine
                  emphasize
                  label="Total Amount"
                  value={display(detail.totalAmount ?? detail.amount)}
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
                value={display(detail.createdBy)}
              />
              <ProfileField
                label="Created Date"
                value={formatDisplayDateTime(detail.createdAt)}
              />
              <ProfileField
                label="Updated By"
                value={display(detail.updatedBy)}
              />
              <ProfileField
                label="Updated Date"
                value={formatDisplayDateTime(detail.updatedAt)}
              />
            </Box>
          </Box>
        ) : null}
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
  const hasValue = Boolean(rawValue && rawValue !== "—");

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
  value: string;
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
        {value}
      </Typography>
    </Box>
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
  };
}
