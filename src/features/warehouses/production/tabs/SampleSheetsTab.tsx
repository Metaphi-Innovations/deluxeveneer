import { useState, useMemo, useEffect, type Dispatch, type SetStateAction } from "react";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../../components/data-display/EnterpriseDataTable";
import { Eye, Plus } from "lucide-react";
import { useNavigate } from "react-router";
import {
  sampleSheetColumns,
  type SampleSheetTableRow,
} from "../types/productionWarehouseTypes";
import {
  getSampleSheetByNo,
  isSampleEligibleForOrder,
  resolveSampleFinishedType,
  useSampleSheetRecords,
  type SampleSheetRecord,
} from "../../../factory/shared/sampleSheetIdentityStore";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import { recordFormActionButtonSx } from "../../../shared/buttonStyles";

export interface SampleSheetsTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?: Dispatch<SetStateAction<SampleSheetTableRow[]>> | ((rows: SampleSheetTableRow[]) => void) | undefined;
}

export function SampleSheetsTab({
  searchValue,
  canView,
  canEdit,
  onExportReady,
}: SampleSheetsTabProps) {
  const navigate = useNavigate();
  const sampleRecords = useSampleSheetRecords();
  const [journeySample, setJourneySample] = useState<SampleSheetRecord | null>(null);

  const sampleRows = useMemo<SampleSheetTableRow[]>(
    () =>
      sampleRecords.map((sample) => ({
        id: sample.sampleNo,
        sampleNo: sample.sampleNo,
        issueDate: new Date(sample.issueDate),
        itemName: sample.itemName,
        subCategory: sample.subCategory,
        color: sample.color,
        length: sample.length,
        width: sample.width,
        thickness: sample.thickness,
        availableQuantity: String(sample.availableSheets),
        processRoute: sample.processRoute,
        currentStage: sample.currentStage,
        currentStatus: sample.currentStatus,
      })),
    [sampleRecords],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) {
      return sampleRows;
    }

    return sampleRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "").toLowerCase().includes(normalizedSearch),
      ),
    );
  }, [sampleRows, searchValue]);

  useEffect(() => {
    onExportReady?.(filteredRows);
  }, [filteredRows, onExportReady]);

  const actions = useMemo<ReadonlyArray<EnterpriseTableAction<SampleSheetTableRow>>>(() => {
    const list: EnterpriseTableAction<SampleSheetTableRow>[] = [];

    if (canView) {
      list.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (row: SampleSheetTableRow) => {
          const sample = getSampleSheetByNo(row.sampleNo);
          if (sample) {
            setJourneySample(sample);
          }
        },
      });
    }

    if (canEdit) {
      list.push({
        id: "issue-for-order",
        label: "Issue for Order",
        icon: Plus,
        tone: "primary",
        onSelect: (row: SampleSheetTableRow) => {
          const sample = getSampleSheetByNo(row.sampleNo);
          if (!sample || !isSampleEligibleForOrder(sample)) {
            return;
          }

          navigate("/orders/add?type=finished", {
            state: {
              fromSampleSheet: true,
              sampleNo: sample.sampleNo,
              finishedType: resolveSampleFinishedType(sample),
              lineItemDraft: {
                itemName: sample.itemName,
                subCategory: sample.subCategory,
                color: sample.color,
                length: sample.length,
                width: sample.width,
                thickness: sample.thickness,
                quantitySheets: String(sample.availableSheets),
                finishedType: resolveSampleFinishedType(sample),
                remark: `From Sample ${sample.sampleNo}`,
              },
            },
          });
        },
      });
    }

    return list;
  }, [canView, canEdit, navigate]);

  return (
    <>
      <EnterpriseDataTable
        key="production-sample-sheets"
        actions={actions}
        columns={sampleSheetColumns}
        defaultRowsPerPage={10}
        emptyStateLabel="No sample sheets have been issued from Grouping yet."
        getRowActions={(row) =>
          actions.filter((action) => {
            if (action.id !== "issue-for-order") {
              return true;
            }
            const sample = getSampleSheetByNo(row.sampleNo);
            return Boolean(sample && isSampleEligibleForOrder(sample));
          })
        }
        initialSort={{ key: "issueDate", direction: "desc" }}
        rows={canView ? filteredRows : []}
      />

      <SampleJourneyDialog
        onClose={() => setJourneySample(null)}
        sample={journeySample}
      />
    </>
  );
}

function SampleJourneyDialog({
  onClose,
  sample,
}: {
  onClose: () => void;
  sample: SampleSheetRecord | null;
}) {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={Boolean(sample)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontWeight: 700,
          px: 2,
          py: 1.5,
        })}
      >
        Sample Journey {sample ? `· ${sample.sampleNo}` : ""}
      </DialogTitle>
      <DialogContent sx={{ px: 2, py: "16px !important" }}>
        <Stack spacing={1.25}>
          {sample?.journey.map((event, index) => (
            <Box
              key={`${event.status}-${event.at}-${index}`}
              sx={(theme) => ({
                borderLeft: `3px solid ${theme.customTokens.brand.primary}`,
                pl: 1.5,
              })}
            >
              <Typography sx={{ fontSize: 13, fontWeight: 700 }}>
                {event.status}
              </Typography>
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.secondary,
                  fontSize: 12,
                })}
              >
                {event.stage} ·{" "}
                {new Intl.DateTimeFormat("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                }).format(new Date(event.at))}
              </Typography>
            </Box>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
