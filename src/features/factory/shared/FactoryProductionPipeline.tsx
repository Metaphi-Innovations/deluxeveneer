import { Box, Paper, Typography } from "@mui/material";
import { ChevronRight } from "lucide-react";

export type FactoryPipelineStage =
  | "storage-veneer-block"
  | "sawing"
  | "sawing-done"
  | "sawing-inspection"
  | "sawing-inspection-done"
  | "production-warehouse"
  | "slicing"
  | "slicing-done"
  | "drying"
  | "drying-done"
  | "drying-inspection"
  | "drying-inspection-done"
  | "storage-raw-veneer";

type PipelineStage = {
  key: FactoryPipelineStage;
  label: string;
};

const sawingPipeline: readonly PipelineStage[] = [
  { key: "storage-veneer-block", label: "Storage Warehouse (Veneer Block)" },
  { key: "sawing", label: "Sawing" },
  { key: "sawing-done", label: "Sawing Done" },
  { key: "sawing-inspection", label: "Sawing Inspection" },
  { key: "sawing-inspection-done", label: "Sawing Inspection Done" },
  { key: "production-warehouse", label: "Production Warehouse" },
];

const dryingPipeline: readonly PipelineStage[] = [
  { key: "storage-veneer-block", label: "Storage Warehouse (Veneer Block)" },
  { key: "slicing", label: "Slicing" },
  { key: "slicing-done", label: "Slicing Done" },
  { key: "drying", label: "Drying" },
  { key: "drying-done", label: "Drying Done" },
  { key: "drying-inspection", label: "Drying Inspection" },
  { key: "drying-inspection-done", label: "Drying Inspection Done" },
  { key: "storage-raw-veneer", label: "Storage Warehouse (Raw Veneer)" },
];

const dryingStages = new Set<FactoryPipelineStage>([
  "slicing",
  "slicing-done",
  "drying",
  "drying-done",
  "drying-inspection",
  "drying-inspection-done",
  "storage-raw-veneer",
]);

export function FactoryProductionPipeline({
  currentStage,
  rejected = false,
}: {
  currentStage: FactoryPipelineStage;
  rejected?: boolean;
}) {
  const pipelineStages = dryingStages.has(currentStage) ? dryingPipeline : sawingPipeline;
  const currentStageIndex = pipelineStages.findIndex((stage) => stage.key === currentStage);

  return (
    <Box
      sx={(theme) => ({
        borderTop: `1px solid ${theme.customTokens.borders.default}`,
        pt: 1.5,
      })}
    >
      <Typography
        variant="caption"
        sx={{
          color: "text.secondary",
          display: "block",
          fontSize: "12px",
          fontWeight: 600,
          letterSpacing: "0.02em",
          mb: 1.5,
          textTransform: "uppercase",
        }}
      >
        Production Pipeline
      </Typography>

      <Box sx={{ alignItems: "center", display: "flex", flexWrap: "wrap", gap: 1 }}>
        {pipelineStages.map((stage, index) => {
          const isComplete = index < currentStageIndex;
          const isCurrent = index === currentStageIndex;

          return (
            <Box key={stage.key} sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Paper
                elevation={0}
                sx={(theme) => ({
                  alignItems: "center",
                  backgroundColor: isCurrent
                    ? rejected
                      ? theme.palette.error.light
                      : theme.customTokens.brand.primaryScale[50]
                    : theme.customTokens.surfaces.surface,
                  border: `1px solid ${
                    isCurrent
                      ? rejected
                        ? theme.palette.error.main
                        : theme.customTokens.brand.primary
                      : theme.customTokens.borders.default
                  }`,
                  borderRadius: "8px",
                  display: "flex",
                  gap: 0.75,
                  px: 1.5,
                  py: 0.75,
                  transition: "all 0.15s ease",
                })}
              >
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: isCurrent
                      ? rejected
                        ? theme.palette.error.dark
                        : theme.customTokens.brand.primary
                      : isComplete
                        ? theme.customTokens.text.primary
                        : theme.customTokens.text.secondary,
                    fontSize: "13px",
                    fontWeight: isCurrent ? 700 : 500,
                    whiteSpace: "nowrap",
                  })}
                >
                  {isComplete ? "✓ " : isCurrent ? rejected ? "✕ " : "● " : "○ "}
                  {stage.label}
                  {isCurrent && rejected ? " — Rejected" : ""}
                </Typography>
              </Paper>

              {index < pipelineStages.length - 1 ? <ChevronRight size={16} /> : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
