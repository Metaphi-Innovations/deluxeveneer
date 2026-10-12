import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { fetchWarehouseMasterPaginated } from "../../masters/warehouse-location-master/api/warehouseMasterApi";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  getAutocompleteListboxSx,
  getAutocompletePaperSx,
  getAutocompletePopperSlotProps,
} from "../../shared/dropdownMenuStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import {
  formatInspectionDialogDate,
  getFactoryString,
  inspectionDialogPaperSx,
} from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

type StorageWarehouseOption = {
  id: string;
  name: string;
  city: string;
  state: string;
};

function formatWarehouseLocationLabel(name: string, city?: string, state?: string) {
  const cityLabel = city?.trim() || "—";
  const stateLabel = state?.trim() || "—";
  return `${name} (${cityLabel}, ${stateLabel})`;
}

function readDetail(row: FactoryRecord | null, keys: readonly string[]) {
  if (!row) return "-";
  for (const key of keys) {
    const value = row[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return formatInspectionDialogDate(value);
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
    const text = getFactoryString(value);
    if (text) return text;
  }
  return "-";
}

function readLeafCount(row: FactoryRecord | null) {
  const raw = readDetail(row, ["noOfLeaves", "noOfSheets", "leaves", "availableLeaves"]);
  if (raw === "-") return "-";
  const parsed = Number(raw.replace(/[^\d.]/g, ""));
  if (!Number.isFinite(parsed)) return raw;
  return Number.isInteger(parsed) ? String(parsed) : String(parsed);
}

function currentWarehouseId(row: FactoryRecord | null) {
  return getFactoryString(row?.storageWarehouseId);
}

function currentWarehouseName(row: FactoryRecord | null) {
  return (
    getFactoryString(row?.storageWarehouseName) ||
    getFactoryString(row?.warehouseName) ||
    getFactoryString(row?.sourceWarehouseName)
  );
}

export function MoveToWarehouseBDialog<Row extends FactoryRecord>({
  onClose,
  onConfirm,
  row,
}: {
  onClose: () => void;
  onConfirm: (warehouse: StorageWarehouseOption) => void;
  row: Row | null;
}) {
  const theme = useTheme();
  const [warehouses, setWarehouses] = useState<StorageWarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [hasUserPicked, setHasUserPicked] = useState(false);

  useEffect(() => {
    if (!row) return;

    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setWarehouses([]);
    setSelectedId("");
    setHasUserPicked(false);

    void fetchWarehouseMasterPaginated({
      type: "Storage",
      status: true,
      limit: 200,
      sortBy: "name",
      sortOrder: "asc",
    })
      .then((result) => {
        if (cancelled) return;
        const options = result.items
          .map((record) => ({
            id: String(record.id ?? ""),
            name: String(record.warehouseName ?? "").trim(),
            city: String(record.city ?? "").trim(),
            state: String(record.state ?? "").trim(),
          }))
          .filter((option) => option.id && option.name);
        setWarehouses(options);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWarehouses([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load storage warehouses.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [row]);

  useEffect(() => {
    if (!row || hasUserPicked || warehouses.length === 0) return;

    const preferredId = currentWarehouseId(row);
    const preferredName = currentWarehouseName(row).toLowerCase();
    const match =
      warehouses.find((warehouse) => warehouse.id === preferredId) ??
      warehouses.find((warehouse) => warehouse.name.toLowerCase() === preferredName) ??
      warehouses[0];

    setSelectedId(match?.id ?? "");
  }, [hasUserPicked, row, warehouses]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedId) ?? null,
    [selectedId, warehouses],
  );

  const details: Array<readonly [string, string]> = [
    ["Storage Sr No.", readDetail(row, ["storageSrNo", "storageSerialNumber"])],
    ["Issue Date", readDetail(row, ["issueDate", "issuedDate"])],
    ["Item Name", readDetail(row, ["itemName", "productName"])],
    ["Sub Category", readDetail(row, ["subCategory", "itemSubCategory"])],
    ["Log Code", readDetail(row, ["logCode", "logNo", "batchNo"])],
    ["Bundle Number", readDetail(row, ["bundleNumber", "bundleNo"])],
    ["Pallet No", readDetail(row, ["palletNo"])],
    ["Length", readDetail(row, ["length"])],
    ["Width", readDetail(row, ["width"])],
    ["Thickness", readDetail(row, ["thickness", "height"])],
    ["No of Leaves", readLeafCount(row)],
    ["Pass Qty (Leaves)", readDetail(row, ["passQty"])],
    ["Failed Qty (Leaves)", readDetail(row, ["failQty"])],
    ["Total Sq Meter", readDetail(row, ["totalSqMeter", "sqm"])],
    ["Remark", readDetail(row, ["remark"])],
  ];

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={Boolean(row)}
      slotProps={{
        paper: {
          sx: inspectionDialogPaperSx,
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Move to Warehouse B
      </DialogTitle>
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack spacing={2}>
          <Box
            sx={(theme) => ({
              ...formSectionCardSx(theme),
              backgroundColor: theme.customTokens.surfaces.alt,
            })}
          >
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              <FormSectionHeader title="Item Details" />
              <Box
                sx={(theme) => ({
                  display: "grid",
                  gap: theme.spacing(1.5),
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                })}
              >
                {details.map(([label, value]) => (
                  <Stack key={label} spacing={0.25}>
                    <Typography
                      sx={(theme) => ({
                        color: theme.customTokens.text.secondary,
                        fontSize: theme.typography.caption.fontSize,
                        fontWeight: 600,
                      })}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={(theme) => ({
                        color: theme.customTokens.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: 600,
                        lineHeight: 1.4,
                      })}
                    >
                      {value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            </Stack>
          </Box>

          <Box sx={(theme) => formSectionCardSx(theme)}>
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              <FormSectionHeader title="Warehouse Details" />
              <Box
                sx={(theme) => ({
                  display: "grid",
                  gap: theme.spacing(1.5),
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))",
                  },
                })}
              >
                {(
                  [
                    ["Inventory", "Raw Veneer"],
                    ["No of Leaves", readLeafCount(row)],
                    ["Inspection Date", readDetail(row, ["inspectionDate", "issuedInspectionDate", "processDate"])],
                    ["Remark", readDetail(row, ["remark", "inspectionRemark"])],
                  ] as const
                ).map(([label, value]) => (
                  <Stack key={label} spacing={0.25}>
                    <Typography
                      sx={(theme) => ({
                        color: theme.customTokens.text.secondary,
                        fontSize: theme.typography.caption.fontSize,
                        fontWeight: 600,
                      })}
                    >
                      {label}
                    </Typography>
                    <Typography
                      sx={(theme) => ({
                        color: theme.customTokens.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                        fontWeight: 600,
                        lineHeight: 1.4,
                      })}
                    >
                      {value}
                    </Typography>
                  </Stack>
                ))}
              </Box>
              <Autocomplete
                disabled={loading}
                getOptionLabel={(option) =>
                  formatWarehouseLocationLabel(option.name, option.city, option.state)
                }
                isOptionEqualToValue={(option, value) => option.id === value.id}
                loading={loading}
                onChange={(_event, value) => {
                  setHasUserPicked(true);
                  setSelectedId(value?.id ?? "");
                }}
                options={warehouses}
                size="small"
                sx={{
                  width: { xs: "100%", sm: 420 },
                  maxWidth: "100%",
                  "& .MuiInputBase-root": {
                    minHeight: 32,
                    height: 32,
                    py: 0,
                  },
                  "& .MuiInputBase-input": {
                    py: "4px !important",
                    fontSize: "0.8125rem",
                  },
                  "& .MuiInputLabel-root": {
                    fontSize: "0.8125rem",
                  },
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(loadError)}
                    helperText={loadError || undefined}
                    label="Storage warehouse"
                    placeholder="Select storage"
                    required
                    size="small"
                  />
                )}
                renderOption={(props, option) => (
                  <Box component="li" {...props} key={option.id}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                        {option.name}
                      </Typography>
                      <Typography
                        sx={{
                          color: "inherit",
                          opacity: 0.85,
                          fontSize: "0.6875rem",
                        }}
                      >
                        {[option.city || "—", option.state || "—"].join(", ")}
                      </Typography>
                    </Box>
                  </Box>
                )}
                slotProps={{
                  popper: getAutocompletePopperSlotProps(theme, 460),
                  paper: {
                    sx: getAutocompletePaperSx(theme),
                  },
                  listbox: {
                    sx: getAutocompleteListboxSx(theme, true),
                  },
                }}
                value={selectedWarehouse}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          gap: theme.spacing(1),
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          disabled={!selectedWarehouse || loading}
          onClick={() => {
            if (selectedWarehouse) onConfirm(selectedWarehouse);
          }}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
}
