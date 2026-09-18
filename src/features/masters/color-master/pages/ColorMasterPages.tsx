import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { colorMasterDefinition } from "../mock/colorMasterData";
import {
  createColorApi,
  fetchColorsApi,
  syncColorMasterToStorage,
  updateColorApi,
  updateColorStatusApi,
} from "../colorMasterApi";

export function ColorMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchColorsApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncColorMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return colorMasterDefinition;
    }
    return {
      ...colorMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateColorStatusApi(row.id, checked);
      const allRecords = await fetchColorsApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncColorMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle color status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddColorMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createColorApi({
        colorName: String(context.values.colorName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchColorsApi();
        if (allRecords.length > 0) {
          syncColorMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create color via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={colorMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditColorMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateColorApi(context.row.id, {
          colorName: String(context.values.colorName || context.values.name || ""),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchColorsApi();
          if (allRecords.length > 0) {
            syncColorMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update color via API, fallback will persist locally:", error);
      }
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

export function ViewColorMasterPage() {
  return <MasterFormPage definition={colorMasterDefinition} mode="view" />;
}
