import { useEffect, useMemo, useState } from "react";
import type { Dispatch, MouseEvent, ReactNode, SetStateAction, WheelEvent } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
  ChevronLeft,
  ChevronRight,
  Eye,
  ListFilter,
  MoreHorizontal,
  Pencil,
} from "lucide-react";
import {
  Box,
  Avatar,
  Button,
  Chip,
  Checkbox,
  IconButton,
  MenuItem,
  Select,
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
import type { Theme } from "@mui/material/styles";

import { ErpToggleSwitch } from "../inputs/ErpToggleSwitch";
import type { ColumnFilterOption } from "../../features/shared/SearchableMultiSelectColumnFilter";
import { formatDisplayValueByField } from "../../features/shared/numberFormat";
import {
  ActiveColumnFiltersBar,
  buildActiveFilterChips,
  buildDistinctColumnFilterOptions,
  ColumnFilterPopoverRouter,
  getColumnFilterBadgeCount,
  isActiveColumnFilter,
  matchColumnFilter,
  type ColumnFilterType,
  type ColumnFilterValue,
} from "../../features/shared/columnFilters";
import { actionMenuTriggerSx } from "../../features/shared/actionMenuStyles";
import {
  isFilterableListingColumn,
  resolveListingColumnFilterType,
} from "../../features/shared/listingColumnFilters";
import {
  getListingColumnMinWidth,
  listingPageNumberButtonSx,
  listingPaginationIconButtonSx,
  listingTableBodyCellSx,
  listingTableContainerSx,
  listingTableHeaderCellSx,
  listingTableHeaderIconButtonSx,
} from "../../features/shared/listingTableStyles";
import {
  portalIconSize,
  portalIconStroke,
} from "../../features/shared/portalIconStandards";
import { RowActionsMenu } from "../../features/shared/RowActionsMenu";

export type EnterpriseTableCellValue =
  | string
  | boolean
  | Date
  | null
  | undefined;

export type EnterpriseTableRow = {
  id: string;
  [key: string]: EnterpriseTableCellValue;
};

export type EnterpriseTableSortDirection = "asc" | "desc";

export type EnterpriseTableSortConfig<
  Row extends EnterpriseTableRow = EnterpriseTableRow,
> = {
  direction: EnterpriseTableSortDirection;
  key: keyof Row & string;
} | null;

export interface EnterpriseTableColumn<
  Row extends EnterpriseTableRow = EnterpriseTableRow,
> {
  key: keyof Row & string;
  label: string;
  /** When set, overrides automatic filterability heuristics. */
  filterable?: boolean;
  /** When set, overrides automatic filter-type inference. */
  filterType?: ColumnFilterType;
}

type AuditColumnType = "created" | "updated";

type EnterpriseDisplayTableColumn<
  Row extends EnterpriseTableRow = EnterpriseTableRow,
> = EnterpriseTableColumn<Row> & {
  audit?: {
    dateKey?: keyof Row & string;
    nameKey?: keyof Row & string;
    type: AuditColumnType;
  };
};

export interface EnterpriseTableAction<
  Row extends EnterpriseTableRow = EnterpriseTableRow,
> {
  id: string;
  label: string;
  icon?: LucideIcon;
  onSelect: (row: Row) => void;
  tone?: "primary" | "danger" | "default";
}

interface EnterpriseDataTableProps<Row extends EnterpriseTableRow> {
  actions?: readonly EnterpriseTableAction<Row>[];
  actionColumnLabel?: string;
  actionColumnWidth?: number;
  columns: readonly EnterpriseTableColumn<Row>[];
  defaultRowsPerPage?: number;
  emptyStateLabel?: string;
  getRowActions?: (row: Row) => readonly EnterpriseTableAction<Row>[];
  hidePagination?: boolean;
  initialSort?: EnterpriseTableSortConfig<Row>;
  isStatusChangeDisabled?: (row: Row) => boolean;
  maxBodyHeight?: number;
  onSelectionChange?: (rows: Row[]) => void;
  onStatusChange?: (row: Row, checked: boolean) => Promise<void> | void;
  renderActionCell?: (row: Row) => ReactNode;
  rows: readonly Row[];
  rowsPerPageOptions?: readonly number[];
  selectionResetKey?: string | number;
  selectable?: boolean;
}

export function EnterpriseDataTable<Row extends EnterpriseTableRow>({
  actions = [],
  actionColumnLabel = "Actions",
  actionColumnWidth = 64,
  columns,
  defaultRowsPerPage = 10,
  emptyStateLabel = "No records found.",
  getRowActions,
  hidePagination = false,
  initialSort = null,
  isStatusChangeDisabled,
  maxBodyHeight = 440,
  onSelectionChange,
  onStatusChange,
  renderActionCell,
  rows,
  rowsPerPageOptions = [10, 25, 50, 75, 100, 200],
  selectionResetKey,
  selectable = false,
}: EnterpriseDataTableProps<Row>) {
  const theme = useTheme();
  const [sortConfig, setSortConfig] =
    useState<EnterpriseTableSortConfig<Row>>(initialSort);
  const [filters, setFilters] = useState<
    Partial<Record<keyof Row & string, ColumnFilterValue>>
  >({});
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(defaultRowsPerPage);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [activeFilterColumn, setActiveFilterColumn] = useState<
    (keyof Row & string) | null
  >(null);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [activeActionRowId, setActiveActionRowId] = useState<string | null>(
    null,
  );
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>(
    {},
  );

  const usesActionMenu = actions.length > 0 || Boolean(getRowActions);
  const hasActions = usesActionMenu || Boolean(renderActionCell);
  const displayColumns = useMemo(
    () => getEnterpriseDisplayColumns(columns),
    [columns],
  );

  const columnFilterMeta = useMemo(() => {
    const meta: Partial<
      Record<
        keyof Row & string,
        {
          filterType: ColumnFilterType;
          options: ColumnFilterOption[];
          uniqueCount: number;
        }
      >
    > = {};

    displayColumns.forEach((column) => {
      const sampleValues = rows.map((row) => row[column.key]);
      const filterType = resolveListingColumnFilterType({
        key: column.key,
        label: column.label,
        sampleValues,
        ...(column.filterType ? { override: column.filterType } : {}),
      });
      const formattedValues = rows.map((row) =>
        formatEnterpriseValue(row[column.key], column.key, column.label),
      );
      const options = buildDistinctColumnFilterOptions(formattedValues);

      meta[column.key] = {
        filterType,
        options,
        uniqueCount: options.length,
      };
    });

    return meta;
  }, [displayColumns, rows]);

  useEffect(() => {
    setSortConfig(initialSort);
  }, [initialSort]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(filters).every(([key, filterValue]) => {
        const typedFilter = filterValue as ColumnFilterValue | undefined;

        if (!isActiveColumnFilter(typedFilter)) {
          return true;
        }

        const rawValue = row[key as keyof Row & string];
        const cellValue = formatEnterpriseValue(
          rawValue,
          key,
          displayColumns.find((column) => column.key === key)?.label,
        ).trim();
        return matchColumnFilter(rawValue, cellValue, typedFilter);
      }),
    );
  }, [filters, rows]);

  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(filters, displayColumns),
    [displayColumns, filters],
  );

  const hasActiveFilters = activeFilterChips.length > 0;

  const sortedRows = useMemo(() => {
    if (!sortConfig) {
      return filteredRows;
    }

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeSortValue(left[sortConfig.key]);
      const rightValue = normalizeSortValue(right[sortConfig.key]);

      if (leftValue < rightValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }

      if (leftValue > rightValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }

      return 0;
    });
  }, [filteredRows, sortConfig]);

  const totalPages = Math.max(1, Math.ceil(sortedRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageStartIndex = (safePage - 1) * rowsPerPage;
  const currentPageRows = hidePagination
    ? sortedRows
    : sortedRows.slice(pageStartIndex, pageStartIndex + rowsPerPage);
  const visiblePaginationPages = getVisiblePaginationPages(totalPages);
  const currentPageIds = currentPageRows.map((row) => row.id);
  const allCurrentPageSelected =
    selectable &&
    currentPageIds.length > 0 &&
    currentPageIds.every((rowId) => selectedRowIds.includes(rowId));
  const someCurrentPageSelected =
    selectable &&
    currentPageIds.some((rowId) => selectedRowIds.includes(rowId)) &&
    !allCurrentPageSelected;
  const rangeStart =
    sortedRows.length === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = hidePagination
    ? sortedRows.length
    : Math.min(pageStartIndex + rowsPerPage, sortedRows.length);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedRowIds.includes(row.id)),
    [rows, selectedRowIds],
  );

  const activeFilterMeta = activeFilterColumn
    ? columnFilterMeta[activeFilterColumn]
    : undefined;
  const activeFilterColumnDef = activeFilterColumn
    ? displayColumns.find((column) => column.key === activeFilterColumn)
    : undefined;

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    onSelectionChange?.(selectedRows);
  }, [onSelectionChange, selectedRows]);

  useEffect(() => {
    if (!selectable) {
      return;
    }

    setSelectedRowIds([]);
  }, [selectable, selectionResetKey]);

  const handleHorizontalWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!event.shiftKey || Math.abs(event.deltaY) < Math.abs(event.deltaX)) {
      return;
    }

    event.currentTarget.scrollLeft += event.deltaY;
    event.preventDefault();
  };

  const handleSort = (columnKey: keyof Row & string) => {
    setPage(1);
    setSortConfig((current) => {
      if (!current || current.key !== columnKey) {
        return { key: columnKey, direction: "asc" };
      }

      return {
        key: columnKey,
        direction: current.direction === "asc" ? "desc" : "asc",
      };
    });
  };

  const handleOpenFilter = (
    columnKey: keyof Row & string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    setActiveFilterColumn(columnKey);
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setFilterMenuAnchor(null);
    setActiveFilterColumn(null);
  };

  const handleApplyFilter = (nextFilter: ColumnFilterValue | null) => {
    if (!activeFilterColumn) {
      return;
    }

    setFilters((current) => {
      const nextFilters = { ...current };

      if (!nextFilter || !isActiveColumnFilter(nextFilter)) {
        delete nextFilters[activeFilterColumn];
      } else {
        nextFilters[activeFilterColumn] = nextFilter;
      }

      return nextFilters;
    });
    setPage(1);
  };

  const handleApplyMultiSelectFilter = (values: string[]) => {
    handleApplyFilter(
      values.length === 0
        ? null
        : {
            type: "multiSelect",
            values,
          },
    );
  };

  const handleClearFilter = (columnKey?: keyof Row & string) => {
    const targetKey = columnKey ?? activeFilterColumn;

    if (!targetKey) {
      return;
    }

    setFilters((current) => {
      const nextFilters = { ...current };
      delete nextFilters[targetKey];
      return nextFilters;
    });
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setFilters({});
    setPage(1);
  };

  const handleToggleRowSelection = (rowId: string) => {
    setSelectedRowIds((current) =>
      current.includes(rowId)
        ? current.filter((selectedRowId) => selectedRowId !== rowId)
        : [...current, rowId],
    );
  };

  const handleTogglePageSelection = () => {
    if (!selectable) {
      return;
    }

    setSelectedRowIds((current) => {
      if (allCurrentPageSelected || someCurrentPageSelected) {
        return current.filter((rowId) => !currentPageIds.includes(rowId));
      }

      return Array.from(new Set([...current, ...currentPageIds]));
    });
  };

  const handleOpenActionMenu = (
    rowId: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setActiveActionRowId(rowId);
    setActionMenuAnchor(event.currentTarget);
  };

  const handleCloseActionMenu = () => {
    setActionMenuAnchor(null);
    setActiveActionRowId(null);
  };

  const activeRow =
    activeActionRowId === null
      ? undefined
      : rows.find((row) => row.id === activeActionRowId);
  const activeRowActions = activeRow
    ? getRowActions?.(activeRow) ?? actions
    : actions;

  return (
    <Stack spacing={1.25}>
      {hasActiveFilters ? (
        <ActiveColumnFiltersBar
          filters={activeFilterChips}
          onClearAll={handleClearAllFilters}
          onRemove={(columnKey) =>
            handleClearFilter(columnKey as keyof Row & string)
          }
        />
      ) : null}

      <Box sx={listingTableContainerSx(theme)}>
        <TableContainer
          onWheel={handleHorizontalWheel}
          sx={{
            maxHeight: rowsPerPage === defaultRowsPerPage ? "none" : maxBodyHeight,
            overflowX: "auto",
            overflowY: rowsPerPage === defaultRowsPerPage ? "hidden" : "auto",
            scrollbarWidth: "thin",
            scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: theme.customTokens.surfaces.alt,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: theme.customTokens.brand.primary,
              borderRadius: theme.customTokens.radius.pill,
              border: `1px solid ${theme.customTokens.surfaces.alt}`,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: theme.customTokens.brand.secondary,
            },
          }}
        >
          <Table
            stickyHeader
            sx={{
              width: "max-content",
              minWidth: "100%",
              tableLayout: "auto",
              "& .MuiTableCell-root": {
                whiteSpace: "nowrap",
              },
            }}
          >
            <TableHead>
              <TableRow>
                {selectable ? (
                  <TableCell
                    sx={[
                      listingTableHeaderCellSx(theme),
                      compactCheckboxCellSx,
                    ]}
                  >
                    <Checkbox
                      checked={Boolean(allCurrentPageSelected)}
                      indeterminate={Boolean(someCurrentPageSelected)}
                      onChange={handleTogglePageSelection}
                      size="small"
                      sx={headerCheckboxSx(theme)}
                    />
                  </TableCell>
                ) : null}

                {displayColumns.map((column) => {
                  const isSorted = sortConfig?.key === column.key;
                  const columnFilter = filters[column.key];
                  const isFiltered = isActiveColumnFilter(columnFilter);
                  const filterBadgeCount = getColumnFilterBadgeCount(columnFilter);
                  const uniqueCount =
                    columnFilterMeta[column.key]?.uniqueCount ?? 0;
                  const columnFilterType =
                    columnFilterMeta[column.key]?.filterType;
                  const showFilter = isFilterableListingColumn(
                    column.key,
                    column.label,
                    uniqueCount,
                    column.filterable,
                    columnFilterType,
                  );

                  const columnMinWidth = getListingColumnMinWidth(
                    column.key,
                    column.label,
                  );

                  return (
                    <TableCell
                      key={column.key}
                      sx={{
                        ...listingTableHeaderCellSx(theme),
                        ...(columnMinWidth
                          ? { minWidth: columnMinWidth }
                          : {}),
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: theme.spacing(0.75),
                        }}
                      >
                        <Typography
                          variant="subtitle2"
                          sx={{
                            fontSize: "inherit",
                            fontWeight: "inherit",
                            letterSpacing: "inherit",
                            textTransform: "inherit",
                            color: "inherit",
                            lineHeight: 1.2,
                          }}
                        >
                          {column.label}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() => handleSort(column.key)}
                          sx={listingTableHeaderIconButtonSx(theme)}
                        >
                          <SortIndicator
                            active={isSorted}
                            direction={sortConfig?.direction}
                          />
                        </IconButton>

                        {showFilter ? (
                          <IconButton
                            size="small"
                            aria-label={`Filter by ${column.label}`}
                            onClick={(event) =>
                              handleOpenFilter(column.key, event)
                            }
                            sx={{
                              ...listingTableHeaderIconButtonSx(theme),
                              position: "relative",
                              color: isFiltered
                                ? theme.customTokens.brand.primary
                                : theme.customTokens.text.secondary,
                            }}
                          >
                            <ListFilter
                              size={portalIconSize.tableHeader}
                              strokeWidth={portalIconStroke.default}
                            />
                            {isFiltered && filterBadgeCount > 0 ? (
                              <Box
                                sx={{
                                  position: "absolute",
                                  top: -3,
                                  right: -4,
                                  minWidth: 14,
                                  height: 14,
                                  px: 0.35,
                                  borderRadius: "999px",
                                  backgroundColor:
                                    theme.customTokens.brand.primary,
                                  color: "#FFFFFF",
                                  fontSize: "0.625rem",
                                  fontWeight: 700,
                                  lineHeight: "14px",
                                  textAlign: "center",
                                }}
                              >
                                {filterBadgeCount > 9 ? "9+" : filterBadgeCount}
                              </Box>
                            ) : null}
                          </IconButton>
                        ) : null}
                      </Box>
                    </TableCell>
                  );
                })}

                {hasActions ? (
                  <TableCell
                    sx={actionHeaderCellSx(theme, actionColumnWidth)}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontSize: "inherit",
                        fontWeight: "inherit",
                        letterSpacing: "inherit",
                        textTransform: "inherit",
                        color: "inherit",
                        lineHeight: 1.2,
                      }}
                    >
                      {actionColumnLabel}
                    </Typography>
                  </TableCell>
                ) : null}
              </TableRow>
            </TableHead>

            <TableBody>
              {currentPageRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={
                      displayColumns.length +
                      (selectable ? 1 : 0) +
                      (hasActions ? 1 : 0)
                    }
                    sx={emptyStateCellSx(theme)}
                  >
                    {emptyStateLabel}
                  </TableCell>
                </TableRow>
              ) : null}

              {currentPageRows.map((row) => {
                const isSelected = selectedRowIds.includes(row.id);

                return (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={
                      selectable
                        ? () => handleToggleRowSelection(row.id)
                        : undefined
                    }
                    sx={{
                      cursor: selectable ? "pointer" : "default",
                      "& td": {
                        backgroundColor: isSelected
                          ? theme.customTokens.navigation.activeBackground
                          : theme.customTokens.surfaces.surface,
                      },
                      "&:hover td": {
                        backgroundColor: isSelected
                          ? theme.customTokens.brand.primaryScale[100]
                          : theme.customTokens.surfaces.alt,
                      },
                    }}
                  >
                    {selectable ? (
                      <TableCell
                        sx={[
                          listingTableBodyCellSx(theme),
                          compactCheckboxCellSx,
                        ]}
                      >
                        <Checkbox
                          checked={isSelected}
                          onClick={(event) => event.stopPropagation()}
                          onChange={() => handleToggleRowSelection(row.id)}
                          size="small"
                          sx={compactCheckboxSx}
                        />
                      </TableCell>
                    ) : null}

                    {displayColumns.map((column) => {
                      const columnMinWidth = getListingColumnMinWidth(
                        column.key,
                        column.label,
                      );

                      return (
                        <TableCell
                          key={column.key}
                          sx={{
                            ...listingTableBodyCellSx(theme),
                            ...(columnMinWidth
                              ? { minWidth: columnMinWidth }
                              : {}),
                          }}
                        >
                          {renderEnterpriseTableCell(
                            row,
                            column,
                            statusOverrides,
                            setStatusOverrides,
                            isStatusChangeDisabled,
                            onStatusChange,
                            theme,
                          )}
                        </TableCell>
                      );
                    })}

                    {hasActions ? (
                      <TableCell
                        sx={actionBodyCellSx(theme, actionColumnWidth)}
                      >
                        {renderActionCell ? (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            {renderActionCell(row)}
                          </Box>
                        ) : (
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <IconButton
                              size="small"
                              aria-label="Open row actions"
                              onClick={(event) =>
                                handleOpenActionMenu(row.id, event)
                              }
                              sx={actionMenuTriggerSx(theme)}
                            >
                              <MoreHorizontal
                                size={portalIconSize.md}
                                strokeWidth={portalIconStroke.default}
                              />
                            </IconButton>
                          </Box>
                        )}
                      </TableCell>
                    ) : null}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        {!hidePagination ? (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: theme.spacing(2),
              flexWrap: "wrap",
              borderTop: `1px solid ${theme.customTokens.borders.divider}`,
              px: { xs: theme.spacing(1.25), md: theme.spacing(1.5) },
              py: theme.spacing(1),
              backgroundColor: theme.customTokens.surfaces.surface,
              minHeight: 34,
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "12px", lineHeight: 1.35 }}
            >
              Showing {rangeStart}–{rangeEnd} of {sortedRows.length}
              {hasActiveFilters ? " matching records" : " records"}
            </Typography>

            <Stack
              direction="row"
              alignItems="center"
              spacing={1.5}
              flexWrap="wrap"
              useFlexGap
            >
              <Stack direction="row" alignItems="center" spacing={0.75}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "12px" }}
                >
                  Rows per page
                </Typography>

                <Select
                  size="small"
                  value={String(rowsPerPage)}
                  onChange={(event) => {
                    setRowsPerPage(Number(event.target.value));
                    setPage(1);
                  }}
                  sx={{
                    minWidth: 64,
                    height: 30,
                    borderRadius: `${theme.customTokens.radius.sm}px`,
                    fontSize: "12px",
                    fontWeight: 400,
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: theme.customTokens.borders.default,
                    },
                    "& .MuiSelect-select": {
                      fontSize: "12px",
                      fontWeight: 400,
                      py: 0,
                      display: "flex",
                      alignItems: "center",
                    },
                  }}
                >
                  {rowsPerPageOptions.map((option) => (
                    <MenuItem key={option} value={String(option)}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </Stack>

              <Stack direction="row" alignItems="center" spacing={0.5}>
                <IconButton
                  aria-label="Previous page"
                  size="small"
                  disabled={safePage === 1}
                  onClick={() => setPage((current) => Math.max(current - 1, 1))}
                  sx={listingPaginationIconButtonSx(theme)}
                >
                  <ChevronLeft size={16} />
                </IconButton>

                {visiblePaginationPages.map((pageItem, index) =>
                  pageItem === "ellipsis" ? (
                    <Typography
                      key={`pagination-ellipsis-${index}`}
                      variant="caption"
                      color="text.secondary"
                      sx={{ px: 0.5 }}
                    >
                      …
                    </Typography>
                  ) : (
                    <Button
                      key={pageItem}
                      size="small"
                      onClick={() => setPage(pageItem)}
                      sx={listingPageNumberButtonSx(
                        theme,
                        pageItem === safePage,
                      )}
                    >
                      {pageItem}
                    </Button>
                  ),
                )}

                <IconButton
                  aria-label="Next page"
                  size="small"
                  disabled={safePage === totalPages}
                  onClick={() =>
                    setPage((current) => Math.min(current + 1, totalPages))
                  }
                  sx={listingPaginationIconButtonSx(theme)}
                >
                  <ChevronRight size={16} />
                </IconButton>
              </Stack>
            </Stack>
          </Box>
        ) : null}
      </Box>

      <RowActionsMenu
        anchorEl={actionMenuAnchor}
        open={Boolean(usesActionMenu && actionMenuAnchor && activeRow)}
        onClose={handleCloseActionMenu}
        actions={
          activeRow
            ? activeRowActions.map((action) => ({
                id: action.id,
                label: action.label,
                icon: action.icon,
                tone: action.tone,
                onSelect: () => action.onSelect(activeRow),
              }))
            : []
        }
      />

      {activeFilterColumnDef && activeFilterMeta ? (
        <ColumnFilterPopoverRouter
          open={Boolean(filterMenuAnchor && activeFilterColumn)}
          anchorEl={filterMenuAnchor}
          onClose={handleCloseFilter}
          label={activeFilterColumnDef.label}
          filterType={activeFilterMeta.filterType}
          options={activeFilterMeta.options}
          uniqueCount={activeFilterMeta.uniqueCount}
          value={filters[activeFilterColumn!]}
          onApply={handleApplyFilter}
          onApplyMultiSelect={handleApplyMultiSelectFilter}
          onClear={() => handleClearFilter()}
        />
      ) : null}
    </Stack>
  );

  function SortIndicator({
    active,
    direction,
  }: {
    active: boolean;
    direction?: EnterpriseTableSortDirection | undefined;
  }) {
    if (!active || !direction) {
      return (
        <ArrowUpDown
          color={theme.customTokens.neutrals[700]}
          size={portalIconSize.tableHeader}
          strokeWidth={portalIconStroke.default}
        />
      );
    }

    if (direction === "asc") {
      return (
        <ArrowUpWideNarrow
          color={theme.customTokens.brand.primary}
          size={portalIconSize.tableHeader}
          strokeWidth={portalIconStroke.emphasis}
        />
      );
    }

    return (
      <ArrowDownWideNarrow
        color={theme.customTokens.brand.primary}
        size={portalIconSize.tableHeader}
        strokeWidth={portalIconStroke.emphasis}
      />
    );
  }
}

