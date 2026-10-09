import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router";

import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import { updateLocalMasterRecord } from "../../../shared/localMasterStore";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchItemCategoriesApi,
  getItemCategoryByIdApi,
  syncItemCategoryMasterToStorage,
  updateItemCategoryApi,
} from "../../api/itemCategoryMasterApi";
import { itemCategoryMasterDefinition } from "../../itemCategoryMasterDefinition";
import {
  buildCategoryDefinitionWithHsn,
  useHsnOptions,
} from "../ItemCategoryMasterPagesForm";

export function EditItemCategoryMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { hsnOptions, hsnRows } = useHsnOptions();

  useEffect(() => {
    let ignore = false;

    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const item = await getItemCategoryByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load category.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadRecord();
    return () => {
      ignore = true;
    };
  }, [params.id]);

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
    const id = context.row?.id || params.id;
    if (!id) {
      return;
    }

    try {
      const updated = await updateItemCategoryApi(id, {
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode,
        gst: context.values.gst || context.values.gstNo,
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchItemCategoriesApi();
        if (allRecords.length > 0) {
          syncItemCategoryMasterToStorage(allRecords);
        }
      } else if (context.row) {
        updateLocalMasterRecord(context.definition, context.row, context.values);
      }
    } catch (error) {
      console.warn("Failed to update item category via API, persisting locally:", error);
      if (context.row) {
        updateLocalMasterRecord(context.definition, context.row, context.values);
      }
    }
    void invalidateMaster("itemCategory");
  };

  return (
    <MasterFormPage
      definition={definitionWithDynamicOptions}
      errorMessage={errorMessage}
      loading={isLoading}
      mode="edit"
      {...(record ? { record } : {})}
      onSave={handleSave}
    />
  );
}
