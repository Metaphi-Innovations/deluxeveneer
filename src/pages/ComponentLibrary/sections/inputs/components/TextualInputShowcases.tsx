import type { SxProps, Theme } from "@mui/material/styles";
import { Box, Stack, TextField, Typography, useTheme } from "@mui/material";

import { getCompactFieldSx } from "./inputFieldStyles";
import { InputShowcaseCard } from "./InputShowcaseCard";
import { InputStateTile } from "./InputStateTile";

type ShowcaseProps = {
  sx?: SxProps<Theme>;
};

function FieldExample({
  children,
  label,
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <Stack
      sx={(theme) => ({
        width: "100%",
        gap: theme.spacing(0.75),
      })}
    >
      <Typography variant="subtitle2" color="text.primary">
        {label}
      </Typography>

      {children}
    </Stack>
  );
}

export function TextInputShowcase({ sx }: ShowcaseProps) {
  const theme = useTheme();

  return (
    <InputShowcaseCard
      sx={sx}
      title="Input Fields"
      description="Standard single-line ERP text fields for supplier details, invoice references, bundles, pallets, and lot tracking."
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <InputStateTile title="Default" token="theme.components.input.default">
          <FieldExample label="Supplier Name">
            <TextField
              fullWidth
              size="small"
              sx={getCompactFieldSx(theme)}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Filled" token="theme.components.input.filled">
          <FieldExample label="Invoice Number">
            <TextField
              fullWidth
              size="small"
              defaultValue="INV-2026-184"
              sx={getCompactFieldSx(theme, "filled")}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Focused" token="theme.components.input.focused">
          <FieldExample label="Bundle Number">
            <TextField
              fullWidth
              size="small"
              focused
              defaultValue="BDL-24-018"
              sx={getCompactFieldSx(theme, "focus")}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Helper" token="theme.components.input.helper">
          <FieldExample label="Pallet Number">
            <TextField
              fullWidth
              size="small"
              helperText="Use the pallet reference printed on the inward material slip."
              sx={getCompactFieldSx(theme)}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Error" token="theme.components.input.error">
          <FieldExample label="Lot Number">
            <TextField
              fullWidth
              size="small"
              error
              defaultValue="LT"
              helperText="Lot number must contain at least 6 characters."
              sx={getCompactFieldSx(theme, "error")}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Disabled" token="theme.components.input.disabled">
          <FieldExample label="Pallet Number">
            <TextField
              fullWidth
              size="small"
              disabled
              defaultValue="PLT-2026-044"
              sx={getCompactFieldSx(theme, "disabled")}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile
          title="Read Only"
          token="theme.components.input.readOnly"
          sx={{ gridColumn: { xs: "1 / -1" } }}
        >
          <FieldExample label="Remarks">
            <TextField
              fullWidth
              size="small"
              defaultValue="Lot linked to inward batch after moisture verification."
              InputProps={{ readOnly: true }}
              sx={getCompactFieldSx(theme, "readOnly")}
            />
          </FieldExample>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}

export function TextareaShowcase({ sx }: ShowcaseProps) {
  const theme = useTheme();

  return (
    <InputShowcaseCard
      sx={sx}
      title="Text Area"
      description="Multi-line Remarks field for production notes, inward comments, and operational handover context."
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <InputStateTile title="Default" token="theme.components.textarea.default">
          <FieldExample label="Remarks">
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              sx={getCompactFieldSx(theme)}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Helper" token="theme.components.textarea.helper">
          <FieldExample label="Remarks">
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              helperText="Capture only remarks that affect inward approval, grading, or dispatch planning."
              sx={getCompactFieldSx(theme)}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Error" token="theme.components.textarea.error">
          <FieldExample label="Remarks">
            <TextField
              fullWidth
              error
              multiline
              rows={3}
              size="small"
              defaultValue="ok"
              helperText="Provide at least 15 characters for operational remarks."
              sx={getCompactFieldSx(theme, "error")}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Disabled" token="theme.components.textarea.disabled">
          <FieldExample label="Remarks">
            <TextField
              fullWidth
              disabled
              multiline
              rows={3}
              size="small"
              defaultValue="Remarks are locked after invoice posting."
              sx={getCompactFieldSx(theme, "disabled")}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile
          title="Read Only"
          token="theme.components.textarea.readOnly"
          sx={{ gridColumn: { xs: "1 / -1" } }}
        >
          <FieldExample label="Remarks">
            <TextField
              fullWidth
              multiline
              rows={3}
              size="small"
              defaultValue="Material moved to quality holding after bundle inspection."
              InputProps={{ readOnly: true }}
              sx={getCompactFieldSx(theme, "readOnly")}
            />
          </FieldExample>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}
