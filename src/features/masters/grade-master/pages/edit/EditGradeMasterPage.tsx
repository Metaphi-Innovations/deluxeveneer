import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchGradesApi,
  syncGradeMasterToStorage,
  updateGradeApi,
} from "../../api/gradeMasterApi";
import { gradeMasterDefinition } from "../../gradeMasterDefinition";

export function EditGradeMasterPage() {
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
      const updated = await updateGradeApi(context.row.id, {
        gradeName: String(context.values.gradeName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchGradesApi();
        if (allRecords.length > 0) {
          syncGradeMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("grade");
    } catch (error) {
      console.warn("Failed to update grade via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={gradeMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}
