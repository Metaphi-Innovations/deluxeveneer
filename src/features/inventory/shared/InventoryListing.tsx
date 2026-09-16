import { useMemo, useState } from "react";
import { Eye, Pencil } from "lucide-react";
import { Stack } from "@mui/material";
import { useNavigate } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableCellValue,
} from "../../../components/data-display/EnterpriseDataTable";
import {
  canAccessPermission,
  getWarehousePermissionKey,
} from "../../permissions";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import { InventoryPageShell } from "./InventoryPageShell";
import { InventoryToolbar } from "./InventoryToolbar";
import {
  getInventoryPaths,
  getInventoryProcessTab,
  getInventoryProcessTabs,
  getInventoryRowsForTab,
  getWarehouseBInventoryPath,
  getWarehouseBRootPath,
  type InventoryProcessTab,
} from "./inventoryUtils";
import type { InventoryDefinition, InventoryRecord } from "./types";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";

interface InventoryListingProps<Row extends InventoryRecord> {
  definition: InventoryDefinition<Row>;
}

export function InventoryListing<Row extends InventoryRecord>({
  definition,
}: InventoryListingProps<Row>) {
  const navigate = useNavigate();
  const permissionKey = getWarehousePermissionKey("warehouse-b");
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const [activeTab, setActiveTab] = useState<InventoryProcessTab>(
    getInventoryProcessTab(null),
  );
  const paths = getInventoryPaths(definition.slug, activeTab);
  const [searchValue, setSearchValue] = useState("");
  const tabs = useMemo(
    () => getInventoryProcessTabs(definition.title),
    [definition.title],
  );
  const tabRows = useMemo(
    () => getInventoryRowsForTab(definition.rows, activeTab),
    [activeTab, definition.rows],
  );
  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return tabRows;
    }

    return tabRows.filter((row) =>
      Object.values(row).some((value) =>
        formatInventorySearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [searchValue, tabRows]);

  const rowActions = useMemo<ReadonlyArray<EnterpriseTableAction<Row>>>(() => {
    const actions: EnterpriseTableAction<Row>[] = [];

    if (canView) {
      actions.push({
        id: "view",
        label: "View",
        icon: Eye,
        onSelect: (row: Row) => navigate(paths.view(row.id)),
      });
    }

    if (canEdit) {
      actions.push({
        id: "edit",
        label: "Edit",
        icon: Pencil,
        onSelect: (row: Row) => navigate(paths.edit(row.id)),
      });
    }

    return actions;
  }, [canEdit, canView, navigate, paths]);

  const handleExport = () => {
    exportRowsToCsv(
      filteredRows,
      definition.listColumns,
      `${definition.slug}-${activeTab}`,
    );
  };

  return (
    <InventoryPageShell
      actions={
        <InventoryToolbar
          addLabel="Add Stock"
          addPath={paths.add}
          canAdd={canCreate}
          onExport={filteredRows.length > 0 ? handleExport : undefined}
        />
      }
      breadcrumbs={[
        { label: "Warehouse B", to: getWarehouseBRootPath() },
        { label: activeTab === "history" ? "History" : "Inventory" },
        {
          label: definition.title,
          to: getWarehouseBInventoryPath(definition.slug),
        },
      ]}
      processTabs={
        <ModuleProcessTabs
          onChange={setActiveTab}
          tabs={tabs}
          value={activeTab}
        />
      }
      title={definition.title}
    >
      <Stack
        sx={(currentTheme) => ({
          gap: currentTheme.spacing(2),
        })}
      >
        <ClearableSearchField
          value={searchValue}
          onChange={setSearchValue}
          sx={{
            width: { xs: "100%", md: 320 },
            maxWidth: "100%",
          }}
        />

        <EnterpriseDataTable
          key={`${definition.slug}-${activeTab}`}
          actions={rowActions}
          columns={definition.listColumns}
          defaultRowsPerPage={10}
          emptyStateLabel={`No ${definition.title.toLowerCase()} records are available for this tab.`}
          rows={canView ? filteredRows : []}
          selectable={activeTab !== "history" && canView}
          {...(definition.initialSort
            ? { initialSort: definition.initialSort }
            : {})}
        />
      </Stack>
    </InventoryPageShell>
  );
}

function formatInventorySearchValue(value: EnterpriseTableCellValue) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(value)
      .toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).toLowerCase();
}
