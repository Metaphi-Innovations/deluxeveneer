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
import { X, Save } from "lucide-react";
import { fetchItemCategoriesApi } from "../item-category-master/api/itemCategoryMasterApi";
import {
  createItemSubCategoryApi,
  fetchItemSubCategoriesApi,
  syncItemSubCategoryMasterToStorage,
} from "./api/itemSubCategoryMasterApi";
import { invalidateMaster } from "../../../query/queryClient";
import type { MasterRecord } from "../shared/types";

interface QuickAddSubCategoryModalProps {
  open: boolean;
  defaultCategory?: string;
  onClose: () => void;
  onSuccess: (
    newSubCategoryName: string,
    subCategoryRecord?: MasterRecord,
  ) => void;
}

export function QuickAddSubCategoryModal({
  open,
  defaultCategory = "",
  onClose,
  onSuccess,
}: QuickAddSubCategoryModalProps) {
  const [subCategoryName, setSubCategoryName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [categoryOptions, setCategoryOptions] = useState<string[]>([]);
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setSubCategoryName("");
      setCategory(defaultCategory);
      setRemark("");
      setError("");

      fetchItemCategoriesApi({ status: true, limit: 1000 })
        .then((records) => {
          const names = records
            .filter(
              (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
            )
            .map((r) => String(r.categoryName || r.name || "").trim())
            .filter((n) => Boolean(n) && isNaN(Number(n)));
          setCategoryOptions([...new Set(names)]);
        })
        .catch(() => {});
    }
  }, [open, defaultCategory]);

  const handleSave = async () => {
    const trimmedSub = subCategoryName.trim();
    if (!trimmedSub) {
      setError("Item Sub Category is required.");
      return;
    }
    if (!category.trim()) {
      setError("Category is required.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const created = await createItemSubCategoryApi({
        name: trimmedSub,
        itemSubCategory: trimmedSub,
        category: category.trim(),
        categoryName: category.trim(),
        remark: remark.trim() || null,
        status: true,
      });

      const allRecords = await fetchItemSubCategoriesApi();
      if (allRecords.length > 0) {
        syncItemSubCategoryMasterToStorage(allRecords);
      }

      void invalidateMaster("itemSubCategory");

      onSuccess(trimmedSub, created ?? undefined);
      onClose();
    } catch (err: any) {
      setError(err?.message || "Failed to create sub category");
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
          Add Item Sub-Category
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
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(3, minmax(0, 1fr))",
              },
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
                Item Sub Category{" "}
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="Enter sub category"
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
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
              <Typography
                component="label"
                sx={(theme) => ({
                  height: "20px",
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                Category{" "}
                <Box component="span" sx={{ color: "error.main" }}>
                  *
                </Box>
              </Typography>
              <TextField
                select
                fullWidth
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                  },
                })}
              >
                {categoryOptions.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: "13px" }}>
                    {opt}
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
    </Dialog>
  );
}
