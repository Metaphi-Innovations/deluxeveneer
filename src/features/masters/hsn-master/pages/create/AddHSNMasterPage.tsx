import { useState } from "react";
import { Button } from "@mui/material";
import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { createHsnApi, fetchHsnsApi, syncHsnMasterToStorage } from "../../api/hsnMasterApi";
import { useHsnGstOptions } from "../../hooks/useHsnGstOptions";
import { QuickAddGstModal } from "../../../gst-master/QuickAddGstModal";

export function AddHSNMasterPage() {
  const { definition, refetch: refetchGstOptions } = useHsnGstOptions();
  const [quickAddGstOpen, setQuickAddGstOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

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
    <>
      <MasterFormPage
        definition={definition}
        mode="add"
        onSave={handleSave}
        additionalValues={formValues}
        onFieldChange={(key, val) => {
          setFormValues((prev) => ({ ...prev, [key]: val }));
        }}
        fieldActions={{
          gstPercentage: (
            <Button
              size="small"
              onClick={() => setQuickAddGstOpen(true)}
              sx={(theme) => ({
                p: 0,
                minWidth: "auto",
                fontSize: "11px",
                lineHeight: 1.3,
                fontWeight: 600,
                textTransform: "none",
                color: theme.customTokens.brand.primary,
                "&:hover": {
                  backgroundColor: "transparent",
                  textDecoration: "underline",
                },
              })}
            >
              + Add GST
            </Button>
          ),
        }}
      />
      <QuickAddGstModal
        open={quickAddGstOpen}
        onClose={() => setQuickAddGstOpen(false)}
        onSuccess={(newGst: string) => {
          const formatted = newGst.endsWith("%") ? newGst : `${newGst}%`;
          setFormValues((prev) => ({
            ...prev,
            gstPercentage: formatted,
            gst: formatted,
          }));
          refetchGstOptions();
        }}
      />
    </>
  );
}
