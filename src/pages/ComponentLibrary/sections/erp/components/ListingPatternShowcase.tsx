import { useMemo, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Eye, FileOutput, Pencil, Plus, Search, Trash2, X } from "lucide-react";

import { ConfirmationDialog } from "../../../../../components/feedback/ConfirmationDialog";
import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
  type EnterpriseTableRow,
} from "../../../../../components/data-display/EnterpriseDataTable";
import { getCompactFieldSx } from "../../inputs/components/inputFieldStyles";
import { FormShowcaseCard } from "../../forms/components/FormShowcaseCard";

type VeneerBlockRow = EnterpriseTableRow & {
  amount: string;
  availableSqm: string;
  color: string;
  inwardDate: Date;
  itemName: string;
  itemSrNo: string;
  supplierName: string;
  thickness: string;
  totalSqm: string;
};

const sampleRows: ReadonlyArray<VeneerBlockRow> = [
  {
    id: "vb-1",
    itemSrNo: "ITM-VB-001",
    inwardDate: new Date("2026-06-02"),
    supplierName: "Arihant Veneers LLP",
    itemName: "Oak Veneer Block",
    color: "Natural Oak",
    thickness: "18 mm",
    totalSqm: "310.500",
    availableSqm: "237.820",
    amount: "284,500.00",
  },
  {
    id: "vb-2",
    itemSrNo: "ITM-VB-002",
    inwardDate: new Date("2026-06-04"),
    supplierName: "Euro Timber Exports",
    itemName: "Walnut Veneer Block",
    color: "Dark Walnut",
    thickness: "19 mm",
    totalSqm: "324.000",
    availableSqm: "273.370",
    amount: "5,920.00",
  },
  {
    id: "vb-3",
    itemSrNo: "ITM-VB-003",
    inwardDate: new Date("2026-06-06"),
    supplierName: "Shree Wood Panels",
    itemName: "Teak Veneer Block",
    color: "Golden Teak",
    thickness: "16 mm",
    totalSqm: "417.000",
    availableSqm: "417.000",
    amount: "318,600.00",
  },
  {
    id: "vb-4",
    itemSrNo: "ITM-VB-004",
    inwardDate: new Date("2026-06-08"),
    supplierName: "Prime Timber Sources",
    itemName: "Ash Veneer Block",
    color: "Soft Ash",
    thickness: "18 mm",
    totalSqm: "335.500",
    availableSqm: "237.900",
    amount: "276,400.00",
  },
  {
    id: "vb-5",
    itemSrNo: "ITM-VB-005",
    inwardDate: new Date("2026-06-10"),
    supplierName: "Nordic Veneer House",
    itemName: "Oak Veneer Block",
    color: "Smoked Natural",
    thickness: "20 mm",
    totalSqm: "308.000",
    availableSqm: "220.500",
    amount: "6,250.00",
  },
] as const;

const columns: ReadonlyArray<EnterpriseTableColumn<VeneerBlockRow>> = [
  { key: "itemSrNo", label: "Item Sr No" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "supplierName", label: "Supplier Name" },
  { key: "itemName", label: "Item Name" },
  { key: "color", label: "Color" },
  { key: "thickness", label: "Thickness" },
  { key: "totalSqm", label: "Total SQM" },
  { key: "availableSqm", label: "Available SQM" },
  { key: "amount", label: "Amount" },
];

function formatSearchValue(value: unknown) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "short", year: "numeric" })
      .format(value)
      .toLowerCase();
  }

  return String(value ?? "").toLowerCase();
}

