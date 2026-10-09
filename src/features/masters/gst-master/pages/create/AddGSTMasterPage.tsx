import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { createGstApi, fetchGstsApi, syncGstMasterToStorage } from "../../api/gstMasterApi";
import { gstMasterDefinition } from "../../gstMasterDefinition";

export function AddGSTMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const rawGst = context.values.gstPercentage || context.values.percentage || "";
      const created = await createGstApi({
        gstPercentage: String(rawGst),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchGstsApi();
        if (allRecords.length > 0) {
          syncGstMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("gst");
    } catch (error) {
      console.warn("Failed to create GST record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={gstMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}
