export type WarehousePermissionType = "Inward" | "Storage" | "Production";

export interface DynamicWarehousePermissionItem {
  id: string;
  label: string;
  warehouseType: WarehousePermissionType;
}

export const WAREHOUSE_SCOPED_CODE_PATTERN =
  /^WAREHOUSE_([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})_(VIEW|CREATE|UPDATE)$/i;

export function getDynamicWarehousePermissionKey(warehouseId: string) {
  return `warehouse:${warehouseId}`;
}

export function parseDynamicWarehousePermissionKey(
  permissionKey: string,
): string | null {
  if (!permissionKey.startsWith("warehouse:")) {
    return null;
  }

  const warehouseId = permissionKey.slice("warehouse:".length).trim();
  return warehouseId || null;
}

export function getWarehouseScopedPermissionCodes(warehouseId: string) {
  return {
    view: `WAREHOUSE_${warehouseId}_VIEW`,
    create: `WAREHOUSE_${warehouseId}_CREATE`,
    update: `WAREHOUSE_${warehouseId}_UPDATE`,
  } as const;
}

export function applyWarehouseScopedCodesToPermissions(
  codes: readonly string[],
  permissions: Record<
    string,
    { view: boolean; create: boolean; edit: boolean }
  >,
) {
  for (const code of codes) {
    const match = WAREHOUSE_SCOPED_CODE_PATTERN.exec(code);
    if (!match?.[1] || !match[2]) {
      continue;
    }

    const warehouseId = match[1];
    const action = match[2].toUpperCase();
    const key = getDynamicWarehousePermissionKey(warehouseId);
    const current = permissions[key] ?? {
      view: false,
      create: false,
      edit: false,
    };

    if (action === "VIEW") {
      current.view = true;
    } else if (action === "CREATE") {
      current.create = true;
    } else if (action === "UPDATE") {
      current.edit = true;
    }

    permissions[key] = current;
  }
}

export function collectWarehouseScopedCodesFromPermissions(
  permissions: Record<
    string,
    { view?: boolean; create?: boolean; edit?: boolean } | undefined
  >,
): string[] {
  const codes: string[] = [];

  for (const [key, flags] of Object.entries(permissions)) {
    const warehouseId = parseDynamicWarehousePermissionKey(key);
    if (!warehouseId || !flags) {
      continue;
    }

    const scoped = getWarehouseScopedPermissionCodes(warehouseId);
    if (flags.view) codes.push(scoped.view);
    if (flags.create) codes.push(scoped.create);
    if (flags.edit) codes.push(scoped.update);
  }

  return codes;
}
