import { useEffect, useMemo, useState } from "react";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Info,
  Pencil,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useLocation, useNavigate, useSearchParams } from "react-router";

import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";

import { ErpDatePickerField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
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
  getListingToolbarButtonSx,
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
import { FactoryActionConfirmDialog } from "./FactoryActionConfirmDialog";
import type { ProductionWarehouseOption } from "./FactoryActionConfirmDialog";
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
import { applyCncFlutingListingColumns } from "../cnc-fluting/cncFlutingListingColumns";
import { appendCncFlutingSampleIssueActions } from "../cnc-fluting/cncFlutingSampleActions";
import { applyInspectionListingColumns } from "../inspection/inspectionListingColumns";
import { EditDryingInspectionQtyDialog } from "../inspection/EditDryingInspectionQtyDialog";
import { MoveToWarehouseBDialog } from "../inspection/MoveToWarehouseBDialog";
import {
  buildInspectionDoneRowActions,
  buildInspectionFailedRowActions,
  buildInspectionIssuedRowActions,
} from "../inspection/inspectionRowActions";
import { applyEmbossingListingColumns } from "../embossing/embossingListingColumns";
import { appendEmbossingSampleIssueActions } from "../embossing/embossingSampleActions";
import { applyMarquetryListingColumns } from "../marquetry/marquetryListingColumns";
import { withMarquetryIssuedFrom } from "../marquetry/mapMarquetryListingRow";
import { appendMarquetrySampleIssueActions } from "../marquetry/marquetrySampleActions";
import { buildFinishingDoneRowActions } from "../finishing/finishingDoneActions";
import { FinishingIssueToPackingDialog } from "../finishing/FinishingIssueToPackingDialog";
import { issueFinishingToPacking } from "../../packing/shared/packingStore";
import { applyFinishingListingColumns } from "../finishing/finishingListingColumns";
import { availableFactoryMeasures } from "./factoryAvailableMeasures";
import {
  applyPressingIssuedForLabels,
  getPressingForLabel,
} from "../pressing/pressingIssuedForLabel";
import { applyPressingListingColumns } from "../pressing/pressingListingColumns";
import { getPressingNextProcessActions } from "../pressing/pressingNextProcessActions";
import { mapSplicingIssuedListingRow } from "../splicing/mapSplicingIssuedListingRow";
import { applySplicingListingColumns } from "../splicing/splicingListingColumns";
import { appendSplicingSampleIssueActions } from "../splicing/splicingSampleActions";
import { submitSplicingOrderIssue } from "../splicing/submitSplicingOrderIssue";
import { buildGroupingDoneRowActions } from "../grouping/groupingDoneActions";
import { applyGroupingListingColumns } from "../grouping/groupingListingColumns";
import { mapGroupingListingRow } from "../grouping/mapGroupingListingRow";
import { DryingCreateDialog } from "../drying/DryingCreateDialog";
import { DryingRejectDialog } from "../drying/DryingRejectDialog";
import {
  buildFinishingDoneSnapshot,
  FinishingCreateDialog,
} from "../finishing/FinishingCreateDialog";
import {
  buildCncFlutingDoneSnapshot,
  CncFlutingCreateDialog,
} from "../cnc-fluting/CncFlutingCreateDialog";
import {
  buildEmbossingDoneSnapshot,
  EmbossingCreateDialog,
} from "../embossing/EmbossingCreateDialog";
import {
  addDryingDoneItems,
  adjustDryingDoneLeaves,
  applyDryingListingRows,
  clearDryingDoneRejected,
  dryingLeafArea,
  dryingLeafCount,
  getDryingDoneEditBlockReason,
  getDryingEditLimits,
  markDryingDoneRejected,
  recordDryingInspectionIssue,
  releaseDryingInspectionIssue,
  restoreDryingDoneLeaves,
  revertDryingDoneToIssued,
  updateDryingDoneItem,
  updateDryingIssuedLeaves,
  useDryingFlowState,
} from "../drying/dryingFrontendStore";
import { IssueForDryingDialog } from "../slicing/IssueForDryingDialog";
import { applySlicingListingColumns } from "../slicing/slicingListingColumns";
import {
  applySlicingListingRows,
  clearSlicingDoneRejected,
  getSlicingDoneEditBlockReason,
  markSlicingDoneRejected,
  restoreSlicingDoneLeaves,
  updateSlicingDoneAvailableLeaves,
  useSlicingFlowState,
} from "../slicing/slicingFrontendStore";
import { restoreSawingDoneFromInspection } from "../sawing/sawingFrontendStore";
import {
  factoryIssuedWorkToRow,
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
  revertFactoryIssuedWork,
  updateFactoryIssuedWorkSnapshot,
  getFactoryIssuedWorkForListing,
  issueFactoryWork,
  removeFactoryIssuedWork,
  resolveFactoryProcessLabel,
  useFactoryIssuedWorkItems,
} from "./factoryIssuedWorkStore";
import {
  createSampleSheetFromGrouping,
  getSampleNoFromRow,
  isSampleFactoryRow,
  issueSampleToProcess,
  markSampleProcessDone,
  useSampleSheetRecords,
} from "./sampleSheetIdentityStore";
import type { FactoryDefinition, FactoryRecord } from "./types";
import {
  buildGroupingOrderIssueSourceRow,
  createRejectFactoryAction,
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
  InspectionDecisionDialog,
  issueToNextFactoryProcess,
  normalizeFactorySourceColumns,
  ReadOnlyDialogField,
  SplicingOrderIssueDialog,
  type GroupingOrderIssueState,
  type GroupingSampleIssueState,
  type SplicingOrderIssueState,
} from "./listing/factoryListingParts";
import { moveFactoryRowToWarehouseC } from "../../warehouses/shared/warehouseCTransferStore";
import { moveFactoryRowToWarehouseB } from "../../warehouses/shared/warehouseBTransferStore";
import { orderFactoryListingMeasureColumns } from "./factoryListingColumnOrder";

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

type GroupingOrderItemDetails = {
  lineItem: OrderLineItem | null;
  order: OrderRecord | null;
  orderItemNo: string;
  row: FactoryRecord;
  stageLabel: string;
};

function getGroupingOrderItemDetails(
  row: FactoryRecord,
  orderRecords: readonly OrderRecord[],
  stageLabel: string,
): GroupingOrderItemDetails {
  const orderNo = typeof row.orderNo === "string" ? row.orderNo : "";
  const orderItemNo =
    typeof row.orderItemNo === "string" ? row.orderItemNo : "";
  const matchedOrder =
    orderRecords.find((record) => record.orderNo === orderNo) ?? null;

  const itemIndex = Math.max(
    0,
    Number(orderItemNo.match(/\d+/)?.[0] ?? "1") - 1,
  );

  // If orderNo doesn't directly exist in orderRecords (e.g. factory mock row ORD-2026-12xx),
  // pick a consistent order from orderRecords based on itemIndex so lineItem fields are populated
  const fallbackOrder = orderRecords.length > 0 ? (orderRecords[itemIndex % orderRecords.length] ?? orderRecords[0] ?? null) : null;
  const order: OrderRecord | null = matchedOrder ?? fallbackOrder ?? null;

  const orderLineItems = order ? getOrderLineItems(order.id) : [];
  const lineItem = orderLineItems[itemIndex % Math.max(1, orderLineItems.length)] ?? orderLineItems[0] ?? null;

  return { lineItem, order, orderItemNo, row, stageLabel };
}

function detailText(value: unknown) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }
  return typeof value === "string" && value.trim() ? value.trim() : "-";
}

