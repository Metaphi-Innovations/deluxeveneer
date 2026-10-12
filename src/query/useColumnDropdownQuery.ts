import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { DROPDOWN_STALE_TIME } from "./queryClient";

type ColumnDropdownResult = {
  column: string;
  options: Array<{ value: string; label: string }>;
};

export function useColumnDropdownQuery(
  queryKey: readonly unknown[],
  fetcher: (columnKey: string) => Promise<ColumnDropdownResult>,
) {
  const [columnKey, setColumnKey] = useState<string | null>(null);
  const query = useQuery({
    queryKey: [...queryKey, columnKey ?? ""],
    queryFn: () => fetcher(columnKey!),
    enabled: Boolean(columnKey),
    staleTime: DROPDOWN_STALE_TIME,
  });

  const filterOptionsByColumn = useMemo(() => {
    if (!columnKey || !query.data || query.data.column !== columnKey) {
      return {};
    }

    return { [query.data.column]: query.data.options };
  }, [columnKey, query.data]);

  return {
    filterOptionsByColumn,
    loadColumnDropdown: setColumnKey,
  };
}
