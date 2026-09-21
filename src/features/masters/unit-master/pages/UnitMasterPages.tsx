import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { unitMasterDefinition } from "../mock/unitMasterData";
import {
  createUnitApi,
  fetchUnitsApi,
  syncUnitMasterToStorage,
  updateUnitApi,
  updateUnitStatusApi,
} from "../unitMasterApi";

export function UnitMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchUnitsApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncUnitMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return unitMasterDefinition;
    }
    return {
      ...unitMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateUnitStatusApi(row.id, checked);
      const allRecords = await fetchUnitsApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncUnitMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle unit status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddUnitMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createUnitApi({
        unitName: String(context.values.unitName || context.values.name || ""),
        symbolicName: context.values.symbolicName ? String(context.values.symbolicName) : null,
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchUnitsApi();
        if (allRecords.length > 0) {
          syncUnitMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create unit via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={unitMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditUnitMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateUnitApi(context.row.id, {
          unitName: String(context.values.unitName || context.values.name || ""),
          symbolicName: context.values.symbolicName !== undefined ? (context.values.symbolicName ? String(context.values.symbolicName) : null) : undefined,
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchUnitsApi();
          if (allRecords.length > 0) {
            syncUnitMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update unit via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={unitMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewUnitMasterPage() {
  return <MasterFormPage definition={unitMasterDefinition} mode="view" />;
}
