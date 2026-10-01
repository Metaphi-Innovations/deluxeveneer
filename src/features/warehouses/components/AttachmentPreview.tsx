import { useState } from "react";
import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Eye, FileText, X } from "lucide-react";

import {
  getMasterDocumentDisplayName,
  getMasterDocumentUrl,
} from "../../masters/shared/masterDocumentValue";

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

function fileNameFromUrl(url: string): string {
  const fromMaster = getMasterDocumentDisplayName(url, "Attachment");
  if (fromMaster && fromMaster !== "Attachment") {
    return fromMaster;
  }
  try {
    const path = decodeURIComponent(
      new URL(url, window.location.origin).pathname,
    );
    const name = path.split("/").filter(Boolean).pop();
    if (name) return name;
  } catch {
    // fall through for relative / data URLs
  }
  if (url.startsWith("data:")) return "Attachment";
  const parts = url.split(/[\\/]/).filter(Boolean);
  return parts[parts.length - 1] || "Attachment";
}

export function AttachmentPreview({
  url,
  compact = false,
  emptyLabel = "—",
  title = "Attachment",
  showFileName = true,
}: {
  url: string | null | undefined;
  compact?: boolean;
  emptyLabel?: string;
  title?: string;
  showFileName?: boolean;
}) {
  const theme = useTheme();
  const [viewerOpen, setViewerOpen] = useState(false);
  const resolvedUrl = getMasterDocumentUrl(url) || url?.trim() || "";

  if (!resolvedUrl) {
    return (
      <Typography
        sx={{
          fontSize: compact ? "0.8125rem" : "14px",
          fontWeight: 400,
          color: theme.customTokens.text.primary,
        }}
      >
        {emptyLabel}
      </Typography>
    );
  }

  const isPdf = isPdfAttachment(resolvedUrl);
  const isImage = isImageAttachment(resolvedUrl);
  const fileName = fileNameFromUrl(url?.trim() || resolvedUrl);
  const thumbSize = compact ? 40 : 48;

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        spacing={1.5}
        sx={{ minWidth: 0 }}
      >
        <Box
          onClick={() => setViewerOpen(true)}
          title="Click to view"
          sx={{
            width: thumbSize,
            height: thumbSize,
            minWidth: thumbSize,
            borderRadius: "6px",
            overflow: "hidden",
            border: `1px solid ${theme.customTokens.borders.default}`,
            bgcolor: theme.customTokens.brand.primaryScale[50] || "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.15s ease-in-out",
            position: "relative",
            flexShrink: 0,
            "&:hover": {
              borderColor: theme.customTokens.navigation.activeText,
              boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
              "& .preview-overlay": {
                opacity: 1,
              },
            },
          }}
        >
          {isPdf || !isImage ? (
            <FileText
              size={compact ? 20 : 24}
              color={theme.customTokens.navigation.activeText}
            />
          ) : (
            <Box
              component="img"
              src={resolvedUrl}
              alt={fileName || title}
              sx={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
              onError={(event) => {
                event.currentTarget.style.display = "none";
              }}
            />
          )}
          <Box
            className="preview-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: 0,
              transition: "opacity 0.15s ease-in-out",
              color: "#fff",
            }}
          >
            <Eye size={compact ? 16 : 18} />
          </Box>
        </Box>

        {showFileName && !compact ? (
          <Typography
            sx={{
              color: theme.customTokens.text.primary,
              fontSize: "14px",
              fontWeight: 400,
              lineHeight: 1.4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              minWidth: 0,
            }}
            title={fileName}
          >
            {fileName}
          </Typography>
        ) : null}
      </Stack>

      <Dialog
        fullWidth
        maxWidth="md"
        open={viewerOpen}
        onClose={() => setViewerOpen(false)}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            {title}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setViewerOpen(false)}
            size="small"
            sx={{ color: (t) => t.palette.grey[500] }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 1.5,
            minHeight: 450,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          }}
        >
          {isPdf ? (
            <Box
              component="iframe"
              src={resolvedUrl}
              title={title}
              sx={{
                width: "100%",
                height: "70vh",
                border: 0,
                borderRadius: 1,
              }}
            />
          ) : isImage ? (
            <Box
              component="img"
              src={resolvedUrl}
              alt={title}
              sx={{
                maxWidth: "100%",
                maxHeight: "70vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview available for this document.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
