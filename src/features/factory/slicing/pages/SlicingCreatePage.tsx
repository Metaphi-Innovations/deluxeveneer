import { useMemo, useState } from "react";
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
import { slicingDefinition } from "../../shared/factoryDefinitions";

interface SlicingProcessItemRow {
  id: string;
  batchNo: string;
  length: number;
  width: number;
  height: number;
  cbm: number;
  cbf: number;
  receivedCbm: number;
  availableCbm: number;
  ratePerCbf: number;
  amount: number;
  remark?: string;
}

interface SlicingRejectAvailableRow {
  id: string;
  type: "Available";
  length: number;
  width: number;
  height: number;
  cbm: number;
  cbf: number;
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
  const sourceItem = state?.sourceItem || state?.sourceRow || defaultSource;

  // Process details input state
  const [batchNo, setBatchNo] = useState(sourceItem?.batchNo || sourceItem?.logNo || "");
  const [length, setLength] = useState(
    sourceItem?.length ? String(sourceItem.length).replace(/[^0-9.]/g, "") : "2440",
  );
  const [width, setWidth] = useState(
    sourceItem?.width ? String(sourceItem.width).replace(/[^0-9.]/g, "") : "1220",
  );
  const [height, setHeight] = useState(
    sourceItem?.height || sourceItem?.thickness
      ? String(sourceItem.height || sourceItem.thickness).replace(/[^0-9.]/g, "")
      : "150",
  );
  const [ratePerCbf, setRatePerCbf] = useState(
    sourceItem?.ratePerCbf ? String(sourceItem.ratePerCbf).replace(/[^0-9.]/g, "") : "450",
  );
  const [remark, setRemark] = useState("");

