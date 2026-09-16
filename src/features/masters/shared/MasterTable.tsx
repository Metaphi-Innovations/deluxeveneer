import { useEffect, useMemo, useState } from "react";
import type { Dispatch, MouseEvent, SetStateAction } from "react";
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
  Avatar,
  Box,
  Button,
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
import { useNavigate } from "react-router";

import { ErpToggleSwitch } from "../../../components/inputs/ErpToggleSwitch";
import { actionMenuTriggerSx } from "../../shared/actionMenuStyles";
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
} from "../../shared/columnFilters";
import {
  isFilterableListingColumn,
  resolveListingColumnFilterType,
} from "../../shared/listingColumnFilters";
import {
  listingPageNumberButtonSx,
  listingPaginationIconButtonSx,
  listingTableBodyCellSx,
  listingTableContainerSx,
  listingTableHeaderCellSx,
  listingTableHeaderIconButtonSx,
} from "../../shared/listingTableStyles";
import {
  portalIconSize,
  portalIconStroke,
} from "../../shared/portalIconStandards";
import { RowActionsMenu } from "../../shared/RowActionsMenu";
import type { MasterColumn, MasterRecord } from "./types";
import {
  formatMasterValue,
  normalizeMasterSortValue,
  normalizeMasterStatusValue,
} from "./utils";

type SortDirection = "asc" | "desc";

type SortConfig = {
  direction: SortDirection;
  key: string;
} | null;

type AuditColumnType = "created" | "updated";

type MasterDisplayColumn = MasterColumn & {
  audit?: {
    dateKey?: string;
    nameKey?: string;
    type: AuditColumnType;
  };
};

interface MasterTableProps {
  canChangeStatus?: boolean;
  canEdit?: boolean;
  canView?: boolean;
  columns: MasterColumn[];
  rows: MasterRecord[];
  getEditPath: (id: string) => string;
  getViewPath: (id: string) => string;
  onStatusChange?: (row: MasterRecord, checked: boolean) => Promise<void> | void;
}

const actionColumnWidth = 64;

