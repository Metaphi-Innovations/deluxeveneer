import { useMemo, useState } from "react";
import { Button, Stack } from "@mui/material";
import { CheckCircle2, Eye, PackageOpen, Plus } from "lucide-react";
import { useNavigate } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { listingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { PackingMarkDoneDialog } from "../form/PackingMarkDoneDialog";
import { usePackingList } from "../hooks/usePackingList";
import {
  getPackingPaths,
  type PackingRecord,
  type PackingTabValue,
} from "../shared/packingStore";

const packingTabs = [
  { label: "Issued for Packing", value: "issued" },
  { label: "Packing Done", value: "done" },
] as const satisfies readonly { label: string; value: PackingTabValue }[];

export function PackingListingPage() {
  const navigate = useNavigate();
  const paths = getPackingPaths();
  const {
    activeTab,
    columns,
    rows,
    searchValue,
    setActiveTab,
    setSearchValue,
  } = usePackingList();
  const [markDoneRecord, setMarkDoneRecord] = useState<PackingRecord | null>(
    null,
  );
  const canCreatePacking = canAccessPermission("packing", "create");
  const canEditPacking = canAccessPermission("packing", "edit");
  const canViewPacking = canAccessPermission("packing", "view");
  const canCreateDispatch = canAccessPermission("dispatch", "create");
  const canViewDispatch = canAccessPermission("dispatch", "view");

  const issuedActions = useMemo<readonly EnterpriseTableAction<PackingRecord>[]>(
    () => [
      ...(canViewPacking
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: PackingRecord) => navigate(paths.view(row.id)),
            },
          ]
        : []),
      ...(canEditPacking
        ? [
            {
              id: "mark-packing-done",
              label: "Mark Packing Done",
              icon: CheckCircle2,
              tone: "primary" as const,
              onSelect: (row: PackingRecord) => setMarkDoneRecord(row),
            },
          ]
        : []),
    ],
    [canEditPacking, canViewPacking, navigate, paths],
  );

  const doneActions = useMemo<readonly EnterpriseTableAction<PackingRecord>[]>(
    () => [
      ...(canViewPacking
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: PackingRecord) => navigate(paths.view(row.id)),
            },
          ]
        : []),
      ...(canCreateDispatch || canViewDispatch
        ? [
            {
              id: "view-dispatch",
              label: "Issue / View Dispatch",
              icon: Plus,
              tone: "primary" as const,
              onSelect: (row: PackingRecord) =>
                navigate(
                  canCreateDispatch
                    ? `/dispatch/add/${row.id}`
                    : `/dispatch/view/${row.id}`,
                ),
            },
          ]
        : []),
    ],
    [canCreateDispatch, canViewDispatch, canViewPacking, navigate, paths],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "Packing" }]}
      title="Packing"
      subtitle="Track items awaiting and completed packing."
      contentGap={2}
    >
      <ModuleProcessTabs
        onChange={setActiveTab}
        tabs={packingTabs}
        value={activeTab}
      />

      <Stack
        sx={(currentTheme) => ({
          gap: currentTheme.spacing(2),
          mt: currentTheme.spacing(2),
        })}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "stretch", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
        >
          <ClearableSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder={
              activeTab === "issued"
                ? "Search issued for packing..."
                : "Search packing done..."
            }
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: "100%",
            }}
          />

          {activeTab === "issued" && canCreatePacking ? (
            <Button
              onClick={() => navigate(paths.add())}
              sx={listingToolbarButtonSx}
              startIcon={<PackageOpen size={14} />}
              variant="contained"
            >
              Issue for Packing
            </Button>
          ) : null}
        </Stack>

        <EnterpriseDataTable
          actions={activeTab === "issued" ? issuedActions : doneActions}
          columns={columns}
          defaultRowsPerPage={10}
          emptyStateLabel={
            activeTab === "issued"
              ? "No packing-eligible items in the Issued for Packing queue."
              : "No Packing Done records yet."
          }
          initialSort={{ key: "updatedDate", direction: "desc" }}
          rows={canViewPacking ? rows : []}
        />
      </Stack>

      <PackingMarkDoneDialog
        open={Boolean(markDoneRecord)}
        record={markDoneRecord}
        onClose={() => setMarkDoneRecord(null)}
      />
    </MasterPageShell>
  );
}
