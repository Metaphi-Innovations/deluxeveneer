import { useState, type ReactNode } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { ChevronLeft, ChevronRight, CircleX, Eye, Info, X } from "lucide-react";

import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  getOrderLineItems,
  getOrderRecordByOrderNo,
  useOrderRecords,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import type { FactoryDefinition, FactoryRecord } from "./types";

type ViewField = {
  label: string;
  value: string;
  wide?: boolean;
};

const standardizedFactoryViewSlugs = new Set([
  "splicing",
  "marquetry",
  "pressing",
  "cnc-fluting",
  "embossing",
  "finishing",
]);

export function usesStandardFactoryRecordView(slug: string) {
  return standardizedFactoryViewSlugs.has(slug);
}

export function getStandardFactoryStatus(row: FactoryRecord) {
  const state = readRawString(row, ["listingState", "status"]); 
  if (state.toLowerCase() === "issued") return "Issued";
  if (state.toLowerCase() === "done") return "Completed";
  if (state.toLowerCase() === "history") return "Issued";
  if (state.toLowerCase() === "rejected") return "Rejected";
  return state || "Pending";
}

export function getStandardFactoryStatusColor(row: FactoryRecord) {
  const status = getStandardFactoryStatus(row).toLowerCase();
  if (status.includes("reject") || status.includes("fail")) return "error" as const;
  if (status.includes("complete") || status.includes("done")) return "success" as const;
  if (status.includes("issued") || status.includes("process")) return "info" as const;
  return "default" as const;
}

