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
} from "@mui/material";
import { X, Save } from "lucide-react";
import { createHsnApi, fetchHsnsApi, syncHsnMasterToStorage } from "./api/hsnMasterApi";
import { fetchGstsApi } from "../gst-master/api/gstMasterApi";
import { invalidateMaster } from "../../../query/queryClient";
import type { MasterRecord } from "../shared/types";

interface QuickAddHsnModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newHsnCode: string, hsnRecord?: MasterRecord) => void;
}

export function QuickAddHsnModal({
  open,
  onClose,
  onSuccess,
}: QuickAddHsnModalProps) {
  const [hsnCode, setHsnCode] = useState("");
  const [hsnDescription, setHsnDescription] = useState("");
  const [gstPercentage, setGstPercentage] = useState("");
  const [gstOptions, setGstOptions] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setHsnCode("");
      setHsnDescription("");
      setGstPercentage("");
      setError("");

      fetchGstsApi({ status: true, limit: 1000 })
        .then((records) => {
          const active = records.filter(
            (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
          );
          const gsts = active
            .map((r) => String(r.gstPercentage || r.percentage || "").trim())
            .filter(Boolean);
          setGstOptions([...new Set(gsts)]);
        })
        .catch((err) => {
          console.warn("Failed to load GST options:", err);
        });
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!hsnCode.trim()) {
      setError("HSN Code is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const created = await createHsnApi({
        code: hsnCode.trim(),
        hsnCode: hsnCode.trim(),
        description: hsnDescription.trim(),
        hsnCodeDescription: hsnDescription.trim(),
        gstPercentage: gstPercentage.trim(),
        status: true,
      });

      if (created) {
        const allRecords = await fetchHsnsApi();
        if (allRecords.length > 0) {
          syncHsnMasterToStorage(allRecords);
        }
      }

      void invalidateMaster("hsn");
      onSuccess(hsnCode.trim(), created || undefined);
      onClose();
    } catch (err: any) {
      console.warn("Failed to create HSN:", err);
      // Fallback
      onSuccess(hsnCode.trim());
      onClose();
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
          sx: {
            borderRadius: "10px",
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          },
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          pb: 1.5,
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          typography: "subtitle1",
          fontWeight: 700,
        })}
      >
        <span>Add HSN Code</span>
        <IconButton size="small" onClick={onClose} sx={{ color: "text.secondary" }}>
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <form onSubmit={handleSubmit}>
        <DialogContent sx={{ pt: 2.5, pb: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontSize: "13px" }}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} sx={{ width: "100%" }}>
            <Stack spacing={0.75} sx={{ flex: 1 }}>
              <Typography
                component="label"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                HSN Code *
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="Enter HSN code"
                value={hsnCode}
                onChange={(e) => setHsnCode(e.target.value)}
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

            <Stack spacing={0.75} sx={{ flex: 1.5 }}>
              <Typography
                component="label"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                HSN Description
              </Typography>
              <TextField
                fullWidth
                placeholder="Enter description"
                value={hsnDescription}
                onChange={(e) => setHsnDescription(e.target.value)}
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

            <Stack spacing={0.75} sx={{ flex: 1 }}>
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
                select
                fullWidth
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                  },
                })}
              >
                {gstOptions.map((opt) => (
                  <MenuItem key={opt} value={opt} sx={{ fontSize: "13px" }}>
                    {opt}%
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={(theme) => ({
            px: 3,
            py: 1.75,
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            gap: 1,
          })}
        >
          <Button
            variant="outlined"
            size="small"
            onClick={onClose}
            disabled={isSubmitting}
            sx={{
              borderRadius: "6px",
              height: 36,
              textTransform: "none",
              px: 2,
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            size="small"
            disabled={isSubmitting}
            startIcon={<Save size={16} />}
            sx={(theme) => ({
              borderRadius: "6px",
              height: 36,
              textTransform: "none",
              px: 2.5,
              backgroundColor: theme.customTokens.brand.primary,
              "&:hover": {
                backgroundColor: theme.customTokens.brand.primaryScale[800],
              },
            })}
          >
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
