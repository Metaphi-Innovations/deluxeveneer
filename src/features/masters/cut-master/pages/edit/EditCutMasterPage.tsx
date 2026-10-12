import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { fetchCutsApi, syncCutMasterToStorage, updateCutApi } from "../../api/cutMasterApi";
import { cutMasterDefinition } from "../../cutMasterDefinition";

export function EditCutMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (!context.row?.id) {
      return;
    }

    try {
      const updated = await updateCutApi(context.row.id, {
        cutName: String(context.values.cutName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchCutsApi();
        if (allRecords.length > 0) {
          syncCutMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("cut");
    } catch (error) {
      console.warn("Failed to update cut via API:", error);
    }
  };

  return (
    <MasterFormPage
      definition={cutMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}
