import { QueryClient } from "@tanstack/react-query";

import { queryKeys } from "./queryKeys";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export const DROPDOWN_STALE_TIME = 5 * 60 * 1000;

export function invalidateMaster(name: string) {
  return queryClient.invalidateQueries({ queryKey: queryKeys.masters.all(name) });
}

export function invalidateUsers() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
}

export function invalidateWarehouseInward() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.inward.all });
}

export function invalidateWarehouseStorage() {
  return queryClient.invalidateQueries({ queryKey: queryKeys.warehouse.storage.all });
}

export function invalidateWarehouseProduction() {
  return queryClient.invalidateQueries({
    queryKey: queryKeys.warehouse.production.all,
  });
}
