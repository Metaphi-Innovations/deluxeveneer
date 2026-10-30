import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

function isDryingInspectionSlug(slug: string) {
  return slug === "drying-inspection" || slug === "inspection";
}


export function formatInspectionDateDDMMYY(value: unknown): string {
  if (!value) return "-";
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return "-";
    const dd = String(value.getDate()).padStart(2, "0");
    const mm = String(value.getMonth() + 1).padStart(2, "0");
    const yy = String(value.getFullYear()).slice(-2);
    return `${dd}-${mm}-${yy}`;
  }
  const str = String(value).trim();
  if (!str || str === "-" || str === "null" || str === "undefined") return "-";

  const ddmmyyMatch = str.match(/^(\d{2})-(\d{2})-(\d{2,4})$/);
  if (ddmmyyMatch && ddmmyyMatch[1] && ddmmyyMatch[2] && ddmmyyMatch[3]) {
    const dd = ddmmyyMatch[1];
    const mm = ddmmyyMatch[2];
    const y = ddmmyyMatch[3];
    return `${dd}-${mm}-${y.slice(-2)}`;
  }

  const isoMatch = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch && isoMatch[1] && isoMatch[2] && isoMatch[3]) {
    const yyyy = isoMatch[1];
    const mm = isoMatch[2];
    const dd = isoMatch[3];
    return `${dd}-${mm}-${yyyy.slice(-2)}`;
  }

  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return str;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}-${mm}-${yy}`;
}

function formatIssuedDate(value: unknown) {
  const date =
    value instanceof Date
      ? value
      : typeof value === "string" && value.trim()
        ? new Date(value)
        : null;

  if (!date || Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function inspectionImageColumn<Row extends FactoryRecord>(): EnterpriseTableColumn<Row> {
  return {
    key: "inspectionImage",
    label: "Inspection Image",
    filterable: false,
  };
}

function isStatusColumn<Row extends FactoryRecord>(column: EnterpriseTableColumn<Row>) {
  return column.label === "Status" || column.key === "status" || column.key === "qcStatus";
}

function withStickyStatus<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  statusColumn: EnterpriseTableColumn<Row>,
) {
  return [
    ...columns.filter((column) => !isStatusColumn(column) && column.key !== statusColumn.key),
    { ...statusColumn, stickyBeforeActions: true },
  ];
}

function insertColumnsAfter<Row extends FactoryRecord>(
  columns: readonly EnterpriseTableColumn<Row>[],
  afterKey: string,
  extras: readonly EnterpriseTableColumn<Row>[],
) {
  const insertIndex = columns.findIndex((column) => column.key === afterKey);
  if (insertIndex >= 0) {
    return [
      ...columns.slice(0, insertIndex + 1),
      ...extras,
      ...columns.slice(insertIndex + 1),
    ];
  }

  return [...columns, ...extras];
}

function withDryingInspectionSourceColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  includeWarehouse: boolean,
) {
  const columns = sourceColumns.map((column) =>
    column.key === "issueDate" ||
    column.key === "issuedDate" ||
    column.key === "processDate" ||
    column.key === "inspectionDate"
      ? {
          ...column,
          key: "inspectionDate",
          label: "Inspection Date",
          renderCell: (row: Row) =>
            formatIssuedDate(row.inspectionDate ?? row.processDate ?? row.issuedDate ?? row.issueDate),
        }
      : column,
  );

  if (!includeWarehouse || columns.some((column) => column.key === "warehouseName")) {
    return columns;
  }

  const issuedDateColumn = columns.find(
    (column) =>
      column.key === "issueDate" ||
      column.key === "issuedDate" ||
      column.key === "inspectionDate",
  );

  return insertColumnsAfter(columns, issuedDateColumn?.key ?? "", [
    {
      key: "warehouseName",
      label: "Warehouse Name",
      renderCell: (row) => {
        const value = row.warehouseName ?? row.storageWarehouseName;
        return value === null || value === undefined || value === ""
          ? "-"
          : String(value);
      },
    },
  ]);
}

export function applyInspectionListingColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  slug: string,
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  const inspectionSourceColumns =
    isDryingInspectionSlug(slug) && (activeTab === "done" || activeTab === "history")
      ? withDryingInspectionSourceColumns(sourceColumns, activeTab === "history")
      : sourceColumns;

  if (isDryingInspectionSlug(slug) && (activeTab === "done" || activeTab === "history")) {
    const columns = inspectionSourceColumns.filter(
      (column) => column.key !== "qcStatus",
    );

    const warehouseColumn: EnterpriseTableColumn<Row> = {
      key: "productionWarehouseName",
      label: "Warehouse",
      renderCell: (row: Row) => {
        const val =
          row.productionWarehouseName ??
          row.storageWarehouseName ??
          row.destinationWarehouse ??
          row.warehouseName ??
          (row.transferredToWarehouse || row.warehouseTransferStatus === "Transferred" || row.warehouseBStatus === "Transferred to Warehouse B"
            ? "Warehouse B"
            : "Warehouse B");
        return val ? String(val) : "-";
      },
    };

    const statusColumn: EnterpriseTableColumn<Row> =
      activeTab === "done"
        ? { key: "warehouseBStatus", label: "Status" }
        : { key: "inspectionEventStatus", label: "Status" };

    return insertColumnsAfter(columns, "noOfLeaves", [
      { key: "passQty", label: "Pass Qty (Leaves)" },
      { key: "failQty", label: "Failed Qty (Leaves)" },
      ...(activeTab === "done" ? [warehouseColumn] : []),
      statusColumn,
      inspectionImageColumn<Row>(),
    ]);
  }

  if (activeTab === "done" || activeTab === "failed") {
    let columns = sourceColumns.filter(
      (column) => column.key !== "qcStatus" && column.key !== "status",
    );

    if (slug === "sawing-inspection") {
      if (activeTab === "done") {
        columns = columns.map((column) => {
          if (column.key === "issuedDate" || column.key === "issueDate" || column.key === "inspectionDate") {
            return {
              ...column,
              key: "inspectionDate",
              label: "Inspection Date",
              renderCell: (row: Row) =>
                formatIssuedDate(row.inspectionDate ?? row.processDate ?? row.issuedDate ?? row.issueDate),
            };
          }
          return column;
        });

        const productionWarehouseCol: EnterpriseTableColumn<Row> = {
          key: "productionWarehouseName",
          label: "Production Warehouse",
          renderCell: (row: Row) => {
            const val =
              row.productionWarehouseName ??
              row.destinationWarehouse ??
              (row.transferredToWarehouse || row.warehouseTransferStatus === "Transferred"
                ? row.warehouseName || "Warehouse C"
                : row.warehouseName || "Warehouse C");
            return val ? String(val) : "-";
          },
        };

        const withWarehouse = insertColumnsAfter(columns, "cbf", [productionWarehouseCol]);

        return [
          ...withWarehouse.filter((column) => column.key !== "inspectionImage"),
          inspectionImageColumn<Row>(),
        ];
      }

      return [
        ...columns.filter((column) => column.key !== "inspectionImage"),
        inspectionImageColumn<Row>(),
      ];
    }

    return columns;
  }

  if (isDryingInspectionSlug(slug) && activeTab === "issued") {
    return withStickyStatus(inspectionSourceColumns, {
      key: "status",
      label: "Status",
    });
  }

  if (slug === "sawing-inspection") {
    return withStickyStatus(sourceColumns, { key: "qcStatus", label: "Status" });
  }

  return sourceColumns;
}
