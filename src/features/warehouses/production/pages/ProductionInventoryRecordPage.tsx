import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate } from "react-router";

import { ContentLoader } from "../../../../components/feedback/ContentLoader";
import { InventoryPageShell } from "../../../inventory/shared/InventoryPageShell";
import { MasterSectionCard } from "../../../masters/shared";
import { canAccessPermission } from "../../../permissions";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { getDynamicWarehousePermissionKey } from "../../../shared/warehousePermission";
import {
  fetchProductionInventoryById,
  updateProductionInventoryApi,
  type ProductionInventoryItem,
} from "../api/productionWarehouseApi";

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
  editPath,
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
  const permissionKey = getDynamicWarehousePermissionKey(resolvedWarehouseId);
  const canEdit = resolvedWarehouseId
    ? canAccessPermission(permissionKey, "edit")
    : false;

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
      { label: "Production Sr No", value: display(detail.productionSrNo) },
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
        "Item Name",
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
        "Item Name",
        "MDF Type",
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
    }
    return [
      "Item Name",
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
      {mode === "view" && canEdit && editPath ? (
        <Button
          variant="contained"
          startIcon={<Pencil size={16} />}
          onClick={() => navigate(editPath)}
          sx={recordViewActionButtonSx}
        >
          Edit
        </Button>
      ) : null}
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
              Production Sr No
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
              {display(detail.productionSrNo)}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: theme.customTokens.text.secondary,
              }}
            >
              {display(detail.itemName)} · Storage{" "}
              {display(detail.storageSrNo)}
            </Typography>
          </Stack>

          <SummaryMetric
            label="Inward Date"
            value={formatDateDisplay(detail.inwardDate)}
          />
          <SummaryMetric label="Currency" value={display(detail.currency)} />
          <SummaryMetric label="Grade" value={display(detail.grade)} />
          <SummaryMetric
            emphasize
            label="Total Amount"
            value={display(detail.totalAmount ?? detail.amount)}
          />
        </Box>

        <Box sx={formSectionCardSx(theme)}>
          <Stack spacing={1.25}>
            <FormSectionHeader title="Production Details" />
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
                        <TableCell key={label} sx={getViewHeaderCellSx(theme)}>
                          {label}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={getViewBodyCellSx(theme)}>
                        {display(detail.itemName)}
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
                        {inventorySlug === "plywood"
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

        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 1.4fr) minmax(280px, 0.8fr)",
            },
            alignItems: "stretch",
          }}
        >
          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              backgroundColor: theme.customTokens.surfaces.surface,
              overflow: "hidden",
            })}
          >
            <Box
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                height: 34,
                minHeight: 34,
                px: 1.75,
                backgroundColor: theme.customTokens.surfaces.paper,
                borderBottom: `1px solid ${theme.customTokens.borders.default}`,
              })}
            >
              <Typography
                component="h3"
                sx={(theme) => ({
                  m: 0,
                  color: theme.customTokens.neutrals[900],
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                })}
              >
                Remark
              </Typography>
            </Box>
            <Box sx={{ px: 1.75, py: 1.5 }}>
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
                    fontSize: "0.8125rem",
                    color: theme.customTokens.text.primary,
                    whiteSpace: "pre-wrap",
                    minHeight: 88,
                  }}
                >
                  {display(detail.remark)}
                </Typography>
              )}
            </Box>
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
                Amount Summary
              </Typography>
              <TotalsLine label="Amount" value={display(detail.amount)} />
              <Box
                sx={{
                  borderTop: `1px solid ${theme.customTokens.borders.default}`,
                  pt: 0.85,
                  mt: 0.25,
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
