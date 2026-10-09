import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { createUnitApi, fetchUnitsApi, syncUnitMasterToStorage } from "../../api/unitMasterApi";
import { unitMasterDefinition } from "../../unitMasterDefinition";

export function AddUnitMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    const created = await createUnitApi({
      unitName: String(context.values.unitName || context.values.name || ""),
      symbolicName: context.values.symbolicName ? String(context.values.symbolicName) : null,
      remark: context.values.remark || context.values.remarks || null,
      status: context.values.status ?? true,
    });
    if (created) {
      const allRecords = await fetchUnitsApi();
      if (allRecords.length > 0) {
        syncUnitMasterToStorage(allRecords);
      }
    }
    void invalidateMaster("unit");
  };

  return (
    <MasterFormPage
      definition={unitMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}