export const standardInventoryTableActions = {
  edit: Pencil,
  view: Eye,
};

function actionHeaderCellSx(
  theme: Theme,
  actionColumnWidth: number,
) {
  return {
    ...listingTableHeaderCellSx(theme),
    position: "sticky" as const,
    right: 0,
    zIndex: 5,
    minWidth: actionColumnWidth,
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
  };
}

function actionBodyCellSx(
  theme: Theme,
  actionColumnWidth: number,
) {
  return {
    ...listingTableBodyCellSx(theme),
    position: "sticky" as const,
    right: 0,
    zIndex: 1,
    minWidth: actionColumnWidth,
    whiteSpace: "normal",
    boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
  };
}

function emptyStateCellSx(theme: Theme) {
  return {
    ...listingTableBodyCellSx(theme),
    py: theme.spacing(4),
    textAlign: "center",
    color: theme.customTokens.text.secondary,
  };
}

function headerCheckboxSx(theme: Theme) {
  return {
    ...compactCheckboxSx,
    color: theme.customTokens.text.secondary,
    "&.Mui-checked": {
      color: theme.customTokens.brand.primary,
    },
    "&.MuiCheckbox-indeterminate": {
      color: theme.customTokens.brand.primary,
    },
    "&:hover": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
  };
}

