export type ProductionListQueryState = {
  sortBy: string | null;
  sortOrder: "asc" | "desc" | null;
  filters: Record<string, string[]>;
  totalCount: number;
};

export const EMPTY_PRODUCTION_LIST_QUERY: ProductionListQueryState = {
  sortBy: "inwardDate",
  sortOrder: "desc",
  filters: {},
  totalCount: 0,
};
