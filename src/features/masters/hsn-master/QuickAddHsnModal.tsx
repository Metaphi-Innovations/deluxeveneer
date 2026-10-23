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
  Snackbar,
} from "@mui/material";
import { X, Save } from "lucide-react";
import {
  createHsnApi,
  fetchHsnsApi,
  syncHsnMasterToStorage,
} from "./api/hsnMasterApi";
import { fetchGstsApi } from "../gst-master/api/gstMasterApi";
import { invalidateMaster } from "../../../query/queryClient";
import type { MasterRecord } from "../shared/types";

const HSN_CODE_LENGTHS = [2, 4, 6, 8] as const;

function getHsnCodeError(value: string) {
  if (!value) {
    return "HSN Code is required.";
  }

  if (!/^\d+$/.test(value)) {
    return "HSN Code must contain digits only.";
  }

  if (!HSN_CODE_LENGTHS.includes(value.length as (typeof HSN_CODE_LENGTHS)[number])) {
    return `HSN Code must be 2, 4, 6, or 8 digits (${value.length} entered).`;
  }

  return "";
}

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
  const [existingHsns, setExistingHsns] = useState<string[]>([]);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "warning";
  } | null>(null);

  const loadGstOptions = () => {
    fetchGstsApi({ status: true, limit: 1000 })
      .then((records) => {
        const active = records.filter(
          (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
        );
        const gsts = active
          .map((r) => String(r.gstPercentage || r.percentage || "").trim().replace(/%+$/, ""))
          .filter(Boolean);
        setGstOptions([...new Set(gsts)]);
      })
      .catch((err) => {
        console.warn("Failed to load GST options:", err);
      });
  };

  const loadExistingHsns = () => {
    fetchHsnsApi({ limit: 1000 })
      .then((records) => {
        const codes = records
          .map((r) => String(r.hsnCode || r.code || "").trim().toLowerCase())
          .filter(Boolean);
        setExistingHsns(codes);
      })
      .catch((err) => {
        console.warn("Failed to load existing HSNs:", err);
      });
  };

  useEffect(() => {
    if (open) {
      setHsnCode("");
      setHsnDescription("");
      setGstPercentage("");
      setError("");

      loadGstOptions();
      loadExistingHsns();
    }
  }, [open]);

  const hsnCodeFieldError = hsnCode ? getHsnCodeError(hsnCode) : "";

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = hsnCode.trim();
    if (!cleanCode) {
      const msg = "HSN Code is required.";
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
      return;
    }

    const hsnCodeError = getHsnCodeError(cleanCode);
    if (hsnCodeError) {
      setError(hsnCodeError);
      setToastNotification({ message: hsnCodeError, severity: "error" });
      return;
    }

    // Check if HSN code is already there
    if (existingHsns.includes(cleanCode.toLowerCase())) {
      const msg = `HSN Code "${cleanCode}" already exists.`;
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const created = await createHsnApi({
        code: cleanCode,
        hsnCode: cleanCode,
        description: hsnDescription.trim(),
        hsnCodeDescription: hsnDescription.trim(),
        ...(gstPercentage.trim()
          ? {
              gstPercentage: gstPercentage.trim().endsWith("%")
                ? gstPercentage.trim()
                : `${gstPercentage.trim()}%`,
            }
          : {}),
        status: true,
      });

      if (created) {
        const allRecords = await fetchHsnsApi();
        if (allRecords.length > 0) {
          syncHsnMasterToStorage(allRecords);
        }
      }

      void invalidateMaster("hsn");
      setToastNotification({ message: `HSN Code "${cleanCode}" added successfully!`, severity: "success" });
      onSuccess(cleanCode, created || undefined);
      setTimeout(() => {
        onClose();
      }, 300);
    } catch (err: any) {
      console.warn("Failed to create HSN:", err);
      const msg = err?.message || "Failed to create HSN code.";
      setError(msg);
      setToastNotification({ message: msg, severity: "error" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
        <IconButton
          size="small"
          onClick={onClose}
          sx={{ color: "text.secondary" }}
        >
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
                error={Boolean(hsnCodeFieldError)}
                fullWidth
                helperText={hsnCodeFieldError || " "}
                placeholder="2, 4, 6, or 8 digits"
                value={hsnCode}
                onChange={(e) => {
                  const sanitized = e.target.value.replace(/\D/g, "").slice(0, 8);
                  setHsnCode(sanitized);
                  if (error) setError("");
                }}
                onKeyDown={(e) => {
                  if (e.ctrlKey || e.metaKey || e.altKey) return;
                  if (e.key.length === 1 && !/\d/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 8,
                    pattern: "[0-9]*",
                  },
                }}
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
                slotProps={{
                  select: {
                    displayEmpty: true,
                  },
                }}
                sx={(theme) => ({
                  "& .MuiOutlinedInput-root": {
                    height: 36,
                    minHeight: 36,
                    borderRadius: "6px",
                    fontSize: "13px",
                  },
                  "& .MuiSelect-select": {
                    color: gstPercentage
                      ? theme.customTokens.text.primary
                      : theme.palette.text.disabled,
                  },
                })}
              >
                <MenuItem value="" disabled sx={{ color: "text.disabled", fontSize: "13px" }}>
                  Select GST %
                </MenuItem>
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
            disabled={isSubmitting || Boolean(getHsnCodeError(hsnCode.trim()))}
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
    </>
  );
}
