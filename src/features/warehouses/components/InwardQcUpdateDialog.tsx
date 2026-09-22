import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { BadgeCheck, CircleX, ClipboardCheck, Paperclip, Upload } from "lucide-react";

import { getListingToolbarOutlinedButtonSx } from "../../shared/buttonStyles";
import { formatAmount as formatAmountShared } from "../../shared/numberFormat";
import {
  fetchInwardById,
  updateInwardQcStatusApi,
  type InwardDetail,
  type InwardItemDetail,
  type InwardQcStatus,
} from "../api/inwardApi";

type QcConfirmState = {
  item: InwardItemDetail;
  mode: "PASS" | "FAIL";
} | null;

type InwardQcUpdateDialogProps = {
  inwardId: string | null;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void;
};

function formatDateDisplay(value: string | null | undefined): string {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatMoney(value: number | null | undefined): string {
  return formatAmountShared(value ?? 0);
}

function formatMeasure(value: number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return String(value);
}

function normalizeQcLabel(value: string | null | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();
  if (normalized === "pass") return "Pass";
  if (normalized === "fail") return "Fail";
  return "Pending";
}

function qcChipColor(
  label: string,
): "default" | "success" | "error" | "warning" {
  if (label === "Pass") return "success";
  if (label === "Fail") return "error";
  return "warning";
}

export function InwardQcUpdateDialog({
  inwardId,
  open,
  onClose,
  onUpdated,
}: InwardQcUpdateDialogProps) {
  const [detail, setDetail] = useState<InwardDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [confirmState, setConfirmState] = useState<QcConfirmState>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadDetail = useCallback(async (id: string) => {
    setIsLoading(true);
    setErrorMessage("");
    try {
      const result = await fetchInwardById(id);
      setDetail(result);
    } catch (error) {
      setDetail(null);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load inward items for QC.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open || !inwardId) {
      return;
    }

    setConfirmState(null);
    setIsSubmitting(false);
    void loadDetail(inwardId);
  }, [inwardId, loadDetail, open]);

  const items = useMemo(() => detail?.items ?? [], [detail]);

  const pendingCount = useMemo(
    () =>
      items.filter((item) => normalizeQcLabel(item.qcStatus) === "Pending")
        .length,
    [items],
  );

  const handleConfirmSubmit = async (details: {
    remark: string;
    attachmentUrl: string | null;
  }) => {
    if (!confirmState || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");

    try {
      await updateInwardQcStatusApi(confirmState.item.id, {
        qcStatus: confirmState.mode as InwardQcStatus,
        qcRemark: details.remark.trim() || null,
        qcAttachmentUrl: details.attachmentUrl,
      });
      setConfirmState(null);
      if (inwardId) {
        await loadDetail(inwardId);
      }
      onUpdated();
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to update QC status.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const overallQc = normalizeQcLabel(detail?.qcStatus);

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={handleClose}
        open={open}
        PaperProps={{
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.lg}px`,
            overflow: "hidden",
          }),
        }}
      >
        <DialogTitle
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.customTokens.borders.default}`,
            px: 2.5,
            py: 1.75,
          })}
        >
          <Stack direction="row" alignItems="center" spacing={1.25}>
            <Box
              sx={(theme) => ({
                width: 36,
                height: 36,
                borderRadius: `${theme.customTokens.radius.md}px`,
                display: "grid",
                placeItems: "center",
                backgroundColor: theme.customTokens.brand.primaryScale[50],
                color: theme.customTokens.brand.primary,
                flexShrink: 0,
              })}
            >
              <ClipboardCheck size={18} />
            </Box>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>
                QC Update
              </Typography>
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: "0.8125rem",
                })}
              >
                Review and update quality status for every line on this inward.
              </Typography>
            </Box>
            {detail ? (
              <Chip
                label={overallQc}
                color={qcChipColor(overallQc)}
                size="small"
                sx={{ fontWeight: 700, height: 26 }}
              />
            ) : null}
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 2.5,
            py: 2,
            backgroundColor: (theme) => theme.customTokens.surfaces.alt,
          }}
        >
          <Stack spacing={2}>
            {detail ? (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.customTokens.surfaces.surface,
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  px: 2,
                  py: 1.5,
                })}
              >
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1.25, sm: 0 }}
                  divider={
                    <Divider
                      flexItem
                      orientation="vertical"
                      sx={{ display: { xs: "none", sm: "block" }, mx: 2 }}
                    />
                  }
                  useFlexGap
                  sx={{ flexWrap: "wrap", rowGap: 1.25 }}
                >
                  <SummaryField
                    label="Invoice"
                    value={detail.invoiceNo || "—"}
                  />
                  <SummaryField
                    label="Supplier"
                    value={detail.supplierName || "—"}
                  />
                  <SummaryField
                    label="Inward Sr No"
                    value={detail.inwardSrNo || "—"}
                  />
                  <SummaryField
                    label="Inward Date"
                    value={formatDateDisplay(detail.inwardDate)}
                  />
                  <SummaryField
                    label="Items"
                    value={`${items.length} total · ${pendingCount} pending`}
                  />
                </Stack>
              </Box>
            ) : null}

            {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

            {isLoading ? (
              <Stack alignItems="center" justifyContent="center" py={6}>
                <CircularProgress size={28} />
                <Typography
                  sx={(theme) => ({
                    mt: 1.5,
                    color: theme.customTokens.text.secondary,
                    fontSize: "0.8125rem",
                  })}
                >
                  Loading line items…
                </Typography>
              </Stack>
            ) : items.length === 0 ? (
              <Box
                sx={(theme) => ({
                  backgroundColor: theme.customTokens.surfaces.surface,
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: `${theme.customTokens.radius.md}px`,
                  px: 2,
                  py: 4,
                  textAlign: "center",
                })}
              >
                <Typography color="text.secondary">
                  No line items found for this inward.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.25}>
                {items.map((item, index) => (
                  <ItemQcCard
                    key={item.id}
                    disabled={isSubmitting}
                    index={index}
                    item={item}
                    onFail={() => {
                      setErrorMessage("");
                      setConfirmState({ item, mode: "FAIL" });
                    }}
                    onPass={() => {
                      setErrorMessage("");
                      setConfirmState({ item, mode: "PASS" });
                    }}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={(theme) => ({
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            px: 2.5,
            py: 1.5,
            backgroundColor: theme.customTokens.surfaces.surface,
          })}
        >
          <Button
            disabled={isSubmitting}
            onClick={handleClose}
            variant="outlined"
            sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <InwardQcConfirmDialog
        itemName={confirmState?.item.itemName ?? ""}
        mode={confirmState?.mode ?? "PASS"}
        open={Boolean(confirmState)}
        submitting={isSubmitting}
        onClose={() => {
          if (!isSubmitting) {
            setConfirmState(null);
          }
        }}
        onSubmit={handleConfirmSubmit}
      />
    </>
  );
}

function SummaryField({ label, value }: { label: string; value: string }) {
  return (
    <Box sx={{ minWidth: 120, flex: "1 1 120px" }}>
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.secondary,
          fontSize: "0.6875rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          mb: 0.35,
        })}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 600,
          lineHeight: 1.3,
          wordBreak: "break-word",
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

function ItemQcCard({
  item,
  index,
  disabled,
  onPass,
  onFail,
}: {
  item: InwardItemDetail;
  index: number;
  disabled: boolean;
  onPass: () => void;
  onFail: () => void;
}) {
  const qcLabel = normalizeQcLabel(item.qcStatus);
  const isPending = qcLabel === "Pending";
  const dimension = item.thickness ?? item.height ?? null;
  const batchOrLog = item.batchNo || item.logCode || "—";
  const remark = item.qcRemark?.trim() || "";
  const attachmentUrl = item.qcAttachmentUrl?.trim() || "";

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.customTokens.surfaces.surface,
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        px: 2,
        py: 1.5,
      })}
    >
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "flex-start" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ mb: 0.75, flexWrap: "wrap", rowGap: 0.75 }}
          >
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.secondary,
                fontSize: "0.75rem",
                fontWeight: 700,
              })}
            >
              #{index + 1}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.9375rem",
                fontWeight: 700,
                lineHeight: 1.3,
              }}
            >
              {item.itemName || "Untitled item"}
            </Typography>
            <Chip
              label={qcLabel}
              color={qcChipColor(qcLabel)}
              size="small"
              sx={{ fontWeight: 700, height: 22 }}
            />
          </Stack>

          <Stack
            direction="row"
            spacing={2}
            useFlexGap
            sx={{ flexWrap: "wrap", rowGap: 0.5 }}
          >
            <DetailPill
              label="Sub category"
              value={item.itemSubCategoryName || "—"}
            />
            <DetailPill label="HSN" value={item.hsnCode || "—"} />
            <DetailPill label="Batch / Log" value={batchOrLog} />
            <DetailPill
              label="Size"
              value={`${formatMeasure(item.length)} × ${formatMeasure(item.width)} × ${formatMeasure(dimension)}`}
            />
            <DetailPill label="Amount" value={formatMoney(item.amount)} />
          </Stack>
        </Box>

        {isPending ? (
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexShrink: 0, alignSelf: { xs: "stretch", md: "center" } }}
          >
            <Button
              disabled={disabled}
              size="small"
              startIcon={<BadgeCheck size={15} />}
              variant="outlined"
              color="success"
              onClick={onPass}
              sx={{ minWidth: 92, flex: { xs: 1, md: "none" } }}
            >
              Pass
            </Button>
            <Button
              disabled={disabled}
              size="small"
              startIcon={<CircleX size={15} />}
              variant="outlined"
              color="error"
              onClick={onFail}
              sx={{ minWidth: 92, flex: { xs: 1, md: "none" } }}
            >
              Fail
            </Button>
          </Stack>
        ) : (
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              flexShrink: 0,
              width: { xs: "100%", md: 300 },
              alignSelf: { xs: "stretch", md: "center" },
              alignItems: "stretch",
            }}
          >
            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                  mb: 0.5,
                  minHeight: 16,
                })}
              >
                Remark
              </Typography>
              <Box
                sx={(theme) => ({
                  flex: 1,
                  minHeight: 88,
                  px: 1,
                  py: 0.75,
                  borderRadius: `${theme.customTokens.radius.sm}px`,
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  backgroundColor: theme.customTokens.surfaces.alt,
                  display: "flex",
                  alignItems: "flex-start",
                })}
              >
                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: 500,
                    wordBreak: "break-word",
                    lineHeight: 1.4,
                  }}
                >
                  {remark || "—"}
                </Typography>
              </Box>
            </Box>

            <Box
              sx={{
                flex: 1,
                minWidth: 0,
                display: "flex",
                flexDirection: "column",
              }}
            >
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: "0.6875rem",
                  fontWeight: 600,
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                  lineHeight: 1.2,
                  mb: 0.5,
                  minHeight: 16,
                })}
              >
                Attachment
              </Typography>
              <QcAttachmentPreview url={attachmentUrl} />
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

