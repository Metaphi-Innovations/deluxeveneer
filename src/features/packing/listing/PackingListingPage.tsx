import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Snackbar, Stack } from "@mui/material";
import { Eye, PackageOpen, RotateCcw, Truck } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { listingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { usePackingList } from "../hooks/usePackingList";
import {
  getPackingPaths,
  issuePackingForDispatch,
  revertPackingRecord,
  type PackingRecord,
  type PackingTabValue,
} from "../shared/packingStore";

const packingTabs = [
  { label: "Issued for Packing", value: "issued" },
  { label: "Packing Done", value: "done" },
] as const satisfies readonly { label: string; value: PackingTabValue }[];

export function PackingListingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const paths = getPackingPaths();
  const {
    activeTab,
    columns,
    rows,
    searchValue,
    setActiveTab,
    setSearchValue,
  } = usePackingList();
  const [issueDispatchRecord, setIssueDispatchRecord] =
    useState<PackingRecord | null>(null);
  const [revertRecord, setRevertRecord] = useState<PackingRecord | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    const flashMessage = (location.state as { packingFlashMessage?: string } | null)
      ?.packingFlashMessage;

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
  const canCreatePacking = canAccessPermission("packing", "create");
  const canEditPacking = canAccessPermission("packing", "edit");
  const canViewPacking = canAccessPermission("packing", "view");
  const canCreateDispatch = canAccessPermission("dispatch", "create");

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
    ],
    [canViewPacking, navigate, paths],
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
      ...(canCreateDispatch
        ? [
          {
            id: "issue-for-dispatch",
            label: "Issue for Dispatch",
            icon: Truck,
            tone: "primary" as const,
            onSelect: (row: PackingRecord) => setIssueDispatchRecord(row),
          },
        ]
        : []),
      ...(canEditPacking
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
    [canCreateDispatch, canEditPacking, canViewPacking, navigate, paths],
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "Packing" }]}
      title="Packing"
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
            placeholder="Search..."
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
              Create Packing
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

      <ConfirmationDialog
        cancelLabel="Keep in Packing Done"
        confirmLabel="Issue for Dispatch"
        description={
          issueDispatchRecord
            ? `Issue packing for order ${issueDispatchRecord.orderNo} (Item ${issueDispatchRecord.orderItemNo}) to Issued for Dispatch?`
            : undefined
        }
        onClose={() => setIssueDispatchRecord(null)}
        onConfirm={() => {
          if (issueDispatchRecord) {
            const orderInfo = `${issueDispatchRecord.orderNo} (Item ${issueDispatchRecord.orderItemNo})`;
            issuePackingForDispatch(issueDispatchRecord.id);
            setIssueDispatchRecord(null);
            navigate("/dispatch", {
              state: {
                dispatchFlashMessage: `Order ${orderInfo} issued for dispatch.`,
              },
            });
          }
        }}
        open={Boolean(issueDispatchRecord)}
        title="Issue for Dispatch"
      />

      <ConfirmationDialog
        cancelLabel="Keep Completed"
        confirmLabel="Revert to Issued"
        description={
          revertRecord
            ? `Are you sure you want to revert packing for order ${revertRecord.orderNo} (Item ${revertRecord.orderItemNo}) back to Issued for Packing?`
            : undefined
        }
        onClose={() => setRevertRecord(null)}
        onConfirm={() => {
          if (revertRecord) {
            const orderInfo = `${revertRecord.orderNo} (Item ${revertRecord.orderItemNo})`;
            revertPackingRecord(revertRecord.id);
            setRevertRecord(null);
            setToastNotification({
              message: `Packing for order ${orderInfo} reverted to Issued queue.`,
              severity: "success",
            });
          }
        }}
        open={Boolean(revertRecord)}
        title="Revert Packing"
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
