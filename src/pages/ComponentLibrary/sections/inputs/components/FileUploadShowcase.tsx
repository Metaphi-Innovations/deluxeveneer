import { useEffect, useRef, useState } from "react";
import type { DragEvent } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  Box,
  Button,
  IconButton,
  LinearProgress,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { FileText, Trash2, Upload } from "lucide-react";

import { InputShowcaseCard } from "./InputShowcaseCard";
import { InputStateTile } from "./InputStateTile";
import { ShowcaseMeta } from "./ShowcaseMeta";

type ShowcaseProps = {
  sx?: SxProps<Theme>;
};

const supportedExtensions = [".pdf", ".xlsx", ".jpg", ".png"];

function formatFileSize(bytes: number) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  if (bytes >= 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }

  return `${bytes} B`;
}

export function FileUploadShowcase({ sx }: ShowcaseProps) {
  const theme = useTheme();
  const browseInputRef = useRef<HTMLInputElement>(null);
  const errorInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
  } | null>({
    name: "dispatch-note.pdf",
    size: 284000,
  });
  const [uploadProgress, setUploadProgress] = useState(68);
  const [uploadingFileName, setUploadingFileName] = useState("dispatch-note.pdf");
  const [uploadError, setUploadError] = useState(
    "Files over 2 MB or unsupported formats show an inline error state.",
  );

  useEffect(() => {
    if (uploadProgress <= 0 || uploadProgress >= 100) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setUploadProgress((current) => Math.min(current + 8, 100));
    }, 350);

    return () => window.clearInterval(intervalId);
  }, [uploadProgress]);

  const beginUpload = (file: File) => {
    const fileExtension = `.${file.name.split(".").pop()?.toLowerCase() ?? ""}`;

    if (!supportedExtensions.includes(fileExtension) || file.size > 2 * 1024 * 1024) {
      setUploadError(
        "Unsupported file. Upload PDF, XLSX, JPG, or PNG files up to 2 MB.",
      );
      return;
    }

    setUploadError("Files over 2 MB or unsupported formats show an inline error state.");
    setUploadedFile({
      name: file.name,
      size: file.size,
    });
    setUploadingFileName(file.name);
    setUploadProgress(12);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const droppedFile = event.dataTransfer.files?.[0];

    if (droppedFile) {
      beginUpload(droppedFile);
    }
  };

  return (
    <InputShowcaseCard
      sx={sx}
      title="File Upload"
      token="theme.components.input.file"
      description="Compact upload patterns for invoice copies, moisture reports, QC attachments, and dispatch documents."
      footer={
        <ShowcaseMeta
          usage="Use compact file uploads for purchase attachments, dispatch documents, moisture reports, quality evidence, and invoice copies."
        />
      }
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(2),
          gridTemplateColumns: {
            xs: "1fr",
            xl: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <InputStateTile title="Drag & Drop" note="Drop or browse files">
          <Stack
            sx={(theme) => ({
              width: "100%",
              gap: theme.spacing(1.5),
            })}
          >
            <Box
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              sx={(theme) => ({
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: theme.spacing(1),
                minHeight: theme.spacing(18),
                border: `1px dashed ${
                  isDragging
                    ? theme.customTokens.navigation.activeText
                    : theme.customTokens.borders.strong
                }`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: isDragging
                  ? theme.customTokens.navigation.activeBackground
                  : theme.customTokens.surfaces.surface,
                textAlign: "center",
                px: theme.spacing(2),
                py: theme.spacing(2.5),
              })}
            >
              <Upload
                color={theme.customTokens.navigation.activeText}
                size={theme.customTokens.iconSizes.md}
              />

              <Typography variant="body2" color="text.primary">
                Drop invoice copy or moisture report here
              </Typography>

              <Typography variant="caption" color="text.secondary">
                PDF, XLSX, JPG, PNG up to 2 MB
              </Typography>

              <Button
                variant="outlined"
                size="small"
                onClick={() => browseInputRef.current?.click()}
                sx={{
                  borderColor: theme.customTokens.borders.default,
                  color: theme.customTokens.navigation.activeText,
                  "&:hover": {
                    borderColor: theme.customTokens.navigation.activeText,
                    backgroundColor: theme.customTokens.navigation.hoverBackground,
                  },
                }}
              >
                Browse File
              </Button>
            </Box>

            <input
              hidden
              ref={browseInputRef}
              type="file"
              accept={supportedExtensions.join(",")}
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];

                if (selectedFile) {
                  beginUpload(selectedFile);
                }
              }}
            />
          </Stack>
        </InputStateTile>

        <InputStateTile title="Uploaded File" note="Attachment summary">
          <Stack
            sx={(theme) => ({
              width: "100%",
              gap: theme.spacing(1.25),
            })}
          >
            <Box
              sx={(theme) => ({
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: theme.spacing(1.5),
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
                px: theme.spacing(1.5),
                py: theme.spacing(1.25),
              })}
            >
              <Stack direction="row" alignItems="center" spacing={1.25}>
                <FileText
                  color={theme.customTokens.navigation.activeText}
                  size={theme.customTokens.iconSizes.sm}
                />

                <Stack spacing={0.25}>
                  <Typography variant="body2" color="text.primary">
                    {uploadedFile?.name ?? "No file selected"}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {uploadedFile ? formatFileSize(uploadedFile.size) : "Upload to view file metadata"}
                  </Typography>
                </Stack>
              </Stack>

              <IconButton
                aria-label="Remove uploaded file"
                size="small"
                onClick={() => setUploadedFile(null)}
              >
                <Trash2 size={theme.customTokens.iconSizes.sm} />
              </IconButton>
            </Box>
          </Stack>
        </InputStateTile>

        <InputStateTile title="Upload Progress" note="Inline progress state">
          <Stack
            sx={(theme) => ({
              width: "100%",
              gap: theme.spacing(1.5),
            })}
          >
            <Typography variant="body2" color="text.primary">
              {uploadingFileName}
            </Typography>

            <LinearProgress
              variant="determinate"
              value={uploadProgress}
              sx={(theme) => ({
                height: theme.spacing(1),
                borderRadius: `${theme.customTokens.radius.pill}px`,
                backgroundColor: theme.customTokens.surfaces.paper,
                "& .MuiLinearProgress-bar": {
                  borderRadius: `${theme.customTokens.radius.pill}px`,
                  backgroundColor: theme.customTokens.navigation.activeText,
                },
              })}
            />

            <Typography variant="caption" color="text.secondary">
              {uploadProgress}% uploaded. Selecting a valid file restarts the upload progress preview.
            </Typography>
          </Stack>
        </InputStateTile>

        <InputStateTile title="Error" note="Validation feedback">
          <Stack
            sx={(theme) => ({
              width: "100%",
              gap: theme.spacing(1.5),
            })}
          >
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.palette.error.main}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.semanticScale.error[50],
                px: theme.spacing(1.5),
                py: theme.spacing(1.25),
              })}
            >
              <Typography variant="body2" color="error.main">
                {uploadError}
              </Typography>
            </Box>

            <Button
              variant="outlined"
              size="small"
              onClick={() => errorInputRef.current?.click()}
              sx={{
                width: "fit-content",
                borderColor: theme.palette.error.main,
                color: theme.palette.error.main,
                "&:hover": {
                  borderColor: theme.palette.error.main,
                  backgroundColor: theme.customTokens.semanticScale.error[50],
                },
              }}
            >
              Try Invalid File
            </Button>

            <input
              hidden
              ref={errorInputRef}
              type="file"
              onChange={(event) => {
                const selectedFile = event.target.files?.[0];

                if (selectedFile) {
                  beginUpload(selectedFile);
                }
              }}
            />
          </Stack>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}
