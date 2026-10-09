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
} from "@mui/material";
import { X, Save } from "lucide-react";
import { createUnitApi, fetchUnitsApi, syncUnitMasterToStorage } from "./api/unitMasterApi";
import { invalidateMaster } from "../../../query/queryClient";

interface QuickAddUnitModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newUnitName: string) => void;
}

export function QuickAddUnitModal({
  open,
  onClose,
  onSuccess,
}: QuickAddUnitModalProps) {
  const [unitName, setUnitName] = useState("");
  const [symbolicName, setSymbolicName] = useState("");
  const [remark, setRemark] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setUnitName("");
      setSymbolicName("");
      setRemark("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!unitName.trim()) {
      setError("Unit name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const created = await createUnitApi({
        unitName: unitName.trim(),
        name: unitName.trim(),
        symbolicName: symbolicName.trim() || null,
        remark: remark.trim() || null,
        status: true,
      });

      if (created) {
        const allRecords = await fetchUnitsApi();
        if (allRecords.length > 0) {
          syncUnitMasterToStorage(allRecords);
        }
      }

      void invalidateMaster("unit");
      onSuccess(unitName.trim());
      onClose();
    } catch (err: any) {
      console.warn("Failed to create unit:", err);
      // Fallback
      onSuccess(unitName.trim());
      onClose();
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
        <span>Add Unit</span>
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
                Unit Name *
              </Typography>
              <TextField
                autoFocus
                fullWidth
                placeholder="Enter unit name"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
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
                Symbolic Name
              </Typography>
              <TextField
                fullWidth
                placeholder="e.g. PCS, MTR"
                value={symbolicName}
                onChange={(e) => setSymbolicName(e.target.value)}
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
    </Dialog>
  );
}
