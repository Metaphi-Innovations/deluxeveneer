import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { createHsnApi, fetchHsnsApi, syncHsnMasterToStorage } from "../../api/hsnMasterApi";
import { useHsnGstOptions } from "../../hooks/useHsnGstOptions";

export function AddHSNMasterPage() {
  const definition = useHsnGstOptions();

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createHsnApi({
        hsnCode: String(context.values.hsnCode || context.values.code || ""),
        hsnCodeDescription: String(
          context.values.hsnCodeDescription || context.values.description || "",
        ),
        gstPercentage: context.values.gstPercentage || context.values.gst || "18%",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchHsnsApi();
        if (allRecords.length > 0) {
          syncHsnMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("hsn");
    } catch (error) {
      console.warn("Failed to create HSN record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={definition}
      mode="add"
      onSave={handleSave}
    />
  );
}
