import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { hsnMasterDefinition } from "../mock/hsnMasterData";
import {
  createHsnApi,
  fetchHsnsApi,
  syncHsnMasterToStorage,
  updateHsnApi,
  updateHsnStatusApi,
} from "../hsnMasterApi";

export function HSNMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchHsnsApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncHsnMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return hsnMasterDefinition;
    }
    return {
      ...hsnMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateHsnStatusApi(row.id, checked);
      const allRecords = await fetchHsnsApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncHsnMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle HSN status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddHSNMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createHsnApi({
        hsnCode: String(context.values.hsnCode || context.values.code || ""),
        hsnCodeDescription: String(context.values.hsnCodeDescription || context.values.description || ""),
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
    } catch (error) {
      console.warn("Failed to create HSN record via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={hsnMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditHSNMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateHsnApi(context.row.id, {
          hsnCode: String(context.values.hsnCode || context.values.code || ""),
          hsnCodeDescription: String(context.values.hsnCodeDescription || context.values.description || ""),
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
      } catch (error) {
        console.warn("Failed to update HSN record via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={hsnMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewHSNMasterPage() {
  return <MasterFormPage definition={hsnMasterDefinition} mode="view" />;
}
