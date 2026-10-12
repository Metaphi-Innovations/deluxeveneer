import { useEffect, useState } from "react";
import { Upload } from "lucide-react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

export function WarehouseQcPassDialog({
  onClose,
  onSubmit,
  open,
}: {
  onClose: () => void;
  onSubmit: (details: { remark: string; fileName: string }) => void;
  open: boolean;
}) {
  const [remark, setRemark] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (open) {
      setRemark("");
      setFileName("");
    }
  }, [open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Mark QC Pass</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Remark"
            multiline
            minRows={3}
            onChange={(event) => setRemark(event.target.value)}
            value={remark}
          />

          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              File Upload
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                component="label"
                startIcon={<Upload size={15} />}
                variant="outlined"
              >
                Choose File
                <input
                  hidden
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? "")
                  }
                  type="file"
                />
              </Button>
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.8125rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName || "No file selected"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ fileName, remark })}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}
