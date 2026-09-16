import { AlertTriangle } from "lucide-react";
import { Box, Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { recordFormActionButtonSx } from "../../features/shared/buttonStyles";

export interface ConfirmationDialogProps {
  cancelLabel?: string;
  confirmLabel?: string;
  description?: string | undefined;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  open: boolean;
  title: string;
  tone?: "danger" | "default";
}

export function ConfirmationDialog({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  description,
  loading = false,
  onClose,
  onConfirm,
  open,
  title,
  tone = "default",
}: ConfirmationDialogProps) {
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

          {description ? (
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Stack>

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
            {cancelLabel}
          </Button>

          <Button
            disabled={loading}
            onClick={onConfirm}
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
            {loading ? "Please wait..." : confirmLabel}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
