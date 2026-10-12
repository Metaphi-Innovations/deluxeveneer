import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Box,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";

import { sawingInspectionDefinition } from "../../shared/factoryDefinitions";
import { getFactoryIssuedWorkById, factoryIssuedWorkToRow } from "../../shared/factoryIssuedWorkStore";

function displayDate(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && value.trim()) return value.trim().slice(0, 10);
  return "-";
}

export const SawingInspectionViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateData = location.state as { record?: any; tab?: string } | undefined;
  const record = useMemo(() => {
    if (stateData?.record) return stateData.record;
    if (!id) return undefined;
    const foundInRows = sawingInspectionDefinition.rows.find((r) => String(r.id) === String(id));
    if (foundInRows) return foundInRows;
    const workItem = getFactoryIssuedWorkById(id);
    return workItem ? factoryIssuedWorkToRow(workItem) : undefined;
  }, [id, stateData?.record]);

  const tab = stateData?.tab || (record?.listingState === "done" ? "done" : record?.listingState === "failed" ? "failed" : "issued");

  const isPass = tab === "done" || record?.qcStatus === "Pass";
  const isFail = tab === "failed" || record?.qcStatus === "Fail";
  const isPending = !isPass && !isFail;

  const sourceOverviewItems = useMemo(() => {
    if (!record) return [];
    return [
      { label: "Storage Sr No.", value: record.storageSrNo || "-" },
      { label: "Item Name", value: record.itemName || "-" },
      { label: "Sub Category", value: record.subCategory || record.itemSubCategory || "-" },
      { label: "Batch No", value: record.batchNo || "-" },
      { label: "Batch No. Code", value: record.batchNoCode || "-" },
      {
        label: "Source Length",
        value: record.sourceLength || record.length ? String(record.sourceLength || record.length).replace(/\s*(m|mm|mtr)$/i, "") : "-",
      },
      {
        label: "Source Width",
        value: record.sourceWidth || record.width ? String(record.sourceWidth || record.width).replace(/\s*(m|mm|mtr)$/i, "") : "-",
      },
      {
        label: "Source Height",
        value: record.sourceHeight || record.height || record.thickness ? String(record.sourceHeight || record.height || record.thickness).replace(/\s*(m|mm|mtr)$/i, "") : "-",
      },
      { label: "Source CBM", value: record.sourceCbm || record.cbm ? String(record.sourceCbm || record.cbm).replace(/\s*(m³|cbm)$/i, "") : "-" },
      { label: "Warehouse", value: record.storageWarehouseName || record.warehouseName || "-" },
    ];
  }, [record]);

  return (
    <FactoryPageShell
      title="View Sawing Inspection"
      subtitle="View details for this inspection record"
      backNav={{
        label: "Back to Sawing Inspection",
        to: `/factory/sawing-inspection?tab=${tab}`,
      }}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          {isPending && (
            <Chip
              label={record?.qcStatus === "Recheck" || record?.isRecheck ? "Recheck" : "Pending"}
              size="small"
              color={record?.qcStatus === "Recheck" || record?.isRecheck ? "info" : "warning"}
              sx={{ fontWeight: 600 }}
            />
          )}
          {isPass && (
            <Chip
              label="Inspection Pass"
              size="small"
              color="success"
              sx={{ fontWeight: 600 }}
            />
          )}
          {isFail && (
            <Chip
              label="Inspection Fail"
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        {/* Source Overview Panel (Only shown for completed/failed inspection if needed, hidden for pending to avoid duplicate panels) */}
        {!isPending && sourceOverviewItems.length > 0 && (
          <FactorySourceOverviewPanel
            title="Source Item Overview"
            items={sourceOverviewItems}
          />
        )}

        {/* Unified Details Form-like Card */}
        <Box sx={(t) => formSectionCardSx(t)}>
          <Stack spacing={2.5}>
            <FormSectionHeader
              title={
                isFail
                  ? "Failed Inspection Details"
                  : isPass
                  ? "Completed Inspection Details"
                  : "Inspection Pending Details"
              }
            />

            {record ? (
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
                  { label: "Storage Sr No.", value: record.storageSrNo || "-" },
                  {
                    label: "Issued Date",
                    value: displayDate(record.issuedDate || record.issueDate),
                  },
                  {
                    label: "Sawing Date",
                    value: displayDate(record.sawingDate || record.processDate),
                  },
                  {
                    label: "Inspection Date",
                    value: record.inspectionDate ? String(record.inspectionDate).slice(0, 10) : "-",
                  },
                  { label: "Item Name", value: record.itemName || "-" },
                  { label: "Sub Category", value: record.subCategory || record.itemSubCategory || "-" },
                  { label: "Log No.", value: record.batchNo || "-" },
                  { label: "Batch No", value: record.batchNoCode || "-" },
                  { label: "Length (mm)", value: record.length ?? "-" },
                  { label: "Width (mm)", value: record.width ?? "-" },
                  { label: "Thickness (mm)", value: record.thickness ?? record.height ?? "-" },
                  { label: "CBM", value: record.cbm ?? "-" },
                  { label: "CBF", value: record.cbf ?? "-" },
                  {
                    label: "Status",
                    value: record.qcStatus
                      ? record.qcStatus
                      : isFail
                      ? "Fail"
                      : isPass
                      ? "Pass"
                      : record.isRecheck
                      ? "Recheck"
                      : "Pending",
                  },
                  { label: "Warehouse", value: record.storageWarehouseName || record.warehouseName || "-" },
                  { label: "Created By", value: record.createdBy || "-" },
                  { label: "Updated By", value: record.updatedBy || "-" },
                  { label: "Remark", value: record.remark || "-", fullWidth: true },
                ].map((field) => (
                  <Stack
                    key={field.label}
                    spacing={0.5}
                    sx={{
                      minWidth: 0,
                      gridColumn: field.fullWidth ? { xs: "1fr", sm: "span 2", md: "span 4" } : undefined,
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        color: "text.secondary",
                        fontSize: "13px",
                        fontWeight: 500,
                        lineHeight: 1.3,
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
                        lineHeight: 1.45,
                        wordBreak: "break-word",
                      }}
                    >
                      {String(field.value)}
                    </Typography>
                  </Stack>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No details available for ID {id}.
              </Typography>
            )}
          </Stack>
        </Box>
      </Stack>
    </FactoryPageShell>
  );
};

export default SawingInspectionViewPage;
