import type { MasterFieldDefinition } from "../../masters/shared";

import { insertFactoryCreateField } from "../shared/factoryCreateFieldOrder";

export const embossingProcessDate = {
  key: "cncDate",
  label: "Embossing Date",
  aliases: ["embossingDate"],
} as const;

export function orderEmbossingCreateFields(fields: readonly MasterFieldDefinition[]) {
  return insertFactoryCreateField(fields, "structureCode", (withoutSpecialField) =>
    withoutSpecialField.findIndex((field) => field.key === "itemSubCategory") + 1,
  );
}
