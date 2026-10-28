import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../query/useColumnDropdownQuery";
import { useDebouncedValue } from "../../../query/useDebouncedValue";
import {
  encodeAuditFilterValues,
  type ActiveColumnFilterChip,
} from "../../shared/columnFilters";
import {
  fetchUserManagementPaginated,
  fetchUserManagementColumnDropdown,
  updateUserManagementStatus,
} from "../api/userManagementApi";
import type { UserManagementRecord } from "../shared/userManagementConfig";

export type SortColumnKey =
  | "user"
  | "department"
  | "email"
  | "phone"
  | "status"
  | "createdBy"
  | "updatedBy";

export function useUserList(canEdit: boolean) {
  const [searchValue, setSearchValue] = useState("");
  const [userFilter, setUserFilter] = useState<string[]>([]);
  const [departmentFilter, setDepartmentFilter] = useState<string[]>([]);
  const [emailFilter, setEmailFilter] = useState<string[]>([]);
  const [phoneFilter, setPhoneFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<string[]>([]);
  const [createdByFilter, setCreatedByFilter] = useState<string[]>([]);
  const [createdDateFrom, setCreatedDateFrom] = useState("");
  const [createdDateTo, setCreatedDateTo] = useState("");
  const [updatedByFilter, setUpdatedByFilter] = useState<string[]>([]);
  const [updatedDateFrom, setUpdatedDateFrom] = useState("");
  const [updatedDateTo, setUpdatedDateTo] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: SortColumnKey;
    direction: "asc" | "desc";
  } | null>(null);
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [actionError, setActionError] = useState("");
  const debouncedSearch = useDebouncedValue(searchValue);
  const queryClient = useQueryClient();
  const { filterOptionsByColumn, loadColumnDropdown } = useColumnDropdownQuery(
    queryKeys.users.columnDropdowns,
    fetchUserManagementColumnDropdown,
  );
  const filters = useMemo(() => {
    const result: Record<string, string[]> = {};
    if (userFilter.length > 0) result.user = userFilter;
    if (departmentFilter.length > 0) result.department = departmentFilter;
    if (emailFilter.length > 0) result.email = emailFilter;
    if (phoneFilter.length > 0) result.phone = phoneFilter;
    if (statusFilter.length > 0) result.status = statusFilter;
    if (createdByFilter.length > 0) result.createdBy = createdByFilter;
    if (createdDateFrom) result.createdAtFrom = [createdDateFrom];
    if (createdDateTo) result.createdAtTo = [createdDateTo];
    if (updatedByFilter.length > 0) result.updatedBy = updatedByFilter;
    if (updatedDateFrom) result.updatedAtFrom = [updatedDateFrom];
    if (updatedDateTo) result.updatedAtTo = [updatedDateTo];
    return result;
  }, [
    createdByFilter,
    createdDateFrom,
    createdDateTo,
    departmentFilter,
    emailFilter,
    phoneFilter,
    statusFilter,
    updatedByFilter,
    updatedDateFrom,
    updatedDateTo,
    userFilter,
  ]);
  const listParams = useMemo(
    () => ({
      page,
      limit: rowsPerPage,
      search: debouncedSearch,
      ...(sortConfig ? { sortBy: sortConfig.key, sortOrder: sortConfig.direction } : {}),
      ...(Object.keys(filters).length > 0 ? { filters } : {}),
    }),
    [debouncedSearch, filters, page, rowsPerPage, sortConfig],
  );
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

  const optionValues = (column: string) =>
    (filterOptionsByColumn[column] ?? []).map((option) => option.value);
  const userOptions = optionValues("user");
  const departmentOptions = optionValues("department");
  const emailOptions = optionValues("email");
  const phoneOptions = optionValues("phone");
  const createdByOptions = optionValues("createdBy");
  const updatedByOptions = optionValues("updatedBy");

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

  const filteredRows = rows;

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
    createdDateFrom,
    createdDateTo,
    updatedByFilter,
    updatedDateFrom,
    updatedDateTo,
    rowsPerPage,
  ]);

  useEffect(() => {
    if (page > totalPages && totalPages > 0) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handleStatusChange = async (row: UserManagementRecord, checked: boolean) => {
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
                    updatedBy: currentRow.updatedBy,
                    updatedDate: currentRow.updatedDate,
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
    if (createdByFilter.length > 0 || createdDateFrom || createdDateTo) {
      chips.push({
        columnKey: "createdBy",
        columnLabel: "Created By",
        filter: {
          type: "multiSelect",
          values: encodeAuditFilterValues(createdByFilter, createdDateFrom, createdDateTo),
        },
      });
    }
    if (updatedByFilter.length > 0 || updatedDateFrom || updatedDateTo) {
      chips.push({
        columnKey: "updatedBy",
        columnLabel: "Updated By",
        filter: {
          type: "multiSelect",
          values: encodeAuditFilterValues(updatedByFilter, updatedDateFrom, updatedDateTo),
        },
      });
    }

    return chips;
  }, [
    createdByFilter,
    createdDateFrom,
    createdDateTo,
    departmentFilter,
    emailFilter,
    phoneFilter,
    statusFilter,
    updatedByFilter,
    updatedDateFrom,
    updatedDateTo,
    userFilter,
  ]);

  return {
    activeFilterChips,
    createdByFilter,
    createdByOptions,
    createdDateFrom,
    createdDateTo,
    departmentFilter,
    departmentOptions,
    emailFilter,
    emailOptions,
    errorMessage,
    filteredRows,
    handleSort,
    handleStatusChange,
    isLoading,
    loadColumnDropdown,
    page,
    phoneFilter,
    phoneOptions,
    rows,
    rowsPerPage,
    searchValue,
    setCreatedByFilter,
    setCreatedDateFrom,
    setCreatedDateTo,
    setDepartmentFilter,
    setEmailFilter,
    setPage,
    setPhoneFilter,
    setRowsPerPage,
    setSearchValue,
    setStatusFilter,
    setUpdatedByFilter,
    setUpdatedDateFrom,
    setUpdatedDateTo,
    setUserFilter,
    sortConfig,
    statusFilter,
    totalCount,
    totalPages,
    updatedByFilter,
    updatedByOptions,
    updatedDateFrom,
    updatedDateTo,
    userFilter,
    userOptions,
  };
}
