import { Eye, Pencil, Plus, RotateCcw } from "lucide-react";

import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import type { FactoryRecord } from "../shared/types";

export function buildInspectionIssuedRowActions<Row extends FactoryRecord>({
  canCreate,
  canEdit,
  canView,
  onInspect,
  onView,
}: {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  onInspect: (row: Row) => void;
  onView: (row: Row) => void;
}): (row: Row) => readonly EnterpriseTableAction<Row>[] {
  return () => [
    ...(canView
      ? [
          {
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: onView,
          },
        ]
      : []),
    ...(canCreate || canEdit
      ? [
          {
            id: "inspect",
            label: "Inspect",
            icon: Plus,
            tone: "primary" as const,
            onSelect: onInspect,
          },
        ]
      : []),
  ];
}

export function buildInspectionDoneRowActions<Row extends FactoryRecord>({
  canCreate,
  canEdit,
  canView,
  isSawingInspection,
  onEdit,
  onMoveToWarehouseB,
  onMoveToWarehouseC,
  onRevert,
  onView,
}: {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  isSawingInspection: boolean;
  onEdit?: (row: Row) => void;
  onMoveToWarehouseB: (row: Row) => void;
  onMoveToWarehouseC: (row: Row) => void;
  onRevert: (row: Row) => void;
  onView: (row: Row) => void;
}): (row: Row) => readonly EnterpriseTableAction<Row>[] {
  return () => [
    ...(canView
      ? [
          {
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: onView,
          },
        ]
      : []),
    ...(onEdit && (canEdit || canCreate)
      ? [
          {
            id: "edit",
            label: "Edit",
            icon: Pencil,
            onSelect: onEdit,
          },
        ]
      : []),
    ...((canEdit || canCreate)
      ? [
          {
            id: "revert",
            label: "Revert",
            icon: RotateCcw,
            tone: "danger" as const,
            onSelect: onRevert,
          },
        ]
      : []),
    ...(canCreate
      ? [
          {
            id: isSawingInspection ? "move-to-warehouse-c" : "move-to-warehouse-b",
            label: isSawingInspection ? "Move to Warehouse C" : "Move to Warehouse B",
            icon: Plus,
            tone: "primary" as const,
            onSelect: isSawingInspection ? onMoveToWarehouseC : onMoveToWarehouseB,
          },
        ]
      : []),
  ];
}

export function buildInspectionFailedRowActions<Row extends FactoryRecord>({
  canCreate,
  canEdit,
  canView,
  isSawingInspection,
  onRevert,
  onView,
}: {
  canCreate: boolean;
  canEdit: boolean;
  canView: boolean;
  isSawingInspection: boolean;
  onRevert: (row: Row) => void;
  onView: (row: Row) => void;
}): (row: Row) => readonly EnterpriseTableAction<Row>[] {
  return () => [
    ...(canView
      ? [
          {
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: onView,
          },
        ]
      : []),
    ...(isSawingInspection && (canCreate || canEdit)
      ? [
          {
            id: "revert",
            label: "Revert",
            icon: RotateCcw,
            tone: "danger" as const,
            onSelect: onRevert,
          },
        ]
      : []),
  ];
}
