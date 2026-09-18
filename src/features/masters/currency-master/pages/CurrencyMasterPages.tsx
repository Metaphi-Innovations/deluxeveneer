import { useEffect, useMemo, useState } from "react";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { currencyMasterDefinition } from "../mock/currencyMasterData";
import {
  createCurrencyApi,
  fetchCurrenciesApi,
  syncCurrencyMasterToStorage,
  updateCurrencyApi,
  updateCurrencyStatusApi,
} from "../currencyMasterApi";

export function CurrencyMasterListPage() {
  const [apiRows, setApiRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    let isMounted = true;
    fetchCurrenciesApi().then((records) => {
      if (isMounted && records.length > 0) {
        setApiRows(records);
        syncCurrencyMasterToStorage(records);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const definitionWithApiRows = useMemo<MasterDefinition>(() => {
    if (apiRows.length === 0) {
      return currencyMasterDefinition;
    }
    return {
      ...currencyMasterDefinition,
      rows: apiRows,
    };
  }, [apiRows]);

  const handleStatusToggle = async (row: MasterRecord, checked: boolean) => {
    try {
      await updateCurrencyStatusApi(row.id, checked);
      const allRecords = await fetchCurrenciesApi();
      if (allRecords.length > 0) {
        setApiRows(allRecords);
        syncCurrencyMasterToStorage(allRecords);
      }
    } catch (error) {
      console.warn("Failed to toggle currency status via backend API:", error);
    }
  };

  return (
    <MasterListingPage
      definition={definitionWithApiRows}
      onStatusChange={handleStatusToggle}
    />
  );
}

export function AddCurrencyMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    try {
      const created = await createCurrencyApi({
        currencyName: String(context.values.currencyName || context.values.name || ""),
        remark: context.values.remark || context.values.remarks || null,
        status: context.values.status ?? true,
      });
      if (created) {
        const allRecords = await fetchCurrenciesApi();
        if (allRecords.length > 0) {
          syncCurrencyMasterToStorage(allRecords);
        }
      }
    } catch (error) {
      console.warn("Failed to create currency via API, fallback will persist locally:", error);
    }
  };

  return (
    <MasterFormPage
      definition={currencyMasterDefinition}
      mode="add"
      onSave={handleSave}
    />
  );
}

export function EditCurrencyMasterPage() {
  const handleSave = async (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, any>;
  }) => {
    if (context.row?.id) {
      try {
        const updated = await updateCurrencyApi(context.row.id, {
          currencyName: String(context.values.currencyName || context.values.name || ""),
          remark: context.values.remark || context.values.remarks || null,
          status: context.values.status,
        });
        if (updated) {
          const allRecords = await fetchCurrenciesApi();
          if (allRecords.length > 0) {
            syncCurrencyMasterToStorage(allRecords);
          }
        }
      } catch (error) {
        console.warn("Failed to update currency via API, fallback will persist locally:", error);
      }
    }
  };

  return (
    <MasterFormPage
      definition={currencyMasterDefinition}
      mode="edit"
      onSave={handleSave}
    />
  );
}

export function ViewCurrencyMasterPage() {
  return <MasterFormPage definition={currencyMasterDefinition} mode="view" />;
}
