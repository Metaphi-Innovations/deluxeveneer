import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Snackbar, Stack } from "@mui/material";
import { Eye, Pencil, Plus, XCircle } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { getListingToolbarButtonSx } from "../../shared/buttonStyles";
import {
  type OrderListingRow,
  type OrderListingTab,
  useOrderList,
} from "../hooks/useOrderList";
import {
  cancelOrderRecord,
  getOrdersPaths,
  getOrderVariantFromType,
  orderListingColumns,
  ordersModuleConfig,
  type OrderModuleConfig,
} from "../shared/ordersStore";
import { OrderStatusChip } from "../shared/OrderStatusChip";
import { OrderViewDetailsDialog } from "./OrderViewDetailsDialog";

type OrderListingLocationState = {
  orderListingTab?: OrderListingTab;
} | null;

export function OrdersListingPage({
  moduleConfig = ordersModuleConfig,
}: {
  moduleConfig?: OrderModuleConfig;
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { id: viewOrderId } = useParams<{ id: string }>();
  const paths = getOrdersPaths(moduleConfig.basePath);
  const requestedTab = getLocationOrderTab(location.state);
  const {
    activeTab,
    filteredRows,
    searchValue,
    setActiveTab,
    setSearchValue,
    viewRecord,
  } = useOrderList({
    moduleConfig,
    requestedTab,
    viewOrderId,
  });
  const [cancelDialogOrder, setCancelDialogOrder] =
    useState<OrderListingRow | null>(null);
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);

  useEffect(() => {
    const flashMessage = (location.state as { orderFlashMessage?: string } | null)
      ?.orderFlashMessage;

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

  const canCreate = canAccessPermission(moduleConfig.permissionKey, "create");
  const canEdit = canAccessPermission(moduleConfig.permissionKey, "edit");
  const canView = canAccessPermission(moduleConfig.permissionKey, "view");

  const rowActions = useMemo<readonly EnterpriseTableAction<OrderListingRow>[]>(
    () => [
      ...(canView
        ? [
          {
            id: "view",
            label: "View",
            icon: Eye,
            onSelect: (row: OrderListingRow) =>
              navigate(paths.view(row.orderId), {
                state: {
                  orderListingTab:
                    getOrderVariantFromType(row.orderType) ?? activeTab,
                },
              }),
          },
        ]
        : []),
      ...(canEdit
        ? [
          {
            id: "edit",
            label: "Edit",
            icon: Pencil,
            onSelect: (row: OrderListingRow) =>
              navigate(paths.edit(row.orderId)),
          },
        ]
        : []),
    ],
    [activeTab, canEdit, canView, navigate, paths],
  );

  const getRowActions = (
    row: OrderListingRow,
  ): readonly EnterpriseTableAction<OrderListingRow>[] =>
    row.status === "Cancelled" || !canEdit
      ? rowActions
      : [
        ...rowActions,
        {
          id: "cancel-order",
          label: "Cancel Order",
          icon: XCircle,
          tone: "danger",
          onSelect: (selectedRow) => setCancelDialogOrder(selectedRow),
        },
      ];

  const handleCloseCancelDialog = () => {
    setCancelDialogOrder(null);
  };

  const handleConfirmCancelOrder = () => {
    if (!cancelDialogOrder) {
      return;
    }

    const orderNo = cancelDialogOrder.orderNo;
    cancelOrderRecord(cancelDialogOrder.orderId);
    setCancelDialogOrder(null);
    setToastNotification({
      message: `Order ${orderNo} cancelled successfully.`,
      severity: "success",
    });
  };

  const listingColumns = (orderListingColumns as readonly EnterpriseTableColumn<OrderListingRow>[]).map(
    (col) =>
      col.key === "status"
        ? { ...col, renderCell: (row: OrderListingRow) => <OrderStatusChip status={String(row.status ?? "")} /> }
        : col,
  );

  return (
    <MasterPageShell
      breadcrumbs={[{ label: moduleConfig.title }]}
      title={moduleConfig.title}
      contentGap={2}
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

        {canCreate ? (
          <Button
            startIcon={<Plus size={14} />}
            onClick={() => navigate(paths.add)}
            sx={(currentTheme) => getListingToolbarButtonSx(currentTheme)}
            variant="contained"
          >
            Create Order
          </Button>
        ) : null}

      </Stack>

      <EnterpriseDataTable
        key={activeTab}
        columns={listingColumns}
        defaultRowsPerPage={10}
        emptyStateLabel={
          "No orders are available."
        }
        getRowActions={getRowActions}
        initialSort={{ key: "orderDate", direction: "desc" }}
        rows={canView ? filteredRows : []}
      />

      <OrderViewDetailsDialog
        onClose={() => {
          navigate(paths.list, {
            state: {
              orderListingTab:
                getOrderVariantFromType(viewRecord?.orderType) ?? activeTab,
            },
          });
        }}
        onEdit={
          canEdit && viewRecord
            ? () =>
              navigate(paths.edit(viewRecord.id), {
                state: {
                  orderListingTab:
                    getOrderVariantFromType(viewRecord.orderType) ?? activeTab,
                },
              })
            : undefined
        }
        open={Boolean(viewOrderId)}
        record={viewRecord}
      />

      <ConfirmationDialog
        cancelLabel="Keep Order"
        confirmLabel="Cancel Order"
        description={
          cancelDialogOrder?.orderNo
            ? `This will cancel order ${cancelDialogOrder.orderNo}.`
            : "This will cancel the selected order."
        }
        onClose={handleCloseCancelDialog}
        onConfirm={handleConfirmCancelOrder}
        open={Boolean(cancelDialogOrder)}
        title="Cancel Order"
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

function getLocationOrderTab(state: unknown) {
  return (state as OrderListingLocationState)?.orderListingTab ?? null;
}

