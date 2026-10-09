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
import { createColorApi, fetchColorsApi, syncColorMasterToStorage } from "./api/colorMasterApi";
import { invalidateMaster } from "../../../query/queryClient";

interface QuickAddColorModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newColorName: string) => void;
}

export function QuickAddColorModal({
  open,
  onClose,
  onSuccess,
}: QuickAddColorModalProps) {
  const [colorName, setColorName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setColorName("");
      setError("");
    }
  }, [open]);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!colorName.trim()) {
      setError("Color name is required");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      const created = await createColorApi({
        colorName: colorName.trim(),
        name: colorName.trim(),
        status: true,
      });

      if (created) {
        const allRecords = await fetchColorsApi();
        if (allRecords.length > 0) {
          syncColorMasterToStorage(allRecords);
        }
      }

      void invalidateMaster("color");
      onSuccess(colorName.trim());
      onClose();
    } catch (err: any) {
      console.warn("Failed to create color:", err);
      // Fallback
      onSuccess(colorName.trim());
      onClose();
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
        <span>Add Color</span>
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

          <Stack spacing={0.75}>
            <Typography
              component="label"
              sx={(theme) => ({
                fontSize: "12.5px",
                fontWeight: 600,
                color: theme.customTokens.text.primary,
              })}
            >
              Color Name *
            </Typography>
            <TextField
              autoFocus
              fullWidth
              placeholder="Enter color name"
              value={colorName}
              onChange={(e) => setColorName(e.target.value)}
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
