import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
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
import { Pencil, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";

import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../../shared/buttonStyles";
import {
  formInlineActionButtonSx,
  plainFormSectionHeadingSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { canMutateFactorySawing } from "../../../permissions";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import {
  buildSawingAvailableValues,
  getSawingAvailableCbmIssue,
  getSawingCreateSubmitError,
  getSawingProcessDetailError,
  lockSawingProcessDetailValues,
  readSawingSourceMeasures,
  saveSawingEditProcess,
  sumSawingLineCbm,
} from "../sawingCreateRules";
import {
  getSawingDoneEditBlockReason,
  getSawingEditContext,
  listSawingFlowRows,
} from "../sawingFrontendStore";
import { sawingDefinition } from "../../shared";
import {
  getNextRejectAvailableValues,
  getRejectAvailableValidationErrors,
  getVisibleRejectAvailableValidationIssues,
  hasRejectAvailableValidationErrors,
  RejectAvailableDetailsTable,
  resolveRejectAvailableAreaLimits,
} from "../../shared/RejectAvailableDetailsTable";

type SawingRow = Record<string, any>;

type EditLineItem = {
  id: string;
  values: Record<string, string>;
};

const itemFields = [
  { key: "batchNoCode", label: "Batch No", readOnly: false },
  { key: "length", label: "Length", readOnly: true },
  { key: "width", label: "Width", readOnly: false },
  { key: "thickness", label: "Thickness", readOnly: false },
  { key: "cbm", label: "CBM", readOnly: true },
  { key: "cbf", label: "CBF", readOnly: true },
  { key: "remark", label: "Remark", readOnly: false },
] as const;

function text(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  return typeof value === "string" ? value.trim() : "";
}

function decimal(value: unknown, digits = 3) {
  const parsed = Number(text(value));
  if (!Number.isFinite(parsed)) return text(value) || "-";
  return parsed.toFixed(digits).replace(/\.?0+$/u, "");
}

function readDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildItemValues(row: SawingRow, sourceRow: SawingRow) {
  return lockSawingProcessDetailValues(
    {
      logNo: text(row.logNo || row.batchNoCode || row.batchNo),
      batchNoCode: text(row.batchNoCode || row.logNo || row.batchNo),
      length: text(row.length || sourceRow.length),
      width: text(row.width || sourceRow.width),
      thickness: text(row.thickness || row.height),
      cbm: text(row.cbm),
      cbf: text(row.cbf),
      remark: text(row.remark),
      receivedCbm: text(sourceRow.receivedCbm),
      availableCbm: text(sourceRow.availableCbm),
    },
    sourceRow,
  );
}

export function SawingEditPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ id: string }>();
  const locationRecord = (location.state as { record?: SawingRow } | null)
    ?.record;
  const selectedRow = useMemo(
    () =>
      locationRecord ??
      listSawingFlowRows(
        "done",
        sawingDefinition.rows as readonly SawingRow[],
      ).find((row) => String(row.id) === params.id),
    [locationRecord, params.id],
  );
  const editContext = useMemo(
    () =>
      selectedRow
        ? getSawingEditContext(
            selectedRow,
            sawingDefinition.rows as readonly SawingRow[],
          )
        : null,
    [selectedRow],
  );
  const sourceRow = editContext?.sourceRow as SawingRow | undefined;
  const initialItems = useMemo(
    () =>
      editContext && sourceRow
        ? editContext.rows.map((row) => ({
            id: String(row.id),
            values: buildItemValues(row, sourceRow),
          }))
        : [],
    [editContext, sourceRow],
  );
  const [lineItems, setLineItems] = useState<EditLineItem[]>(initialItems);
  const [editingRowId, setEditingRowId] = useState<string | null>(
    selectedRow ? String(selectedRow.id) : null,
  );
  const [editingValues, setEditingValues] = useState<Record<string, string>>(
    () =>
      selectedRow && sourceRow ? buildItemValues(selectedRow, sourceRow) : {},
  );
  const [sawingDate, setSawingDate] = useState<Date | null>(() =>
    readDate(selectedRow?.sawingDate || selectedRow?.processDate),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    setLineItems(initialItems);
  }, [initialItems]);

  const projectedItems = useMemo(
    () =>
      lineItems.map((item) =>
        item.id === editingRowId
          ? {
              ...item,
              values: lockSawingProcessDetailValues(editingValues, sourceRow),
            }
          : item,
      ),
    [editingRowId, editingValues, lineItems, sourceRow],
  );
  const sourceMeasures = useMemo(
    () => readSawingSourceMeasures(sourceRow),
    [sourceRow],
  );
  const processedCbm = useMemo(
    () => sumSawingLineCbm(projectedItems, sourceMeasures),
    [projectedItems, sourceMeasures],
  );
  const [availableValues, setAvailableValues] = useState(() =>
    buildSawingAvailableValues(sourceRow, initialItems),
  );

  useEffect(() => {
    setAvailableValues((current) => ({
      ...buildSawingAvailableValues(sourceRow, projectedItems),
      remark: current.remark,
    }));
  }, [projectedItems, sourceRow]);

  if (!selectedRow || !editContext || !sourceRow) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: "Sawing", to: "/factory/sawing?tab=done" },
          { label: "Edit" },
        ]}
        title="Edit Sawing"
      >
        <Alert severity="warning">
          The selected Sawing Done record was not found.
        </Alert>
      </FactoryPageShell>
    );
  }

  const editBlockReason = getSawingDoneEditBlockReason(selectedRow);
  if (editBlockReason) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: "Sawing", to: "/factory/sawing?tab=done" },
          { label: "Edit" },
        ]}
        title="Edit Sawing"
      >
        <Alert severity="warning">{editBlockReason}</Alert>
      </FactoryPageShell>
    );
  }

  const sourceOverviewItems = [
    { label: "Storage Sr No.", value: text(sourceRow.storageSrNo) || "-" },
    {
      label: "Issue Date",
      value: text(sourceRow.issueDate || sourceRow.issuedDate) || "-",
    },
    { label: "Item Name", value: text(sourceRow.itemName) || "-" },
    {
      label: "Sub Category",
      value: text(sourceRow.subCategory || sourceRow.itemSubCategory) || "-",
    },
    {
      label: "Log No.",
      value: text(sourceRow.batchNo || sourceRow.logNo) || "-",
    },
    { label: "Source Length", value: decimal(sourceRow.length) },
    { label: "Source Width", value: decimal(sourceRow.width) },
    { label: "Source Height", value: decimal(sourceRow.height) },
    { label: "Source CBM", value: decimal(sourceRow.receivedCbm) },
    {
      label: "Warehouse",
      value:
        text(
          sourceRow.storageWarehouseName ||
            sourceRow.warehouseName ||
            sourceRow.warehouse,
        ) || "-",
    },
  ];
  const editError = editingRowId
    ? getSawingProcessDetailError({
        otherProcessedCbm: sumSawingLineCbm(
          projectedItems.filter((row) => row.id !== editingRowId),
          sourceMeasures,
        ),
        source: sourceMeasures,
        values: editingValues,
      })
    : "";
  const availableIssues = {
    ...getRejectAvailableValidationErrors(
      availableValues,
      resolveRejectAvailableAreaLimits(sourceRow),
    ),
    ...getSawingAvailableCbmIssue(
      "sawing",
      availableValues.cbm,
      sourceMeasures,
      processedCbm,
    ),
  };

  const startEditing = (item: EditLineItem) => {
    setEditingRowId(item.id);
    setEditingValues({ ...item.values });
    setErrorMessage("");
  };

  const commitEditing = () => {
    if (!editingRowId) return true;
    const nextValues = lockSawingProcessDetailValues(editingValues, sourceRow);
    const error = getSawingProcessDetailError({
      committing: true,
      otherProcessedCbm: sumSawingLineCbm(
        lineItems.filter((row) => row.id !== editingRowId),
        sourceMeasures,
      ),
      source: sourceMeasures,
      values: nextValues,
    });
    if (error) {
      setErrorMessage(error);
      return false;
    }
    setLineItems((current) =>
      current.map((item) =>
        item.id === editingRowId ? { ...item, values: nextValues } : item,
      ),
    );
    setEditingValues(nextValues);
    setErrorMessage("");
    return true;
  };

  const handleUpdate = () => {
    setHasSubmitted(true);
    const rowsForSave = projectedItems;
    const validationError =
      getSawingCreateSubmitError(sourceMeasures, rowsForSave) ||
      (sawingDate ? "" : "Sawing Date is required.");
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    if (hasRejectAvailableValidationErrors(availableIssues)) {
      setErrorMessage("Please correct the Available Details before updating.");
      return;
    }

    saveSawingEditProcess({
      formValues: { processDate: sawingDate },
      lineItems: rowsForSave,
      navigate,
      originalRows: editContext.rows,
      rejectAvailableValues: availableValues,
      sourceRow,
    });
  };

  if (!canMutateFactorySawing()) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: "Sawing", to: "/factory/sawing?tab=done" },
          { label: "Edit Sawing" },
        ]}
        title="Edit Sawing"
      >
        <Alert severity="error">
          You do not have permission to edit Sawing.
        </Alert>
      </FactoryPageShell>
    );
  }

  return (
    <FactoryPageShell
      backNav={{
        label: "Back to Sawing",
        to: "/factory/sawing?tab=done",
      }}
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: "Sawing", to: "/factory/sawing?tab=done" },
        { label: "Edit Sawing" },
      ]}
      title="Edit Sawing"
    >
      <Stack spacing={2}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <FactorySourceOverviewPanel items={sourceOverviewItems} plain />

        <Box sx={(currentTheme) => formSectionCardSx(currentTheme)}>
          <Stack spacing={1.5}>
            <FormSectionHeader title="Process Details" />
            <Box sx={{ width: { xs: "100%", sm: 260 }, maxWidth: "100%" }}>
              <Typography
                component="label"
                sx={{ display: "block", mb: 0.75, fontWeight: 600 }}
                variant="caption"
              >
                Sawing Date *
              </Typography>
              <ErpDatePickerField
                helperText={
                  hasSubmitted && !sawingDate
                    ? "Sawing Date is required."
                    : undefined
                }
                onChange={setSawingDate}
                size="dense"
                state={hasSubmitted && !sawingDate ? "error" : "default"}
                value={sawingDate}
              />
            </Box>
          </Stack>
        </Box>

        <Divider />

        <Typography component="h2" sx={plainFormSectionHeadingSx}>
          Output Details
        </Typography>

        <Box
          sx={(currentTheme) => ({
            backgroundColor: currentTheme.customTokens.surfaces.surface,
            border: `1px solid ${currentTheme.customTokens.borders.default}`,
            borderRadius: "8px",
            p: 1.5,
          })}
        >
          <Box>
            <Stack spacing={1.5}>
              <Box
                sx={{
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ overflowX: "auto" }}>
                  <Table
                    size="medium"
                    sx={{ minWidth: 1100, tableLayout: "auto" }}
                  >
                    <TableHead>
                      <TableRow>
                        {itemFields.map((field) => (
                          <TableCell
                            key={field.key}
                            sx={{
                              ...transactionTableHeaderCellSx(theme),
                              borderRight: `1px solid ${theme.customTokens.borders.divider}`,
                            }}
                          >
                            {field.label}
                            {field.key === "width" || field.key === "thickness"
                              ? " *"
                              : ""}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        {itemFields.map((field) => (
                          <TableCell
                            key={field.key}
                            sx={{
                              ...transactionTableBodyCellSx(theme),
                              borderRight: `1px solid ${theme.customTokens.borders.divider}`,
                            }}
                          >
                            {field.readOnly ? (
                              <Typography
                                sx={{
                                  alignItems: "center",
                                  display: "flex",
                                  minHeight: theme.spacing(4.5),
                                }}
                                variant="body2"
                              >
                                {editingValues[field.key] || "-"}
                              </Typography>
                            ) : (
                              <TextField
                                error={
                                  hasSubmitted &&
                                  (field.key === "width" ||
                                    field.key === "thickness") &&
                                  Boolean(editError)
                                }
                                fullWidth
                                onChange={(event) =>
                                  setEditingValues((current) =>
                                    lockSawingProcessDetailValues(
                                      {
                                        ...current,
                                        [field.key]: event.target.value,
                                      },
                                      sourceRow,
                                    ),
                                  )
                                }
                                size="small"
                                sx={getCompactFieldSx(theme)}
                                value={editingValues[field.key] ?? ""}
                              />
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableBody>
                  </Table>
                </Box>
              </Box>

              <Box
                sx={{
                  alignItems: "center",
                  display: "flex",
                  gap: 1.5,
                  justifyContent: "flex-end",
                  flexWrap: "wrap",
                }}
              >
                {editError ? (
                  <Typography
                    color="error"
                    sx={{ flex: "1 1 260px" }}
                    variant="body2"
                  >
                    {editError}
                  </Typography>
                ) : null}
                <Button
                  disabled={!editingRowId}
                  onClick={commitEditing}
                  startIcon={<Save size={15} />}
                  sx={(currentTheme) => formInlineActionButtonSx(currentTheme)}
                  variant="contained"
                >
                  Update Item
                </Button>
              </Box>
            </Stack>
          </Box>

          <Box sx={{ mt: 1.5 }}>
            <Stack spacing={1.5}>
              <Box
                sx={{
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ overflowX: "auto" }}>
                  <Table
                    size="small"
                    sx={{ minWidth: 1100, tableLayout: "auto" }}
                  >
                    <TableHead>
                      <TableRow>
                        {itemFields.map((field) => (
                          <TableCell
                            key={field.key}
                            sx={transactionTableHeaderCellSx(theme)}
                          >
                            {field.label}
                          </TableCell>
                        ))}
                        <TableCell
                          align="center"
                          sx={transactionTableHeaderCellSx(theme)}
                        >
                          Action
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lineItems.map((item) => {
                        const isEditing = item.id === editingRowId;
                        return (
                          <TableRow
                            key={item.id}
                            hover
                            sx={{
                              "& td": {
                                backgroundColor: isEditing
                                  ? theme.customTokens.navigation
                                      .activeBackground
                                  : theme.customTokens.surfaces.surface,
                              },
                            }}
                          >
                            {itemFields.map((field) => (
                              <TableCell
                                key={field.key}
                                sx={transactionTableBodyCellSx(theme)}
                              >
                                <Typography variant="body2">
                                  {item.values[field.key] || "-"}
                                </Typography>
                              </TableCell>
                            ))}
                            <TableCell
                              align="center"
                              sx={transactionTableBodyCellSx(theme)}
                            >
                              <IconButton
                                aria-label="Edit item"
                                color={isEditing ? "primary" : "default"}
                                onClick={() => startEditing(item)}
                                size="small"
                              >
                                <Pencil size={16} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Box>

        <Divider />

        <RejectAvailableDetailsTable
          disabledType
          editableDerived
          fieldIssues={getVisibleRejectAvailableValidationIssues(
            availableIssues,
            hasSubmitted,
          )}
          hideAmount
          onChange={(key, value) =>
            setAvailableValues((current) =>
              getNextRejectAvailableValues(current, key, value, true, true),
            )
          }
          plain
          title="Available Details"
          useHeight
          values={availableValues}
          volumeMode
        />

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1,
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() => navigate("/factory/sawing?tab=done")}
            sx={recordFormActionButtonSx}
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdate}
            sx={highlightedRecordFormPrimaryButtonSx}
            variant="contained"
          >
            Update Sawing
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
}
