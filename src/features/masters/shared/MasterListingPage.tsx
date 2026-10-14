import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Snackbar,
  Stack,
} from "@mui/material";
import { Eye, Pencil, Plus } from "lucide-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router";

import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import { EnterpriseDataTable } from "../../../components/data-display/EnterpriseDataTable";
import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { getListingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import {
  canAccessAnyAction,
  canAccessPermission,
  getMasterPermissionKey,
} from "../../permissions";
import { MasterPageShell } from "./MasterPageShell";
import {
  buildLocalMasterDefinition,
  updateLocalMasterStatus,
} from "./localMasterStore";
import type { MasterDefinition, MasterRecord } from "./types";
import { formatMasterValue, getMasterPaths } from "./utils";
import type { ColumnFilterValue } from "../../shared/columnFilters";

interface MasterListingPageProps {
  definition: MasterDefinition;
  /** When provided, rows come from the parent (e.g. API) instead of local mock store. */
  rows?: MasterRecord[];
  loading?: boolean;
  errorMessage?: string;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  /** Server-side search: skip client filtering of provided rows. */
  serverSearch?: boolean;
  onStatusChange?: (
    row: MasterRecord,
    checked: boolean,
  ) => Promise<void> | void;
  /** Server-side pagination controls. */
  pagination?: {
    page: number;
    rowsPerPage: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onRowsPerPageChange: (rowsPerPage: number) => void;
  };
  /** Server-side sorting controls. */
  sorting?: {
    sortBy: string | null;
    sortOrder: "asc" | "desc" | null;
    onSortChange: (sortBy: string | null, sortOrder: "asc" | "desc" | null) => void;
  };
  columnFilters?: Partial<Record<string, ColumnFilterValue>>;
  onColumnFiltersChange?: (
    nextFilters: Partial<Record<string, ColumnFilterValue>>,
  ) => void;
  filterOptionsByColumn?: Record<
    string,
    Array<{ value: string; label: string }>
  >;
  /** Called when a column filter menu is opened (lazy-load options). */
  onColumnFilterOpen?: (columnKey: string) => void;
}

export function MasterListingPage({
  definition,
  rows: remoteRows,
  loading = false,
  errorMessage = "",
  searchValue: controlledSearch,
  onSearchChange,
  serverSearch = false,
  onStatusChange,
  pagination,
  sorting,
  columnFilters,
  onColumnFiltersChange,
  filterOptionsByColumn,
  onColumnFilterOpen,
}: MasterListingPageProps) {
  const localDefinition = useMemo(
    () => buildLocalMasterDefinition(definition),
    [definition],
  );
  const paths = getMasterPaths(localDefinition.slug);
  const permissionKey = getMasterPermissionKey(localDefinition.slug);
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const canOpenPage = canAccessAnyAction(permissionKey);
  const navigate = useNavigate();
  const location = useLocation();
  const [internalSearch, setInternalSearch] = useState("");
  const searchValue = controlledSearch ?? internalSearch;
  const setSearchValue = onSearchChange ?? setInternalSearch;
  const sourceRows = remoteRows ?? localDefinition.rows;
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);
  const [statusConfirmDialog, setStatusConfirmDialog] = useState<{
    open: boolean;
    row: MasterRecord | null;
    checked: boolean;
  }>({
    open: false,
    row: null,
    checked: false,
  });

  useEffect(() => {
    const flashMessage = (location.state as { masterFlashMessage?: string } | null)
      ?.masterFlashMessage;

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

  const filteredRows = useMemo(() => {
    if (serverSearch) {
      return sourceRows;
    }

    return sourceRows.filter((row) => {
      const matchesSearch =
        searchValue.trim().length === 0 ||
        Object.values(row).some((value) =>
          formatMasterValue(value)
            .toLowerCase()
            .includes(searchValue.trim().toLowerCase()),
        );

      return matchesSearch;
    });
  }, [searchValue, serverSearch, sourceRows]);

  const entityLabel = localDefinition.title.replace(/ Master$/, "");
  const addButtonLabel = `Add ${entityLabel}`;
  const searchPlaceholder = "Search...";

  const getRecordDisplayName = (row: MasterRecord | null): string => {
    if (!row) return `this ${entityLabel.toLowerCase()}`;

    // Priority 1: Check known module-specific name fields
    const candidates = [
      row.colorName,
      row.customerName,
      row.supplierName,
      row.transporterName,
      row.warehouseName,
      row.departmentName,
      row.unitName,
      row.gradeName,
      row.cutName,
      row.currencyName,
      row.categoryName,
      row.subCategoryName,
      row.itemName,
      row.companyName,
      row.hsnCode,
      row.gstPercentage ? `${row.gstPercentage}%` : "",
      row.name,
      row.code,
      row.title,
      row.symbolicName,
      row.percentage ? `${row.percentage}%` : "",
    ];

    for (const val of candidates) {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        return String(val).trim();
      }
    }

    // Priority 2: Check columns in definition order for first non-id, non-status, non-audit column
    const skippedKeys = new Set([
      "id",
      "status",
      "statusLabel",
      "isActive",
      "srNo",
      "createdById",
      "updatedById",
      "createdBy",
      "editedBy",
      "updatedBy",
      "createdAt",
      "createdDate",
      "updatedAt",
      "updatedDate",
      "actions",
    ]);

    for (const col of localDefinition.columns) {
      if (!skippedKeys.has(col.key)) {
        const val = row[col.key];
        if (val !== undefined && val !== null && String(val).trim() !== "") {
          return formatMasterValue(val);
        }
      }
    }

    return String(row.id || entityLabel);
  };

  const executeStatusChange = async (row: MasterRecord, checked: boolean) => {
    const itemName = getRecordDisplayName(row);

    try {
      if (onStatusChange) {
        await onStatusChange(row, checked);
      } else {
        updateLocalMasterStatus(localDefinition, row, checked);
      }

      setToastNotification({
        message: `${entityLabel} "${itemName}" ${checked ? "activated" : "deactivated"} successfully.`,
        severity: "success",
      });
    } catch (error) {
      setToastNotification({
        message:
          error instanceof Error
            ? error.message
            : `Unable to ${checked ? "activate" : "deactivate"} ${entityLabel.toLowerCase()}.`,
        severity: "error",
      });
      throw error;
    }
  };

  const handleStatusChange = async (row: MasterRecord, checked: boolean) => {
    if (!checked) {
      // Deactivating is an important/destructive action; prompt confirmation
      setStatusConfirmDialog({
        open: true,
        row,
        checked,
      });
      return;
    }

    await executeStatusChange(row, checked);
  };


  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Masters", to: "/masters" },
        { label: localDefinition.title },
      ]}
      title={localDefinition.title}
      subtitle=" "
      contentGap={2}
    >
      {!canOpenPage ? (
        <Alert severity="warning">
          You do not have permission to access this master.
        </Alert>
      ) : null}

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <ClearableSearchField
          value={searchValue}
          onChange={setSearchValue}
          placeholder={searchPlaceholder}
          sx={{
            width: { xs: "100%", sm: 300 },
            maxWidth: "100%",
          }}
        />

        {canCreate ? (
          <Button
            component={RouterLink}
            to={paths.add}
            variant="contained"
            startIcon={<Plus size={15} />}
            sx={(theme) => getListingToolbarButtonSx(theme)}
          >
            {addButtonLabel}
          </Button>
        ) : null}
      </Stack>

      <Stack
        sx={(theme) => ({
          pt: theme.spacing(0.5),
        })}
      >
        <EnterpriseDataTable
          columns={localDefinition.columns}
          loading={loading}
          onStatusChange={handleStatusChange}
          rows={canView ? filteredRows : []}
          {...(canEdit ? { isStatusChangeDisabled: () => false } : { isStatusChangeDisabled: () => true })}
          {...(canView || canEdit
            ? {
                getRowActions: (row: MasterRecord) => {
                  const rowActions: EnterpriseTableAction<MasterRecord>[] = [];

                  if (canView) {
                    rowActions.push({
                      id: "view",
                      label: "View",
                      icon: Eye,
                      onSelect: () => navigate(paths.view(row.id)),
                    });
                  }

                  if (canEdit) {
                    rowActions.push({
                      id: "edit",
                      label: "Edit",
                      icon: Pencil,
                      onSelect: () => navigate(paths.edit(row.id)),
                    });
                  }

                  return rowActions;
                },
              }
            : {})}
          {...(pagination ? { pagination } : {})}
          {...(sorting
            ? {
                sorting: {
                  sortBy: sorting.sortBy,
                  sortOrder: sorting.sortOrder,
                  onSortChange: sorting.onSortChange,
                  onSortClear: () => sorting.onSortChange(null, null),
                },
              }
            : {})}
          {...(columnFilters ? { columnFilters } : {})}
          {...(onColumnFiltersChange ? { onColumnFiltersChange } : {})}
          {...(filterOptionsByColumn ? { filterOptionsByColumn } : {})}
          {...(onColumnFilterOpen ? { onColumnFilterOpen } : {})}
        />
      </Stack>

      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={3500}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            variant="filled"
            sx={{ width: "100%", boxShadow: 3 }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>

      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel="Deactivate"
        description={`Are you sure you want to deactivate ${
          statusConfirmDialog.row
            ? `"${getRecordDisplayName(statusConfirmDialog.row)}" ${entityLabel.toLowerCase()}`
            : `this ${entityLabel.toLowerCase()}`
        }? Inactive records may not appear in active transaction lookups.`}
        onClose={() =>
          setStatusConfirmDialog({ open: false, row: null, checked: false })
        }
        onConfirm={async () => {
          const { row, checked } = statusConfirmDialog;
          setStatusConfirmDialog({ open: false, row: null, checked: false });
          if (row) {
            await executeStatusChange(row, checked);
          }
        }}
        open={statusConfirmDialog.open}
        title={`Deactivate ${entityLabel}`}
        tone="danger"
      />
    </MasterPageShell>
  );
}