export function StandardFactoryRecordView<Row extends FactoryRecord>({
  definition,
  onBack,
  row,
}: {
  definition: FactoryDefinition<Row>;
  onBack: () => void;
  row: Row;
}) {
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const orderRecords = useOrderRecords();
  const config = getProcessConfig(definition.slug, definition.title, row);
  const status = getStandardFactoryStatus(row);
  const listingState = readRawString(row, ["listingState"]).toLowerCase();
  const isSample = isSampleRecord(row);
  const orderNo = readValue(row, ["orderNo"]);
  const orderDialogFields = !isSample && orderNo
    ? buildFactoryOrderItemDetailFields(row, orderRecords)
    : [];

  const sourceFields = compactFields([
    field("Source Record No.", row, config.sourceReferenceKeys),
    field("Storage / Production Sr No.", row, ["storageSrNo", "productionSrNo"]),
    field("Group No.", row, ["groupNo"]),
    field("Source Warehouse", row, ["warehouseName", "storageWarehouseName"]),
    field("Issued From", row, ["issuedFrom", "sourceProcess"]),
    field("Log No.", row, ["logNo", "batchNo", "logCode"]),
    field("Bundle No.", row, ["bundleNumber", "bundleNo"]),
    field("Pallet No.", row, ["palletNo"]),
    field("Issued Date", row, ["issuedDate", "issueDate"]),
  ]);

  const materialFields = compactFields([
    field("Length", row, ["length"]),
    field("Width", row, ["width"]),
    field("Thickness", row, ["thickness", "height"]),
    field("Color", row, ["color", "cutColor"]),
    field("Grade", row, ["grade"]),
    field(config.inputQuantityLabel, row, config.inputQuantityKeys),
    field("SQM", row, ["issuedSqm", "sqm", "totalSqm", "totalSqMeter"]),
    field("SQF", row, ["issuedSqf", "sqf", "totalSqf"]),
  ]);

  const finishingSourceHint = normalizeStage(readValue(row, ["issuedFrom", "sourceProcess"]));
  const finishingOrderHint = normalizeStage([
    readValue(row, ["orderType"]),
    readValue(row, ["productCategory"]),
    readValue(row, ["finishedType"]),
    readValue(row, ["issuedFor", "destinationProcess"]),
    ...orderDialogFields
      .filter((entry) => ["Order Type", "Product Category", "Finished Type"].includes(entry.label))
      .map((entry) => entry.value),
  ].join(" "));
  const finishingOrderVariant = finishingSourceHint.includes("flut")
    ? "fluted"
    : finishingSourceHint.includes("emboss")
      ? "embossed"
      : finishingOrderHint.includes("flut")
        ? "fluted"
        : finishingOrderHint.includes("emboss")
          ? "embossed"
          : finishingOrderHint.includes("marquetry")
            ? "marquetry"
            : finishingOrderHint.includes("decorative")
              ? "decorative"
              : "";
  const outputSpecificFields = config.outputSpecificFields.filter(([label]) => {
    if (definition.slug !== "finishing" || label === "Finishing Type") return true;
    if (label === "Design Code") return finishingOrderVariant === "fluted";
    if (label === "Structure Code") return finishingOrderVariant === "embossed";
    return false;
  });
  const getResolvedOrderValue = (label: string) => {
    const value = orderDialogFields.find((entry) => entry.label === label)?.value ?? "";
    return value === "-" ? "" : value;
  };

  const outputFields = compactFields([
    field(config.referenceLabel, row, config.referenceKeys),
    field(config.dateLabel, row, config.dateKeys),
    field("Output Item", row, ["outputItemName", "itemName", "productName"]),
    field("Item Sub Category", row, ["outputItemSubCategory", "itemSubCategory", "subCategory"]),
    field("No. of Sheets", row, ["outputNoOfSheets", "finishedSheets"]),
    field("SQM", row, ["outputSqm", "finishedSqm"]),
    field("SQF", row, ["outputSqf", "finishedSqf"]),
    ...outputSpecificFields.map(([label, keys]) => ({
      label,
      value: readValue(row, keys) || getResolvedOrderValue(label),
    })),
  ]);

  const quantityFields = buildQuantityFields(definition.slug, row);
  const showQuantitySummary = !["splicing", "marquetry", "pressing"].includes(definition.slug);
  const inspectionFields = compactFields([
    field("Inspection Date", row, ["inspectionDate"]),
    field("Result", row, ["inspectionResult", "qcStatus"]),
    field("Passed Quantity", row, ["passedQuantity", "passedSheets", "passedLeaves"]),
    field("Failed Quantity", row, ["failedQuantity", "failedSheets", "failedLeaves"]),
    field("Inspected By", row, ["inspectedBy"]),
    field("Inspection Remark", row, ["inspectionRemark"]),
  ]);
  const processImage = readValue(row, [
    "outputPhoto",
    "processImage",
    "groupPhoto",
    "inspectionImage",
    "attachment",
  ]);
  const showProcessOutput = listingState !== "issued";
  const baseFields = definition.slug === "pressing"
    ? compactFields([
        field("Base Type", row, ["baseType"]),
        field("Base Item Name", row, ["baseItemName", "consumedFrom"]),
        field("Base Stock Reference", row, ["baseStockReference", "consumedFrom"]),
        field("Length", row, ["consumedLength"]),
        field("Width", row, ["consumedWidth"]),
        field("Thickness", row, ["consumedThickness", "baseThickness"]),
        field("No. of Sheets", row, ["consumedNoOfSheets"]),
        field("Consumed Sheets", row, ["consumeSheets"]),
        field("Consumed SQM", row, ["consumeSqm"]),
        field("Consumed SQF", row, ["consumeSqf"]),
      ])
    : [];

  const compactOrderLabels = new Set([
    "Order No.",
    "Order Item No.",
    "Customer Name",
    "Order Date",
  ]);
  const orderFields = orderDialogFields.filter((entry) => compactOrderLabels.has(entry.label));

  const sampleFields = isSample
    ? compactFields([
        field("Processing Mode", row, ["pressingFor", "forLabel", "for", "purpose"]),
        field("Sample Sheet Reference", row, ["sampleSheetNo", "sampleNo", "groupNo"]),
        field("Issued For", row, ["issuedFor"]),
      ])
    : [];

  const recordFields = compactFields([
    field("Created By", row, ["createdBy"]),
    field("Created Date", row, ["createdAt", "createdDate"]),
    field("Updated By", row, ["updatedBy"]),
    field("Updated Date", row, ["updatedAt", "updatedDate"]),
    ...(listingState === "rejected"
      ? [
          field("Rejected By", row, ["rejectedBy"]),
          field("Rejected Date", row, ["rejectedDate"]),
        ]
      : []),
  ]);

  const processDate = readValue(row, config.dateKeys);
  const issuedFor = readValue(row, ["issuedFor", "destinationProcess"]);
  const orderRouteHint = orderDialogFields
    .filter((entry) => [
      "Order Type",
      "Product Category",
      "Finished Type",
      "Sales Item Name",
      "Item Name",
    ].includes(entry.label))
    .map((entry) => entry.value)
    .filter((value) => value && value !== "-")
    .join(" ");
  const routingDestination = definition.slug === "pressing"
    ? [issuedFor, orderRouteHint].filter(Boolean).join(" ")
    : issuedFor;
  const nextProcess = resolveNextProcess(config.processLabel, routingDestination);
  const processFields = compactFields([
    { label: "Process", value: config.processLabel },
    { label: "Process Date", value: processDate },
    { label: "Current Stage", value: variantStageLabel(config.processLabel, listingState) },
    { label: "Status", value: status },
    { label: "Next Process", value: nextProcess },
    {
      label: "Issue Status",
      value: listingState === "history" ? "Issued" : issuedFor ? "Awaiting / Assigned" : "Not Issued",
    },
  ]);

  const routeStages = buildRouteStages(row, config.processLabel, nextProcess, isSample);
  const pipelineCurrentStage = resolvePipelineCurrentStage(
    config.processLabel,
    listingState,
    nextProcess,
    routeStages,
  );
  const contextualMessage = buildContextualMessage(
    config.processLabel,
    listingState,
    nextProcess,
    isSample,
  );
  const remark = readValue(row, ["remark", "issueRemark"]);

  return (
    <Stack spacing={2.5}>
      <FactoryViewSection fields={sourceFields} title="Source Details" />
      <FactoryViewSection
        desktopColumns={
          ["splicing", "marquetry", "pressing", "cnc-fluting", "embossing", "finishing"].includes(definition.slug)
            ? materialFields.length
            : 4
        }
        fields={materialFields}
        title={definition.slug === "marquetry" ? "Selected Source Materials" : "Material Details"}
      />
      {baseFields.length > 0 ? (
        <FactoryViewSection desktopColumns={5} fields={baseFields} title="Base Material" />
      ) : null}
      {showProcessOutput ? (
        <FactoryViewSection
          desktopColumns={
            ["splicing", "marquetry", "cnc-fluting"].includes(definition.slug)
              ? outputFields.length
              : 4
          }
          fields={outputFields}
          title={`${config.processLabel} Output`}
        />
      ) : null}
      {showProcessOutput && processImage ? (
        <FactoryImageSection image={processImage} onPreview={() => setPreviewImage(processImage)} />
      ) : null}
      {showQuantitySummary && quantityFields.length > 0 ? (
        <FactoryViewSection
          desktopColumns={
            ["cnc-fluting", "embossing", "finishing"].includes(definition.slug)
              ? quantityFields.length
              : 4
          }
          fields={quantityFields}
          title="Quantity Summary"
        />
      ) : null}
      {inspectionFields.length > 0 ? (
        <FactoryViewSection fields={inspectionFields} title="Inspection / Result Details" />
      ) : null}

      {sampleFields.length > 0 ? (
        <FactoryViewSection fields={sampleFields} title="Sample Sheet Details" />
      ) : null}
      {orderFields.length > 0 ? (
        <FactoryViewSection
          fields={orderFields}
          title="Order Details"
          titleAction={
            <IconButton
              aria-label="View order item details"
              onClick={() => setOrderDialogOpen(true)}
              size="small"
              sx={(theme) => ({ color: theme.customTokens.brand.primary })}
            >
              <Info size={16} />
            </IconButton>
          }
        />
      ) : null}

      <FactoryProcessStatusSection
        contextualMessage={contextualMessage}
        currentStage={pipelineCurrentStage}
        desktopColumns={
          ["splicing", "marquetry", "pressing", "cnc-fluting", "embossing", "finishing"].includes(definition.slug)
            ? processFields.length
            : 4
        }
        fields={processFields}
        isRejected={listingState === "rejected"}
        routeStages={routeStages}
      />

      <FactoryViewSection fields={recordFields} title="Record Information" />
      {remark ? (
        <FactoryViewSection
          fields={[{ label: "Remark", value: remark, wide: true }]}
          title="Remark"
        />
      ) : null}

      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={onBack}
          startIcon={<ChevronLeft size={16} />}
          sx={recordViewActionButtonSx}
          variant="outlined"
        >
          Back
        </Button>
      </Box>

      <FactoryOrderItemDetailsDialog
        fields={orderDialogFields}
        onClose={() => setOrderDialogOpen(false)}
        open={orderDialogOpen}
        stageLabel={config.processLabel}
      />
      <Dialog maxWidth="lg" onClose={() => setPreviewImage("")} open={Boolean(previewImage)}>
        <DialogTitle
          sx={{ alignItems: "center", display: "flex", justifyContent: "space-between" }}
        >
          Process Image
          <IconButton aria-label="Close image preview" onClick={() => setPreviewImage("")} size="small">
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            alt="Factory process"
            component="img"
            src={previewImage}
            sx={{ display: "block", maxHeight: "75vh", maxWidth: "100%", objectFit: "contain" }}
          />
        </DialogContent>
      </Dialog>
    </Stack>
  );
}

