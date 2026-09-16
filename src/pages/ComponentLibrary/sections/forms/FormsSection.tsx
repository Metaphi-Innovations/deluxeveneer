import { Stack, Typography } from "@mui/material";

import { DynamicFormTableShowcase } from "./components/DynamicFormTableShowcase";
import { FormGuidelinesGrid } from "./components/FormGuidelinesGrid";
import { FormLayoutShowcase } from "./components/FormLayoutShowcase";

export function FormsSection() {
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
          Forms
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Standard form layouts and form table used throughout the Deluxe Veneers ERP.
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
            Form Layouts
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Reusable enterprise form grids for transaction entry, inward workflows, and high-density desktop forms.
          </Typography>
        </Stack>

        <Stack
          sx={(theme) => ({
            gap: theme.spacing(3),
          })}
        >
          <FormLayoutShowcase
            title="Form Layout - Grid of 3"
            description="Standard three-column ERP form layout for tablets and general desktop data entry screens."
            token="theme.forms.grid3"
            maxColumns={3}
          />

          <FormLayoutShowcase
            title="Form Layout - Grid of 4"
            description="Higher-density four-column layout for wider screens while preserving comfortable field spacing."
            token="theme.forms.grid4"
            maxColumns={4}
          />

          <FormLayoutShowcase
            title="Form Layout - Grid of 5"
            description="High-density five-column layout for large desktop workstations and operational entry teams."
            token="theme.forms.grid5"
            maxColumns={5}
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
            Form Table
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Inline-editable line-item table pattern for purchase, inward, production, packing, and dispatch forms.
          </Typography>
        </Stack>

        <DynamicFormTableShowcase />
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
            Form Guidelines
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Implementation guidance for consistent ERP forms across Inventory, Purchase, Production, Sales, and Administration.
          </Typography>
        </Stack>

        <FormGuidelinesGrid />
      </Stack>
    </Stack>
  );
}
