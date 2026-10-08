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
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
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
  getOriginalGroupedSheets,
  useGroupedStockSampleIssues,
} from "./groupedStockIssueStore";
import {
  factoryIssuedWorkToRow,
  completeFactoryIssuedWork,
  failFactoryIssuedWork,
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
import { moveFactoryRowToWarehouseC } from "../../warehouses/shared/warehouseCTransferStore";
import { moveFactoryRowToWarehouseB } from "../../warehouses/shared/warehouseBTransferStore";

type ListingTab = FactoryProcessTab;

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
  const urlTab = searchParams.get("tab") as ListingTab | null;
  const [activeTabState, setActiveTabState] = useState<ListingTab>(() => urlTab || "issued");
  const activeTab = urlTab || activeTabState;

  const setActiveTab = (newTab: ListingTab) => {
    setActiveTabState(newTab);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tab", newTab);
      return next;
    });
  };

  const [searchValue, setSearchValue] = useState("");
  const [revertedRowIds, setRevertedRowIds] = useState<string[]>([]);
  const [confirmRevertRow, setConfirmRevertRow] = useState<{ row: Row; type: "issued" | "rejected" } | null>(null);
  const [confirmIssueDryingOpen, setConfirmIssueDryingOpen] = useState(false);
  const [confirmIssueInspectionOpen, setConfirmIssueInspectionOpen] = useState(false);
  const [rejectedDoneRows, setRejectedDoneRows] = useState<Row[]>([]);
  const [inspectionCompletedRows, setInspectionCompletedRows] = useState<Row[]>([]);
  const [inspectionFailedRows, setInspectionFailedRows] = useState<Row[]>([]);
  const [inspectionDecisionTargetRow, setInspectionDecisionTargetRow] = useState<Row | null>(null);
  const [splicingOrderIssue, setSplicingOrderIssue] =
    useState<SplicingOrderIssueState<Row> | null>(null);
  const [groupingSampleIssue, setGroupingSampleIssue] =
    useState<GroupingSampleIssueState<Row> | null>(null);
  const [groupingOrderIssue, setGroupingOrderIssue] =
    useState<GroupingOrderIssueState<Row> | null>(null);
  const [dryingInspectionIssueRow, setDryingInspectionIssueRow] =
    useState<Row | null>(null);
  const [dryingIssueStateMap, setDryingIssueStateMap] = useState<
    Record<string, { issuedLeaves: number; availableLeaves: number; status: "Pending" | "Partially Done" | "Done" }>
  >({});
  const [inspectionTrackingMap, setInspectionTrackingMap] = useState<
    Record<string, { passQty: number; failQty: number; availableLeaves: number; status: "Pending" | "Partially Pending" | "Done" }>
  >({});
  const groupedStockIssues = useGroupedStockSampleIssues();
  const sampleSheetRecords = useSampleSheetRecords();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
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

    return [...issuedWorkRows, ...rowsForTab]
      .filter(
        (row) =>
          !revertedRowIds.includes(row.id) &&
          !(activeTab === "done" && rejectedDoneRowIds.has(row.id)),
      )
      .map((row) => {
        const sourceNormalizedRow = {
          ...normalizeFactorySourceColumns(row, definition.slug),
          ...(definition.slug === "marquetry"
            ? { issuedFrom: "Inventory" }
            : {}),
        } as Row;

        if (isGroupingModule) {
          const available = getAvailableGroupedSheets(sourceNormalizedRow);
          const original = getOriginalGroupedSheets(sourceNormalizedRow);
          const currentIssueTo = sourceNormalizedRow.issueTo || sourceNormalizedRow.for || "Order";

          return {
            ...sourceNormalizedRow,
            groupPhoto: sourceNormalizedRow.groupPhoto || "https://images.unsplash.com/photo-1546484475-7f7bd55792da?auto=format&fit=crop&w=400&q=80",
            issueTo: currentIssueTo,
            availableSheets: isGroupingDoneTab ? String(available) : sourceNormalizedRow.availableSheets,
            noOfSheets: isGroupingDoneTab ? String(original) : sourceNormalizedRow.noOfSheets,
            for: currentIssueTo,
            forLabel: currentIssueTo,
          } as Row;
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
          return {
            ...sourceNormalizedRow,
            qcStatus: sourceNormalizedRow.qcStatus ?? defaultStatus,
            status: activeTab === "issued" ? inspStatus : (sourceNormalizedRow.status ?? defaultStatus),
            availableLeaves: String(availableLeaves),
          } as Row;
        }

        if (definition.slug === "drying" && activeTab === "done") {
          const rowId = String(sourceNormalizedRow.id);
          const origLeaves = Number(sourceNormalizedRow.noOfLeaves ?? sourceNormalizedRow.noOfSheets ?? 0) || 0;
          const tracking = dryingIssueStateMap[rowId];
          const issuedLeaves = tracking ? tracking.issuedLeaves : 0;
          const availableLeaves = tracking ? tracking.availableLeaves : origLeaves;
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
  }, [
    activeTab,
    definition.rows,
    definition.slug,
    dryingIssueStateMap,
    factoryIssuedWorkItems,
    groupedStockIssues,
    isGroupingDoneTab,
    inspectionCompletedRows,
    isInspectionModule,
    rejectedDoneRowIds,
    rejectedDoneRows,
    revertedRowIds,
    sampleSheetRecords,
    supportsSamplePurposeColumn,
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
      columns = columns.filter((column) => column.key !== "groupNo");
    }

    if (isGroupingModule && activeTab === "issued") {
      columns = columns.filter(
        (column) =>
          column.key !== "groupNo" &&
          column.key !== "groupPhoto" &&
          column.key !== "issueTo",
      );
    }

    if (supportsSamplePurposeColumn) {
      columns = withOptionalColumn(
        columns,
        {
          key: "for",
          label: "For",
        },
        "itemName",
      );
    }

    if (isGroupingDoneTab) {
      columns = columns.filter((column) => column.key !== "issueTo");
      return withOptionalColumn(columns, {
        key: "availableSheets",
        label: "Available Sheets",
      });
    }

    if (isInspectionModule && (activeTab === "done" || activeTab === "failed")) {
      return withOptionalColumn(columns, {
        key: "qcStatus",
        label: "QC Status",
      });
    }

    if (definition.slug === "slicing" && activeTab === "issued") {
      return [
        { key: "storageSrNo", label: "Storage Sr No." },
        { key: "issueDate", label: "Issue Date" },
        { key: "itemName", label: "Item Name" },
        { key: "subCategory", label: "Sub Category" },
        { key: "batchNo", label: "Log No." },
        { key: "length", label: "Length" },
        { key: "width", label: "Width" },
        { key: "height", label: "Height" },
        { key: "receivedCbm", label: "Received CBM" },
        { key: "availableCbm", label: "Available CBM" },
        { key: "remark", label: "Remark" },
        { key: "createdBy", label: "Created" },
        { key: "updatedBy", label: "Updated" },
      ];
    }

    if (definition.slug === "slicing" && activeTab === "done") {
      const insertIdx = columns.findIndex((col) => col.key === "totalSqMeter");
      const mapped = columns.map((col) =>
        col.key === "issueDate" ? { ...col, label: "Slicing Date" } : col,
      );
      if (insertIdx >= 0) {
        columns = [
          ...mapped.slice(0, insertIdx),
          { key: "sqm", label: "SQM" },
          { key: "sqf", label: "SQF" },
          ...mapped.slice(insertIdx + 1),
        ];
      } else {
        columns = mapped;
      }
    }

    if (definition.slug === "slicing" && activeTab === "history") {
      columns = columns.map((col) =>
        col.key === "issueDate" || col.key === "processDate"
          ? { ...col, label: "Issued for Drying Date" }
          : col,
      );
    }

    if (definition.slug === "slicing" && activeTab === "rejected") {
      columns = columns.map((col) =>
        col.key === "issueDate" || col.key === "processDate"
          ? { ...col, label: "Rejected Date" }
          : col,
      );
    }

    if (definition.slug === "drying" && activeTab === "done") {
      columns = columns.map((col) =>
        col.key === "issueDate" ? { ...col, label: "Drying Date" } : col,
      );
      const insertIndex = columns.findIndex((col) => col.key === "noOfLeaves");
      const extraCols = [
        { key: "issueForInspection", label: "Issue for Inspection" },
        { key: "availableLeaves", label: "Available Leaves" },
        { key: "status", label: "Status" },
      ];
      if (insertIndex >= 0) {
        columns = [
          ...columns.slice(0, insertIndex + 1),
          ...extraCols,
          ...columns.slice(insertIndex + 1),
        ];
      } else {
        columns = [...columns, ...extraCols];
      }
    }

    if (definition.slug === "drying" && activeTab === "history") {
      columns = columns.map((col) =>
        col.key === "issueDate" || col.key === "processDate"
          ? { ...col, label: "Issued Drying Date" }
          : col,
      );
    }

    if (definition.slug === "drying" && activeTab === "rejected") {
      columns = columns.map((col) =>
        col.key === "issueDate" || col.key === "processDate"
          ? { ...col, label: "Rejected Date" }
          : col,
      );
    }

    if (
      (definition.slug === "drying-inspection" || definition.slug === "inspection") &&
      activeTab === "issued"
    ) {
      columns = columns.map((col) =>
        col.key === "issueDate" || col.key === "issuedDate"
          ? { ...col, label: "Issued Inspection Date" }
          : col,
      );
      const insertIndex = columns.findIndex((col) => col.key === "noOfLeaves");
      const inspCols = [
        { key: "status", label: "Status" },
      ];
      if (insertIndex >= 0) {
        columns = [
          ...columns.slice(0, insertIndex + 1),
          ...inspCols,
          ...columns.slice(insertIndex + 1),
        ];
      } else {
        columns = [...columns, ...inspCols];
      }
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
      return filteredRows.map(
        (row) =>
          ({
            ...row,
            issuedFor: getPressingDoneIssuedForLabel(row.issuedFor),
          }) as Row,
      );
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

      if (activeTab === "issued" && canCreate && !isInspectionModule) {
        baseActions.unshift({
          id: "create-process",
          label: `Create ${definition.title}`,
          icon: Plus,
          tone: "primary",
          onSelect: (row) =>
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
            }),
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
    [activeTab, canCreate, canEdit, canView, definition.title, navigate, paths],
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
      return (row) => {
        return [
          ...doneActions,
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
        ];
      };
    }

    if (isInspectionModule && activeTab === "issued") {
      return (row) => [
        ...(canView
          ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (selectedRow: Row) => navigate(paths.view(selectedRow.id), { state: { record: selectedRow, tab: activeTab } }),
            },
          ]
          : []),
        ...(canCreate || canEdit
          ? [
            {
              id: "inspect",
              label: "Inspect",
              icon: Plus,
              tone: "primary" as const,
              onSelect: (selectedRow: Row) => {
                setInspectionDecisionTargetRow(selectedRow);
              },
            },
          ]
          : []),
      ];
    }

    if (isInspectionModule && activeTab === "done") {
      const isSawingInspection = definition.slug === "sawing-inspection";
      return (row) => [
        ...(canView
          ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (selectedRow: Row) => navigate(paths.view(selectedRow.id), { state: { record: selectedRow, tab: activeTab } }),
            },
          ]
          : []),
        ...(!isSawingInspection && (canEdit || canCreate)
          ? [
            {
              id: "reject-inspection",
              label: "Reject Inspection",
              icon: XCircle,
              tone: "danger" as const,
              onSelect: (selectedRow: Row) => {
                const workItemId = getFactoryString(selectedRow.workItemId);
                if (workItemId) {
                  failFactoryIssuedWork(workItemId);
                } else {
                  setInspectionCompletedRows((current) =>
                    current.filter((entry) => entry.id !== selectedRow.id),
                  );
                  setInspectionFailedRows((current) =>
                    current.some((entry) => entry.id === selectedRow.id)
                      ? current
                      : [...current, { ...selectedRow, listingState: "failed" }],
                  );
                }
                setActiveTab("failed");
              },
            },
          ]
          : []),
        ...(canCreate
          ? [
            {
              id: isSawingInspection ? "move-to-warehouse-c" : "move-to-warehouse-b",
              label: isSawingInspection ? "Move to Warehouse C" : "Move to Warehouse B",
              icon: Plus,
              tone: "primary" as const,
              onSelect: (selectedRow: Row) => {
                if (isSawingInspection) {
                  moveFactoryRowToWarehouseC(selectedRow);
                } else {
                  moveFactoryRowToWarehouseB(selectedRow);
                }
                setRevertedRowIds((current) =>
                  current.includes(selectedRow.id)
                    ? current
                    : [...current, selectedRow.id],
                );
              },
            },
          ]
          : []),
      ];
    }

    if (isInspectionModule && activeTab === "failed") {
      const isSawingInspection = definition.slug === "sawing-inspection";
      return (row) => [
        ...(canView
          ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (selectedRow: Row) => navigate(paths.view(selectedRow.id), { state: { record: selectedRow, tab: activeTab } }),
            },
          ]
          : []),
        ...(isSawingInspection && (canCreate || canEdit)
          ? [
            {
              id: "revert",
              label: "Revert",
              icon: RotateCcw,
              tone: "danger" as const,
              onSelect: (selectedRow: Row) => {
                setInspectionFailedRows((current) =>
                  current.filter((entry) => entry.id !== selectedRow.id),
                );
                // Return to pending tab with Recheck status
                setInspectionCompletedRows((current) =>
                  current.filter((entry) => entry.id !== selectedRow.id),
                );
                // Update row in definition so it appears in issued tab with Recheck
                (definition.rows as any) = (definition.rows as any).map((r: any) =>
                  r.id === selectedRow.id
                    ? { ...r, listingState: "issued", qcStatus: "Recheck", isRecheck: true }
                    : r
                );
                setActiveTab("issued");
              },
            },
          ]
          : []),
      ];
    }

    if (definition.slug === "finishing" && activeTab === "done") {
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
          return sampleActions;
        }

        return [
          ...rowActions,
          ...(canCreate
            ? [
              {
                id: "revert-item",
                label: "Revert",
                icon: RotateCcw,
                tone: "danger" as const,
                onSelect: (selectedRow: Row) =>
                  setRevertedRowIds((current) =>
                    current.includes(selectedRow.id)
                      ? current
                      : [...current, selectedRow.id],
                  ),
              },
              createSplicingOrderIssueAction<Row>((selectedRow) =>
                setSplicingOrderIssue({
                  issueDate: new Date(),
                  issueSheets: "",
                  orderItemNo: "",
                  orderNo: "",
                  orderType: "",
                  row: selectedRow,
                  submitted: false,
                }),
              ),
            ]
            : []),
          ...(canEdit || canCreate ? [rejectDoneAction] : []),
        ];
      };
    }

    if (isGroupingDoneTab) {
      return (row) => {
        const available = getAvailableGroupedSheets(row);
        const actions: EnterpriseTableAction<Row>[] = [];

        if (canView) {
          actions.push({
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: (selectedRow: Row) => navigate(paths.view(selectedRow.id)),
          });
        }

        if (canCreate && available > 0) {
          actions.push(
            createGroupingOrderIssueAction<Row>((selectedRow) =>
              setGroupingOrderIssue({
                issueDate: new Date(),
                issueSheets: "",
                orderItemNo: "",
                orderNo: "",
                orderType: "",
                row: selectedRow,
                submitted: false,
              }),
            ),
            createGroupingSampleIssueAction<Row>((selectedRow) =>
              setGroupingSampleIssue({
                issueDate: new Date(),
                issueSheets: "",
                nextProcess: "",
                remark: "",
                row: selectedRow,
                submitted: false,
              }),
            ),
          );
        }

        return actions;
      };
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
          sampleActions.push(
            createSampleIssueProcessAction("Pressing", (selectedRow) => {
              issueToNextFactoryProcess({
                destinationProcess: "Pressing",
                row: selectedRow,
                sourceSlug: definition.slug,
              });
            }),
          );
          return sampleActions;
        }

        if (canCreate && definition.slug === "splicing") {
          (["Finishing", "Fluting", "Embossing"] as const).forEach((process) => {
            sampleActions.push(
              createSampleIssueProcessAction(process, (selectedRow) => {
                issueToNextFactoryProcess({
                  destinationProcess: process,
                  row: selectedRow,
                  sourceSlug: definition.slug,
                });
              }),
            );
          });
          return sampleActions;
        }

        if (
          canCreate &&
          (definition.slug === "cnc-fluting" || definition.slug === "embossing")
        ) {
          sampleActions.push(
            createSampleIssueProcessAction("Finishing", (selectedRow) => {
              issueToNextFactoryProcess({
                destinationProcess: "Finishing",
                row: selectedRow,
                sourceSlug: definition.slug,
              });
            }),
          );
          return sampleActions;
        }

        if (canCreate && definition.slug === "pressing") {
          sampleActions.push(
            createSampleIssueProcessAction("Packing", (selectedRow) => {
              const sampleNo = getSampleNoFromRow(selectedRow);
              if (sampleNo) {
                issueSampleToProcess(sampleNo, "Packing");
              }
            }),
          );
          return sampleActions;
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
    inspectionCompletedRows,
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

    const selectedOrder = getSplicingSelectedOrder(
      orderRecords,
      splicingOrderIssue.orderNo,
    );
    const selectedOrderItem = getSplicingSelectedOrderItem(
      orderRecords,
      splicingOrderIssue,
    );
    const availableSheets = selectedOrderItem
      ? getOrderLineItemSheetsNumber(selectedOrderItem)
      : 0;
    const issueSheets = Number(splicingOrderIssue.issueSheets);
    const hasValidIssueSheets =
      splicingOrderIssue.issueSheets.length === 0 ||
      (Number.isInteger(issueSheets) &&
        issueSheets > 0 &&
        issueSheets <= availableSheets);

    if (!hasValidIssueSheets) {
      setSplicingOrderIssue((current) =>
        current ? { ...current, submitted: true } : current,
      );
      return;
    }

    const destinationProcess =
      normalizeSplicingOrderType(splicingOrderIssue.orderType) === "Marquetry"
        ? "Marquetry"
        : "Pressing";
    const sourceRow = selectedOrderItem
      ? buildSplicingOrderIssueSourceRow(
        splicingOrderIssue,
        selectedOrder,
        selectedOrderItem,
      )
      : splicingOrderIssue.row;

    issueFactoryWork({
      destinationProcess,
      purpose: "ORDER",
      orderNo: splicingOrderIssue.orderNo,
      orderItemNo: splicingOrderIssue.orderItemNo,
      sourceRow,
      sourceSlug: definition.slug,
      sourceProcess: definition.title,
      sourceWarehouseName: getFactoryRowWarehouseName(sourceRow),
    });

    setSplicingOrderIssue(null);
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
        subtitle={`Track ${definition.title.toLowerCase()} jobs and completed production.`}
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
                    onClick={() => setConfirmIssueDryingOpen(true)}
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
                      selectedListingRows.forEach((selectedRow) => {
                        moveFactoryRowToWarehouseC(selectedRow);
                      });
                      setRevertedRowIds((current) => [
                        ...current,
                        ...selectedListingRows.map((r) => r.id),
                      ]);
                      setSelectedListingRows([]);
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
              <FactoryToolbar />
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
          const basePatch = {
            inspectionDate: inspectionDateVal || new Date().toISOString().slice(0, 10),
            remark: decisionRemark || targetRow.remark || "Passed inspection",
            passQty: thisPass,
            failQty: thisFail,
            noOfLeaves: String(thisPass),
            totalLeaves: String(thisPass),
          };

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
            } else {
              setInspectionCompletedRows((current) => [...current, passRecord]);
            }
          }

          if (thisFail > 0) {
            const failRecord = {
              ...targetRow,
              ...basePatch,
              id: `insp-fail-${Date.now()}-${targetRow.id}`,
              qcStatus: "Fail",
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
            setActiveTab("done");
          }
        }}
        onFail={(targetRow, decisionRemark, inspectionDateVal, counts) => {
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

      <DryingInspectionIssueDialog
        open={Boolean(dryingInspectionIssueRow)}
        row={dryingInspectionIssueRow}
        onClose={() => setDryingInspectionIssueRow(null)}
        onSubmit={(issueLeaves, totalLeaves, inspectionDateVal) => {
          if (!dryingInspectionIssueRow) return;

          const rowId = String(dryingInspectionIssueRow.id);
          const currentTotal = Number(totalLeaves) || Number(dryingInspectionIssueRow.noOfLeaves ?? dryingInspectionIssueRow.noOfSheets ?? 0) || 0;
          const prevIssued = dryingIssueStateMap[rowId]?.issuedLeaves ?? 0;
          const newlyIssued = Number(issueLeaves) || 0;
          const totalIssued = prevIssued + newlyIssued;
          const remaining = Math.max(0, currentTotal - totalIssued);
          const isFullyDone = remaining <= 0;
          const newStatus = isFullyDone ? "Done" : "Partially Done";

          // Calculate proportionate Sqm for the issued leaves if length & width exist
          const lengthVal = Number(dryingInspectionIssueRow.length) || 0;
          const widthVal = Number(dryingInspectionIssueRow.width) || 0;
          const calculatedIssuedSqm =
            lengthVal > 0 && widthVal > 0 && newlyIssued > 0
              ? Number(((lengthVal * widthVal * newlyIssued) / 10000).toFixed(2))
              : dryingInspectionIssueRow.totalSqMeter ?? dryingInspectionIssueRow.sqm;

          // Issue to inspection ONLY the issued quantity
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
              totalSqMeter: calculatedIssuedSqm,
              sqm: calculatedIssuedSqm,
              ...(inspectionDateVal ? { issuedDate: inspectionDateVal, issueDate: inspectionDateVal } : {}),
            },
          });

          setDryingIssueStateMap((prev) => ({
            ...prev,
            [rowId]: {
              issuedLeaves: totalIssued,
              availableLeaves: remaining,
              status: newStatus,
            },
          }));

          if (isFullyDone) {
            setRevertedRowIds((current) =>
              current.includes(dryingInspectionIssueRow.id)
                ? current
                : [...current, dryingInspectionIssueRow.id],
            );
          }

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
                if (type === "rejected") {
                  setRejectedDoneRows((current) =>
                    current.filter((item) => item.id !== row.id),
                  );
                }
                setRevertedRowIds((current) =>
                  current.includes(row.id) ? current : [...current, row.id],
                );
              }
              setConfirmRevertRow(null);
            }}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog: Issue for Drying */}
      <Dialog
        open={confirmIssueDryingOpen}
        onClose={() => setConfirmIssueDryingOpen(false)}
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
          Confirm Issue for Drying
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Do you really want to issue for drying?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmIssueDryingOpen(false)}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            No
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              selectedListingRows.forEach((selectedRow) => {
                issueFactoryWork({
                  destinationProcess: "Drying",
                  sourceSlug: definition.slug,
                  sourceProcess: "Slicing",
                  sourceWarehouseName: getFactoryString(selectedRow.warehouseName),
                  sourceRow: selectedRow,
                });
              });
              setRevertedRowIds((current) => [
                ...current,
                ...selectedListingRows.map((r) => r.id),
              ]);
              setSelectedListingRows([]);
              setConfirmIssueDryingOpen(false);
            }}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog: Issue for Inspection */}
      <Dialog
        open={confirmIssueInspectionOpen}
        onClose={() => setConfirmIssueInspectionOpen(false)}
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
          Confirm Issue for Inspection
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            Do you really want to issue for inspection?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setConfirmIssueInspectionOpen(false)}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            No
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
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
                ...selectedListingRows.map((r) => r.id),
              ]);
              setSelectedListingRows([]);
              setConfirmIssueInspectionOpen(false);
            }}
            sx={{ textTransform: "none", minWidth: 70 }}
          >
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

