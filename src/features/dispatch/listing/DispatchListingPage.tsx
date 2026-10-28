import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Snackbar, Stack } from "@mui/material";
import { Eye, RotateCcw, Truck } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import {
  revertDispatchEntry,
  type DispatchTabValue,
  type PackingRecord,
} from "../../packing/shared/packingStore";
import { useDispatchList } from "../hooks/useDispatchList";
import { canAccessPermission } from "../../permissions";
import { listingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";

const dispatchTabs = [
  { label: "Issued for Dispatch", value: "issued" },
  { label: "Dispatch Done", value: "done" },
] as const satisfies readonly { label: string; value: DispatchTabValue }[];

export function DispatchPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    activeTab,
    columns,
    rows,
    searchValue,
    setActiveTab,
    setSearchValue,
  } = useDispatchList();
  const [revertRecord, setRevertRecord] = useState<PackingRecord | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    const flashMessage = (
      location.state as { dispatchFlashMessage?: string } | null
    )?.dispatchFlashMessage;

    if (flashMessage) {
      setToastNotification({
        message: flashMessage,
        severity: "success",
      });
      navigate(`${location.pathname}${location.search}`, {
        replace: true,
        state: null,
      });
    }
  }, [location.pathname, location.search, location.state, navigate]);
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
    ],
    [canView, navigate],
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
      ...(canEdit || canCreate
        ? [
            {
              id: "revert",
              label: "Revert",
              icon: RotateCcw,
              tone: "danger" as const,
              onSelect: (row: PackingRecord) => setRevertRecord(row),
            },
          ]
        : []),
    ],
    [canCreate, canEdit, canView, navigate],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "Dispatch" }]}
      title="Dispatch"
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
            placeholder="Search..."
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
              variant="contained"
            >
              Create Dispatch
            </Button>
          ) : null}
        </Stack>

        <EnterpriseDataTable
          actions={activeTab === "issued" ? issuedActions : doneActions}
          columns={columns}
          defaultRowsPerPage={10}
          emptyStateLabel={
            activeTab === "issued"
              ? "No items issued for dispatch yet."
              : "No Dispatch Done records yet."
          }
          initialSort={{ key: "updatedDate", direction: "desc" }}
          rows={canView ? rows : []}
        />
      </Stack>

      <ConfirmationDialog
        cancelLabel="Keep Dispatched"
        confirmLabel="Revert to Issued"
        description={
          revertRecord
            ? `Are you sure you want to revert dispatch for order ${revertRecord.orderNo} (Item ${revertRecord.orderItemNo}) back to Issued for Dispatch?`
            : undefined
        }
        onClose={() => setRevertRecord(null)}
        onConfirm={() => {
          if (revertRecord) {
            const orderInfo = `${revertRecord.orderNo} (Item ${revertRecord.orderItemNo})`;
            revertDispatchEntry(revertRecord.id);
            setRevertRecord(null);
            setToastNotification({
              message: `Dispatch for order ${orderInfo} reverted to Issued queue.`,
              severity: "success",
            });
          }
        }}
        open={Boolean(revertRecord)}
        title="Revert Dispatch"
        tone="danger"
      />

      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={3500}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            variant="filled"
            sx={{ width: "100%", boxShadow: 3 }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>
    </MasterPageShell>
  );
}
