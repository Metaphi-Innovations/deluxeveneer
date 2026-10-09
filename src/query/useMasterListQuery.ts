import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { queryKeys } from "./queryKeys";
import { useDebouncedValue } from "./useDebouncedValue";

type MasterListResult<T> = {
  items: T[];
  pagination: { total: number };
};

export function useMasterListQuery<T>({
  master,
  page,
  rowsPerPage,
  search,
  sortBy,
  sortOrder,
  filters,
  fetchPage,
  onLoaded,
}: {
  master: string;
  page: number;
  rowsPerPage: number;
  search: string;
  sortBy?: string;
  sortOrder: "asc" | "desc" | null;
  filters: Record<string, string[]>;
  fetchPage: (params: {
    page: number;
    limit: number;
    search: string;
    sortBy?: string;
    sortOrder?: "asc" | "desc";
    filters?: Record<string, string[]>;
  }) => Promise<MasterListResult<T>>;
  onLoaded?: (items: T[]) => void;
}) {
  const debouncedSearch = useDebouncedValue(search);
  const listParams = {
    page,
    limit: rowsPerPage,
    search: debouncedSearch,
    sortBy: sortBy ?? null,
    sortOrder,
    filters,
  };

  const listQuery = useQuery({
    queryKey: queryKeys.masters.list(master, listParams),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const result = await fetchPage({
        page,
        limit: rowsPerPage,
        search: debouncedSearch,
        ...(sortBy ? { sortBy } : {}),
        ...(sortOrder ? { sortOrder } : {}),
        ...(Object.keys(filters).length > 0 ? { filters } : {}),
      });
      onLoaded?.(result.items);
      return result;
    },
  });

  return {
    rows: listQuery.data?.items ?? [],
    totalCount: listQuery.data?.pagination.total ?? 0,
    isLoading: listQuery.isLoading,
    error: listQuery.error,
  };
}
