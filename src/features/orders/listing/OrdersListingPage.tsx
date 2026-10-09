import { useMemo, useState } from "react";
import { Box, Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import { CircleAlert, Eye, Pencil, Plus, XCircle } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import {
  getListingToolbarButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
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
  const orderTabs = useMemo(
    () => [{ label: "Orders", value: "order" as OrderListingTab }],
    [],
  );
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

    cancelOrderRecord(cancelDialogOrder.orderId);
    setCancelDialogOrder(null);
  };

  const listingColumns =
    orderListingColumns as readonly EnterpriseTableColumn<OrderListingRow>[];

  return (
    <MasterPageShell
      breadcrumbs={[{ label: moduleConfig.title }]}
      title={moduleConfig.title}
      subtitle="Manage customer orders and fulfilment."
      contentGap={2}
    >
      <ModuleProcessTabs
        onChange={setActiveTab}
        tabs={orderTabs}
        value={activeTab}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={(currentTheme) => ({
          mt: currentTheme.spacing(2),
        })}
      >
        <ClearableSearchField
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search orders..."
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
        initialSort={{ key: "updatedDate", direction: "desc" }}
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

      <CancelOrderConfirmationDialog
        onClose={handleCloseCancelDialog}
        onConfirm={handleConfirmCancelOrder}
        open={Boolean(cancelDialogOrder)}
        orderNo={cancelDialogOrder?.orderNo}
      />
    </MasterPageShell>
  );
}

function CancelOrderConfirmationDialog({
  onClose,
  onConfirm,
  open,
  orderNo,
}: {
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  orderNo: string | undefined;
}) {
  return (
    <Dialog
      fullWidth
      maxWidth="xs"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.shadows[0],
            outline: "none",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(4),
          py: theme.spacing(4),
        })}
      >
        <Stack alignItems="center" spacing={2.5}>
          <Box
            sx={(theme) => ({
              alignItems: "center",
              border: `3px solid ${theme.customTokens.semanticScale.warning[400]}`,
              borderRadius: "50%",
              color: theme.customTokens.semanticScale.warning[400],
              display: "flex",
              height: 76,
              justifyContent: "center",
              width: 76,
            })}
          >
            <CircleAlert size={42} strokeWidth={2.25} />
          </Box>

          <Typography
            align="center"
            sx={(theme) => ({
              color: theme.palette.text.primary,
              fontSize: theme.typography.body1.fontSize,
              fontWeight: 500,
            })}
          >
            Are you sure you want to cancel order {orderNo ?? ""}?
          </Typography>

          <Stack direction="row" spacing={1.5}>
            <Button
              disableElevation
              onClick={onConfirm}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              Yes
            </Button>

            <Button
              disableElevation
              onClick={onClose}
              sx={(theme) => ({
                ...recordFormActionButtonSx,
                backgroundColor: theme.customTokens.neutrals[600],
                color: theme.customTokens.text.inverse,
                "&:hover": {
                  backgroundColor: theme.customTokens.neutrals[700],
                },
              })}
              variant="contained"
            >
              No
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

function getLocationOrderTab(state: unknown) {
  return (state as OrderListingLocationState)?.orderListingTab ?? null;
}

