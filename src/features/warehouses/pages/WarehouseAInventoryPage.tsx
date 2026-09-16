import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleX,
  Eye,
  FileOutput,
  Pencil,
  Plus,
  Upload,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableCellValue,
} from "../../../components/data-display/EnterpriseDataTable";
import { ModuleProcessTabs } from "../../../components/navigation/ModuleProcessTabs";
import { MasterPageShell } from "../../masters/shared";
import { getInventoryPaths } from "../../inventory/shared";
import { canAccessPermission } from "../../permissions";
import {
  getListingToolbarButtonSx,
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import { exportRowsToCsv } from "../../shared/exportToCsv";
import {
  warehouseAInventoryConfigs,
  warehouseInvoiceListingColumns,
  type WarehouseInventoryRow,
  type WarehouseAInventorySlug,
} from "../shared/warehouseTableData";
import {
  getWarehouseAInwardRows,
  subscribeWarehouseAInwardUpdates,
} from "../shared/warehouseAInwardStore";
import {
  getWarehouseQcStatus,
  isWarehouseQcTransferred,
  markWarehouseQcFail,
  markWarehouseQcPass,
  resolveWarehouseQcRows,
  subscribeWarehouseQcStatusUpdates,
} from "../shared/warehouseQcStore";

type WarehouseAVisibleInventorySlug = Exclude<
  WarehouseAInventorySlug,
  "consumables"
>;

const warehouseATabs = [
  { label: "Veneer Blocks", value: "veneer-blocks" },
  { label: "Raw Veneer", value: "raw-veneer" },
  { label: "Plywood", value: "plywood" },
  { label: "MDF", value: "mdf" },
] as const satisfies readonly {
  label: string;
  value: WarehouseAVisibleInventorySlug;
}[];

const visibleWarehouseAInventorySlugs = new Set<WarehouseAInventorySlug>(
  warehouseATabs.map((tab) => tab.value),
);

export function WarehouseAInventoryPage() {
  return <WarehouseAInventoryModulePage />;
}

interface WarehouseAInventoryModulePageProps {
  warehouseName?: string;
  warehouseRootPath?: string;
}

export function WarehouseAInventoryModulePage({
  warehouseName = "Warehouse A",
  warehouseRootPath = "/warehouse-a",
}: WarehouseAInventoryModulePageProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState("");
  const [qcStatusRevision, setQcStatusRevision] = useState(0);
  const [inwardRevision, setInwardRevision] = useState(0);
  const [qcPassRow, setQcPassRow] = useState<WarehouseInventoryRow | null>(
    null,
  );
  const activeInventory = getActiveWarehouseAInventory(
    searchParams.get("inventory"),
  );
  const activeConfig = warehouseAInventoryConfigs[activeInventory];
  const canCreate = canAccessPermission("warehouseA", "create");
  const canEdit = canAccessPermission("warehouseA", "edit");
  const canView = canAccessPermission("warehouseA", "view");
  const activeInventoryListPath = `${warehouseRootPath}?inventory=${activeInventory}`;
  const resolvedRows = useMemo(() => {
    const inwardRows = getWarehouseAInwardRows(activeInventory);
    const mergedRows = mergeWarehouseARows(activeConfig.rows, inwardRows);

    return resolveWarehouseQcRows(mergedRows).filter(
      (row) => row.qcStatus !== "pass",
    );
  }, [
    activeConfig.rows,
    activeInventory,
    inwardRevision,
    qcStatusRevision,
  ]);

  useEffect(
    () =>
      subscribeWarehouseQcStatusUpdates(() =>
        setQcStatusRevision((current) => current + 1),
      ),
    [],
  );

  useEffect(
    () =>
      subscribeWarehouseAInwardUpdates(() =>
        setInwardRevision((current) => current + 1),
      ),
    [],
  );

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return resolvedRows;
    }

    return resolvedRows.filter((row) =>
      Object.values(row).some((value) =>
        formatInventorySearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [resolvedRows, searchValue]);

  const getRowActions = useMemo(
    () => (row: WarehouseInventoryRow) => {
      const actions: EnterpriseTableAction<WarehouseInventoryRow>[] = [
        ...(canView
          ? [
              {
                id: "view",
                label: "View",
                icon: Eye,
                onSelect: (selectedRow: WarehouseInventoryRow) =>
                  navigate(
                    addReturnToQuery(
                      getInventoryPaths(
                        selectedRow.inventorySlug,
                        "issued",
                        "warehouse-a",
                      ).view(selectedRow.inventoryRecordId),
                      activeInventoryListPath,
                    ),
                  ),
              },
            ]
          : []),
        ...(canEdit
          ? [
              {
                id: "edit",
                label: "Edit",
                icon: Pencil,
                onSelect: (selectedRow: WarehouseInventoryRow) =>
                  navigate(
                    addReturnToQuery(
                      getInventoryPaths(
                        selectedRow.inventorySlug,
                        "issued",
                        "warehouse-a",
                      ).edit(selectedRow.inventoryRecordId),
                      activeInventoryListPath,
                    ),
                  ),
              },
            ]
          : []),
      ];

      const qcStatus = getWarehouseQcStatus(row);
      const alreadyTransferred = isWarehouseQcTransferred(row);

      if (
        canEdit &&
        (qcStatus === "pending" || qcStatus === "fail") &&
        !alreadyTransferred
      ) {
        actions.push({
          id: "qc-pass",
          label: "QC Pass",
          icon: BadgeCheck,
          onSelect: (selectedRow) => {
            setQcPassRow(selectedRow);
          },
        });
      }

      if (canEdit && qcStatus === "pending" && !alreadyTransferred) {
        actions.push({
          id: "qc-fail",
          label: "QC Fail",
          icon: CircleX,
          tone: "danger",
          onSelect: (selectedRow) => {
            markWarehouseQcFail(selectedRow);
            setQcStatusRevision((current) => current + 1);
          },
        });
      }

      return actions;
    },
    [activeInventoryListPath, canEdit, canView, navigate],
  );

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: warehouseName },
        { label: activeConfig.title },
      ]}
      subtitle="Incoming material and warehouse inventory."
      title={warehouseName}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <ModuleProcessTabs
          onChange={(value) => {
            setSearchParams({ inventory: value }, { replace: true });
          }}
          tabs={warehouseATabs}
          value={activeInventory}
        />

        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          spacing={2}
        >
          <ClearableSearchField
            value={searchValue}
            onChange={setSearchValue}
            placeholder="Search inventory..."
            sx={{
              width: { xs: "100%", sm: 300 },
              maxWidth: "100%",
            }}
          />

          <Stack
            direction="row"
            spacing={portalButtonGroupGap}
            useFlexGap
            sx={{
              alignItems: "center",
              justifyContent: "flex-end",
              flexWrap: "wrap",
            }}
          >
            {canCreate ? (
              <Button
                component={RouterLink}
                to={addReturnToQuery(
                  getInventoryPaths(activeInventory, "issued", "warehouse-a").add,
                  activeInventoryListPath,
                )}
                startIcon={<Plus size={15} />}
                variant="contained"
                sx={(theme) => getListingToolbarButtonSx(theme)}
              >
                Add Stock
              </Button>
            ) : null}

            <Button
              variant="outlined"
              startIcon={<FileOutput size={15} />}
              disabled={filteredRows.length === 0}
              onClick={() =>
                exportRowsToCsv(
                  filteredRows,
                  warehouseInvoiceListingColumns,
                  `warehouse-a-${activeInventory}`,
                )
              }
              sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <EnterpriseDataTable
          key={activeInventory}
          columns={warehouseInvoiceListingColumns}
          defaultRowsPerPage={10}
          getRowActions={getRowActions}
          initialSort={{ key: "inwardDate", direction: "desc" }}
          rows={canView ? filteredRows : []}
        />
      </Stack>

      <WarehouseQcPassDialog
        onClose={() => setQcPassRow(null)}
        onSubmit={({ fileName, remark }) => {
          if (!qcPassRow) {
            return;
          }

          markWarehouseQcPass(qcPassRow, { fileName, remark });
          setQcPassRow(null);
          setQcStatusRevision((current) => current + 1);
        }}
        open={Boolean(qcPassRow)}
      />
    </MasterPageShell>
  );
}

