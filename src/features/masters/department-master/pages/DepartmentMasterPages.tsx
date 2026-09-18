import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { departmentMasterDefinition } from "../mock/departmentMasterData";
import {
  createDepartmentApi,
  fetchDepartmentsApi,
  syncDepartmentMasterToStorage,
  updateDepartmentApi,
  updateDepartmentStatusApi,
} from "../departmentMasterApi";

export function DepartmentMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchDepartmentsApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncDepartmentMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return departmentMasterDefinition;
    }
    return {
      ...departmentMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateDepartmentStatusApi(row.id, checked);
      const allRecords = await fetchDepartmentsApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncDepartmentMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle department status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddDepartmentMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createDepartmentApi({
        departmentName: String(context.values.departmentName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchDepartmentsApi();
        if (allRecords.length > 0) {
          syncDepartmentMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create department via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={departmentMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditDepartmentMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateDepartmentApi(context.row.id, {
          departmentName: String(context.values.departmentName || context.values.name || ""),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchDepartmentsApi();
          if (allRecords.length > 0) {
            syncDepartmentMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update department via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={departmentMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewDepartmentMasterPage() {
  return <MasterFormPage definition={departmentMasterDefinition} mode="view" />;
}
