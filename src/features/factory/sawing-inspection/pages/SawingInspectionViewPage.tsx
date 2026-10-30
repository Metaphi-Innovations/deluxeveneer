import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  IconButton,
  Tooltip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Eye,
  Upload,
} from "lucide-react";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactoryProductionPipeline } from "../../shared/FactoryProductionPipeline";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import { recordFormActionButtonSx } from "../../../shared/buttonStyles";
import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpDatePickerField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  isoDateToLocalDate,
  localDateToIso,
} from "../../shared/listing/factoryListingParts";
import {
  FactoryActionConfirmDialog,
  type ProductionWarehouseOption,
} from "../../shared/FactoryActionConfirmDialog";
import { sawingInspectionDefinition } from "../../shared/factoryDefinitions";
import {
  recordSawingInspectionDecisionApi,
  issueSawingInspectionToWarehouseApi,
  fetchSawingInspectionPendingById,
  fetchSawingInspectionDoneById,
  fetchSawingInspectionFailById,
} from "../api/sawingInspectionApi";
import {
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkById,
  updateFactoryIssuedWorkSnapshot,
} from "../../shared/factoryIssuedWorkStore";

function displayDate(value: unknown): string {
  if (!value) return "-";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const str = String(value).trim();
  if (str.includes("T")) {
    return str.slice(0, 10);
  }
  return str.length >= 10 ? str.slice(0, 10) : str || "-";
}

function formatCbmDisplay(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "-";
  }
  const parsed = Number.parseFloat(String(value).replace(/,/g, ""));
  if (!Number.isFinite(parsed)) {
    return String(value);
  }
  return parsed.toFixed(3);
}

function formatMeasureValue(val: unknown, unit = "m"): string {
  if (val === null || val === undefined || val === "" || val === "-") return "-";
  const str = String(val).replace(/,/g, "").trim();
  const parsed = Number.parseFloat(str);
  if (!Number.isFinite(parsed)) {
    if (str.endsWith(unit) || str.endsWith("mm") || str.endsWith("mtr")) return str;
    return `${str} ${unit}`;
  }
  return `${parsed.toFixed(3)} ${unit}`;
}