const compactCheckboxCellSx = {
  width: 40,
  minWidth: 40,
  maxWidth: 40,
  px: 0.75,
  lineHeight: 1,
};

const compactCheckboxSx = {
  p: 0,
  m: 0,
  width: 22,
  height: 22,
  color: "text.secondary",
  "& .MuiSvgIcon-root": {
    fontSize: 16,
  },
  "&.Mui-checked": {
    color: "primary.main",
  },
  "&.MuiCheckbox-indeterminate": {
    color: "primary.main",
  },
};

const enterpriseStatusToggleValueMap: Record<string, boolean> = {
  active: true,
  enabled: true,
  inactive: false,
  disabled: false,
};

function getEnterpriseStatusToggleState<Row extends EnterpriseTableRow>(
  column: EnterpriseTableColumn<Row>,
  value: EnterpriseTableCellValue,
) {
  const isStatusColumn =
    column.label === "Status" ||
    column.key === "status" ||
    column.key === "statusLabel";

  if (!isStatusColumn) {
    return null;
  }

  const normalizedValue = formatEnterpriseValue(value).trim().toLowerCase();
  return normalizedValue in enterpriseStatusToggleValueMap
    ? enterpriseStatusToggleValueMap[normalizedValue]
    : null;
}

function renderEnterpriseTableCell<Row extends EnterpriseTableRow>(
  row: Row,
  column: EnterpriseDisplayTableColumn<Row>,
  statusOverrides: Record<string, boolean>,
  setStatusOverrides: Dispatch<SetStateAction<Record<string, boolean>>>,
  isStatusChangeDisabled: EnterpriseDataTableProps<Row>["isStatusChangeDisabled"],
  onStatusChange: EnterpriseDataTableProps<Row>["onStatusChange"],
  theme: Theme,
) {
  if (column.audit) {
    return renderAuditCell(
      row[column.audit.nameKey ?? column.key],
      row[column.audit.dateKey ?? column.key],
      theme,
    );
  }

  if (column.key === "qcStatus" || column.key === "inspectionStatus") {
    return renderQcStatusChip(row[column.key], theme);
  }

  if (column.key === "for" || column.key === "forLabel") {
    return renderForPurposeBadge(row[column.key], theme);
  }

  if (isInspectionStatusValue(row[column.key])) {
    return renderQcStatusChip(row[column.key], theme);
  }

  const toggleState = getEnterpriseStatusToggleState(column, row[column.key]);

  if (toggleState === null) {
    return formatEnterpriseValue(row[column.key], column.key, column.label);
  }

  const toggleKey = `${row.id}:${column.key}`;
  const checked = statusOverrides[toggleKey] ?? Boolean(toggleState);
  const disabled = isStatusChangeDisabled?.(row) ?? false;

  return (
    <ErpToggleSwitch
      ariaLabel={`${column.label} for row ${row.id}`}
      checked={checked}
      disabled={disabled}
      onChange={(nextChecked) => {
        setStatusOverrides((current) => ({
          ...current,
          [toggleKey]: nextChecked,
        }));

        Promise.resolve(onStatusChange?.(row, nextChecked)).catch(() => {
          setStatusOverrides((current) => ({
            ...current,
            [toggleKey]: checked,
          }));
        });
      }}
    />
  );
}

