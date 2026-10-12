import { useMemo } from "react";

import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import { createLocalMasterRecord } from "../../../shared/localMasterStore";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  createItemCategoryApi,
  fetchItemCategoriesApi,
  syncItemCategoryMasterToStorage,
} from "../../api/itemCategoryMasterApi";
import { itemCategoryMasterDefinition } from "../../itemCategoryMasterDefinition";
import {
  buildCategoryDefinitionWithHsn,
  useHsnOptions,
} from "../ItemCategoryMasterPagesForm";

export function AddItemCategoryMasterPage() {
  const { hsnOptions, hsnRows } = useHsnOptions();
  const definitionWithDynamicOptions = useMemo<MasterDefinition>(
    () => buildCategoryDefinitionWithHsn(itemCategoryMasterDefinition, hsnOptions, hsnRows),
    [hsnOptions, hsnRows],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemCategoryApi({
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode || "",
        gst: context.values.gst || context.values.gstNo || "",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchItemCategoriesApi();
        if (allRecords.length > 0) {
          syncItemCategoryMasterToStorage(allRecords);
        } else {
          createLocalMasterRecord(context.definition, context.values);
        }
      } else {
        createLocalMasterRecord(context.definition, context.values);
      }
      void invalidateMaster("itemCategory");
    } catch (error) {
      console.warn("Failed to create item category via API, persisting locally:", error);
      createLocalMasterRecord(context.definition, context.values);
    }
  };

  return (
    <MasterFormPage
      definition={definitionWithDynamicOptions}
      mode="add"
      onSave={handleSave}
    />
  );
}
