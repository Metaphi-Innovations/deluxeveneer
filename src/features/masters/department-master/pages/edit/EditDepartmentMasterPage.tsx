import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchDepartmentsApi,
  syncDepartmentMasterToStorage,
  updateDepartmentApi,
} from "../../api/departmentMasterApi";
import { departmentMasterDefinition } from "../../mock/departmentMasterData";

export function EditDepartmentMasterPage() {
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
      const updated = await updateDepartmentApi(context.row.id, {
        departmentName: String(context.values.departmentName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchDepartmentsApi();
        if (allRecords.length > 0) {
          syncDepartmentMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("department");
    } catch (error) {
      console.warn("Failed to update department via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={departmentMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}
