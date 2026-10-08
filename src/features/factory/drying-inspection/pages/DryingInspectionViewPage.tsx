import React, { useMemo } from "react";
import { useLocation, useParams } from "react-router";
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
import { dryingInspectionDefinition } from "../../shared/factoryDefinitions";
import { getFactoryIssuedWorkById, factoryIssuedWorkToRow } from "../../shared/factoryIssuedWorkStore";

export const DryingInspectionViewPage: React.FC = () => {
  const theme = useTheme();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateData = location.state as { record?: any; tab?: string } | undefined;
  const record = useMemo(() => {
    if (stateData?.record) return stateData.record;
    if (!id) return undefined;
    const foundInRows = dryingInspectionDefinition.rows.find((r) => String(r.id) === String(id));
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
      { label: "Log Code", value: record.logCode || record.logNo || "-" },
      { label: "Bundle Number", value: record.bundleNumber || "-" },
      { label: "Pallet No", value: record.palletNo || "-" },
      { label: "Length", value: record.length ? String(record.length) : "-" },
      { label: "Width", value: record.width ? String(record.width) : "-" },
      { label: "Thickness", value: record.thickness || record.height ? String(record.thickness || record.height) : "-" },
      { label: "Warehouse", value: record.storageWarehouseName || record.warehouseName || "-" },
    ];
  }, [record]);

  return (
    <FactoryPageShell
      title="View Drying Inspection"
      subtitle="View details for this inspection record"
      backNav={{
        label: "Back to Drying Inspection",
        to: `/factory/drying-inspection?tab=${tab}`,
      }}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          {isPending && (
            <Chip
              label={record?.qcStatus === "Recheck" || record?.isRecheck ? "Recheck" : record?.status === "Partially Pending" ? "Partially Pending" : "Pending"}
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
        {!isPending && sourceOverviewItems.length > 0 && (
          <FactorySourceOverviewPanel
            title="Source Item Overview"
            items={sourceOverviewItems}
          />
        )}

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
                    label: "Issued Inspection Date",
                    value: record.issuedDate ? String(record.issuedDate).slice(0, 10) : record.issueDate ? String(record.issueDate).slice(0, 10) : "-",
                  },
                  {
                    label: "Inspection Date",
                    value: record.inspectionDate ? String(record.inspectionDate).slice(0, 10) : "-",
                  },
                  { label: "Item Name", value: record.itemName || "-" },
                  { label: "Sub Category", value: record.subCategory || record.itemSubCategory || "-" },
                  { label: "Log Code", value: record.logCode || record.logNo || "-" },
                  { label: "Bundle Number", value: record.bundleNumber || "-" },
                  { label: "Pallet No", value: record.palletNo || "-" },
                  { label: "Dimensions (L × W × T)", value: record.length ? `${record.length} × ${record.width} × ${record.thickness ?? record.height ?? "-"}` : "-" },
                  { label: "No of Leaves", value: record.noOfLeaves ?? record.totalLeaves ?? record.noOfSheets ?? "-" },
                  { label: "Total Sq Meter", value: record.totalSqMeter ?? record.sqm ?? "-" },
                  {
                    label: "Status",
                    value: record.status || (isFail ? "Fail" : isPass ? "Pass" : "Pending"),
                  },
                  { label: "Warehouse", value: record.storageWarehouseName || record.warehouseName || "-" },
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

export default DryingInspectionViewPage;
