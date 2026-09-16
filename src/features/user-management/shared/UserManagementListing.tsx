import { useEffect, useMemo, useState } from "react";
import type { MouseEvent } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  KeyRound,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Plus,
} from "lucide-react";
import { Link as RouterLink, useNavigate } from "react-router";

import { ErpToggleSwitch } from "../../../components/inputs/ErpToggleSwitch";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { getCurrentUser } from "../../auth";
import { formatMasterValue, MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { actionMenuTriggerSx } from "../../shared/actionMenuStyles";
import {
  getListingToolbarButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { ActiveColumnFiltersBar } from "../../shared/columnFilters";
import type { ActiveColumnFilterChip } from "../../shared/columnFilters";
import {
  listingPageNumberButtonSx,
  listingPaginationIconButtonSx,
  listingTableBodyCellSx,
  listingTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import {
  portalIconSize,
  portalIconStroke,
} from "../../shared/portalIconStandards";
import { RowActionsMenu } from "../../shared/RowActionsMenu";
import { SearchableMultiSelectColumnFilter } from "../../shared/SearchableMultiSelectColumnFilter";
import {
  getUserManagementPaths,
  getUserManagementSearchValues,
} from "./userManagementConfig";
import {
  changeUserPassword,
  fetchUserManagementRows,
  updateUserManagementStatus,
} from "./userManagementApi";
import type { UserManagementRecord } from "./userManagementConfig";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 75, 100, 200] as const;

type ColumnFilterKey = "department" | "status";

type RowAction = {
  id: string;
  label: string;
  icon: typeof Eye;
  onSelect: (row: UserManagementRecord) => void;
};

export function UserManagementListing() {
  const theme = useTheme();
  const navigate = useNavigate();
  const paths = getUserManagementPaths();
  const canCreate = canAccessPermission("userManagement", "create");
  const canEdit = canAccessPermission("userManagement", "edit");
  const canView = canAccessPermission("userManagement", "view");
  const [searchValue, setSearchValue] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [rows, setRows] = useState<UserManagementRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [passwordDialogUser, setPasswordDialogUser] =
    useState<UserManagementRecord | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [actionMenuAnchor, setActionMenuAnchor] = useState<HTMLElement | null>(
    null,
  );
  const [activeActionRowId, setActiveActionRowId] = useState<string | null>(
    null,
  );
  const [statusOverrides, setStatusOverrides] = useState<Record<string, boolean>>(
    {},
  );
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [columnFilterAnchor, setColumnFilterAnchor] =
    useState<HTMLElement | null>(null);
  const [activeColumnFilter, setActiveColumnFilter] =
    useState<ColumnFilterKey | null>(null);

  useEffect(() => {
    let ignore = false;

    async function loadRows() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextRows = await fetchUserManagementRows();
        if (!ignore) {
          setRows(nextRows);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load users.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadRows();

    return () => {
      ignore = true;
    };
  }, []);

  const departmentOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => row.department)),
    [rows],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    return [...rows]
      .filter((row) => {
        if (
          normalizedSearch &&
          !getUserManagementSearchValues(row).some((value) =>
            formatMasterValue(value).toLowerCase().includes(normalizedSearch),
          )
        ) {
          return false;
        }

        if (
          departmentFilter.length > 0 &&
          !departmentFilter.includes(row.department)
        ) {
          return false;
        }

        if (statusFilter.length > 0) {
          const matchesActive =
            statusFilter.includes("ACTIVE") && row.isActive;
          const matchesInactive =
            statusFilter.includes("INACTIVE") && !row.isActive;

          if (!matchesActive && !matchesInactive) {
            return false;
          }
        }

        return true;
      })
      .sort((left, right) => {
        const leftTime =
          left.updatedDate instanceof Date
            ? left.updatedDate.getTime()
            : new Date(left.updatedDate).getTime();
        const rightTime =
          right.updatedDate instanceof Date
            ? right.updatedDate.getTime()
            : new Date(right.updatedDate).getTime();

        return rightTime - leftTime;
      });
  }, [departmentFilter, rows, searchValue, statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [searchValue, departmentFilter, statusFilter, rowsPerPage]);

  const tableActions: readonly RowAction[] = [
    ...(canView
      ? [
          {
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: (row: UserManagementRecord) => navigate(paths.view(row.id)),
          },
        ]
      : []),
    ...(canEdit
      ? [
          {
            id: "edit",
            label: "Edit",
            icon: Pencil,
            onSelect: (row: UserManagementRecord) => navigate(paths.edit(row.id)),
          },
          {
            id: "change-password",
            label: "Change Password",
            icon: KeyRound,
            onSelect: (row: UserManagementRecord) => {
              setPasswordDialogUser(row);
              setNewPassword("");
              setConfirmPassword("");
              setPasswordError("");
              setPasswordSuccessMessage("");
              setShowNewPassword(false);
              setShowConfirmPassword(false);
            },
          },
        ]
      : []),
  ];

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / rowsPerPage));
  const safePage = Math.min(page, totalPages);
  const pageStartIndex = (safePage - 1) * rowsPerPage;
  const currentPageRows = canView
    ? filteredRows.slice(pageStartIndex, pageStartIndex + rowsPerPage)
    : [];
  const visiblePaginationPages = getVisiblePaginationPages(totalPages);
  const rangeStart = filteredRows.length === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = Math.min(pageStartIndex + rowsPerPage, filteredRows.length);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  const activeActionRow =
    activeActionRowId === null
      ? undefined
      : rows.find((row) => row.id === activeActionRowId);

  const handleClosePasswordDialog = () => {
    if (isChangingPassword) {
      return;
    }

    setPasswordDialogUser(null);
    setNewPassword("");
    setConfirmPassword("");
    setPasswordError("");
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handlePasswordValueChange = (
    value: string,
    setter: (nextValue: string) => void,
  ) => {
    if (!isAllowedPasswordValue(value)) {
      setPasswordError(
        "Only letters, numbers, underscores, and @ are allowed.",
      );
      return;
    }

    setter(value);

    if (passwordError === "Only letters, numbers, underscores, and @ are allowed.") {
      setPasswordError("");
    }
  };

  const handleChangePassword = async () => {
    if (!passwordDialogUser) {
      return;
    }

    if (!newPassword.trim()) {
      setPasswordError("Enter new password.");
      return;
    }

    if (!isAllowedPasswordValue(newPassword) || !isAllowedPasswordValue(confirmPassword)) {
      setPasswordError("Only letters, numbers, underscores, and @ are allowed.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirm password must match.");
      return;
    }

    setIsChangingPassword(true);
    setPasswordError("");

    try {
      await changeUserPassword(passwordDialogUser.id, newPassword);
      setPasswordSuccessMessage("Password changed successfully.");
      setPasswordDialogUser(null);
      setNewPassword("");
      setConfirmPassword("");
      setShowNewPassword(false);
      setShowConfirmPassword(false);
    } catch (error) {
      setPasswordError(
        error instanceof Error ? error.message : "Unable to change password.",
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleStatusChange = async (
    row: UserManagementRecord,
    checked: boolean,
  ) => {
    if (!canEdit) {
      return;
    }

    const status = checked ? "ACTIVE" : "INACTIVE";

    try {
      const updatedUser = await updateUserManagementStatus(row.id, status);
      setRows((currentRows) =>
        currentRows.map((currentRow) =>
          currentRow.id === row.id
            ? {
                ...currentRow,
                isActive: updatedUser.isActive,
                statusLabel: updatedUser.statusLabel,
                updatedBy: updatedUser.updatedBy,
                updatedDate: updatedUser.updatedDate,
              }
            : currentRow,
        ),
      );
      setErrorMessage("");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to update user status.",
      );
      throw error;
    }
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

  const activeColumnFilterCount =
    (departmentFilter.length > 0 ? 1 : 0) +
    (statusFilter.length > 0 ? 1 : 0);

  const activeFilterChips = useMemo(() => {
    const chips: ActiveColumnFilterChip[] = [];

    if (departmentFilter.length > 0) {
      chips.push({
        columnKey: "department",
        columnLabel: "Department",
        filter: { type: "multiSelect", values: departmentFilter },
      });
    }

    if (statusFilter.length > 0) {
      chips.push({
        columnKey: "status",
        columnLabel: "Status",
        filter: {
          type: "multiSelect",
          values: statusFilter.map((value) =>
            value === "ACTIVE" ? "Active" : "Inactive",
          ),
        },
      });
    }

    return chips;
  }, [departmentFilter, statusFilter]);

  const handleOpenColumnFilter = (
    columnKey: ColumnFilterKey,
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    event.stopPropagation();
    setActiveColumnFilter(columnKey);
    setColumnFilterAnchor(event.currentTarget);
  };

  const handleCloseColumnFilter = () => {
    setColumnFilterAnchor(null);
    setActiveColumnFilter(null);
  };

  const handleClearAllFilters = () => {
    setDepartmentFilter([]);
    setStatusFilter([]);
    handleCloseColumnFilter();
  };

  const departmentFilterOptions = useMemo(
    () =>
      departmentOptions.map((option) => ({ value: option, label: option })),
    [departmentOptions],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
    ],
    [],
  );

  const activeFilterConfig =
    activeColumnFilter === "department"
        ? {
            label: "Department",
            options: departmentFilterOptions,
            selectedValues: departmentFilter,
            searchable: true,
            searchPlaceholder: "Search values...",
            onApply: setDepartmentFilter,
            onClear: () => setDepartmentFilter([]),
          }
        : activeColumnFilter === "status"
          ? {
              label: "Status",
              options: statusFilterOptions,
              selectedValues: statusFilter,
              searchable: true,
              searchPlaceholder: "Search values...",
              onApply: setStatusFilter,
              onClear: () => setStatusFilter([]),
            }
          : null;

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "User Management" }]}
      title="User Management"
      subtitle="Manage users and their access across the system."
      contentGap={2}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={1.25}
          sx={{ flex: 1, minWidth: 0 }}
        >
          <ClearableSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search users..."
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: "100%",
              flexShrink: 1,
            }}
          />

        </Stack>

        {canCreate ? (
          <Button
            component={RouterLink}
            startIcon={<Plus size={15} />}
            sx={(currentTheme) => getListingToolbarButtonSx(currentTheme)}
            to={paths.add}
            variant="contained"
          >
            Add User
          </Button>
        ) : null}
      </Stack>

      {errorMessage ? (
        <Alert severity="error">{errorMessage}</Alert>
      ) : null}

      {passwordSuccessMessage ? (
        <Alert severity="success">{passwordSuccessMessage}</Alert>
      ) : null}

      {activeColumnFilterCount > 0 ? (
        <ActiveColumnFiltersBar
          filters={activeFilterChips}
          onClearAll={handleClearAllFilters}
          onRemove={(columnKey) => {
            if (columnKey === "department") {
              setDepartmentFilter([]);
            } else if (columnKey === "status") {
              setStatusFilter([]);
            }
          }}
        />
      ) : null}

      <Box
        sx={{
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          overflow: "hidden",
          backgroundColor: theme.customTokens.surfaces.surface,
          boxShadow: theme.customTokens.elevation.xs,
        }}
      >
        <TableContainer
          sx={{
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Table
            sx={{
              minWidth: 1180,
              tableLayout: "fixed",
              "& .MuiTableCell-root": {
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
              },
            }}
          >
            <TableHead>
              <TableRow>
                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "18%",
                  }}
                >
                  User
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "13%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Department"
                    selectedCount={departmentFilter.length}
                    onOpen={(event) =>
                      handleOpenColumnFilter("department", event)
                    }
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "16%",
                  }}
                >
                  Email
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "11%",
                  }}
                >
                  Phone
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "14%",
                  }}
                >
                  Remarks
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "7%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Status"
                    selectedCount={statusFilter.length}
                    align="center"
                    onOpen={(event) => handleOpenColumnFilter("status", event)}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "14%",
                  }}
                >
                  Created By
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "14%",
                  }}
                >
                  Updated By
                </TableCell>

                <TableCell
                  align="center"
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "7%",
                  }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {currentPageRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} sx={{ py: 6, textAlign: "center" }}>
                    <Typography variant="body2" color="text.secondary">
                      {isLoading ? "Loading users..." : "No users found."}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                currentPageRows.map((row) => {
                  const displayName = getUserDisplayName(row);
                  const statusChecked =
                    statusOverrides[row.id] ?? Boolean(row.isActive);
                  const statusDisabled =
                    !canEdit || isProtectedStatusRow(row);

                  return (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        height: 52,
                        "&:hover": {
                          backgroundColor: theme.customTokens.surfaces.alt,
                        },
                        "&:last-of-type .MuiTableCell-root": {
                          borderBottom: "none",
                        },
                      }}
                    >
                      <TableCell sx={tableBodyCellSx(theme)}>
                        <Stack
                          direction="row"
                          alignItems="center"
                          spacing={1.25}
                          sx={{ minWidth: 0 }}
                        >
                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor:
                                theme.customTokens.brand.primaryScale[100],
                              color: theme.customTokens.brand.primary,
                              fontSize: "0.7rem",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {getUserInitials(displayName)}
                          </Avatar>
                          <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                            <Typography
                              sx={{
                                fontSize: "0.875rem",
                                fontWeight: 600,
                                color: theme.customTokens.text.primary,
                                lineHeight: 1.3,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {displayName}
                            </Typography>
                            <Typography
                              sx={{
                                fontSize: "0.75rem",
                                color: theme.customTokens.text.secondary,
                                lineHeight: 1.2,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {row.userName || row.email || "—"}
                            </Typography>
                          </Stack>
                        </Stack>
                      </TableCell>

                      <TableCell sx={tableBodyCellSx(theme)}>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.customTokens.text.primary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.department || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={tableBodyCellSx(theme)}>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.customTokens.text.secondary,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {row.email || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={tableBodyCellSx(theme)}>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.customTokens.text.secondary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.phoneNo || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={tableBodyCellSx(theme)}>
                        <Typography
                          sx={{
                            fontSize: "0.875rem",
                            color: theme.customTokens.text.secondary,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {row.remarks || "—"}
                        </Typography>
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={tableBodyCellSx(theme)}
                      >
                        <ErpToggleSwitch
                          ariaLabel={`Active status for ${displayName}`}
                          checked={statusChecked}
                          disabled={statusDisabled}
                          onChange={(nextChecked) => {
                            setStatusOverrides((current) => ({
                              ...current,
                              [row.id]: nextChecked,
                            }));

                            Promise.resolve(
                              handleStatusChange(row, nextChecked),
                            ).catch(() => {
                              setStatusOverrides((current) => ({
                                ...current,
                                [row.id]: statusChecked,
                              }));
                            });
                          }}
                        />
                      </TableCell>

                      <TableCell sx={tableBodyCellSx(theme)}>
                        <AuditPersonCell
                          name={row.createdBy}
                          date={row.createdDate}
                        />
                      </TableCell>

                      <TableCell sx={tableBodyCellSx(theme)}>
                        <AuditPersonCell
                          name={row.updatedBy}
                          date={row.updatedDate}
                        />
                      </TableCell>

                      <TableCell
                        align="center"
                        sx={{
                          ...tableBodyCellSx(theme),
                        }}
                      >
                        {tableActions.length > 0 ? (
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
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: theme.spacing(2),
            flexWrap: "wrap",
            borderTop: `1px solid ${theme.customTokens.borders.divider}`,
            px: { xs: theme.spacing(1.5), md: theme.spacing(2) },
            py: theme.spacing(1.25),
            backgroundColor: theme.customTokens.surfaces.surface,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            Showing {rangeStart}–{rangeEnd} of {filteredRows.length}
            {activeColumnFilterCount > 0 ? " matching users" : " users"}
          </Typography>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1.5}
            flexWrap="wrap"
            useFlexGap
          >
            <Stack direction="row" alignItems="center" spacing={0.75}>
              <Typography variant="caption" color="text.secondary">
                Rows per page
              </Typography>
              <Select
                size="small"
                value={String(rowsPerPage)}
                onChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                }}
                sx={{
                  minWidth: 72,
                  height: 32,
                  borderRadius: `${theme.customTokens.radius.sm}px`,
                  fontSize: theme.typography.caption.fontSize,
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: theme.customTokens.borders.default,
                  },
                }}
              >
                {ROWS_PER_PAGE_OPTIONS.map((option) => (
                  <MenuItem key={option} value={String(option)}>
                    {option}
                  </MenuItem>
                ))}
              </Select>
            </Stack>

            <Stack direction="row" alignItems="center" spacing={0.5}>
              <IconButton
                size="small"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                aria-label="Previous page"
                sx={paginationIconButtonSx(theme)}
              >
                <ChevronLeft size={16} />
              </IconButton>

              {visiblePaginationPages.map((pageItem, index) =>
                pageItem === "ellipsis" ? (
                  <Typography
                    key={`ellipsis-${index}`}
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
                    sx={pageNumberButtonSx(theme, pageItem === safePage)}
                  >
                    {pageItem}
                  </Button>
                ),
              )}

              <IconButton
                size="small"
                disabled={safePage >= totalPages}
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                aria-label="Next page"
                sx={paginationIconButtonSx(theme)}
              >
                <ChevronRight size={16} />
              </IconButton>
            </Stack>
          </Stack>
        </Box>
      </Box>

      <RowActionsMenu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleCloseActionMenu}
        actions={tableActions.map((action) => ({
          id: action.id,
          label: action.label,
          icon: action.icon,
          disabled: !activeActionRow,
          onSelect: () => {
            if (!activeActionRow) {
              return;
            }

            action.onSelect(activeActionRow);
          },
        }))}
      />

      {activeFilterConfig ? (
        <SearchableMultiSelectColumnFilter
          open={Boolean(columnFilterAnchor)}
          anchorEl={columnFilterAnchor}
          onClose={handleCloseColumnFilter}
          label={activeFilterConfig.label}
          options={activeFilterConfig.options}
          selectedValues={activeFilterConfig.selectedValues}
          onApply={activeFilterConfig.onApply}
          onClear={activeFilterConfig.onClear}
          searchable={activeFilterConfig.searchable}
          searchPlaceholder={activeFilterConfig.searchPlaceholder}
        />
      ) : null}

      <Dialog
        fullWidth
        maxWidth="xs"
        onClose={handleClosePasswordDialog}
        open={Boolean(passwordDialogUser)}
        slotProps={{
          paper: {
            sx: (currentTheme) => ({
              width: "100%",
              maxWidth: 460,
              borderRadius: "12px",
              border: `1px solid ${currentTheme.customTokens.borders.default}`,
              boxShadow: currentTheme.customTokens.elevation.sm,
            }),
          },
        }}
      >
        <DialogTitle
          sx={(currentTheme) => ({
            borderBottom: `1px solid ${currentTheme.customTokens.borders.divider}`,
            px: currentTheme.spacing(2.5),
            pt: currentTheme.spacing(2),
            pb: currentTheme.spacing(1.5),
          })}
        >
          <Stack spacing={0.5}>
            <Typography
              sx={{
                fontSize: "1.125rem",
                fontWeight: 600,
                color: "text.primary",
                letterSpacing: "-0.01em",
              }}
            >
              Change Password
            </Typography>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 400,
                color: "text.secondary",
              }}
            >
              Set a new password for this user.
            </Typography>
            {passwordDialogUser ? (
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: "text.secondary",
                  pt: 0.25,
                }}
              >
                {getUserDisplayName(passwordDialogUser)}
                {passwordDialogUser.email
                  ? ` · ${passwordDialogUser.email}`
                  : ""}
              </Typography>
            ) : null}
          </Stack>
        </DialogTitle>

        <DialogContent
          sx={(currentTheme) => ({
            px: currentTheme.spacing(2.5),
            pt: `${currentTheme.spacing(2)} !important`,
            pb: currentTheme.spacing(1),
          })}
        >
          <Stack spacing={2}>
            {passwordError ? (
              <Alert severity="error" sx={{ py: 0.5 }}>
                {passwordError}
              </Alert>
            ) : null}

            <Stack spacing={0.75}>
              <Typography
                component="label"
                htmlFor="change-password-new"
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                New Password
              </Typography>
              <TextField
                id="change-password-new"
                autoFocus
                placeholder="Enter new password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(event) =>
                  handlePasswordValueChange(event.target.value, setNewPassword)
                }
                fullWidth
                sx={[
                  getCompactFieldSx(theme, "default", { large: true }),
                  {
                    "& .MuiOutlinedInput-root": {
                      height: 42,
                      minHeight: 42,
                      borderRadius: "9px",
                    },
                  },
                ]}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showNewPassword
                              ? "Hide new password"
                              : "Show new password"
                          }
                          edge="end"
                          onClick={() => setShowNewPassword((prev) => !prev)}
                          size="small"
                          sx={{ color: "text.secondary" }}
                        >
                          {showNewPassword ? (
                            <EyeOff size={16} strokeWidth={1.75} />
                          ) : (
                            <Eye size={16} strokeWidth={1.75} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>

            <Stack spacing={0.75}>
              <Typography
                component="label"
                htmlFor="change-password-confirm"
                sx={{
                  fontSize: "0.8125rem",
                  fontWeight: 600,
                  color: "text.primary",
                }}
              >
                Confirm Password
              </Typography>
              <TextField
                id="change-password-confirm"
                placeholder="Confirm new password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) =>
                  handlePasswordValueChange(
                    event.target.value,
                    setConfirmPassword,
                  )
                }
                fullWidth
                sx={[
                  getCompactFieldSx(theme, "default", { large: true }),
                  {
                    "& .MuiOutlinedInput-root": {
                      height: 42,
                      minHeight: 42,
                      borderRadius: "9px",
                    },
                  },
                ]}
                slotProps={{
                  input: {
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label={
                            showConfirmPassword
                              ? "Hide confirm password"
                              : "Show confirm password"
                          }
                          edge="end"
                          onClick={() =>
                            setShowConfirmPassword((prev) => !prev)
                          }
                          size="small"
                          sx={{ color: "text.secondary" }}
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={16} strokeWidth={1.75} />
                          ) : (
                            <Eye size={16} strokeWidth={1.75} />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Stack>
          </Stack>
        </DialogContent>

        <DialogActions
          sx={(currentTheme) => ({
            borderTop: `1px solid ${currentTheme.customTokens.borders.divider}`,
            px: currentTheme.spacing(2.5),
            py: currentTheme.spacing(1.75),
            gap: 1,
          })}
        >
          <Button
            type="button"
            onClick={handleClosePasswordDialog}
            sx={recordFormActionButtonSx}
            variant="outlined"
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isChangingPassword}
            onClick={handleChangePassword}
            sx={recordFormActionButtonSx}
            variant="contained"
          >
            {isChangingPassword ? "Updating" : "Update Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </MasterPageShell>
  );
}

function AuditPersonCell({
  name,
  date,
}: {
  name: string;
  date: Date | string;
}) {
  const theme = useTheme();
  const displayName = name?.trim() || "—";
  const displayDate = formatAuditDate(date);

  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Avatar
        sx={{
          width: 28,
          height: 28,
          bgcolor: theme.customTokens.brand.primaryScale[100],
          color: theme.customTokens.brand.primary,
          fontSize: "0.6875rem",
          fontWeight: 700,
          flexShrink: 0,
        }}
      >
        {getUserInitials(displayName === "—" ? "?" : displayName)}
      </Avatar>

      <Stack spacing={0.15} sx={{ minWidth: 0 }}>
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 600,
            color: theme.customTokens.text.primary,
            lineHeight: 1.25,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayName}
        </Typography>
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 400,
            color: theme.customTokens.text.secondary,
            lineHeight: 1.2,
          }}
        >
          {displayDate}
        </Typography>
      </Stack>
    </Stack>
  );
}