function isImageAttachment(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith("data:image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)(\?|$)/i.test(normalized);
}

function isPdfAttachment(url: string): boolean {
  const normalized = url.trim().toLowerCase();
  if (normalized.startsWith("data:application/pdf")) return true;
  return /\.pdf(\?|$)/i.test(normalized);
}

function QcAttachmentPreview({ url }: { url: string }) {
  if (!url) {
    return (
      <Box
        sx={(theme) => ({
          flex: 1,
          minHeight: 88,
          px: 1,
          py: 0.75,
          borderRadius: `${theme.customTokens.radius.sm}px`,
          border: `1px solid ${theme.customTokens.borders.default}`,
          backgroundColor: theme.customTokens.surfaces.alt,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <Typography sx={{ fontSize: "0.8125rem", fontWeight: 500 }}>
          None
        </Typography>
      </Box>
    );
  }

  if (isImageAttachment(url)) {
    return (
      <Box
        component="a"
        href={url}
        rel="noopener noreferrer"
        target="_blank"
        sx={(theme) => ({
          display: "block",
          flex: 1,
          width: "100%",
          minHeight: 88,
          height: 88,
          borderRadius: `${theme.customTokens.radius.sm}px`,
          border: `1px solid ${theme.customTokens.borders.default}`,
          overflow: "hidden",
          backgroundColor: theme.customTokens.surfaces.alt,
          "&:hover": {
            borderColor: theme.customTokens.brand.primary,
          },
        })}
      >
        <Box
          component="img"
          src={url}
          alt="QC attachment preview"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        flex: 1,
        minHeight: 88,
        px: 1,
        py: 0.75,
        borderRadius: `${theme.customTokens.radius.sm}px`,
        border: `1px solid ${theme.customTokens.borders.default}`,
        backgroundColor: theme.customTokens.surfaces.alt,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      })}
    >
      <Button
        component="a"
        href={url}
        rel="noopener noreferrer"
        size="small"
        startIcon={<Paperclip size={14} />}
        target="_blank"
        variant="text"
        sx={{ textTransform: "none" }}
      >
        {isPdfAttachment(url) ? "Open PDF" : "Open attachment"}
      </Button>
    </Box>
  );
}

function DetailPill({ label, value }: { label: string; value: string }) {
  return (
    <Typography
      component="span"
      sx={(theme) => ({
        fontSize: "0.75rem",
        color: theme.customTokens.text.secondary,
      })}
    >
      <Box
        component="span"
        sx={{ fontWeight: 600, color: "text.primary", mr: 0.5 }}
      >
        {label}:
      </Box>
      {value}
    </Typography>
  );
}

function InwardQcConfirmDialog({
  mode,
  open,
  submitting,
  itemName,
  onClose,
  onSubmit,
}: {
  mode: "PASS" | "FAIL";
  open: boolean;
  submitting: boolean;
  itemName: string;
  onClose: () => void;
  onSubmit: (details: {
    remark: string;
    attachmentUrl: string | null;
  }) => void;
}) {
  const [remark, setRemark] = useState("");
  const [fileName, setFileName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState("");

  useEffect(() => {
    if (open) {
      setRemark("");
      setFileName("");
      setAttachmentUrl(null);
      setFileError("");
    }
  }, [open]);

  const title = mode === "PASS" ? "Mark QC Pass" : "Mark QC Fail";

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Stack spacing={2}>
          {itemName ? (
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.secondary,
                fontSize: "0.8125rem",
              })}
            >
              Item:{" "}
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                {itemName}
              </Box>
            </Typography>
          ) : null}

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
                disabled={submitting}
                startIcon={<Upload size={15} />}
                variant="outlined"
              >
                Choose File
                <input
                  accept="image/*,.pdf"
                  hidden
                  type="file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    setFileError("");

                    if (!file) {
                      setFileName("");
                      setAttachmentUrl(null);
                      return;
                    }

                    setFileName(file.name);
                    const reader = new FileReader();
                    reader.onload = () => {
                      setAttachmentUrl(
                        typeof reader.result === "string" ? reader.result : null,
                      );
                    };
                    reader.onerror = () => {
                      setFileError("Failed to read selected file.");
                      setAttachmentUrl(null);
                    };
                    reader.readAsDataURL(file);
                  }}
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
            {fileError ? (
              <Typography color="error" sx={{ fontSize: "0.75rem" }}>
                {fileError}
              </Typography>
            ) : null}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button disabled={submitting} onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          disabled={submitting || Boolean(fileError)}
          color={mode === "FAIL" ? "error" : "primary"}
          onClick={() =>
            onSubmit({
              remark,
              attachmentUrl,
            })
          }
          variant="contained"
        >
          {submitting ? "Submitting..." : "Submit"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
