import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
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
  LinearProgress,
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
  ArrowDownWideNarrow,
  ArrowUpDown,
  ArrowUpWideNarrow,
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
import { ContentLoader } from "../../../components/feedback/ContentLoader";
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
  listingTableHeaderIconButtonSx,
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
  type UserManagementRecord,
} from "./userManagementConfig";
import {
  changeUserPassword,
  fetchUserManagementPaginated,
  updateUserManagementStatus,
} from "./userManagementApi";
import { invalidateUsers } from "../../../query/queryClient";
import { queryKeys } from "../../../query/queryKeys";
import { useDebouncedValue } from "../../../query/useDebouncedValue";

const ROWS_PER_PAGE_OPTIONS = [10, 25, 50, 75, 100, 200] as const;

type ColumnFilterKey =
  | "user"
  | "department"
  | "email"
  | "phone"
  | "status"
  | "createdBy"
  | "updatedBy";

type SortColumnKey =
  | "user"
  | "department"
  | "email"
  | "phone"
  | "status"
  | "createdBy"
  | "updatedBy";

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
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [emailFilter, setEmailFilter] = useState<string[]>([]);
  const [phoneFilter, setPhoneFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [createdByFilter, setCreatedByFilter] = useState<string[]>([]);
  const [updatedByFilter, setUpdatedByFilter] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<{
    key: SortColumnKey;
    direction: "asc" | "desc";
  } | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebouncedValue(searchValue);
  const queryClient = useQueryClient();
  const listParams = {
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
  };
  const listQuery = useQuery({
    queryKey: queryKeys.users.list(listParams),
    placeholderData: keepPreviousData,
    queryFn: () => fetchUserManagementPaginated(listParams),
  });
  const rows = listQuery.data?.items ?? [];
  const totalCount = listQuery.data?.pagination.total ?? 0;
  const totalPages = Math.max(1, listQuery.data?.pagination.totalPages ?? 1);
  const isLoading = listQuery.isLoading || listQuery.isFetching;
  const errorMessage =
    actionError ||
    (listQuery.error instanceof Error ? listQuery.error.message : "");
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

  const userOptions = useMemo(
    () =>
      getUniqueSortedValues(
        rows.map((row: UserManagementRecord) => getUserDisplayName(row)),
      ),
    [rows],
  );

  const departmentOptions = useMemo(
    () =>
      getUniqueSortedValues(
        rows.map((row: UserManagementRecord) => row.department),
      ),
    [rows],
  );

  const emailOptions = useMemo(
    () =>
      getUniqueSortedValues(
        rows.map((row: UserManagementRecord) => row.email),
      ),
    [rows],
  );

  const phoneOptions = useMemo(
    () =>
      getUniqueSortedValues(
        rows.map((row: UserManagementRecord) => row.phoneNo),
      ),
    [rows],
  );

  const createdByOptions = useMemo(
    () =>
      getUniqueSortedValues(
        rows.map((row: UserManagementRecord) => row.createdBy),
      ),
    [rows],
  );

  const updatedByOptions = useMemo(
    () =>
      getUniqueSortedValues(
        rows.map((row: UserManagementRecord) => row.updatedBy),
      ),
    [rows],
  );

  const handleSort = (columnKey: SortColumnKey) => {
    setSortConfig((current) => {
      if (current?.key !== columnKey) {
        return { key: columnKey, direction: "asc" };
      }
      if (current.direction === "asc") {
        return { key: columnKey, direction: "desc" };
      }
      return null;
    });
  };

  const filteredRows = useMemo(() => {
    const list = rows.filter((row: UserManagementRecord) => {
      if (
        userFilter.length > 0 &&
        !userFilter.includes(getUserDisplayName(row))
      ) {
        return false;
      }

      if (
        departmentFilter.length > 0 &&
        !departmentFilter.includes(row.department)
      ) {
        return false;
      }

      if (
        emailFilter.length > 0 &&
        !emailFilter.includes(row.email)
      ) {
        return false;
      }

      if (
        phoneFilter.length > 0 &&
        !phoneFilter.includes(row.phoneNo)
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

      if (
        createdByFilter.length > 0 &&
        !createdByFilter.includes(row.createdBy)
      ) {
        return false;
      }

      if (
        updatedByFilter.length > 0 &&
        !updatedByFilter.includes(row.updatedBy)
      ) {
        return false;
      }

      return true;
    });

    if (sortConfig) {
      return [...list].sort((left, right) => {
        let leftVal: string | number | boolean = "";
        let rightVal: string | number | boolean = "";

        switch (sortConfig.key) {
          case "user": {
            leftVal = getUserDisplayName(left).toLowerCase();
            rightVal = getUserDisplayName(right).toLowerCase();
            break;
          }
          case "department": {
            leftVal = (left.department || "").toLowerCase();
            rightVal = (right.department || "").toLowerCase();
            break;
          }
          case "email": {
            leftVal = (left.email || "").toLowerCase();
            rightVal = (right.email || "").toLowerCase();
            break;
          }
          case "phone": {
            leftVal = (left.phoneNo || "").toLowerCase();
            rightVal = (right.phoneNo || "").toLowerCase();
            break;
          }
          case "status": {
            leftVal = left.isActive ? 1 : 0;
            rightVal = right.isActive ? 1 : 0;
            break;
          }
          case "createdBy": {
            leftVal = (left.createdBy || "").toLowerCase();
            rightVal = (right.createdBy || "").toLowerCase();
            break;
          }
          case "updatedBy": {
            leftVal = (left.updatedBy || "").toLowerCase();
            rightVal = (right.updatedBy || "").toLowerCase();
            break;
          }
        }

        if (leftVal < rightVal) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (leftVal > rightVal) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }

    return [...list].sort((left, right) => {
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
  }, [
    createdByFilter,
    departmentFilter,
    emailFilter,
    phoneFilter,
    rows,
    sortConfig,
    statusFilter,
    updatedByFilter,
    userFilter,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    searchValue,
    userFilter,
    departmentFilter,
    emailFilter,
    phoneFilter,
    statusFilter,
    createdByFilter,
    updatedByFilter,
    rowsPerPage,
  ]);

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

  const activeColumnFilterCount =
    (userFilter.length > 0 ? 1 : 0) +
    (departmentFilter.length > 0 ? 1 : 0) +
    (emailFilter.length > 0 ? 1 : 0) +
    (phoneFilter.length > 0 ? 1 : 0) +
    (statusFilter.length > 0 ? 1 : 0) +
    (createdByFilter.length > 0 ? 1 : 0) +
    (updatedByFilter.length > 0 ? 1 : 0);

  const effectiveTotalCount =
    activeColumnFilterCount > 0 ? filteredRows.length : totalCount;
  const effectiveTotalPages = Math.max(
    1,
    Math.ceil(effectiveTotalCount / rowsPerPage),
  );
  const safePage = Math.min(page, effectiveTotalPages);
  const pageStartIndex = (safePage - 1) * rowsPerPage;
  const currentPageRows = canView
    ? activeColumnFilterCount > 0
      ? filteredRows.slice(pageStartIndex, pageStartIndex + rowsPerPage)
      : filteredRows
    : [];
  const visiblePaginationPages = getVisiblePaginationPages(effectiveTotalPages);
  const rangeStart = effectiveTotalCount === 0 ? 0 : pageStartIndex + 1;
  const rangeEnd = Math.min(pageStartIndex + currentPageRows.length, effectiveTotalCount);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
      void invalidateUsers();
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
      setActionError("");
      queryClient.setQueryData(
        queryKeys.users.list(listParams),
        (current: typeof listQuery.data) => {
          if (!current) return current;
          return {
            ...current,
            items: current.items.map((currentRow) =>
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
          };
        },
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    } catch (error) {
      setActionError(
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


  const activeFilterChips = useMemo(() => {
    const chips: ActiveColumnFilterChip[] = [];

    if (userFilter.length > 0) {
      chips.push({
        columnKey: "user",
        columnLabel: "User",
        filter: { type: "multiSelect", values: userFilter },
      });
    }

    if (departmentFilter.length > 0) {
      chips.push({
        columnKey: "department",
        columnLabel: "Department",
        filter: { type: "multiSelect", values: departmentFilter },
      });
    }

    if (emailFilter.length > 0) {
      chips.push({
        columnKey: "email",
        columnLabel: "Email",
        filter: { type: "multiSelect", values: emailFilter },
      });
    }

    if (phoneFilter.length > 0) {
      chips.push({
        columnKey: "phone",
        columnLabel: "Phone",
        filter: { type: "multiSelect", values: phoneFilter },
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

    if (createdByFilter.length > 0) {
      chips.push({
        columnKey: "createdBy",
        columnLabel: "Created By",
        filter: { type: "multiSelect", values: createdByFilter },
      });
    }

    if (updatedByFilter.length > 0) {
      chips.push({
        columnKey: "updatedBy",
        columnLabel: "Updated By",
        filter: { type: "multiSelect", values: updatedByFilter },
      });
    }

    return chips;
  }, [
    createdByFilter,
    departmentFilter,
    emailFilter,
    phoneFilter,
    statusFilter,
    updatedByFilter,
    userFilter,
  ]);

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
    setUserFilter([]);
    setDepartmentFilter([]);
    setEmailFilter([]);
    setPhoneFilter([]);
    setStatusFilter([]);
    setCreatedByFilter([]);
    setUpdatedByFilter([]);
    handleCloseColumnFilter();
  };

  const userFilterOptions = useMemo(
    () => userOptions.map((option) => ({ value: option, label: option })),
    [userOptions],
  );

  const departmentFilterOptions = useMemo(
    () =>
      departmentOptions.map((option) => ({ value: option, label: option })),
    [departmentOptions],
  );

  const emailFilterOptions = useMemo(
    () => emailOptions.map((option) => ({ value: option, label: option })),
    [emailOptions],
  );

  const phoneFilterOptions = useMemo(
    () => phoneOptions.map((option) => ({ value: option, label: option })),
    [phoneOptions],
  );

  const createdByFilterOptions = useMemo(
    () =>
      createdByOptions.map((option) => ({ value: option, label: option })),
    [createdByOptions],
  );

  const updatedByFilterOptions = useMemo(
    () =>
      updatedByOptions.map((option) => ({ value: option, label: option })),
    [updatedByOptions],
  );

  const statusFilterOptions = useMemo(
    () => [
      { value: "ACTIVE", label: "Active" },
      { value: "INACTIVE", label: "Inactive" },
    ],
    [],
  );

  const activeFilterConfig =
    activeColumnFilter === "user"
      ? {
          label: "User",
          options: userFilterOptions,
          selectedValues: userFilter,
          searchable: true,
          searchPlaceholder: "Search values...",
          onApply: setUserFilter,
          onClear: () => setUserFilter([]),
        }
      : activeColumnFilter === "department"
        ? {
            label: "Department",
            options: departmentFilterOptions,
            selectedValues: departmentFilter,
            searchable: true,
            searchPlaceholder: "Search values...",
            onApply: setDepartmentFilter,
            onClear: () => setDepartmentFilter([]),
          }
        : activeColumnFilter === "email"
          ? {
              label: "Email",
              options: emailFilterOptions,
              selectedValues: emailFilter,
              searchable: true,
              searchPlaceholder: "Search values...",
              onApply: setEmailFilter,
              onClear: () => setEmailFilter([]),
            }
          : activeColumnFilter === "phone"
            ? {
                label: "Phone",
                options: phoneFilterOptions,
                selectedValues: phoneFilter,
                searchable: true,
                searchPlaceholder: "Search values...",
                onApply: setPhoneFilter,
                onClear: () => setPhoneFilter([]),
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
              : activeColumnFilter === "createdBy"
                ? {
                    label: "Created By",
                    options: createdByFilterOptions,
                    selectedValues: createdByFilter,
                    searchable: true,
                    searchPlaceholder: "Search values...",
                    onApply: setCreatedByFilter,
                    onClear: () => setCreatedByFilter([]),
                  }
                : activeColumnFilter === "updatedBy"
                  ? {
                      label: "Updated By",
                      options: updatedByFilterOptions,
                      selectedValues: updatedByFilter,
                      searchable: true,
                      searchPlaceholder: "Search values...",
                      onApply: setUpdatedByFilter,
                      onClear: () => setUpdatedByFilter([]),
                    }
                  : null;

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "User Management" }]}
      title="User Management"
      subtitle=" "
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
            placeholder="Search..."
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


      <Box
        sx={{
          position: "relative",
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          overflow: "hidden",
          backgroundColor: theme.customTokens.surfaces.surface,
          boxShadow: theme.customTokens.elevation.xs,
        }}
      >
        {isLoading ? (
          <LinearProgress
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              height: 3,
              backgroundColor: theme.customTokens.surfaces.alt,
              "& .MuiLinearProgress-bar": {
                backgroundColor: theme.customTokens.brand.primary,
              },
            }}
          />
        ) : null}
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
                  <FilterableColumnHeader
                    label="User"
                    selectedCount={userFilter.length}
                    onOpen={(event) =>
                      handleOpenColumnFilter("user", event)
                    }
                    sortActive={sortConfig?.key === "user"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("user")}
                  />
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
                    sortActive={sortConfig?.key === "department"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("department")}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "16%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Email"
                    selectedCount={emailFilter.length}
                    onOpen={(event) =>
                      handleOpenColumnFilter("email", event)
                    }
                    sortActive={sortConfig?.key === "email"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("email")}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "11%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Phone"
                    selectedCount={phoneFilter.length}
                    onOpen={(event) =>
                      handleOpenColumnFilter("phone", event)
                    }
                    sortActive={sortConfig?.key === "phone"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("phone")}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "14%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Remarks"
                  />
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
                    sortActive={sortConfig?.key === "status"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("status")}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "14%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Created By"
                    selectedCount={createdByFilter.length}
                    onOpen={(event) =>
                      handleOpenColumnFilter("createdBy", event)
                    }
                    sortActive={sortConfig?.key === "createdBy"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("createdBy")}
                  />
                </TableCell>

                <TableCell
                  sx={{
                    ...tableHeaderCellSx(theme),
                    width: "14%",
                  }}
                >
                  <FilterableColumnHeader
                    label="Updated By"
                    selectedCount={updatedByFilter.length}
                    onOpen={(event) =>
                      handleOpenColumnFilter("updatedBy", event)
                    }
                    sortActive={sortConfig?.key === "updatedBy"}
                    sortDirection={sortConfig?.direction}
                    onSort={() => handleSort("updatedBy")}
                  />
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
                  <TableCell colSpan={9} sx={{ py: isLoading ? 3 : 6, textAlign: "center" }}>
                    {isLoading ? (
                      <ContentLoader label="Loading..." minHeight={160} />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No users found.
                      </Typography>
                    )}
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
                        {row.phoneNo ? (
                          <Typography
                            component="a"
                            href={`tel:${row.phoneNo.replace(/[^\d+]/g, "")}`}
                            onClick={(event) => event.stopPropagation()}
                            sx={{
                              fontSize: "0.875rem",
                              color: theme.customTokens.brand.primary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              textDecoration: "none",
                              cursor: "pointer",
                              "&:hover": {
                                textDecoration: "underline",
                              },
                            }}
                          >
                            {row.phoneNo}
                          </Typography>
                        ) : (
                          <Typography
                            sx={{
                              fontSize: "0.875rem",
                              color: theme.customTokens.text.secondary,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            }}
                          >
                            —
                          </Typography>
                        )}
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
            Showing {rangeStart}–{rangeEnd} of {totalCount}
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

function SortIndicator({
  active,
  direction,
}: {
  active: boolean;
  direction?: "asc" | "desc" | undefined;
}) {
  const theme = useTheme();

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

function FilterableColumnHeader({
  label,
  selectedCount,
  onOpen,
  sortActive = false,
  sortDirection,
  onSort,
  align = "left",
}: {
  label: string;
  selectedCount?: number | undefined;
  onOpen?: ((event: MouseEvent<HTMLButtonElement>) => void) | undefined;
  sortActive?: boolean | undefined;
  sortDirection?: "asc" | "desc" | undefined;
  onSort?: (() => void) | undefined;
  align?: "left" | "center" | undefined;
}) {
  const theme = useTheme();
  const active = typeof selectedCount === "number" && selectedCount > 0;

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

      {onSort ? (
        <IconButton
          size="small"
          aria-label={`Sort by ${label}`}
          onClick={onSort}
          sx={(currentTheme) => listingTableHeaderIconButtonSx(currentTheme)}
        >
          <SortIndicator active={sortActive} direction={sortDirection} />
        </IconButton>
      ) : null}

      {onOpen ? (
        <IconButton
          size="small"
          aria-label={`Filter by ${label}`}
          onClick={onOpen}
          sx={(currentTheme) => ({
            ...listingTableHeaderIconButtonSx(currentTheme),
            position: "relative",
            color: active
              ? currentTheme.customTokens.brand.primary
              : currentTheme.customTokens.text.secondary,
          })}
        >
          <ListFilter
            size={portalIconSize.tableHeader}
            strokeWidth={portalIconStroke.default}
          />
          {active && selectedCount ? (
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
      ) : null}
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
