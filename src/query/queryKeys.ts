export const queryKeys = {
  masters: {
    all: (name: string) => ["masters", name] as const,
    list: (name: string, params: unknown) =>
      ["masters", name, "list", params] as const,
    detail: (name: string, id: string) =>
      ["masters", name, "detail", id] as const,
    dropdowns: (name: string) => ["masters", name, "dropdowns"] as const,
    columnDropdowns: (name: string) =>
      ["masters", name, "columnDropdown"] as const,
    columnDropdown: (name: string, column: string) =>
      ["masters", name, "columnDropdown", column] as const,
  },
  users: {
    all: ["users"] as const,
    list: (params: unknown) => ["users", "list", params] as const,
    detail: (id: string) => ["users", "detail", id] as const,
  },
  warehouse: {
    sidebar: ["warehouse", "sidebar"] as const,
    inward: {
      all: ["warehouse", "inward"] as const,
      list: (params: unknown) => ["warehouse", "inward", "list", params] as const,
      detail: (id: string) => ["warehouse", "inward", "detail", id] as const,
      columnDropdown: (column: string, params: unknown) =>
        ["warehouse", "inward", "columnDropdown", column, params] as const,
    },
    storage: {
      all: ["warehouse", "storage"] as const,
      list: (inventory: string, params: unknown) =>
        ["warehouse", "storage", inventory, "list", params] as const,
      columnDropdown: (inventory: string, column: string) =>
        ["warehouse", "storage", inventory, "columnDropdown", column] as const,
      productionWarehouses: ["warehouse", "storage", "productionWarehouses"] as const,
    },
    production: {
      all: ["warehouse", "production"] as const,
      list: (inventory: string, params: unknown) =>
        ["warehouse", "production", inventory, "list", params] as const,
      detail: (id: string) => ["warehouse", "production", "detail", id] as const,
      columnDropdown: (inventory: string, column: string) =>
        ["warehouse", "production", inventory, "columnDropdown", column] as const,
      options: (storageWarehouseId: string) =>
        ["warehouse", "production", "options", storageWarehouseId] as const,
    },
  },
};
