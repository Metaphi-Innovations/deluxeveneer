import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Dialog,
  DialogContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { AlertTriangle } from "lucide-react";

import { fetchWarehouseMasterPaginated } from "../../masters/warehouse-location-master/api/warehouseMasterApi";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  getAutocompleteListboxSx,
  getAutocompletePaperSx,
  getAutocompletePopperSlotProps,
} from "../../shared/dropdownMenuStyles";
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

function defaultStorageWarehouse(warehouses: readonly StorageWarehouseOption[]) {
  if (warehouses.length === 1) return warehouses[0];
  return (
    warehouses.find((warehouse) => warehouse.name.toLowerCase() === "warehouse b") ??
    warehouses[0]
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
    setSelectedId(defaultStorageWarehouse(warehouses)?.id ?? "");
  }, [hasUserPicked, row, warehouses]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedId) ?? null,
    [selectedId, warehouses],
  );

  return (
    <Dialog
      onClose={loading ? undefined : onClose}
      open={Boolean(row)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.sm}px`,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.22)",
            outline: "none",
            width: "min(420px, calc(100vw - 32px))",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogContent
        sx={(theme) => ({
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(2.5),
          px: theme.spacing(3),
          py: theme.spacing(3),
        })}
      >
        <Stack alignItems="center" spacing={1.25} sx={{ textAlign: "center" }}>
          <Box
            sx={(theme) => ({
              alignItems: "center",
              backgroundColor: theme.customTokens.brand.primaryScale[100],
              borderRadius: "50%",
              color: theme.customTokens.brand.primary,
              display: "flex",
              height: 48,
              justifyContent: "center",
              width: 48,
            })}
          >
            <AlertTriangle size={22} />
          </Box>
          <Typography variant="h3" color="text.primary">
            Move to Warehouse B
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to move this item to the storage warehouse?
          </Typography>
        </Stack>

        <Autocomplete
          disabled={loading}
          fullWidth
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
            popper: getAutocompletePopperSlotProps(theme, 360),
            paper: {
              sx: getAutocompletePaperSx(theme),
            },
            listbox: {
              sx: getAutocompleteListboxSx(theme, true),
            },
          }}
          value={selectedWarehouse}
        />

        <Box
          sx={(theme) => ({
            display: "flex",
            gap: theme.spacing(1.5),
            justifyContent: "center",
          })}
        >
          <Button
            disabled={loading}
            onClick={onClose}
            sx={recordFormActionButtonSx}
            variant="outlined"
          >
            Cancel
          </Button>
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
        </Box>
      </DialogContent>
    </Dialog>
  );
}
