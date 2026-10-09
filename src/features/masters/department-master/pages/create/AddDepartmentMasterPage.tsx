import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  createDepartmentApi,
  fetchDepartmentsApi,
  syncDepartmentMasterToStorage,
} from "../../api/departmentMasterApi";
import { departmentMasterDefinition } from "../../mock/departmentMasterData";

export function AddDepartmentMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createDepartmentApi({
        departmentName: String(context.values.departmentName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchDepartmentsApi();
        if (allRecords.length > 0) {
          syncDepartmentMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("department");
    } catch (error) {
      console.warn("Failed to create department via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={departmentMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}
