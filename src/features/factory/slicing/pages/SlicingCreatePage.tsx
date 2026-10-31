import { useEffect, useMemo, useState, type ReactNode } from "react";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import type { Theme } from "@mui/material/styles";

import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import {
  formInlineActionButtonSx,
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
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
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

function formatDisplayDate(value: unknown) {
  if (!value) return "-";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  const text = String(value).trim();
  if (!text) return "-";
  const parsed = new Date(text);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }
  return text.slice(0, 10);
}

function stripUnit(value: unknown) {
  return value ? String(value).replace(/\s*(m|mm|mtr)$/i, "") : "-";
}

function headerCellSx(theme: Theme, minWidth: number) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    fontSize: "11px",
    lineHeight: 1.2,
    whiteSpace: "nowrap" as const,
  };
}

function bodyCellSx(theme: Theme) {
  return {
    ...transactionTableBodyCellSx(theme),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    py: 0.75,
    px: 1,
    verticalAlign: "middle" as const,
  };
}

function tableScrollSx(theme: Theme) {
  return {
    overflowX: "auto" as const,
    overflowY: "hidden" as const,
    scrollbarWidth: "thin" as const,
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": { height: 8 },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: theme.customTokens.brand.primary,
      borderRadius: theme.customTokens.radius.pill,
    },
  };
}

function CompactTableInput({
  error,
  onChange,
  placeholder,
  readOnly,
  required,
  value,
  width = 120,
}: {
  error?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value: string;
  width?: number;
}) {
  const theme = useTheme();
  return (
    <TextField
      error={error}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      required={required}
      size="small"
      slotProps={{
        input: { readOnly },
      }}
      sx={{
        width,
        minWidth: width,
        "& .MuiInputBase-root": { height: 32, fontSize: "12px" },
        "& .MuiInputBase-input": { py: "4px", px: "8px", fontSize: "12px" },
        backgroundColor: readOnly
          ? theme.customTokens.surfaces.alt
          : theme.customTokens.surfaces.surface,
      }}
      value={value}
    />
  );
}

