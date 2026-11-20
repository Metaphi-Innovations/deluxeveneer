import { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Download, Upload } from "lucide-react";

import {
  bulkImportUsersFromCsv,
  downloadUserBulkImportTemplate,
  type UserBulkImportResult,
} from "../api/userBulkImportApi";

interface UserBulkImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}

export function UserBulkImportDialog({
  open,
  onClose,
  onImported,
}: UserBulkImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [csvText, setCsvText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [result, setResult] = useState<UserBulkImportResult | null>(null);

  const resetState = () => {
    setSelectedFileName("");
    setCsvText("");
    setErrorMessage("");
    setResult(null);
    setIsSubmitting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    resetState();
    onClose();
  };

  const handleDownloadTemplate = async () => {
    setErrorMessage("");
    try {
      await downloadUserBulkImportTemplate();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to download template.",
      );
    }
  };

  const handleFileChange = async (file: File | undefined) => {
    if (!file) {
      return;
    }
    setErrorMessage("");
    setResult(null);
    setSelectedFileName(file.name);
    const text = await file.text();
    setCsvText(text);
  };

  const handleImport = async () => {
    if (!csvText.trim()) {
      setErrorMessage("Choose a CSV file first.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const importResult = await bulkImportUsersFromCsv(csvText);
      setResult(importResult);
      if (importResult.created > 0) {
        onImported();
      }
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Bulk import failed.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog fullWidth maxWidth="md" onClose={handleClose} open={open}>
      <DialogTitle>Bulk import users</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 0.5 }}>
          <Typography color="text.secondary" variant="body2">
            Download the template, fill one row per user, and upload
            the CSV. Delete the sample row if you do not need it. In Excel, remove
            extra blank rows below your data before saving. New users receive the
            same setup-email flow as Add User; permissionCodes use | between codes
            (for example USER_MANAGEMENT_VIEW).
          </Typography>

          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Button
              onClick={handleDownloadTemplate}
              startIcon={<Download size={16} />}
              variant="outlined"
            >
              Download template
            </Button>
            <Button
              component="label"
              startIcon={<Upload size={16} />}
              variant="outlined"
            >
              Choose CSV
              <input
                accept=".csv,text/csv"
                hidden
                onChange={(event) =>
                  void handleFileChange(event.target.files?.[0])
                }
                ref={fileInputRef}
                type="file"
              />
            </Button>
          </Stack>

          {selectedFileName ? (
            <Typography variant="body2">Selected: {selectedFileName}</Typography>
          ) : null}

          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          {result ? (
            <Box>
              <Alert
                severity={result.failed > 0 ? "warning" : "success"}
                sx={{ mb: 1.5 }}
              >
                Created {result.created} of {result.total} rows
                {result.failed > 0 ? ` (${result.failed} failed)` : ""}.
              </Alert>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Row</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Detail</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {result.results.map((row) => (
                    <TableRow key={row.row}>
                      <TableCell>{row.row}</TableCell>
                      <TableCell>{row.success ? "Created" : "Failed"}</TableCell>
                      <TableCell>
                        {row.success
                          ? row.email || row.username || row.id
                          : row.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button disabled={isSubmitting} onClick={handleClose}>
          Close
        </Button>
        <Button
          disabled={isSubmitting || !csvText.trim()}
          onClick={() => void handleImport()}
          variant="contained"
        >
          {isSubmitting ? "Importing…" : "Import"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}