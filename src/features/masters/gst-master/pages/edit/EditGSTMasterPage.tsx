import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { fetchGstsApi, syncGstMasterToStorage, updateGstApi } from "../../api/gstMasterApi";
import { gstMasterDefinition } from "../../gstMasterDefinition";

export function EditGSTMasterPage() {
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
      const rawGst = context.values.gstPercentage || context.values.percentage || "";
      const updated = await updateGstApi(context.row.id, {
        gstPercentage: String(rawGst),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchGstsApi();
        if (allRecords.length > 0) {
          syncGstMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("gst");
    } catch (error) {
      console.warn("Failed to update GST record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={gstMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}