function FactoryImageSection({
  image,
  onPreview,
}: {
  image: string;
  onPreview: () => void;
}) {
  return (
    <Box sx={(theme) => formSectionCardSx(theme)}>
      <Stack spacing={2}>
        <FormSectionHeader title="Process Image" />
        <Button
          onClick={onPreview}
          startIcon={<Eye size={16} />}
          sx={{ alignSelf: "flex-start", textTransform: "none" }}
          variant="outlined"
        >
          Preview Image
        </Button>
        <Box
          alt="Factory process thumbnail"
          component="img"
          onClick={onPreview}
          src={image}
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            cursor: "pointer",
            display: "block",
            maxHeight: 180,
            maxWidth: 280,
            objectFit: "cover",
          })}
        />
      </Stack>
    </Box>
  );
}

function FactoryViewSection({
  desktopColumns = 4,
  fields,
  title,
  titleAction,
}: {
  desktopColumns?: number;
  fields: readonly ViewField[];
  title: string;
  titleAction?: ReactNode;
}) {
  if (fields.length === 0) return null;

  return (
    <Box sx={(theme) => formSectionCardSx(theme)}>
      <Stack spacing={2}>
        <FormSectionHeader endAdornment={titleAction} title={title} />
        <FactoryViewDetailGrid desktopColumns={desktopColumns} fields={fields} />
      </Stack>
    </Box>
  );
}

function FactoryViewDetailGrid({
  desktopColumns = 4,
  fields,
}: {
  desktopColumns?: number;
  fields: readonly ViewField[];
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: `repeat(${Math.max(1, desktopColumns)}, minmax(0, 1fr))`,
        },
      }}
    >
      {fields.map((entry) => (
        <Stack
          key={`${entry.label}-${entry.value}`}
          spacing={0.5}
          sx={{
            gridColumn: entry.wide ? { xs: "1", sm: "1 / -1" } : undefined,
            minWidth: 0,
          }}
        >
          <Typography
            variant="caption"
            sx={{
              color: "text.secondary",
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
            }}
          >
            {entry.label}
          </Typography>
          <Typography
            variant="body2"
            sx={{ fontSize: "0.875rem", fontWeight: 500, wordBreak: "break-word" }}
          >
            {entry.value}
          </Typography>
        </Stack>
      ))}
    </Box>
  );
}