export function ListingPatternShowcase() {
  const theme = useTheme();
  const [searchValue, setSearchValue] = useState("");
  const [deletedRowIds, setDeletedRowIds] = useState<ReadonlySet<string>>(() => new Set());
  const [deleteTarget, setDeleteTarget] = useState<VeneerBlockRow | null>(null);
  const [lastAction, setLastAction] = useState("Ready");

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();
    const visibleRows = sampleRows.filter((row) => !deletedRowIds.has(row.id));

    if (!normalizedSearch) {
      return visibleRows;
    }

    return visibleRows.filter((row) =>
      Object.values(row).some((value) => formatSearchValue(value).includes(normalizedSearch)),
    );
  }, [deletedRowIds, searchValue]);

  const rowActions: ReadonlyArray<EnterpriseTableAction<VeneerBlockRow>> = [
    { id: "view", label: "View", icon: Eye, onSelect: () => setLastAction("View") },
    { id: "edit", label: "Edit", icon: Pencil, onSelect: () => setLastAction("Edit") },
    {
      id: "delete",
      label: "Delete",
      icon: Trash2,
      tone: "danger",
      onSelect: (row) => setDeleteTarget(row),
    },
  ];

  return (
    <FormShowcaseCard
      title="Listing Pattern"
      description="The full list-page composition: search, Add / Export toolbar, and the column-filterable, sortable ERP table with row actions."
      token="theme.components.table.standard"
      footer={
        <Typography variant="caption" color="text.secondary">
          Use the funnel icon in any column header for a per-column filter, and the arrow icon to sort. Last action: {lastAction}
        </Typography>
      }
    >
      <Stack sx={{ gap: theme.spacing(2) }}>
        <Stack
          direction={{ xs: "column", lg: "row" }}
          alignItems={{ xs: "stretch", lg: "center" }}
          justifyContent="space-between"
          sx={{ gap: theme.spacing(2) }}
        >
          <TextField
            fullWidth
            placeholder="Search..."
            size="small"
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            sx={{
              ...getCompactFieldSx(theme),
              width: { xs: "100%", md: 320 },
              maxWidth: "100%",
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color={theme.customTokens.text.secondary} size={16} />
                  </InputAdornment>
                ),
                endAdornment: searchValue ? (
                  <InputAdornment position="end">
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setSearchValue("")}
                      sx={{
                        appearance: "none",
                        background: "none",
                        border: 0,
                        cursor: "pointer",
                        display: "flex",
                        p: 0,
                      }}
                    >
                      <X color={theme.customTokens.text.secondary} size={14} />
                    </Box>
                  </InputAdornment>
                ) : undefined,
              },
            }}
          />

          <Stack direction={{ xs: "column", sm: "row" }} sx={{ gap: theme.spacing(1.25) }}>
            <Button
              disableElevation
              onClick={() => setLastAction("Add Stock")}
              startIcon={<Plus size={16} />}
              variant="contained"
              sx={{
                minHeight: 34,
                px: theme.spacing(2),
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.brand.primary,
                color: theme.customTokens.text.inverse,
                boxShadow: "none",
                "&:hover": {
                  backgroundColor: theme.customTokens.brand.primaryScale[800],
                  boxShadow: "none",
                },
              }}
            >
              Add Stock
            </Button>

            <Button
              disabled={filteredRows.length === 0}
              onClick={() => setLastAction("Export")}
              startIcon={<FileOutput size={16} />}
              variant="outlined"
              sx={{
                minHeight: 34,
                px: theme.spacing(2),
                borderRadius: `${theme.customTokens.radius.md}px`,
              }}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <EnterpriseDataTable
          actions={rowActions}
          columns={columns}
          defaultRowsPerPage={5}
          emptyStateLabel="No veneer block records match this search."
          initialSort={{ key: "inwardDate", direction: "desc" }}
          rows={filteredRows}
        />
      </Stack>

      <ConfirmationDialog
        confirmLabel="Delete"
        description={
          deleteTarget
            ? `This will remove "${deleteTarget.itemName}" from the Veneer Blocks listing. This action cannot be undone.`
            : undefined
        }
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (!deleteTarget) {
            return;
          }

          setDeletedRowIds((current) => new Set(current).add(deleteTarget.id));
          setLastAction("Deleted row");
          setDeleteTarget(null);
        }}
        open={Boolean(deleteTarget)}
        title="Delete this record?"
        tone="danger"
      />
    </FormShowcaseCard>
  );
}
