import { useMemo, useState } from "react";
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
  Eye,
  Pencil,
  Plus,
  RotateCcw,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

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
  const [activeTab, setActiveTab] = useState<ListingTab>("issued");
  const [searchValue, setSearchValue] = useState("");
  const [revertedRowIds, setRevertedRowIds] = useState<string[]>([]);
  const [rejectedDoneRows, setRejectedDoneRows] = useState<Row[]>([]);
  const [inspectionCompletedRows, setInspectionCompletedRows] = useState<Row[]>([]);
  const [splicingOrderIssue, setSplicingOrderIssue] =
    useState<SplicingOrderIssueState<Row> | null>(null);
  const [groupingSampleIssue, setGroupingSampleIssue] =
    useState<GroupingSampleIssueState<Row> | null>(null);
  const [groupingOrderIssue, setGroupingOrderIssue] =
    useState<GroupingOrderIssueState<Row> | null>(null);
  const groupedStockIssues = useGroupedStockSampleIssues();
  const sampleSheetRecords = useSampleSheetRecords();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const isGroupingModule = definition.slug === "grouping";
  const isGroupingDoneTab = isGroupingModule && activeTab === "done";
  const isInspectionModule = definition.slug === "inspection";
  const supportsSamplePurposeColumn =
    definition.slug === "marquetry" ||
    definition.slug === "splicing" ||
    definition.slug === "pressing" ||
    definition.slug === "cnc-fluting" ||
    definition.slug === "embossing" ||
    definition.slug === "finishing";
  const isDryingDoneTab = definition.slug === "drying" && activeTab === "done";
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
        .filter((item) => item.sourceSlug === definition.slug)
        .map((item) => item.sourceRowId),
    );
    const baseRowsForTab = getFactoryRowsForTab(definition.rows, activeTab).filter(
      (row) => !movedSourceRowIds.has(String(row.id)),
    );
    const rowsForTab =
      activeTab === "rejected"
        ? [...baseRowsForTab, ...rejectedDoneRows]
        : isInspectionModule && activeTab === "issued"
          ? baseRowsForTab.filter(
              (row) => !inspectionCompletedRows.some((completed) => completed.id === row.id),
            )
          : isInspectionModule && activeTab === "done"
            ? [...baseRowsForTab, ...inspectionCompletedRows]
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

        if (isGroupingDoneTab) {
          const available = getAvailableGroupedSheets(sourceNormalizedRow);
          const original = getOriginalGroupedSheets(sourceNormalizedRow);

          return {
            ...sourceNormalizedRow,
            availableSheets: String(available),
            noOfSheets: String(original),
            for: "Order",
            forLabel: "Order",
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

        return sourceNormalizedRow;
      });
  }, [
    activeTab,
    definition.rows,
    definition.slug,
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
      columns = columns.filter((column) => column.key !== "groupNo");
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
      return withOptionalColumn(columns, {
        key: "availableSheets",
        label: "Available Sheets",
      });
    }

    return columns;
  }, [
    activeTab,
    definition.listColumns,
    isDryingDoneTab,
    isGroupingDoneTab,
    isGroupingModule,
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
                onSelect: (row: Row) => navigate(paths.view(row.id)),
              },
            ]
          : []),
        ...(canEdit && activeTab !== "issued"
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
          onSelect: (row) =>
            setRevertedRowIds((current) =>
              current.includes(row.id) ? current : [...current, row.id],
            ),
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
                  id: "proceed-for-inspection",
                  label: "Proceed for Inspection",
                  icon: Plus,
                  tone: "primary" as const,
                  onSelect: (selectedRow: Row) => {
                    issueFactoryWork({
                      destinationProcess: "Inspection",
                      sourceSlug: definition.slug,
                      sourceProcess: "Drying",
                      sourceWarehouseName: getFactoryString(selectedRow.warehouseName),
                      sourceRow: selectedRow,
                    });
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
      };
    }

    if (isInspectionModule && activeTab === "issued") {
      return (row) => [
        ...rowActions,
        ...(canCreate
          ? [
              {
                id: "inspection-done",
                label: "Inspection Done",
                icon: Plus,
                tone: "primary" as const,
                onSelect: (selectedRow: Row) => {
                  const workItemId = getFactoryString(selectedRow.workItemId);

                  if (workItemId) {
                    completeFactoryIssuedWork(workItemId);
                  } else {
                    setInspectionCompletedRows((current) =>
                      current.some((entry) => entry.id === selectedRow.id)
                        ? current
                        : [...current, { ...selectedRow, listingState: "done" }],
                    );
                  }
                },
              },
            ]
          : []),
      ];
    }

    if (isInspectionModule && activeTab === "done") {
      return (row) => [
        ...doneActions,
        ...(canCreate
          ? [
              {
                id: "move-to-warehouse-c",
                label: "Move to Warehouse C",
                icon: Plus,
                tone: "primary" as const,
                onSelect: (selectedRow: Row) => {
                  moveFactoryRowToWarehouseC(selectedRow);
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
            direction={{ xs: "column", lg: "row" }}
            alignItems={{ xs: "stretch", lg: "center" }}
            justifyContent="space-between"
            spacing={1.5}
          >
            <ClearableSearchField
              value={searchValue}
              onChange={setSearchValue}
              placeholder={`Search ${definition.title.toLowerCase()}...`}
              sx={{
                width: { xs: "100%", sm: 300 },
                maxWidth: "100%",
              }}
            />
            <FactoryToolbar />
          </Stack>

          <EnterpriseDataTable
            key={`${definition.slug}-${activeTab}`}
            actions={rowActions}
            columns={tableColumns}
            defaultRowsPerPage={10}
            emptyStateLabel={`No ${definition.title.toLowerCase()} records are available for this tab.`}
            rows={canView ? tableRows : []}
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
    </>
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

  return {
    ...row,
    ...(bundleNumber ? { bundleNumber } : {}),
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
    embossing: "Pressing",
    finishing: "Pressing",
    grouping: "Inventory",
    marquetry: "Splicing",
    pressing: "Splicing",
    "sample-sheets": "Grouping",
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
  Inspection: "/warehouse-b?section=inspection",
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
