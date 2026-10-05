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
import { Check, Edit, Pencil, Plus, Trash2, X } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";
import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { createSawingProcessApi } from "../api/sawingApi";

interface ProcessItemRow {
  id: string;
  batchNo: string;
  length: number;
  width: number;
  thickness: number;
  cbm: number;
  cbf: number;
  ratePerCbf: number;
  amount: number;
  remark?: string;
}

interface RejectAvailableRow {
  id: string;
  type: "Reject" | "Available";
  length: number;
  width: number;
  height: number;
  cbm: number;
  cbf: number;
  amount: number;
  remark: string;
}

export function SawingCreatePage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const state = location.state as
    | {
        sourceItem?: any;
        issueItemId?: string;
        issueId?: string;
        storageWarehouseId?: string;
      }
    | undefined;

  const sourceItem = state?.sourceItem;
  const issueItemId = state?.issueItemId || sourceItem?.id;
  const issueId = state?.issueId || sourceItem?.issueId;
  const storageWarehouseId = state?.storageWarehouseId || sourceItem?.storageWarehouseId;

  // Process details input state
  const [batchNo, setBatchNo] = useState(sourceItem?.batchNo || "");
  const [length, setLength] = useState(sourceItem?.length ? String(sourceItem.length) : "");
  const [width, setWidth] = useState(sourceItem?.width ? String(sourceItem.width) : "");
  const [thickness, setThickness] = useState("");
  const [ratePerCbf, setRatePerCbf] = useState(sourceItem?.ratePerCbf ? String(sourceItem.ratePerCbf) : "");
  const [remark, setRemark] = useState("");

  // Processed Items List
  const [processedItems, setProcessedItems] = useState<ProcessItemRow[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Reject / Available Details List
  const [rejectAvailableItems, setRejectAvailableItems] = useState<RejectAvailableRow[]>([]);

  // Reject / Available row input state for adding
  const [raType, setRaType] = useState<"Reject" | "Available">("Reject");
  const [raLength, setRaLength] = useState("");
  const [raWidth, setRaWidth] = useState("");
  const [raHeight, setRaHeight] = useState("");
  const [raRemark, setRaRemark] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-calculated fields for Process Details
  const calculatedCbm = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const t = Number(thickness) || 0;
    if (!l || !w || !t) return 0;
    const isMm = l > 50 || w > 50;
    const divisor = isMm ? 1_000_000_000 : 1_000_000;
    return Number(((l * w * t) / divisor).toFixed(6));
  }, [length, width, thickness]);

  const calculatedCbf = useMemo(() => {
    if (!calculatedCbm) return 0;
    return Number((calculatedCbm * 35.3147).toFixed(4));
  }, [calculatedCbm]);

  const calculatedAmount = useMemo(() => {
    const rate = Number(ratePerCbf) || 0;
    if (!calculatedCbf || !rate) return 0;
    return Number((calculatedCbf * rate).toFixed(2));
  }, [calculatedCbf, ratePerCbf]);

  // Auto-calculated fields for Reject / Available add
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

  // ── Source Overview items ─────────────────────────────────────────
  const sourceOverviewItems = useMemo(() => {
    if (!sourceItem) return [];
    return [
      { label: "Storage Sr No.", value: sourceItem.storageSrNo || "-" },
      { label: "Sawing Sr No.", value: sourceItem.sawingSrNo || "-" },
      { label: "Item Name", value: sourceItem.itemName || "-" },
      { label: "Sub Category", value: sourceItem.subCategory || sourceItem.itemSubCategoryName || "-" },
      { label: "Batch No", value: sourceItem.batchNo || "-" },
      { label: "Source Length", value: sourceItem.length ? `${sourceItem.length} mm` : "-" },
      { label: "Source Width", value: sourceItem.width ? `${sourceItem.width} mm` : "-" },
      { label: "Source Height", value: sourceItem.height ? `${sourceItem.height} mm` : "-" },
      { label: "Source CBM", value: sourceItem.cbm ?? "-" },
      { label: "Warehouse", value: sourceItem.storageWarehouseName || "-" },
    ];
  }, [sourceItem]);

  // ── Add Item to Process Items ─────────────────────────────────────
  const handleAddProcessItem = () => {
    const l = Number(length);
    const w = Number(width);
    const t = Number(thickness);

    if (!l || !w || !t) {
      alert("Please enter Length, Width, and Height");
      return;
    }

    if (editingItemId) {
      // Update existing item
      setProcessedItems((prev) =>
        prev.map((item) =>
          item.id === editingItemId
            ? {
                ...item,
                batchNo: batchNo.trim() || sourceItem?.batchNo || "",
                length: l,
                width: w,
                thickness: t,
                cbm: calculatedCbm,
                cbf: calculatedCbf,
                ratePerCbf: Number(ratePerCbf) || 0,
                amount: calculatedAmount,
                remark,
              }
            : item
        )
      );
      setEditingItemId(null);
    } else {
      // Add new item
      const newItem: ProcessItemRow = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        batchNo: batchNo.trim() || sourceItem?.batchNo || "",
        length: l,
        width: w,
        thickness: t,
        cbm: calculatedCbm,
        cbf: calculatedCbf,
        ratePerCbf: Number(ratePerCbf) || 0,
        amount: calculatedAmount,
        remark,
      };
      setProcessedItems((prev) => [...prev, newItem]);
    }

    // Clear the input fields above to enter new ones
    setBatchNo(sourceItem?.batchNo || "");
    setLength(sourceItem?.length ? String(sourceItem.length) : "");
    setWidth(sourceItem?.width ? String(sourceItem.width) : "");
    setThickness("");
    setRatePerCbf(sourceItem?.ratePerCbf ? String(sourceItem.ratePerCbf) : "");
    setRemark("");
  };

  const handleEditProcessItem = (item: ProcessItemRow) => {
    setEditingItemId(item.id);
    setBatchNo(item.batchNo);
    setLength(String(item.length));
    setWidth(String(item.width));
    setThickness(String(item.thickness));
    setRatePerCbf(item.ratePerCbf ? String(item.ratePerCbf) : "");
    setRemark(item.remark || "");
  };

  const handleDeleteProcessItem = (id: string) => {
    setProcessedItems((prev) => prev.filter((it) => it.id !== id));
    if (editingItemId === id) {
      setEditingItemId(null);
      setThickness("");
    }
  };

  // ── Add Item to Reject / Available ────────────────────────────────
  const handleAddRejectAvailableItem = () => {
    const l = Number(raLength) || 0;
    const w = Number(raWidth) || 0;
    const h = Number(raHeight) || 0;

    const newRa: RejectAvailableRow = {
      id: `ra-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type: raType,
      length: l,
      width: w,
      height: h,
      cbm: calculatedRaCbm,
      cbf: calculatedRaCbf,
      amount: 0,
      remark: raRemark,
    };

    setRejectAvailableItems((prev) => [...prev, newRa]);
    setRaLength("");
    setRaWidth("");
    setRaHeight("");
    setRaRemark("");
  };

  const handleDeleteRejectAvailableItem = (id: string) => {
    setRejectAvailableItems((prev) => prev.filter((it) => it.id !== id));
  };

  // ── Save / Submit Sawing Process ──────────────────────────────────
  const handleSubmit = async () => {
    if (processedItems.length === 0) {
      setErrorMessage("Please add at least one processed item before saving.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createSawingProcessApi({
        issueItemId,
        issueId,
        storageWarehouseId,
        processedItems: processedItems.map((p) => ({
          batchNo: p.batchNo,
          length: p.length,
          width: p.width,
          thickness: p.thickness,
          cbm: p.cbm,
          cbf: p.cbf,
          ratePerCbf: p.ratePerCbf,
          amount: p.amount,
          ...(p.remark ? { remark: p.remark } : {}),
        })),
        rejectAvailableItems: rejectAvailableItems.map((ra) => ({
          type: ra.type,
          length: ra.length,
          width: ra.width,
          height: ra.height,
          thickness: ra.height,
          cbm: ra.cbm,
          cbf: ra.cbf,
          amount: ra.amount,
          remark: ra.remark,
        })),
      });

      // Redirect to Sawing Done tab
      navigate("/factory/sawing?tab=done");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save sawing process.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory" },
        { label: "Sawing", to: "/factory/sawing" },
        { label: "Create Sawing" },
      ]}
      subtitle="Process veneer block into sawn flitches/sheets."
      title="Create Sawing Process"
      actions={
        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            onClick={() => navigate("/factory/sawing")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={isSubmitting || processedItems.length === 0}
            sx={{
              backgroundColor: theme.palette.primary.main,
              fontWeight: 600,
            }}
          >
            {isSubmitting ? "Saving..." : "Save Sawing"}
          </Button>
        </Stack>
      }
    >
      <Stack spacing={3}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {/* ── Source Overview Panel ── */}
        {sourceOverviewItems.length > 0 ? (
          <FactorySourceOverviewPanel items={sourceOverviewItems} />
        ) : null}

        {/* ── Process Details Input Form ── */}
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
                  md: "repeat(4, 1fr)",
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
                value={thickness}
                onChange={(e) => setThickness(e.target.value)}
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
            </Box>

            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              {editingItemId ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => {
                    setEditingItemId(null);
                    setThickness("");
                  }}
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
                  backgroundColor: theme.palette.primary.main,
                  fontWeight: 600,
                  textTransform: "none",
                  px: 2.5,
                }}
              >
                {editingItemId ? "Update Item" : "Add Item"}
              </Button>
            </Stack>
          </Stack>
        </Box>

        {/* ── Process Items Table ── */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader
              title={`Processed Items (${processedItems.length})`}
            />

            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: "8px",
                overflow: "hidden",
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
                    <TableCell sx={transactionTableHeaderCellSx(theme)} align="center">
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 3, color: "text.secondary" }}>
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
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.thickness} mm</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.cbm}</TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>{item.cbf}</TableCell>
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

        {/* ── Reject / Available Details Table ── */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="Reject / Available Details" />

            {/* Input row for Reject / Available add */}
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
                value={raType}
                onChange={(e) => setRaType(e.target.value as "Reject" | "Available")}
                sx={getCompactFieldSx(theme)}
              >
                <MenuItem value="Reject">Reject</MenuItem>
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
                label="Height (mm)"
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
                variant="outlined"
                startIcon={<Plus size={16} />}
                onClick={handleAddRejectAvailableItem}
                size="small"
                sx={{
                  textTransform: "none",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  minHeight: 38,
                }}
              >
                + Add
              </Button>
            </Box>

            {/* Reject / Available table */}
            <Box
              sx={{
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: "8px",
                overflow: "hidden",
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
                    <TableCell sx={transactionTableHeaderCellSx(theme)}>Height</TableCell>
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
                        No Reject or Available disposition items entered.
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
                              color: item.type === "Reject" ? "error.main" : "primary.main",
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
      </Stack>
    </FactoryPageShell>
  );
}
