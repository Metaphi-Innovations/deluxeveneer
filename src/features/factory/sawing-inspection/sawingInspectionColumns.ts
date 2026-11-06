import React from "react";
import { Box } from "@mui/material";
import { formatInspectionDateDDMMYY } from "../inspection/inspectionListingColumns";
import type { EnterpriseTableColumn } from "../../../components/data-display/EnterpriseDataTable";

export const GRADE_COLOR_PALETTES = [
  { bg: "#E8F5E9", color: "#1B5E20", border: "#A5D6A7" }, // Green
  { bg: "#E3F2FD", color: "#0D47A1", border: "#90CAF9" }, // Blue
  { bg: "#FFF8E1", color: "#B78103", border: "#FFE082" }, // Amber
  { bg: "#F3E5F5", color: "#6A1B9A", border: "#CE93D8" }, // Purple
  { bg: "#FCE4EC", color: "#880E4F", border: "#F48FB1" }, // Pink / Rose
  { bg: "#E0F2F1", color: "#004D40", border: "#80CBC4" }, // Teal
  { bg: "#FFF3E0", color: "#BF360C", border: "#FFCC80" }, // Orange
  { bg: "#EDE7F6", color: "#311B92", border: "#B39DDB" }, // Deep Violet
  { bg: "#E0F7FA", color: "#006064", border: "#80DEEA" }, // Cyan
  { bg: "#FBE9E7", color: "#D84315", border: "#FFAB91" }, // Terracotta
];

export function getGradeBadgeStyle(grade?: string | null) {
  if (!grade) return null;
  const str = String(grade).trim().toLowerCase();
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % GRADE_COLOR_PALETTES.length;
  return GRADE_COLOR_PALETTES[index];
}

export function renderGradeBadge(grade?: string | null) {
  const val = grade ? String(grade).trim() : "";
  if (!val || val === "-" || val === "—") {
    return React.createElement("span", { style: { color: "#94a3b8" } }, "—");
  }
  const palette = getGradeBadgeStyle(val);
  return React.createElement(
    "span",
    {
      style: {
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        fontWeight: 600,
        backgroundColor: palette?.bg ?? "#f1f5f9",
        color: palette?.color ?? "#1e293b",
        border: `1px solid ${palette?.border ?? "#cbd5e1"}`,
        lineHeight: "18px",
        whiteSpace: "nowrap",
      },
    },
    val
  );
}

export const SAWING_INSPECTION_PENDING_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issuedDate", label: "Issued Date", renderCell: (row) => formatInspectionDateDDMMYY(row.issuedDate ?? row.issueDate) },
  { key: "sawingDate", label: "Sawing Date", renderCell: (row) => formatInspectionDateDDMMYY(row.sawingDate ?? row.processDate) },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  {
    key: "batchNo",
    label: "Batch No.",
    renderCell: (row) => row.batchNoCode || row.batchNo || "-",
  },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created" },
  { key: "updatedBy", label: "Updated" },
] as const;

export const SAWING_INSPECTION_DONE_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "inspectionDate", label: "Inspection Date", renderCell: (row) => formatInspectionDateDDMMYY(row.inspectionDate ?? row.processDate ?? row.issuedDate) },
  { key: "sawingDate", label: "Sawing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  {
    key: "grade",
    label: "Grade",
    renderCell: (row) => renderGradeBadge(row.grade ?? row.gradeName),
  },
  {
    key: "batchNo",
    label: "Batch No.",
    renderCell: (row) => row.batchNoCode || row.batchNo || "-",
  },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "productionWarehouseName", label: "Production Warehouse" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created" },
  { key: "updatedBy", label: "Updated" },
] as const;

export const SAWING_INSPECTION_FAIL_COLUMNS: readonly EnterpriseTableColumn<any>[] = [
  { key: "storageSrNo", label: "Storage Sr No." },
  { key: "issuedDate", label: "Issued Date" },
  { key: "sawingDate", label: "Sawing Date" },
  { key: "itemName", label: "Item Name" },
  { key: "subCategory", label: "Sub Category" },
  {
    key: "batchNo",
    label: "Batch No.",
    renderCell: (row) => row.batchNoCode || row.batchNo || "-",
  },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "cbm", label: "CBM" },
  { key: "cbf", label: "CBF" },
  { key: "remark", label: "Remark" },
  { key: "createdBy", label: "Created" },
  { key: "updatedBy", label: "Updated" },
] as const;

export const SAWING_INSPECTION_TABS = [
  { label: "Inspection Pending", value: "issued" },
  { label: "Inspection Done", value: "done" },
] as const;

export type SawingInspectionTab = (typeof SAWING_INSPECTION_TABS)[number]["value"];