function getEnterpriseDisplayColumns<Row extends EnterpriseTableRow>(
  columns: readonly EnterpriseTableColumn<Row>[],
) {
  const createdNameKey = findAuditColumnKey(columns, auditColumnKeys.createdName);
  const createdDateKey = findAuditColumnKey(columns, auditColumnKeys.createdDate);
  const updatedNameKey = findAuditColumnKey(columns, auditColumnKeys.updatedName);
  const updatedDateKey = findAuditColumnKey(columns, auditColumnKeys.updatedDate);
  const hasCreatedAudit = Boolean(createdNameKey || createdDateKey);
  const hasUpdatedAudit = Boolean(updatedNameKey || updatedDateKey);
  let createdAdded = false;
  let updatedAdded = false;
  const displayColumns: EnterpriseDisplayTableColumn<Row>[] = [];

  columns.forEach((column) => {
    if (isSerialNumberColumn(column)) {
      return;
    }

    const auditType = getAuditColumnType(column.key);

    if (!auditType) {
      displayColumns.push(column);
      return;
    }

    if (auditType === "created") {
      if (!createdAdded && hasCreatedAudit) {
        createdAdded = true;
        displayColumns.push({
          key: (createdDateKey ?? createdNameKey ?? column.key) as keyof Row &
            string,
          label: "Created",
          audit: {
            ...(createdDateKey ? { dateKey: createdDateKey } : {}),
            ...(createdNameKey ? { nameKey: createdNameKey } : {}),
            type: "created",
          },
        });
      }

      return;
    }

    if (!updatedAdded && hasUpdatedAudit) {
      updatedAdded = true;
      displayColumns.push({
        key: (updatedDateKey ?? updatedNameKey ?? column.key) as keyof Row &
          string,
        label: "Updated",
        audit: {
          ...(updatedDateKey ? { dateKey: updatedDateKey } : {}),
          ...(updatedNameKey ? { nameKey: updatedNameKey } : {}),
          type: "updated",
        },
      });
    }
  });

  return orderEnterpriseDisplayColumns(displayColumns);
}