export function MasterTable({
  canChangeStatus = true,
  canEdit = true,
  canView = true,
  columns,
  getEditPath,
  getViewPath,
  onStatusChange,
  rows,
}: MasterTableProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterMenuAnchor, setFilterMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [activeFilterColumn, setActiveFilterColumn] = useState<string | null>(
    null,
  );
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [activeActionRowId, setActiveActionRowId] = useState<string | null>(
    null,
  );
  const [statusOverrides, setStatusOverrides] = useState<
    Record<string, boolean>
  >({});
  const hasRowActions = canView || canEdit;
  const displayColumns = useMemo(
    () => getMasterDisplayColumns(columns),
    [columns],
  );

  const columnFilterMeta = useMemo(() => {
    const meta: Record<
      string,
      {
        filterType: ColumnFilterType;
        options: Array<{ value: string; label: string }>;
        uniqueCount: number;
      }
    > = {};

    displayColumns.forEach((column) => {
      const sampleValues = rows.map((row) => row[column.key]);
      const filterType = resolveListingColumnFilterType({
        key: column.key,
        label: column.label,
        sampleValues,
      });
      const formattedValues = rows.map((row) =>
        formatMasterValue(row[column.key], column.key, column.label),
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

  const filteredRows = useMemo(() => {
    return rows.filter((row) =>
      Object.entries(columnFilters).every(([key, filterValue]) => {
        if (!isActiveColumnFilter(filterValue)) {
          return true;
        }

        const rawValue = row[key];
        const cellValue = formatMasterValue(
          rawValue,
          key,
          displayColumns.find((column) => column.key === key)?.label,
        ).trim();
        return matchColumnFilter(rawValue, cellValue, filterValue);
      }),
    );
  }, [columnFilters, rows]);

  const activeFilterChips = useMemo(
    () => buildActiveFilterChips(columnFilters, displayColumns),
    [columnFilters, displayColumns],
  );
  const hasActiveFilters = activeFilterChips.length > 0;

  const sortedRows = useMemo(() => {
    if (!sortConfig) {
      return filteredRows;
    }

    return [...filteredRows].sort((left, right) => {
      const leftValue = normalizeMasterSortValue(left[sortConfig.key]);
      const rightValue = normalizeMasterSortValue(right[sortConfig.key]);

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
  const currentPageRows = sortedRows.slice(
    pageStartIndex,
    pageStartIndex + rowsPerPage,
  );
  const visiblePaginationPages = getVisiblePaginationPages(totalPages);
  const totalRecords = sortedRows.length;
  const rangeStart = totalRecords === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = Math.min(pageStartIndex + rowsPerPage, totalRecords);

  const activeFilterColumnDef = activeFilterColumn
    ? displayColumns.find((item) => item.key === activeFilterColumn)
    : undefined;
  const activeFilterMeta = activeFilterColumn
    ? columnFilterMeta[activeFilterColumn]
    : undefined;

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const handleSort = (columnKey: string) => {
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
    columnKey: string,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setActiveFilterColumn(columnKey);
    setFilterMenuAnchor(event.currentTarget);
  };

  const handleCloseFilter = () => {
    setFilterMenuAnchor(null);
    setActiveFilterColumn(null);
  };

  const handleApplyColumnFilter = (nextFilter: ColumnFilterValue | null) => {
    if (!activeFilterColumn) {
      return;
    }

    setColumnFilters((current) => {
      const next = { ...current };

      if (!nextFilter || !isActiveColumnFilter(nextFilter)) {
        delete next[activeFilterColumn];
      } else {
        next[activeFilterColumn] = nextFilter;
      }

      return next;
    });
    setPage(1);
  };

  const handleApplyMultiSelectFilter = (values: string[]) => {
    handleApplyColumnFilter(
      values.length === 0
        ? null
        : {
            type: "multiSelect",
            values,
          },
    );
  };

  const handleClearColumnFilter = (columnKey?: string) => {
    const targetKey = columnKey ?? activeFilterColumn;

    if (!targetKey) {
      return;
    }

    setColumnFilters((current) => {
      const next = { ...current };
      delete next[targetKey];
      return next;
    });
    setPage(1);
  };

  const handleClearAllFilters = () => {
    setColumnFilters({});
    setPage(1);
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

  return (
    <Stack spacing={1.25}>
      {hasActiveFilters ? (
        <ActiveColumnFiltersBar
          filters={activeFilterChips}
          onClearAll={handleClearAllFilters}
          onRemove={handleClearColumnFilter}
        />
      ) : null}

      <Box sx={(currentTheme) => listingTableContainerSx(currentTheme)}>
        <TableContainer
          sx={(currentTheme) => ({
            maxHeight: rowsPerPage === 10 ? "none" : 520,
            overflowX: "auto",
            overflowY: rowsPerPage === 10 ? "hidden" : "auto",
            scrollbarWidth: "thin",
            scrollbarColor: `${currentTheme.customTokens.brand.primary} ${currentTheme.customTokens.surfaces.alt}`,
            WebkitOverflowScrolling: "touch",
            "&::-webkit-scrollbar": {
              width: 8,
              height: 8,
            },
            "&::-webkit-scrollbar-track": {
              backgroundColor: currentTheme.customTokens.surfaces.alt,
            },
            "&::-webkit-scrollbar-thumb": {
              backgroundColor: currentTheme.customTokens.brand.primary,
              borderRadius: currentTheme.customTokens.radius.pill,
              border: `1px solid ${currentTheme.customTokens.surfaces.alt}`,
            },
            "&::-webkit-scrollbar-thumb:hover": {
              backgroundColor: currentTheme.customTokens.brand.secondary,
            },
          })}
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
                {displayColumns.map((column) => {
                  const isSorted = sortConfig?.key === column.key;
                  const columnFilter = columnFilters[column.key];
                  const isFiltered = isActiveColumnFilter(columnFilter);
                  const filterBadgeCount =
                    getColumnFilterBadgeCount(columnFilter);
                  const columnMeta = columnFilterMeta[column.key];
                  const uniqueCount = columnMeta?.uniqueCount ?? 0;
                  const showFilter = isFilterableListingColumn(
                    column.key,
                    column.label,
                    uniqueCount,
                    undefined,
                    columnMeta?.filterType,
                  );

                  return (
                    <TableCell
                      key={column.key}
                      sx={(currentTheme) =>
                        listingTableHeaderCellSx(currentTheme)
                      }
                    >
                      <Box
                        sx={(currentTheme) => ({
                          display: "flex",
                          alignItems: "center",
                          gap: currentTheme.spacing(0.75),
                        })}
                      >
                        <Typography
                          component="span"
                          sx={{
                            fontSize: "inherit",
                            fontWeight: "inherit",
                            letterSpacing: "inherit",
                            textTransform: "inherit",
                            color: theme.customTokens.neutrals[700],
                            lineHeight: 1.2,
                          }}
                        >
                          {column.label}
                        </Typography>

                        <IconButton
                          size="small"
                          onClick={() => handleSort(column.key)}
                          sx={(currentTheme) =>
                            listingTableHeaderIconButtonSx(currentTheme)
                          }
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
                            sx={(currentTheme) => ({
                              ...listingTableHeaderIconButtonSx(currentTheme),
                              position: "relative",
                              color: isFiltered
                                ? currentTheme.customTokens.brand.primary
                                : currentTheme.customTokens.text.secondary,
                            })}
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

                <TableCell
                  sx={[
                    (currentTheme) => listingTableHeaderCellSx(currentTheme),
                    {
                      position: "sticky",
                      right: 0,
                      zIndex: 5,
                      minWidth: actionColumnWidth,
                      boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
                    },
                  ]}
                >
                  <Typography
                    component="span"
                    sx={{
                      fontSize: "inherit",
                      fontWeight: "inherit",
                      letterSpacing: "inherit",
                      textTransform: "inherit",
                      color: theme.customTokens.neutrals[700],
                      lineHeight: 1.2,
                    }}
                  >
                    Actions
                  </Typography>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {currentPageRows.map((row) => (
                <TableRow
                  key={row.id}
                  hover
                  sx={(currentTheme) => ({
                    "& td": {
                      backgroundColor:
                        currentTheme.customTokens.surfaces.surface,
                    },
                    "&:hover td": {
                      backgroundColor:
                        currentTheme.customTokens.navigation.hoverBackground,
                    },
                  })}
                >
                  {displayColumns.map((column) => (
                    <TableCell
                      key={column.key}
                      sx={(currentTheme) =>
                        listingTableBodyCellSx(currentTheme)
                      }
                    >
                      {renderMasterTableCell(
                        row,
                        column,
                        statusOverrides,
                        setStatusOverrides,
                        onStatusChange,
                        theme,
                        canChangeStatus,
                      )}
                    </TableCell>
                  ))}

                  <TableCell
                    sx={[
                      (currentTheme) => listingTableBodyCellSx(currentTheme),
                      {
                        position: "sticky",
                        right: 0,
                        zIndex: 1,
                        minWidth: actionColumnWidth,
                        boxShadow: `-1px 0 0 ${theme.customTokens.borders.default}`,
                      },
                    ]}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      {hasRowActions ? (
                        <IconButton
                          size="small"
                          aria-label="Open row actions"
                          onClick={(event) =>
                            handleOpenActionMenu(row.id, event)
                          }
                          sx={(currentTheme) =>
                            actionMenuTriggerSx(currentTheme)
                          }
                        >
                          <MoreHorizontal
                            size={portalIconSize.md}
                            strokeWidth={portalIconStroke.default}
                          />
                        </IconButton>
                      ) : null}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={(currentTheme) => ({
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: currentTheme.spacing(2),
            flexWrap: "wrap",
            borderTop: `1px solid ${currentTheme.customTokens.borders.divider}`,
            px: { xs: currentTheme.spacing(1.25), md: currentTheme.spacing(1.5) },
            py: currentTheme.spacing(1),
            minHeight: 34,
            backgroundColor: currentTheme.customTokens.surfaces.surface,
          })}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontSize: "12px" }}
          >
            Showing {rangeStart}–{rangeEnd} of {totalRecords}
            {hasActiveFilters ? " matching records" : " records"}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
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
                sx={(currentTheme) => ({
                  minWidth: 64,
                  height: 30,
                  borderRadius: `${currentTheme.customTokens.radius.sm}px`,
                  fontSize: "12px",
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: currentTheme.customTokens.borders.default,
                  },
                })}
              >
                {[10, 25, 50, 75, 100, 200].map((option) => (
                  <MenuItem key={option} value={String(option)}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                size="small"
                aria-label="Previous page"
                disabled={safePage === 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                sx={(currentTheme) =>
                  listingPaginationIconButtonSx(currentTheme)
                }
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
                    sx={(currentTheme) =>
                      listingPageNumberButtonSx(
                        currentTheme,
                        pageItem === safePage,
                      )
                    }
                  >
                    {pageItem}
                  </Button>
                ),
              )}

              <IconButton
                size="small"
                aria-label="Next page"
                disabled={safePage === totalPages}
                onClick={() =>
                  setPage((current) => Math.min(current + 1, totalPages))
                }
                sx={(currentTheme) =>
                  listingPaginationIconButtonSx(currentTheme)
                }
              >
                <ChevronRight size={16} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <RowActionsMenu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor && activeActionRowId)}
        onClose={handleCloseActionMenu}
        actions={[
          ...(canView && activeActionRowId
            ? [
                {
                  id: "view",
                  label: "View",
                  icon: Eye,
                  onSelect: () => navigate(getViewPath(activeActionRowId)),
                },
              ]
            : []),
          ...(canEdit && activeActionRowId
            ? [
                {
                  id: "edit",
                  label: "Edit",
                  icon: Pencil,
                  onSelect: () => navigate(getEditPath(activeActionRowId)),
                },
              ]
            : []),
        ]}
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
          value={columnFilters[activeFilterColumn!]}
          onApply={handleApplyColumnFilter}
          onApplyMultiSelect={handleApplyMultiSelectFilter}
          onClear={() => handleClearColumnFilter()}
        />
      ) : null}
    </Stack>
  );

  function SortIndicator({
    active,
    direction,
  }: {
    active: boolean;
    direction?: SortDirection | undefined;
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

function getStatusToggleState(
  column: MasterColumn,
  value: MasterRecord[string],
) {
  const isStatusColumn =
    column.label === "Status" ||
    column.key === "status" ||
    column.key === "statusLabel";

  if (!isStatusColumn) {
    return null;
  }

  return normalizeMasterStatusValue(value) === "Active";
}

function renderMasterTableCell(
  row: MasterRecord,
  column: MasterDisplayColumn,
  statusOverrides: Record<string, boolean>,
  setStatusOverrides: Dispatch<SetStateAction<Record<string, boolean>>>,
  onStatusChange: MasterTableProps["onStatusChange"],
  theme: Theme,
  canChangeStatus: boolean,
) {
  if (column.audit) {
    return renderAuditCell(
      row[column.audit.nameKey ?? column.key],
      row[column.audit.dateKey ?? column.key],
      theme,
    );
  }

  const toggleState = getStatusToggleState(column, row[column.key]);

  if (toggleState === null) {
    return formatMasterValue(row[column.key], column.key, column.label);
  }

  const toggleKey = `${row.id}:${column.key}`;
  const checked = statusOverrides[toggleKey] ?? Boolean(toggleState);

  return (
    <ErpToggleSwitch
      ariaLabel={`${column.label} for row ${row.id}`}
      checked={checked}
      disabled={!canChangeStatus}
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

function getMasterDisplayColumns(columns: readonly MasterColumn[]) {
  const createdNameKey = findAuditColumnKey(columns, auditColumnKeys.createdName);
  const createdDateKey = findAuditColumnKey(columns, auditColumnKeys.createdDate);
  const updatedNameKey = findAuditColumnKey(columns, auditColumnKeys.updatedName);
  const updatedDateKey = findAuditColumnKey(columns, auditColumnKeys.updatedDate);
  const hasCreatedAudit = Boolean(createdNameKey || createdDateKey);
  const hasUpdatedAudit = Boolean(updatedNameKey || updatedDateKey);
  let createdAdded = false;
  let updatedAdded = false;
  const displayColumns: MasterDisplayColumn[] = [];

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
          key: createdDateKey ?? createdNameKey ?? column.key,
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
        key: updatedDateKey ?? updatedNameKey ?? column.key,
        label: "Updated",
        audit: {
          ...(updatedDateKey ? { dateKey: updatedDateKey } : {}),
          ...(updatedNameKey ? { nameKey: updatedNameKey } : {}),
          type: "updated",
        },
      });
    }
  });

  return orderMasterDisplayColumns(displayColumns);
}

function orderMasterDisplayColumns(columns: readonly MasterDisplayColumn[]) {
  const remarkColumns = columns.filter(isRemarkColumn);
  const statusColumns = columns.filter(isStatusColumn);
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

function isRemarkColumn(column: MasterColumn) {
  const normalizedLabel = normalizeColumnIdentifier(column.label);
  const normalizedKey = normalizeColumnIdentifier(column.key);

  return (
    normalizedLabel === "remark" ||
    normalizedLabel === "remarks" ||
    normalizedKey === "remark" ||
    normalizedKey === "remarks"
  );
}

function isStatusColumn(column: MasterColumn) {
  const normalizedLabel = normalizeColumnIdentifier(column.label);
  const normalizedKey = normalizeColumnIdentifier(column.key);

  return normalizedLabel === "status" || normalizedKey === "status";
}

function isSerialNumberColumn(column: MasterColumn) {
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

function findAuditColumnKey(columns: readonly MasterColumn[], keys: Set<string>) {
  return columns.find((column) => keys.has(column.key))?.key;
}

function renderAuditCell(
  nameValue: MasterRecord[string],
  dateValue: MasterRecord[string],
  theme: Theme,
) {
  const name = formatMasterValue(nameValue) || "-";
  const date = formatMasterValue(dateValue) || "-";
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
