import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterFieldValue, MasterRecord } from "../../../shared/types";
import { colorMasterDefinition } from "../../colorMasterDefinition";
import {
  createColorApi,
  fetchColorsApi,
  syncColorMasterToStorage,
} from "../../api/colorMasterApi";
import { invalidateMaster } from "../../../../../query/queryClient";

export function AddColorMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, MasterFieldValue>;
  }) => {
    const remark = context.values.remark || context.values.remarks || null;
    const status = context.values.status;
    try {
      const created = await createColorApi({
        colorName: String(context.values.colorName || context.values.name || ""),
        remark: typeof remark === "string" ? remark : null,
        ...(typeof status === "boolean" || typeof status === "string"
          ? { status }
          : { status: true }),
      });
      if (created) {
        const allRecords = await fetchColorsApi();
        if (allRecords.length > 0) {
          syncColorMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("color");
    } catch (error) {
      console.warn("Failed to create color via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={colorMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}