function orderEnterpriseDisplayColumns<Row extends EnterpriseTableRow>(
  columns: readonly EnterpriseDisplayTableColumn<Row>[],
) {
  const remarkColumns = columns.filter(isEnterpriseRemarkColumn);
  const statusColumns = columns.filter(isEnterpriseStatusColumn);
  const createdColumns = columns.filter((column) => column.audit?.type === "created");
  const updatedColumns = columns.filter((column) => column.audit?.type === "updated");
  const trailingColumnKeys = new Set(
    [...remarkColumns, ...statusColumns, ...createdColumns, ...updatedColumns].map(
      (column) => column.key,
    ),
  );

  return [
    ...columns.filter((column) => !trailingColumnKeys.has(column.key)),
    ...remarkColumns,
    ...statusColumns,
    ...createdColumns,
    ...updatedColumns,
  ];
}

function isEnterpriseRemarkColumn<Row extends EnterpriseTableRow>(
  column: EnterpriseTableColumn<Row>,
) {
  const normalizedLabel = normalizeColumnIdentifier(column.label);
  const normalizedKey = normalizeColumnIdentifier(column.key);

  return (
    normalizedLabel === "remark" ||
    normalizedLabel === "remarks" ||
    normalizedKey === "remark" ||
    normalizedKey === "remarks"
  );
}