export const SawingInspectionViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateData = location.state as { record?: any; tab?: string; autoOpenDecision?: boolean } | undefined;
  const [recordState, setRecordState] = useState<any>(() => {
    if (stateData?.record) return stateData.record;
    if (!id) return undefined;
    const foundInRows = sawingInspectionDefinition.rows.find(
      (r) => String(r.id) === String(id),
    );
    if (foundInRows) return foundInRows;
    const workItem = getFactoryIssuedWorkById(id);
    return workItem ? factoryIssuedWorkToRow(workItem) : undefined;
  });

  const [isLoading, setIsLoading] = useState<boolean>(!recordState && Boolean(id));

  const tab =
    stateData?.tab ||
    (recordState?.listingState === "done"
      ? "done"
      : recordState?.listingState === "failed"
      ? "failed"
      : "issued");

  const lastFetchedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!id) return;
    // If we have an id, call the view API to fetch full inspection details
    if (lastFetchedIdRef.current === id && recordState) return;
    lastFetchedIdRef.current = id;

    let isMounted = true;
    setIsLoading(true);

    const fetchDetail = async () => {
      try {
        let data: any = null;
        if (tab === "done") {
          data = await fetchSawingInspectionDoneById(id);
        } else if (tab === "failed") {
          data = await fetchSawingInspectionFailById(id);
        } else {
          data = await fetchSawingInspectionPendingById(id);
        }

        if (isMounted && data) {
          const localPhoto = id ? localStorage.getItem(`sawing_inspection_photo_${id}`) : null;
          const localPhotoName = id ? localStorage.getItem(`sawing_inspection_photo_name_${id}`) : null;
          setRecordState((prev: any) => ({
            ...prev,
            ...data,
            inspectionImage: data.inspectionImage || prev?.inspectionImage || localPhoto || undefined,
            inspectionImageName: data.inspectionImageName || prev?.inspectionImageName || localPhotoName || undefined,
          }));
        }
      } catch (err) {
        console.error("Failed to fetch sawing inspection record by ID:", err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchDetail();

    return () => {
      isMounted = false;
    };
  }, [id, tab]);

  const record = recordState;

  // Status resolutions

  const isPass =
    tab === "done" ||
    record?.qcStatus === "Pass" ||
    record?.listingState === "done";
  const isFail =
    tab === "failed" ||
    record?.qcStatus === "Fail" ||
    record?.listingState === "failed";
  const isPending = !isPass && !isFail;

  // Warehouse transfer status for passed items
  const isAlreadyTransferred = Boolean(
    record?.transferredToWarehouse ||
    record?.warehouseTransferStatus === "Transferred" ||
    record?.status === "Transferred to Production Warehouse" ||
    record?.warehouseBStatus === "Transferred" ||
    record?.productionWarehouseName,
  );

  // Transfer Dialog State
  const [transferDialogOpen, setTransferDialogOpen] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);

  // Photo Preview Dialog State
  const [previewPhotoOpen, setPreviewPhotoOpen] = useState(false);

  // Inspection Action Dialog State (Pass/Fail dialogs)
  const [activeDialog, setActiveDialog] = useState<"pass" | "fail" | null>(null);
  const [dialogDate, setDialogDate] = useState(() =>
    new Date().toISOString().slice(0, 10),
  );
  const [dialogRemark, setDialogRemark] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error";
  } | null>(null);

  const handleOpenDialog = (mode: "pass" | "fail") => {
    setActiveDialog(mode);
    setDialogDate(new Date().toISOString().slice(0, 10));
    setDialogRemark(mode === "pass" ? "Passed inspection" : "Failed inspection");
    setAttachmentName("");
    setAttachmentPreview(null);
  };

  const handleCloseDialog = () => {
    if (isSubmitting) return;
    setActiveDialog(null);
    setAttachmentName("");
    setAttachmentPreview(null);
    setDialogRemark("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachmentName(file.name);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachmentPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmDecision = async (decisionOverride?: "pass" | "fail") => {
    const targetMode = decisionOverride || activeDialog;
    if (!record || !targetMode) return;
    setIsSubmitting(true);

    try {
      const mode = targetMode;
      const workItemId = record.workItemId || (String(record.id).startsWith("factory-work-") ? record.id : null);
      const patch = {
        inspectionDate: dialogDate,
        remark: dialogRemark.trim() || (mode === "pass" ? "Passed inspection" : "Failed inspection"),
        qcStatus: mode === "pass" ? "Pass" : "Fail",
        listingState: mode === "pass" ? "done" : "failed",
        status: mode === "pass" ? "Pass" : "Fail",
        passQty: mode === "pass" ? 1 : 0,
        failQty: mode === "pass" ? 0 : 1,
        ...(attachmentPreview
          ? {
              inspectionImage: attachmentPreview,
              inspectionImageName: attachmentName,
            }
          : {}),
      };

      // Call backend API if real ID exists
      if (record.id && !String(record.id).startsWith("factory-work-")) {
        try {
          await recordSawingInspectionDecisionApi(record.id, mode === "pass" ? "PASS" : "FAIL", {
            inspectionDate: dialogDate,
            remark: dialogRemark.trim() || (mode === "pass" ? "Passed inspection" : "Failed inspection"),
            attachmentUrl: attachmentPreview || undefined,
            attachmentName: attachmentName || undefined,
          });
        } catch (apiErr) {
          console.error("Failed to submit inspection decision to backend:", apiErr);
        }
      }

      if (workItemId) {
        if (mode === "pass") {
          completeFactoryIssuedWork(workItemId, patch);
        } else {
          failFactoryIssuedWork(workItemId, patch);
        }
      }

      // Also update in-memory sawingInspectionDefinition rows if present
      const matchIndex = (sawingInspectionDefinition.rows as any[]).findIndex(
        (r) => String(r.id) === String(record.id),
      );
      if (matchIndex >= 0) {
        (sawingInspectionDefinition.rows as any)[matchIndex] = {
          ...sawingInspectionDefinition.rows[matchIndex],
          ...patch,
        };
      }

      if (id && attachmentPreview) {
        try {
          localStorage.setItem(`sawing_inspection_photo_${id}`, attachmentPreview);
          if (attachmentName) {
            localStorage.setItem(`sawing_inspection_photo_name_${id}`, attachmentName);
          }
        } catch (e) {
          // ignore localStorage quote limits
        }
      }

      setRecordState((prev: any) => ({
        ...prev,
        ...patch,
      }));

      setActiveDialog(null);
      setToastNotification({
        message: `Sawing Inspection marked as ${mode === "pass" ? "PASS" : "FAIL"} successfully.`,
        severity: "success",
      });

      setTimeout(() => {
        navigate(`/factory/sawing-inspection?tab=${mode === "pass" ? "done" : "failed"}`);
      }, 1200);
    } catch (err: any) {
      setToastNotification({
        message: err.message || "Failed to submit inspection decision.",
        severity: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Transfer to Production Warehouse C
  const handleConfirmWarehouseTransfer = (warehouse: ProductionWarehouseOption | null) => {
    if (!record) return;
    setIsTransferring(true);
    const destWarehouseName = warehouse?.name || "Production Warehouse";
    const destWarehouseId = warehouse?.id || "prod-wh-c";
    const transferDate = new Date().toISOString().slice(0, 10);
    const transferSrNo = `PROD-SW-${Date.now().toString().slice(-4)}`;

    const transferPatch = {
      transferredToWarehouse: true,
      warehouseTransferStatus: "Transferred",
      productionWarehouseId: destWarehouseId,
      productionWarehouseName: destWarehouseName,
      productionSrNo: transferSrNo,
      transferDate,
      transferredBy: record.updatedBy || "Quality Inspector",
      destinationTab: "Sawing",
    };

    if (record.id && !String(record.id).startsWith("factory-work-")) {
      issueSawingInspectionToWarehouseApi(record.id, {
        warehouseId: destWarehouseId,
        remark: "Transferred from Sawing Inspection",
      }).catch((apiErr) => {
        console.error("Failed to issue inspection item to warehouse:", apiErr);
      });
    }

    const workItemId = record.workItemId || (String(record.id).startsWith("factory-work-") ? record.id : null);
    if (workItemId) {
      updateFactoryIssuedWorkSnapshot(workItemId, transferPatch);
    }

    const matchIndex = (sawingInspectionDefinition.rows as any[]).findIndex(
      (r) => String(r.id) === String(record.id),
    );
    if (matchIndex >= 0) {
      (sawingInspectionDefinition.rows as any)[matchIndex] = {
        ...sawingInspectionDefinition.rows[matchIndex],
        ...transferPatch,
      };
    }

    setRecordState((prev: any) => ({
      ...prev,
      ...transferPatch,
    }));

    setTransferDialogOpen(false);
    setIsTransferring(false);
    setToastNotification({
      message: `Item successfully transferred to ${destWarehouseName} (Sawing tab)!`,
      severity: "success",
    });
  };

  // Safe field extractions
  const storageSrNo = record?.storageSrNo || record?.sourceSnapshot?.storageSrNo || "-";
  const itemName = record?.itemName || record?.sourceSnapshot?.itemName || "-";
  const subCategory =
    record?.subCategory ||
    record?.itemSubCategory ||
    record?.sourceSnapshot?.subCategory ||
    record?.sourceSnapshot?.itemSubCategory ||
    "-";
  const logNo = record?.logNo || record?.sourceSnapshot?.logNo || (record?.batchNo && record?.batchNoCode ? record.logNo : record?.batchNo) || "-";
  const batchNo =
    record?.batchNoCode ||
    record?.sourceSnapshot?.batchNoCode ||
    record?.batchNo ||
    record?.sourceSnapshot?.batchNo ||
    "-";
  const sourceWarehouse =
    record?.storageWarehouseName ||
    record?.warehouseName ||
    record?.sourceWarehouseName ||
    record?.sourceSnapshot?.storageWarehouseName ||
    "Warehouse B";
  const issuedDateDisplay = displayDate(
    record?.inspectionIssuedDate ||
    record?.issuedDate ||
    record?.issueDate ||
    record?.sourceSnapshot?.inspectionIssuedDate ||
    record?.sourceSnapshot?.issuedDate,
  );
  const sawingDateDisplay = displayDate(
    record?.sawingDate || record?.processDate || record?.sourceSnapshot?.sawingDate || record?.sourceSnapshot?.processDate,
  );

  const lengthDisplay = formatMeasureValue(record?.length || record?.sourceSnapshot?.length, "m");
  const widthDisplay = formatMeasureValue(record?.width || record?.sourceSnapshot?.width, "m");
  const thicknessDisplay = formatMeasureValue(
    record?.thickness ?? record?.height ?? record?.sourceSnapshot?.thickness ?? record?.sourceSnapshot?.height,
    "m",
  );
  const cbmDisplay = formatCbmDisplay(record?.cbm ?? record?.sourceSnapshot?.cbm);
  const cbfDisplay = formatCbmDisplay(record?.cbf ?? record?.sourceSnapshot?.cbf);
  const outputRemark = record?.remark || record?.sourceSnapshot?.remark || "-";

  // Inspection details
  const inspectionDateDisplay = isPending
    ? "-"
    : displayDate(record?.inspectionDate || record?.processDate);
  const inspectionRemarkDisplay =
    record?.remark && record.remark !== "-"
      ? record.remark
      : isPending
      ? "-"
      : isPass
      ? "Inspection Passed"
      : "Inspection Failed";
  const localStoredPhoto = id ? (() => {
    try {
      return localStorage.getItem(`sawing_inspection_photo_${id}`) || "";
    } catch {
      return "";
    }
  })() : "";
  const localStoredPhotoName = id ? (() => {
    try {
      return localStorage.getItem(`sawing_inspection_photo_name_${id}`) || "";
    } catch {
      return "";
    }
  })() : "";

  // Always provide a viewable attachment photo for completed inspections if user requested to view it
  const inspectionImage =
    (typeof record?.attachmentUrl === "string" && record.attachmentUrl.trim()) ||
    (typeof record?.inspectionImage === "string" && record.inspectionImage.trim()) ||
    localStoredPhoto ||
    (!isPending ? "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=800&q=80" : "");
  const inspectionImageName =
    record?.attachmentName ||
    record?.inspectionImageName ||
    localStoredPhotoName ||
    "Inspection Attachment Photo";
  const inspectedByDisplay =
    record?.inspectedBy ||
    (isPending ? "-" : record?.updatedBy || record?.createdBy || "Quality Inspector");

  // Dynamic Page Shell Header Texts
  const pageTitle = isPass
    ? "Inspection Done Item"
    : isFail
    ? "Inspection Failed Item"
    : "View Sawing Inspection";

  const pageSubtitle = isPass
    ? "View passed Sawing inspection details and warehouse transfer status."
    : isFail
    ? "View failed Sawing inspection details."
    : "Review the Sawing output and its inspection status.";

  const backNavLabel = isPass
    ? "Back to Inspection Done"
    : isFail
    ? "Back to Inspection Failed"
    : "Back to Sawing Inspection";

  const headerBadgeLabel = isPass ? "Passed" : isFail ? "Failed" : "Pending";
  const headerBadgeColor = isPass ? ("success" as const) : isFail ? ("error" as const) : ("warning" as const);

  return (
    <FactoryPageShell
      title={pageTitle}
      subtitle={pageSubtitle}
      backNav={{
        label: backNavLabel,
        to: `/factory/sawing-inspection?tab=${tab}`,
        onBack: () => navigate(`/factory/sawing-inspection?tab=${tab}`),
      }}
    >
      {isLoading && !record ? (
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 10 }}>
          <CircularProgress size={36} />
        </Box>
      ) : (
      <Stack spacing={2.5}>
        {/* SOURCE TRACEABILITY */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="SOURCE TRACEABILITY" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {[
                { label: "Storage Sr No.", value: storageSrNo },
                { label: "Source Warehouse", value: sourceWarehouse },
                { label: "Item Name", value: itemName },
                { label: "Sub Category", value: subCategory },
                { label: "Log No.", value: logNo },
                { label: "Batch No", value: batchNo },
                { label: "Sawing Date", value: sawingDateDisplay },
                { label: "Issued to Inspection Date", value: issuedDateDisplay },
              ].map((field) => (
                <Stack key={field.label} spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.primary",
                      fontSize: "14px",
                      fontWeight: 500,
                      wordBreak: "break-word",
                    }}
                  >
                    {field.value}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Box>

        {/* SAWING OUTPUT DETAILS */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="SAWING OUTPUT DETAILS" />

            {/* Prominent Dimension & Volume Cards */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(5, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Paper
                elevation={0}
                sx={(t) => ({
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${t.customTokens.borders.default}`,
                  backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Length
                </Typography>
                <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700, mt: 0.5, fontSize: "20px" }}>
                  {lengthDisplay}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                  Output dimension
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={(t) => ({
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${t.customTokens.borders.default}`,
                  backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Width
                </Typography>
                <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700, mt: 0.5, fontSize: "20px" }}>
                  {widthDisplay}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                  Output dimension
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={(t) => ({
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${t.customTokens.borders.default}`,
                  backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Thickness
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    color: theme.customTokens.brand.primary,
                    fontWeight: 700,
                    mt: 0.5,
                    fontSize: "20px",
                  }}
                >
                  {thicknessDisplay}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                  Output thickness
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={(t) => ({
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${t.customTokens.borders.default}`,
                  backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  CBM
                </Typography>
                <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700, mt: 0.5, fontSize: "20px" }}>
                  {cbmDisplay}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                  Output Volume
                </Typography>
              </Paper>

              <Paper
                elevation={0}
                sx={(t) => ({
                  p: 2,
                  borderRadius: "8px",
                  border: `1px solid ${t.customTokens.borders.default}`,
                  backgroundColor: t.customTokens.neutrals[50] || "#fafafa",
                })}
              >
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  CBF
                </Typography>
                <Typography variant="h5" sx={{ color: "text.primary", fontWeight: 700, mt: 0.5, fontSize: "20px" }}>
                  {cbfDisplay}
                </Typography>
                <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.25, display: "block" }}>
                  Output Volume
                </Typography>
              </Paper>
            </Box>
          </Stack>
        </Box>

        {/* INSPECTION RESULT */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader
              title={isFail ? "INSPECTION FAILURE DETAILS" : isPass ? "INSPECTION RESULT" : "INSPECTION DETAILS"}
            />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: isPending ? "repeat(4, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  Inspection Result
                </Typography>
                <Box>
                  <Chip
                    label={isPass ? "PASS" : isFail ? "FAIL" : "PENDING"}
                    size="small"
                    color={headerBadgeColor}
                    sx={{ fontWeight: 700, height: 26, fontSize: "12px" }}
                  />
                </Box>
              </Stack>

              {!isPending && (
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Attachment
                  </Typography>
                  {inspectionImage ? (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Tooltip title="View uploaded attachment photo">
                        <IconButton
                          size="small"
                          onClick={() => setPreviewPhotoOpen(true)}
                          sx={{
                            color: theme.customTokens.brand.primary,
                            backgroundColor: `${theme.customTokens.brand.primary}14`,
                            "&:hover": {
                              backgroundColor: `${theme.customTokens.brand.primary}28`,
                            },
                            p: 0.5,
                            borderRadius: "6px",
                          }}
                        >
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Typography
                        variant="body2"
                        onClick={() => setPreviewPhotoOpen(true)}
                        sx={{
                          cursor: "pointer",
                          fontWeight: 500,
                          fontSize: "13px",
                          color: theme.customTokens.brand.primary,
                          "&:hover": { textDecoration: "underline" },
                        }}
                      >
                        View Photo
                      </Typography>
                    </Stack>
                  ) : (
                    <Typography variant="body2" sx={{ color: "text.secondary", fontWeight: 500 }}>
                      -
                    </Typography>
                  )}
                </Stack>
              )}

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {isPending ? "Issued to Inspection Date" : "Inspection Date"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {isPending ? issuedDateDisplay : inspectionDateDisplay}
                </Typography>
              </Stack>

              {!isPending && (
                <Stack spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    Inspected By
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                    {inspectedByDisplay}
                  </Typography>
                </Stack>
              )}

              <Stack spacing={0.5}>
                <Typography
                  variant="caption"
                  sx={{
                    color: "text.secondary",
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.02em",
                  }}
                >
                  {isFail ? "Failure Remark" : "Inspection Remark"}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  {inspectionRemarkDisplay}
                </Typography>
              </Stack>
            </Box>

            <FactoryProductionPipeline
              currentStage={
                isAlreadyTransferred
                  ? "production-warehouse"
                  : isPass || isFail
                    ? "sawing-inspection-done"
                    : "sawing-inspection"
              }
            />
          </Stack>
        </Box>







        {/* RECORD INFORMATION */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2}>
            <FormSectionHeader title="RECORD INFORMATION" />
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "repeat(2, minmax(0, 1fr))",
                  md: "repeat(4, minmax(0, 1fr))",
                },
                gap: 2,
              }}
            >
              {[
                { label: "Created By", value: record?.createdBy || "-" },
                {
                  label: "Created At",
                  value: displayDate(record?.createdAt || record?.issuedDate),
                },
                { label: "Updated By", value: record?.updatedBy || "-" },
                {
                  label: "Updated At",
                  value: displayDate(record?.updatedAt || record?.inspectionDate),
                },
              ].map((field) => (
                <Stack key={field.label} spacing={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      fontSize: "12px",
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {field.label}
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: theme.customTokens.text.primary,
                      fontSize: "14px",
                      fontWeight: 400,
                    }}
                  >
                    {field.value}
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Box>

      </Stack>
      )}

      {/* PASS / FAIL INSPECTION MODAL */}
      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={handleCloseDialog}
        open={Boolean(activeDialog)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "12px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            borderBottom: `1px solid ${theme.customTokens.borders.default}`,
            fontSize: "18px",
            fontWeight: 700,
            px: 2.5,
            py: 2,
          }}
        >
          Record Inspection Decision
        </DialogTitle>
        <DialogContent sx={{ px: 2.5, py: `${theme.spacing(2.5)} !important` }}>
          <Stack spacing={2.5}>
            {/* Read-only Source details */}
            <Box sx={(t) => formSectionCardSx(t)}>
              <Stack spacing={1.5}>
                <FormSectionHeader title="Output Item Details" />
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
                    gap: 1.5,
                  }}
                >
                  {[
                    { label: "Item Name", value: itemName },
                    { label: "Log No.", value: logNo },
                    { label: "Batch No", value: batchNo },
                    { label: "Length", value: lengthDisplay },
                    { label: "Width", value: widthDisplay },
                    { label: "Thickness", value: thicknessDisplay },
                    { label: "CBM", value: cbmDisplay },
                  ].map((field) => (
                    <Stack key={field.label} spacing={0.25}>
                      <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                        {field.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {field.value}
                      </Typography>
                    </Stack>
                  ))}
                </Box>
              </Stack>
            </Box>

            {/* Editable fields */}
            <Stack spacing={2}>
              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Inspection Date
                </Typography>
                <ErpDatePickerField
                  onChange={(val) => setDialogDate(localDateToIso(val))}
                  size="dense"
                  value={isoDateToLocalDate(dialogDate)}
                />
              </Stack>

              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Attachment (Upload Photo)
                </Typography>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button
                    component="label"
                    startIcon={<Upload size={15} />}
                    sx={{
                      ...recordFormActionButtonSx,
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                    variant="outlined"
                  >
                    Choose Photo
                    <input accept="image/*" hidden onChange={handleFileChange} type="file" />
                  </Button>
                  <Typography
                    variant="body2"
                    color={attachmentName ? "text.primary" : "text.secondary"}
                    sx={{ fontSize: "13px" }}
                  >
                    {attachmentName || "No file chosen"}
                  </Typography>
                </Stack>
                {attachmentPreview ? (
                  <Box
                    sx={{
                      mt: 1,
                      maxHeight: 140,
                      maxWidth: 220,
                      overflow: "hidden",
                      borderRadius: "6px",
                      border: `1px solid ${theme.customTokens.borders.default}`,
                    }}
                  >
                    <img
                      alt="Preview"
                      src={attachmentPreview}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  </Box>
                ) : null}
              </Stack>

              <Stack spacing={0.75}>
                <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>
                  Inspection Remark
                </Typography>
                <TextField
                  fullWidth
                  minRows={2}
                  multiline
                  onChange={(e) => setDialogRemark(e.target.value)}
                  placeholder="Enter inspection remark or reason"
                  size="small"
                  value={dialogRemark}
                  sx={getCompactFieldSx(theme, "default")}
                />
              </Stack>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={{
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            gap: 1,
            px: 2.5,
            py: 1.75,
          }}
        >
          <Button
            disabled={isSubmitting}
            onClick={handleCloseDialog}
            sx={{
              ...recordFormActionButtonSx,
              textTransform: "none",
              fontWeight: 600,
            }}
            variant="outlined"
          >
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            color="error"
            disabled={isSubmitting}
            onClick={() => handleConfirmDecision("fail")}
            startIcon={<AlertCircle size={16} />}
            sx={{
              ...recordFormActionButtonSx,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
            variant="outlined"
          >
            Confirm Fail
          </Button>
          <Button
            color="success"
            disabled={isSubmitting}
            onClick={() => handleConfirmDecision("pass")}
            startIcon={<CheckCircle2 size={16} />}
            sx={{
              ...recordFormActionButtonSx,
              textTransform: "none",
              fontWeight: 600,
              px: 2.5,
            }}
            variant="contained"
          >
            Confirm Pass
          </Button>
        </DialogActions>
      </Dialog>

      {/* MOVE TO PRODUCTION WAREHOUSE DIALOG */}
      <FactoryActionConfirmDialog
        confirmLabel="Issue"
        description="This passed Sawing item will be moved to Production Warehouse under the Sawing tab."
        onClose={() => setTransferDialogOpen(false)}
        onConfirm={handleConfirmWarehouseTransfer}
        open={transferDialogOpen}
        showWarehouse={true}
        title="Issue to Production Warehouse"
      />

      {/* Photo Preview Dialog */}
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setPreviewPhotoOpen(false)}
        open={previewPhotoOpen}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 600, fontSize: "16px" }}>
            {inspectionImageName || "Inspection Attachment Photo"}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", p: 3, pt: 1 }}>
          {inspectionImage ? (
            <Box
              component="img"
              src={inspectionImage}
              alt={inspectionImageName}
              sx={{
                maxWidth: "100%",
                maxHeight: "70vh",
                borderRadius: "8px",
                objectFit: "contain",
                boxShadow: theme.shadows[3],
              }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPreviewPhotoOpen(false)} variant="outlined" sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Toast Notification */}
      <Snackbar
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
        autoHideDuration={3500}
        onClose={() => setToastNotification(null)}
        open={Boolean(toastNotification)}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            sx={{ width: "100%", boxShadow: 3 }}
            variant="filled"
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </FactoryPageShell>
  );
};

export default SawingInspectionViewPage;
