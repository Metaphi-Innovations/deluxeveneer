import { useEffect, useMemo, useState } from "react";
import { Button } from "@mui/material";
import { useParams } from "react-router";

import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchItemCategoriesApi,
  getItemCategoryByIdApi,
  syncItemCategoryMasterToStorage,
  updateItemCategoryApi,
} from "../../api/itemCategoryMasterApi";
import { itemCategoryMasterDefinition } from "../../itemCategoryMasterDefinition";
import {
  buildCategoryDefinitionWithHsn,
  useHsnOptions,
} from "../ItemCategoryMasterPagesForm";
import { QuickAddHsnModal } from "../../../hsn-master/QuickAddHsnModal";

export function EditItemCategoryMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const { hsnOptions, hsnRows, refetch: refetchHsn } = useHsnOptions();
  const [quickAddHsnOpen, setQuickAddHsnOpen] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});

  useEffect(() => {
    let ignore = false;

    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const item = await getItemCategoryByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load category.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadRecord();
    return () => {
      ignore = true;
    };
  }, [params.id]);

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
    const id = context.row?.id || params.id;
    if (!id) {
      return;
    }

    try {
      const updated = await updateItemCategoryApi(id, {
        categoryName: String(context.values.categoryName || context.values.name || ""),
        hsn: context.values.hsn || context.values.hsnCode,
        gst: context.values.gst || context.values.gstNo,
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status,
      });
      if (!updated) {
        throw new Error("Unable to save item category.");
      }
      const allRecords = await fetchItemCategoriesApi();
      if (allRecords.length > 0) {
        syncItemCategoryMasterToStorage(allRecords);
      }
    } catch (error) {
      throw error;
    }
    void invalidateMaster("itemCategory");
  };

  return (
    <>
      <MasterFormPage
        additionalValues={formValues}
        definition={definitionWithDynamicOptions}
        errorMessage={errorMessage}
        loading={isLoading}
        mode="edit"
        {...(record ? { record } : {})}
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
        onSuccess={(newHsnCode, rec) => {
          const gstVal = rec?.gstPercentage || rec?.gst || "";
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
