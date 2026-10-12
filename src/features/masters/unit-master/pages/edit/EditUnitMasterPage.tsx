import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { invalidateMaster } from "../../../../../query/queryClient";
import { MasterFormPage } from "../../../shared";
import type { MasterDefinition, MasterRecord } from "../../../shared/types";
import {
  fetchUnitsApi,
  getUnitByIdApi,
  syncUnitMasterToStorage,
  updateUnitApi,
} from "../../api/unitMasterApi";
import { unitMasterDefinition } from "../../unitMasterDefinition";

export function EditUnitMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const item = await getUnitByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load unit.");
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

    const updated = await updateUnitApi(id, {
      unitName: String(context.values.unitName || context.values.name || ""),
      symbolicName:
        context.values.symbolicName !== undefined
          ? context.values.symbolicName
            ? String(context.values.symbolicName)
            : null
          : undefined,
      remark: context.values.remark || context.values.remarks || null,
      status: context.values.status,
    });
    if (updated) {
      const allRecords = await fetchUnitsApi();
      if (allRecords.length > 0) {
        syncUnitMasterToStorage(allRecords);
      }
    }
    void invalidateMaster("unit");
  };

  return (
    <MasterFormPage
      definition={unitMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode="edit"
      {...(record ? { record } : {})}
      onSave={handleSave}
    />
  );
}
