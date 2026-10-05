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

  const isHistory = tab === "history" || record?.eventType === "UPDATED";

  const sourceOverviewItems = useMemo(() => {
    if (!sourceItem) return [];
    const items = [
      { label: "Storage Sr No.", value: sourceItem.storageSrNo },
    ];
    if (!isHistory) {
      items.push({ label: "Sawing Sr No.", value: sourceItem.sawingSrNo });
    }
    items.push(
      { label: "Inward Sr No.", value: sourceItem.inwardSrNo },
      { label: "Supplier Name", value: sourceItem.supplierName },
      { label: "Item Name", value: sourceItem.itemName },
      { label: "Batch No", value: sourceItem.batchNo },
      {
        label: "Source Length",
        value: sourceItem.length !== "-" ? `${sourceItem.length} mm` : "-",
      },
      {
        label: "Source Width",
        value: sourceItem.width !== "-" ? `${sourceItem.width} mm` : "-",
      },
      {
        label: "Source Height",
        value: sourceItem.height !== "-" ? `${sourceItem.height} mm` : "-",
      },
      { label: "Source CBM", value: sourceItem.cbm },
      { label: "Warehouse", value: sourceItem.storageWarehouseName },
    );
    return items;
  }, [sourceItem, isHistory]);

  return (
    <FactoryPageShell
      title={`View Sawing ${isRejected ? "Rejected Item" : "Process Details"}`}
      subtitle="View details for this sawing record"
      backNav={{
        label: "Back to Sawing",
        to: `/factory/sawing?tab=${tab}`,
      }}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          {!isHistory && record?.sawingSrNo && (
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
        {/* 1. Source Overview Panel */}
        {sourceOverviewItems.length > 0 && (
          <FactorySourceOverviewPanel
            title="Source Item Overview"
            items={sourceOverviewItems}
          />
        )}

          {/* 2. Process Details Table / Item View */}
          <Box sx={(t) => formSectionCardSx(t)}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {isRejected ? "Rejected Item Information" : "Sawing Output Details"}
              </Typography>

              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>Batch No</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>Length (mm)</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>Width (mm)</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>Height (mm)</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>CBM</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>CBF</TableCell>
                      <TableCell sx={transactionTableHeaderCellSx(theme)}>
                        {isRejected ? "Rejection Reason / Remark" : "Remark"}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {record ? (
                      <TableRow hover>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.batchNo || "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.length ?? "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.width ?? "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.height ?? "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.cbm ?? "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.cbf ?? "-"}
                        </TableCell>
                        <TableCell sx={transactionTableBodyCellSx(theme)}>
                          {record.remark || (isRejected ? "Rejected" : "-")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          align="center"
                          sx={{ py: 3, color: "text.secondary" }}
                        >
                          No details available for ID {id}.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Stack>
          </Box>
        </Stack>
    </FactoryPageShell>
  );
};
export default SawingViewPage;