function WarehouseQcPassDialog({
  onClose,
  onSubmit,
  open,
}: {
  onClose: () => void;
  onSubmit: (details: { remark: string; fileName: string }) => void;
  open: boolean;
}) {
  const [remark, setRemark] = useState("");
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    if (open) {
      setRemark("");
      setFileName("");
    }
  }, [open]);

  return (
    <Dialog fullWidth maxWidth="sm" onClose={onClose} open={open}>
      <DialogTitle>Mark QC Pass</DialogTitle>
      <DialogContent sx={{ pt: "8px !important" }}>
        <Stack spacing={2}>
          <TextField
            fullWidth
            label="Remark"
            multiline
            minRows={3}
            onChange={(event) => setRemark(event.target.value)}
            value={remark}
          />

          <Stack spacing={0.75}>
            <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
              File Upload
            </Typography>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Button
                component="label"
                startIcon={<Upload size={15} />}
                variant="outlined"
              >
                Choose File
                <input
                  hidden
                  onChange={(event) =>
                    setFileName(event.target.files?.[0]?.name ?? "")
                  }
                  type="file"
                />
              </Button>
              <Typography
                sx={{
                  color: "text.secondary",
                  fontSize: "0.8125rem",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {fileName || "No file selected"}
              </Typography>
            </Stack>
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Cancel
        </Button>
        <Button
          onClick={() => onSubmit({ fileName, remark })}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function mergeWarehouseARows(
  configRows: readonly WarehouseInventoryRow[],
  inwardRows: readonly WarehouseInventoryRow[],
) {
  const seenIds = new Set<string>();
  const merged: WarehouseInventoryRow[] = [];

  [...inwardRows, ...configRows].forEach((row) => {
    if (seenIds.has(row.id)) {
      return;
    }

    seenIds.add(row.id);
    merged.push(row);
  });

  return merged;
}

function addReturnToQuery(path: string, returnTo: string) {
  const separator = path.includes("?") ? "&" : "?";

  return `${path}${separator}returnTo=${encodeURIComponent(returnTo)}`;
}

function getActiveWarehouseAInventory(
  value: string | null,
): WarehouseAInventorySlug {
  return value &&
    value in warehouseAInventoryConfigs &&
    visibleWarehouseAInventorySlugs.has(value as WarehouseAInventorySlug)
    ? (value as WarehouseAInventorySlug)
    : "veneer-blocks";
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
