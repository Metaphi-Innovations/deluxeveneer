import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  createGradeApi,
  fetchGradesApi,
  syncGradeMasterToStorage,
} from "../../api/gradeMasterApi";
import { gradeMasterDefinition } from "../../gradeMasterDefinition";

export function AddGradeMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createGradeApi({
        gradeName: String(context.values.gradeName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchGradesApi();
        if (allRecords.length > 0) {
          syncGradeMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("grade");
    } catch (error) {
      console.warn("Failed to create grade via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={gradeMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}