interface DryingInspectionIssueDialogProps<Row extends FactoryRecord> {
  open: boolean;
  row: Row | null;
  onClose: () => void;
  onSubmit: (issueLeaves: string, totalLeaves: string, inspectionDate: string) => void;
}

function DryingInspectionIssueDialog<Row extends FactoryRecord>({
  open,
  row,
  onClose,
  onSubmit,
}: DryingInspectionIssueDialogProps<Row>) {
  const initialLeaves = row ? String(row.availableLeaves ?? row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "") : "";
  const initialTotalLeaves = row ? String(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "") : "";
  const [issueLeaves, setIssueLeaves] = useState(initialLeaves);
  const [totalLeaves, setTotalLeaves] = useState(initialTotalLeaves);
  const [inspectionDate, setInspectionDate] = useState(() => new Date().toISOString().slice(0, 10));

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (row && open) {
      const availVal = String(row.availableLeaves ?? row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "");
      const totalVal = String(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "");
      setIssueLeaves(availVal);
      setTotalLeaves(totalVal);
      setInspectionDate(new Date().toISOString().slice(0, 10));
      setSubmitted(false);
    }
  }, [row, open]);

  if (!row) return null;

  const currentAvailableNum = Number(row.availableLeaves ?? row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? 0);
  const issueNum = Number(issueLeaves);
  const totalNum = Number(totalLeaves);
  const exceedsAvailable = issueLeaves !== "" && !Number.isNaN(issueNum) && currentAvailableNum > 0 && issueNum > currentAvailableNum;
  const exceedsTotal = issueLeaves !== "" && totalLeaves !== "" && issueNum > totalNum;
  const isInvalidIssue = issueLeaves === "" || Number.isNaN(issueNum) || issueNum <= 0;
  const isInvalidTotal = totalLeaves === "" || Number.isNaN(totalNum) || totalNum <= 0;
  const hasError = exceedsAvailable || exceedsTotal || isInvalidIssue || isInvalidTotal;

  const handleFormSubmit = () => {
    setSubmitted(true);
    if (hasError) return;
    onSubmit(issueLeaves, totalLeaves, inspectionDate);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Issue for Inspection
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1, display: "block" }}>
          Listing Details
        </Typography>
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 1.5,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
            <Box>
              <Typography variant="caption" color="text.secondary">Storage Sr No.</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.storageSrNo ?? row.id ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Drying Date</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.processDate ?? row.issueDate ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Item Name</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.itemName ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Sub Category</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.subCategory ?? row.itemSubCategory ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Log Code</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.logCode ?? row.logNo ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Bundle Number</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.bundleNumber ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Pallet No</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.palletNo ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Dimensions (L × W × T)</Typography>
              <Typography variant="body2" fontWeight={600}>
                {row.length ? `${row.length} × ${row.width} × ${row.thickness ?? row.height ?? "-"}` : "-"}
              </Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Available No of Leaves</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.availableLeaves ?? row.noOfLeaves ?? row.noOfSheets ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Total Sq Meter</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.totalSqMeter ?? row.sqm ?? "-")}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" color="text.secondary">Warehouse</Typography>
              <Typography variant="body2" fontWeight={600}>{String(row.warehouseName ?? "-")}</Typography>
            </Box>
          </Box>
        </Box>

        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1.5, display: "block" }}>
          Issue Parameters
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}>
              Issue No. of Leaves *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              error={exceedsAvailable || exceedsTotal || (submitted && isInvalidIssue)}
              helperText={
                exceedsAvailable
                  ? `Cannot exceed available leaves (${currentAvailableNum}).`
                  : exceedsTotal
                  ? "Issue leaves cannot exceed total leaves."
                  : submitted && isInvalidIssue
                  ? "Enter a valid positive number."
                  : ""
              }
              value={issueLeaves}
              onChange={(e) => setIssueLeaves(e.target.value)}
              placeholder="Enter issue leaves"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}>
              Total Leaves *
            </Typography>
            <TextField
              fullWidth
              size="small"
              type="number"
              error={submitted && isInvalidTotal}
              helperText={submitted && isInvalidTotal ? "Enter a valid positive number." : ""}
              value={totalLeaves}
              onChange={(e) => setTotalLeaves(e.target.value)}
              placeholder="Enter total leaves"
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mb: 0.5, display: "block" }}>
              Issue Inspection Date
            </Typography>
            <TextField
              type="date"
              fullWidth
              size="small"
              value={inspectionDate}
              onChange={(e) => setInspectionDate(e.target.value)}
            />
          </Box>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="primary"
          onClick={handleFormSubmit}
          disabled={exceedsTotal}
          sx={{ textTransform: "none", fontWeight: 600, minWidth: 120 }}
        >
          Issue for Inspection
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface InspectionDecisionDialogProps<Row extends FactoryRecord> {
  open: boolean;
  row: Row | null;
  processSlug?: string;
  onClose: () => void;
  onPass: (row: Row, remark?: string, inspectionDate?: string, counts?: { passQty: number; failQty: number }) => void;
  onFail: (row: Row, remark?: string, inspectionDate?: string, counts?: { passQty: number; failQty: number }) => void;
  passCount: number;
  failCount: number;
}