function FactoryProcessStatusSection({
  contextualMessage,
  currentStage,
  desktopColumns,
  fields,
  isRejected,
  routeStages,
}: {
  contextualMessage: string;
  currentStage: string;
  desktopColumns: number;
  fields: readonly ViewField[];
  isRejected: boolean;
  routeStages: readonly string[];
}) {
  return (
    <Box sx={(theme) => formSectionCardSx(theme)}>
      <Stack spacing={2.5}>
        <FormSectionHeader title="Process Status" />
        <FactoryViewDetailGrid desktopColumns={desktopColumns} fields={fields} />
        <FactoryRoutePipeline
          currentStage={currentStage}
          rejectedStage={isRejected ? currentStage : undefined}
          stages={routeStages}
        />
        <FactoryContextualStatusMessage
          isRejected={isRejected}
          message={contextualMessage}
        />
      </Stack>
    </Box>
  );
}

export function FactoryContextualStatusMessage({
  isRejected,
  message,
}: {
  isRejected: boolean;
  message: string;
}) {
  if (!isRejected) {
    return (
      <Box
        sx={(theme) => ({
          backgroundColor: theme.customTokens.brand.primaryScale[50],
          border: `1px solid ${theme.customTokens.brand.primaryScale[200]}`,
          borderRadius: "6px",
          p: 1.5,
        })}
      >
        <Typography
          variant="body2"
          sx={(theme) => ({
            color: theme.customTokens.brand.primary,
            fontSize: "13px",
            fontWeight: 600,
          })}
        >
          {message}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={(theme) => ({
        alignItems: "flex-start",
        backgroundColor: "#fff8f8",
        border: `1px solid ${theme.palette.error.main}38`,
        borderLeft: `4px solid ${theme.palette.error.main}`,
        borderRadius: "8px",
        boxShadow: "0 1px 2px rgba(127, 29, 29, 0.05)",
        display: "flex",
        gap: 1.25,
        px: 1.5,
        py: 1.25,
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: "center",
          backgroundColor: `${theme.palette.error.main}12`,
          borderRadius: "50%",
          color: theme.palette.error.main,
          display: "flex",
          flex: "0 0 auto",
          height: 30,
          justifyContent: "center",
          width: 30,
        })}
      >
        <CircleX size={17} strokeWidth={2.2} />
      </Box>
      <Stack spacing={0.2} sx={{ minWidth: 0 }}>
        <Typography
          sx={(theme) => ({
            color: theme.palette.error.dark,
            fontSize: "13.5px",
            fontWeight: 700,
            lineHeight: 1.35,
          })}
        >
          Process rejected
        </Typography>
        <Typography
          variant="body2"
          sx={{ color: "text.secondary", fontSize: "13px", lineHeight: 1.45 }}
        >
          {message}
        </Typography>
      </Stack>
    </Box>
  );
}

export function FactoryRoutePipeline({
  currentStage,
  rejectedStage,
  stages,
}: {
  currentStage: string;
  rejectedStage?: string | undefined;
  stages: readonly string[];
}) {
  const currentIndex = stages.findIndex(
    (stage) => normalizeStage(stage) === normalizeStage(currentStage),
  );

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
        {stages.map((stage, index) => {
          const isDone = index < currentIndex;
          const isCurrent = index === currentIndex;
          const isRejected = Boolean(
            rejectedStage && normalizeStage(stage) === normalizeStage(rejectedStage),
          );
          return (
            <Box key={`${stage}-${index}`} sx={{ alignItems: "center", display: "flex", gap: 1 }}>
              <Box
                sx={(theme) => ({
                  backgroundColor: isCurrent
                    ? isRejected
                      ? theme.palette.error.light
                      : theme.customTokens.brand.primaryScale[50]
                    : theme.customTokens.surfaces.surface,
                  border: `1px solid ${
                    isCurrent
                      ? isRejected
                        ? theme.palette.error.main
                        : theme.customTokens.brand.primary
                      : theme.customTokens.borders.default
                  }`,
                  borderRadius: "6px",
                  px: 1.5,
                  py: 0.75,
                })}
              >
                <Typography
                  variant="caption"
                  sx={(theme) => ({
                    color: isCurrent
                      ? isRejected
                        ? theme.palette.error.dark
                        : theme.customTokens.brand.primary
                      : isDone
                        ? theme.customTokens.text.primary
                        : theme.customTokens.text.secondary,
                    fontSize: "13px",
                    fontWeight: isCurrent ? 700 : 500,
                    whiteSpace: "nowrap",
                  })}
                >
                  {isDone ? "✓ " : isCurrent ? isRejected ? "✕ " : "● " : "○ "}
                  {stage}
                  {isCurrent && isRejected ? " — Rejected" : ""}
                </Typography>
              </Box>
              {index < stages.length - 1 ? <ChevronRight size={16} /> : null}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export function FactoryOrderItemDetailsDialog({
  fields,
  onClose,
  open,
  stageLabel,
}: {
  fields: readonly ViewField[];
  onClose: () => void;
  open: boolean;
  stageLabel: string;
}) {
  const selectFields = (labels: readonly string[]) => labels.flatMap((label) => {
    const matchingField = fields.find((fieldEntry) => fieldEntry.label === label);
    return matchingField ? [[matchingField.label, matchingField.value]] : [];
  });
  const leftSections = [
    {
      columns: 2 as const,
      fields: selectFields(["Order No.", "Order Item No.", "Order Type", "Customer Name", "Order Date", "Required Delivery Date"]),
      title: "Order Reference",
    },
    {
      columns: 2 as const,
      fields: selectFields(["Product Category", "Finished Type", "Sales Item Name", "Item Name", "Sub Category", "Grade"]),
      title: `${stageLabel} Requirement`,
    },
  ];
  const baseFields = selectFields(["Base Type", "Base Name", "Base Length", "Base Width", "Base Thickness"]);
  const rightSections = [
    {
      columns: 3 as const,
      fields: selectFields(["Length", "Width", "Thickness"]),
      title: "Dimensions",
    },
    ...(baseFields.length > 0
      ? [{ columns: 2 as const, fields: baseFields, title: "Base Details" }]
      : []),
    {
      columns: 3 as const,
      fields: selectFields(["No. of Sheets", "SQM", "Total SQM"]),
      title: "Required Quantity",
    },
    {
      columns: 1 as const,
      fields: selectFields(["Remark"]),
      title: `${stageLabel} Instructions`,
    },
  ];

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: 2.5,
            maxHeight: "calc(100% - 32px)",
            overflow: "hidden",
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          alignItems: "center",
          backgroundColor: theme.customTokens.surfaces.surface,
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          display: "flex",
          gap: 1.25,
          px: 2.5,
          py: 1.5,
        })}
      >
        <Box
          sx={(theme) => ({
            alignItems: "center",
            backgroundColor: theme.customTokens.brand.primary,
            borderRadius: 1.5,
            color: theme.palette.common.white,
            display: "flex",
            height: 32,
            justifyContent: "center",
            width: 32,
          })}
        >
          <Info size={17} />
        </Box>
        <Box>
          <Typography sx={{ fontSize: 17, fontWeight: 750 }}>Order Item Details</Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            Order-item information required at the {stageLabel} stage
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ backgroundColor: "background.default", p: "14px !important" }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          }}
        >
          <Stack spacing={1.5}>
            {leftSections.map((section) => (
              <FactoryOrderDetailSection key={section.title} {...section} />
            ))}
          </Stack>
          <Stack spacing={1.5}>
            {rightSections.map((section) => (
              <FactoryOrderDetailSection key={section.title} {...section} />
            ))}
          </Stack>
        </Box>
      </DialogContent>
      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: 3,
          py: 1.5,
        })}
      >
        <Button onClick={onClose} size="small" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function FactoryOrderDetailSection({
  columns = 2,
  fields,
  title,
}: {
  columns?: 1 | 2 | 3;
  fields: string[][];
  title: string;
}) {
  return (
    <Box
      sx={(theme) => ({
        backgroundColor: theme.customTokens.surfaces.surface,
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: 2,
        p: 1.25,
      })}
    >
      <Typography
        sx={(theme) => ({
          color: theme.customTokens.text.primary,
          fontSize: 11.5,
          fontWeight: 750,
          letterSpacing: "0.04em",
          mb: 1,
          px: 0.25,
          textTransform: "uppercase",
        })}
      >
        {title}
      </Typography>
      <Box
        sx={{
          display: "grid",
          gap: 0.75,
          gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, minmax(0, 1fr))` },
        }}
      >
        {fields.map(([label, value]) => (
          <Box
            key={label}
            sx={(theme) => ({
              backgroundColor: theme.customTokens.surfaces.alt,
              border: `1px solid ${theme.customTokens.borders.divider}`,
              borderRadius: 1.25,
              minWidth: 0,
              px: 1.25,
              py: 0.9,
            })}
          >
            <Typography color="text.secondary" sx={{ fontSize: 11.5, mb: 0.35 }}>
              {label}
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 650, wordBreak: "break-word" }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function buildQuantityFields(slug: string, row: FactoryRecord): ViewField[] {
  if (slug === "splicing") {
    return compactFields([
      field("Input — Received Leaves", row, ["receivedLeaves", "noOfLeaves"]),
      field("Input — Consumed Leaves", row, ["consumedLeaves"]),
      field("Input — Available Leaves", row, ["availableLeaves"]),
      field("Output — Produced Sheets", row, ["outputNoOfSheets", "noOfSheets"]),
      field("Output — Available Sheets", row, ["availableSheets"]),
    ]);
  }

  if (slug === "marquetry") {
    return compactFields([
      field("Received Leaves", row, ["receivedLeaves", "noOfLeaves"]),
      field("Leaves Used", row, ["leavesUsed", "consumedLeaves"]),
      field("Produced Sheets", row, ["outputNoOfSheets", "noOfSheets"]),
      field("Output SQM", row, ["outputSqm", "sqm"]),
      field("Output SQF", row, ["outputSqf", "sqf"]),
    ]);
  }

  return compactFields([
    field("Received Sheets", row, ["issuedNoOfSheets", "receivedSheets", "noOfSheets"]),
    field("Processed Sheets", row, ["outputNoOfSheets", "finishedSheets", "noOfSheets"]),
    field("Available Sheets", row, ["availableSheets"]),
    field("Rejected Sheets", row, ["rejectedSheets"]),
    field("Received SQM", row, ["issuedSqm", "receivedSqm", "sqm"]),
    field("Processed SQM", row, ["outputSqm", "finishedSqm", "sqm"]),
    field("Available SQM", row, ["availableSqm"]),
    field("Received SQF", row, ["issuedSqf", "receivedSqf", "sqf"]),
    field("Processed SQF", row, ["outputSqf", "finishedSqf", "sqf"]),
    field("Available SQF", row, ["availableSqf"]),
  ]);
}

function getProcessConfig(slug: string, title: string, row: FactoryRecord) {
  const configs: Record<string, {
    dateKeys: string[];
    dateLabel: string;
    inputQuantityKeys: string[];
    inputQuantityLabel: string;
    outputSpecificFields: Array<[string, string[]]>;
    processLabel: string;
    referenceKeys: string[];
    referenceLabel: string;
    sourceReferenceKeys: string[];
  }> = {
    splicing: {
      dateKeys: ["splicingDate", "processDate"],
      dateLabel: "Splicing Date",
      inputQuantityKeys: ["receivedLeaves", "noOfLeaves"],
      inputQuantityLabel: "No. of Leaves",
      outputSpecificFields: [],
      processLabel: "Splicing",
      referenceKeys: ["splicingId", "splicingNo", "id"],
      referenceLabel: "Splicing Reference",
      sourceReferenceKeys: ["groupingOutputReference", "sourceIssueId"],
    },
    marquetry: {
      dateKeys: ["marquetryDate", "groupingDate", "processDate"],
      dateLabel: "Marquetry Date",
      inputQuantityKeys: ["receivedLeaves", "noOfLeaves"],
      inputQuantityLabel: "No. of Leaves",
      outputSpecificFields: [],
      processLabel: "Marquetry",
      referenceKeys: ["marquetryId", "marquetryNo", "id"],
      referenceLabel: "Marquetry Reference",
      sourceReferenceKeys: ["issueReference", "sourceIssueId"],
    },
    pressing: {
      dateKeys: ["pressingDate", "processDate"],
      dateLabel: "Pressing Date",
      inputQuantityKeys: ["issuedNoOfSheets", "noOfSheets"],
      inputQuantityLabel: "No. of Sheets",
      outputSpecificFields: [["Product Type", ["productType"]]],
      processLabel: "Pressing",
      referenceKeys: ["pressingId", "id"],
      referenceLabel: "Pressing Reference",
      sourceReferenceKeys: ["sourceProcessReference", "sourceIssueId"],
    },
    "cnc-fluting": {
      dateKeys: ["cncDate", "flutingDate", "processDate"],
      dateLabel: "Fluting Date",
      inputQuantityKeys: ["issuedNoOfSheets", "noOfSheets"],
      inputQuantityLabel: "No. of Sheets",
      outputSpecificFields: [["Design Code", ["designCode"]]],
      processLabel: "Fluting",
      referenceKeys: ["flutingId", "cncId", "id"],
      referenceLabel: "Fluting Reference",
      sourceReferenceKeys: ["sourceProcessReference", "pressingId"],
    },
    embossing: {
      dateKeys: ["embossingDate", "cncDate", "processDate"],
      dateLabel: "Embossing Date",
      inputQuantityKeys: ["issuedNoOfSheets", "noOfSheets"],
      inputQuantityLabel: "No. of Sheets",
      outputSpecificFields: [["Structure Code", ["structureCode"]]],
      processLabel: "Embossing",
      referenceKeys: ["embossingId", "id"],
      referenceLabel: "Embossing Reference",
      sourceReferenceKeys: ["sourceProcessReference", "pressingId"],
    },
    finishing: {
      dateKeys: ["finishingDate", "processDate"],
      dateLabel: "Finishing Date",
      inputQuantityKeys: ["issuedNoOfSheets", "noOfSheets"],
      inputQuantityLabel: "No. of Sheets",
      outputSpecificFields: [
        ["Finishing Type", ["finishingType"]],
        ["Design Code", ["designCode"]],
        ["Structure Code", ["structureCode", "structuredCode"]],
      ],
      processLabel: "Finishing",
      referenceKeys: ["finishingId", "id"],
      referenceLabel: "Finishing Reference",
      sourceReferenceKeys: ["sourceProcessReference", "sourceIssueId"],
    },
  };

  return configs[slug] ?? {
    dateKeys: ["processDate", "issuedDate"],
    dateLabel: `${title} Date`,
    inputQuantityKeys: ["noOfSheets"],
    inputQuantityLabel: "No. of Sheets",
    outputSpecificFields: [],
    processLabel: title,
    referenceKeys: ["id"],
    referenceLabel: `${title} Reference`,
    sourceReferenceKeys: ["sourceIssueId", "storageSrNo", "groupNo"],
  };
}

function buildRouteStages(
  row: FactoryRecord,
  currentProcess: string,
  nextProcess: string,
  isSample: boolean,
) {
  const source = readValue(row, ["issuedFrom", "sourceProcess"]);
  const sourceKey = normalizeStage(source);
  const currentKey = normalizeStage(currentProcess);
  const routeHint = normalizeStage([
    source,
    nextProcess,
    readValue(row, ["issuedFor"]),
    readValue(row, ["destinationProcess"]),
    readValue(row, ["orderType"]),
    readValue(row, ["productCategory"]),
    readValue(row, ["finishedType"]),
    readValue(row, ["salesItemName"]),
    readValue(row, ["outputItemName", "itemName", "productName"]),
  ].join(" "));
  const branch = currentKey === "fluting" || routeHint.includes("flut")
    ? "Fluting"
    : currentKey === "embossing" || routeHint.includes("emboss")
      ? "Embossing"
      : currentKey === "finishing" || routeHint.includes("finish") || routeHint.includes("decorative") || routeHint.includes("marquetry")
        ? "Finishing"
        : "";
  const finishingStages = ["Finishing", "Finishing Done"];
  const branchStages = branch === "Fluting"
    ? ["Fluting", "Fluting Done", ...finishingStages]
    : branch === "Embossing"
      ? ["Embossing", "Embossing Done", ...finishingStages]
      : branch === "Finishing"
        ? finishingStages
        : [];
  const groupingPrefix = [
    "Production Warehouse (Raw Veneer)",
    "Grouping",
    "Grouping Done",
    ...(isSample ? [] : ["Splicing", "Splicing Done"]),
  ];
  const groupingRoute = [
    ...groupingPrefix,
    "Pressing",
    "Pressing Done",
  ];
  const marquetryRoute = [
    "Production Warehouse (Raw Veneer)",
    "Marquetry",
    "Marquetry Done",
    "Pressing",
    "Pressing Done",
    "Finishing",
    "Finishing Done",
  ];
  let reliableStages: string[];

  if (currentKey === "marquetry" || sourceKey.includes("marquetry")) {
    reliableStages = marquetryRoute;
  } else if (["splicing", "pressing", "fluting", "embossing", "finishing"].includes(currentKey)) {
    reliableStages = [...groupingRoute, ...branchStages];
  } else {
    reliableStages = [source, currentProcess, nextProcess];
  }

  const stages = reliableStages
    .filter(Boolean)
    .filter((stage, index, all) =>
      all.findIndex((candidate) => normalizeStage(candidate) === normalizeStage(stage)) === index,
    );
  return stages.length > 0 ? stages : [currentProcess];
}

function resolvePipelineCurrentStage(
  process: string,
  listingState: string,
  nextProcess: string,
  stages: readonly string[],
) {
  if (listingState === "history" && nextProcess !== "Packing") {
    const routedStage = stages.find(
      (stage) => normalizeStage(stage) === normalizeStage(nextProcess),
    );
    if (routedStage) return routedStage;
  }

  if (listingState === "done" || listingState === "history") {
    const doneStage = `${process} Done`;
    if (stages.some((stage) => normalizeStage(stage) === normalizeStage(doneStage))) {
      return doneStage;
    }
  }

  return process;
}

function resolveNextProcess(currentProcess: string, issuedFor: string) {
  const currentKey = normalizeStage(currentProcess);
  const destinationKey = normalizeStage(issuedFor);

  if (currentKey === "splicing") return "Pressing";
  if (currentKey === "pressing" && destinationKey.includes("marquetry")) return "Finishing";

  if (destinationKey.includes("flut")) return "Fluting";
  if (destinationKey.includes("emboss")) return "Embossing";
  if (destinationKey.includes("finish") || destinationKey.includes("decorative")) return "Finishing";
  if (destinationKey.includes("marquetry")) return "Marquetry";
  if (destinationKey.includes("press")) return currentKey === "pressing" ? "" : "Pressing";
  if (destinationKey.includes("pack")) return "Packing";
  if (destinationKey.includes("splic")) return "Splicing";

  if (currentKey === "marquetry") return "Pressing";
  if (currentKey === "fluting" || currentKey === "embossing") return "Finishing";
  if (currentKey === "finishing") return "Packing";
  return issuedFor;
}

function buildContextualMessage(
  process: string,
  listingState: string,
  destination: string,
  isSample: boolean,
) {
  const subject = isSample ? "This sample sheet" : `This ${process.toLowerCase()} item`;
  if (listingState === "rejected") return `${subject} was rejected and is not available for downstream issuing.`;
  if (listingState === "history" && destination) return `${subject} has been issued to ${destination}.`;
  if (listingState === "issued") return `${subject} is ready for ${process}.`;
  if (destination) return `${subject} is awaiting issue to ${destination}.`;
  return `${subject} is awaiting the next production process.`;
}

function variantStageLabel(process: string, listingState: string) {
  if (listingState === "issued") return `Issued for ${process}`;
  if (listingState === "done") return `${process} Done`;
  if (listingState === "history") return `${process} History`;
  if (listingState === "rejected") return `Rejected ${process}`;
  return process;
}

function isSampleRecord(row: FactoryRecord) {
  if (row.isSample === true) return true;
  const value = readRawString(row, ["pressingFor", "forLabel", "for", "purpose"]);
  return value.toLowerCase().includes("sample");
}

export function buildFactoryOrderItemDetailFields(
  row: FactoryRecord,
  orderRecords: readonly OrderRecord[] = [],
) {
  const orderNo = readValue(row, ["orderNo"]);
  const orderItemNo = readValue(row, ["orderItemNo"]);
  const itemIndex = Math.max(0, Number(orderItemNo.match(/\d+/)?.[0] ?? "1") - 1);
  const matchedOrder = orderRecords.find(
    (orderEntry) => orderEntry.orderNo.trim().toLowerCase() === orderNo.trim().toLowerCase(),
  ) ?? getOrderRecordByOrderNo(orderNo);
  const fallbackOrder = orderRecords.length > 0
    ? orderRecords[itemIndex % orderRecords.length] ?? orderRecords[0]
    : undefined;
  const order = matchedOrder ?? fallbackOrder;
  const lineItems = order ? getOrderLineItems(order.id) : [];
  const line = lineItems[itemIndex % Math.max(1, lineItems.length)] ?? lineItems[0];
  const orderType = String(order?.orderType ?? row.orderType ?? "");
  const isFinishedOrder = /finished/i.test(orderType) || Boolean(
    line?.baseType || row.baseType || line?.baseName || line?.finishedType,
  );
  const baseType = line?.baseType || formatValue(row.baseType) || (isFinishedOrder ? "Plywood" : "");
  const baseName = line?.baseName || formatValue(row.baseName) || (baseType ? `${baseType} Base` : "");

  return [
    orderValueField("Order No.", order?.orderNo, orderNo),
    orderValueField("Order Item No.", orderItemNo),
    orderValueField("Order Type", order?.orderType, row.orderType, "Raw Order"),
    orderValueField("Customer Name", order?.customerName, row.customerName),
    orderValueField("Order Date", order?.orderDate, row.orderDate),
    orderValueField("Required Delivery Date", order?.deliveryDate, row.deliveryDate, row.requiredDeliveryDate, row.orderDate),
    orderValueField("Product Category", line?.productCategory, row.productCategory, row.productType ? `${row.productType} Veneer` : "Raw Veneer"),
    orderValueField("Finished Type", line?.finishedType, row.finishedType, row.productType),
    orderValueField("Design Code", line?.designCode, row.designCode),
    orderValueField("Structure Code", line?.structuredCode, row.structureCode, row.structuredCode),
    orderValueField("Sales Item Name", line?.salesItemName, row.salesItemName, line?.itemName, row.itemName),
    orderValueField("Item Name", line?.itemName, row.itemName),
    orderValueField("Sub Category", line?.subCategory, row.subCategory, row.itemSubCategory),
    orderValueField("Grade", line?.grade, row.grade),
    orderValueField("Length", line?.length, row.length),
    orderValueField("Width", line?.width, row.width),
    orderValueField("Thickness", line?.thickness, row.thickness, row.height, row.veneerThickness),
    ...(isFinishedOrder || baseType
      ? [
          orderValueField("Base Type", baseType),
          orderValueField("Base Name", baseName),
          orderValueField("Base Length", line?.baseLength, line?.length, row.length),
          orderValueField("Base Width", line?.baseWidth, line?.width, row.width),
          orderValueField("Base Thickness", line?.baseThickness, row.baseThickness, "12 mm"),
        ]
      : []),
    orderValueField("No. of Sheets", line?.quantitySheets, row.noOfSheets),
    orderValueField("SQM", line?.sqm, row.sqm),
    orderValueField("Total SQM", line?.totalSqm, row.totalSqm, row.sqf),
    orderValueField("Remark", line?.remark, row.remark, row.instructions),
  ];
}

function orderValueField(label: string, ...values: unknown[]): ViewField {
  for (const value of values) {
    const formatted = formatValue(value as FactoryRecord[string]);
    if (formatted) return { label, value: formatted };
  }
  return { label, value: "-" };
}

function field(label: string, row: FactoryRecord, keys: readonly string[]): ViewField {
  return { label, value: readValue(row, keys) };
}

function compactFields(fields: readonly ViewField[]) {
  const seenLabels = new Set<string>();
  return fields.filter((entry) => {
    if (!entry.value) return false;
    const key = entry.label.toLowerCase();
    if (seenLabels.has(key)) return false;
    seenLabels.add(key);
    return true;
  });
}

function readValue(row: FactoryRecord, keys: readonly string[]) {
  for (const key of keys) {
    const formatted = formatValue(row[key]);
    if (formatted) return formatted;
  }
  return "";
}

function readRawString(row: FactoryRecord, keys: readonly string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim() && value.trim() !== "-") {
      return value.trim();
    }
  }
  return "";
}

function formatValue(value: FactoryRecord[string]) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    const numericValue = Number(value);
    return Number.isInteger(numericValue) ? String(numericValue) : numericValue.toFixed(2);
  }
  if (typeof value === "string" && value.trim() && value.trim() !== "-") {
    const trimmed = value.trim();
    const numeric = Number(trimmed);
    if (Number.isFinite(numeric) && trimmed.includes(".") && trimmed.length > 8) {
      return numeric.toFixed(2);
    }
    return trimmed;
  }
  return "";
}

function normalizeStage(value: string) {
  return value.toLowerCase().replace(/cnc\s*\/\s*/g, "").replace(/[^a-z0-9]/g, "");
}
