export interface DynamicWarehousePermissionItem {
  slug: string;
  label: string;
}

export function getDynamicWarehousePermissionKey(slug: string) {
  return `warehouse:${slug}`;
}