function RequiredHeader({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <Box component="span" sx={{ color: "error.main" }}>
        {" "}
        *
      </Box>
    </>
  );
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

  const [loadedSourceItem, setLoadedSourceItem] = useState<any | null>(null);
  const sourceItem = loadedSourceItem || state?.sourceItem || state?.sourceRow;

  // Slicing Date
  const [slicingDate, setSlicingDate] = useState<Date | null>(new Date());

  // Master Dropdown state

  const [bundleNo, setBundleNo] = useState("");
  const [palletNo, setPalletNo] = useState("");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [noOfLeaves, setNoOfLeaves] = useState("");
  const [ratePerSqf, setRatePerSqf] = useState("");
  const [remark, setRemark] = useState("");
  const [sourcePrefillDone, setSourcePrefillDone] = useState(false);

  // Create Fetch API: fetch live issue data by ID if state not fully populated
  useEffect(() => {
    const idToFetch = state?.issueId || state?.issueItemId;
    if (idToFetch && !loadedSourceItem) {
      void fetchSlicingIssuedById(idToFetch)
        .then((data) => {
          if (data) {
            setLoadedSourceItem(data);
          }
        })
        .catch(() => {});
    }
  }, [state?.issueId, state?.issueItemId, loadedSourceItem]);

  useEffect(() => {
    if (!sourceItem || sourcePrefillDone) {
      return;
    }
    setBundleNo((current) => current || String(sourceItem.bundleNumber || sourceItem.bundleNo || ""));
    setPalletNo((current) => current || String(sourceItem.palletNo || ""));
    setLength((current) => current || stripUnit(sourceItem.length).replace(/^-/, ""));
    setWidth((current) => current || stripUnit(sourceItem.width).replace(/^-/, ""));
    setRemark((current) => current || String(sourceItem.remark || ""));
    setSourcePrefillDone(true);
  }, [sourceItem, sourcePrefillDone]);

  // Processed Items List
  const [processedItems, setProcessedItems] = useState<SlicingProcessItemRow[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

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

  const sourceAvailableCbm = useMemo(() => {
    const raw =
      sourceItem?.availableCbm ??
      sourceItem?.receivedCbm ??
      sourceItem?.cbm ??
      0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [sourceItem]);

  const sourceReceivedCbm = useMemo(() => {
    const raw = sourceItem?.receivedCbm ?? sourceItem?.cbm ?? 0;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [sourceItem]);

  const sourceColor = String(
    sourceItem?.colorName || sourceItem?.color || "",
  );

  const sourceOverviewItems = useMemo(() => {
    if (!sourceItem) return [];

    return [
      { label: "Storage Sr No.", value: String(sourceItem.storageSrNo || "-") },
      {
        label: "Issue Date",
        value: formatDisplayDate(sourceItem.issueDate || sourceItem.issuedDate),
      },
      { label: "Item Name", value: String(sourceItem.itemName || "-") },
      { label: "Length", value: stripUnit(sourceItem.length) },
      { label: "Width", value: stripUnit(sourceItem.width) },
      {
        label: "Height",
        value: stripUnit(sourceItem.height ?? sourceItem.thickness),
      },
      {
        label: "Received CBM",
        value: sourceReceivedCbm ? Number(sourceReceivedCbm).toFixed(3) : "-",
      },
      {
        label: "Available CBM",
        value: sourceAvailableCbm ? Number(sourceAvailableCbm).toFixed(3) : "-",
      },
    ];
  }, [sourceItem, sourceAvailableCbm, sourceReceivedCbm]);

  const remainingCbmPreview = useMemo(() => {
    const processedCbm = processedItems.reduce((sum, item) => {
      const lM = item.length > 50 ? item.length / 1000 : item.length;
      const wM = item.width > 50 ? item.width / 1000 : item.width;
      const tM = item.thickness > 50 ? item.thickness / 1000 : item.thickness;
      const leaves = item.noOfLeaves || 1;
      return sum + lM * wM * (tM || 0) * leaves;
    }, 0);
    return Math.max(0, sourceAvailableCbm - processedCbm);
  }, [processedItems, sourceAvailableCbm]);

  const remainingCbfPreview = useMemo(
    () => Number((remainingCbmPreview * 35.3147).toFixed(4)),
    [remainingCbmPreview],
  );

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
      const remainingLength = Number(stripUnit(sourceItem?.length).replace(/^-/, "")) || 0;
      const remainingWidth = Number(stripUnit(sourceItem?.width).replace(/^-/, "")) || 0;
      const remainingHeight =
        remainingLength > 0 && remainingWidth > 0
          ? remainingCbmPreview / (remainingLength * remainingWidth)
          : 0;

      await createSlicingProcessApi({
        issueId: targetIssueId,
        slicingDate: slicingDate ? slicingDate.toISOString().slice(0, 10) : undefined,
        remark: remark || raRemark || undefined,
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
        remaining: {
          length: remainingLength,
          width: remainingWidth,
          thickness: remainingHeight,
          height: remainingHeight,
          cbm: remainingCbmPreview,
        },
      });

      // Navigate to Slicing Done tab
      navigate("/factory/slicing?tab=done");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to save slicing process.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const remainingHeightPreview =
    Number(stripUnit(sourceItem?.length).replace(/^-/, "")) > 0 &&
    Number(stripUnit(sourceItem?.width).replace(/^-/, "")) > 0
      ? remainingCbmPreview /
        (Number(stripUnit(sourceItem?.length).replace(/^-/, "")) *
          Number(stripUnit(sourceItem?.width).replace(/^-/, "")))
      : 0;

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory" },
        { label: "Slicing", to: "/factory/slicing" },
        { label: "Create Slicing" },
      ]}
      title="Create Slicing Process"
      subtitle="Slice veneer block into bundles for drying."
    >
      <Stack spacing={3}>
        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        {/* Source Overview Panel */}
        {sourceOverviewItems.length > 0 ? (
          <FactorySourceOverviewPanel items={sourceOverviewItems} />
        ) : null}

        <Box sx={{ maxWidth: 220 }}>
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
          <ErpDatePickerField onChange={setSlicingDate} value={slicingDate} />
        </Box>

        <Stack spacing={1.5}>
          <FormSectionHeader
            title={editingItemId ? "Edit Output Item" : "Output Details"}
          />
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
            }}
          >
            <Box sx={tableScrollSx(theme)}>
              <Table size="small" sx={{ minWidth: 1280, tableLayout: "auto" }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx(theme, 140)}>Bundle No</TableCell>
                    <TableCell sx={headerCellSx(theme, 140)}>Pallet No</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>Color</TableCell>
                    <TableCell sx={headerCellSx(theme, 110)}>Length</TableCell>
                    <TableCell sx={headerCellSx(theme, 110)}>
                      <RequiredHeader>Width</RequiredHeader>
                    </TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>
                      <RequiredHeader>Thickness</RequiredHeader>
                    </TableCell>
                    <TableCell sx={headerCellSx(theme, 130)}>
                      <RequiredHeader>No. of Leaves</RequiredHeader>
                    </TableCell>
                    <TableCell sx={headerCellSx(theme, 100)}>SQM</TableCell>
                    <TableCell sx={headerCellSx(theme, 100)}>SQF</TableCell>
                    <TableCell sx={headerCellSx(theme, 180)}>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setBundleNo} value={bundleNo} width={132} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setPalletNo} value={palletNo} width={132} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput readOnly value={sourceColor || "-"} width={112} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setLength} value={length} width={100} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setWidth} required value={width} width={100} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setThickness} required value={thickness} width={110} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setNoOfLeaves} required value={noOfLeaves} width={120} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput readOnly value={calculatedSqm ? calculatedSqm.toFixed(3) : "-"} width={90} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput readOnly value={calculatedSqf ? calculatedSqf.toFixed(3) : "-"} width={90} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setRemark} value={remark} width={170} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>
          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5 }}>
            {editingItemId ? (
              <Button
                onClick={() => {
                  setEditingItemId(null);
                  setThickness("");
                  setNoOfLeaves("");
                }}
                size="small"
                sx={recordFormActionButtonSx}
                variant="outlined"
              >
                Cancel Edit
              </Button>
            ) : null}
            <Button
              onClick={handleAddProcessItem}
              size="small"
              startIcon={<Plus size={15} />}
              sx={(t) => formInlineActionButtonSx(t)}
              variant="contained"
            >
              {editingItemId ? "Update Item" : "Add Item"}
            </Button>
          </Box>
        </Stack>

        {processedItems.length > 0 ? (
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
            }}
          >
            <Box sx={tableScrollSx(theme)}>
              <Table size="small" sx={{ minWidth: 1280 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx(theme, 48)}>#</TableCell>
                    <TableCell sx={headerCellSx(theme, 140)}>Bundle No</TableCell>
                    <TableCell sx={headerCellSx(theme, 140)}>Pallet No</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>Color</TableCell>
                    <TableCell sx={headerCellSx(theme, 110)}>Length</TableCell>
                    <TableCell sx={headerCellSx(theme, 110)}>Width</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>Thickness</TableCell>
                    <TableCell sx={headerCellSx(theme, 130)}>No. of Leaves</TableCell>
                    <TableCell sx={headerCellSx(theme, 100)}>SQM</TableCell>
                    <TableCell sx={headerCellSx(theme, 100)}>SQF</TableCell>
                    <TableCell sx={headerCellSx(theme, 180)}>Remark</TableCell>
                    <TableCell align="center" sx={headerCellSx(theme, 88)}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {processedItems.map((item, index) => (
                    <TableRow hover key={item.id}>
                      <TableCell sx={bodyCellSx(theme)}>{index + 1}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.bundleNo || "-"}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.palletNo || "-"}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{sourceColor || "-"}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.length}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.width}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.thickness || "-"}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.noOfLeaves}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.sqm.toFixed(3)}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.sqf.toFixed(3)}</TableCell>
                      <TableCell sx={bodyCellSx(theme)}>{item.remark || "-"}</TableCell>
                      <TableCell align="center" sx={bodyCellSx(theme)}>
                        <Stack direction="row" justifyContent="center" spacing={0.5}>
                          <IconButton color="primary" onClick={() => handleEditProcessItem(item)} size="small" title="Edit">
                            <Pencil size={15} />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleDeleteProcessItem(item.id)} size="small" title="Delete">
                            <Trash2 size={15} />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Box>
        ) : null}

        <Stack spacing={1.5}>
          <FormSectionHeader title="Available Details" />
          <Box
            sx={{
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "8px",
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
            }}
          >
            <Box sx={tableScrollSx(theme)}>
              <Table size="small" sx={{ minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={headerCellSx(theme, 130)}>Type</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>Length</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>Width</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>Height</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>CBM</TableCell>
                    <TableCell sx={headerCellSx(theme, 120)}>CBF</TableCell>
                    <TableCell sx={headerCellSx(theme, 180)}>Remark</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  <TableRow>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput readOnly value="Available" width={118} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        readOnly
                        value={stripUnit(sourceItem?.length).replace(/^-/, "") || "-"}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        readOnly
                        value={stripUnit(sourceItem?.width).replace(/^-/, "") || "-"}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        readOnly
                        value={remainingHeightPreview ? remainingHeightPreview.toFixed(6).replace(/0+$/, "").replace(/\.$/, "") : "0"}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput readOnly value={remainingCbmPreview.toFixed(3)} width={110} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput readOnly value={remainingCbfPreview.toFixed(4)} width={110} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setRaRemark} value={raRemark} width={170} />
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Box>
        </Stack>

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
            disabled={isSubmitting}
            onClick={() => navigate("/factory/slicing")}
            sx={recordFormActionButtonSx}
            type="button"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button
            disabled={isSubmitting}
            disableElevation
            onClick={() => void handleSubmit()}
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
            type="button"
            variant="contained"
          >
            {isSubmitting ? "Saving..." : "Save Process"}
          </Button>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
}