function InspectionDecisionDialog<Row extends FactoryRecord>({
  open,
  row,
  processSlug,
  onClose,
  onPass,
  onFail,
  passCount,
  failCount,
}: InspectionDecisionDialogProps<Row>) {
  const [remark, setRemark] = useState("");
  const [inspectionDate, setInspectionDate] = useState(
    () => new Date().toISOString().slice(0, 10),
  );
  const [attachmentName, setAttachmentName] = useState<string>("");
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);

  const totalQuantity = row
    ? Number(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? 0)
    : 0;

  const [passQtyStr, setPassQtyStr] = useState<string>("");
  const [failQtyStr, setFailQtyStr] = useState<string>("0");

  useEffect(() => {
    if (open && row) {
      setRemark("");
      setInspectionDate(new Date().toISOString().slice(0, 10));
      setAttachmentName("");
      setAttachmentPreview(null);
      const total = Number(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? 0);
      setPassQtyStr(total > 0 ? String(total) : "");
      setFailQtyStr("0");
    }
  }, [open, row]);

  if (!row) return null;

  const isDryingInspection =
    processSlug === "drying-inspection" ||
    processSlug === "drying" ||
    Boolean(row.bundleNumber || row.palletNo || row.logCode || row.noOfLeaves != null);

  const handlePassChange = (val: string) => {
    setPassQtyStr(val);
    if (totalQuantity > 0) {
      if (val === "") {
        setFailQtyStr(String(totalQuantity));
      } else {
        const num = Number(val);
        if (!Number.isNaN(num)) {
          const clampedPass = Math.min(Math.max(0, num), totalQuantity);
          setFailQtyStr(String(Math.max(0, totalQuantity - clampedPass)));
        }
      }
    }
  };

  const handleFailChange = (val: string) => {
    setFailQtyStr(val);
    if (totalQuantity > 0) {
      if (val === "") {
        setPassQtyStr(String(totalQuantity));
      } else {
        const num = Number(val);
        if (!Number.isNaN(num)) {
          const clampedFail = Math.min(Math.max(0, num), totalQuantity);
          setPassQtyStr(String(Math.max(0, totalQuantity - clampedFail)));
        }
      }
    }
  };

  const currentPass = Number(passQtyStr) || 0;
  const currentFail = Number(failQtyStr) || 0;
  const exceedsTotal = totalQuantity > 0 && currentPass + currentFail > totalQuantity;

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontWeight: 600, pb: 1 }}>
        Inspection
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1, display: "block" }}>
          Item Details
        </Typography>
        <Box
          sx={{
            p: 2,
            mb: 2.5,
            borderRadius: 1.5,
            bgcolor: "action.hover",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          {isDryingInspection ? (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Storage Sr No.</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.storageSrNo ?? row.id ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Issued Inspection Date</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.issuedDate ? String(row.issuedDate).slice(0, 10) : String(row.issueDate ?? "-")}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Item Name</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.itemName ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Sub Category</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.subCategory ?? row.itemSubCategory ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Log Code</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.logCode ?? row.logNo ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Bundle Number</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.bundleNumber ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Pallet No</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.palletNo ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Dimensions (L × W × T)</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.length ? `${row.length} × ${row.width} × ${row.thickness ?? row.height ?? "-"}` : "-"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">No of Leaves</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.noOfLeaves ?? row.totalLeaves ?? row.noOfSheets ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Total Sq Meter</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.totalSqMeter ?? row.sqm ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Remark</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.remark ?? "-")}</Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr 1fr" }, gap: 1.5 }}>
              <Box>
                <Typography variant="caption" color="text.secondary">Storage Sr No.</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.storageSrNo ?? row.id ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Sawing Date</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.sawingDate ?? row.processDate ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Item Name</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.itemName ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Sub Category</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.subCategory ?? row.itemSubCategory ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Batch No</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.batchNo ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Batch No. Code</Typography>
                <Typography variant="body2" fontWeight={600}>{String(row.batchNoCode ?? "-")}</Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Dimensions (L × W × T)</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.length ? `${row.length} × ${row.width} × ${row.thickness ?? row.height ?? "-"}` : "-"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">CBM / CBF</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.cbm ? `${row.cbm} m³ / ${row.cbf ?? "-"} ft³` : "-"}
                </Typography>
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary">Issued Inspection Date</Typography>
                <Typography variant="body2" fontWeight={600}>
                  {row.issuedDate ? String(row.issuedDate).slice(0, 10) : "-"}
                </Typography>
              </Box>
            </Box>
          )}
        </Box>

        {/* Pass and Fail Quantity Inputs */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1, display: "block" }}>
          Inspection Quantity Result
        </Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "success.main", mb: 0.5, display: "block" }}>
              Pass Quantity (Leaves) *
            </Typography>
            <TextField
              type="number"
              fullWidth
              size="small"
              value={passQtyStr}
              onChange={(e) => handlePassChange(e.target.value)}
              placeholder="Enter pass count"
              error={exceedsTotal}
              helperText={exceedsTotal ? `Pass + Fail cannot exceed total leaves (${totalQuantity})` : ""}
            />
          </Box>
          <Box>
            <Typography variant="caption" sx={{ fontWeight: 600, color: "error.main", mb: 0.5, display: "block" }}>
              Fail Quantity (Leaves) *
            </Typography>
            <TextField
              type="number"
              fullWidth
              size="small"
              value={failQtyStr}
              onChange={(e) => handleFailChange(e.target.value)}
              placeholder="Enter fail count"
              error={exceedsTotal}
              helperText={exceedsTotal ? `Pass + Fail cannot exceed total leaves (${totalQuantity})` : ""}
            />
          </Box>
        </Box>

        {/* Inspection Date */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5, display: "block" }}>
          Inspection Date
        </Typography>
        <TextField
          type="date"
          fullWidth
          size="small"
          value={inspectionDate}
          onChange={(e) => setInspectionDate(e.target.value)}
          sx={{ mb: 2 }}
        />

        {/* Attachment (Upload Photo) */}
        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5, display: "block" }}>
          Attachment (Upload Photo)
        </Typography>
        <Box sx={{ mb: 2 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button
              variant="outlined"
              component="label"
              size="small"
              sx={{ textTransform: "none", fontWeight: 600 }}
            >
              Choose Photo
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={handleFileChange}
              />
            </Button>
            {attachmentName ? (
              <Typography variant="body2" color="text.secondary">
                {attachmentName}
              </Typography>
            ) : (
              <Typography variant="caption" color="text.disabled">
                No file chosen
              </Typography>
            )}
          </Stack>
          {attachmentPreview && (
            <Box sx={{ mt: 1.5, maxHeight: 140, maxWidth: 220, overflow: "hidden", borderRadius: 1, border: "1px solid", borderColor: "divider" }}>
              <img src={attachmentPreview} alt="Inspection Attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </Box>
          )}
        </Box>

        <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5, display: "block" }}>
          Inspection Remark
        </Typography>
        <TextField
          placeholder="Enter inspection remark or reason..."
          fullWidth
          size="small"
          multiline
          rows={2}
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, gap: 1 }}>
        <Button
          variant="outlined"
          color="inherit"
          onClick={onClose}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Cancel
        </Button>
        <Box sx={{ flex: 1 }} />
        <Button
          variant="contained"
          color="error"
          startIcon={<AlertCircle size={16} />}
          onClick={() => onFail(row, remark, inspectionDate, { passQty: currentPass, failQty: currentFail })}
          disabled={exceedsTotal}
          sx={{ textTransform: "none", fontWeight: 600, minWidth: 120 }}
        >
          Fail Inspection
        </Button>
        <Button
          variant="contained"
          color="success"
          startIcon={<CheckCircle2 size={16} />}
          onClick={() => onPass(row, remark, inspectionDate, { passQty: currentPass, failQty: currentFail })}
          disabled={exceedsTotal}
          sx={{ textTransform: "none", fontWeight: 600, minWidth: 120 }}
        >
          Pass Inspection
        </Button>
      </DialogActions>
    </Dialog>
  );
}