  // Processed Items List
  const [processedItems, setProcessedItems] = useState<SlicingProcessItemRow[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Reject / Available Details List
  const [rejectAvailableItems, setRejectAvailableItems] = useState<SlicingRejectAvailableRow[]>([]);

  // Reject / Available row input state for adding
  const [raType, setRaType] = useState<"Reject" | "Available">("Reject");
  const [raLength, setRaLength] = useState("");
  const [raWidth, setRaWidth] = useState("");
  const [raHeight, setRaHeight] = useState("");
  const [raRate, setRaRate] = useState("");
  const [raRemark, setRaRemark] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-calculated fields for Process Details
  const calculatedCbm = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    if (!l || !w || !h) return 0;
    const isMm = l > 50 || w > 50;
    const divisor = isMm ? 1_000_000_000 : 1_000_000;
    return Number(((l * w * h) / divisor).toFixed(6));
  }, [length, width, height]);

  const calculatedCbf = useMemo(() => {
    if (!calculatedCbm) return 0;
    return Number((calculatedCbm * 35.3147).toFixed(4));
  }, [calculatedCbm]);

  const sourceCbm = useMemo(() => {
    const srcCbmVal = Number(sourceItem?.cbm) || 0;
    if (srcCbmVal) return srcCbmVal;
    const l = Number(sourceItem?.length) || 0;
    const w = Number(sourceItem?.width) || 0;
    const h = Number(sourceItem?.height || sourceItem?.thickness) || 0;
    if (!l || !w || !h) return 0;
    const isMm = l > 50 || w > 50;
    const divisor = isMm ? 1_000_000_000 : 1_000_000;
    return Number(((l * w * h) / divisor).toFixed(6));
  }, [sourceItem]);

  const receivedCbm = sourceCbm || calculatedCbm;

  const totalUsedCbm = useMemo(() => {
    return processedItems.reduce((acc, curr) => {
      if (editingItemId && curr.id === editingItemId) return acc;
      return acc + (Number(curr.cbm) || 0);
    }, 0);
  }, [processedItems, editingItemId]);

  const availableCbm = useMemo(() => {
    const avail = (receivedCbm || 0) - totalUsedCbm - (editingItemId ? 0 : calculatedCbm);
    return Number((avail > 0 ? avail : 0).toFixed(6));
  }, [receivedCbm, totalUsedCbm, editingItemId, calculatedCbm]);

  const calculatedAmount = useMemo(() => {
    const rate = Number(ratePerCbf) || 0;
    if (!calculatedCbf || !rate) return 0;
    return Number((calculatedCbf * rate).toFixed(2));
  }, [calculatedCbf, ratePerCbf]);

  // Auto-calculated fields for Available add
  const calculatedRaCbm = useMemo(() => {
    const l = Number(raLength) || 0;
    const w = Number(raWidth) || 0;
    const h = Number(raHeight) || 0;
    if (!l || !w || !h) return 0;
    const isMm = l > 50 || w > 50;
    const divisor = isMm ? 1_000_000_000 : 1_000_000;
    return Number(((l * w * h) / divisor).toFixed(6));
  }, [raLength, raWidth, raHeight]);

  const calculatedRaCbf = useMemo(() => {
    if (!calculatedRaCbm) return 0;
    return Number((calculatedRaCbm * 35.3147).toFixed(4));
  }, [calculatedRaCbm]);

  // Source Overview items
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
      { label: "Bundle Number", value: String(sourceItem.bundleNumber || "-") },
      { label: "Pallet No", value: String(sourceItem.palletNo || "-") },
      { label: "Length", value: sourceItem.length ? String(sourceItem.length).replace(/\s*(m|mm|mtr)$/i, "") : "-" },
      { label: "Width", value: sourceItem.width ? String(sourceItem.width).replace(/\s*(m|mm|mtr)$/i, "") : "-" },
      { label: "Thickness", value: sourceItem.thickness || sourceItem.height ? String(sourceItem.thickness || sourceItem.height).replace(/\s*(m|mm|mtr)$/i, "") : "-" },
      { label: "No of Leaves", value: sourceItem.noOfLeaves != null ? String(sourceItem.noOfLeaves) : "-" },
      { label: "Total Sq Meter", value: sourceItem.totalSqMeter || sourceItem.sqm ? String(sourceItem.totalSqMeter || sourceItem.sqm) : "-" },
      
      { label: "Remark", value: String(sourceItem.remark || "-") },
    ];
  }, [sourceItem]);

  // Add Item to Process Items
  const handleAddProcessItem = () => {
    const l = Number(length);
    const w = Number(width);
    const h = Number(height);

    if (!l || !w || !h) {
      alert("Please enter Length, Width, and Height");
      return;
    }

    if (editingItemId) {
      setProcessedItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                batchNo: batchNo.trim() || sourceItem?.batchNo || "",
                length: l,
                width: w,
                height: h,
                cbm: calculatedCbm,
                cbf: calculatedCbf,
                receivedCbm: Number(receivedCbm.toFixed(6)),
                availableCbm: Number(availableCbm.toFixed(6)),
                ratePerCbf: Number(ratePerCbf) || 0,
                amount: calculatedAmount,
                remark,
              }
            : item,
        ),
      );
      setEditingItemId(null);
    } else {
      const newItem: SlicingProcessItemRow = {
        id: `slicing-item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        batchNo: batchNo.trim() || sourceItem?.batchNo || sourceItem?.logNo || "",
        length: l,
        width: w,
        height: h,
        cbm: calculatedCbm,
        cbf: calculatedCbf,
        receivedCbm: Number(receivedCbm.toFixed(6)),
        availableCbm: Number(availableCbm.toFixed(6)),
        ratePerCbf: Number(ratePerCbf) || 0,
        amount: calculatedAmount,
        remark,
      };
      setProcessedItems((prev) => [...prev, newItem]);
    }

    setBatchNo(sourceItem?.batchNo || sourceItem?.logNo || "");
    setLength(sourceItem?.length ? String(sourceItem.length).replace(/[^0-9.]/g, "") : "2440");
    setWidth(sourceItem?.width ? String(sourceItem.width).replace(/[^0-9.]/g, "") : "1220");
    setHeight(sourceItem?.height || sourceItem?.thickness ? String(sourceItem.height || sourceItem.thickness).replace(/[^0-9.]/g, "") : "150");
    setRatePerCbf(sourceItem?.ratePerCbf ? String(sourceItem.ratePerCbf).replace(/[^0-9.]/g, "") : "450");
    setRemark("");
  };

  const handleEditProcessItem = (item: SlicingProcessItemRow) => {
    setEditingItemId(item.id);
    setBatchNo(item.batchNo);
    setLength(String(item.length));
    setWidth(String(item.width));
    setHeight(String(item.height));
    setRatePerCbf(item.ratePerCbf ? String(item.ratePerCbf) : "");
    setRemark(item.remark || "");
  };

  const handleDeleteProcessItem = (id: string) => {
    setProcessedItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
    }
  };

  // Add Item to Available Details
  const handleAddRejectAvailableItem = () => {
    const l = Number(raLength) || 0;
    const w = Number(raWidth) || 0;
    const h = Number(raHeight) || 0;

    const newRa: SlicingRejectAvailableRow = {
      id: `ra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: "Available",
      length: l,
      width: w,
      height: h,
      cbm: calculatedRaCbm,
      cbf: calculatedRaCbf,
      remark: raRemark,
    };

    setRejectAvailableItems((prev) => [...prev, newRa]);
    setRaLength("");
    setRaWidth("");
    setRaHeight("");
    setRaRate("");
    setRaRemark("");
  };

  const handleDeleteRejectAvailableItem = (id: string) => {
    setRejectAvailableItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Save / Submit Slicing Process
  const handleSubmit = async () => {
    if (processedItems.length === 0) {
      setErrorMessage("Please add at least one processed item before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
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
      subtitle="Process wood flitches into sliced veneer sheets."
      title="Create Slicing Process"
    >
      <Stack spacing={3}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {/* Source Overview Panel */}
        {sourceOverviewItems.length > 0 ? (
          <FactorySourceOverviewPanel items={sourceOverviewItems} />
        ) : null}

        {/* Process Details Input Form */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader
              title={editingItemId ? "Edit Process Item" : "Process Details"}
            />

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(5, 1fr)",
                },
              }}
            >
              <TextField
                label="Batch No"
                value={batchNo}
                onChange={(e) => setBatchNo(e.target.value)}
                size="small"
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Length (mm)"
                type="number"
                value={length}
                onChange={(e) => setLength(e.target.value)}
                size="small"
                sx={getCompactFieldSx(theme)}
                required
              />

              <TextField
                label="Width (mm)"
                type="number"
                value={width}
                onChange={(e) => setWidth(e.target.value)}
                size="small"
                sx={getCompactFieldSx(theme)}
                required
              />

              <TextField
                label="Height (mm)"
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                size="small"
                sx={getCompactFieldSx(theme)}
                required
              />

              <TextField
                label="CBM"
                value={calculatedCbm ? calculatedCbm.toFixed(6) : "0"}
                slotProps={{ input: { readOnly: true } }}
                size="small"
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="CBF"
                value={calculatedCbf ? calculatedCbf.toFixed(4) : "0"}
                slotProps={{ input: { readOnly: true } }}
                size="small"
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Received CBM"
                value={receivedCbm ? receivedCbm.toFixed(6) : "0"}
                slotProps={{ input: { readOnly: true } }}
                size="small"
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Available CBM"
                value={availableCbm ? availableCbm.toFixed(6) : "0"}
                slotProps={{ input: { readOnly: true } }}
                size="small"
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Rate per CBF"
                type="number"
                value={ratePerCbf}
                onChange={(e) => setRatePerCbf(e.target.value)}
                size="small"
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Amount"
                value={calculatedAmount ? calculatedAmount.toFixed(2) : "0"}
                slotProps={{ input: { readOnly: true } }}
                size="small"
                sx={getCompactFieldSx(theme)}
              />
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              {editingItemId ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setEditingItemId(null);
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
                sx={(t) => formInlineActionButtonSx(t)}
              >
                {editingItemId ? "Update Item" : "Add Item"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* Process Items Table */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader
              title={`Processed Items (${processedItems.length})`}
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
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>#</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Batch No</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Length</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Width</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Height</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>CBM</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>CBF</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Received CBM</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Available CBM</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Rate per CBF</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Amount</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No items added yet. Enter details above and click "Add Item".
                      </TableCell>
                    </TableRow>
                  ) : (
                    processedItems.map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{index + 1}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.batchNo || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.length} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.width} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.height} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.cbm}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.cbf}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.receivedCbm}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.availableCbm}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>₹{item.ratePerCbf}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>₹{item.amount}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)} align="center">
                          <Stack direction="row" spacing={1} justifyContent="center">
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
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </Box>

        {/* Reject / Available Details Table */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="Available Details" />

            <Box
              sx={{
                display: "grid",
                gap: 2,
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, 1fr)",
                  md: "repeat(5, 1fr) auto",
                },
                alignItems: "center",
              }}
            >
              <Select
                size="small"
                value="Available"
                disabled
                sx={getCompactFieldSx(theme)}
              >
                <MenuItem value="Available">Available</MenuItem>
              </Select>

              <TextField
                label="Length (mm)"
                type="number"
                size="small"
                value={raLength}
                onChange={(e) => setRaLength(e.target.value)}
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Width (mm)"
                type="number"
                size="small"
                value={raWidth}
                onChange={(e) => setRaWidth(e.target.value)}
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Thickness/Height (mm)"
                type="number"
                size="small"
                value={raHeight}
                onChange={(e) => setRaHeight(e.target.value)}
                sx={getCompactFieldSx(theme)}
              />

              <TextField
                label="Remark"
                size="small"
                value={raRemark}
                onChange={(e) => setRaRemark(e.target.value)}
                sx={getCompactFieldSx(theme)}
              />

              <Button
                variant="contained"
                startIcon={<Plus size={16} />}
                onClick={handleAddRejectAvailableItem}
                size="small"
                sx={(t) => formInlineActionButtonSx(t)}
              >
                Add
              </Button>
            </Box>

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
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Type</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Length</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Width</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Thickness/Height</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>CBM</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>CBF</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Remark</TableCell>
                    <TableCell sx={transactionTableHeaderCellSx(theme)} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rejectAvailableItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 3, color: "text.secondary" }}>
                        No Available disposition items entered.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rejectAvailableItems.map((item, index) => (
                      <TableRow key={item.id} hover>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{index + 1}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 600,
                              color: "primary.main",
                            }}
                          >
                            {item.type}
                          </Typography>
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.length || "-"} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.width || "-"} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.height || "-"} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.cbm || "-"}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.cbf || "-"}</TableCell>
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
                    ))
                  )}
                </TableBody>
              </Table>
            </Box>
          </Stack>
        </Box>

        {/* ── Bottom Action Bar (Cancel & Save Slicing) ── */}
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
            {isSubmitting ? "Saving..." : "Save Slicing"}
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
}
