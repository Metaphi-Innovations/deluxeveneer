import { Stack, Typography } from "@mui/material";

import { EnterpriseTableShowcase } from "./components/EnterpriseTableShowcase";
import { TableFeaturesGrid } from "./components/TableFeaturesGrid";

export function DataDisplaySection() {
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
          Data Display
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Production-ready table patterns for inward entries, inventory masters,
          procurement records, and other high-density ERP datasets.
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
            ERP Tables
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Interactive reference for the standard data table component used across Deluxe Veneers workflows.
          </Typography>
        </Stack>

        <Stack
          sx={(theme) => ({
            gap: theme.spacing(4),
          })}
        >
          <EnterpriseTableShowcase
            title="Standard Table"
            token="theme.components.table.standard"
            description="Base ERP table with sorting, filtering, dynamic column width, sticky headers, hidden-scroll horizontal overflow, and enterprise pagination."
          />

          <EnterpriseTableShowcase
            selectable
            title="Selectable Table"
            token="theme.components.table.selectable"
            description="Selection-enabled table variant for bulk review, approval queues, and multi-row ERP workflows."
          />
        </Stack>
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
            Table Features
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Core capabilities expected from the reusable ERP table component.
          </Typography>
        </Stack>

        <TableFeaturesGrid />
      </Stack>
    </Stack>
  );
}
