import React, { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import {
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { FactoryPageShell } from "../../shared/FactoryPageShell";
import { FactorySourceOverviewPanel } from "../../shared/FactorySourceOverviewPanel";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../../shared/listingTableStyles";

export const SawingViewPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();

  const stateData = location.state as { record?: any; tab?: string } | undefined;
  const record = stateData?.record;
  const tab = stateData?.tab || "done";

  // Check if item is rejected
  const isRejected = tab === "rejected" || record?.eventType === "REJECTED" || Boolean(record?.rejectedId);

  // Source item info
  const sourceItem = useMemo(() => {
    if (!record) return null;
    return {
      storageSrNo:
        record.storageSrNo ||
        record.storageItem?.storageSrNo ||
        record.sourceIssueItem?.storageItemId ||
        "-",
      sawingSrNo: record.sawingSrNo || record.done?.sawingSrNo || "-",
      itemName: record.itemName || record.item?.name || "Veneer Block",
      subCategory:
        record.subCategory ||
        record.itemSubCategoryName ||
        record.itemSubCategory?.name ||
        "-",
      batchNo: record.batchNo || "-",
      length:
        record.sourceLength ||
        record.sourceIssueItem?.length ||
        record.length ||
        "-",
      width:
        record.sourceWidth ||
        record.sourceIssueItem?.width ||
        record.width ||
        "-",
      height:
        record.sourceHeight ||
        record.sourceIssueItem?.height ||
        record.height ||
        "-",
      cbm:
        record.sourceCbm ||
        record.sourceIssueItem?.cbm ||
        record.cbm ||
        "-",
      cbf:
        record.sourceCbf ||
        record.sourceIssueItem?.cbf ||
        record.cbf ||
        "-",
      storageWarehouseName:
        record.storageWarehouseName ||
        record.done?.storageWarehouse?.name ||
        "-",
      supplierName:
        record.supplierName ||
        record.storageItem?.supplierName ||
        record.supplier?.name ||
        "-",
      inwardSrNo:
        record.inwardSrNo ||
        record.storageItem?.inwardSrNo ||
        "-",
      receivedQuantity:
        record.receivedQuantity ||
        record.storageItem?.receivedQuantity ||
        "-",
      availableQuantity:
        record.availableQuantity ||
        record.storageItem?.availableQuantity ||
        "-",
    };
  }, [record]);

  const isIssued = tab === "issued";
  const isHistory = tab === "history" || record?.eventType === "UPDATED";

  const sourceOverviewItems = useMemo(() => {
    if (!sourceItem) return [];
    const items = [
      { label: "Storage Sr No.", value: sourceItem.storageSrNo },
      { label: "Item Name", value: sourceItem.itemName },
      { label: "Log No.", value: sourceItem.batchNo },
      {
        label: isIssued ? "Length" : "Source Length",
        value: sourceItem.length !== "-" ? String(sourceItem.length).replace(/\s*(m|mm|mtr)$/i, "") : "-",
      },
      {
        label: isIssued ? "Width" : "Source Width",
        value: sourceItem.width !== "-" ? String(sourceItem.width).replace(/\s*(m|mm|mtr)$/i, "") : "-",
      },
      {
        label: isIssued ? "Height" : "Source Height",
        value: sourceItem.height !== "-" ? String(sourceItem.height).replace(/\s*(m|mm|mtr)$/i, "") : "-",
      },
      {
        label: isIssued ? "Received CBM" : "Source CBM",
        value: record?.receivedCbm ?? (sourceItem.cbm ? String(sourceItem.cbm).replace(/\s*(m³|cbm)$/i, "") : "-"),
      },
      ...(isIssued
        ? [
            {
              label: "Available CBM",
              value: record?.availableCbm ?? record?.receivedCbm ?? (sourceItem.cbm ? String(sourceItem.cbm).replace(/\s*(m³|cbm)$/i, "") : "-"),
            },
            {
              label: "Sub Category",
              value: sourceItem.subCategory,
            },
          ]
        : []),
      { label: "Warehouse", value: sourceItem.storageWarehouseName },
    ];
    return items;
  }, [sourceItem, isIssued, record]);

  return (
    <FactoryPageShell
      title={
        isIssued
          ? "View Issue for Sawing Item"
          : `View Sawing ${isRejected ? "Rejected Item" : "Process Details"}`
      }
      subtitle={
        isIssued
          ? "View listing details for this issued sawing item"
          : "View details for this sawing record"
      }
      backNav={{
        label: "Back to Sawing",
        to: `/factory/sawing?tab=${tab}`,
      }}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          {!isIssued && !isHistory && record?.sawingSrNo && (
            <Chip
              label={`Sawing #${record.sawingSrNo}`}
              size="small"
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          )}
          {isRejected && (
            <Chip
              label="Rejected"
              size="small"
              color="error"
              sx={{ fontWeight: 600 }}
            />
          )}
        </Stack>
      }
    >
      <Stack spacing={2.5}>
        {/* 1. Source / Listing Item Overview Panel */}
        {sourceOverviewItems.length > 0 && (
          <FactorySourceOverviewPanel
            title={isIssued ? "Issue for Sawing Details" : "Source Item Overview"}
            items={sourceOverviewItems}
          />
        )}

        {/* 2. Process Details Form-like Card (Only displayed for Process / Done / History / Rejected, NOT for Issue for Sawing) */}
        {!isIssued && (
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2.5}>
              <FormSectionHeader
                title={isRejected ? "Rejected Item Details" : "Sawing Process Details"}
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
                    { label: "Storage Sr No.", value: record.storageSrNo || sourceItem?.storageSrNo || "-" },
                    {
                      label: "Sawing Date",
                      value: record.processDate
                        ? typeof record.processDate === "string" && record.processDate.includes("T")
                          ? record.processDate.slice(0, 10)
                          : String(record.processDate).slice(0, 10)
                        : record.sawingDate
                        ? String(record.sawingDate).slice(0, 10)
                        : record.issuedDate
                        ? String(record.issuedDate).slice(0, 10)
                        : "-",
                    },
                    { label: "Item Name", value: record.itemName || sourceItem?.itemName || "-" },
                    { label: "Sub Category", value: record.subCategory || record.itemSubCategory || sourceItem?.subCategory || "-" },
                    { label: "Log No.", value: record.batchNo || "-" },
                    { label: "Batch No", value: record.batchNoCode || "-" },
                    { label: "Length (mm)", value: record.length ?? "-" },
                    { label: "Width (mm)", value: record.width ?? "-" },
                    { label: "Thickness (mm)", value: record.thickness ?? record.height ?? "-" },
                    { label: "CBM", value: record.cbm ?? "-" },
                    { label: "CBF", value: record.cbf ?? "-" },
                    { label: "Available CBM", value: record.availableCbm ?? "-" },
                    { label: "Available CBF", value: record.availableCbf ?? "-" },
                    { label: "Status", value: isRejected ? "Rejected" : isHistory ? "Inspection Done" : record.status || "Completed" },
                    { label: "Created By", value: record.createdBy || "-" },
                    { label: "Updated By", value: record.updatedBy || "-" },
                    { label: "Remark", value: record.remark || (isRejected ? "Rejected" : "-"), fullWidth: true },
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
        )}
      </Stack>
    </FactoryPageShell>
  );
};
export default SawingViewPage;
