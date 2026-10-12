import type { MasterFieldDefinition } from "../../masters/shared";

export function insertFactoryCreateField(
  fields: readonly MasterFieldDefinition[],
  specialFieldKey: string,
  insertionIndex: (fields: MasterFieldDefinition[]) => number,
) {
  const specialField = fields.find((field) => field.key === specialFieldKey);
  if (!specialField) {
    return [...fields];
  }

  const withoutSpecialField = fields.filter((field) => field.key !== specialFieldKey);
  const index = insertionIndex(withoutSpecialField);
  withoutSpecialField.splice(
    index >= 0 ? index : withoutSpecialField.length,
    0,
    specialField,
  );
  return withoutSpecialField;
}
