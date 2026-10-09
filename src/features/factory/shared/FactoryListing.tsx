import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router";

import {
  ErpDatePickerField,
  ErpSelectField,
} from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import {
  canAccessPermission,
  getFactoryPermissionKey,
} from "../../permissions";
import {
  getOrderLineItems,
  useOrderRecords,
  type OrderLineItem,
  type OrderRecord,
} from "../../orders/shared/ordersStore";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import {
  getListingToolbarOutlinedButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  formatAmount,
  parseNumericValue,
  SQM_TO_SQF,
} from "../../shared/numberFormat";
import { FactoryPageShell } from "./FactoryPageShell";
import { FactoryToolbar } from "./FactoryToolbar";
import {
  getFactoryPaths,
  getFactoryProcessTabs,
  getFactoryRowsForTab,
  type FactoryProcessTab,
} from "./factoryUtils";
import {
  appendGroupedStockSampleIssue,
  getAvailableGroupedSheets,
  useGroupedStockSampleIssues,
} from "./groupedStockIssueStore";
import { ConfirmIssueForInspectionDialog } from "../drying/ConfirmIssueForInspectionDialog";
import { applyDryingListingColumns } from "../drying/dryingListingColumns";
import { appendCncFlutingSampleIssueActions } from "../cnc-fluting/cncFlutingSampleActions";
import { applyInspectionListingColumns } from "../inspection/inspectionListingColumns";
import { EditDryingInspectionQtyDialog } from "../inspection/EditDryingInspectionQtyDialog";
import { MoveToWarehouseBDialog } from "../inspection/MoveToWarehouseBDialog";
import {
  buildInspectionDoneRowActions,
  buildInspectionFailedRowActions,
  buildInspectionIssuedRowActions,
} from "../inspection/inspectionRowActions";
import { appendEmbossingSampleIssueActions } from "../embossing/embossingSampleActions";
import { applyMarquetryListingColumns } from "../marquetry/marquetryListingColumns";
import { withMarquetryIssuedFrom } from "../marquetry/mapMarquetryListingRow";
import { appendMarquetrySampleIssueActions } from "../marquetry/marquetrySampleActions";
import { buildFinishingDoneRowActions } from "../finishing/finishingDoneActions";
import { applyPressingIssuedForLabels } from "../pressing/pressingIssuedForLabel";
import { appendPressingSampleIssueActions } from "../pressing/pressingSampleActions";
import { appendSplicingSampleIssueActions } from "../splicing/splicingSampleActions";
import { submitSplicingOrderIssue } from "../splicing/submitSplicingOrderIssue";
import { buildGroupingDoneRowActions } from "../grouping/groupingDoneActions";
import { applyGroupingListingColumns } from "../grouping/groupingListingColumns";
import { mapGroupingListingRow } from "../grouping/mapGroupingListingRow";
import { DryingCreateDialog } from "../drying/DryingCreateDialog";
import { DryingRejectDialog } from "../drying/DryingRejectDialog";
import {
  addDryingDoneItems,
  adjustDryingDoneLeaves,
  applyDryingListingRows,
  dryingLeafArea,
  dryingLeafCount,
  revertDryingDoneToIssued,
  updateDryingIssuedLeaves,
  useDryingFlowState,
} from "../drying/dryingFrontendStore";
import { IssueForDryingDialog } from "../slicing/IssueForDryingDialog";
import { applySlicingListingColumns } from "../slicing/slicingListingColumns";
import { applySlicingListingRows, useSlicingFlowState } from "../slicing/slicingFrontendStore";
import {
  factoryIssuedWorkToRow,
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
  revertFactoryIssuedWork,
  updateFactoryIssuedWorkSnapshot,
  getFactoryIssuedWorkForListing,
  issueFactoryWork,
  resolveFactoryProcessLabel,
  useFactoryIssuedWorkItems,
} from "./factoryIssuedWorkStore";
import {
  createSampleSheetFromGrouping,
  getSampleNoFromRow,
  isSampleFactoryRow,
  issueSampleToProcess,
  useSampleSheetRecords,
  type SampleNextProcess,
} from "./sampleSheetIdentityStore";
import type { FactoryDefinition, FactoryRecord } from "./types";
import {
  buildGroupingOrderIssueSourceRow,
  createRejectFactoryAction,
  DialogFieldLabel,
  DryingInspectionIssueDialog,
  formatDialogMeasure,
  formatFactorySearchValue,
  formatInspectionDialogDate,
  getFactoryNextProcessActions,
  getFactoryRowWarehouseName,
  getFactoryString,
  getOrderLineItemSheetsNumber,
  getSplicingSelectedOrder,
  getSplicingSelectedOrderItem,
  GroupingOrderIssueDialog,
  GroupingSampleIssueDialog,
  inspectionDialogPaperSx,
  InspectionDecisionDialog,
  normalizeFactorySourceColumns,
  ReadOnlyDialogField,
  SplicingOrderIssueDialog,
  type GroupingOrderIssueState,
  type GroupingSampleIssueState,
  type SplicingOrderIssueState,
} from "./listing/factoryListingParts";
import { useSidebarWarehousesQuery } from "../../../query/useSidebarWarehousesQuery";
import { moveFactoryRowToWarehouseC } from "../../warehouses/shared/warehouseCTransferStore";
import { moveFactoryRowToWarehouseB } from "../../warehouses/shared/warehouseBTransferStore";

type ListingTab = FactoryProcessTab;

function isDryingInspectionSlug(slug: string) {
  return slug === "drying-inspection" || slug === "inspection";
}

function formatInspectionLeafQty(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === "string" && value.trim() !== "") {
    return value.trim();
  }
  return "-";
}

interface FactoryListingProps<Row extends FactoryRecord> {
  definition: FactoryDefinition<Row>;
}

