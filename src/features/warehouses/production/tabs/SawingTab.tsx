import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { EnterpriseDataTable } from "../../../../components/data-display/EnterpriseDataTable";
import { useWarehouseCMovedRows } from "../../shared/warehouseCTransferStore";
import {
  sawingColumns,
  type SawingRow,
} from "../types/productionWarehouseTypes";

export interface SawingTabProps {
  warehouseName: string;
  warehouseId?: string | undefined;
  searchValue: string;
  canView: boolean;
  canEdit: boolean;
  onExportReady?:
    | Dispatch<SetStateAction<SawingRow[]>>
    | ((rows: SawingRow[]) => void)
    | undefined;
}

export function SawingTab({
  searchValue,
  warehouseName,
  canView,
  onExportReady,
}: SawingTabProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const movedRows = useWarehouseCMovedRows();
  const sawingRows = useMemo(() => {
    const currentWarehouse = warehouseName.trim().toLowerCase();

    return movedRows
      .filter((row) => readMovedText(row, ["inventorySlug"]) === "sawing")
      .filter((row) => {
        const storedWarehouse = readMovedText(row, ["warehouseName", "destinationWarehouse"]).toLowerCase();
        if (!storedWarehouse || storedWarehouse === "warehouse c") {
          return true;
        }

        return storedWarehouse === currentWarehouse;
      })
      .map(toSawingRow);
  }, [movedRows, warehouseName]);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return sawingRows;
    return sawingRows.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    );
  }, [sawingRows, searchValue]);

  useEffect(() => {
    setPage(1);
  }, [searchValue]);

  useEffect(() => {
    onExportReady?.(filteredRows);
  }, [filteredRows, onExportReady]);

  const pagedRows = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filteredRows.slice(start, start + rowsPerPage);
  }, [filteredRows, page, rowsPerPage]);

  return (
    <EnterpriseDataTable
      key="production-sawing"
      actions={[]}
      columns={sawingColumns}
      emptyStateLabel="No sawing inventory records are available."
      pagination={{
        page,
        rowsPerPage,
        totalCount: filteredRows.length,
        onPageChange: setPage,
        onRowsPerPageChange: (newPerPage: number) => {
          setRowsPerPage(newPerPage);
          setPage(1);
        },
      }}
      rows={canView ? pagedRows : []}
    />
  );
}

function toSawingRow(row: object): SawingRow {
  return {
    id: readMovedText(row, ["id"]),
    storageSrNo: readMovedText(row, ["storageSrNo"]),
    issuedDate: readMovedDate(row, ["issuedDate", "issueDate"]),
    sawingDate: readMovedDate(row, ["sawingDate", "processDate"]),
    itemName: readMovedText(row, ["itemName"]),
    subCategory: readMovedText(row, ["subCategory", "itemSubCategory"]),
    batchNo: readMovedText(row, ["batchNo", "logNo", "logCode"]),
    batchNoCode: readMovedText(row, ["batchNoCode"]),
    length: readMovedText(row, ["length"]),
    width: readMovedText(row, ["width"]),
    thickness: readMovedText(row, ["thickness", "height"]),
    cbm: readMovedText(row, ["cbm", "receivedCbm"]),
    cbf: readMovedText(row, ["cbf"]),
    remark: readMovedText(row, ["remark"]),
    createdBy: readMovedText(row, ["createdBy"]),
    updatedBy: readMovedText(row, ["updatedBy"]),
    inventorySlug: "sawing",
    inventoryRecordId: readMovedText(row, ["inventoryRecordId"]),
  };
}

function readMovedDate(row: object, keys: readonly string[]) {
  const record = row as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
      return value.trim();
    }
  }
  return "";
}

function readMovedText(row: object, keys: readonly string[]) {
  const record = row as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }
  return "";
}
