import { useMemo, useState } from "react";
import { Button } from "@mui/material";

import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  createItemCategoryApi,
  fetchItemCategoriesApi,
  syncItemCategoryMasterToStorage,
} from "../../api/itemCategoryMasterApi";
import { itemCategoryMasterDefinition } from "../../itemCategoryMasterDefinition";
import {
  buildCategoryDefinitionWithHsn,
  useHsnOptions,
} from "../ItemCategoryMasterPagesForm";
import { QuickAddHsnModal } from "../../../hsn-master/QuickAddHsnModal";

export function AddItemCategoryMasterPage() {
  const { hsnOptions, hsnRows, refetch: refetchHsn } = useHsnOptions();
  const [quickAddHsnOpen, setQuickAddHsnOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  const definitionWithDynamicOptions = useMemo<MasterDefinition>(
    () => buildCategoryDefinitionWithHsn(itemCategoryMasterDefinition, hsnOptions, hsnRows),
    [hsnOptions, hsnRows],
  );

  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createItemCategoryApi({
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode || "",
        gst: context.values.gst || context.values.gstNo || "",
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (!created) {
        throw new Error("Unable to save item category.");
      }
      const allRecords = await fetchItemCategoriesApi();
      if (allRecords.length > 0) {
        syncItemCategoryMasterToStorage(allRecords);
      }
      void invalidateMaster("itemCategory");
    } catch (error) {
      throw error;
    }
  };

  return (
    <>
      <MasterFormPage
        additionalValues={formValues}
        definition={definitionWithDynamicOptions}
        mode="add"
        onFieldChange={(key, val) => {
          setFormValues((prev) => ({ ...prev, [key]: val }));
        }}
        onSave={handleSave}
        fieldActions={{
          hsn: (
            <Button
              size="small"
              onClick={() => setQuickAddHsnOpen(true)}
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
              + Add HSN
            </Button>
          ),
        }}
      />
      <QuickAddHsnModal
        open={quickAddHsnOpen}
        onClose={() => setQuickAddHsnOpen(false)}
        onSuccess={(newHsnCode, record) => {
          const gstVal = record?.gstPercentage || record?.gst || "";
          setFormValues((prev) => ({
            ...prev,
            hsn: newHsnCode,
            hsnCode: newHsnCode,
            ...(gstVal ? { gst: gstVal, gstPercentage: gstVal } : {}),
          }));
          refetchHsn();
        }}
      />
    </>
  );
}
