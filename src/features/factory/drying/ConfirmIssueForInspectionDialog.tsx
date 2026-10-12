import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";

export function ConfirmIssueForInspectionDialog({
  onClose,
  onConfirm,
  open,
}: {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: "8px",
            minWidth: 360,
            maxWidth: 420,
            p: 1,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
        Confirm Issue for Inspection
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">
          Do you really want to issue for inspection?
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          variant="outlined"
          onClick={onClose}
          sx={{ textTransform: "none", minWidth: 70 }}
        >
          No
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={onConfirm}
          sx={{ textTransform: "none", minWidth: 70 }}
        >
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