interface GroupingSampleIssueState<Row extends FactoryRecord> {
  issueDate: Date | null;
  issueSheets: string;
  nextProcess: "" | SampleNextProcess;
  remark: string;
  row: Row;
  submitted: boolean;
}

interface GroupingOrderIssueState<Row extends FactoryRecord> {
  issueDate: Date | null;
  issueSheets: string;
  orderItemNo: string;
  orderNo: string;
  orderType: string;
  row: Row;
  submitted: boolean;
}

interface SplicingOrderIssueState<Row extends FactoryRecord> {
  issueDate: Date | null;
  issueSheets: string;
  orderItemNo: string;
  orderNo: string;
  orderType: string;
  row: Row;
  submitted: boolean;
}

function formatFactorySearchValue(value: RowValue) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(value)
      .toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).toLowerCase();
}

type RowValue = RowLike[string];

interface RowLike {
  [key: string]: unknown;
}

function normalizeFactorySourceColumns<Row extends FactoryRecord>(
  row: Row,
  processSlug: string,
) {
  const issuedFrom = getFactoryIssuedFromProcess(row, processSlug);
  const warehouseName =
    getFactoryRowWarehouseName(row) || getDefaultFactoryWarehouseName(processSlug);
  const rowSequence = getFactoryRowSequence(row);
  const itemName =
    getFactoryString(row.itemName) || getFactoryString(row.productName);
  const itemSubCategory =
    getFactoryString(row.itemSubCategory) || getFactoryString(row.subCategory);
  const color =
    getFactoryString(row.color) ||
    getFactoryString(row.timberColor) ||
    getFactoryString(row.processColor);
  const logNo = getFactoryString(row.logNo) || getFactoryString(row.logCode);
  const height = getFactoryString(row.height);
  const thickness = getFactoryString(row.thickness);
  const bundleNumber =
    getFactoryString(row.bundleNumber) ||
    getFactoryString(row.noOfBundle) ||
    `BDL-${getFactoryWarehouseCode(warehouseName)}-${rowSequence}`;
  const palletNo =
    getFactoryString(row.palletNo) ||
    getFactoryString(row.palletNumber) ||
    `PAL-${getFactoryWarehouseCode(warehouseName)}-${rowSequence}`;
  const noOfLeaves =
    getFactoryString(row.noOfLeaves) ||
    getFactoryString(row.noOfLeavesSheets) ||
    getFactoryString(row.noOfSheets) ||
    getFactoryString(row.totalNoOfSheets) ||
    getFactoryString(row.availableSheets);
  const sqm =
    getFactoryString(row.sqm) ||
    getFactoryString(row.totalSqm) ||
    getFactoryString(row.availableSqm) ||
    getFactoryString(row.avSqm) ||
    getFactoryString(row.issuedSqm) ||
    getFactoryString(row.outputSqm);
  const sqf =
    getFactoryString(row.sqf) ||
    getFactoryString(row.totalSqf) ||
    getFactoryString(row.availableSqf) ||
    getFactoryString(row.avSqf) ||
    getFactoryString(row.issuedSqf) ||
    getFactoryString(row.outputSqf) ||
    deriveFactorySqf(sqm);
  const ratePerSqf =
    getFactoryString(row.ratePerSqf) ||
    getFactoryString(row.rate) ||
    deriveFactoryRatePerSqf(row.amount, sqf);

  const issueDate =
    getFactoryString(row.issueDate) ||
    getFactoryString(row.issuedDate) ||
    getFactoryString(row.orderDate);
  const storageSrNo =
    getFactoryString(row.storageSrNo) ||
    getFactoryString(row.storageSerialNumber) ||
    "";
  const batchNo =
    getFactoryString(row.batchNo) ||
    getFactoryString(row.logNo) ||
    getFactoryString(row.logCode);
  const receivedCbm =
    getFactoryString(row.receivedCbm) ||
    getFactoryString(row.cbm);
  const availableCbm =
    getFactoryString(row.availableCbm) ||
    getFactoryString(row.receivedCbm) ||
    getFactoryString(row.cbm);

  return {
    ...row,
    ...(bundleNumber ? { bundleNumber } : {}),
    ...(storageSrNo ? { storageSrNo } : {}),
    ...(issueDate ? { issueDate } : {}),
    ...(batchNo ? { batchNo } : {}),
    ...(receivedCbm ? { receivedCbm } : {}),
    ...(availableCbm ? { availableCbm } : {}),
    ...(color ? { color } : {}),
    ...(height || thickness ? { height: height || thickness } : {}),
    issuedFrom,
    ...(itemName ? { itemName } : {}),
    ...(itemSubCategory ? { itemSubCategory } : {}),
    ...(logNo ? { logNo } : {}),
    ...(noOfLeaves ? { noOfLeaves } : {}),
    ...(palletNo ? { palletNo } : {}),
    ...(sqf ? { sqf } : {}),
    ...(sqm ? { sqm } : {}),
    ...(ratePerSqf ? { ratePerSqf } : {}),
    ...(thickness || height ? { thickness: thickness || height } : {}),
    warehouseName,
  } as Row;
}

