import { createElement } from "react";
import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryProcessTab } from "../shared/factoryUtils";
import type { FactoryRecord } from "../shared/types";

function isDryingInspectionSlug(slug: string) {
  return slug === "drying-inspection" || slug === "inspection";
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

export function applyInspectionListingColumns<Row extends FactoryRecord>(
  sourceColumns: readonly EnterpriseTableColumn<Row>[],
  slug: string,
  activeTab: FactoryProcessTab,
): readonly EnterpriseTableColumn<Row>[] {
  if (isDryingInspectionSlug(slug) && (activeTab === "done" || activeTab === "history")) {
    let columns = sourceColumns.filter((column) => column.key !== "qcStatus");

    if (activeTab === "history") {
      columns = columns.map((column) =>
        column.key === "issueDate" || column.key === "issuedDate"
          ? { ...column, label: "Inspection Date" }
          : column,
      );
    }

    const statusColumn: EnterpriseTableColumn<Row> =
      activeTab === "done"
        ? { key: "warehouseBStatus", label: "Status" }
        : { key: "inspectionEventStatus", label: "Status" };

    return insertColumnsAfter(columns, "noOfLeaves", [
      { key: "passQty", label: "Pass Qty (Leaves)" },
      { key: "failQty", label: "Failed Qty (Leaves)" },
      statusColumn,
    ]);
  }

  if (activeTab === "done" || activeTab === "failed") {
    const columns = sourceColumns.filter(
      (column) => column.key !== "qcStatus" && column.key !== "status",
    );

    if (slug === "sawing-inspection" && activeTab === "done") {
      return insertColumnsAfter(columns, "cbf", [
        {
          key: "inspectionImage",
          label: "Inspection Image",
          filterable: false,
          renderCell: (row) => {
            const imageUrl =
              typeof row.inspectionImage === "string"
                ? row.inspectionImage.trim()
                : "";
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
        },
      ]);
    }

    return columns;
  }

  if (isDryingInspectionSlug(slug) && activeTab === "issued") {
    const columns = sourceColumns.map((col) =>
      col.key === "issueDate" || col.key === "issuedDate"
        ? { ...col, label: "Issued Inspection Date" }
        : col,
    );
    const insertIndex = columns.findIndex((col) => col.key === "noOfLeaves");
    const statusColumn: EnterpriseTableColumn<Row> = { key: "status", label: "Status" };
    if (insertIndex >= 0) {
      return [
        ...columns.slice(0, insertIndex + 1),
        statusColumn,
        ...columns.slice(insertIndex + 1),
      ];
    }
    return [...columns, statusColumn];
  }

  return sourceColumns;
}
