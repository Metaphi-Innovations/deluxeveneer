import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  Stack,
} from "@mui/material";
import { Plus } from "lucide-react";
import { Link as RouterLink } from "react-router";

import { getListingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { ContentLoader } from "../../../components/feedback/ContentLoader";
import {
  canAccessAnyAction,
  canAccessPermission,
  getMasterPermissionKey,
} from "../../permissions";
import { MasterPageShell } from "./MasterPageShell";
import { MasterTable } from "./MasterTable";
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
    onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
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
  const [internalSearch, setInternalSearch] = useState("");
  const searchValue = controlledSearch ?? internalSearch;
  const setSearchValue = onSearchChange ?? setInternalSearch;
  const sourceRows = remoteRows ?? localDefinition.rows;

  // Local input state and debounce effect to avoid immediate API firing on every keystroke
  const [inputValue, setInputValue] = useState(searchValue);

  useEffect(() => {
    setInputValue(searchValue);
  }, [searchValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== searchValue) {
        setSearchValue(inputValue);
      }
    }, 450);

    return () => {
      clearTimeout(handler);
    };
  }, [inputValue, searchValue, setSearchValue]);

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val === "") {
      setSearchValue("");
    }
  };

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

  const handleStatusChange = async (row: MasterRecord, checked: boolean) => {
    if (onStatusChange) {
      await onStatusChange(row, checked);
      return;
    }

    updateLocalMasterStatus(localDefinition, row, checked);
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
          value={inputValue}
          onChange={handleInputChange}
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
        <MasterTable
          canChangeStatus={canEdit}
          canEdit={canEdit}
          canView={canView}
          columns={localDefinition.columns}
          getEditPath={paths.edit}
          getViewPath={paths.view}
          onStatusChange={handleStatusChange}
          loading={loading}
          {...(pagination ? { pagination } : {})}
          {...(sorting ? { sorting } : {})}
          {...(columnFilters ? { columnFilters } : {})}
          {...(onColumnFiltersChange ? { onColumnFiltersChange } : {})}
          {...(filterOptionsByColumn ? { filterOptionsByColumn } : {})}
          {...(onColumnFilterOpen ? { onColumnFilterOpen } : {})}
          rows={canView ? filteredRows : []}
        />
      </Stack>
    </MasterPageShell>
  );
}