function getFactoryIssuedFromProcess<Row extends FactoryRecord>(
  row: Row,
  processSlug: string,
) {
  const explicitProcess = getFactoryString(row.sourceProcess);
  if (explicitProcess) {
    return explicitProcess;
  }

  const issuedFrom = getFactoryString(row.issuedFrom);
  if (issuedFrom && !isFactoryWarehouseLabel(issuedFrom)) {
    return issuedFrom;
  }

  return getDefaultFactoryIssuedFromProcess(processSlug);
}

function getFactoryRowWarehouseName<Row extends FactoryRecord>(row: Row) {
  const explicitWarehouse =
    getFactoryString(row.warehouseName) ||
    getFactoryString(row.sourceWarehouseName);

  if (explicitWarehouse) {
    return explicitWarehouse;
  }

  const issuedFrom = getFactoryString(row.issuedFrom);
  return isFactoryWarehouseLabel(issuedFrom) ? issuedFrom : "";
}

function getDefaultFactoryWarehouseName(processSlug: string) {
  return processSlug === "slicing" || processSlug === "drying"
    ? "Warehouse B"
    : "Warehouse C";
}

function getDefaultFactoryIssuedFromProcess(processSlug: string) {
  const sourceProcessBySlug: Record<string, string> = {
    "cnc-fluting": "Pressing",
    drying: "Slicing",
    "drying-inspection": "Drying",
    embossing: "Pressing",
    finishing: "Pressing",
    grouping: "Inventory",
    marquetry: "Splicing",
    pressing: "Splicing",
    "sample-sheets": "Grouping",
    "sawing-inspection": "Sawing",
    slicing: "Inventory",
    splicing: "Grouping",
  };

  return sourceProcessBySlug[processSlug] ?? "Inventory";
}

function isFactoryWarehouseLabel(value: string) {
  return /^warehouse\b/i.test(value.trim());
}

function getFactoryString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

function deriveFactorySqf(sqm: string) {
  const sqmValue = parseNumericValue(sqm);
  return sqmValue && sqmValue > 0
    ? (sqmValue * SQM_TO_SQF).toLocaleString("en-IN", {
      maximumFractionDigits: 3,
      minimumFractionDigits: 3,
    })
    : "";
}

function deriveFactoryRatePerSqf(amount: unknown, sqf: string) {
  const amountValue = parseNumericValue(amount);
  const sqfValue = parseNumericValue(sqf);

  if (!amountValue || !sqfValue || sqfValue <= 0) {
    return "";
  }

  return formatAmount(amountValue / sqfValue);
}

function getFactoryRowSequence<Row extends FactoryRecord>(row: Row) {
  const id = String(row.id ?? "");
  const numericPart = id.match(/\d+/g)?.at(-1);
  const parsed = numericPart ? Number(numericPart) : 1;
  return String(Number.isFinite(parsed) ? parsed : 1).padStart(3, "0");
}

function getFactoryWarehouseCode(warehouseName: string) {
  const suffix = warehouseName.match(/\bWarehouse\s+([A-Z0-9]+)/i)?.[1];
  return suffix ? `W${suffix.toUpperCase()}` : "WH";
}

function getPressingDoneIssuedForLabel(value: RowValue) {
  const issuedFor = typeof value === "string" ? value.trim() : "";

  if (issuedFor === "Fluted") {
    return "Fluting";
  }

  if (issuedFor === "Embossed") {
    return "Embossing";
  }

  return issuedFor;
}

function getFactoryNextProcessActions<Row extends FactoryRecord>(
  row: Row,
  slug: string,
  onOpenSplicingOrderIssue: (row: Row) => void,
): readonly EnterpriseTableAction<Row>[] {
  if (slug === "pressing") {
    return getPressingNextProcessActions(row, slug);
  }

  if (slug === "splicing") {
    const canIssueForOrder =
      canAccessPermission(getFactoryPermissionKey("marquetry"), "create") ||
      canAccessPermission(getFactoryPermissionKey("pressing"), "create");

    return canIssueForOrder
      ? [createSplicingOrderIssueAction<Row>(onOpenSplicingOrderIssue)]
      : [];
  }

  const issuedFor = typeof row.issuedFor === "string" ? row.issuedFor.trim() : "";

  if (
    !issuedFor ||
    issuedFor === "Packing" ||
    !(issuedFor in factoryNextProcessRouteMap)
  ) {
    return [];
  }

  return [createFactoryIssueAction<Row>(issuedFor, slug)].filter(
    (action) => canAccessPermission(action.permissionKey, "create"),
  );
}

