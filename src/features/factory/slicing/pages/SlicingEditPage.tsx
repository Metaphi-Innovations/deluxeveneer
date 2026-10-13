import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
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
import { useNavigate, useParams } from "react-router";

import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../../shared/buttonStyles";
import {
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import { slicingDefinition } from "../../shared";
import {
  RejectAvailableDetailsTable,
} from "../../shared/RejectAvailableDetailsTable";
import {
  applySlicingDerivedAreas,
  formatSlicingLineItemDisplay,
  normalizeSlicingLineItemInput,
} from "../../shared/slicingAreaCalculation";
import {
  buildSlicingAvailableValues,
  calculateTotalSlicingConsumption,
  getSlicingCreateSubmitError,
  saveSlicingEditProcess,
  validateSlicingRow,
} from "../slicingCreateRules";
import {
  getSlicingEditContext,
  listSlicingDoneRows,
} from "../slicingFrontendStore";

type SlicingRow = Record<string, any>;
type EditLineItem = { id: string; values: Record<string, string> };

const itemFields = [
  { key: "storageSrNo", label: "Storage Sr No.", readOnly: false },
  { key: "issueDate", label: "Issue Date", readOnly: false },
  { key: "itemName", label: "Item Name", readOnly: false },
  { key: "bundleNumber", label: "Bundle Number", readOnly: false },
  { key: "palletNo", label: "Pallet No", readOnly: false },
  { key: "length", label: "Length", readOnly: false },
  { key: "width", label: "Width", readOnly: false },
  { key: "thickness", label: "Thickness", readOnly: false },
  { key: "noOfLeaves", label: "No of Leaves", readOnly: false },
  { key: "sqm", label: "SQM", readOnly: true },
  { key: "sqf", label: "SQF", readOnly: true },
  { key: "remark", label: "Remark", readOnly: false },
] as const;

function text(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return value === undefined || value === null ? "" : String(value).trim();
}

function decimal(value: unknown, digits = 6) {
  const parsed = Number(text(value));
  if (!Number.isFinite(parsed)) return text(value) || "-";
  return parsed.toFixed(digits).replace(/\.?0+$/u, "");
}

function readDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  const parsed = new Date(text(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function buildItemValues(row: SlicingRow, sourceRow: SlicingRow) {
  return applySlicingDerivedAreas({
    storageSrNo: text(row.storageSrNo || sourceRow.storageSrNo),
    issueDate: text(row.issueDate || row.slicingDate || sourceRow.issueDate),
    itemName: text(row.itemName || sourceRow.itemName),
    bundleNumber: text(row.bundleNumber || sourceRow.bundleNumber),
    palletNo: text(row.palletNo || sourceRow.palletNo),
    length: text(row.length || sourceRow.length),
    width: text(row.width || sourceRow.width),
    thickness: text(row.thickness || row.height),
    noOfLeaves: text(row.noOfLeaves || row.receivedLeaves || row.noOfSheets),
    cbm: text(row.cbm),
    cbf: text(row.cbf),
    sqm: text(row.sqm || row.totalSqMeter),
    sqf: text(row.sqf),
    remark: text(row.remark),
  });
}

export function SlicingEditPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const selectedRow = useMemo(
    () =>
      listSlicingDoneRows(slicingDefinition.rows as readonly SlicingRow[])
        .find((row) => String(row.id) === params.id),
    [params.id],
  );
  const editContext = useMemo(
    () =>
      selectedRow
        ? getSlicingEditContext(
            selectedRow,
            slicingDefinition.rows as readonly SlicingRow[],
          )
        : null,
    [selectedRow],
  );
  const sourceRow = editContext?.sourceRow as SlicingRow | undefined;
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
    () => selectedRow && sourceRow ? buildItemValues(selectedRow, sourceRow) : {},
  );
  const [slicingDate, setSlicingDate] = useState<Date | null>(() =>
    readDate(selectedRow?.slicingDate || selectedRow?.issueDate),
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
          ? { ...item, values: applySlicingDerivedAreas(editingValues) }
          : item,
      ),
    [editingRowId, editingValues, lineItems],
  );
  const availableValues = useMemo(
    () => buildSlicingAvailableValues(sourceRow, projectedItems),
    [projectedItems, sourceRow],
  );
  const editValidation = useMemo(
    () =>
      editingRowId
        ? validateSlicingRow({
            otherConsumedCbm: calculateTotalSlicingConsumption(
              lineItems.filter((item) => item.id !== editingRowId),
            ),
            sourceRow,
            values: editingValues,
          })
        : { fieldErrors: {}, maximumLeaves: 0, message: "" },
    [editingRowId, editingValues, lineItems, sourceRow],
  );

  if (!selectedRow || !editContext || !sourceRow) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: "Slicing", to: "/factory/slicing?tab=done" },
          { label: "Edit" },
        ]}
        title="Edit Slicing"
      >
        <Alert severity="warning">The selected Slicing Done record was not found.</Alert>
      </FactoryPageShell>
    );
  }

  const sourceOverviewItems = [
    { label: "Storage Sr No.", value: text(sourceRow.storageSrNo) || "-" },
    { label: "Issue Date", value: text(sourceRow.issueDate || sourceRow.issuedDate) || "-" },
    { label: "Item Name", value: text(sourceRow.itemName) || "-" },
    { label: "Sub Category", value: text(sourceRow.subCategory || sourceRow.itemSubCategory) || "-" },
    { label: "Log No.", value: text(sourceRow.logCode || sourceRow.batchNo || sourceRow.logNo) || "-" },
    { label: "Length", value: decimal(sourceRow.length, 3) },
    { label: "Width", value: decimal(sourceRow.width, 3) },
    { label: "Height", value: decimal(sourceRow.height, 6) },
    { label: "Received CBM", value: decimal(sourceRow.receivedCbm) },
    { label: "Available CBM", value: decimal(availableValues.cbm) },
    { label: "Remark", value: text(sourceRow.remark) || "-" },
  ];

  const startEditing = (item: EditLineItem) => {
    setEditingRowId(item.id);
    setEditingValues({ ...item.values });
    setErrorMessage("");
  };

  const commitEditing = () => {
    if (!editingRowId) return true;
    const nextValues = applySlicingDerivedAreas(editingValues);
    const validation = validateSlicingRow({
      committing: true,
      otherConsumedCbm: calculateTotalSlicingConsumption(
        lineItems.filter((item) => item.id !== editingRowId),
      ),
      sourceRow,
      values: nextValues,
    });
    if (validation.message) {
      setHasSubmitted(true);
      setErrorMessage(validation.message);
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
    const submitError =
      getSlicingCreateSubmitError(sourceRow, projectedItems, availableValues) ||
      (slicingDate ? "" : "Slicing Date is required.");
    if (submitError) {
      setErrorMessage(submitError);
      return;
    }
    saveSlicingEditProcess({
      formValues: { slicingDate },
      lineItems: projectedItems,
      navigate,
      originalRows: editContext.rows,
      sourceRow,
    });
  };

  return (
    <FactoryPageShell
      backNav={{ label: "Back to Slicing", to: "/factory/slicing?tab=done" }}
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: "Slicing", to: "/factory/slicing?tab=done" },
        { label: "Edit Slicing" },
      ]}
      title="Edit Slicing"
    >
      <Stack spacing={2}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}
        <FactorySourceOverviewPanel items={sourceOverviewItems} />

        <Box sx={(currentTheme) => formSectionCardSx(currentTheme)}>
          <Stack spacing={1.5}>
            <FormSectionHeader title="Process Details" />
            <Box sx={{ width: { xs: "100%", sm: 260 }, maxWidth: "100%" }}>
              <Typography component="label" sx={{ display: "block", mb: 0.75, fontWeight: 600 }} variant="caption">
                Slicing Date *
              </Typography>
              <ErpDatePickerField
                helperText={hasSubmitted && !slicingDate ? "Slicing Date is required." : undefined}
                onChange={setSlicingDate}
                size="dense"
                state={hasSubmitted && !slicingDate ? "error" : "default"}
                value={slicingDate}
              />
            </Box>
          </Stack>
        </Box>

        <Box sx={(currentTheme) => formSectionCardSx(currentTheme)}>
          <Stack spacing={1.5}>
            <FormSectionHeader title="Output Details" />
            <Box sx={{ border: `1px solid ${theme.customTokens.borders.default}`, borderRadius: "8px", overflow: "hidden" }}>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="medium" sx={{ minWidth: 1600, tableLayout: "auto" }}>
                  <TableHead>
                    <TableRow>
                      {itemFields.map((field) => (
                        <TableCell key={field.key} sx={transactionTableHeaderCellSx(theme)}>
                          {field.label}
                          {["length", "width", "thickness", "noOfLeaves"].includes(field.key) ? " *" : ""}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      {itemFields.map((field) => (
                        <TableCell key={field.key} sx={transactionTableBodyCellSx(theme)}>
                          {field.readOnly ? (
                            <Typography sx={{ minHeight: theme.spacing(4.5), display: "flex", alignItems: "center" }} variant="body2">
                              {formatSlicingLineItemDisplay(field.key, editingValues[field.key] || "")}
                            </Typography>
                          ) : (
                            <TextField
                              error={hasSubmitted && Boolean(editValidation.fieldErrors[field.key])}
                              fullWidth
                              helperText={hasSubmitted ? editValidation.fieldErrors[field.key] : ""}
                              onChange={(event) => {
                                const value = normalizeSlicingLineItemInput(field.key, event.target.value);
                                setEditingValues((current) =>
                                  applySlicingDerivedAreas({ ...current, [field.key]: value }),
                                );
                                setErrorMessage("");
                              }}
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
            <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              {editValidation.message ? (
                <Typography color="error" sx={{ flex: "1 1 260px" }} variant="body2">
                  {editValidation.message}
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

        <Box sx={(currentTheme) => formSectionCardSx(currentTheme)}>
          <Stack spacing={1.5}>
            <FormSectionHeader title={`Processed Items (${lineItems.length})`} />
            <Box sx={{ border: `1px solid ${theme.customTokens.borders.default}`, borderRadius: "8px", overflow: "hidden" }}>
              <Box sx={{ overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 1600, tableLayout: "auto" }}>
                  <TableHead>
                    <TableRow>
                      {itemFields.map((field) => (
                        <TableCell key={field.key} sx={transactionTableHeaderCellSx(theme)}>{field.label}</TableCell>
                      ))}
                      <TableCell align="center" sx={transactionTableHeaderCellSx(theme)}>Action</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineItems.map((item) => {
                      const isEditing = item.id === editingRowId;
                      return (
                        <TableRow key={item.id} hover sx={{ "& td": { backgroundColor: isEditing ? theme.customTokens.navigation.activeBackground : theme.customTokens.surfaces.surface } }}>
                          {itemFields.map((field) => (
                            <TableCell key={field.key} sx={transactionTableBodyCellSx(theme)}>
                              {formatSlicingLineItemDisplay(field.key, item.values[field.key] || "")}
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={transactionTableBodyCellSx(theme)}>
                            <IconButton aria-label="Edit item" color={isEditing ? "primary" : "default"} onClick={() => startEditing(item)} size="small">
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

        <RejectAvailableDetailsTable
          disabledType
          fieldIssues={{}}
          hideAmount
          lockMeasuredFields
          onChange={() => undefined}
          title="Available Details"
          useHeight
          values={availableValues}
          volumeMode
        />

        <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, flexWrap: "wrap" }}>
          <Button onClick={() => navigate("/factory/slicing?tab=done")} sx={recordFormActionButtonSx} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleUpdate} sx={highlightedRecordFormPrimaryButtonSx} variant="contained">
            Update Slicing
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
}