export function FactoryListing<Row extends FactoryRecord>({
  definition,
}: FactoryListingProps<Row>) {
  const navigate = useNavigate();
  const orderRecords = useOrderRecords();
  const groupedStockIssues = useGroupedStockSampleIssues();
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

  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);

  const location = useLocation();

  useEffect(() => {
    const flashMessage = (
      location.state as { factoryFlashMessage?: string } | null
    )?.factoryFlashMessage;

    if (flashMessage) {
      setToastNotification({
        message: flashMessage,
        severity: "success",
      });
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.search, location.state, navigate]);

  const [searchValue, setSearchValue] = useState("");
  const [revertedRowIds, setRevertedRowIds] = useState<string[]>([]);
  const [confirmRevertRow, setConfirmRevertRow] = useState<{
    row: Row;
    type: "issued" | "rejected" | "drying-done" | "inspection-done" | "inspection-failed" | "finishing-done";
  } | null>(null);
  const [confirmIssueDryingOpen, setConfirmIssueDryingOpen] = useState(false);
  const [issueDryingRows, setIssueDryingRows] = useState<Row[]>([]);
  const [confirmIssueInspectionOpen, setConfirmIssueInspectionOpen] = useState(false);
  const [rejectConfirmRow, setRejectConfirmRow] = useState<Row | null>(null);
  const [issueConfirm, setIssueConfirm] = useState<{
    description: string;
    run: (warehouse: ProductionWarehouseOption | null) => void;
    showWarehouse: boolean;
    title: string;
  } | null>(null);
  const [rejectedDoneRows, setRejectedDoneRows] = useState<Row[]>([]);
  const [inspectionCompletedRows, setInspectionCompletedRows] = useState<Row[]>([]);
  const [inspectionFailedRows, setInspectionFailedRows] = useState<Row[]>([]);
  const [inspectionDecisionTargetRow, setInspectionDecisionTargetRow] = useState<Row | null>(null);
  const [sawingWarehouseMoveRows, setSawingWarehouseMoveRows] = useState<Row[]>([]);
  const [splicingOrderIssue, setSplicingOrderIssue] =
    useState<SplicingOrderIssueState<Row> | null>(null);
  const [groupingSampleIssue, setGroupingSampleIssue] =
    useState<GroupingSampleIssueState<Row> | null>(null);
  const [groupingOrderIssue, setGroupingOrderIssue] =
    useState<GroupingOrderIssueState<Row> | null>(null);
  const [groupingOrderItemDetails, setGroupingOrderItemDetails] =
    useState<GroupingOrderItemDetails | null>(null);
  const [dryingInspectionIssueRow, setDryingInspectionIssueRow] =
    useState<Row | null>(null);
  const [dryingCreateRow, setDryingCreateRow] = useState<Row | null>(null);
  const [dryingEditRow, setDryingEditRow] = useState<Row | null>(null);
  const [finishingCreateRow, setFinishingCreateRow] = useState<Row | null>(null);
  const [finishingEditRow, setFinishingEditRow] = useState<Row | null>(null);
  const [flutingCreateRow, setFlutingCreateRow] = useState<Row | null>(null);
  const [flutingEditRow, setFlutingEditRow] = useState<Row | null>(null);
  const [embossingCreateRow, setEmbossingCreateRow] = useState<Row | null>(null);
  const [embossingEditRow, setEmbossingEditRow] = useState<Row | null>(null);
  const [splicingPressingIssueRows, setSplicingPressingIssueRows] =
    useState<Row[]>([]);
  const [marquetryPressingIssueRows, setMarquetryPressingIssueRows] =
    useState<Row[]>([]);
  const [flutingFinishingIssueRows, setFlutingFinishingIssueRows] =
    useState<Row[]>([]);
  const [embossingFinishingIssueRows, setEmbossingFinishingIssueRows] =
    useState<Row[]>([]);
  const [finishingPackingIssueRows, setFinishingPackingIssueRows] =
    useState<Row[]>([]);
  const [finishingPackingIssueRow, setFinishingPackingIssueRow] =
    useState<Row | null>(null);
  const [dryingRejectRow, setDryingRejectRow] = useState<Row | null>(null);
  const [dryingDoneLeafPatches, setDryingDoneLeafPatches] = useState<Record<string, number>>({});
  const [dryingDoneRemovedIds, setDryingDoneRemovedIds] = useState<string[]>([]);
  const [dryingInspectionHistoryRows, setDryingInspectionHistoryRows] = useState<Row[]>([]);
  const [dryingInspectionEventRows, setDryingInspectionEventRows] = useState<Row[]>([]);
  const [warehouseBTransferredIds, setWarehouseBTransferredIds] = useState<string[]>([]);
  const [warehouseBTransferredWarehouseMap, setWarehouseBTransferredWarehouseMap] = useState<Record<string, string>>({});
  const [dryingIssueStateMap, setDryingIssueStateMap] = useState<
    Record<string, { issuedLeaves: number; availableLeaves: number; status: "Pending" | "Partially Done" | "Done" }>
  >({});
  const [warehouseBMoveRows, setWarehouseBMoveRows] = useState<Row[]>([]);
  const [dryingInspectionQtyEditRow, setDryingInspectionQtyEditRow] = useState<Row | null>(null);
  const [inspectionTrackingMap, setInspectionTrackingMap] = useState<
    Record<string, { passQty: number; failQty: number; availableLeaves: number; status: "Pending" | "Partially Pending" | "Done" }>
  >({});
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
    // TODO(have to discuss): Splicing listing - temporarily hide the dynamic "For" column.
    // definition.slug === "splicing" ||
    definition.slug === "pressing" ||
    definition.slug === "cnc-fluting" ||
    definition.slug === "embossing" ||
    definition.slug === "finishing";
  const isDryingDoneTab = definition.slug === "drying" && activeTab === "done";
  const isSlicingDoneTab = definition.slug === "slicing" && activeTab === "done";
  const isSplicingDoneTab = definition.slug === "splicing" && activeTab === "done";
  const isMarquetryDoneTab = definition.slug === "marquetry" && activeTab === "done";
  const isFlutingDoneTab = definition.slug === "cnc-fluting" && activeTab === "done";
  const isEmbossingDoneTab = definition.slug === "embossing" && activeTab === "done";
  const isFinishingDoneTab = definition.slug === "finishing" && activeTab === "done";
  const isDryingInspectionDoneTab =
    isDryingInspectionModule && activeTab === "done";
  const isSawingInspectionDoneTab = definition.slug === "sawing-inspection" && activeTab === "done";
  const isSelectableTab =
    isDryingDoneTab ||
    isSlicingDoneTab ||
    isSplicingDoneTab ||
    isMarquetryDoneTab ||
    isFlutingDoneTab ||
    isEmbossingDoneTab ||
    isFinishingDoneTab ||
    isDryingInspectionDoneTab ||
    isSawingInspectionDoneTab;
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
          if (definition.slug === "grouping" || definition.slug === "slicing") {
            return false;
          }
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
    const groupingIssueHistoryRows =
      isGroupingModule && activeTab === "history"
        ? groupedStockIssues.map((issue) => {
            const order = issue.orderNo
              ? orderRecords.find(
                  (record) => record.orderNo === issue.orderNo,
                ) ?? null
              : null;

            return {
              ...issue.sourceSnapshot,
              id: issue.id,
              listingState: "history",
              groupingRef: issue.groupingRowId,
              issuedDate: new Date(issue.issueDate),
              issuedFor: issue.purpose === "order" ? "Order" : "Sample",
              issueSheets: String(issue.issueSheets),
              noOfSheets: String(issue.issueSheets),
              orderType: issue.orderType ?? "",
              orderNo: issue.orderNo ?? "",
              orderItemNo: issue.orderItemNo ?? "",
              customerName: order?.customerName ?? "",
              orderDate: order?.orderDate,
            } as unknown as Row;
          })
        : [];
    const rowsForTab =
      isGroupingModule && activeTab === "history"
        ? [...groupingIssueHistoryRows, ...baseRowsForTab]
      : activeTab === "rejected"
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
            const destinationWarehouseName =
              warehouseBTransferredWarehouseMap[rowId] ||
              sourceNormalizedRow.productionWarehouseName ||
              sourceNormalizedRow.storageWarehouseName ||
              sourceNormalizedRow.destinationWarehouse ||
              (transferred ? sourceNormalizedRow.warehouseName || "Warehouse B" : (sourceNormalizedRow.warehouseName || "Warehouse B"));
            const eventStatus = formatInspectionLeafQty(sourceNormalizedRow.inspectionEventStatus);
            return {
              ...sourceNormalizedRow,
              passQty: formatInspectionLeafQty(sourceNormalizedRow.passQty),
              failQty: formatInspectionLeafQty(sourceNormalizedRow.failQty),
              warehouseBStatus: transferred
                ? "Transferred to Warehouse B"
                : "Not transferred",
              productionWarehouseName: destinationWarehouseName,
              destinationWarehouse: destinationWarehouseName,
              storageWarehouseName: destinationWarehouseName,
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
          const sawingProductionWarehouseName =
            definition.slug === "sawing-inspection" && activeTab === "done"
              ? sourceNormalizedRow.productionWarehouseName ||
                sourceNormalizedRow.destinationWarehouse ||
                "Warehouse C"
              : sourceNormalizedRow.productionWarehouseName;
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
                  productionWarehouseName: sawingProductionWarehouseName,
                }
              : {}),
          } as Row;
        }

        if (definition.slug === "splicing") {
          const splicingRow = {
            ...sourceNormalizedRow,
            issuePurpose: isSampleFactoryRow(sourceNormalizedRow)
              ? "Sample"
              : "Order",
          } as Row;

          return activeTab === "issued"
            ? mapSplicingIssuedListingRow(
                splicingRow,
                factoryIssuedWorkItems,
              )
            : splicingRow;
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
            issuedForInspectionDate:
              sourceNormalizedRow.issuedForInspectionDate ?? sourceNormalizedRow.inspectionDate,
            availableLeaves: String(availableLeaves),
          } as Row;
        }

        if (definition.slug === "finishing" && activeTab === "done") {
          const receivedCount =
            Number(
              sourceNormalizedRow.receivedSheets ??
                sourceNormalizedRow.finishedSheets ??
                sourceNormalizedRow.outputNoOfSheets ??
                sourceNormalizedRow.noOfSheets ??
                0,
            ) || 0;
          const availableCount =
            sourceNormalizedRow.availableSheets !== undefined &&
            sourceNormalizedRow.availableSheets !== null &&
            String(sourceNormalizedRow.availableSheets).trim() !== ""
              ? Number(sourceNormalizedRow.availableSheets) || 0
              : receivedCount;

          return {
            ...sourceNormalizedRow,
            receivedSheets: String(receivedCount),
            availableSheets: String(availableCount),
            ...availableFactoryMeasures(sourceNormalizedRow, receivedCount, availableCount),
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
    orderRecords,
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

    const withGroupNoFirst = (
      targetColumns: readonly EnterpriseTableColumn<Row>[],
    ): readonly EnterpriseTableColumn<Row>[] => {
      const groupNoColumn =
        targetColumns.find((column) => column.key === "groupNo") ??
        ({ key: "groupNo", label: "Group No." } as EnterpriseTableColumn<Row>);

      return [
        groupNoColumn,
        ...targetColumns.filter((column) => column.key !== "groupNo"),
      ];
    };

    const withOrderItemInfoButton = (
      targetColumns: readonly EnterpriseTableColumn<Row>[],
      stageLabel: string,
    ) => {
      const columnsWithOrderItem = targetColumns.some(
        (column) => column.key === "orderItemNo",
      )
        ? targetColumns
        : withOptionalColumn(
            targetColumns,
            { key: "orderItemNo", label: "Order Item No." },
            "itemName",
          );

      const renderedColumns = columnsWithOrderItem.map((column) =>
      column.key === "orderItemNo"
        ? {
            ...column,
            renderCell: (row: Row) => {
              const orderItemNo =
                typeof row.orderItemNo === "string"
                  ? row.orderItemNo.trim()
                  : "";

              if (!orderItemNo) {
                return "-";
              }

              return (
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={0.5}
                  sx={{ minWidth: 96, width: "100%" }}
                >
                  <Typography noWrap sx={{ flex: 1, fontSize: "inherit", minWidth: 0 }}>
                    {orderItemNo}
                  </Typography>
                  <Tooltip title="View order item details">
                    <IconButton
                      aria-label={`View details for ${orderItemNo}`}
                      onClick={(event) => {
                        event.stopPropagation();
                        setGroupingOrderItemDetails(
                          getGroupingOrderItemDetails(row, orderRecords, stageLabel),
                        );
                      }}
                      size="small"
                      sx={(theme) => ({
                        color: theme.customTokens.brand.primary,
                        flexShrink: 0,
                        ml: "auto",
                        p: 0.25,
                      })}
                    >
                      <Info size={15} />
                    </IconButton>
                  </Tooltip>
                </Stack>
              );
            },
          }
        : column,
      );

      const groupNoIndex = renderedColumns.findIndex(
        (column) => column.key === "groupNo",
      );
      const orderItemIndex = renderedColumns.findIndex(
        (column) => column.key === "orderItemNo",
      );
      if (groupNoIndex === -1 || orderItemIndex === -1 || orderItemIndex === groupNoIndex + 1) {
        return renderedColumns;
      }

      const orderItemColumn = renderedColumns[orderItemIndex];
      if (!orderItemColumn) {
        return renderedColumns;
      }
      const withoutOrderItem = renderedColumns.filter(
        (column) => column.key !== "orderItemNo",
      );
      const targetGroupIndex = withoutOrderItem.findIndex(
        (column) => column.key === "groupNo",
      );

      return [
        ...withoutOrderItem.slice(0, targetGroupIndex + 1),
        orderItemColumn,
        ...withoutOrderItem.slice(targetGroupIndex + 1),
      ];
    };

    if (definition.slug === "marquetry") {
      columns = applyMarquetryListingColumns(columns, activeTab);
    }

    if (definition.slug === "grouping") {
      const groupingColumns = applyGroupingListingColumns(columns, activeTab);
      if (activeTab !== "history") {
        return groupingColumns;
      }

      return withOrderItemInfoButton(groupingColumns, "Grouping");
    }

    if (definition.slug === "splicing") {
      return withOrderItemInfoButton(
        withGroupNoFirst(applySplicingListingColumns(columns, activeTab)),
        "Splicing",
      );
    }

    if (definition.slug === "pressing") {
      columns = applyPressingListingColumns(columns, activeTab);
    }

    if (definition.slug === "cnc-fluting") {
      columns = applyCncFlutingListingColumns(columns, activeTab);
    }

    if (definition.slug === "embossing") {
      columns = applyEmbossingListingColumns(columns, activeTab);
    }

    if (definition.slug === "finishing") {
      columns = applyFinishingListingColumns(columns, activeTab);
    }

    if (supportsSamplePurposeColumn && definition.slug !== "marquetry") {
      columns = withOptionalColumn(
        columns,
        {
          key: "for",
          label: "For",
          ...(definition.slug === "pressing"
            ? { renderCell: (row: Row) => getPressingForLabel(row) }
            : {}),
        },
        "itemName",
      );
    }

    const orderInfoStageLabel: Record<string, string> = {
      marquetry: "Marquetry",
      pressing: "Pressing",
      "cnc-fluting": "Fluting",
      embossing: "Embossing",
      finishing: "Finishing",
    };
    const currentOrderInfoStage = orderInfoStageLabel[definition.slug];
    if (currentOrderInfoStage) {
      columns = withGroupNoFirst(columns);
      columns = withOrderItemInfoButton(columns, currentOrderInfoStage);
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
    orderRecords,
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
  const orderedTableColumns = useMemo(
    () => orderFactoryListingMeasureColumns(tableColumns),
    [tableColumns],
  );

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
            activeTab === "history" &&
            (definition.slug === "drying" ||
              definition.slug === "slicing" ||
              definition.slug === "grouping" ||
              definition.slug === "splicing" ||
              definition.slug === "marquetry" ||
              definition.slug === "pressing" ||
              definition.slug === "cnc-fluting" ||
              definition.slug === "embossing" ||
              definition.slug === "finishing")
          )
          ? [
            {
              id: "edit",
              label: "Edit",
              icon: Pencil,
              onSelect: (row: Row) => {
                if (definition.slug === "cnc-fluting") {
                  setFlutingEditRow(row);
                  return;
                }
                if (definition.slug === "embossing") {
                  setEmbossingEditRow(row);
                  return;
                }
                navigate(paths.edit(row.id), {
                  state: { record: row, tab: activeTab },
                });
              },
            },
          ]
          : []),
      ];

      if (
        activeTab === "issued" &&
        canCreate &&
        !isInspectionModule &&
        definition.slug !== "marquetry" &&
        definition.slug !== "pressing"
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

            if (definition.slug === "finishing") {
              setFinishingCreateRow(row);
              return;
            }

            if (definition.slug === "cnc-fluting") {
              setFlutingCreateRow(row);
              return;
            }

            if (definition.slug === "embossing") {
              setEmbossingCreateRow(row);
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

      if (activeTab === "rejected" && (canEdit || canCreate)) {
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
    const lockDoneEdit = (actions: readonly EnterpriseTableAction<Row>[], row: Row) => {
      if (activeTab !== "done") return actions;
      const reason =
        definition.slug === "slicing"
          ? getSlicingDoneEditBlockReason(row, definition.rows)
          : definition.slug === "drying"
            ? getDryingDoneEditBlockReason(row, definition.rows)
            : "";
      if (!reason) return actions;
      return actions.map((action) =>
        action.id === "edit"
          ? { ...action, disabled: true, disabledReason: reason }
          : action,
      );
    };
    const confirmIssueAction = (
      action: EnterpriseTableAction<Row>,
    ): EnterpriseTableAction<Row> => {
      const isIssueAction =
        action.id.startsWith("issue-for-") || action.id.startsWith("issue-to-");
      if (
        !isIssueAction ||
        action.id === "issue-for-order" ||
        action.id === "issue-for-drying" ||
        action.id === "issue-to-pressing" ||
        action.id === "issue-to-inspection" ||
        (definition.slug === "finishing" && action.id === "issue-for-packing") ||
        (definition.slug === "grouping" && action.id === "issue-for-sample-sheet")
      ) {
        return action;
      }

      const showWarehouse =
        definition.slug === "pressing" && action.id === "issue-for-sample-sheet";
      const actionText = action.label.replace(/^Issue /u, "issue ");

      return {
        ...action,
        onSelect: (selectedRow) => {
          setIssueConfirm({
            title: action.label,
            description: `Are you sure you want to ${actionText}?`,
            showWarehouse,
            run: (warehouse) => {
              const row = warehouse
                ? ({
                    ...selectedRow,
                    productionWarehouseId: warehouse.id,
                    productionWarehouseName: warehouse.name,
                    warehouseName: warehouse.name,
                  } as Row)
                : selectedRow;
              action.onSelect(row);
            },
          });
        },
      };
    };
    const confirmIssueActions = (actions: readonly EnterpriseTableAction<Row>[]) =>
      actions.map(confirmIssueAction);
    const rejectDoneAction = createRejectFactoryAction<Row>(
      definition.title,
      (selectedRow) => setRejectConfirmRow(selectedRow),
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

      const dryingAvailableLeaves = (selectedRow: Row) => {
        const rowId = String(selectedRow.id);
        const patchedLeaves = dryingDoneLeafPatches[rowId];
        if (patchedLeaves !== undefined) return patchedLeaves;
        const trackedLeaves = dryingIssueStateMap[rowId]?.availableLeaves;
        if (trackedLeaves !== undefined) return trackedLeaves;
        return dryingLeafCount(selectedRow);
      };

      return (row) => {
        const dryingRowActions = lockDoneEdit(
          rowActions.map((action) =>
            action.id === "edit"
              ? {
                  ...action,
                  onSelect: (selectedRow: Row) => setDryingEditRow(selectedRow),
                }
              : action,
          ),
          row,
        );
        return [
          ...dryingRowActions,
          ...(canCreate && dryingAvailableLeaves(row) > 0
            ? [
              {
                id: "issue-to-inspection",
                label: "Issue to Inspection",
                icon: Plus,
                tone: "primary" as const,
                onSelect: (selectedRow: Row) => setDryingInspectionIssueRow(selectedRow),
              },
            ]
            : []),
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
        onMoveToWarehouseB: (selectedRow) => setWarehouseBMoveRows([selectedRow]),
        onMoveToWarehouseC: (selectedRow) => {
          setSawingWarehouseMoveRows([selectedRow]);
        },
        onRevert: (selectedRow) => {
          setConfirmRevertRow({ row: selectedRow, type: "inspection-done" });
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
          setConfirmRevertRow({ row: selectedRow, type: "inspection-failed" });
        },
        onView: openInspectionRecord,
      });
    }

    if (definition.slug === "finishing" && activeTab === "done") {
      const finishingRowActions = rowActions.map((action) =>
        action.id === "edit"
          ? {
              ...action,
              onSelect: (selectedRow: Row) => setFinishingEditRow(selectedRow),
            }
          : action,
      );
      const buildFinishingActions = buildFinishingDoneRowActions<Row>({
        canCreate,
        canEdit,
        canView,
        onIssueToPacking: (selectedRow) => {
          setFinishingPackingIssueRow(selectedRow);
        },
        onRevert: (selectedRow) =>
          setConfirmRevertRow({ row: selectedRow, type: "finishing-done" }),
        onView: (selectedRow) => navigate(paths.view(selectedRow.id)),
        rejectDoneAction,
        rowActions: finishingRowActions,
      });
      return (row) => confirmIssueActions(buildFinishingActions(row));
    }

    if (isGroupingDoneTab) {
      return buildGroupingDoneRowActions<Row>({
        canCreate,
        canReject: canEdit || canCreate,
        canView,
        onReject: (selectedRow) => setRejectConfirmRow(selectedRow),
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
            remark: "",
            row: selectedRow,
            submitted: false,
          }),
        onView: (selectedRow) => navigate(paths.view(selectedRow.id)),
        rowActions,
      });
    }

    if (activeTab !== "done") {
      return undefined;
    }

    return (row) => {
      const issueToPressingAction: EnterpriseTableAction<Row> = {
        id: "issue-to-pressing",
        label: "Issue to Pressing",
        icon: Plus,
        tone: "primary",
        onSelect: (selectedRow) => setSplicingPressingIssueRows([selectedRow]),
      };
      const withIssueToPressing = (
        actions: readonly EnterpriseTableAction<Row>[],
      ) =>
        canCreate && definition.slug === "splicing"
          ? [...actions, issueToPressingAction]
          : actions;

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
          return confirmIssueActions(
            appendMarquetrySampleIssueActions(sampleActions, definition.slug),
          );
        }

        if (canCreate && definition.slug === "splicing") {
          return withIssueToPressing(
            confirmIssueActions(
              appendSplicingSampleIssueActions(sampleActions, definition.slug),
            ),
          );
        }

        if (canCreate && definition.slug === "cnc-fluting") {
          return confirmIssueActions(
            appendCncFlutingSampleIssueActions(sampleActions, definition.slug),
          );
        }

        if (canCreate && definition.slug === "embossing") {
          return confirmIssueActions(
            appendEmbossingSampleIssueActions(sampleActions, definition.slug),
          );
        }

        if (definition.slug === "pressing") {
          return confirmIssueActions([
            ...doneActions,
            ...(canCreate ? getPressingNextProcessActions(row, definition.slug) : []),
          ]);
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
      )
        .map((action) =>
          definition.slug === "slicing" && action.id === "issue-for-drying"
            ? {
                ...action,
                onSelect: (selectedRow: Row) => {
                  setIssueDryingRows([selectedRow]);
                  setConfirmIssueDryingOpen(true);
                },
              }
            : action,
        )
        .filter(
          (action) =>
            !(
              definition.slug === "slicing" &&
              action.id === "issue-for-drying" &&
              Number(row.availableLeaves ?? row.noOfLeaves ?? 0) <= 0
            ),
        );

      const confirmedNextActions = confirmIssueActions(nextProcessActions);

      if (confirmedNextActions.length === 0) {
        return withIssueToPressing(lockDoneEdit(doneActions, row));
      }

      return withIssueToPressing(
        lockDoneEdit([...doneActions, ...confirmedNextActions], row),
      );
    };
  }, [
    activeTab,
    canCreate,
    canEdit,
    canView,
    definition.slug,
    definition.title,
    dryingDoneLeafPatches,
    dryingFlowState,
    dryingIssueStateMap,
    slicingFlowState,
    inspectionCompletedRows,
    isDryingInspectionModule,
    isInspectionModule,
    isDryingDoneTab,
    isGroupingDoneTab,
    navigate,
    paths,
    rowActions,
  ]);

  const rejectFactoryDoneRow = (selectedRow: Row) => {
    if (definition.slug === "slicing") {
      markSlicingDoneRejected(selectedRow);
    }
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
  };

  const handleCloseGroupingSampleIssue = () => {
    setGroupingSampleIssue(null);
  };
  const handleSubmitGroupingSampleIssue = () => {
    if (!groupingSampleIssue) {
      return;
    }

    const availableSheets = getAvailableGroupedSheets(groupingSampleIssue.row);
    const issueSheets = Number(groupingSampleIssue.issueSheets);
    const hasValidIssueSheets =
      groupingSampleIssue.issueSheets.length > 0 &&
      Number.isInteger(issueSheets) &&
      issueSheets > 0 &&
      issueSheets <= availableSheets;

    if (!hasValidIssueSheets) {
      setGroupingSampleIssue((current) =>
        current ? { ...current, submitted: true } : current,
      );
      return;
    }

    const groupingRow = groupingSampleIssue.row;
    const groupingRowId = String(groupingRow.id);

    appendGroupedStockSampleIssue({
      groupingRowId,
      issueDate: groupingSampleIssue.issueDate,
      issueSheets,
      purpose: "sample-sheet",
      sourceRow: groupingRow,
    });

    const sample = createSampleSheetFromGrouping({
      groupingRow,
      issueDate: groupingSampleIssue.issueDate,
      issueSheets,
      nextProcess: "Pressing",
      remark: groupingSampleIssue.remark,
    });

    const {
      workItemId: _groupingWorkItemId,
      ...groupingSourceFields
    } = groupingRow;

    issueFactoryWork({
      destinationProcess: "Pressing",
      purpose: "SAMPLE",
      sampleNo: sample.sampleNo,
      sourceProcess: "Grouping",
      sourceWarehouseName: getFactoryRowWarehouseName(groupingRow),
      sourceRow: {
        ...groupingSourceFields,
        id: `grouping-sample-${groupingRowId}-${Date.now()}`,
        warehouseName: getFactoryRowWarehouseName(groupingRow),
        issuedFrom: "Grouping",
        sampleNo: sample.sampleNo,
        purpose: "SAMPLE",
        for: "Sample",
        forLabel: "Sample",
        noOfLeaves: String(issueSheets),
        receivedNoOfLeaves: String(issueSheets),
        availableNoOfLeaves: String(issueSheets),
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

  const closeSawingWarehouseMove = () => {
    setSawingWarehouseMoveRows([]);
  };

  const confirmSawingWarehouseMove = () => {
    const movedIds = sawingWarehouseMoveRows.map((row) => row.id);
    sawingWarehouseMoveRows.forEach((selectedRow) => {
      moveFactoryRowToWarehouseC({
        ...(selectedRow as unknown as Record<string, unknown>),
        destinationWarehouse: "Warehouse C",
        inventorySlug: "sawing",
        warehouseName: "Warehouse C",
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
            onChange={(value) => {
              setSelectedListingRows([]);
              setActiveTab(value as ListingTab);
            }}
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
                    Issue to Inspection ({selectedListingRows.length})
                  </Button>
                ) : null}
                {isSawingInspectionDoneTab && (canCreate || canEdit) ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => {
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
                {isDryingInspectionDoneTab && (canCreate || canEdit) ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => setWarehouseBMoveRows(selectedListingRows)}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Move to Warehouse B ({selectedListingRows.length})
                  </Button>
                ) : null}
                {isSplicingDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => setSplicingPressingIssueRows(selectedListingRows)}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue to Pressing ({selectedListingRows.length})
                  </Button>
                ) : null}
                {isMarquetryDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => setMarquetryPressingIssueRows(selectedListingRows)}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue to Pressing ({selectedListingRows.length})
                  </Button>
                ) : null}
                {isFlutingDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => setFlutingFinishingIssueRows(selectedListingRows)}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue to Finishing ({selectedListingRows.length})
                  </Button>
                ) : null}
                {isEmbossingDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => setEmbossingFinishingIssueRows(selectedListingRows)}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue to Finishing ({selectedListingRows.length})
                  </Button>
                ) : null}
                {isFinishingDoneTab && canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<CheckCircle2 size={16} />}
                    onClick={() => {
                      const eligibleRows = selectedListingRows.filter(
                        (row) => !isSampleFactoryRow(row),
                      );
                      if (selectedListingRows.length === 1 && eligibleRows.length === 1) {
                        setFinishingPackingIssueRow(eligibleRows[0] ?? null);
                        return;
                      }
                      setFinishingPackingIssueRows(selectedListingRows);
                    }}
                    sx={{
                      backgroundColor: "primary.main",
                      textTransform: "none",
                      fontWeight: 600,
                    }}
                  >
                    Issue to Packing ({selectedListingRows.length})
                  </Button>
                ) : null}
              </Stack>
            ) : (
              <Stack direction="row" spacing={1.25} alignItems="center">
                {(definition.slug === "marquetry" || definition.slug === "pressing") &&
                activeTab === "issued" &&
                canCreate ? (
                  <Button
                    variant="contained"
                    startIcon={<Plus size={15} />}
                    onClick={() => navigate(paths.add)}
                    sx={(theme) => getListingToolbarButtonSx(theme)}
                  >
                    {definition.slug === "pressing" ? "Create Pressing" : "Create Marquetry"}
                  </Button>
                ) : null}
                <FactoryToolbar />
              </Stack>
            )}
          </Stack>

          <EnterpriseDataTable
            key={`${definition.slug}-${activeTab}`}
            actions={rowActions}
            columns={orderedTableColumns}
            defaultRowsPerPage={10}
            emptyStateLabel={`No ${definition.title.toLowerCase()} records are available for this tab.`}
            rows={canView ? tableRows : []}
            selectable={isSelectableTab}
            selectOnRowClick={false}
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

      <GroupingOrderItemDetailsDialog
        details={groupingOrderItemDetails}
        onClose={() => setGroupingOrderItemDetails(null)}
      />

      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Move"
        description={
          sawingWarehouseMoveRows.length === 1
            ? "Are you sure you want to move this passed item to Warehouse C under Sawing?"
            : `Are you sure you want to move ${sawingWarehouseMoveRows.length} passed items to Warehouse C under Sawing?`
        }
        onClose={closeSawingWarehouseMove}
        onConfirm={confirmSawingWarehouseMove}
        open={sawingWarehouseMoveRows.length > 0}
        title="Confirm Move to Warehouse C"
        tone="default"
      />

      <MoveToWarehouseBDialog
        itemCount={warehouseBMoveRows.length}
        onClose={() => setWarehouseBMoveRows([])}
        onConfirm={(warehouse) => {
          if (warehouseBMoveRows.length === 0) return;
          const previouslyTransferredIds = new Set(warehouseBTransferredIds);
          const rowsToRecord = warehouseBMoveRows.filter(
            (row) => !previouslyTransferredIds.has(row.id),
          );

          warehouseBMoveRows.forEach((movedRow) => {
            moveFactoryRowToWarehouseB({
              ...(movedRow as unknown as Record<string, unknown>),
              storageWarehouseId: warehouse.id,
              storageWarehouseName: warehouse.name,
              warehouseName: warehouse.name,
            });
          });
          setWarehouseBTransferredIds((current) => [
            ...new Set([...current, ...warehouseBMoveRows.map((row) => row.id)]),
          ]);
          setWarehouseBTransferredWarehouseMap((current) => {
            const next = { ...current };
            warehouseBMoveRows.forEach((r) => {
              next[String(r.id)] = warehouse.name;
            });
            return next;
          });
          if (rowsToRecord.length > 0) {
            const movedAt = Date.now();
            const issueDate = new Date().toISOString().slice(0, 10);
            setDryingInspectionEventRows((current) => [
              ...rowsToRecord.map(
                (movedRow, index) =>
                  ({
                    ...movedRow,
                    id: `drying-insp-history-move-${movedAt}-${index}-${movedRow.id}`,
                    listingState: "history",
                    inspectionEventStatus: "Transferred to Warehouse B",
                    warehouseBStatus: "Transferred to Warehouse B",
                    passQty: formatInspectionLeafQty(movedRow.passQty),
                    failQty: formatInspectionLeafQty(movedRow.failQty),
                    issueDate,
                  }) as Row,
              ),
              ...current,
            ]);
          }
          const movedIds = new Set(warehouseBMoveRows.map((row) => row.id));
          setSelectedListingRows((current) =>
            current.filter((row) => !movedIds.has(row.id)),
          );
          setToastNotification({
            message: `Moved ${warehouseBMoveRows.length} item(s) to ${warehouse.name} successfully.`,
            severity: "success",
          });
          setWarehouseBMoveRows([]);
        }}
        row={warehouseBMoveRows[0] ?? null}
      />

      <EditDryingInspectionQtyDialog
        open={Boolean(dryingInspectionQtyEditRow)}
        row={dryingInspectionQtyEditRow}
        onClose={() => setDryingInspectionQtyEditRow(null)}
        onSave={(targetRow, entry) => {
          const inspectedLeaves = entry.passQty + entry.failQty;
          const patch = {
            passQty: String(entry.passQty),
            failQty: String(entry.failQty),
            noOfLeaves: String(inspectedLeaves),
            totalLeaves: String(inspectedLeaves),
            inspectionDate: entry.inspectionDate,
            remark: entry.remark,
            ...(entry.attachment
              ? {
                  inspectionImage: entry.attachment.dataUrl,
                  inspectionImageName: entry.attachment.name,
                }
              : {}),
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
                passQty: entry.passQty,
                failQty: entry.failQty,
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
        onPass={(targetRow, decisionRemark, inspectionDateVal, counts, attachment) => {
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
              ...(attachment
                ? {
                    inspectionImage: attachment.dataUrl,
                    inspectionImageName: attachment.name,
                  }
                : {}),
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
            ...(attachment
              ? {
                  inspectionImage: attachment.dataUrl,
                  inspectionImageName: attachment.name,
                }
              : {}),
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
        onFail={(targetRow, decisionRemark, inspectionDateVal, counts, attachment) => {
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
            ...(attachment
              ? {
                  inspectionImage: attachment.dataUrl,
                  inspectionImageName: attachment.name,
                }
              : {}),
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

      <FinishingCreateDialog
        open={Boolean(finishingCreateRow)}
        row={finishingCreateRow}
        onClose={() => setFinishingCreateRow(null)}
        onSave={(entry) => {
          if (!finishingCreateRow) return;

          const snapshot = buildFinishingDoneSnapshot(finishingCreateRow, entry);
          const workItemId =
            typeof finishingCreateRow.workItemId === "string"
              ? finishingCreateRow.workItemId
              : finishingCreateRow.id.startsWith("factory-work-")
                ? finishingCreateRow.id
                : "";

          if (workItemId) {
            completeFactoryIssuedWork(workItemId, snapshot);
          } else {
            const issued = issueFactoryWork({
              destinationProcess: "Finishing",
              sourceProcess: "Finishing",
              sourceRow: finishingCreateRow,
              sourceSlug: "finishing",
            });
            completeFactoryIssuedWork(issued.id, snapshot);
          }

          const sampleNo = getSampleNoFromRow(finishingCreateRow);
          if (sampleNo) {
            markSampleProcessDone(sampleNo, "finishing");
          } else {
            issueFinishingToPacking(snapshot);
          }

          setFinishingCreateRow(null);
          setActiveTab("done");
        }}
      />

      <FinishingCreateDialog
        mode="edit"
        open={Boolean(finishingEditRow)}
        row={finishingEditRow}
        onClose={() => setFinishingEditRow(null)}
        onSave={(entry) => {
          if (!finishingEditRow) return;

          const snapshot = buildFinishingDoneSnapshot(finishingEditRow, entry);
          const workItemId =
            typeof finishingEditRow.workItemId === "string"
              ? finishingEditRow.workItemId
              : finishingEditRow.id.startsWith("factory-work-")
                ? finishingEditRow.id
                : "";

          if (workItemId) {
            updateFactoryIssuedWorkSnapshot(workItemId, snapshot);
          }

          setFinishingEditRow(null);
          setToastNotification({
            message: "Finishing item updated successfully.",
            severity: "success",
          });
        }}
      />

      <CncFlutingCreateDialog
        open={Boolean(flutingCreateRow)}
        row={flutingCreateRow}
        onClose={() => setFlutingCreateRow(null)}
        onSave={(entry) => {
          if (!flutingCreateRow) return;

          const snapshot = buildCncFlutingDoneSnapshot(flutingCreateRow, entry);
          const workItemId =
            typeof flutingCreateRow.workItemId === "string"
              ? flutingCreateRow.workItemId
              : flutingCreateRow.id.startsWith("factory-work-")
                ? flutingCreateRow.id
                : "";

          if (workItemId) {
            completeFactoryIssuedWork(workItemId, snapshot);
          } else {
            const issued = issueFactoryWork({
              destinationProcess: "CNC / Fluting",
              sourceProcess: "CNC / Fluting",
              sourceRow: flutingCreateRow,
              sourceSlug: "cnc-fluting",
            });
            completeFactoryIssuedWork(issued.id, snapshot);
          }

          const sampleNo = getSampleNoFromRow(flutingCreateRow);
          if (sampleNo) {
            markSampleProcessDone(sampleNo, "cnc-fluting");
          }

          setFlutingCreateRow(null);
          setActiveTab("done");
        }}
      />

      <CncFlutingCreateDialog
        mode="edit"
        open={Boolean(flutingEditRow)}
        row={flutingEditRow}
        onClose={() => setFlutingEditRow(null)}
        onSave={(entry) => {
          if (!flutingEditRow) return;

          const snapshot = buildCncFlutingDoneSnapshot(flutingEditRow, entry);
          const workItemId =
            typeof flutingEditRow.workItemId === "string"
              ? flutingEditRow.workItemId
              : flutingEditRow.id.startsWith("factory-work-")
                ? flutingEditRow.id
                : "";

          if (workItemId) {
            updateFactoryIssuedWorkSnapshot(workItemId, snapshot);
          }

          setFlutingEditRow(null);
          setToastNotification({
            message: "Fluting item updated successfully.",
            severity: "success",
          });
        }}
      />

      <EmbossingCreateDialog
        open={Boolean(embossingCreateRow)}
        row={embossingCreateRow}
        onClose={() => setEmbossingCreateRow(null)}
        onSave={(entry) => {
          if (!embossingCreateRow) return;

          const snapshot = buildEmbossingDoneSnapshot(embossingCreateRow, entry);
          const workItemId =
            typeof embossingCreateRow.workItemId === "string"
              ? embossingCreateRow.workItemId
              : embossingCreateRow.id.startsWith("factory-work-")
                ? embossingCreateRow.id
                : "";

          if (workItemId) {
            completeFactoryIssuedWork(workItemId, snapshot);
          } else {
            const issued = issueFactoryWork({
              destinationProcess: "Embossing",
              sourceProcess: "Embossing",
              sourceRow: embossingCreateRow,
              sourceSlug: "embossing",
            });
            completeFactoryIssuedWork(issued.id, snapshot);
          }

          const sampleNo = getSampleNoFromRow(embossingCreateRow);
          if (sampleNo) {
            markSampleProcessDone(sampleNo, "embossing");
          }

          setEmbossingCreateRow(null);
          setActiveTab("done");
        }}
      />

      <EmbossingCreateDialog
        mode="edit"
        open={Boolean(embossingEditRow)}
        row={embossingEditRow}
        onClose={() => setEmbossingEditRow(null)}
        onSave={(entry) => {
          if (!embossingEditRow) return;

          const snapshot = buildEmbossingDoneSnapshot(embossingEditRow, entry);
          const workItemId =
            typeof embossingEditRow.workItemId === "string"
              ? embossingEditRow.workItemId
              : embossingEditRow.id.startsWith("factory-work-")
                ? embossingEditRow.id
                : "";

          if (workItemId) {
            updateFactoryIssuedWorkSnapshot(workItemId, snapshot);
          }

          setEmbossingEditRow(null);
          setToastNotification({
            message: "Embossing item updated successfully.",
            severity: "success",
          });
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

      <DryingCreateDialog
        maximumLeaves={getDryingEditLimits(dryingEditRow).maximumLeaves}
        minimumLeaves={getDryingEditLimits(dryingEditRow).minimumLeaves}
        mode="edit"
        open={Boolean(dryingEditRow)}
        row={dryingEditRow}
        onClose={() => setDryingEditRow(null)}
        onSave={(entry) => {
          if (!dryingEditRow) return;
          updateDryingDoneItem(dryingEditRow, entry);
          setDryingEditRow(null);
          setToastNotification({
            message: "Drying item updated successfully.",
            severity: "success",
          });
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

          const rejectedId = `drying-rejected-${Date.now()}`;
          const rejectedRow = {
            ...dryingRejectRow,
            id: rejectedId,
            sourceDoneId: rowId,
            listingState: "rejected",
            issueDate: new Date().toISOString().slice(0, 10),
            noOfLeaves: String(rejectedLeaves),
            availableLeaves: String(rejectedLeaves),
            sqm: rejectedArea.sqm,
            sqf: rejectedArea.sqf,
            totalSqMeter: rejectedArea.sqm,
          } as Row;
          markDryingDoneRejected(rejectedRow);
          setRejectedDoneRows((current) => [rejectedRow, ...current]);
          setDryingRejectRow(null);
          setActiveTab("rejected");
        }}
      />

      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description="Are you sure you want to issue this item to inspection?"
        onClose={() => setDryingInspectionIssueRow(null)}
        onConfirm={() => {
          if (!dryingInspectionIssueRow) return;

          const rowId = String(dryingInspectionIssueRow.id);
          const patchedLeaves = dryingDoneLeafPatches[rowId];
          const trackedLeaves = dryingIssueStateMap[rowId]?.availableLeaves;
          const newlyIssued = Math.max(
            0,
            Math.floor(
              patchedLeaves !== undefined
                ? patchedLeaves
                : trackedLeaves !== undefined
                  ? trackedLeaves
                  : dryingLeafCount(dryingInspectionIssueRow),
            ),
          );
          if (newlyIssued <= 0) {
            setDryingInspectionIssueRow(null);
            return;
          }

          const remaining = 0;
          const prevIssued = dryingIssueStateMap[rowId]?.issuedLeaves ?? 0;
          const totalIssued = prevIssued + newlyIssued;
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
          const inspectionDateVal = new Date().toISOString().slice(0, 10);

          issueFactoryWork({
            destinationProcess: "Drying Inspection",
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
              issuedDate: inspectionDateVal,
              issueDate: inspectionDateVal,
            },
          });

          recordDryingInspectionIssue(rowId, newlyIssued);
          const updatedInStore = adjustDryingDoneLeaves(rowId, remaining, remainingArea, {
            issueForInspection: String(totalIssued),
            issuedForInspectionDate: inspectionDateVal,
            status: "Done",
          });
          if (!updatedInStore) {
            setDryingDoneLeafPatches((current) => ({
              ...current,
              [rowId]: remaining,
            }));
            setDryingDoneRemovedIds((current) =>
              current.includes(rowId) ? current : [...current, rowId],
            );
          }

          setDryingIssueStateMap((prev) => ({
            ...prev,
            [rowId]: {
              issuedLeaves: totalIssued,
              availableLeaves: remaining,
              status: "Done",
            },
          }));

          setDryingInspectionHistoryRows((current) => [
            {
              ...dryingInspectionIssueRow,
              id: `drying-history-${Date.now()}`,
              listingState: "history",
              issueDate: inspectionDateVal,
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
          setToastNotification({
            message: "Item issued to inspection successfully.",
            severity: "success",
          });
        }}
        open={Boolean(dryingInspectionIssueRow)}
        title="Issue to Inspection"
        tone="default"
      />

      <FactoryActionConfirmDialog
        confirmLabel="Reject"
        description={`Are you sure you want to reject this ${definition.title.toLowerCase()} item?`}
        onClose={() => setRejectConfirmRow(null)}
        onConfirm={() => {
          if (rejectConfirmRow) {
            rejectFactoryDoneRow(rejectConfirmRow);
          }
          setRejectConfirmRow(null);
        }}
        open={Boolean(rejectConfirmRow)}
        title={`Reject ${definition.title}`}
        tone="danger"
      />
      <FactoryActionConfirmDialog
        confirmLabel="Issue"
        description={issueConfirm?.description ?? ""}
        onClose={() => setIssueConfirm(null)}
        onConfirm={(warehouse) => {
          const run = issueConfirm?.run;
          setIssueConfirm(null);
          run?.(warehouse);
        }}
        open={Boolean(issueConfirm)}
        showWarehouse={Boolean(issueConfirm?.showWarehouse)}
        title={issueConfirm?.title ?? "Issue"}
      />
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description={
          splicingPressingIssueRows.length === 1
            ? "Are you sure you want to issue this item to Pressing?"
            : `Are you sure you want to issue ${splicingPressingIssueRows.length} items to Pressing?`
        }
        onClose={() => setSplicingPressingIssueRows([])}
        onConfirm={() => {
          splicingPressingIssueRows.forEach((row) => {
            issueToNextFactoryProcess({
              destinationProcess: "Pressing",
              row,
              sourceSlug: "splicing",
            });
          });
          const issuedIds = new Set(
            splicingPressingIssueRows.map((row) => row.id),
          );
          setSelectedListingRows((current) =>
            current.filter((row) => !issuedIds.has(row.id)),
          );
          if (splicingPressingIssueRows.length > 0) {
            setToastNotification({
              message: `Issued ${splicingPressingIssueRows.length} item(s) to Pressing successfully.`,
              severity: "success",
            });
          }
          setSplicingPressingIssueRows([]);
        }}
        open={splicingPressingIssueRows.length > 0}
        title="Issue to Pressing"
        tone="default"
      />
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description={
          marquetryPressingIssueRows.length === 1
            ? "Are you sure you want to issue this item to Pressing?"
            : `Are you sure you want to issue ${marquetryPressingIssueRows.length} items to Pressing?`
        }
        onClose={() => setMarquetryPressingIssueRows([])}
        onConfirm={() => {
          marquetryPressingIssueRows.forEach((row) => {
            issueToNextFactoryProcess({
              destinationProcess: "Pressing",
              row,
              sourceSlug: "marquetry",
            });
          });
          const issuedIds = new Set(
            marquetryPressingIssueRows.map((row) => row.id),
          );
          setSelectedListingRows((current) =>
            current.filter((row) => !issuedIds.has(row.id)),
          );
          if (marquetryPressingIssueRows.length > 0) {
            setToastNotification({
              message: `Issued ${marquetryPressingIssueRows.length} item(s) to Pressing successfully.`,
              severity: "success",
            });
          }
          setMarquetryPressingIssueRows([]);
        }}
        open={marquetryPressingIssueRows.length > 0}
        title="Issue to Pressing"
        tone="default"
      />
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description={
          flutingFinishingIssueRows.length === 1
            ? "Are you sure you want to issue this item to Finishing?"
            : `Are you sure you want to issue ${flutingFinishingIssueRows.length} items to Finishing?`
        }
        onClose={() => setFlutingFinishingIssueRows([])}
        onConfirm={() => {
          flutingFinishingIssueRows.forEach((row) => {
            issueToNextFactoryProcess({
              destinationProcess: "Finishing",
              row,
              sourceSlug: "cnc-fluting",
            });
          });
          const issuedIds = new Set(
            flutingFinishingIssueRows.map((row) => row.id),
          );
          setSelectedListingRows((current) =>
            current.filter((row) => !issuedIds.has(row.id)),
          );
          if (flutingFinishingIssueRows.length > 0) {
            setToastNotification({
              message: `Issued ${flutingFinishingIssueRows.length} item(s) to Finishing successfully.`,
              severity: "success",
            });
          }
          setFlutingFinishingIssueRows([]);
        }}
        open={flutingFinishingIssueRows.length > 0}
        title="Issue to Finishing"
        tone="default"
      />
      <FinishingIssueToPackingDialog
        onClose={() => setFinishingPackingIssueRow(null)}
        onSubmit={(row, entry) => {
          const availableSheets = Number(
            row.availableSheets ??
              row.finishedSheets ??
              row.outputNoOfSheets ??
              row.noOfSheets ??
              0,
          );
          issueFinishingToPacking({
            ...row,
            availableSheets: String(
              Math.max(0, availableSheets - entry.issueSheets),
            ),
            issuedNoOfSheets: String(entry.issueSheets),
            noOfSheets: String(entry.issueSheets),
            packingDate: entry.packingDate,
            remark: entry.remark || row.remark,
          });
          setToastNotification({
            message: `Issued ${entry.issueSheets} sheet(s) to Packing successfully.`,
            severity: "success",
          });
          setSelectedListingRows((current) =>
            current.filter((selectedRow) => selectedRow.id !== row.id),
          );
          setFinishingPackingIssueRow(null);
        }}
        open={Boolean(finishingPackingIssueRow)}
        row={finishingPackingIssueRow}
      />
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description={
          embossingFinishingIssueRows.length === 1
            ? "Are you sure you want to issue this item to Finishing?"
            : `Are you sure you want to issue ${embossingFinishingIssueRows.length} items to Finishing?`
        }
        onClose={() => setEmbossingFinishingIssueRows([])}
        onConfirm={() => {
          embossingFinishingIssueRows.forEach((row) => {
            issueToNextFactoryProcess({
              destinationProcess: "Finishing",
              row,
              sourceSlug: "embossing",
            });
          });
          const issuedIds = new Set(
            embossingFinishingIssueRows.map((row) => row.id),
          );
          setSelectedListingRows((current) =>
            current.filter((row) => !issuedIds.has(row.id)),
          );
          if (embossingFinishingIssueRows.length > 0) {
            setToastNotification({
              message: `Issued ${embossingFinishingIssueRows.length} item(s) to Finishing successfully.`,
              severity: "success",
            });
          }
          setEmbossingFinishingIssueRows([]);
        }}
        open={embossingFinishingIssueRows.length > 0}
        title="Issue to Finishing"
        tone="default"
      />
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description={
          finishingPackingIssueRows.length === 1
            ? "Are you sure you want to issue this item to Packing?"
            : `Are you sure you want to issue ${finishingPackingIssueRows.length} selected items to Packing? Sample items will be skipped.`
        }
        onClose={() => setFinishingPackingIssueRows([])}
        onConfirm={() => {
          const eligibleRows = finishingPackingIssueRows.filter(
            (row) => !isSampleFactoryRow(row),
          );
          eligibleRows.forEach((row) => issueFinishingToPacking(row));
          setSelectedListingRows([]);
          setToastNotification({
            message:
              eligibleRows.length > 0
                ? `Issued ${eligibleRows.length} item(s) to Packing successfully.`
                : "No selected items are eligible to issue to Packing.",
            severity: eligibleRows.length > 0 ? "success" : "warning",
          });
          setFinishingPackingIssueRows([]);
        }}
        open={finishingPackingIssueRows.length > 0}
        title="Issue to Packing"
        tone="default"
      />

      {/* Confirmation Dialog: Revert */}
      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Revert"
        description="Are you sure you want to revert this item? This action will move it back to the previous state."
        onClose={() => setConfirmRevertRow(null)}
        onConfirm={() => {
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
              setToastNotification({
                message: "Item reverted to Drying Issued successfully.",
                severity: "success",
              });
            } else if (type === "inspection-done") {
              const workItemId = getFactoryString(row.workItemId);
              if (workItemId) {
                revertFactoryIssuedWork(workItemId);
              }
              if (definition.slug === "sawing-inspection") {
                restoreSawingDoneFromInspection(
                  getFactoryString(row.sourceDoneId) || getFactoryString(row.sourceRowId),
                );
              }
              if (definition.slug === "drying-inspection") {
                const sourceDoneId =
                  getFactoryString(row.sourceDoneId) || getFactoryString(row.sourceRowId);
                const leaves = Math.max(
                  0,
                  Math.floor(Number(String(row.noOfLeaves ?? row.totalLeaves ?? "0").replace(/[^\d.]/g, "")) || 0),
                );
                if (sourceDoneId && leaves > 0) {
                  restoreDryingDoneLeaves(sourceDoneId, leaves, row);
                  releaseDryingInspectionIssue(sourceDoneId, leaves);
                }
              }
              setInspectionCompletedRows((current) =>
                current.filter((entry) => entry.id !== row.id),
              );
              (definition.rows as any) = (definition.rows as any).map((r: any) =>
                r.id === row.id
                  ? { ...r, listingState: "issued", qcStatus: "Recheck", isRecheck: true }
                  : r,
              );
              setActiveTab("issued");
              setToastNotification({
                message: "Item reverted to Inspection Issued successfully.",
                severity: "success",
              });
            } else if (type === "inspection-failed") {
              if (definition.slug === "sawing-inspection") {
                restoreSawingDoneFromInspection(
                  getFactoryString(row.sourceDoneId) || getFactoryString(row.sourceRowId),
                );
              }
              if (definition.slug === "drying-inspection") {
                const sourceDoneId =
                  getFactoryString(row.sourceDoneId) || getFactoryString(row.sourceRowId);
                const leaves = Math.max(
                  0,
                  Math.floor(Number(String(row.noOfLeaves ?? row.totalLeaves ?? "0").replace(/[^\d.]/g, "")) || 0),
                );
                if (sourceDoneId && leaves > 0) {
                  restoreDryingDoneLeaves(sourceDoneId, leaves, row);
                  releaseDryingInspectionIssue(sourceDoneId, leaves);
                }
              }
              setInspectionFailedRows((current) =>
                current.filter((entry) => entry.id !== row.id),
              );
              setInspectionCompletedRows((current) =>
                current.filter((entry) => entry.id !== row.id),
              );
              (definition.rows as any) = (definition.rows as any).map((r: any) =>
                r.id === row.id
                  ? { ...r, listingState: "issued", qcStatus: "Recheck", isRecheck: true }
                  : r,
              );
              setActiveTab("issued");
              setToastNotification({
                message: "Failed item reverted to Inspection Issued successfully.",
                severity: "success",
              });
            } else if (type === "issued" && definition.slug === "drying") {
              const sourceDoneId =
                getFactoryString(row.sourceRowId) || getFactoryString(row.sourceDoneId);
              const leaves = Math.max(
                0,
                Math.floor(
                  Number(String(row.noOfLeaves ?? row.receivedLeaves ?? "0").replace(/[^\d.]/g, "")) || 0,
                ),
              );
              if (sourceDoneId && leaves > 0) {
                restoreSlicingDoneLeaves(sourceDoneId, leaves);
              }
              const workItemId =
                getFactoryString(row.workItemId) ||
                (String(row.id).startsWith("factory-work-") ? String(row.id) : "");
              if (workItemId) {
                removeFactoryIssuedWork(workItemId);
              } else {
                setRevertedRowIds((current) =>
                  current.includes(row.id) ? current : [...current, row.id],
                );
              }
              setToastNotification({
                message: "Item reverted to Slicing Done successfully.",
                severity: "success",
              });
            } else if (type === "rejected" && definition.slug === "slicing") {
              clearSlicingDoneRejected(row);
              setRejectedDoneRows((current) => current.filter((item) => item.id !== row.id));
              setToastNotification({
                message: "Item reverted to Slicing Done successfully.",
                severity: "success",
              });
            } else if (type === "rejected" && definition.slug === "drying") {
              clearDryingDoneRejected(String(row.id));
              setRejectedDoneRows((current) => current.filter((item) => item.id !== row.id));
              setToastNotification({
                message: "Item reverted to Drying Done successfully.",
                severity: "success",
              });
            } else {
              if (type === "rejected") {
                setRejectedDoneRows((current) =>
                  current.filter((item) => item.id !== row.id),
                );
              }
              setRevertedRowIds((current) =>
                current.includes(row.id) ? current : [...current, row.id],
              );
              setToastNotification({
                message: `Item reverted successfully.`,
                severity: "success",
              });
            }
          }
          setConfirmRevertRow(null);
        }}
        open={Boolean(confirmRevertRow)}
        title="Confirm Revert"
        tone="danger"
      />

      <IssueForDryingDialog
        onClose={() => {
          setIssueDryingRows([]);
          setConfirmIssueDryingOpen(false);
        }}
        onConfirm={(entries) => {
          entries.forEach(({ leaves, remark, row: selectedRow }) => {
            const availableLeaves = Math.max(
              0,
              Number(
                selectedRow.availableLeaves ??
                  selectedRow.receivedLeaves ??
                  selectedRow.noOfLeaves ??
                  0,
              ) || 0,
            );
            const remainingLeaves = Math.max(0, availableLeaves - leaves);
            const issuedRow = {
              ...selectedRow,
              availableLeaves: String(leaves),
              noOfLeaves: String(leaves),
              receivedLeaves: String(leaves),
              remark: remark || selectedRow.remark || "",
              totalLeaves: String(leaves),
            } as Row;
            issueFactoryWork({
              destinationProcess: "Drying",
              sourceSlug: definition.slug,
              sourceProcess: "Slicing",
              sourceWarehouseName: getFactoryString(selectedRow.warehouseName),
              sourceRow: issuedRow,
            });
            updateSlicingDoneAvailableLeaves(selectedRow, remainingLeaves);
          });
          const issuedIds = new Set(entries.map(({ row }) => row.id));
          setSelectedListingRows((current) => current.filter((row) => !issuedIds.has(row.id)));
          setIssueDryingRows([]);
          setConfirmIssueDryingOpen(false);
          setToastNotification({
            message: `Issued ${entries.reduce((total, entry) => total + entry.leaves, 0)} leaves from ${issuedIds.size} item(s) to Drying successfully.`,
            severity: "success",
          });
        }}
        open={confirmIssueDryingOpen}
        rows={issueDryingRows}
      />

      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Issue"
        description="Are you sure you want to issue the selected item(s) for inspection?"
        onClose={() => setConfirmIssueInspectionOpen(false)}
        onConfirm={() => {
          let issuedCount = 0;
          const inspectionDateVal = new Date().toISOString().slice(0, 10);

          selectedListingRows.forEach((selectedRow, index) => {
            const rowId = String(selectedRow.id);
            const patchedLeaves = dryingDoneLeafPatches[rowId];
            const trackedLeaves = dryingIssueStateMap[rowId]?.availableLeaves;
            const newlyIssued = Math.max(
              0,
              Math.floor(
                patchedLeaves !== undefined
                  ? patchedLeaves
                  : trackedLeaves !== undefined
                    ? trackedLeaves
                    : dryingLeafCount(selectedRow),
              ),
            );
            if (newlyIssued <= 0) return;

            issuedCount += 1;
            const prevIssued = dryingIssueStateMap[rowId]?.issuedLeaves ?? 0;
            const totalIssued = prevIssued + newlyIssued;
            const issuedArea = dryingLeafArea(
              selectedRow.length,
              selectedRow.width,
              newlyIssued,
            );
            const remainingArea = dryingLeafArea(
              selectedRow.length,
              selectedRow.width,
              0,
            );

            issueFactoryWork({
              destinationProcess: "Drying Inspection",
              sourceSlug: definition.slug,
              sourceProcess: "Drying",
              sourceWarehouseName: getFactoryString(selectedRow.warehouseName),
              sourceRow: {
                ...selectedRow,
                issuedLeaves: String(newlyIssued),
                noOfLeaves: String(newlyIssued),
                totalLeaves: String(newlyIssued),
                availableLeaves: String(newlyIssued),
                noOfSheets: String(newlyIssued),
                totalSqMeter: issuedArea.sqm,
                sqm: issuedArea.sqm,
                sqf: issuedArea.sqf,
                issuedDate: inspectionDateVal,
                issueDate: inspectionDateVal,
              },
            });

            recordDryingInspectionIssue(rowId, newlyIssued);
            const updatedInStore = adjustDryingDoneLeaves(
              rowId,
              0,
              remainingArea,
              {
                issueForInspection: String(totalIssued),
                issuedForInspectionDate: inspectionDateVal,
                status: "Done",
              },
            );
            if (!updatedInStore) {
              setDryingDoneLeafPatches((current) => ({
                ...current,
                [rowId]: 0,
              }));
              setDryingDoneRemovedIds((current) =>
                current.includes(rowId) ? current : [...current, rowId],
              );
            }

            setDryingIssueStateMap((current) => ({
              ...current,
              [rowId]: {
                issuedLeaves: totalIssued,
                availableLeaves: 0,
                status: "Done",
              },
            }));

            setDryingInspectionHistoryRows((current) => [
              {
                ...selectedRow,
                id: `drying-history-${Date.now()}-${index}`,
                listingState: "history",
                issueDate: inspectionDateVal,
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
          });
          setSelectedListingRows([]);
          setConfirmIssueInspectionOpen(false);
          setToastNotification({
            message:
              issuedCount > 0
                ? `Issued ${issuedCount} item(s) to Drying Inspection successfully.`
                : "No selected items have leaves available to issue.",
            severity: issuedCount > 0 ? "success" : "warning",
          });
        }}
        open={confirmIssueInspectionOpen}
        title="Confirm Issue for Inspection"
        tone="default"
      />

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
    </>
  );
}

function GroupingOrderItemDetailsDialog({
  details,
  onClose,
}: {
  details: GroupingOrderItemDetails | null;
  onClose: () => void;
}) {
  const order = details?.order;
  const item = details?.lineItem;
  const row = details?.row;
  const stage = details?.stageLabel?.trim() || "Process";
  const orderType = String(order?.orderType ?? row?.orderType ?? "");
  const isFinishedOrder =
    /finished/i.test(orderType) ||
    Boolean(item?.baseType || row?.baseType || item?.baseName || item?.finishedType);

  const baseTypeVal = item?.baseType || (row?.baseType as string) || (isFinishedOrder ? "Plywood" : "");
  const baseNameVal = item?.baseName || (baseTypeVal ? `${baseTypeVal} Base` : "");
  const baseLengthVal = item?.baseLength || item?.length || (row?.length as string) || "";
  const baseWidthVal = item?.baseWidth || item?.width || (row?.width as string) || "";
  const baseThicknessVal = item?.baseThickness || (row?.baseThickness as string) || "12 mm";

  const hasBaseDetails = isFinishedOrder || Boolean(baseTypeVal);

  const leftSections = details
    ? [
        {
          title: "Order Reference",
          columns: 2 as const,
          fields: [
            ["Order No.", detailText(order?.orderNo ?? row?.orderNo)],
            ["Order Item No.", detailText(details.orderItemNo)],
            ["Order Type", detailText(order?.orderType ?? row?.orderType ?? "Raw Order")],
            ["Customer Name", detailText(order?.customerName ?? row?.customerName)],
            ["Order Date", detailText(order?.orderDate ?? row?.orderDate)],
            ["Required Delivery Date", detailText(order?.deliveryDate ?? row?.deliveryDate ?? row?.orderDate)],
          ],
        },
        {
          title: `${stage} Requirement`,
          columns: 2 as const,
          fields: [
            ["Product Category", detailText(item?.productCategory ?? row?.productCategory ?? (row?.productType ? `${row.productType} Veneer` : "Raw Veneer"))],
            ["Finished Type", detailText(item?.finishedType ?? row?.finishedType ?? row?.productType ?? "-")],
            ["Sales Item Name", detailText(item?.salesItemName ?? row?.salesItemName ?? item?.itemName ?? row?.itemName)],
            ["Item Name", detailText(item?.itemName ?? row?.itemName)],
            ["Sub Category", detailText(item?.subCategory ?? row?.subCategory ?? row?.itemSubCategory)],
            ["Grade", detailText(item?.grade ?? row?.grade)],
          ],
        },
      ]
    : [];

  const rightSections = details
    ? [
        {
          title: "Dimensions",
          columns: 3 as const,
          fields: [
            ["Length", detailText(item?.length ?? row?.length)],
            ["Width", detailText(item?.width ?? row?.width)],
            ["Thickness", detailText(item?.thickness ?? row?.thickness ?? row?.height ?? row?.veneerThickness)],
          ],
        },
        ...(hasBaseDetails
          ? [
              {
                title: "Base Details",
                columns: 2 as const,
                fields: [
                  ["Base Type", detailText(baseTypeVal)],
                  ["Base Name", detailText(baseNameVal)],
                  ["Base Length", detailText(baseLengthVal)],
                  ["Base Width", detailText(baseWidthVal)],
                  ["Base Thickness", detailText(baseThicknessVal)],
                ],
              },
            ]
          : []),
        {
          title: "Required Quantity",
          columns: 3 as const,
          fields: [
            ["No. of Sheets", detailText(item?.quantitySheets ?? row?.noOfSheets)],
            ["SQM", detailText(item?.sqm ?? row?.sqm)],
            ["Total SQM", detailText(item?.totalSqm ?? row?.totalSqm ?? row?.sqf)],
          ],
        },
        {
          title: `${stage} Instructions`,
          columns: 1 as const,
          fields: [
            ["Remark", detailText(item?.remark ?? row?.remark ?? row?.instructions)],
          ],
        },
      ]
    : [];

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      open={Boolean(details)}
      onClose={onClose}
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
          bgcolor: theme.customTokens.surfaces.surface,
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
            bgcolor: theme.customTokens.brand.primary,
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
          <Typography sx={{ fontSize: 17, fontWeight: 750 }}>
            Order Item Details
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12.5 }}>
            Order-item information required at the {details?.stageLabel ?? "Grouping"} stage
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ bgcolor: "background.default", p: "14px !important" }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          }}
        >
          <Stack spacing={1.5}>
            {leftSections.map((section) => (
              <OrderDetailSection
                columns={section.columns}
                fields={section.fields}
                key={section.title}
                title={section.title}
              />
            ))}
          </Stack>
          <Stack spacing={1.5}>
            {rightSections.map((section) => (
              <OrderDetailSection
                columns={section.columns}
                fields={section.fields}
                key={section.title}
                title={section.title}
              />
            ))}
          </Stack>
          {leftSections.length === 0 && rightSections.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 3, textAlign: "center" }}>
              No additional order-item details are available.
            </Typography>
          ) : null}
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

function OrderDetailSection({
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
        bgcolor: theme.customTokens.surfaces.surface,
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
          gridTemplateColumns: {
            xs: "1fr",
            sm: `repeat(${columns}, minmax(0, 1fr))`,
          },
        }}
      >
        {fields.map(([label, value]) => (
          <Box
            key={label}
            sx={(theme) => ({
              bgcolor: theme.customTokens.surfaces.alt,
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