function getPressingNextProcessActions<Row extends FactoryRecord>(
  row: Row,
  sourceSlug: string,
) {
  const issuedFor = typeof row.issuedFor === "string" ? row.issuedFor.trim() : "";
  const normalizedIssuedFor = issuedFor.toLowerCase();
  const nextProcessesByOrderType: Record<string, readonly string[]> = {
    "CNC / Fluting": ["Fluting"],
    "CNC/Fluting": ["Fluting"],
    Decorative: ["Finishing"],
    Embossed: ["Embossing"],
    Embossing: ["Embossing"],
    Fluted: ["Fluting"],
    Fluting: ["Fluting"],
    Marquetry: [],
  };
  const nextProcesses =
    normalizedIssuedFor === "embossed" || normalizedIssuedFor === "embossing"
      ? ["Embossing"]
      : issuedFor in nextProcessesByOrderType
        ? nextProcessesByOrderType[issuedFor]!
        : ["Fluting", "Embossing"];

  return nextProcesses
    .map((process) => createFactoryIssueAction<Row>(process, sourceSlug))
    .filter((action) => canAccessPermission(action.permissionKey, "create"));
}

function createSplicingOrderIssueAction<Row extends FactoryRecord>(
  onOpenSplicingOrderIssue: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: "issue-for-order",
    label: "Issue For Order",
    icon: Plus,
    tone: "primary",
    onSelect: onOpenSplicingOrderIssue,
  };
}

function createGroupingOrderIssueAction<Row extends FactoryRecord>(
  onOpenGroupingOrderIssue: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: "issue-for-order",
    label: "Issue for Order",
    icon: Plus,
    tone: "primary",
    onSelect: onOpenGroupingOrderIssue,
  };
}

function createGroupingSampleIssueAction<Row extends FactoryRecord>(
  onOpenGroupingSampleIssue: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: "issue-for-sample-sheet",
    label: "Issue for Sample Sheet",
    icon: Plus,
    tone: "primary",
    onSelect: onOpenGroupingSampleIssue,
  };
}

function createSampleIssueProcessAction<Row extends FactoryRecord>(
  process: string,
  onSelect: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: `issue-for-${process.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `Issue for ${process}`,
    icon: Plus,
    tone: "primary",
    onSelect,
  };
}

function createRejectFactoryAction<Row extends FactoryRecord>(
  processName: string,
  onReject: (row: Row) => void,
): EnterpriseTableAction<Row> {
  return {
    id: `reject-${processName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `Reject ${processName}`,
    icon: XCircle,
    tone: "danger",
    onSelect: onReject,
  };
}

