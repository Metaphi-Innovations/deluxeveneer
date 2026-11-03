import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { createSlicingProcessApi, fetchSlicingIssuedById } from "../api/slicingApi";
import {
  fetchColorsApi,
  getColorByIdApi,
} from "../../../masters/color-master/api/colorMasterApi";

interface SlicingProcessItemRow {
  id: string;
  itemName: string;
  itemSubCategory: string;
  logNo: string;
  bundleNo: string;
  palletNo: string;
  color: string;
  colorId: string;
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
  type = "text",
}: {
  error?: boolean;
  onChange?: (value: string) => void;
  placeholder?: string;
  readOnly?: boolean;
  required?: boolean;
  value: string;
  width?: number;
  type?: "text" | "decimal" | "integer";
}) {
  const theme = useTheme();
  return (
    <TextField
      error={error}
      onChange={(event) => {
        let val = event.target.value;
        if (type === "integer") {
          val = val.replace(/[^0-9]/g, "");
        } else if (type === "decimal") {
          val = val.replace(/[^0-9.]/g, "");
          const parts = val.split(".");
          if (parts.length > 2) {
            val = parts[0] + "." + parts.slice(1).join("");
          }
        }
        onChange?.(val);
      }}
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
  const [color, setColor] = useState("");
  const [colorId, setColorId] = useState("");
  const [colorOptions, setColorOptions] = useState<string[]>([]);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [colorLoading, setColorLoading] = useState(false);
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [thickness, setThickness] = useState("");
  const [noOfLeaves, setNoOfLeaves] = useState("");
  const [ratePerSqf, setRatePerSqf] = useState("");
  const [remark, setRemark] = useState("");
  const [sourcePrefillDone, setSourcePrefillDone] = useState(false);

  // Preload colors on component mount
  const loadColors = useCallback(async () => {
    try {
      setColorLoading(true);
      const records = await fetchColorsApi({ status: true, limit: 500 });
      const map: Record<string, string> = {};
      const names: string[] = [];
      for (const rec of records) {
        const name = String(rec.colorName || rec.name || "").trim();
        const id = String(rec.id || "").trim();
        if (name) {
          names.push(name);
          if (id) map[name] = id;
        }
      }
      setColorOptions(names);
      setColorMap(map);
    } catch {
      // ignore
    } finally {
      setColorLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadColors();
  }, [loadColors]);

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

  // Dropdown API: refresh colors when dropdown opened
  const handleColorDropdownOpen = useCallback(() => {
    void loadColors();
  }, [loadColors]);

  // On-Select API: called each time a colour is chosen
  const handleColorSelect = useCallback(
    (selectedName: string) => {
      setColor(selectedName);
      const resolvedId = colorMap[selectedName] ?? "";
      setColorId(resolvedId);

      if (resolvedId) {
        getColorByIdApi(resolvedId)
          .then((record) => {
            if (record) {
              const canonicalName = String(record.colorName || record.name || selectedName).trim();
              setColor(canonicalName);
              setColorId(String(record.id || resolvedId));
            }
          })
          .catch(() => {});
      } else {
        fetchColorsApi({ search: selectedName, limit: 1 })
          .then((records) => {
            const first = records?.[0];
            if (first) {
              setColor(String(first.colorName || first.name || selectedName).trim());
              setColorId(String(first.id || ""));
            }
          })
          .catch(() => {});
      }
    },
    [colorMap],
  );

  // Processed Items List
  const [processedItems, setProcessedItems] = useState<SlicingProcessItemRow[]>([]);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const [raRemark, setRaRemark] = useState("");

  // Available Details editable state
  const [availLength, setAvailLength] = useState<string>("");
  const [availWidth, setAvailWidth] = useState<string>("");
  const [availHeight, setAvailHeight] = useState<string>("");
  const [availCbm, setAvailCbm] = useState<string>("");
  const [availCbf, setAvailCbf] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Calculate Process Details SQM and SQF (all dimensions in metres)
  const calculatedSqm = useMemo(() => {
    const l = Number(length) || 0;
    const w = Number(width) || 0;
    const leaves = Number(noOfLeaves) || 0;
    if (!l || !w || !leaves) return 0;
    return Number((l * w * leaves).toFixed(4));
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

  const sourceLength = useMemo(() => {
    const val = Number(stripUnit(sourceItem?.length).replace(/^-/, ""));
    return Number.isFinite(val) ? val : 0;
  }, [sourceItem]);

  const sourceWidth = useMemo(() => {
    const val = Number(stripUnit(sourceItem?.width).replace(/^-/, ""));
    return Number.isFinite(val) ? val : 0;
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

  // Output CBM = Output SQM * Thickness (all dimensions in metres)
  const totalProcessedCbm = useMemo(() => {
    return processedItems.reduce((sum, item) => {
      const leaves = item.noOfLeaves || 0;
      const itemSqm = item.sqm || item.length * item.width * leaves;
      const th = item.thickness || 0;
      return sum + itemSqm * th;
    }, 0);
  }, [processedItems]);

  const calculatedRemainingCbm = useMemo(() => {
    return sourceAvailableCbm - totalProcessedCbm;
  }, [sourceAvailableCbm, totalProcessedCbm]);

  const calculatedRemainingCbf = useMemo(
    () => Number((calculatedRemainingCbm * 35.3147).toFixed(4)),
    [calculatedRemainingCbm],
  );

  const calculatedRemainingHeight = useMemo(() => {
    if (sourceLength > 0 && sourceWidth > 0) {
      return calculatedRemainingCbm / (sourceLength * sourceWidth);
    }
    const hRaw = Number(stripUnit(sourceItem?.height ?? sourceItem?.thickness).replace(/^-/, ""));
    return Number.isFinite(hRaw) ? hRaw : 0;
  }, [calculatedRemainingCbm, sourceLength, sourceWidth, sourceItem]);

  // Auto-populate Available Details directly when Process Details or Source change
  useEffect(() => {
    const lStr = stripUnit(sourceItem?.length).replace(/^-/, "") || "";
    const wStr = stripUnit(sourceItem?.width).replace(/^-/, "") || "";
    setAvailLength(lStr);
    setAvailWidth(wStr);
    setAvailCbm(calculatedRemainingCbm.toFixed(3));
    setAvailCbf(calculatedRemainingCbf.toFixed(4));
    setAvailHeight(
      calculatedRemainingHeight
        ? calculatedRemainingHeight.toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
        : "0"
    );
  }, [
    processedItems,
    sourceItem,
    calculatedRemainingCbm,
    calculatedRemainingCbf,
    calculatedRemainingHeight,
  ]);

  // Add Item to Process Items
  const handleAddProcessItem = () => {
    const bNo = bundleNo.trim();
    const l = Number(length);
    const w = Number(width);
    const th = Number(thickness);
    const leaves = Number(noOfLeaves);

    if (!bNo) {
      setErrorMessage("Please enter Bundle No.");
      return;
    }
    if (!l || l <= 0 || isNaN(l)) {
      setErrorMessage("Please enter a valid positive Length (m).");
      return;
    }
    if (!w || w <= 0 || isNaN(w)) {
      setErrorMessage("Please enter a valid positive Width (m).");
      return;
    }
    if (!th || th <= 0 || isNaN(th)) {
      setErrorMessage("Please enter a valid positive Thickness (m).");
      return;
    }
    if (!leaves || leaves <= 0 || !Number.isInteger(leaves)) {
      setErrorMessage("Please enter a valid positive integer for No. of Leaves.");
      return;
    }

    const itemSqm = Number((l * w * leaves).toFixed(4));
    const newItemCbm = itemSqm * th;
    const otherItemsCbm = processedItems
      .filter((item) => (editingItemId ? item.id !== editingItemId : true))
      .reduce((sum, item) => {
        const iLeaves = item.noOfLeaves || 0;
        const iSqm = item.sqm || item.length * item.width * iLeaves;
        return sum + iSqm * (item.thickness || 0);
      }, 0);

    const proposedTotalCbm = otherItemsCbm + newItemCbm;
    if (proposedTotalCbm > sourceAvailableCbm) {
      setErrorMessage(
        `Insufficient available CBM. Required: ${proposedTotalCbm.toFixed(3)} CBM. Available: ${sourceAvailableCbm.toFixed(3)} CBM.`
      );
      return;
    }

    setErrorMessage("");

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
                color: color.trim(),
                colorId: colorId.trim(),
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
        color: color.trim(),
        colorId: colorId.trim(),
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

    // Reset fields for next entry - KEEP hold of length and width always
    setBundleNo("");
    setPalletNo("");
    setColor("");
    setColorId("");
    setThickness("");
    setNoOfLeaves("");
    setRatePerSqf("");
    setRemark("");
  };

  const handleEditProcessItem = (item: SlicingProcessItemRow) => {
    setEditingItemId(item.id);
    setBundleNo(item.bundleNo);
    setPalletNo(item.palletNo);
    setColor(item.color || "");
    setColorId(item.colorId || "");
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

    const finalRemLength = Number(availLength) || sourceLength || 0;
    const finalRemWidth = Number(availWidth) || sourceWidth || 0;
    const finalRemCbm = availCbm !== "" && !isNaN(Number(availCbm)) ? Number(availCbm) : calculatedRemainingCbm;
    const finalRemCbf = availCbf !== "" && !isNaN(Number(availCbf)) ? Number(availCbf) : calculatedRemainingCbf;
    const finalRemHeight =
      availHeight !== "" && !isNaN(Number(availHeight))
        ? Number(availHeight)
        : finalRemLength > 0 && finalRemWidth > 0
          ? finalRemCbm / (finalRemLength * finalRemWidth)
          : 0;

    if (totalProcessedCbm > sourceAvailableCbm || finalRemCbm < 0) {
      setErrorMessage(
        `Insufficient available CBM. Required: ${totalProcessedCbm.toFixed(3)} CBM. Available: ${sourceAvailableCbm.toFixed(3)} CBM.`
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await createSlicingProcessApi({
        issueId: targetIssueId,
        slicingDate: slicingDate ? slicingDate.toISOString().slice(0, 10) : undefined,
        remark: remark || raRemark || undefined,
        processedItems: processedItems.map((item) => ({
          logCode: item.logNo,
          batchNo: item.logNo,
          bundleNumber: item.bundleNo,
          palletNo: item.palletNo,
          colorName: item.color || undefined,
          colorId: item.colorId || undefined,
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
          length: finalRemLength,
          width: finalRemWidth,
          thickness: finalRemHeight,
          height: finalRemHeight,
          cbm: finalRemCbm,
          cbf: finalRemCbf,
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
                      <CompactTableInput onChange={setBundleNo} required value={bundleNo} width={132} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setPalletNo} value={palletNo} width={132} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <Box sx={{ width: 136, minWidth: 136 }}>
                        <ErpSelectField
                          onChange={handleColorSelect}
                          onOpen={handleColorDropdownOpen}
                          options={colorOptions}
                          placeholder={colorLoading && colorOptions.length === 0 ? "Loading…" : "Select color"}
                          searchable={colorOptions.length > 5}
                          size="dense"
                          value={color}
                        />
                      </Box>
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setLength} required type="decimal" value={length} width={100} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setWidth} required type="decimal" value={width} width={100} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setThickness} required type="decimal" value={thickness} width={110} />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput onChange={setNoOfLeaves} required type="integer" value={noOfLeaves} width={120} />
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

          {/* Inline API error — small red text below the table row, above Add Item */}
          {errorMessage ? (
            <Typography
              sx={{
                color: "error.main",
                fontSize: "12px",
                fontStyle: "italic",
                px: 0.5,
                mt: -0.5,
              }}
            >
              {errorMessage}
            </Typography>
          ) : null}

          <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 1.5 }}>
            {editingItemId ? (
              <Button
                onClick={() => {
                  setEditingItemId(null);
                  setColor("");
                  setColorId("");
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
                      <TableCell sx={bodyCellSx(theme)}>{item.color || sourceColor || "-"}</TableCell>
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
                        onChange={setAvailLength}
                        type="decimal"
                        value={availLength}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        onChange={setAvailWidth}
                        type="decimal"
                        value={availWidth}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        onChange={setAvailHeight}
                        type="decimal"
                        value={availHeight}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        onChange={(v) => {
                          setAvailCbm(v);
                          const valNum = Number(v);
                          if (!isNaN(valNum) && valNum >= 0) {
                            setAvailCbf((valNum * 35.3147).toFixed(4));
                            const l = Number(availLength) || sourceLength;
                            const w = Number(availWidth) || sourceWidth;
                            if (l > 0 && w > 0) {
                              setAvailHeight(
                                (valNum / (l * w)).toFixed(6).replace(/0+$/, "").replace(/\.$/, "")
                              );
                            }
                          }
                        }}
                        type="decimal"
                        value={availCbm}
                        width={110}
                      />
                    </TableCell>
                    <TableCell sx={bodyCellSx(theme)}>
                      <CompactTableInput
                        onChange={setAvailCbf}
                        type="decimal"
                        value={availCbf}
                        width={110}
                      />
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
