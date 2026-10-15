import { createElement } from "react";
import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

function isDryingInspectionSlug(slug: string) {
  return slug === "drying-inspection" || slug === "inspection";
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
    renderCell: (row) => {
      const imageUrl =
        typeof row.inspectionImage === "string" ? row.inspectionImage.trim() : "";
      if (!imageUrl) return "-";

      return createElement(
        "a",
        {
          href: imageUrl,
          rel: "noreferrer",
          target: "_blank",
          title: "Open inspection image",
          style: { display: "inline-flex", verticalAlign: "middle" },
        },
        createElement("img", {
          alt:
            typeof row.inspectionImageName === "string"
              ? row.inspectionImageName
              : "Inspection",
          src: imageUrl,
          style: {
            border: "1px solid rgba(0, 0, 0, 0.12)",
            borderRadius: 6,
            height: 40,
            objectFit: "cover",
            width: 56,
          },
        }),
      );
    },
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
) {
  const columns = sourceColumns.map((column) =>
    column.key === "issueDate" || column.key === "issuedDate"
      ? {
          ...column,
          label: "Issued Date",
          renderCell: (row: Row) =>
            formatIssuedDate(row.issuedDate ?? row.issueDate),
        }
      : column,
  );

  if (columns.some((column) => column.key === "warehouseName")) {
    return columns;
  }

  const issuedDateColumn = columns.find(
    (column) => column.key === "issueDate" || column.key === "issuedDate",
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
  const inspectionSourceColumns = isDryingInspectionSlug(slug)
    ? withDryingInspectionSourceColumns(sourceColumns)
    : sourceColumns;

  if (isDryingInspectionSlug(slug) && (activeTab === "done" || activeTab === "history")) {
    const columns = inspectionSourceColumns.filter(
      (column) => column.key !== "qcStatus",
    );

    const statusColumn: EnterpriseTableColumn<Row> =
      activeTab === "done"
        ? { key: "warehouseBStatus", label: "Status" }
        : { key: "inspectionEventStatus", label: "Status" };

    return insertColumnsAfter(columns, "noOfLeaves", [
      { key: "passQty", label: "Pass Qty (Leaves)" },
      { key: "failQty", label: "Failed Qty (Leaves)" },
      statusColumn,
      inspectionImageColumn<Row>(),
    ]);
  }

  if (activeTab === "done" || activeTab === "failed") {
    const columns = sourceColumns.filter(
      (column) => column.key !== "qcStatus" && column.key !== "status",
    );

    if (slug === "sawing-inspection" && activeTab === "done") {
      return insertColumnsAfter(columns, "cbf", [inspectionImageColumn<Row>()]);
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
