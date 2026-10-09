import { useMemo, useState } from "react";
import { Button, Stack } from "@mui/material";
import { CheckCircle2, Eye, Truck } from "lucide-react";
import { useNavigate } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import {
  type DispatchTabValue,
  type PackingRecord,
} from "../../packing/shared/packingStore";
import { useDispatchList } from "../hooks/useDispatchList";
import { canAccessPermission } from "../../permissions";
import { listingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { DispatchMarkDoneDialog } from "../form/DispatchMarkDoneDialog";

const dispatchTabs = [
  { label: "Issued for Dispatch", value: "issued" },
  { label: "Dispatch Done", value: "done" },
] as const satisfies readonly { label: string; value: DispatchTabValue }[];

export function DispatchPage() {
  const navigate = useNavigate();
  const {
    activeTab,
    columns,
    rows,
    searchValue,
    setActiveTab,
    setSearchValue,
  } = useDispatchList();
  const [markDoneRecord, setMarkDoneRecord] = useState<PackingRecord | null>(
    null,
  );
  const canCreate = canAccessPermission("dispatch", "create");
  const canEdit = canAccessPermission("dispatch", "edit");
  const canView = canAccessPermission("dispatch", "view");

  const issuedActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<PackingRecord>>
  >(
    () => [
      ...(canView
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: PackingRecord) =>
                navigate(`/dispatch/view/${row.id}`),
            },
          ]
        : []),
      ...(canEdit || canCreate
        ? [
            {
              id: "mark-dispatch-done",
              label: "Mark Dispatch Done",
              icon: CheckCircle2,
              onSelect: (row: PackingRecord) => setMarkDoneRecord(row),
            },
          ]
        : []),
    ],
    [canCreate, canEdit, canView, navigate],
  );

  const doneActions = useMemo<
    ReadonlyArray<EnterpriseTableAction<PackingRecord>>
  >(
    () => [
      ...(canView
        ? [
            {
              id: "view",
              label: "View",
              icon: Eye,
              onSelect: (row: PackingRecord) =>
                navigate(`/dispatch/view/${row.id}`),
            },
          ]
        : []),
    ],
    [canView, navigate],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "Dispatch" }]}
      title="Dispatch"
      subtitle="Track items ready for and completed at dispatch."
      contentGap={2}
    >
      <ModuleProcessTabs
        onChange={setActiveTab}
        tabs={dispatchTabs}
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
                ? "Search issued for dispatch..."
                : "Search dispatch done..."
            }
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: "100%",
            }}
          />

          {canCreate && activeTab === "issued" ? (
            <Button
              disabled={rows.length === 0}
              onClick={() => navigate("/dispatch/add")}
              startIcon={<Truck size={14} />}
              sx={listingToolbarButtonSx}
              variant="outlined"
            >
              Full Dispatch Form
            </Button>
          ) : null}
        </Stack>

        <EnterpriseDataTable
          actions={activeTab === "issued" ? issuedActions : doneActions}
          columns={columns}
          defaultRowsPerPage={10}
          emptyStateLabel={
            activeTab === "issued"
              ? "No Packing Done records waiting for dispatch."
              : "No Dispatch Done records yet."
          }
          initialSort={{ key: "updatedDate", direction: "desc" }}
          rows={canView ? rows : []}
        />
      </Stack>

      <DispatchMarkDoneDialog
        open={Boolean(markDoneRecord)}
        record={markDoneRecord}
        onClose={() => setMarkDoneRecord(null)}
      />
    </MasterPageShell>
  );
}
