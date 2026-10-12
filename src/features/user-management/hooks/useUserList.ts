import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";

import { queryKeys } from "../../../query/queryKeys";
import { useDebouncedValue } from "../../../query/useDebouncedValue";
import type { ActiveColumnFilterChip } from "../../shared/columnFilters";
import {
  fetchUserManagementPaginated,
  updateUserManagementStatus,
} from "../api/userManagementApi";
import type { UserManagementRecord } from "../shared/userManagementConfig";
import { getUniqueSortedValues, getUserDisplayName } from "./userRowDisplay";

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

  const userOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => getUserDisplayName(row))),
    [rows],
  );
  const departmentOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => row.department)),
    [rows],
  );
  const emailOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => row.email)),
    [rows],
  );
  const phoneOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => row.phoneNo)),
    [rows],
  );
  const createdByOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => row.createdBy)),
    [rows],
  );
  const updatedByOptions = useMemo(
    () => getUniqueSortedValues(rows.map((row) => row.updatedBy)),
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
      if (userFilter.length > 0 && !userFilter.includes(getUserDisplayName(row))) {
        return false;
      }
      if (departmentFilter.length > 0 && !departmentFilter.includes(row.department)) {
        return false;
      }
      if (emailFilter.length > 0 && !emailFilter.includes(row.email)) {
        return false;
      }
      if (phoneFilter.length > 0 && !phoneFilter.includes(row.phoneNo)) {
        return false;
      }
      if (statusFilter.length > 0) {
        const matchesActive = statusFilter.includes("ACTIVE") && row.isActive;
        const matchesInactive = statusFilter.includes("INACTIVE") && !row.isActive;
        if (!matchesActive && !matchesInactive) {
          return false;
        }
      }
      if (createdByFilter.length > 0 && !createdByFilter.includes(row.createdBy)) {
        return false;
      }
      if (updatedByFilter.length > 0 && !updatedByFilter.includes(row.updatedBy)) {
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

  return {
    activeFilterChips,
    createdByFilter,
    createdByOptions,
    departmentFilter,
    departmentOptions,
    emailFilter,
    emailOptions,
    errorMessage,
    filteredRows,
    handleSort,
    handleStatusChange,
    isLoading,
    page,
    phoneFilter,
    phoneOptions,
    rows,
    rowsPerPage,
    searchValue,
    setCreatedByFilter,
    setDepartmentFilter,
    setEmailFilter,
    setPage,
    setPhoneFilter,
    setRowsPerPage,
    setSearchValue,
    setStatusFilter,
    setUpdatedByFilter,
    setUserFilter,
    sortConfig,
    statusFilter,
    totalCount,
    totalPages,
    updatedByFilter,
    updatedByOptions,
    userFilter,
    userOptions,
  };
}
