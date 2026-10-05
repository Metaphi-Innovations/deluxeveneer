import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { EnterpriseDataTable } from "../../../../components/data-display/EnterpriseDataTable";
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

/** Frontend-only listing until sawing → production inventory API exists. */
const SAWING_ROWS: SawingRow[] = [];

export function SawingTab({
  searchValue,
  canView,
  onExportReady,
}: SawingTabProps) {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    if (!normalizedSearch) return SAWING_ROWS;
    return SAWING_ROWS.filter((row) =>
      Object.values(row).some((val) =>
        String(val ?? "")
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    );
  }, [searchValue]);

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
