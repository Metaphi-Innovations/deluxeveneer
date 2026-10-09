import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { fetchHsnsApi, syncHsnMasterToStorage, updateHsnApi } from "../../api/hsnMasterApi";
import { useHsnGstOptions } from "../../hooks/useHsnGstOptions";

export function EditHSNMasterPage() {
  const definition = useHsnGstOptions();

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
      const updated = await updateHsnApi(context.row.id, {
        hsnCode: String(context.values.hsnCode || context.values.code || ""),
        hsnCodeDescription: String(
          context.values.hsnCodeDescription || context.values.description || "",
        ),
        gstPercentage: context.values.gstPercentage || context.values.gst,
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (updated) {
        const allRecords = await fetchHsnsApi();
        if (allRecords.length > 0) {
          syncHsnMasterToStorage(allRecords);
        }
      }
      void invalidateMaster("hsn");
    } catch (error) {
      console.warn("Failed to update HSN record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={definition}
      mode="edit"
      onSave={handleSave}
    />
  );
}
