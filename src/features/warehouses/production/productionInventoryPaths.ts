/** Build inventory view/edit URLs for production warehouse stock. */
export function getProductionInventoryRecordPath(input: {
  slug: "raw-veneer" | "plywood" | "mdf";
  id: string;
  mode: "view" | "edit";
  warehouseId: string;
  warehouseName: string;
  returnTo: string;
}): string {
  const url = new URL(
    `/inventory/${input.slug}/${input.mode}/${input.id}`,
    window.location.origin,
  );
  url.searchParams.set("warehouse", "warehouse-c");
  url.searchParams.set("warehouseId", input.warehouseId);
  url.searchParams.set("warehouseName", input.warehouseName);
  url.searchParams.set("returnTo", input.returnTo);
  url.searchParams.set("source", "production");
  return `${url.pathname}?${url.searchParams.toString()}`;
}

/** True when view/edit must use production APIs — never inward lookup. */
export function isProductionInventorySearch(
  searchParams: URLSearchParams,
): boolean {
  const source = searchParams.get("source")?.trim().toLowerCase() || "";
  const warehouse = searchParams.get("warehouse")?.trim().toLowerCase() || "";
  return source === "production" || warehouse === "warehouse-c";
}
