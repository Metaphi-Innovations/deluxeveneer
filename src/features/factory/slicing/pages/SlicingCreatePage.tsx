import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  MenuItem,
  Select,
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import {
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../../shared/buttonStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { slicingDefinition } from "../../shared/factoryDefinitions";
import { createSlicingProcessApi, fetchSlicingIssuedById } from "../api/slicingApi";

interface SlicingProcessItemRow {
  id: string;
  itemName: string;
  itemSubCategory: string;
  logNo: string;
  bundleNo: string;
  palletNo: string;
  length: number;
  width: number;
  thickness: number;
  noOfLeaves: number;
  sqm: number;
  sqf: number;
  ratePerSqf: number;
  amount: number;
  remark: string;
}

interface SlicingRejectAvailableRow {
  id: string;
  type: "Reject" | "Available";
  length: number;
  width: number;
  thickness: number;
  sqm: number;
  sqf: number;
  amount: number;
  remark: string;
}

export function SlicingCreatePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as
    | {
        sourceItem?: any;
        sourceRow?: any;
        issueItemId?: string;
        issueId?: string;
        storageWarehouseId?: string;
      }
    | undefined;

  const defaultSource = slicingDefinition.rows[0];
  const [loadedSourceItem, setLoadedSourceItem] = useState<any | null>(null);
  const sourceItem = loadedSourceItem || state?.sourceItem || state?.sourceRow || defaultSource;

  // Slicing Date
  const [slicingDate, setSlicingDate] = useState<Date | null>(new Date());

  // Master Dropdown state

  // Process details input form state - blank by default per user request
  const [bundleNo, setBundleNo] = useState("");
  const [palletNo, setPalletNo] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [noOfLeaves, setNoOfLeaves] = useState("");
  const [ratePerSqf, setRatePerSqf] = useState("");
  const [remark, setRemark] = useState("");

  // Create Fetch API: fetch live issue data by ID if state not fully populated
  useEffect(() => {
    const idToFetch = state?.issueId || state?.issueItemId || sourceItem?.id;
    if (idToFetch && !loadedSourceItem) {
      void fetchSlicingIssuedById(idToFetch)
        .then((data) => {
          if (data) {
            setLoadedSourceItem(data);
          }
        })
        .catch(() => {});
    }
  }, [state?.issueId, state?.issueItemId, sourceItem?.id, loadedSourceItem]);

  // Processed Items List
  const [processedItems, setProcessedItems] = useState<SlicingProcessItemRow[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Reject / Available Details List
  const [rejectAvailableItems, setRejectAvailableItems] = useState<SlicingRejectAvailableRow[]>([]);

  // Reject / Available row input state for adding - blank by default
  const [raType, setRaType] = useState<"Reject" | "Available">("Available");
  const [raLength, setRaLength] = useState("");
  const [raWidth, setRaWidth] = useState("");
  const [raThickness, setRaThickness] = useState("");
  const [raAmount, setRaAmount] = useState("");
  const [raRemark, setRaRemark] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate Process Details SQM and SQF
  const calculatedSqm = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const leaves = Number(noOfLeaves) || 0;
    if (!l || !w || !leaves) return 0;
    const lM = l > 50 ? l / 1000 : l;
    const wM = w > 50 ? w / 1000 : w;
    return Number((lM * wM * leaves).toFixed(3));
  }, [length, width, noOfLeaves]);

  const calculatedSqf = useMemo(() => {
    if (!calculatedSqm) return 0;
    return Number((calculatedSqm * 10.7639).toFixed(3));
  }, [calculatedSqm]);

  const calculatedAmount = useMemo(() => {
    const rate = Number(ratePerSqf) || 0;
    if (!calculatedSqf || !rate) return 0;
    return Number((calculatedSqf * rate).toFixed(2));
  }, [calculatedSqf, ratePerSqf]);

  // Calculate Reject / Available row SQM and SQF
  const calculatedRaSqm = useMemo(() => {
    const l = Number(raLength) || 0;
    const w = Number(raWidth) || 0;
    if (!l || !w) return 0;
    const lM = l > 50 ? l / 1000 : l;
    const wM = w > 50 ? w / 1000 : w;
    return Number((lM * wM).toFixed(3));
  }, [raLength, raWidth]);

  const calculatedRaSqf = useMemo(() => {
    if (!calculatedRaSqm) return 0;
    return Number((calculatedRaSqm * 10.7639).toFixed(3));
  }, [calculatedRaSqm]);

  // Source Overview items (without Bundle Number, Pallet No, No of Leaves, Total Sq Meter)
  const sourceOverviewItems = useMemo(() => {
    if (!sourceItem) return [];
    const formatDate = (val: any) => {
      if (!val) return "-";
      if (val instanceof Date) return val.toISOString().slice(0, 10);
      return String(val).slice(0, 10);
    };

    return [
      { label: "Storage Sr No.", value: String(sourceItem.storageSrNo || sourceItem.bundleNumber || "-") },
      { label: "Issue Date", value: formatDate(sourceItem.issueDate || sourceItem.issuedDate) },
      { label: "Item Name", value: String(sourceItem.itemName || "-") },
      { label: "Sub Category", value: String(sourceItem.itemSubCategory || sourceItem.subCategory || "-") },
      { label: "Log Code", value: String(sourceItem.logCode || sourceItem.batchNoCode || sourceItem.batchNo || "-") },
      { label: "Length", value: sourceItem.length ? String(sourceItem.length).replace(/\s*(m|mm|mtr)$/i, "") : "-" },
      { label: "Width", value: sourceItem.width ? String(sourceItem.width).replace(/\s*(m|mm|mtr)$/i, "") : "-" },
      { label: "Thickness", value: sourceItem.thickness || sourceItem.height ? String(sourceItem.thickness || sourceItem.height).replace(/\s*(m|mm|mtr)$/i, "") : "-" },
      { label: "Remark", value: String(sourceItem.remark || "-") },
    ];
  }, [sourceItem]);

  // Add Item to Process Items
  const handleAddProcessItem = () => {
    const bNo = bundleNo.trim();
    const l = Number(length);
    const w = Number(width);
    const leaves = Number(noOfLeaves);

    if (!bNo) {
      alert("Please enter Bundle No");
      return;
    }
    if (!l) {
      alert("Please enter Length (M)");
      return;
    }
    if (!w) {
      alert("Please enter Width (M)");
      return;
    }
    if (!leaves || leaves <= 0) {
      alert("Please enter a valid No. of Leaves");
      return;
    }

    const th = Number(thickness) || 0;
    const parentItemName = String(sourceItem?.itemName || "");
    const parentSubCategory = String(sourceItem?.itemSubCategory || sourceItem?.subCategory || "");
    const parentLogNo = String(sourceItem?.logCode || sourceItem?.batchNo || "");

    if (editingItemId) {
      setProcessedItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                itemName: item.itemName || parentItemName,
                itemSubCategory: item.itemSubCategory || parentSubCategory,
                logNo: item.logNo || parentLogNo,
                bundleNo: bNo,
                palletNo: palletNo.trim(),
                length: l,
                width: w,
                thickness: th,
                noOfLeaves: leaves,
                sqm: calculatedSqm,
                sqf: calculatedSqf,
                ratePerSqf: Number(ratePerSqf) || 0,
                amount: calculatedAmount,
                remark,
              }
            : item
        )
      );
      setEditingItemId(null);
    } else {
      const newItem: SlicingProcessItemRow = {
        id: `slicing-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        itemName: parentItemName,
        itemSubCategory: parentSubCategory,
        logNo: parentLogNo,
        bundleNo: bNo,
        palletNo: palletNo.trim(),
        length: l,
        width: w,
        thickness: th,
        noOfLeaves: leaves,
        sqm: calculatedSqm,
        sqf: calculatedSqf,
        ratePerSqf: Number(ratePerSqf) || 0,
        amount: calculatedAmount,
        remark,
      };
      setProcessedItems((prev) => [...prev, newItem]);
    }

    // Reset fields for next entry
    setBundleNo("");
    setPalletNo("");
    setLength("");
    setWidth("");
    setThickness("");
    setNoOfLeaves("");
    setRatePerSqf("");
    setRemark("");
  };

  const handleEditProcessItem = (item: SlicingProcessItemRow) => {
    setEditingItemId(item.id);
    setBundleNo(item.bundleNo);
    setPalletNo(item.palletNo);
    setLength(String(item.length));
    setWidth(String(item.width));
    setThickness(item.thickness ? String(item.thickness) : "");
    setNoOfLeaves(String(item.noOfLeaves));
    setRatePerSqf(item.ratePerSqf ? String(item.ratePerSqf) : "");
    setRemark(item.remark || "");
  };

  const handleDeleteProcessItem = (id: string) => {
    setProcessedItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  // Add Item to Reject / Available Details
  const handleAddRejectAvailableItem = () => {
    const l = Number(raLength) || 0;
    const w = Number(raWidth) || 0;
    const th = Number(raThickness) || 0;

    const newRa: SlicingRejectAvailableRow = {
      id: `ra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: raType,
      length: l,
      width: w,
      thickness: th,
      sqm: calculatedRaSqm,
      sqf: calculatedRaSqf,
      amount: Number(raAmount) || 0,
      remark: raRemark,
    };

    setRejectAvailableItems((prev) => [...prev, newRa]);
    setRaLength("");
    setRaWidth("");
    setRaThickness("");
    setRaAmount("");
    setRaRemark("");
  };

  const handleDeleteRejectAvailableItem = (id: string) => {
    setRejectAvailableItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Submit process creation
  const handleSubmit = async () => {
    if (processedItems.length === 0) {
      setErrorMessage("Please add at least one processed item before saving.");
      return;
    }

    const targetIssueId = state?.issueId || state?.issueItemId || sourceItem?.id;
    if (!targetIssueId) {
      setErrorMessage("No source Issued Slicing record found.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      const remainingRow = rejectAvailableItems.find((ra) => ra.type === "Available");
      const rejectRow = rejectAvailableItems.find((ra) => ra.type === "Reject");

      await createSlicingProcessApi({
        issueId: targetIssueId,
        slicingDate: slicingDate ? slicingDate.toISOString().slice(0, 10) : undefined,
        remark: remark || undefined,
        processedItems: processedItems.map((item) => ({
          logCode: item.logNo,
          batchNo: item.logNo,
          bundleNumber: item.bundleNo,
          palletNo: item.palletNo,
          length: item.length,
          width: item.width,
          thickness: item.thickness,
          height: item.thickness,
          noOfLeaves: item.noOfLeaves,
          sqm: item.sqm,
          sqf: item.sqf,
          totalSqMeter: item.sqm,
          ratePerCbf: item.ratePerSqf,
          amount: item.amount,
          remark: item.remark,
        })),
        rejected: rejectRow
          ? {
              length: rejectRow.length,
              width: rejectRow.width,
              thickness: rejectRow.thickness,
              height: rejectRow.thickness,
              cbm: 0,
              sqm: rejectRow.sqm,
              sqf: rejectRow.sqf,
              totalSqMeter: rejectRow.sqm,
              remark: rejectRow.remark,
            }
          : undefined,
        remaining: remainingRow
          ? {
              length: remainingRow.length,
              width: remainingRow.width,
              thickness: remainingRow.thickness,
              height: remainingRow.thickness,
              cbm: 0,
            }
          : undefined,
      });

      // Navigate to Slicing Done tab
      navigate("/factory/slicing?tab=done");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save slicing process.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory" },
        { label: "Slicing", to: "/factory/slicing" },
        { label: "Create Slicing" },
      ]}
      title="Create Slicing Process"
    >
      <Stack spacing={3}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {/* Source Overview Panel */}
        {sourceOverviewItems.length > 0 ? (
          <FactorySourceOverviewPanel items={sourceOverviewItems} />
        ) : null}

        {/* Slicing Date Box */}
        <Box sx={{ width: 220 }}>
          <Typography
            sx={{
              mb: 0.5,
              fontSize: 12,
              fontWeight: 600,
              color: theme.palette.text.secondary,
            }}
            variant="caption"
          >
            Slicing Date
          </Typography>
          <ErpDatePickerField
            onChange={setSlicingDate}
            value={slicingDate}
          />
        </Box>

        {/* Process Details Input Form */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader
              title={editingItemId ? "Edit Process Detail" : "PROCESS DETAILS"}
            />

            {/* Horizontal Scrollable Container */}
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": {
                  height: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: theme.palette.divider,
                  borderRadius: 3,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minWidth: "max-content",
                  py: 0.5,
                }}
              >
                {/* BUNDLE NO */}
                <TextField
                  label="BUNDLE NO *"
                  required
                  value={bundleNo}
                  onChange={(e) => setBundleNo(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 140 }}
                />

                {/* PALLET NO */}
                <TextField
                  label="PALLET NO"
                  value={palletNo}
                  onChange={(e) => setPalletNo(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 140 }}
                />

                {/* LENGTH (M) */}
                <TextField
                  label="LENGTH (M) *"
                  type="number"
                  value={length}
                  onChange={(e) => setLength(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 130 }}
                  required
                />

                {/* WIDTH (M) */}
                <TextField
                  label="WIDTH (M) *"
                  type="number"
                  value={width}
                  onChange={(e) => setWidth(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 130 }}
                  required
                />

                {/* THICKNESS (M) */}
                <TextField
                  label="THICKNESS (M)"
                  type="number"
                  value={thickness}
                  onChange={(e) => setThickness(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 140 }}
                />

                {/* NO. OF LEAVES */}
                <TextField
                  label="NO. OF LEAVES *"
                  type="number"
                  required
                  value={noOfLeaves}
                  onChange={(e) => setNoOfLeaves(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 130 }}
                />

                {/* SQM */}
                <TextField
                  label="SQM"
                  value={calculatedSqm ? calculatedSqm.toFixed(3) : ""}
                  slotProps={{ input: { readOnly: true } }}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 120 }}
                />

                {/* SQF */}
                <TextField
                  label="SQF"
                  value={calculatedSqf ? calculatedSqf.toFixed(3) : ""}
                  slotProps={{ input: { readOnly: true } }}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 120 }}
                />

                {/* RATE PER SQF */}
                <TextField
                  label="RATE PER SQF"
                  type="number"
                  value={ratePerSqf}
                  onChange={(e) => setRatePerSqf(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 130 }}
                />

                {/* AMOUNT */}
                <TextField
                  label="AMOUNT"
                  value={calculatedAmount ? calculatedAmount.toFixed(2) : ""}
                  slotProps={{ input: { readOnly: true } }}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 130 }}
                />

                {/* REMARK */}
                <TextField
                  label="REMARK"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 160 }}
                />
              </Box>
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              {editingItemId ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setEditingItemId(null);
                    setBundleNo("");
                    setPalletNo("");
                    setLength("");
                    setWidth("");
                    setThickness("");
                    setNoOfLeaves("");
                    setRatePerSqf("");
                    setRemark("");
                  }}
                  sx={recordFormActionButtonSx}
                >
                  Cancel Edit
                </Button>
              ) : null}
              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={handleAddProcessItem}
                size="small"
                sx={{
                  ...formInlineActionButtonSx(theme),
                  backgroundColor: (t) => t.palette.primary.main,
                  color: "#FFFFFF",
                  fontWeight: 600,
                  "&:hover": {
                    backgroundColor: (t) => t.customTokens.brand.primaryScale[800],
                  },
                }}
              >
                {editingItemId ? "Update Item" : "+ Add Item"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Processed Items Table (shown when items are added as seen in img 2) */}
        {processedItems.length > 0 && (
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <FormSectionHeader
                title={`PROCESSED ITEMS`}
              />

              <Box
                sx={{
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  overflowX: "auto",
                  backgroundColor: theme.customTokens.surfaces.surface,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>ITEM NAME</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>ITEM SUB-CATEGORY</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>LOG NO.</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>BUNDLE NO</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>PALLET NO</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>LENGTH (M)</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>WIDTH (M)</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>THICKNESS (M)</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>NO. OF LEAVES</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>SQM</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>SQF</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>RATE PER SQF</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>AMOUNT</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>REMARK</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)} align="center">
                        ACTION
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {processedItems.map((item) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.itemName}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.itemSubCategory}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.logNo}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.bundleNo || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.palletNo || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.length} m</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.width} m</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.thickness ? `${item.thickness} m` : "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.noOfLeaves}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.sqm.toFixed(3)}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.sqf.toFixed(3)}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.ratePerSqf.toFixed(2)}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.remark || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)} align="center">
                          <Stack direction="row" spacing={0.5} justifyContent="center">
                            <IconButton
                              size="small"
                              onClick={() => handleEditProcessItem(item)}
                              color="primary"
                              title="Edit"
                            >
                              <Pencil size={15} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteProcessItem(item.id)}
                              color="error"
                              title="Delete"
                            >
                              <Trash2 size={15} />
                            </IconButton>
                          </Stack>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Stack>
          </Box>
        )}

        {/* Reject / Available Details Table */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="REJECT / AVAILABLE DETAILS" />

            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                pb: 1,
                "&::-webkit-scrollbar": {
                  height: 6,
                },
                "&::-webkit-scrollbar-thumb": {
                  backgroundColor: theme.palette.divider,
                  borderRadius: 3,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  minWidth: "max-content",
                  py: 0.5,
                }}
              >
                {/* TYPE */}
                <Select
                  size="small"
                  value={raType}
                  onChange={(e) => setRaType(e.target.value as "Reject" | "Available")}
                  sx={{ ...getCompactFieldSx(theme), width: 130 }}
                >
                  <MenuItem value="Available">Available</MenuItem>
                  <MenuItem value="Reject">Reject</MenuItem>
                </Select>

                {/* LENGTH */}
                <TextField
                  label="LENGTH"
                  type="number"
                  size="small"
                  value={raLength}
                  onChange={(e) => setRaLength(e.target.value)}
                  sx={{ ...getCompactFieldSx(theme), width: 120 }}
                />

                {/* WIDTH */}
                <TextField
                  label="WIDTH"
                  type="number"
                  size="small"
                  value={raWidth}
                  onChange={(e) => setRaWidth(e.target.value)}
                  sx={{ ...getCompactFieldSx(theme), width: 120 }}
                />

                {/* THICKNESS */}
                <TextField
                  label="THICKNESS"
                  type="number"
                  size="small"
                  value={raThickness}
                  onChange={(e) => setRaThickness(e.target.value)}
                  sx={{ ...getCompactFieldSx(theme), width: 120 }}
                />

                {/* SQM */}
                <TextField
                  label="SQM"
                  value={calculatedRaSqm ? calculatedRaSqm.toFixed(3) : ""}
                  slotProps={{ input: { readOnly: true } }}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 110 }}
                />

                {/* SQF */}
                <TextField
                  label="SQF"
                  value={calculatedRaSqf ? calculatedRaSqf.toFixed(3) : ""}
                  slotProps={{ input: { readOnly: true } }}
                  size="small"
                  sx={{ ...getCompactFieldSx(theme), width: 110 }}
                />

                {/* AMOUNT */}
                <TextField
                  label="AMOUNT"
                  type="number"
                  size="small"
                  value={raAmount}
                  onChange={(e) => setRaAmount(e.target.value)}
                  sx={{ ...getCompactFieldSx(theme), width: 120 }}
                />

                {/* REMARK */}
                <TextField
                  label="REMARK"
                  size="small"
                  value={raRemark}
                  onChange={(e) => setRaRemark(e.target.value)}
                  sx={{ ...getCompactFieldSx(theme), width: 150 }}
                />

                <Button
                  variant="contained"
                  startIcon={<Plus size={16} />}
                  onClick={handleAddRejectAvailableItem}
                  size="small"
                  sx={{
                    ...formInlineActionButtonSx(theme),
                    backgroundColor: (t) => t.palette.primary.main,
                    color: "#FFFFFF",
                    fontWeight: 600,
                    "&:hover": {
                      backgroundColor: (t) => t.customTokens.brand.primaryScale[800],
                    },
                  }}
                >
                  + Add
                </Button>
              </Box>
            </Box>

            {rejectAvailableItems.length > 0 && (
              <Box
                sx={{
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  overflowX: "auto",
                  backgroundColor: theme.customTokens.surfaces.surface,
                }}
              >
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>#</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>TYPE</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>LENGTH</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>WIDTH</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>THICKNESS</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>SQM</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>SQF</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>AMOUNT</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>REMARK</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)} align="center">
                        ACTION
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {rejectAvailableItems.map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{index + 1}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: item.type === "Reject" ? "error.main" : "primary.main",
                            }}
                          >
                            {item.type}
                          </Typography>
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.length || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.width || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.thickness || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.sqm || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.sqf || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.amount || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.remark || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)} align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteRejectAvailableItem(item.id)}
                            color="error"
                            title="Delete"
                          >
                            <Trash2 size={15} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            )}
          </Stack>
        </Box>

        {/* Bottom Action Bar (Cancel & Save Process) */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 1.5,
            pt: 1,
            pb: 2,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={() => navigate("/factory/slicing")}
            disabled={isSubmitting}
            sx={recordFormActionButtonSx}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="contained"
            disableElevation
            onClick={() => void handleSubmit()}
            disabled={isSubmitting}
            sx={{
              ...highlightedRecordFormPrimaryButtonSx,
              backgroundColor: (t) => t.palette.primary.main,
              color: "#FFFFFF",
              fontWeight: 700,
              px: 2.5,
              "&:hover": {
                backgroundColor: (t) => t.customTokens.brand.primaryScale[800],
              },
            }}
          >
            {isSubmitting ? "Saving..." : "Save Process"}
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
}
