import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Alert,
  IconButton,
  Typography,
  Snackbar,
} from "@mui/material";
import { X, Save } from "lucide-react";
import { createGstApi, fetchGstsApi, syncGstMasterToStorage } from "./api/gstMasterApi";
import { invalidateMaster } from "../../../query/queryClient";
import type { MasterRecord } from "../shared/types";

interface QuickAddGstModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newGstPercentage: string, gstRecord?: MasterRecord) => void;
}

export function QuickAddGstModal({
  open,
  onClose,
  onSuccess,
}: QuickAddGstModalProps) {
  const [gstPercentage, setGstPercentage] = useState("");
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [existingGsts, setExistingGsts] = useState<string[]>([]);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "warning";
  } | null>(null);

  useEffect(() => {
    if (open) {
      setGstPercentage("");
      setRemark("");
      setError("");

      fetchGstsApi({ limit: 1000 })
        .then((records) => {
          const gsts = records
            .map((r) => String(r.gstPercentage || r.percentage || "").trim().replace(/%+$/, ""))
            .filter(Boolean);
          setExistingGsts(gsts);
        })
        .catch(() => {});
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const rawVal = gstPercentage.trim().replace(/%+$/, "");
    if (!rawVal) {
      const msg = "GST % is required.";
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
      return;
    }

    if (isNaN(Number(rawVal)) || Number(rawVal) < 0 || Number(rawVal) > 100) {
      const msg = "GST % must be a valid number between 0 and 100.";
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
      return;
    }

    if (existingGsts.includes(rawVal)) {
      const msg = `GST "${rawVal}%" already exists.`;
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const cleanedValue = rawVal;
      const created = await createGstApi({
        percentage: cleanedValue,
        gstPercentage: cleanedValue,
        remark: remark.trim() || null,
        status: true,
      });

      if (created) {
        const allRecords = await fetchGstsApi();
        if (allRecords.length > 0) {
          syncGstMasterToStorage(allRecords);
        }
      }

      void invalidateMaster("gst");
      setToastNotification({ message: `GST "${cleanedValue}%" added successfully!`, severity: "success" });
      onSuccess(cleanedValue, created || undefined);
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      const msg = err?.message || "Failed to create GST.";
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
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
        <span>Add GST %</span>
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

          <Stack spacing={2}>
            <Stack spacing={0.75}>
              <Typography
                component="label"
                sx={(theme) => ({
                  fontSize: "12.5px",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                })}
              >
                GST % *
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="18"
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

      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={4000}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            variant="filled"
            sx={{ width: "100%", boxShadow: 3 }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </Dialog>
  );
}
