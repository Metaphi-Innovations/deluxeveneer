import type { MasterFieldDefinition } from "../../masters/shared";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";

export const cncFlutingProcessDate = {
  key: "cncDate",
  label: "Fluting Date",
} as const;

export function orderCncFlutingCreateFields(fields: readonly MasterFieldDefinition[]) {
  return insertFactoryCreateField(fields, "fluteCode", (withoutSpecialField) =>
    withoutSpecialField.findIndex((field) => field.key === "itemSubCategory") + 1,
  );
}