function isEnterpriseStatusColumn<Row extends EnterpriseTableRow>(
  column: EnterpriseTableColumn<Row>,
) {
  const normalizedLabel = normalizeColumnIdentifier(column.label);
  const normalizedKey = normalizeColumnIdentifier(column.key);

  return normalizedLabel === "status" || normalizedKey === "status";
}

function isSerialNumberColumn<Row extends EnterpriseTableRow>(
  column: EnterpriseTableColumn<Row>,
) {
  const normalizedLabel = normalizeColumnIdentifier(column.label);
  const normalizedKey = normalizeColumnIdentifier(column.key);

  return (
    normalizedLabel === "srno" ||
    normalizedLabel === "sno" ||
    normalizedLabel === "serialno" ||
    normalizedKey === "srno" ||
    normalizedKey === "sno" ||
    normalizedKey === "serialno"
  );
}

function normalizeColumnIdentifier(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

const auditColumnKeys = {
  createdDate: new Set(["createdDate", "createdAt", "createdEditedDate", "createdEditedAt"]),
  createdName: new Set(["createdBy", "createdEditedBy"]),
  updatedDate: new Set(["updatedDate", "updatedAt"]),
  updatedName: new Set(["updatedBy", "editedBy"]),
};

function getAuditColumnType(key: string): AuditColumnType | null {
  if (
    auditColumnKeys.createdName.has(key) ||
    auditColumnKeys.createdDate.has(key)
  ) {
    return "created";
  }

  if (
    auditColumnKeys.updatedName.has(key) ||
    auditColumnKeys.updatedDate.has(key)
  ) {
    return "updated";
  }

  return null;
}

function findAuditColumnKey<Row extends EnterpriseTableRow>(
  columns: readonly EnterpriseTableColumn<Row>[],
  keys: Set<string>,
) {
  return columns.find((column) => keys.has(column.key))?.key;
}

function renderAuditCell(
  nameValue: EnterpriseTableCellValue,
  dateValue: EnterpriseTableCellValue,
  theme: Theme,
) {
  const name = formatEnterpriseValue(nameValue) || "-";
  const date = formatEnterpriseValue(dateValue) || "-";
  const initials = getAuditInitials(name);

  return (
    <Stack direction="row" alignItems="center" spacing={1}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: theme.customTokens.brand.primary,
          color: theme.customTokens.text.inverse,
          fontSize: theme.typography.caption.fontSize,
          fontWeight: 700,
        }}
      >
        {initials}
      </Avatar>

      <Stack spacing={0.25} sx={{ minWidth: 0 }}>
        <Typography
          variant="body2"
          sx={{
            color: theme.customTokens.text.primary,
            fontWeight: 600,
            lineHeight: 1.25,
          }}
        >
          {name}
        </Typography>
        <Typography
          variant="caption"
          sx={{
            color: theme.customTokens.text.secondary,
            lineHeight: 1.2,
          }}
        >
          {date}
        </Typography>
      </Stack>
    </Stack>
  );
}

