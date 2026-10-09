import { useQuery } from "@tanstack/react-query";

import { fetchSidebarWarehouses } from "../features/warehouses/shared/warehouseSidebarStore";
import { DROPDOWN_STALE_TIME } from "./queryClient";
import { queryKeys } from "./queryKeys";

export function useSidebarWarehousesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.warehouse.sidebar,
    queryFn: fetchSidebarWarehouses,
    enabled,
    staleTime: DROPDOWN_STALE_TIME,
  });
}
