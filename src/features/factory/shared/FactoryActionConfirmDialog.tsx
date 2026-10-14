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
import type { Theme } from "@mui/material/styles";
import { useTheme } from "@mui/material/styles";
import { AlertTriangle } from "lucide-react";

import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  getAutocompleteListboxSx,
  getAutocompletePaperSx,
  getAutocompletePopperSlotProps,
} from "../../shared/dropdownMenuStyles";
import { fetchWarehouseMasterPaginated } from "../../masters/warehouse-location-master/api/warehouseMasterApi";

export type ProductionWarehouseOption = {
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

export function FactoryActionConfirmDialog({
  confirmLabel,
  description,
  onClose,
  onConfirm,
  open,
  showWarehouse = false,
  title,
  tone = "default",
}: {
  confirmLabel: string;
  description: string;
  onClose: () => void;
  onConfirm: (warehouse: ProductionWarehouseOption | null) => void;
  open: boolean;
  showWarehouse?: boolean;
  title: string;
  tone?: "danger" | "default";
}) {
  const theme = useTheme();
  const [warehouses, setWarehouses] = useState<ProductionWarehouseOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState("");

  useEffect(() => {
    if (!open || !showWarehouse) {
      setWarehouses([]);
      setSelectedId("");
      setLoadError("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setLoadError("");
    setWarehouses([]);
    setSelectedId("");

    void fetchWarehouseMasterPaginated({
      type: "Production",
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
        setSelectedId(options[0]?.id ?? "");
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setWarehouses([]);
        setLoadError(
          error instanceof Error
            ? error.message
            : "Failed to load production warehouses.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, showWarehouse]);

  const selectedWarehouse = useMemo(
    () => warehouses.find((warehouse) => warehouse.id === selectedId) ?? null,
    [selectedId, warehouses],
  );
  const confirmDisabled = showWarehouse && (loading || !selectedWarehouse);

  return (
    <Dialog
      onClose={loading ? undefined : onClose}
      open={open}
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
              backgroundColor:
                tone === "danger"
                  ? theme.customTokens.semanticScale.error[100]
                  : theme.customTokens.brand.primaryScale[100],
              borderRadius: "50%",
              color:
                tone === "danger"
                  ? theme.customTokens.semanticScale.error[700]
                  : theme.customTokens.brand.primary,
              display: "flex",
              height: 48,
              justifyContent: "center",
              width: 48,
            })}
          >
            <AlertTriangle size={22} />
          </Box>
          <Typography variant="h3" color="text.primary">
            {title}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>

        {showWarehouse ? (
          <Autocomplete
            disabled={loading}
            fullWidth
            getOptionLabel={(option) =>
              formatWarehouseLocationLabel(option.name, option.city, option.state)
            }
            isOptionEqualToValue={(option, value) => option.id === value.id}
            loading={loading}
            onChange={(_event, value) => setSelectedId(value?.id ?? "")}
            options={warehouses}
            size="small"
            value={selectedWarehouse}
            renderInput={(params) => (
              <TextField
                {...params}
                error={Boolean(loadError)}
                helperText={loadError || undefined}
                label="Production warehouse"
                placeholder="Select production warehouse"
                required
              />
            )}
            slotProps={{
              paper: { sx: getAutocompletePaperSx },
              popper: getAutocompletePopperSlotProps(theme, 360),
              listbox: { sx: getAutocompleteListboxSx },
            }}
          />
        ) : null}

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
            disabled={confirmDisabled}
            onClick={() => onConfirm(showWarehouse ? selectedWarehouse : null)}
            sx={[
              recordFormActionButtonSx,
              tone === "danger"
                ? (theme: Theme) => ({
                    backgroundColor: theme.customTokens.semanticScale.error[600],
                    "&:hover": {
                      backgroundColor: theme.customTokens.semanticScale.error[700],
                    },
                  })
                : {},
            ]}
            variant="contained"
          >
            {confirmLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
