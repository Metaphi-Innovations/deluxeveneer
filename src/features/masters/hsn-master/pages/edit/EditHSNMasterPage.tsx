import { useState } from "react";
import { Button } from "@mui/material";
import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import { fetchHsnsApi, syncHsnMasterToStorage, updateHsnApi } from "../../api/hsnMasterApi";
import { useHsnGstOptions } from "../../hooks/useHsnGstOptions";
import { QuickAddGstModal } from "../../../gst-master/QuickAddGstModal";

export function EditHSNMasterPage() {
  const { definition, refetch: refetchGstOptions } = useHsnGstOptions();
  const [quickAddGstOpen, setQuickAddGstOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

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
      throw error;
    }
  };

  return (
    <>
      <MasterFormPage
        definition={definition}
        mode="edit"
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
