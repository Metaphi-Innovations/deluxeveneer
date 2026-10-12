import type { FactoryRecord } from "../shared/types";

export function withMarquetryIssuedFrom<Row extends FactoryRecord>(row: Row): Row {
  return {
    ...row,
    issuedFrom: "Inventory",
  };
}
