import { useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Eye, Trash2 } from "lucide-react";

import { ConfirmationDialog } from "../../../../../components/feedback/ConfirmationDialog";
import { FormShowcaseCard } from "../../forms/components/FormShowcaseCard";

const sampleRecord = {
  amount: "₹ 2,84,500.00",
  itemName: "Oak Veneer Block",
  itemSrNo: "ITM-VB-001",
  supplierName: "Arihant Veneers LLP",
  thickness: "18 mm",
} as const;

export function ModalPatternShowcase() {
  const theme = useTheme();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);
  const [lastAction, setLastAction] = useState("Ready");

  return (
    <FormShowcaseCard
      title="Modal Pattern"
      description="Compact, low-shadow dialogs for the two ERP-wide modal needs: a destructive confirmation and a read-only quick-view."
      token="theme.customTokens.elevation.md"
      footer={
        <Typography variant="caption" color="text.secondary">
          Both dialogs sit on `theme.customTokens.radius.sm` and reuse the same centered Cancel / primary action row as forms. Last action: {lastAction}
        </Typography>
      }
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ gap: theme.spacing(2), flexWrap: "wrap" }}
      >
        <ModalTrigger
          description="Destructive action confirmation, opened from a row's overflow menu before a record is removed."
          icon={<Trash2 size={16} />}
          label="Delete confirmation"
          onOpen={() => setDeleteOpen(true)}
        />

        <ModalTrigger
          description="Read-only quick view of a record without leaving the listing page."
          icon={<Eye size={16} />}
          label="View details"
          onOpen={() => setViewOpen(true)}
        />
      </Stack>

      <ConfirmationDialog
        confirmLabel="Delete"
        description={`This will remove "${sampleRecord.itemName}" from the Veneer Blocks listing. This action cannot be undone.`}
        loading={deleteLoading}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          setDeleteLoading(true);
          await new Promise((resolve) => setTimeout(resolve, 400));
          setDeleteLoading(false);
          setDeleteOpen(false);
          setLastAction("Confirmed delete");
        }}
        open={deleteOpen}
        title="Delete this record?"
        tone="danger"
      />

      <ViewDetailsDialog
        onClose={() => setViewOpen(false)}
        open={viewOpen}
      />
    </FormShowcaseCard>
  );
}

function ModalTrigger({
  description,
  icon,
  label,
  onOpen,
}: {
  description: string;
  icon: React.ReactNode;
  label: string;
  onOpen: () => void;
}) {
  return (
    <Stack
      sx={(theme) => ({
        flex: "1 1 260px",
        gap: theme.spacing(1.25),
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        p: theme.spacing(2.5),
      })}
    >
      <Typography variant="body2" color="text.secondary">
        {description}
      </Typography>

      <Button
        disableElevation
        onClick={onOpen}
        startIcon={icon}
        variant="outlined"
        sx={(theme) => ({
          alignSelf: "flex-start",
          borderRadius: `${theme.customTokens.radius.md}px`,
        })}
      >
        {label}
      </Button>
    </Stack>
  );
}

const detailRows: ReadonlyArray<{ label: string; value: string }> = [
  { label: "Item Sr No", value: sampleRecord.itemSrNo },
  { label: "Item Name", value: sampleRecord.itemName },
  { label: "Supplier Name", value: sampleRecord.supplierName },
  { label: "Thickness", value: sampleRecord.thickness },
  { label: "Amount", value: sampleRecord.amount },
];

function ViewDetailsDialog({ onClose, open }: { onClose: () => void; open: boolean }) {
  return (
    <Dialog
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme: Theme) => ({
            borderRadius: `${theme.customTokens.radius.sm}px`,
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.22)",
            width: "min(480px, calc(100vw - 32px))",
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 600,
          px: theme.spacing(2.5),
          py: theme.spacing(2),
        })}
      >
        Veneer Block Details
      </DialogTitle>

      <DialogContent sx={(theme) => ({ px: theme.spacing(2.5), py: theme.spacing(2) })}>
        <Table size="small">
          <TableBody>
            {detailRows.map((row) => (
              <TableRow key={row.label}>
                <TableCell
                  sx={(theme) => ({
                    border: 0,
                    color: theme.customTokens.text.secondary,
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: 600,
                    py: theme.spacing(1),
                    width: "42%",
                  })}
                >
                  {row.label}
                </TableCell>
                <TableCell
                  sx={(theme) => ({
                    border: 0,
                    color: theme.customTokens.text.primary,
                    fontSize: theme.typography.body2.fontSize,
                    py: theme.spacing(1),
                  })}
                >
                  {row.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Box sx={(theme) => ({ display: "flex", justifyContent: "center", pt: theme.spacing(2) })}>
          <Button
            disableElevation
            onClick={onClose}
            variant="contained"
            sx={(theme) => ({ minWidth: 132, borderRadius: `${theme.customTokens.radius.md}px` })}
          >
            Close
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