function getAuditInitials(name: string) {
  const parts = name
    .replace("-", "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function renderForPurposeBadge(value: EnterpriseTableCellValue, theme: Theme) {
  const normalized =
    typeof value === "string" && value.trim().toLowerCase() === "sample"
      ? "Sample"
      : "Order";
  const isSample = normalized === "Sample";

  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        px: 1,
        borderRadius: "999px",
        border: `1px solid ${
          isSample
            ? theme.customTokens.brand.primary
            : theme.customTokens.borders.default
        }`,
        backgroundColor: isSample
          ? `${theme.customTokens.brand.primary}14`
          : theme.customTokens.neutrals[100],
        color: isSample
          ? theme.customTokens.brand.primary
          : theme.customTokens.neutrals[700],
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.02em",
        lineHeight: 1,
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {normalized}
    </Box>
  );
}

function renderQcStatusChip(value: EnterpriseTableCellValue, theme: Theme) {
  const normalizedValue = formatEnterpriseValue(value).trim().toLowerCase();
  const isInspectionStatus = normalizedValue.includes("inspection");
  const isPass =
    normalizedValue === "pass" ||
    normalizedValue === "qc pass" ||
    normalizedValue === "inspection pass" ||
    normalizedValue === "done" ||
    normalizedValue === "qc done" ||
    normalizedValue === "inspection done";
  const isFail =
    normalizedValue === "fail" ||
    normalizedValue === "qc fail" ||
    normalizedValue === "inspection fail" ||
    normalizedValue === "failed";

  const label = normalizedValue === "inspection pass"
    ? "Inspection Pass"
    : normalizedValue === "inspection fail"
      ? "Inspection Fail"
      : isInspectionStatus
        ? isPass
          ? "Inspection Done"
          : "Inspection Pending"
    : isPass
      ? "QC Pass"
      : isFail
        ? "QC Fail"
        : "Pending";

  const palette = isPass
    ? theme.customTokens.semanticScale.success
    : isFail
      ? theme.customTokens.semanticScale.error
      : theme.customTokens.semanticScale.warning;

  return (
    <Chip
      label={label}
      size="small"
      sx={{
        minWidth: 76,
        borderRadius: theme.customTokens.radius.pill,
        border: `1px solid ${palette[300]}`,
        backgroundColor: palette[100],
        color: palette[800],
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 700,
        height: 24,
      }}
      variant="outlined"
    />
  );
}

function isInspectionStatusValue(value: EnterpriseTableCellValue) {
  return formatEnterpriseValue(value).trim().toLowerCase().startsWith("inspection ");
}

function getVisiblePaginationPages(totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  return [
    ...Array.from({ length: 5 }, (_, index) => index + 1),
    "ellipsis" as const,
    totalPages,
  ];
}

function normalizeSortValue(value: EnterpriseTableCellValue) {
  if (value instanceof Date) {
    return value.getTime();
  }

  const textValue = formatEnterpriseValue(value);
  const parsedDate = Date.parse(textValue);

  if (!Number.isNaN(parsedDate) && /[A-Za-z]{3}|\d{4}/.test(textValue)) {
    return parsedDate;
  }

  const numericCandidate = textValue.replace(/[^0-9.-]/g, "");

  if (numericCandidate && !Number.isNaN(Number(numericCandidate))) {
    return Number(numericCandidate);
  }

  return textValue.toLowerCase();
}

function formatEnterpriseValue(
  value: EnterpriseTableCellValue,
  key?: string,
  label?: string,
) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  if (key) {
    return formatDisplayValueByField(value, key, label);
  }

  return String(value);
}
