import type { ReactNode } from "react";
import type { Theme } from "@mui/material/styles";
import {
  Box,
  Checkbox,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
  Radio,
} from "@mui/material";
import { ChevronDown } from "lucide-react";

import type { FieldVisualState } from "./inputFieldStyles";

type StateColumn =
  | "default"
  | "hover"
  | "focus"
  | "filled"
  | "disabled"
  | "error"
  | "success";

const columns: ReadonlyArray<{
  label: string;
  value: StateColumn;
}> = [
  { label: "Default", value: "default" },
  { label: "Hover", value: "hover" },
  { label: "Focus", value: "focus" },
  { label: "Filled / Selected", value: "filled" },
  { label: "Disabled", value: "disabled" },
  { label: "Error", value: "error" },
  { label: "Success", value: "success" },
];

export function InputStateReferenceTable() {
  const theme = useTheme();

  const headerCellSx = {
    py: theme.spacing(1.25),
    px: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.customTokens.borders.light}`,
    whiteSpace: "nowrap",
  };

  const bodyCellSx = {
    py: theme.spacing(1.5),
    px: theme.spacing(1.5),
    borderBottom: `1px solid ${theme.customTokens.borders.light}`,
  };

  const unsupported = (
    <Typography variant="caption" color="text.disabled">
      —
    </Typography>
  );

  return (
    <TableContainer
      sx={(theme) => ({
        border: `1px solid ${theme.customTokens.borders.light}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: theme.customTokens.surfaces.surface,
      })}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell sx={headerCellSx}>
              <Typography variant="caption" color="text.secondary">
                Component
              </Typography>
            </TableCell>

            {columns.map((column) => (
              <TableCell key={column.value} align="center" sx={headerCellSx}>
                <Typography variant="caption" color="text.secondary">
                  {column.label}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          <TableRow>
            <TableCell sx={bodyCellSx}>
              <Typography variant="subtitle2" color="text.primary">
                Text Input
              </Typography>
            </TableCell>

            {columns.map((column) => (
              <TableCell key={column.value} align="center" sx={bodyCellSx}>
                <FieldGlyph state={column.value} />
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell sx={bodyCellSx}>
              <Typography variant="subtitle2" color="text.primary">
                Select
              </Typography>
            </TableCell>

            {columns.map((column) => (
              <TableCell key={column.value} align="center" sx={bodyCellSx}>
                <FieldGlyph state={column.value} isSelect />
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell sx={bodyCellSx}>
              <Typography variant="subtitle2" color="text.primary">
                Checkbox
              </Typography>
            </TableCell>

            {columns.map((column) => (
              <TableCell key={column.value} align="center" sx={bodyCellSx}>
                <ChoiceGlyph type="checkbox" state={column.value} unsupported={unsupported} />
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell sx={bodyCellSx}>
              <Typography variant="subtitle2" color="text.primary">
                Radio
              </Typography>
            </TableCell>

            {columns.map((column) => (
              <TableCell key={column.value} align="center" sx={bodyCellSx}>
                <ChoiceGlyph type="radio" state={column.value} unsupported={unsupported} />
              </TableCell>
            ))}
          </TableRow>

          <TableRow>
            <TableCell sx={{ ...bodyCellSx, borderBottom: "none" }}>
              <Typography variant="subtitle2" color="text.primary">
                Switch
              </Typography>
            </TableCell>

            {columns.map((column) => (
              <TableCell
                key={column.value}
                align="center"
                sx={{ ...bodyCellSx, borderBottom: "none" }}
              >
                <ChoiceGlyph type="switch" state={column.value} unsupported={unsupported} />
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function FieldGlyph({
  isSelect = false,
  state,
}: {
  isSelect?: boolean;
  state: StateColumn;
}) {
  const theme = useTheme();

  const borderColor = getBorderColor(theme, state);
  const filled = state === "filled";
  const disabled = state === "disabled";

  return (
    <Box
      sx={(theme) => ({
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "space-between",
        width: theme.spacing(8.5),
        height: theme.spacing(3.5),
        border: `1px solid ${borderColor}`,
        borderRadius: `${theme.customTokens.radius.sm}px`,
        backgroundColor: disabled
          ? theme.customTokens.surfaces.alt
          : theme.customTokens.surfaces.surface,
        px: theme.spacing(0.75),
      })}
    >
      {filled ? (
        <Box
          sx={(theme) => ({
            width: isSelect ? theme.spacing(2.5) : theme.spacing(3.25),
            height: 3,
            borderRadius: `${theme.customTokens.radius.pill}px`,
            backgroundColor: theme.customTokens.navigation.activeText,
          })}
        />
      ) : (
        <Box />
      )}

      {isSelect ? (
        <ChevronDown
          color={theme.customTokens.navigation.inactiveText}
          size={theme.customTokens.iconSizes.sm}
        />
      ) : null}
    </Box>
  );
}

function ChoiceGlyph({
  state,
  type,
  unsupported,
}: {
  state: StateColumn;
  type: "checkbox" | "radio" | "switch";
  unsupported: ReactNode;
}) {
  const theme = useTheme();

  if (state === "error" || state === "success") {
    return unsupported;
  }

  const checked = state === "filled";
  const disabled = state === "disabled";

  if (type === "checkbox") {
    return (
      <Checkbox
        checked={checked}
        disabled={disabled}
        indeterminate={state === "hover"}
        size="small"
        sx={{
          color: theme.customTokens.borders.strong,
          "&.Mui-checked": {
            color: theme.customTokens.navigation.activeText,
          },
          "&.MuiCheckbox-indeterminate": {
            color: theme.customTokens.navigation.activeText,
          },
        }}
      />
    );
  }

  if (type === "radio") {
    return (
      <Radio
        checked={checked || state === "focus"}
        disabled={disabled}
        size="small"
        sx={{
          color: theme.customTokens.borders.strong,
          "&.Mui-checked": {
            color: theme.customTokens.navigation.activeText,
          },
        }}
      />
    );
  }

  return (
    <Switch
      checked={checked || state === "focus"}
      disabled={disabled}
      size="small"
      sx={{
        "& .MuiSwitch-switchBase.Mui-checked": {
          color: theme.customTokens.surfaces.surface,
          "& + .MuiSwitch-track": {
            backgroundColor: theme.customTokens.navigation.activeText,
            opacity: 1,
          },
        },
        "& .MuiSwitch-track": {
          backgroundColor:
            state === "hover"
              ? theme.customTokens.borders.hover
              : theme.customTokens.neutrals[300],
          opacity: 1,
        },
      }}
    />
  );
}

function getBorderColor(theme: Theme, state: FieldVisualState) {
  switch (state) {
    case "hover":
      return theme.customTokens.borders.hover;
    case "focus":
      return theme.customTokens.borders.focus;
    case "error":
      return theme.palette.error.main;
    case "success":
      return theme.palette.success.main;
    case "disabled":
      return theme.customTokens.borders.light;
    default:
      return theme.customTokens.borders.default;
  }
}
