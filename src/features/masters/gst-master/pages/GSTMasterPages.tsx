import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { gstMasterDefinition } from "../mock/gstMasterData";
import {
  createGstApi,
  fetchGstsApi,
  syncGstMasterToStorage,
  updateGstApi,
  updateGstStatusApi,
} from "../gstMasterApi";

export function GSTMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchGstsApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncGstMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return gstMasterDefinition;
    }
    return {
      ...gstMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateGstStatusApi(row.id, checked);
      const allRecords = await fetchGstsApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncGstMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle GST status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

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

export function EditGSTMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const rawGst = context.values.gstPercentage || context.values.percentage || "";
        const updated = await updateGstApi(context.row.id, {
          gstPercentage: String(rawGst),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchGstsApi();
          if (allRecords.length > 0) {
            syncGstMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update GST record via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={gstMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewGSTMasterPage() {
  return <MasterFormPage definition={gstMasterDefinition} mode="view" />;
}
