import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { createCutApi, fetchCutsApi, syncCutMasterToStorage } from "../../api/cutMasterApi";
import { cutMasterDefinition } from "../../cutMasterDefinition";

export function AddCutMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createCutApi({
        cutName: String(context.values.cutName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchCutsApi();
        if (allRecords.length > 0) {
          syncCutMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("cut");
    } catch (error) {
      console.warn("Failed to create cut via API:", error);
    }
  };

  return (
    <MasterFormPage
      definition={cutMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}
