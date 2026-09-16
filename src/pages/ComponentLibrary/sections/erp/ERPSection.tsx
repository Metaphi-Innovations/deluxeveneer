import { Stack, Typography } from "@mui/material";

import { AddPatternShowcase } from "./components/AddPatternShowcase";
import { ListingPatternShowcase } from "./components/ListingPatternShowcase";
import { ModalPatternShowcase } from "./components/ModalPatternShowcase";

export function ERPSection() {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(5),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1),
        })}
      >
        <Typography variant="h2" color="text.primary">
          ERP Patterns
        </Typography>

        <Typography variant="body1" color="text.secondary">
          The end-to-end CRUD pattern used across Inventory, Warehouse, Factory, Packing, and
          Dispatch: how Add, Modal, and Listing screens compose the primitives documented
          elsewhere in this library. Shown here using the Veneer Inventory Management workflow.
        </Typography>
      </Stack>

      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
          })}
        >
          <Typography variant="h3" color="text.primary">
            Add Pattern
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Header context fields, an Item Details / Invoice Details tab split, and a dynamic
            line-item table with Add Item, matching the standard inward-entry screen.
          </Typography>
        </Stack>

        <AddPatternShowcase />
      </Stack>

      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
          })}
        >
          <Typography variant="h3" color="text.primary">
            Modal Pattern
          </Typography>

          <Typography variant="body2" color="text.secondary">
            The two modal shapes every ERP module needs: a destructive confirmation dialog and a
            read-only quick-view dialog.
          </Typography>
        </Stack>

        <ModalPatternShowcase />
      </Stack>

      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
          })}
        >
          <Typography variant="h3" color="text.primary">
            Listing Pattern
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Search, the Add / Export toolbar, and the column-filterable, sortable ERP table with
            row actions, composed the way every module listing page uses them.
          </Typography>
        </Stack>

        <ListingPatternShowcase />
      </Stack>
    </Stack>
  );
}
