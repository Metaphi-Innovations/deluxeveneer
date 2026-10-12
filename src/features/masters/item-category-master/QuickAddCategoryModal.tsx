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
import { fetchHsnsApi } from "../hsn-master/api/hsnMasterApi";
import { QuickAddHsnModal } from "../hsn-master/QuickAddHsnModal";
import { createItemCategoryApi, fetchItemCategoriesApi, syncItemCategoryMasterToStorage } from "./api/itemCategoryMasterApi";
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
  const [quickAddHsnOpen, setQuickAddHsnOpen] = useState(false);
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
      maxWidth="md"
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
          Add Item Category
        </Typography>
        <IconButton size="small" onClick={onClose} aria-label="Close">
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2.5, pt: "20px !important" }}>
        <Stack spacing={2}>
          {error ? <Alert severity="error">{error}</Alert> : null}

          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(4, minmax(0, 1fr))" },
              gap: 2,
              alignItems: "start",
            })}
          >
            <Stack spacing={0.75}>
              <Typography
                component="label"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                Category Name <Box component="span" sx={{ color: "error.main" }}>*</Box>
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="Enter category name"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                  },
                })}
              />
            </Stack>

            <Stack spacing={0.75}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ height: "20px", minHeight: "20px" }}>
                <Typography
                  component="label"
                  sx={(theme) => ({
                    fontSize: "12.5px",
                    fontWeight: 600,
                    color: theme.customTokens.text.primary,
                  })}
                >
                  HSN Code
                </Typography>
                <Button
                  size="small"
                  onClick={() => setQuickAddHsnOpen(true)}
                  sx={(theme) => ({
                    p: 0,
                    minWidth: "auto",
                    fontSize: "11px",
                    lineHeight: 1.3,
                    fontWeight: 600,
                    textTransform: "none",
                    color: theme.customTokens.brand.primary,
                    "&:hover": {
                      backgroundColor: "transparent",
                      textDecoration: "underline",
                    },
                  })}
                >
                  + Add HSN
                </Button>
              </Stack>
              <TextField
                select
                fullWidth
                value={hsn}
                onChange={(e) => handleHsnChange(e.target.value)}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                  },
                })}
              >
                {hsnOptions.map((code) => (
                  <MenuItem key={code} value={code} sx={{ fontSize: "13px" }}>
                    {code}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>

            <Stack spacing={0.75}>
              <Typography
                component="label"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                GST %
              </Typography>
              <TextField
                fullWidth
                value={gst}
                slotProps={{
                  input: { readOnly: true },
                }}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                    backgroundColor: theme.customTokens.surfaces.alt,
                  },
                })}
              />
            </Stack>

            <Stack spacing={0.75}>
              <Typography
                component="label"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                Remark
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter remark"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                  },
                })}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          px: 2.5,
          py: 1.5,
          borderTop: `1px solid ${theme.customTokens.borders.divider}`,
        })}
      >
        <Button
          onClick={onClose}
          disabled={isSubmitting}
          sx={(theme) => ({
            borderRadius: "6px",
            px: 2,
            py: 0.75,
            fontSize: "13px",
            fontWeight: 500,
            textTransform: "none",
            color: theme.customTokens.text.secondary,
            border: `1px solid ${theme.customTokens.borders.default}`,
            "&:hover": {
              backgroundColor: theme.customTokens.surfaces.alt,
            },
          })}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSubmitting}
          startIcon={<Save size={15} />}
          sx={(theme) => ({
            borderRadius: "6px",
            px: 2.25,
            py: 0.75,
            fontSize: "13px",
            fontWeight: 600,
            textTransform: "none",
            backgroundColor: theme.customTokens.brand.primary,
            "&:hover": {
              backgroundColor: theme.customTokens.brand.secondary,
            },
          })}
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
      <QuickAddHsnModal
        open={quickAddHsnOpen}
        onClose={() => setQuickAddHsnOpen(false)}
        onSuccess={(newHsnCode, hsnRecord) => {
          setHsnOptions((current) => [...new Set([newHsnCode, ...current])]);
          setHsn(newHsnCode);
          if (hsnRecord?.gstPercentage) {
            setGst(String(hsnRecord.gstPercentage));
          }
          if (hsnRecord) {
            setHsnRows((current) => [hsnRecord, ...current]);
          }
        }}
      />
    </Dialog>
  );
}
