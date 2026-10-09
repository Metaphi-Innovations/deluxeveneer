import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Stack,
  Alert,
  IconButton,
  Typography,
  Box,
} from "@mui/material";
import { X, Plus, Save } from "lucide-react";
import { fetchHsnsApi } from "../hsn-master/hsnMasterApi";
import { createItemCategoryApi, fetchItemCategoriesApi, syncItemCategoryMasterToStorage } from "./itemCategoryMasterApi";
import { invalidateMaster } from "../../../query/queryClient";
import type { MasterRecord } from "../shared/types";

interface QuickAddCategoryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newCategoryName: string, categoryRecord?: MasterRecord) => void;
}

export function QuickAddCategoryModal({
  open,
  onClose,
  onSuccess,
}: QuickAddCategoryModalProps) {
  const [categoryName, setCategoryName] = useState("");
  const [hsn, setHsn] = useState("");
  const [gst, setGst] = useState("");
  const [remark, setRemark] = useState("");
  const [hsnOptions, setHsnOptions] = useState<string[]>([]);
  const [hsnRows, setHsnRows] = useState<MasterRecord[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setCategoryName("");
      setHsn("");
      setGst("");
      setRemark("");
      setError("");

      fetchHsnsApi({ status: true, limit: 1000 })
        .then((records) => {
          const active = records.filter(
            (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
          );
          const codes = active
            .map((r) => String(r.hsnCode || r.code || "").trim())
            .filter(Boolean);
          setHsnOptions([...new Set(codes)]);
          setHsnRows(active);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleHsnChange = (selectedHsn: string) => {
    setHsn(selectedHsn);
    const matched = hsnRows.find(
      (r) => String(r.hsnCode || r.code || "").trim() === selectedHsn.trim(),
    );
    if (matched) {
      setGst(String(matched.gstPercentage || matched.gst || ""));
    } else {
      setGst("");
    }
  };

  const handleSave = async () => {
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setError("Category Name is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const created = await createItemCategoryApi({
        categoryName: trimmed,
        hsn: hsn.trim(),
        gst: gst.trim(),
        remark: remark.trim() || null,
        status: true,
      });

      const allRecords = await fetchItemCategoriesApi({ limit: 1000 });
      if (allRecords.length > 0) {
        syncItemCategoryMasterToStorage(allRecords);
      }

      void invalidateMaster("itemCategory");

      onSuccess(trimmed, created ?? undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.md}px`,
            border: `1px solid ${theme.customTokens.borders.default}`,
            boxShadow: theme.customTokens.elevation.md,
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          px: 2.5,
          py: 1.75,
          borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
        })}
      >
        <Typography variant="subtitle1" fontWeight={600}>
          Quick Add Item Category
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: "20px !important" }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <TextField
            autoFocus
            label="Category Name"
            required
            size="small"
            fullWidth
            value={categoryName}
            onChange={(e) => setCategoryName(e.target.value)}
          />

          <TextField
            select
            label="HSN Code"
            size="small"
            fullWidth
            value={hsn}
            onChange={(e) => handleHsnChange(e.target.value)}
          >
            {hsnOptions.map((code) => (
              <MenuItem key={code} value={code}>
                {code}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="GST %"
            size="small"
            fullWidth
            value={gst}
            slotProps={{
              input: { readOnly: true },
            }}
          />

          <TextField
            label="Remark"
            size="small"
            fullWidth
            multiline
            rows={2}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          px: 2.5,
          py: 1.5,
          borderTop: `1px solid ${theme.customTokens.borders.divider}`,
        })}
      >
        <Button onClick={onClose} disabled={isSubmitting} color="inherit">
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSubmitting}
          startIcon={<Save size={16} />}
          sx={(theme) => ({
            backgroundColor: theme.customTokens.brand.primary,
            "&:hover": {
              backgroundColor: theme.customTokens.brand.secondary,
            },
          })}
        >
          {isSubmitting ? "Saving..." : "Save Category"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