function createFactoryIssueAction<Row extends FactoryRecord>(
  issuedFor: string,
  sourceSlug: string,
): EnterpriseTableAction<Row> & { permissionKey?: string } {
  const route = factoryNextProcessRouteMap[issuedFor]!;
  const permissionKey = getIssueRoutePermissionKey(route);

  return {
    id: `issue-for-${issuedFor.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    label: `Issue for ${issuedFor}`,
    icon: Plus,
    tone: "primary",
    onSelect: (row) => {
      if (!route.startsWith("/factory/")) {
        return;
      }

      issueToNextFactoryProcess({
        destinationProcess: issuedFor,
        row,
        sourceSlug,
      });
    },
    ...(permissionKey ? { permissionKey } : {}),
  };
}

function issueToNextFactoryProcess<Row extends FactoryRecord>({
  destinationProcess,
  row,
  sourceSlug,
}: {
  destinationProcess: string;
  row: Row;
  sourceSlug: string;
}) {
  const sampleNo = getSampleNoFromRow(row);
  if (sampleNo) {
    const normalized = destinationProcess.replace(/^CNC\s*\/\s*/i, "").trim();
    if (
      normalized === "Finishing" ||
      normalized === "Fluting" ||
      normalized === "Embossing" ||
      normalized === "Pressing" ||
      normalized === "Packing"
    ) {
      issueSampleToProcess(sampleNo, normalized);
    }
  }

  const orderNo =
    typeof row.orderNo === "string" && !sampleNo ? row.orderNo : undefined;
  const orderItemNo =
    typeof row.orderItemNo === "string" && !sampleNo
      ? row.orderItemNo
      : undefined;

  issueFactoryWork({
    destinationProcess,
    purpose: sampleNo ? "SAMPLE" : "ORDER",
    sourceRow: row,
    sourceSlug,
    sourceProcess: resolveFactoryProcessLabel(sourceSlug),
    sourceWarehouseName: getFactoryRowWarehouseName(row),
    ...(sampleNo ? { sampleNo } : {}),
    ...(orderNo ? { orderNo } : {}),
    ...(orderItemNo ? { orderItemNo } : {}),
  });
}

function getIssueRoutePermissionKey(route: string) {
  if (route.startsWith("/factory/")) {
    return getFactoryPermissionKey(route.replace(/^\/factory\//, ""));
  }

  const permissionKeyByRoute: Record<string, string> = {
    "/dispatch": "dispatch",
    "/packing": "packing",
    "/warehouse-b?section=inspection": "warehouseB",
  };

  return permissionKeyByRoute[route];
}

const factoryNextProcessRouteMap: Record<string, string> = {
  "CNC / Fluting": "/factory/cnc-fluting",
  "CNC/Fluting": "/factory/cnc-fluting",
  Dispatch: "/dispatch",
  Drying: "/factory/drying",
  Embossing: "/factory/embossing",
  Finishing: "/factory/finishing",
  Fluting: "/factory/cnc-fluting",
  Grouping: "/factory/grouping",
  Inspection: "/factory/drying-inspection",
  "Drying Inspection": "/factory/drying-inspection",
  "Sawing Inspection": "/factory/sawing-inspection",
  Marquetry: "/factory/marquetry",
  Packing: "/packing",
  Pressing: "/factory/pressing",
  Splicing: "/factory/splicing",
};

function GroupingSampleIssueDialog<Row extends FactoryRecord>({
  onChange,
  onClose,
  onSubmit,
  state,
}: {
  onChange: Dispatch<SetStateAction<GroupingSampleIssueState<Row> | null>>;
  onClose: () => void;
  onSubmit: () => void;
  state: GroupingSampleIssueState<Row> | null;
}) {
  const availableSheetsNumber = state
    ? getAvailableGroupedSheets(state.row)
    : 0;
  const availableSheets = String(availableSheetsNumber);
  const itemName = getGroupingSampleField(state?.row, ["itemName", "productName"]);
  const subCategory = getGroupingSampleField(state?.row, [
    "itemSubCategory",
    "subCategory",
  ]);
  const color = getGroupingSampleField(state?.row, [
    "color",
    "colour",
    "processColour",
  ]);
  const length = getGroupingSampleField(state?.row, ["length"]);
  const width = getGroupingSampleField(state?.row, ["width"]);
  const thickness = getGroupingSampleField(state?.row, [
    "height",
    "thickness",
    "thickess",
  ]);
  const groupingRef = state?.row?.id ? String(state.row.id) : "";
  const issueSheetsNumber = Number(state?.issueSheets ?? "");
  const hasIssueSheetsValue = Boolean(state?.issueSheets);
  const exceedsAvailableSheets =
    hasIssueSheetsValue && issueSheetsNumber > availableSheetsNumber;
  const hasIssueSheetsError = Boolean(
    exceedsAvailableSheets ||
    (state?.submitted &&
      (!state.issueSheets ||
        !Number.isInteger(issueSheetsNumber) ||
        issueSheetsNumber <= 0)),
  );
  const hasNextProcessError = Boolean(state?.submitted && !state.nextProcess);

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={Boolean(state)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
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
        Issue for Sample Sheet
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(3, minmax(0, 1fr))",
              },
            })}
          >
            <ReadOnlyDialogField label="Item Name" value={itemName} />
            <ReadOnlyDialogField label="Sub Category" value={subCategory} />
            <ReadOnlyDialogField label="Color" value={color} />
            <ReadOnlyDialogField label="Length" value={length || "-"} />
            <ReadOnlyDialogField label="Width" value={width || "-"} />
            <ReadOnlyDialogField label="Thickness" value={thickness || "-"} />
            <ReadOnlyDialogField
              label="Available No. of Leaves"
              value={availableSheets}
            />
            <ReadOnlyDialogField label="Grouping Reference" value={groupingRef} />

            <Stack spacing={0.75}>
              <DialogFieldLabel>Issue Date</DialogFieldLabel>
              <ErpDatePickerField
                size="dense"
                value={state?.issueDate ?? null}
                onChange={(value) =>
                  onChange((current) =>
                    current ? { ...current, issueDate: value } : current,
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Issue Quantity / No. of Leaves</DialogFieldLabel>
              <TextField
                autoFocus
                error={hasIssueSheetsError}
                fullWidth
                helperText={
                  hasIssueSheetsError
                    ? exceedsAvailableSheets
                      ? "Issue sheets cannot exceed available sheets."
                      : "Enter a valid whole number."
                    : " "
                }
                value={state?.issueSheets ?? ""}
                onChange={(event) => {
                  const nextValue = event.target.value.replace(/\D/g, "");
                  onChange((current) =>
                    current ? { ...current, issueSheets: nextValue } : current,
                  );
                }}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    pattern: "[0-9]*",
                  },
                }}
                sx={(theme) =>
                  getCompactFieldSx(
                    theme,
                    hasIssueSheetsError ? "error" : "default",
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Next Process *</DialogFieldLabel>
              <ErpSelectField
                helperText={hasNextProcessError ? "Select next process." : " "}
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        nextProcess: value as "" | SampleNextProcess,
                      }
                      : current,
                  )
                }
                options={["Splicing"]}
                size="dense"
                state={hasNextProcessError ? "error" : "default"}
                value={state?.nextProcess ?? ""}
              />
            </Stack>

            <Stack spacing={0.75} sx={{ gridColumn: { xs: "1", lg: "1 / -1" } }}>
              <DialogFieldLabel>Remark</DialogFieldLabel>
              <TextField
                fullWidth
                multiline
                minRows={2}
                value={state?.remark ?? ""}
                onChange={(event) =>
                  onChange((current) =>
                    current
                      ? { ...current, remark: event.target.value }
                      : current,
                  )
                }
                sx={(theme) => getCompactFieldSx(theme, "default")}
              />
            </Stack>
          </Box>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button
          type="button"
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ReadOnlyDialogField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <Stack spacing={0.75}>
      <DialogFieldLabel>{label}</DialogFieldLabel>
      <TextField
        fullWidth
        value={value || "-"}
        slotProps={{
          input: {
            readOnly: true,
          },
        }}
        sx={(theme) => getCompactFieldSx(theme, "readOnly")}
      />
    </Stack>
  );
}

function getGroupingSampleField(
  row: FactoryRecord | undefined,
  keys: readonly string[],
) {
  if (!row) {
    return "";
  }

  for (const key of keys) {
    const value = row[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return "";
}

function GroupingOrderIssueDialog<Row extends FactoryRecord>({
  onChange,
  onClose,
  onSubmit,
  orderRecords,
  state,
}: {
  onChange: Dispatch<SetStateAction<GroupingOrderIssueState<Row> | null>>;
  onClose: () => void;
  onSubmit: () => void;
  orderRecords: readonly OrderRecord[];
  state: GroupingOrderIssueState<Row> | null;
}) {
  const availableGroupedSheets = state
    ? getAvailableGroupedSheets(state.row)
    : 0;
  const orderNumberOptions = state?.orderType
    ? getSplicingOrderNumberOptions(orderRecords, state.orderType)
    : [];
  const orderItemOptions =
    state?.orderType && state.orderNo
      ? getSplicingOrderItemNumberOptions(
        orderRecords,
        state.orderType,
        state.orderNo,
      )
      : [];
  const selectedOrderItem = state
    ? getSplicingSelectedOrderItem(orderRecords, state)
    : null;
  const orderSheets = selectedOrderItem
    ? getOrderLineItemSheetsNumber(selectedOrderItem)
    : 0;
  const maxIssuable = Math.min(availableGroupedSheets, orderSheets);
  const issueSheetsNumber = Number(state?.issueSheets ?? "");
  const hasIssueSheetsValue = Boolean(state?.issueSheets);
  const exceedsMaxIssuable =
    hasIssueSheetsValue && issueSheetsNumber > maxIssuable;
  const hasIssueSheetsError = Boolean(
    exceedsMaxIssuable ||
    (state?.submitted &&
      (!state.issueSheets ||
        !state.orderType ||
        !state.orderNo ||
        !state.orderItemNo ||
        !Number.isInteger(issueSheetsNumber) ||
        issueSheetsNumber <= 0)),
  );
  const showOrderItemTable = Boolean(
    state?.orderType &&
    state.orderNo &&
    state.orderItemNo &&
    selectedOrderItem,
  );

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      onClose={onClose}
      open={Boolean(state)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
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
        Issue for Order
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            })}
          >
            <Stack spacing={0.75}>
              <DialogFieldLabel>Issued Date</DialogFieldLabel>
              <ErpDatePickerField
                size="dense"
                value={state?.issueDate ?? null}
                onChange={(value) =>
                  onChange((current) =>
                    current ? { ...current, issueDate: value } : current,
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Available Grouped Sheets</DialogFieldLabel>
              <TextField
                fullWidth
                value={String(availableGroupedSheets)}
                slotProps={{
                  input: {
                    readOnly: true,
                  },
                }}
                sx={(theme) => getCompactFieldSx(theme, "readOnly")}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Type</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: "",
                        orderType: value,
                      }
                      : current,
                  )
                }
                options={groupingOrderTypeOptions}
                size="dense"
                state="default"
                value={state?.orderType ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: value,
                      }
                      : current,
                  )
                }
                options={orderNumberOptions}
                size="dense"
                state={!state?.orderType ? "disabled" : "default"}
                value={state?.orderNo ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Item No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: value,
                      }
                      : current,
                  )
                }
                options={orderItemOptions}
                size="dense"
                state={!state?.orderNo ? "disabled" : "default"}
                value={state?.orderItemNo ?? ""}
              />
            </Stack>
          </Box>

          {showOrderItemTable ? (
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              })}
            >
              <Box sx={getDialogScrollableTableSx}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 720,
                    tableLayout: "auto",
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={getDialogHeaderCellSx}>Item Name</TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Order Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Available Grouped Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Max Issuable
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Issue No. of Sheets
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={getDialogBodyCellSx}>
                        {selectedOrderItem?.itemName || "-"}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {String(orderSheets)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {String(availableGroupedSheets)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {String(maxIssuable)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        <TextField
                          autoFocus
                          error={hasIssueSheetsError}
                          fullWidth
                          helperText={
                            hasIssueSheetsError
                              ? exceedsMaxIssuable
                                ? "Issue sheets cannot exceed available grouped stock or order sheets."
                                : "Enter a valid whole number."
                              : " "
                          }
                          value={state?.issueSheets ?? ""}
                          onChange={(event) => {
                            const nextValue = event.target.value.replace(/\D/g, "");
                            onChange((current) =>
                              current
                                ? { ...current, issueSheets: nextValue }
                                : current,
                            );
                          }}
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              pattern: "[0-9]*",
                            },
                          }}
                          sx={(theme) =>
                            getCompactFieldSx(
                              theme,
                              hasIssueSheetsError ? "error" : "default",
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button
          type="button"
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SplicingOrderIssueDialog<Row extends FactoryRecord>({
  onChange,
  onClose,
  onSubmit,
  orderRecords,
  state,
}: {
  onChange: Dispatch<SetStateAction<SplicingOrderIssueState<Row> | null>>;
  onClose: () => void;
  onSubmit: () => void;
  orderRecords: readonly OrderRecord[];
  state: SplicingOrderIssueState<Row> | null;
}) {
  const orderNumberOptions = state?.orderType
    ? getSplicingOrderNumberOptions(orderRecords, state.orderType)
    : [];
  const orderItemOptions =
    state?.orderType && state.orderNo
      ? getSplicingOrderItemNumberOptions(
        orderRecords,
        state.orderType,
        state.orderNo,
      )
      : [];
  const selectedOrderItem = state
    ? getSplicingSelectedOrderItem(orderRecords, state)
    : null;
  const availableSheets = selectedOrderItem
    ? getOrderLineItemSheetsLabel(selectedOrderItem)
    : "";
  const availableSheetsNumber = selectedOrderItem
    ? getOrderLineItemSheetsNumber(selectedOrderItem)
    : 0;
  const issueSheetsNumber = Number(state?.issueSheets ?? "");
  const hasIssueSheetsValue = Boolean(state?.issueSheets);
  const exceedsAvailableSheets =
    hasIssueSheetsValue && issueSheetsNumber > availableSheetsNumber;
  const hasIssueSheetsError = Boolean(
    exceedsAvailableSheets ||
    (state?.submitted &&
      (!state.issueSheets ||
        !Number.isInteger(issueSheetsNumber) ||
        issueSheetsNumber <= 0)),
  );
  const showOrderItemTable = Boolean(
    state?.orderType &&
    state.orderNo &&
    state.orderItemNo &&
    selectedOrderItem,
  );

  return (
    <Dialog
      fullWidth
      maxWidth={false}
      onClose={onClose}
      open={Boolean(state)}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            maxWidth: "calc(100vw - 48px)",
            width: {
              xs: "calc(100vw - 24px)",
              lg: "min(1400px, calc(100vw - 64px))",
            },
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
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
        Issue for Order
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
          <Box
            sx={(theme) => ({
              display: "grid",
              gap: theme.spacing(2),
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(4, minmax(0, 1fr))",
              },
            })}
          >
            <Stack spacing={0.75}>
              <DialogFieldLabel>Issued Date</DialogFieldLabel>
              <ErpDatePickerField
                size="dense"
                value={state?.issueDate ?? null}
                onChange={(value) =>
                  onChange((current) =>
                    current ? { ...current, issueDate: value } : current,
                  )
                }
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Type</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: "",
                        orderType: value,
                      }
                      : current,
                  )
                }
                options={splicingOrderTypeOptions}
                size="dense"
                state="default"
                value={state?.orderType ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: "",
                        orderNo: value,
                      }
                      : current,
                  )
                }
                options={orderNumberOptions}
                size="dense"
                state={!state?.orderType ? "disabled" : "default"}
                value={state?.orderNo ?? ""}
              />
            </Stack>

            <Stack spacing={0.75}>
              <DialogFieldLabel>Order Item No</DialogFieldLabel>
              <ErpSelectField
                onChange={(value) =>
                  onChange((current) =>
                    current
                      ? {
                        ...current,
                        issueSheets: "",
                        orderItemNo: value,
                      }
                      : current,
                  )
                }
                options={orderItemOptions}
                size="dense"
                state={!state?.orderNo ? "disabled" : "default"}
                value={state?.orderItemNo ?? ""}
              />
            </Stack>
          </Box>

          {showOrderItemTable ? (
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.default}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                overflow: "hidden",
              })}
            >
              <Box sx={getDialogScrollableTableSx}>
                <Table
                  size="small"
                  sx={{
                    minWidth: 1040,
                    tableLayout: "auto",
                  }}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell sx={getDialogHeaderCellSx}>Item Name</TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        No. of Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Available No. of Sheets
                      </TableCell>
                      <TableCell sx={getDialogHeaderCellSx}>
                        Issue No. of Sheets
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={getDialogBodyCellSx}>
                        {selectedOrderItem?.itemName || "-"}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {getOrderLineItemSheetsLabel(selectedOrderItem)}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        {availableSheets || "-"}
                      </TableCell>
                      <TableCell sx={getDialogBodyCellSx}>
                        <TextField
                          error={hasIssueSheetsError}
                          fullWidth
                          helperText={
                            hasIssueSheetsError
                              ? exceedsAvailableSheets
                                ? "Issue sheets cannot exceed available sheets."
                                : "Enter a valid whole number."
                              : " "
                          }
                          value={state?.issueSheets ?? ""}
                          onChange={(event) => {
                            const nextValue = event.target.value.replace(/\D/g, "");
                            onChange((current) =>
                              current
                                ? { ...current, issueSheets: nextValue }
                                : current,
                            );
                          }}
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              pattern: "[0-9]*",
                            },
                          }}
                          sx={(theme) =>
                            getCompactFieldSx(
                              theme,
                              hasIssueSheetsError ? "error" : "default",
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </Box>
            </Box>
          ) : null}
        </Stack>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button
          type="button"
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>

        <Button
          type="button"
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function DialogFieldLabel({
  children,
}: {
  children: ReactNode;
  required?: boolean;
}) {
  return (
    <Typography
      sx={(theme) => ({
        color: theme.customTokens.text.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 700,
      })}
    >
      {children}
    </Typography>
  );
}

const splicingOrderTypeOptions = [
  "Marquetry",
  "Decorative",
  "Fluted",
  "Embossed",
] as const;

const groupingOrderTypeOptions = [
  "Decorative",
  "Fluted",
  "Embossed",
] as const;

type SplicingOrderType = (typeof splicingOrderTypeOptions)[number];

type SplicingOrderLineItemOption = {
  lineItem: OrderLineItem;
  orderItemNo: string;
};

function getSplicingOrderNumberOptions(
  orderRecords: readonly OrderRecord[],
  orderType: string,
) {
  return orderRecords
    .filter(
      (record) =>
        getSplicingOrderLineItemOptions(record, orderType).length > 0,
    )
    .map((record) => record.orderNo);
}

function getSplicingOrderItemNumberOptions(
  orderRecords: readonly OrderRecord[],
  orderType: string,
  orderNo: string,
) {
  const order = getSplicingSelectedOrder(orderRecords, orderNo);

  if (!order) {
    return [];
  }

  return getSplicingOrderLineItemOptions(order, orderType).map(
    (option) => option.orderItemNo,
  );
}

function getSplicingSelectedOrder(
  orderRecords: readonly OrderRecord[],
  orderNo: string,
) {
  return orderRecords.find((record) => record.orderNo === orderNo) ?? null;
}

function getSplicingSelectedOrderItem<Row extends FactoryRecord>(
  orderRecords: readonly OrderRecord[],
  state: SplicingOrderIssueState<Row>,
) {
  const order = getSplicingSelectedOrder(orderRecords, state.orderNo);

  if (!order) {
    return null;
  }

  return (
    getSplicingOrderLineItemOptions(order, state.orderType).find(
      (option) => option.orderItemNo === state.orderItemNo,
    )?.lineItem ?? null
  );
}

function getSplicingOrderLineItemOptions(
  order: OrderRecord,
  orderType: string,
): SplicingOrderLineItemOption[] {
  const normalizedOrderType = normalizeSplicingOrderType(orderType);

  if (!normalizedOrderType) {
    return [];
  }

  const recordOrderType =
    normalizeSplicingOrderType(order.orderType) ??
    normalizeSplicingOrderType(order.productCategory);

  return getOrderLineItems(order.id)
    .map((lineItem, index) => ({
      lineItem,
      orderItemNo: String(index + 1),
    }))
    .filter((option) => {
      const lineItemOrderType =
        normalizeSplicingOrderType(option.lineItem.finishedType) ??
        normalizeSplicingOrderType(option.lineItem.productCategory);

      if (lineItemOrderType) {
        return lineItemOrderType === normalizedOrderType;
      }

      return recordOrderType === normalizedOrderType;
    });
}

function normalizeSplicingOrderType(
  value: string | null | undefined,
): SplicingOrderType | null {
  if (!value) {
    return null;
  }

  const normalizedValue = value.trim().toLowerCase();

  return (
    splicingOrderTypeOptions.find((option) =>
      normalizedValue.includes(option.toLowerCase()),
    ) ?? null
  );
}

function getOrderLineItemSheetsLabel(
  lineItem: OrderLineItem | null | undefined,
) {
  return lineItem?.quantitySheets?.trim() || "0";
}

function getOrderLineItemSheetsNumber(
  lineItem: OrderLineItem | null | undefined,
) {
  const value = getOrderLineItemSheetsLabel(lineItem).replace(/[^\d]/g, "");
  const parsedValue = Number(value);

  return Number.isFinite(parsedValue) ? parsedValue : 0;
}

function getSplicingOrderIssueRoute(orderType: string) {
  return normalizeSplicingOrderType(orderType) === "Marquetry"
    ? "/factory/marquetry/add"
    : "/factory/pressing/add";
}

function buildSplicingOrderIssueSourceRow<Row extends FactoryRecord>(
  state: SplicingOrderIssueState<Row>,
  order: OrderRecord | null,
  lineItem: OrderLineItem,
) {
  return {
    ...state.row,
    amount: lineItem.amount || state.row.amount,
    customerName: order?.customerName ?? state.row.customerName,
    issuedDate: state.issueDate ?? new Date(),
    issuedFor: state.orderType,
    itemName:
      lineItem.itemName ||
      lineItem.salesItemName ||
      state.row.itemName ||
      state.row.productName,
    itemSubCategory: lineItem.subCategory || state.row.itemSubCategory,
    length: lineItem.length || state.row.length,
    noOfSheets: state.issueSheets || lineItem.quantitySheets || state.row.noOfSheets,
    orderDate: order?.orderDate ?? state.row.orderDate,
    orderItemNo: state.orderItemNo,
    orderNo: state.orderNo,
    productName:
      lineItem.itemName ||
      lineItem.salesItemName ||
      state.row.itemName ||
      state.row.productName,
    productType: state.orderType,
    remark: lineItem.remark || state.row.remark,
    sqf: lineItem.totalSqm || state.row.sqf,
    sqm: lineItem.sqm || state.row.sqm,
    thickness: lineItem.thickness || state.row.thickness,
    width: lineItem.width || state.row.width,
  } as Row;
}

function buildGroupingOrderIssueSourceRow<Row extends FactoryRecord>(
  state: GroupingOrderIssueState<Row>,
  order: OrderRecord | null,
  lineItem: OrderLineItem,
) {
  return {
    ...buildSplicingOrderIssueSourceRow(state, order, lineItem),
    issuedFrom: "Grouping",
    groupingRef: state.row.id,
    remark:
      lineItem.remark ||
      `Issued from Grouping ${state.row.id} (${state.issueSheets} sheets)`,
  } as Row;
}

function getDialogScrollableTableSx(theme: import("@mui/material/styles").Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}

function getDialogHeaderCellSx(theme: import("@mui/material/styles").Theme) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.default}`,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    backgroundColor: theme.customTokens.neutrals[100],
    color: theme.customTokens.neutrals[700],
    fontSize: "13px",
    fontWeight: 600,
    letterSpacing: "0.02em",
    textTransform: "uppercase" as const,
    minWidth: 180,
    py: theme.spacing(1.1),
    px: theme.spacing(1.25),
    whiteSpace: "nowrap",
  } as const;
}

function getDialogBodyCellSx(theme: import("@mui/material/styles").Theme) {
  return {
    borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    color: theme.customTokens.text.primary,
    fontSize: "14px",
    fontWeight: 400,
    minWidth: 180,
    py: theme.spacing(1.15),
    px: theme.spacing(1.25),
    verticalAlign: "top",
    whiteSpace: "nowrap",
  } as const;
}
