import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { gradeMasterDefinition } from "../mock/gradeMasterData";
import {
  createGradeApi,
  fetchGradesApi,
  syncGradeMasterToStorage,
  updateGradeApi,
  updateGradeStatusApi,
} from "../gradeMasterApi";

export function GradeMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchGradesApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncGradeMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return gradeMasterDefinition;
    }
    return {
      ...gradeMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateGradeStatusApi(row.id, checked);
      const allRecords = await fetchGradesApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncGradeMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle grade status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddGradeMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createGradeApi({
        gradeName: String(context.values.gradeName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchGradesApi();
        if (allRecords.length > 0) {
          syncGradeMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create grade via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={gradeMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditGradeMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateGradeApi(context.row.id, {
          gradeName: String(context.values.gradeName || context.values.name || ""),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchGradesApi();
          if (allRecords.length > 0) {
            syncGradeMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update grade via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={gradeMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewGradeMasterPage() {
  return <MasterFormPage definition={gradeMasterDefinition} mode="view" />;
}
