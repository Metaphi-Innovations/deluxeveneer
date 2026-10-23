import { useQuery } from "@tanstack/react-query";

import { fetchSidebarWarehouses } from "../features/warehouses/shared/warehouseSidebarStore";
import { queryKeys } from "./queryKeys";

export function useSidebarWarehousesQuery(enabled = true) {
  return useQuery({
    queryKey: queryKeys.warehouse.sidebar,
    queryFn: fetchSidebarWarehouses,
    enabled,
  });
}