function formatAuditDate(value: Date | string) {
  const date =
    value instanceof Date ? value : value ? new Date(value) : null;

  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function FilterableColumnHeader({
  label,
  selectedCount,
  onOpen,
  align = "left",
}: {
  label: string;
  selectedCount: number;
  onOpen: (event: MouseEvent<HTMLButtonElement>) => void;
  align?: "left" | "center";
}) {
  const theme = useTheme();
  const active = selectedCount > 0;

  return (
    <Stack
      direction="row"
      alignItems="center"
      justifyContent={align === "center" ? "center" : "flex-start"}
      spacing={0.5}
      sx={{ minWidth: 0 }}
    >
      <Typography
        component="span"
        sx={{
          fontSize: "inherit",
          fontWeight: "inherit",
          letterSpacing: "inherit",
          textTransform: "inherit",
          color: "inherit",
          lineHeight: 1.2,
        }}
      >
        {label}
      </Typography>

      <IconButton
        size="small"
        aria-label={`Filter by ${label}`}
        onClick={onOpen}
        sx={{
          position: "relative",
          width: 22,
          height: 22,
          p: 0,
          color: active
            ? theme.customTokens.brand.primary
            : theme.customTokens.text.secondary,
          "&:hover": {
            backgroundColor: theme.customTokens.surfaces.alt,
            color: theme.customTokens.brand.primary,
          },
        }}
      >
        <ListFilter
          size={portalIconSize.tableHeader}
          strokeWidth={portalIconStroke.default}
        />
        {active ? (
          <Box
            sx={{
              position: "absolute",
              top: -3,
              right: -4,
              minWidth: 14,
              height: 14,
              px: 0.35,
              borderRadius: "999px",
              backgroundColor: theme.customTokens.brand.primary,
              color: "#FFFFFF",
              fontSize: "0.625rem",
              fontWeight: 700,
              lineHeight: "14px",
              textAlign: "center",
            }}
          >
            {selectedCount > 9 ? "9+" : selectedCount}
          </Box>
        ) : null}
      </IconButton>
    </Stack>
  );
}

function getUserDisplayName(row: UserManagementRecord) {
  const fullName = `${row.firstName} ${row.lastName}`.trim();
  return fullName || row.userName || row.email || "User";
}

function getUserInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getUniqueSortedValues(values: readonly string[]) {
  return Array.from(
    new Set(values.map((value) => value.trim()).filter(Boolean)),
  ).sort((first, second) =>
    first.localeCompare(second, undefined, {
      numeric: true,
      sensitivity: "base",
    }),
  );
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

function isProtectedStatusRow(row: UserManagementRecord) {
  return isCurrentUserRow(row) || isSuperAdminRole(row.role);
}

function isCurrentUserRow(row: UserManagementRecord) {
  const currentUser = getCurrentUser();

  return (
    Boolean(currentUser.id && currentUser.id === row.id) ||
    Boolean(currentUser.email && currentUser.email === row.email)
  );
}

function isSuperAdminRole(role: string) {
  return role.trim().toLowerCase() === "super admin";
}

function isAllowedPasswordValue(value: string) {
  return /^[A-Za-z0-9_@]*$/.test(value);
}

function tableHeaderCellSx(theme: Theme) {
  return listingTableHeaderCellSx(theme);
}

function tableBodyCellSx(theme: Theme) {
  return listingTableBodyCellSx(theme);
}

function paginationIconButtonSx(theme: Theme) {
  return listingPaginationIconButtonSx(theme);
}

function pageNumberButtonSx(theme: Theme, isActive: boolean) {
  return listingPageNumberButtonSx(theme, isActive);
}