export function FactoryListing<Row extends FactoryRecord>({
  definition,
}: FactoryListingProps<Row>) {
  const navigate = useNavigate();
  const orderRecords = useOrderRecords();
  const paths = getFactoryPaths(definition.slug);
  const permissionKey = getFactoryPermissionKey(definition.slug);
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const [searchParams, setSearchParams] = useSearchParams();
  const isDryingInspectionModule = isDryingInspectionSlug(definition.slug);
  const urlTab = searchParams.get("tab") as ListingTab | null;
  const [activeTabState, setActiveTabState] = useState<ListingTab>(() => urlTab || "issued");
  const requestedTab = urlTab || activeTabState;
  const activeTab =
    isDryingInspectionModule && requestedTab === "failed" ? "history" : requestedTab;

  const setActiveTab = (newTab: ListingTab) => {
    setActiveTabState(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newTab);
      return next;
    });
  };

  useEffect(() => {
    if (isDryingInspectionModule && urlTab === "failed") {
      setActiveTab("history");
    }
  }, [isDryingInspectionModule, urlTab]);

  const [searchValue, setSearchValue] = useState("");
  const [revertedRowIds, setRevertedRowIds] = useState<string[]>([]);
  const [confirmRevertRow, setConfirmRevertRow] = useState<{
    row: Row;
    type: "issued" | "rejected" | "drying-done";
  } | null>(null);
  const [confirmIssueDryingOpen, setConfirmIssueDryingOpen] = useState(false);
  const [issueDryingRows, setIssueDryingRows] = useState<Row[]>([]);
  const [confirmIssueInspectionOpen, setConfirmIssueInspectionOpen] = useState(false);
  const [rejectedDoneRows, setRejectedDoneRows] = useState<Row[]>([]);
  const [inspectionCompletedRows, setInspectionCompletedRows] = useState<Row[]>([]);
  const [inspectionFailedRows, setInspectionFailedRows] = useState<Row[]>([]);
  const [inspectionDecisionTargetRow, setInspectionDecisionTargetRow] = useState<Row | null>(null);
  const [sawingWarehouseMoveRows, setSawingWarehouseMoveRows] = useState<Row[]>([]);
  const [sawingWarehouseMoveTarget, setSawingWarehouseMoveTarget] = useState("Production Warehouse");
  const sidebarWarehousesQuery = useSidebarWarehousesQuery(
    sawingWarehouseMoveRows.length > 0,
  );
  const sawingProductionWarehouses = useMemo(() => {
    if (sawingWarehouseMoveRows.length === 0) {
      return [];
    }

    const productionNames = (sidebarWarehousesQuery.data ?? [])
      .filter((warehouse) => warehouse.warehouseType === "Production")
      .map((warehouse) => warehouse.label);

    if (
      sidebarWarehousesQuery.isError ||
      (sidebarWarehousesQuery.isFetched && productionNames.length === 0)
    ) {
      return ["Production Warehouse"];
    }

    return productionNames;
  }, [
    sawingWarehouseMoveRows.length,
    sidebarWarehousesQuery.data,
    sidebarWarehousesQuery.isError,
    sidebarWarehousesQuery.isFetched,
  ]);
  const [splicingOrderIssue, setSplicingOrderIssue] =
    useState<SplicingOrderIssueState<Row> | null>(null);
  const [groupingSampleIssue, setGroupingSampleIssue] =
    useState<GroupingSampleIssueState<Row> | null>(null);
  const [groupingOrderIssue, setGroupingOrderIssue] =
    useState<GroupingOrderIssueState<Row> | null>(null);
  const [dryingInspectionIssueRow, setDryingInspectionIssueRow] =
    useState<Row | null>(null);
  const [dryingCreateRow, setDryingCreateRow] = useState<Row | null>(null);
  const [dryingRejectRow, setDryingRejectRow] = useState<Row | null>(null);
  const [dryingDoneLeafPatches, setDryingDoneLeafPatches] = useState<Record<string, number>>({});
  const [dryingDoneRemovedIds, setDryingDoneRemovedIds] = useState<string[]>([]);
  const [dryingInspectionHistoryRows, setDryingInspectionHistoryRows] = useState<Row[]>([]);
  const [dryingInspectionEventRows, setDryingInspectionEventRows] = useState<Row[]>([]);
  const [warehouseBTransferredIds, setWarehouseBTransferredIds] = useState<string[]>([]);
  const [dryingIssueStateMap, setDryingIssueStateMap] = useState<
    Record<string, { issuedLeaves: number; availableLeaves: number; status: "Pending" | "Partially Done" | "Done" }>
  >({});
  const [warehouseBMoveRow, setWarehouseBMoveRow] = useState<Row | null>(null);
  const [dryingInspectionQtyEditRow, setDryingInspectionQtyEditRow] = useState<Row | null>(null);
  const [inspectionTrackingMap, setInspectionTrackingMap] = useState<
    Record<string, { passQty: number; failQty: number; availableLeaves: number; status: "Pending" | "Partially Pending" | "Done" }>
  >({});
  const groupedStockIssues = useGroupedStockSampleIssues();
  const sampleSheetRecords = useSampleSheetRecords();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const slicingFlowState = useSlicingFlowState();
  const dryingFlowState = useDryingFlowState();
  const isGroupingModule = definition.slug === "grouping";
  const isInspectionModule =
    definition.slug === "inspection" ||
    definition.slug === "sawing-inspection" ||
    definition.slug === "drying-inspection";
  const supportsSamplePurposeColumn =
    definition.slug === "marquetry" ||
    definition.slug === "splicing" ||
    definition.slug === "pressing" ||
    definition.slug === "cnc-fluting" ||
    definition.slug === "embossing" ||
    definition.slug === "finishing";
  const isDryingDoneTab = definition.slug === "drying" && activeTab === "done";
  const isSlicingDoneTab = definition.slug === "slicing" && activeTab === "done";
  const isSawingInspectionDoneTab = definition.slug === "sawing-inspection" && activeTab === "done";
  const isSelectableTab = isDryingDoneTab || isSlicingDoneTab || isSawingInspectionDoneTab;
  const [selectedListingRows, setSelectedListingRows] = useState<Row[]>([]);
  const isGroupingDoneTab = isGroupingModule && activeTab === "done";
  const shouldUsePressingIssuedForLabels =
    definition.slug === "pressing" &&
    (activeTab === "issued" || activeTab === "done");
  const tabs = useMemo(
    () => getFactoryProcessTabs(definition.title),
    [definition.title],
  );
  const rejectedDoneRowIds = useMemo(
    () => new Set(rejectedDoneRows.map((row) => row.id)),
    [rejectedDoneRows],
  );
  const tabRows = useMemo(() => {
    const movedSourceRowIds = new Set(
      factoryIssuedWorkItems
        .filter((item) => {
          if (item.sourceSlug === "drying") {
            const tracking = dryingIssueStateMap[item.sourceRowId];
            return tracking ? tracking.status === "Done" : false;
          }
          return item.sourceSlug === definition.slug;
        })
        .map((item) => item.sourceRowId),
    );
    const baseRowsForTab = getFactoryRowsForTab(definition.rows, activeTab).filter(
      (row) => !movedSourceRowIds.has(String(row.id)),
    );
    const rowsForTab =
      activeTab === "rejected"
        ? [...baseRowsForTab, ...rejectedDoneRows]
        : definition.slug === "drying" && activeTab === "history"
          ? [...dryingInspectionHistoryRows, ...baseRowsForTab]
        : isDryingInspectionModule && activeTab === "history"
          ? [...dryingInspectionEventRows, ...baseRowsForTab]
        : isInspectionModule && activeTab === "issued"
          ? baseRowsForTab.filter((row) => {
            const tracking = inspectionTrackingMap[String(row.id)];
            if (tracking && tracking.status === "Partially Pending") {
              return true;
            }
            return (
              !inspectionCompletedRows.some((completed) => completed.id === row.id) &&
              !inspectionFailedRows.some((failed) => failed.id === row.id)
            );
          })
          : isInspectionModule && activeTab === "done"
            ? [...baseRowsForTab, ...inspectionCompletedRows]
            : isInspectionModule && activeTab === "failed"
              ? [...baseRowsForTab, ...inspectionFailedRows]
              : baseRowsForTab;

    const issuedWorkRows = getFactoryIssuedWorkForListing(
      definition.slug,
      activeTab,
    ).map((item) => factoryIssuedWorkToRow(item) as Row);

    const mappedRows = [...issuedWorkRows, ...rowsForTab]
      .filter(
        (row) =>
          !revertedRowIds.includes(row.id) &&
          !(activeTab === "done" && rejectedDoneRowIds.has(row.id)) &&
          !(activeTab === "done" && dryingDoneRemovedIds.includes(row.id)),
      )
      .map((row) => {
        const sourceNormalizedRow = (
          definition.slug === "marquetry"
            ? withMarquetryIssuedFrom(normalizeFactorySourceColumns(row, definition.slug))
            : normalizeFactorySourceColumns(row, definition.slug)
        ) as Row;

        if (isGroupingModule) {
          return mapGroupingListingRow(sourceNormalizedRow, activeTab);
        }

        if (
          supportsSamplePurposeColumn &&
          !isSampleFactoryRow(sourceNormalizedRow)
        ) {
          return {
            ...sourceNormalizedRow,
            for:
              typeof sourceNormalizedRow.for === "string"
                ? sourceNormalizedRow.for
                : "Order",
            forLabel:
              typeof sourceNormalizedRow.forLabel === "string"
                ? sourceNormalizedRow.forLabel
                : "Order",
          } as Row;
        }

        if (isInspectionModule) {
          const rowId = String(sourceNormalizedRow.id);
          if (isDryingInspectionModule && (activeTab === "done" || activeTab === "history")) {
            const transferred = warehouseBTransferredIds.includes(rowId);
            const eventStatus = formatInspectionLeafQty(sourceNormalizedRow.inspectionEventStatus);
            return {
              ...sourceNormalizedRow,
              passQty: formatInspectionLeafQty(sourceNormalizedRow.passQty),
              failQty: formatInspectionLeafQty(sourceNormalizedRow.failQty),
              warehouseBStatus: transferred
                ? "Transferred to Warehouse B"
                : "Not transferred",
              inspectionEventStatus: activeTab === "history" ? eventStatus : sourceNormalizedRow.inspectionEventStatus,
            } as Row;
          }

          const origLeaves = Number(sourceNormalizedRow.noOfLeaves ?? sourceNormalizedRow.totalLeaves ?? sourceNormalizedRow.noOfSheets ?? 0) || 0;
          const tracking = inspectionTrackingMap[rowId];
          const availableLeaves = tracking ? tracking.availableLeaves : origLeaves;
          const inspStatus = tracking ? tracking.status : "Pending";

          const defaultStatus =
            activeTab === "done"
              ? "Pass"
              : activeTab === "failed"
                ? "Fail"
                : sourceNormalizedRow.isRecheck || sourceNormalizedRow.qcStatus === "Recheck"
                  ? "Recheck"
                  : inspStatus;
          const sawingSubCategory =
            definition.slug === "sawing-inspection"
              ? sourceNormalizedRow.subCategory || sourceNormalizedRow.itemSubCategory
              : undefined;
          const sawingDate =
            definition.slug === "sawing-inspection"
              ? sourceNormalizedRow.sawingDate || sourceNormalizedRow.processDate
              : undefined;
          return {
            ...sourceNormalizedRow,
            qcStatus: sourceNormalizedRow.qcStatus ?? defaultStatus,
            status: activeTab === "issued" ? inspStatus : (sourceNormalizedRow.status ?? defaultStatus),
            availableLeaves: String(availableLeaves),
            ...(definition.slug === "sawing-inspection"
              ? {
                  subCategory: sawingSubCategory,
                  itemSubCategory: sawingSubCategory,
                  sawingDate,
                }
              : {}),
          } as Row;
        }

        if (definition.slug === "drying" && activeTab === "done") {
          const rowId = String(sourceNormalizedRow.id);
          const origLeaves = Number(sourceNormalizedRow.noOfLeaves ?? sourceNormalizedRow.noOfSheets ?? 0) || 0;
          const tracking = dryingIssueStateMap[rowId];
          const issuedLeaves = tracking ? tracking.issuedLeaves : 0;
          const patchedLeaves = dryingDoneLeafPatches[rowId];
          const availableLeaves =
            patchedLeaves !== undefined
              ? patchedLeaves
              : tracking
                ? tracking.availableLeaves
                : origLeaves;
          const status = tracking ? tracking.status : "Pending";

          return {
            ...sourceNormalizedRow,
            status,
            issueForInspection: issuedLeaves > 0 ? String(issuedLeaves) : "-",
            availableLeaves: String(availableLeaves),
          } as Row;
        }

        return sourceNormalizedRow;
      });

    if (definition.slug === "slicing") {
      return applySlicingListingRows(mappedRows, activeTab, slicingFlowState);
    }

    if (definition.slug === "drying") {
      return applyDryingListingRows(mappedRows, activeTab, dryingFlowState);
    }

    return mappedRows;
  }, [
    activeTab,
    definition.rows,
    definition.slug,
    dryingDoneLeafPatches,
    dryingDoneRemovedIds,
    dryingFlowState,
    dryingInspectionEventRows,
    dryingInspectionHistoryRows,
    dryingIssueStateMap,
    factoryIssuedWorkItems,
    slicingFlowState,
    groupedStockIssues,
    isGroupingDoneTab,
    inspectionCompletedRows,
    inspectionFailedRows,
    inspectionTrackingMap,
    isDryingInspectionModule,
    isInspectionModule,
    rejectedDoneRowIds,
    rejectedDoneRows,
    revertedRowIds,
    sampleSheetRecords,
    supportsSamplePurposeColumn,
    warehouseBTransferredIds,
  ]);
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return tabRows;
    }

    return tabRows.filter((row) =>
      Object.values(row).some((value) =>
        formatFactorySearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [searchValue, tabRows]);
  const tableColumns = useMemo<readonly EnterpriseTableColumn<Row>[]>(() => {
    const withOptionalColumn = (
      columns: readonly EnterpriseTableColumn<Row>[],
      column: EnterpriseTableColumn<Row>,
      beforeKey = "remark",
    ) => {
      const insertAt = columns.findIndex((entry) => entry.key === beforeKey);

      if (insertAt === -1) {
        return [...columns, column];
      }

      return [
        ...columns.slice(0, insertAt),
        column,
        ...columns.slice(insertAt),
      ];
    };

    let columns = definition.listColumns;

    if (definition.slug === "marquetry") {
      columns = applyMarquetryListingColumns(columns, activeTab);
    }

    if (definition.slug === "grouping") {
      return applyGroupingListingColumns(columns, activeTab);
    }

    if (
      supportsSamplePurposeColumn &&
      !(definition.slug === "marquetry" && activeTab === "issued")
    ) {
      columns = withOptionalColumn(
        columns,
        {
          key: "for",
          label: "For",
        },
        "itemName",
      );
    }

    if (isInspectionModule) {
      return applyInspectionListingColumns(columns, definition.slug, activeTab);
    }

    if (definition.slug === "slicing") {
      return applySlicingListingColumns(columns, activeTab);
    }

    if (definition.slug === "drying") {
      return applyDryingListingColumns(columns, activeTab);
    }

    return columns;
  }, [
    activeTab,
    definition.listColumns,
    definition.slug,
    isDryingDoneTab,
    isGroupingDoneTab,
    isGroupingModule,
    isInspectionModule,
    supportsSamplePurposeColumn,
  ]);
  const tableRows = useMemo<readonly Row[]>(() => {
    if (shouldUsePressingIssuedForLabels) {
      return applyPressingIssuedForLabels(filteredRows);
    }

    return filteredRows;
  }, [
    filteredRows,
    shouldUsePressingIssuedForLabels,
  ]);

  const rowActions = useMemo<ReadonlyArray<EnterpriseTableAction<Row>>>(
    () => {
      const baseActions: EnterpriseTableAction<Row>[] = [
        ...(canView
          ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: Row) => navigate(paths.view(row.id), { state: { record: row, tab: activeTab } }),
            },
          ]
          : []),
        ...(canEdit &&
          activeTab !== "issued" &&
          activeTab !== "rejected" &&
          !(
            (definition.slug === "slicing" ||
              definition.slug === "grouping" ||
              definition.slug === "splicing") &&
            activeTab === "history"
          )
          ? [
            {
              id: "edit",
              label: "Edit",
              icon: Pencil,
              onSelect: (row: Row) => navigate(paths.edit(row.id)),
            },
          ]
          : []),
      ];

      if (
        activeTab === "issued" &&
        canCreate &&
        !isInspectionModule &&
        definition.slug !== "marquetry"
      ) {
        baseActions.unshift({
          id: "create-process",
          label: `Create ${definition.title}`,
          icon: Plus,
          tone: "primary",
          onSelect: (row) => {
            if (definition.slug === "drying") {
              setDryingCreateRow(row);
              return;
            }

            navigate(paths.add, {
              state: {
                sourceRow: row,
                workItemId:
                  typeof row.workItemId === "string"
                    ? row.workItemId
                    : row.id.startsWith("factory-work-")
                      ? row.id
                      : undefined,
                sampleNo: getSampleNoFromRow(row) ?? undefined,
                issuedFromSample: isSampleFactoryRow(row) || undefined,
              },
            });
          },
        });
        baseActions.push({
          id: "revert-item",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (row) => setConfirmRevertRow({ row, type: "issued" }),
        });
      }

      if (
        activeTab === "rejected" &&
        (canEdit || canCreate) &&
        (definition.slug === "slicing" || definition.slug === "drying")
      ) {
        baseActions.push({
          id: "revert-rejected",
          label: "Revert",
          icon: RotateCcw,
          tone: "danger",
          onSelect: (row) => setConfirmRevertRow({ row, type: "rejected" }),
        });
      }

      return baseActions;
    },
    [activeTab, canCreate, canEdit, canView, definition.slug, definition.title, navigate, paths],
  );

  const getRowActions = useMemo<
    ((row: Row) => readonly EnterpriseTableAction<Row>[]) | undefined
  >(() => {
    const rejectDoneAction = createRejectFactoryAction<Row>(
      definition.title,
      (selectedRow) => {
        setRejectedDoneRows((current) =>
          current.some((row) => row.id === selectedRow.id)
            ? current
            : [
              ...current,
              {
                ...selectedRow,
                listingState: "rejected",
              } as Row,
            ],
        );
        setActiveTab("rejected");
      },
    );
    const doneActions = canEdit || canCreate ? [...rowActions, rejectDoneAction] : rowActions;

    if (isDryingDoneTab) {
      const canRevertDryingDone = (selectedRow: Row) => {
        const rowId = String(selectedRow.id);
        const issuedLeaves = dryingIssueStateMap[rowId]?.issuedLeaves ?? 0;
        if (issuedLeaves > 0) return false;

        const listedIssued = Number(String(selectedRow.issueForInspection ?? "").replace(/[^\d.]/g, ""));
        if (Number.isFinite(listedIssued) && listedIssued > 0) return false;

        const originalLeaves =
          Number(String(selectedRow.noOfLeaves ?? selectedRow.totalLeaves ?? selectedRow.noOfSheets ?? "").replace(/[^\d.]/g, "")) || 0;
        const patchedLeaves = dryingDoneLeafPatches[rowId];
        const availableLeaves =
          patchedLeaves !== undefined
            ? patchedLeaves
            : Number(String(selectedRow.availableLeaves ?? originalLeaves).replace(/[^\d.]/g, "")) || 0;

        return !(originalLeaves > 0 && availableLeaves < originalLeaves);
      };

      return (row) => {
        return [
          ...rowActions,
          ...(canEdit || canCreate
            ? [
              {
                id: "reject-drying",
                label: `Reject ${definition.title}`,
                icon: XCircle,
                tone: "danger" as const,
                onSelect: (selectedRow: Row) => {
                  setDryingRejectRow(selectedRow);
                },
              },
            ]
            : []),
          ...(canCreate
            ? [
              {
                id: "issue-for-inspection",
                label: "Issue for Inspection",
                icon: Plus,
                tone: "primary" as const,
                onSelect: (selectedRow: Row) => {
                  setDryingInspectionIssueRow(selectedRow);
                },
              },
            ]
            : []),
          ...((canEdit || canCreate) && canRevertDryingDone(row)
            ? [
              {
                id: "revert-drying-done",
                label: "Revert",
                icon: RotateCcw,
                tone: "danger" as const,
                onSelect: (selectedRow: Row) => {
                  setConfirmRevertRow({ row: selectedRow, type: "drying-done" });
                },
              },
            ]
            : []),
        ];
      };
    }

    const openInspectionRecord = (selectedRow: Row) =>
      navigate(paths.view(selectedRow.id), { state: { record: selectedRow, tab: activeTab } });

    if (isInspectionModule && activeTab === "issued") {
      return buildInspectionIssuedRowActions<Row>({
        canCreate,
        canEdit,
        canView,
        onInspect: setInspectionDecisionTargetRow,
        onView: openInspectionRecord,
      });
    }

    if (isDryingInspectionModule && activeTab === "history") {
      return () =>
        canView
          ? [
              {
                id: "view",
                label: "View",
                icon: Eye,
                onSelect: openInspectionRecord,
              },
            ]
          : [];
    }

    if (isInspectionModule && activeTab === "done") {
      const isSawingInspection = definition.slug === "sawing-inspection";
      return buildInspectionDoneRowActions<Row>({
        canCreate,
        canEdit,
        canView,
        isSawingInspection,
        ...(isSawingInspection ? {} : { onEdit: setDryingInspectionQtyEditRow }),
        onMoveToWarehouseB: setWarehouseBMoveRow,
        onMoveToWarehouseC: (selectedRow) => {
          setSawingWarehouseMoveTarget("Production Warehouse");
          setSawingWarehouseMoveRows([selectedRow]);
        },
        onRevert: (selectedRow) => {
          const workItemId = getFactoryString(selectedRow.workItemId);
          if (workItemId) {
            revertFactoryIssuedWork(workItemId);
          }
          setInspectionCompletedRows((current) =>
            current.filter((entry) => entry.id !== selectedRow.id),
          );
          (definition.rows as any) = (definition.rows as any).map((row: any) =>
            row.id === selectedRow.id
              ? { ...row, listingState: "issued", qcStatus: "Recheck", isRecheck: true }
              : row,
          );
          setActiveTab("issued");
        },
        onView: openInspectionRecord,
      });
    }

    if (isInspectionModule && activeTab === "failed") {
      const isSawingInspection = definition.slug === "sawing-inspection";
      return buildInspectionFailedRowActions<Row>({
        canCreate,
        canEdit,
        canView,
        isSawingInspection,
        onRevert: (selectedRow) => {
          setInspectionFailedRows((current) =>
            current.filter((entry) => entry.id !== selectedRow.id),
          );
          setInspectionCompletedRows((current) =>
            current.filter((entry) => entry.id !== selectedRow.id),
          );
          (definition.rows as any) = (definition.rows as any).map((row: any) =>
            row.id === selectedRow.id
              ? { ...row, listingState: "issued", qcStatus: "Recheck", isRecheck: true }
              : row,
          );
          setActiveTab("issued");
        },
        onView: openInspectionRecord,
      });
    }

    if (definition.slug === "finishing" && activeTab === "done") {
      return buildFinishingDoneRowActions<Row>({
        canCreate,
        canEdit,
        canView,
        onOrderIssue: (selectedRow) =>
          setSplicingOrderIssue({
            issueDate: new Date(),
            issueSheets: "",
            orderItemNo: "",
            orderNo: "",
            orderType: "",
            row: selectedRow,
            submitted: false,
          }),
        onRevert: (selectedRow) =>
          setRevertedRowIds((current) =>
            current.includes(selectedRow.id) ? current : [...current, selectedRow.id],
          ),
        onView: (selectedRow) => navigate(paths.view(selectedRow.id)),
        rejectDoneAction,
        rowActions,
      });
    }

    if (isGroupingDoneTab) {
      return buildGroupingDoneRowActions<Row>({
        canCreate,
        canView,
        onOrderIssue: (selectedRow) =>
          setGroupingOrderIssue({
            issueDate: new Date(),
            issueSheets: "",
            orderItemNo: "",
            orderNo: "",
            orderType: "",
            row: selectedRow,
            submitted: false,
          }),
        onSampleIssue: (selectedRow) =>
          setGroupingSampleIssue({
            issueDate: new Date(),
            issueSheets: "",
            nextProcess: "",
            remark: "",
            row: selectedRow,
            submitted: false,
          }),
        onView: (selectedRow) => navigate(paths.view(selectedRow.id)),
      });
    }

    if (activeTab !== "done") {
      return undefined;
    }

    return (row) => {
      if (isSampleFactoryRow(row)) {
        const sampleActions: EnterpriseTableAction<Row>[] = [];

        if (canView) {
          sampleActions.push({
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: (selectedRow: Row) => navigate(paths.view(selectedRow.id)),
          });
        }

        if (canCreate && definition.slug === "marquetry") {
          return appendMarquetrySampleIssueActions(sampleActions, definition.slug);
        }

        if (canCreate && definition.slug === "splicing") {
          return appendSplicingSampleIssueActions(sampleActions, definition.slug);
        }

        if (canCreate && definition.slug === "cnc-fluting") {
          return appendCncFlutingSampleIssueActions(sampleActions, definition.slug);
        }

        if (canCreate && definition.slug === "embossing") {
          return appendEmbossingSampleIssueActions(sampleActions, definition.slug);
        }

        if (canCreate && definition.slug === "pressing") {
          return appendPressingSampleIssueActions(sampleActions);
        }

        return sampleActions.length > 0 ? sampleActions : doneActions;
      }

      const nextProcessActions = getFactoryNextProcessActions(
        row,
        definition.slug,
        (selectedRow) =>
          setSplicingOrderIssue({
            issueDate: new Date(),
            issueSheets: "",
            orderItemNo: "",
            orderNo: "",
            orderType: "",
            row: selectedRow,
            submitted: false,
          }),
      ).map((action) =>
        definition.slug === "slicing" && action.id === "issue-for-drying"
          ? {
              ...action,
              onSelect: (selectedRow: Row) => {
                setIssueDryingRows([selectedRow]);
                setConfirmIssueDryingOpen(true);
              },
            }
          : action,
      );

      if (nextProcessActions.length === 0) {
        return doneActions;
      }

      return [...doneActions, ...nextProcessActions];
    };
  }, [
    activeTab,
    canCreate,
    canEdit,
    canView,
    definition.slug,
    definition.title,
    dryingDoneLeafPatches,
    dryingIssueStateMap,
    inspectionCompletedRows,
    isDryingInspectionModule,
    isInspectionModule,
    isDryingDoneTab,
    isGroupingDoneTab,
    navigate,
    paths,
    rowActions,
  ]);

  const handleCloseGroupingSampleIssue = () => {
    setGroupingSampleIssue(null);
  };
  const handleSubmitGroupingSampleIssue = () => {
    if (!groupingSampleIssue) {
      return;
    }

    const availableSheets = getAvailableGroupedSheets(groupingSampleIssue.row);
    const issueSheets = Number(groupingSampleIssue.issueSheets);
    const nextProcess = groupingSampleIssue.nextProcess as SampleNextProcess;
    const hasValidIssueSheets =
      groupingSampleIssue.issueSheets.length > 0 &&
      Number.isInteger(issueSheets) &&
      issueSheets > 0 &&
      issueSheets <= availableSheets;
    const hasValidNextProcess = nextProcess === "Splicing";

    if (!hasValidIssueSheets || !hasValidNextProcess) {
      setGroupingSampleIssue((current) =>
        current ? { ...current, submitted: true } : current,
      );
      return;
    }

    appendGroupedStockSampleIssue({
      groupingRowId: String(groupingSampleIssue.row.id),
      issueDate: groupingSampleIssue.issueDate,
      issueSheets,
      purpose: "sample-sheet",
      sourceRow: groupingSampleIssue.row,
    });

    const sample = createSampleSheetFromGrouping({
      groupingRow: groupingSampleIssue.row,
      issueDate: groupingSampleIssue.issueDate,
      issueSheets,
      nextProcess,
      remark: groupingSampleIssue.remark,
    });

    issueFactoryWork({
      destinationProcess: nextProcess,
      purpose: "SAMPLE",
      sampleNo: sample.sampleNo,
      sourceProcess: "Grouping",
      sourceWarehouseName: getFactoryRowWarehouseName(groupingSampleIssue.row),
      sourceRow: {
        ...groupingSampleIssue.row,
        warehouseName: getFactoryRowWarehouseName(groupingSampleIssue.row),
        issuedFrom: "Grouping",
        sampleNo: sample.sampleNo,
        purpose: "SAMPLE",
        for: "Sample",
        forLabel: "Sample",
        noOfSheets: String(issueSheets),
        remark: groupingSampleIssue.remark || `Sample ${sample.sampleNo}`,
      },
      sourceSlug: "grouping",
    });

    setGroupingSampleIssue(null);
  };
  const handleCloseGroupingOrderIssue = () => {
    setGroupingOrderIssue(null);
  };
  const handleSubmitGroupingOrderIssue = () => {
    if (!groupingOrderIssue) {
      return;
    }

    const selectedOrder = getSplicingSelectedOrder(
      orderRecords,
      groupingOrderIssue.orderNo,
    );
    const selectedOrderItem = getSplicingSelectedOrderItem(
      orderRecords,
      groupingOrderIssue,
    );
    const availableGroupedSheets = getAvailableGroupedSheets(
      groupingOrderIssue.row,
    );
    const orderSheets = selectedOrderItem
      ? getOrderLineItemSheetsNumber(selectedOrderItem)
      : 0;
    const maxIssuable = Math.min(availableGroupedSheets, orderSheets);
    const issueSheets = Number(groupingOrderIssue.issueSheets);
    const hasValidIssueSheets =
      groupingOrderIssue.issueSheets.length > 0 &&
      Boolean(groupingOrderIssue.orderType) &&
      Boolean(groupingOrderIssue.orderNo) &&
      Boolean(groupingOrderIssue.orderItemNo) &&
      Number.isInteger(issueSheets) &&
      issueSheets > 0 &&
      issueSheets <= maxIssuable;

    if (!hasValidIssueSheets) {
      setGroupingOrderIssue((current) =>
        current ? { ...current, submitted: true } : current,
      );
      return;
    }

    appendGroupedStockSampleIssue({
      groupingRowId: String(groupingOrderIssue.row.id),
      issueDate: groupingOrderIssue.issueDate,
      issueSheets,
      orderItemNo: groupingOrderIssue.orderItemNo,
      orderNo: groupingOrderIssue.orderNo,
      orderType: groupingOrderIssue.orderType,
      purpose: "order",
      sourceRow: groupingOrderIssue.row,
    });

    const sourceRow = selectedOrderItem
      ? buildGroupingOrderIssueSourceRow(
        groupingOrderIssue,
        selectedOrder,
        selectedOrderItem,
      )
      : ({
        ...groupingOrderIssue.row,
        orderNo: groupingOrderIssue.orderNo,
        orderItemNo: groupingOrderIssue.orderItemNo,
        noOfSheets: String(issueSheets),
      } as Row);

    issueFactoryWork({
      destinationProcess: "Splicing",
      purpose: "ORDER",
      orderNo: groupingOrderIssue.orderNo,
      orderItemNo: groupingOrderIssue.orderItemNo,
      sourceRow,
      sourceSlug: "grouping",
      sourceProcess: "Grouping",
      sourceWarehouseName: getFactoryRowWarehouseName(sourceRow),
    });

    setGroupingOrderIssue(null);
  };
  const handleCloseSplicingOrderIssue = () => {
    setSplicingOrderIssue(null);
  };
  const handleSubmitSplicingOrderIssue = () => {
    if (!splicingOrderIssue) {
      return;
    }

    const result = submitSplicingOrderIssue({
      orderRecords,
      sourceProcess: definition.title,
      sourceSlug: definition.slug,
      state: splicingOrderIssue,
    });

    if (result === "invalid") {
      setSplicingOrderIssue((current) =>
        current ? { ...current, submitted: true } : current,
      );
      return;
    }

    setSplicingOrderIssue(null);
  };

  useEffect(() => {
    if (sawingProductionWarehouses.length === 0) return;
    const preferred =
      sawingProductionWarehouses.find(
        (name) => name.trim().toLowerCase() === "production warehouse",
      ) ??
      sawingProductionWarehouses[0] ??
      "Production Warehouse";
    setSawingWarehouseMoveTarget(preferred);
  }, [sawingProductionWarehouses]);

  const closeSawingWarehouseMove = () => {
    setSawingWarehouseMoveRows([]);
  };

  const confirmSawingWarehouseMove = () => {
    const movedIds = sawingWarehouseMoveRows.map((row) => row.id);
    sawingWarehouseMoveRows.forEach((selectedRow) => {
      moveFactoryRowToWarehouseC({
        ...(selectedRow as unknown as Record<string, unknown>),
        destinationWarehouse: sawingWarehouseMoveTarget,
        warehouseName: sawingWarehouseMoveTarget,
      });
    });
    setRevertedRowIds((current) => [
      ...current,
      ...movedIds.filter((id) => !current.includes(id)),
    ]);
    setSelectedListingRows((current) =>
      current.filter((row) => !movedIds.includes(row.id)),
    );
    setSawingWarehouseMoveRows([]);
  };

  return (
    <>
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title },
        ]}
        processTabs={
          <ModuleProcessTabs
            onChange={(value) => setActiveTab(value as ListingTab)}
            tabs={tabs}
            value={activeTab}
          />
        }
        title={definition.title}
        subtitle={``}
      >
        <Stack
          sx={(currentTheme) => ({
            gap: currentTheme.spacing(2),
          })}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            alignItems={{ xs: "stretch", sm: "center" }}
            justifyContent="space-between"
            spacing={2}
          >
            <ClearableSearchField
              value={searchValue}
              onChange={setSearchValue}
              placeholder={`Search ${definition.title.toLowerCase()}...`}
              sx={{
                width: { xs: "100%", sm: 320 },
                maxWidth: "100%",
              }}
            />

            {isSelectableTab && selectedListingRows.length > 0 ? (
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Typography variant="body2" color="text.secondary">
                  {selectedListingRows.length} item(s) selected
                </Typography>
                {isDryingDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => setConfirmIssueInspectionOpen(true)}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue for Inspection
                  </Button>
                ) : null}
                {isSlicingDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => {
                      setIssueDryingRows(selectedListingRows);
                      setConfirmIssueDryingOpen(true);
                    }}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue for Drying
                  </Button>
                ) : null}
                {isSawingInspectionDoneTab && (canCreate || canEdit) ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => {
                      setSawingWarehouseMoveTarget("Production Warehouse");
                      setSawingWarehouseMoveRows(selectedListingRows);
                    }}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Move to Warehouse C ({selectedListingRows.length})
                  </Button>
                ) : null}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.25} alignItems="center">
                {definition.slug === "marquetry" && activeTab === "issued" && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<Plus size={15} />}
                    onClick={() => navigate(paths.add)}
                    sx={(theme) => ({
                      ...getListingToolbarOutlinedButtonSx(theme),
                      backgroundColor: theme.palette.primary.main,
                      color: theme.palette.primary.contrastText,
                    })}
                  >
                    Add
                  </Button>
                ) : null}
                <FactoryToolbar />
              </Stack>
            )}
          </Stack>

          <EnterpriseDataTable
            key={`${definition.slug}-${activeTab}`}
            actions={rowActions}
            columns={tableColumns}
            defaultRowsPerPage={10}
            emptyStateLabel={`No ${definition.title.toLowerCase()} records are available for this tab.`}
            rows={canView ? tableRows : []}
            selectable={isSelectableTab}
            {...(isSelectableTab ? { onSelectionChange: setSelectedListingRows } : {})}
            {...(getRowActions ? { getRowActions } : {})}
            {...(definition.initialSort
              ? { initialSort: definition.initialSort }
              : {})}
          />
        </Stack>
      </FactoryPageShell>

      <SplicingOrderIssueDialog
        onChange={setSplicingOrderIssue}
        onClose={handleCloseSplicingOrderIssue}
        onSubmit={handleSubmitSplicingOrderIssue}
        orderRecords={orderRecords}
        state={splicingOrderIssue}
      />

      <GroupingSampleIssueDialog
        onChange={setGroupingSampleIssue}
        onClose={handleCloseGroupingSampleIssue}
        onSubmit={handleSubmitGroupingSampleIssue}
        state={groupingSampleIssue}
      />

      <GroupingOrderIssueDialog
        onChange={setGroupingOrderIssue}
        onClose={handleCloseGroupingOrderIssue}
        onSubmit={handleSubmitGroupingOrderIssue}
        orderRecords={orderRecords}
        state={groupingOrderIssue}
      />

      <Dialog
        fullWidth
        maxWidth="sm"
        onClose={closeSawingWarehouseMove}
        open={sawingWarehouseMoveRows.length > 0}
        slotProps={{
          paper: {
            sx: inspectionDialogPaperSx,
          },
        }}
      >
        <DialogTitle
          sx={(theme) => ({
            borderBottom: `1px solid ${theme.customTokens.borders.default}`,
            fontSize: theme.typography.h3.fontSize,
            fontWeight: 700,
            px: theme.spacing(2),
            py: theme.spacing(1.5),
          })}
        >
          Move to Warehouse
        </DialogTitle>
        <DialogContent
          sx={(theme) => ({
            px: theme.spacing(2),
            py: `${theme.spacing(2)} !important`,
          })}
        >
          <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.secondary,
                fontSize: theme.typography.body2.fontSize,
              })}
            >
              Confirm moving {sawingWarehouseMoveRows.length} item
              {sawingWarehouseMoveRows.length === 1 ? "" : "s"} to the selected warehouse.
            </Typography>
            <Stack spacing={0.75}>
              <DialogFieldLabel>Warehouse</DialogFieldLabel>
              <ErpSelectField
                onChange={setSawingWarehouseMoveTarget}
                options={sawingProductionWarehouses}
                size="dense"
                state={sawingProductionWarehouses.length === 0 ? "disabled" : "default"}
                value={sawingWarehouseMoveTarget}
              />
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions
          sx={(theme) => ({
            borderTop: `1px solid ${theme.customTokens.borders.default}`,
            gap: theme.spacing(1),
            px: theme.spacing(2),
            py: theme.spacing(1.5),
          })}
        >
          <Button onClick={closeSawingWarehouseMove} sx={recordFormActionButtonSx} variant="outlined">
            Cancel
          </Button>
          <Box sx={{ flex: 1 }} />
          <Button
            disabled={!sawingWarehouseMoveTarget || sawingProductionWarehouses.length === 0}
            onClick={confirmSawingWarehouseMove}
            sx={recordFormActionButtonSx}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <MoveToWarehouseBDialog
        onClose={() => setWarehouseBMoveRow(null)}
        onConfirm={(warehouse) => {
          if (!warehouseBMoveRow) return;
          const movedRow = warehouseBMoveRow;
          moveFactoryRowToWarehouseB({
            ...(movedRow as unknown as Record<string, unknown>),
            storageWarehouseId: warehouse.id,
            storageWarehouseName: warehouse.name,
            warehouseName: warehouse.name,
          });
          setWarehouseBTransferredIds((current) =>
            current.includes(movedRow.id) ? current : [...current, movedRow.id],
          );
          if (!warehouseBTransferredIds.includes(movedRow.id)) {
            setDryingInspectionEventRows((current) => [
              {
                ...movedRow,
                id: `drying-insp-history-move-${Date.now()}-${movedRow.id}`,
                listingState: "history",
                inspectionEventStatus: "Transferred to Warehouse B",
                warehouseBStatus: "Transferred to Warehouse B",
                passQty: formatInspectionLeafQty(movedRow.passQty),
                failQty: formatInspectionLeafQty(movedRow.failQty),
                issueDate: new Date().toISOString().slice(0, 10),
              } as Row,
              ...current,
            ]);
          }
          setWarehouseBMoveRow(null);
        }}
        row={warehouseBMoveRow}
      />

      <EditDryingInspectionQtyDialog
        open={Boolean(dryingInspectionQtyEditRow)}
        row={dryingInspectionQtyEditRow}
        onClose={() => setDryingInspectionQtyEditRow(null)}
        onSave={(targetRow, quantities) => {
          const patch = {
            passQty: String(quantities.passQty),
            failQty: String(quantities.failQty),
          };
          const workItemId = getFactoryString(targetRow.workItemId);
          if (workItemId) {
            updateFactoryIssuedWorkSnapshot(workItemId, patch);
          }
          setInspectionCompletedRows((current) =>
            current.map((entry) =>
              entry.id === targetRow.id ? { ...entry, ...patch } : entry,
            ),
          );
          setInspectionTrackingMap((current) => {
            const rowId = String(targetRow.id);
            const existing = current[rowId];
            if (!existing) return current;
            return {
              ...current,
              [rowId]: {
                ...existing,
                passQty: quantities.passQty,
                failQty: quantities.failQty,
              },
            };
          });
          (definition.rows as any) = definition.rows.map((entry) =>
            entry.id === targetRow.id ? { ...entry, ...patch } : entry,
          );
          setDryingInspectionQtyEditRow(null);
        }}
      />

      <InspectionDecisionDialog
        open={Boolean(inspectionDecisionTargetRow)}
        row={inspectionDecisionTargetRow}
        processSlug={definition.slug}
        passCount={
          isInspectionModule
            ? getFactoryIssuedWorkForListing(definition.slug, "done").length + inspectionCompletedRows.length
            : 0
        }
        failCount={
          isInspectionModule
            ? getFactoryIssuedWorkForListing(definition.slug, "failed").length + inspectionFailedRows.length
            : 0
        }
        onClose={() => setInspectionDecisionTargetRow(null)}
        onPass={(targetRow, decisionRemark, inspectionDateVal, counts) => {
          if (isDryingInspectionModule) {
            const rowId = String(targetRow.id);
            const currentTotal =
              Number(targetRow.noOfLeaves ?? targetRow.totalLeaves ?? targetRow.noOfSheets ?? 0) || 0;
            const tracking = inspectionTrackingMap[rowId];
            const prevPass = tracking?.passQty ?? 0;
            const prevFail = tracking?.failQty ?? 0;
            const thisPass = counts?.passQty ?? currentTotal;
            const thisFail = counts?.failQty ?? 0;
            const totalPass = prevPass + thisPass;
            const totalFail = prevFail + thisFail;
            const remaining = Math.max(0, currentTotal - (thisPass + thisFail));
            const isFullyDone = remaining <= 0;
            const newStatus: "Pending" | "Partially Pending" | "Done" = isFullyDone
              ? "Done"
              : "Partially Pending";
            const inspectionDate = inspectionDateVal || new Date().toISOString().slice(0, 10);
            const enteredRemark =
              decisionRemark || getFactoryString(targetRow.remark) || "Inspection completed";
            const inspectedLeaves = thisPass + thisFail;
            const donePatch = {
              inspectionDate,
              remark: enteredRemark,
              passQty: String(thisPass),
              failQty: String(thisFail),
              noOfLeaves: String(inspectedLeaves),
              totalLeaves: String(inspectedLeaves),
              warehouseBStatus: "Not transferred",
              qcStatus: "Done",
            };

            setInspectionTrackingMap((prev) => ({
              ...prev,
              [rowId]: {
                passQty: totalPass,
                failQty: totalFail,
                availableLeaves: remaining,
                status: newStatus,
              },
            }));

            const workItemId = getFactoryString(targetRow.workItemId);
            if (workItemId && isFullyDone) {
              completeFactoryIssuedWork(workItemId, { ...donePatch, listingState: "done" });
            } else {
              setInspectionCompletedRows((current) => [
                ...current,
                {
                  ...targetRow,
                  ...donePatch,
                  id: isFullyDone ? targetRow.id : `insp-done-${Date.now()}-${targetRow.id}`,
                  listingState: "done",
                } as Row,
              ]);
            }

            setDryingInspectionEventRows((current) => [
              {
                ...targetRow,
                ...donePatch,
                id: `drying-insp-history-${Date.now()}-${targetRow.id}`,
                listingState: "history",
                issueDate: inspectionDate,
                inspectionEventStatus: "Inspection completed",
              } as Row,
              ...current,
            ]);

            setInspectionDecisionTargetRow(null);
            if (isFullyDone) {
              setActiveTab("done");
            }
            return;
          }

          const rowId = String(targetRow.id);
          const currentTotal = Number(targetRow.noOfLeaves ?? targetRow.totalLeaves ?? targetRow.noOfSheets ?? 0) || 0;
          const tracking = inspectionTrackingMap[rowId];
          const prevPass = tracking?.passQty ?? 0;
          const prevFail = tracking?.failQty ?? 0;

          const thisPass = counts?.passQty ?? currentTotal;
          const thisFail = counts?.failQty ?? 0;

          const totalPass = prevPass + thisPass;
          const totalFail = prevFail + thisFail;
          const remaining = Math.max(0, currentTotal - (thisPass + thisFail));
          const isFullyDone = remaining <= 0;
          const newStatus: "Pending" | "Partially Pending" | "Done" = isFullyDone ? "Done" : "Partially Pending";

          setInspectionTrackingMap((prev) => ({
            ...prev,
            [rowId]: {
              passQty: totalPass,
              failQty: totalFail,
              availableLeaves: remaining,
              status: newStatus,
            },
          }));

          const workItemId = getFactoryString(targetRow.workItemId);
          const enteredRemark = decisionRemark || getFactoryString(targetRow.remark);
          const basePatch = {
            inspectionDate: inspectionDateVal || new Date().toISOString().slice(0, 10),
            remark: enteredRemark || (thisPass > 0 ? "Passed inspection" : "Failed inspection"),
            passQty: thisPass,
            failQty: thisFail,
            noOfLeaves: String(thisPass),
            totalLeaves: String(thisPass),
          };
          const closesIssuedWithBoth = Boolean(workItemId && isFullyDone && thisPass > 0 && thisFail > 0);

          if (thisPass > 0) {
            const passRecord = {
              ...targetRow,
              ...basePatch,
              id: isFullyDone && !thisFail ? targetRow.id : `insp-pass-${Date.now()}-${targetRow.id}`,
              qcStatus: "Pass",
              listingState: "done",
            };
            if (workItemId && isFullyDone && !thisFail) {
              completeFactoryIssuedWork(workItemId, { ...basePatch, qcStatus: "Pass" });
            } else if (!closesIssuedWithBoth) {
              setInspectionCompletedRows((current) => [...current, passRecord]);
            }
          }

          if (thisFail > 0) {
            const failRecord = {
              ...targetRow,
              ...basePatch,
              id: `insp-fail-${Date.now()}-${targetRow.id}`,
              qcStatus: "Fail",
              remark: enteredRemark || "Failed inspection",
              noOfLeaves: String(thisFail),
              totalLeaves: String(thisFail),
              listingState: "failed",
            };
            if (workItemId && isFullyDone && !thisPass) {
              failFactoryIssuedWork(workItemId, { ...basePatch, qcStatus: "Fail" });
            } else {
              setInspectionFailedRows((current) => [...current, failRecord]);
            }
          }

          if (isFullyDone && workItemId && thisPass > 0 && thisFail > 0) {
            completeFactoryIssuedWork(workItemId, { ...basePatch, qcStatus: "Pass" });
          }

          setInspectionDecisionTargetRow(null);
          if (isFullyDone) {
            setActiveTab(thisPass > 0 ? "done" : "failed");
          }
        }}
        onFail={(targetRow, decisionRemark, inspectionDateVal, counts) => {
          if (isDryingInspectionModule) {
            return;
          }

          const rowId = String(targetRow.id);
          const currentTotal = Number(targetRow.noOfLeaves ?? targetRow.totalLeaves ?? targetRow.noOfSheets ?? 0) || 0;
          const tracking = inspectionTrackingMap[rowId];
          const prevPass = tracking?.passQty ?? 0;
          const prevFail = tracking?.failQty ?? 0;

          const thisPass = counts?.passQty ?? 0;
          const thisFail = counts?.failQty ?? currentTotal;

          const totalPass = prevPass + thisPass;
          const totalFail = prevFail + thisFail;
          const remaining = Math.max(0, currentTotal - (thisPass + thisFail));
          const isFullyDone = remaining <= 0;
          const newStatus: "Pending" | "Partially Pending" | "Done" = isFullyDone ? "Done" : "Partially Pending";

          setInspectionTrackingMap((prev) => ({
            ...prev,
            [rowId]: {
              passQty: totalPass,
              failQty: totalFail,
              availableLeaves: remaining,
              status: newStatus,
            },
          }));

          const workItemId = getFactoryString(targetRow.workItemId);
          const basePatch = {
            inspectionDate: inspectionDateVal || new Date().toISOString().slice(0, 10),
            remark: decisionRemark || targetRow.remark || "Failed inspection",
            passQty: thisPass,
            failQty: thisFail,
            noOfLeaves: String(thisFail),
            totalLeaves: String(thisFail),
          };

          if (thisFail > 0) {
            const failRecord = {
              ...targetRow,
              ...basePatch,
              id: isFullyDone && !thisPass ? targetRow.id : `insp-fail-${Date.now()}-${targetRow.id}`,
              qcStatus: "Fail",
              listingState: "failed",
            };
            if (workItemId && isFullyDone && !thisPass) {
              failFactoryIssuedWork(workItemId, { ...basePatch, qcStatus: "Fail" });
            } else {
              setInspectionFailedRows((current) => [...current, failRecord]);
            }
          }

          if (thisPass > 0) {
            const passRecord = {
              ...targetRow,
              ...basePatch,
              id: `insp-pass-${Date.now()}-${targetRow.id}`,
              qcStatus: "Pass",
              noOfLeaves: String(thisPass),
              totalLeaves: String(thisPass),
              listingState: "done",
            };
            if (workItemId && isFullyDone && !thisFail) {
              completeFactoryIssuedWork(workItemId, { ...basePatch, qcStatus: "Pass" });
            } else {
              setInspectionCompletedRows((current) => [...current, passRecord]);
            }
          }

          if (isFullyDone && workItemId && thisPass > 0 && thisFail > 0) {
            failFactoryIssuedWork(workItemId, { ...basePatch, qcStatus: "Fail" });
          }

          setInspectionDecisionTargetRow(null);
          if (isFullyDone) {
            setActiveTab("failed");
          }
        }}
      />

      <DryingCreateDialog
        open={Boolean(dryingCreateRow)}
        row={dryingCreateRow}
        onClose={() => setDryingCreateRow(null)}
        onSave={({ driedLeaves, dryingDate, remark }) => {
          if (!dryingCreateRow) return;

          const availableLeaves = dryingLeafCount(dryingCreateRow);
          const remainingLeaves = Math.max(0, availableLeaves - driedLeaves);
          const driedArea = dryingLeafArea(
            dryingCreateRow.length,
            dryingCreateRow.width,
            driedLeaves,
          );
          const issueKeys = [
            dryingCreateRow.id,
            dryingCreateRow.workItemId,
            dryingCreateRow.storageSrNo,
            dryingCreateRow.sourceStorageId,
          ]
            .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
            .map(String);

          updateDryingIssuedLeaves(issueKeys, {
            availableLeaves: String(remainingLeaves),
          });
          addDryingDoneItems([
            {
              ...dryingCreateRow,
              id: `drying-done-${Date.now()}`,
              sourceIssuedId: dryingCreateRow.id,
              listingState: "done",
              issueDate: dryingDate,
              dryingDate,
              noOfLeaves: String(driedLeaves),
              availableLeaves: String(driedLeaves),
              issueForInspection: "-",
              status: "Pending",
              sqm: driedArea.sqm,
              sqf: driedArea.sqf,
              totalSqMeter: driedArea.sqm,
              remark,
              thickness: dryingCreateRow.thickness || dryingCreateRow.height || "",
            },
          ]);
          setDryingCreateRow(null);
        }}
      />

      <DryingRejectDialog
        open={Boolean(dryingRejectRow)}
        row={dryingRejectRow}
        onClose={() => setDryingRejectRow(null)}
        onSave={(rejectedLeaves) => {
          if (!dryingRejectRow) return;

          const availableLeaves = dryingLeafCount(dryingRejectRow);
          const remainingLeaves = Math.max(0, availableLeaves - rejectedLeaves);
          const rejectedArea = dryingLeafArea(
            dryingRejectRow.length,
            dryingRejectRow.width,
            rejectedLeaves,
          );
          const remainingArea = dryingLeafArea(
            dryingRejectRow.length,
            dryingRejectRow.width,
            remainingLeaves,
          );
          const rowId = String(dryingRejectRow.id);
          const updatedInStore = adjustDryingDoneLeaves(rowId, remainingLeaves, remainingArea);

          if (!updatedInStore) {
            if (remainingLeaves <= 0) {
              setDryingDoneRemovedIds((current) =>
                current.includes(rowId) ? current : [...current, rowId],
              );
            } else {
              setDryingDoneLeafPatches((current) => ({
                ...current,
                [rowId]: remainingLeaves,
              }));
            }
          }

          setDryingIssueStateMap((current) => {
            const tracking = current[rowId];
            if (!tracking) return current;
            return {
              ...current,
              [rowId]: {
                ...tracking,
                availableLeaves: remainingLeaves,
                status: remainingLeaves <= 0 ? "Done" : tracking.status,
              },
            };
          });

          setRejectedDoneRows((current) => [
            {
              ...dryingRejectRow,
              id: `drying-rejected-${Date.now()}`,
              listingState: "rejected",
              issueDate: new Date().toISOString().slice(0, 10),
              noOfLeaves: String(rejectedLeaves),
              availableLeaves: String(rejectedLeaves),
              sqm: rejectedArea.sqm,
              sqf: rejectedArea.sqf,
              totalSqMeter: rejectedArea.sqm,
            } as Row,
            ...current,
          ]);
          setDryingRejectRow(null);
          setActiveTab("rejected");
        }}
      />

      <DryingInspectionIssueDialog
        open={Boolean(dryingInspectionIssueRow)}
        row={dryingInspectionIssueRow}
        onClose={() => setDryingInspectionIssueRow(null)}
        onSubmit={(issueLeaves, _totalLeaves, inspectionDateVal) => {
          if (!dryingInspectionIssueRow) return;

          const rowId = String(dryingInspectionIssueRow.id);
          const availableNow = dryingLeafCount(dryingInspectionIssueRow);
          const newlyIssued = Number(issueLeaves) || 0;
          const remaining = Math.max(0, availableNow - newlyIssued);
          const prevIssued = dryingIssueStateMap[rowId]?.issuedLeaves ?? 0;
          const totalIssued = prevIssued + newlyIssued;
          const newStatus = remaining <= 0 ? "Done" : "Partially Done";
          const issuedArea = dryingLeafArea(
            dryingInspectionIssueRow.length,
            dryingInspectionIssueRow.width,
            newlyIssued,
          );
          const remainingArea = dryingLeafArea(
            dryingInspectionIssueRow.length,
            dryingInspectionIssueRow.width,
            remaining,
          );

          issueFactoryWork({
            destinationProcess: "Inspection",
            sourceSlug: definition.slug,
            sourceProcess: "Drying",
            sourceWarehouseName: getFactoryString(dryingInspectionIssueRow.warehouseName),
            sourceRow: {
              ...dryingInspectionIssueRow,
              issuedLeaves: String(newlyIssued),
              noOfLeaves: String(newlyIssued),
              totalLeaves: String(newlyIssued),
              availableLeaves: String(newlyIssued),
              noOfSheets: String(newlyIssued),
              totalSqMeter: issuedArea.sqm,
              sqm: issuedArea.sqm,
              sqf: issuedArea.sqf,
              ...(inspectionDateVal ? { issuedDate: inspectionDateVal, issueDate: inspectionDateVal } : {}),
            },
          });

          const updatedInStore = adjustDryingDoneLeaves(rowId, remaining, remainingArea, {
            issueForInspection: String(totalIssued),
            status: newStatus,
          });
          if (!updatedInStore) {
            setDryingDoneLeafPatches((current) => ({
              ...current,
              [rowId]: remaining,
            }));
            if (remaining <= 0) {
              setDryingDoneRemovedIds((current) =>
                current.includes(rowId) ? current : [...current, rowId],
              );
            }
          }

          setDryingIssueStateMap((prev) => ({
            ...prev,
            [rowId]: {
              issuedLeaves: totalIssued,
              availableLeaves: remaining,
              status: newStatus,
            },
          }));

          setDryingInspectionHistoryRows((current) => [
            {
              ...dryingInspectionIssueRow,
              id: `drying-history-${Date.now()}`,
              listingState: "history",
              issueDate: inspectionDateVal || new Date().toISOString().slice(0, 10),
              noOfLeaves: String(newlyIssued),
              availableLeaves: String(newlyIssued),
              issueForInspection: String(newlyIssued),
              sqm: issuedArea.sqm,
              sqf: issuedArea.sqf,
              totalSqMeter: issuedArea.sqm,
              status: "Issued",
            } as Row,
            ...current,
          ]);

          setDryingInspectionIssueRow(null);
        }}
      />

      {/* Confirmation Dialog: Revert */}
      <Dialog
        open={Boolean(confirmRevertRow)}
        onClose={() => setConfirmRevertRow(null)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "8px",
              minWidth: 360,
              maxWidth: 420,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontSize: "1.1rem" }}>
          Confirm Revert
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Do you really want to revert?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmRevertRow(null)}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            No
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              if (confirmRevertRow) {
                const { row, type } = confirmRevertRow;
                if (type === "drying-done") {
                  const restored = revertDryingDoneToIssued(row);
                  if (!restored) {
                    const rowId = String(row.id);
                    setDryingDoneRemovedIds((current) =>
                      current.includes(rowId) ? current : [...current, rowId],
                    );
                  }
                } else {
                  if (type === "rejected") {
                    setRejectedDoneRows((current) =>
                      current.filter((item) => item.id !== row.id),
                    );
                  }
                  setRevertedRowIds((current) =>
                    current.includes(row.id) ? current : [...current, row.id],
                  );
                }
              }
              setConfirmRevertRow(null);
            }}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      <IssueForDryingDialog
        onClose={() => {
          setIssueDryingRows([]);
          setConfirmIssueDryingOpen(false);
        }}
        onConfirm={() => {
          issueDryingRows.forEach((selectedRow) => {
            issueFactoryWork({
              destinationProcess: "Drying",
              sourceSlug: definition.slug,
              sourceProcess: "Slicing",
              sourceWarehouseName: getFactoryString(selectedRow.warehouseName),
              sourceRow: selectedRow,
            });
          });
          const issuedIds = new Set(issueDryingRows.map((row) => row.id));
          setRevertedRowIds((current) => [
            ...current,
            ...issueDryingRows.map((row) => row.id),
          ]);
          setSelectedListingRows((current) =>
            current.filter((row) => !issuedIds.has(row.id)),
          );
          setIssueDryingRows([]);
          setConfirmIssueDryingOpen(false);
        }}
        open={confirmIssueDryingOpen}
        rows={issueDryingRows}
      />

      <ConfirmIssueForInspectionDialog
        onClose={() => setConfirmIssueInspectionOpen(false)}
        onConfirm={() => {
          selectedListingRows.forEach((selectedRow) => {
            issueFactoryWork({
              destinationProcess: "Inspection",
              sourceSlug: definition.slug,
              sourceProcess: "Drying",
              sourceWarehouseName: getFactoryString(selectedRow.warehouseName),
              sourceRow: selectedRow,
            });
          });
          setRevertedRowIds((current) => [
            ...current,
            ...selectedListingRows.map((row) => row.id),
          ]);
          setSelectedListingRows([]);
          setConfirmIssueInspectionOpen(false);
        }}
        open={confirmIssueInspectionOpen}
      />
    </>
  );
}

