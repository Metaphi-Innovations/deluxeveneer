import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterFieldValue, MasterRecord } from "../../../shared/types";
import { colorMasterDefinition } from "../../colorMasterDefinition";
import {
  fetchColorsApi,
  syncColorMasterToStorage,
  updateColorApi,
} from "../../api/colorMasterApi";
import { invalidateMaster } from "../../../../../query/queryClient";

export function EditColorMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, MasterFieldValue>;
  }) => {
    if (!context.row?.id) {
      return;
    }

    const remark = context.values.remark || context.values.remarks || null;
    const status = context.values.status;
    try {
      const updated = await updateColorApi(context.row.id, {
        colorName: String(context.values.colorName || context.values.name || ""),
        remark: typeof remark === "string" ? remark : null,
        ...(typeof status === "boolean" || typeof status === "string" ? { status } : {}),
      });
      if (updated) {
        const allRecords = await fetchColorsApi();
        if (allRecords.length > 0) {
          syncColorMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("color");
    } catch (error) {
      console.warn("Failed to update color via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={colorMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}
