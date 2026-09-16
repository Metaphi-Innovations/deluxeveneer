import { Box, Stack, Typography } from "@mui/material";

import {
  CheckboxShowcase,
  SwitchShowcase,
} from "./components/ChoiceInputShowcases";
import { IconGallery } from "../primitives/components/IconGallery";
import { SectionCard } from "../primitives/components/SectionCard";
import {
  DatePickerShowcase,
  DateRangePickerShowcase,
} from "./components/QuantitativeInputShowcases";
import { SelectShowcase } from "./components/SelectionInputShowcases";
import { TextInputShowcase, TextareaShowcase } from "./components/TextualInputShowcases";

export function InputsSection() {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(4),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1),
        })}
      >
        <Typography variant="h2" color="text.primary">
          Inputs
        </Typography>

        <Typography variant="body1" color="text.secondary">
          Reusable input components used throughout the Deluxe Veneers ERP.
        </Typography>
      </Stack>

      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(2.5),
          gridTemplateColumns: {
            xs: "1fr",
            xl: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <TextInputShowcase />
        <TextareaShowcase />
        <SelectShowcase />
        <DatePickerShowcase />
        <DateRangePickerShowcase />
        <SwitchShowcase />
        <CheckboxShowcase sx={{ gridColumn: "1 / -1" }} />
      </Box>

      <SectionCard
        description="Reusable icon references for action controls and sidebar navigation across the Deluxe Veneers ERP."
        title="Icons"
      >
        <IconGallery />
      </SectionCard>
    </Stack>
  );
}
