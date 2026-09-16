import { useState } from "react";
import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

import {
  ErpDatePickerField,
  ErpSelectField,
  type InteractiveFieldState,
} from "../../../shared/ErpFieldControls";
import { InputShowcaseCard } from "./InputShowcaseCard";
import { InputStateTile } from "./InputStateTile";

type ShowcaseProps = {
  sx?: SxProps<Theme>;
};

type ErpDateRangePickerFieldProps = {
  helperText?: string | undefined;
  onChange: (start: Date | null, end: Date | null) => void;
  startLabel: string;
  endLabel: string;
  state?: InteractiveFieldState;
  value: {
    end: Date | null;
    start: Date | null;
  };
};

const moduleOptions = [
  "Purchase",
  "Inventory",
  "Production",
  "Dispatch",
  "Sales",
  "Quality",
  "Warehouse",
] as const;

function FieldExample({
  children,
  label,
}: {
  children: ReactNode;
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

function ErpDateRangePickerField({
  helperText,
  onChange,
  startLabel,
  endLabel,
  state = "default",
  value,
}: ErpDateRangePickerFieldProps) {
  return (
    <Stack
      sx={(theme) => ({
        width: "100%",
        gap: theme.spacing(0.75),
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.25),
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <FieldExample label={startLabel}>
          <ErpDatePickerField
            onChange={(nextStart) => onChange(nextStart, value.end)}
            state={state}
            value={value.start}
          />
        </FieldExample>

        <FieldExample label={endLabel}>
          <ErpDatePickerField
            onChange={(nextEnd) => onChange(value.start, nextEnd)}
            state={state}
            value={value.end}
          />
        </FieldExample>
      </Box>

      {helperText ? (
        <Typography
          variant="caption"
          sx={(theme) => ({
            color:
              state === "error"
                ? theme.palette.error.main
                : theme.palette.text.secondary,
          })}
        >
          {helperText}
        </Typography>
      ) : null}
    </Stack>
  );
}

export function SelectShowcase({ sx }: ShowcaseProps) {
  const [defaultValue, setDefaultValue] = useState("");
  const [hoverValue, setHoverValue] = useState("Inventory");
  const [focusValue, setFocusValue] = useState("Production");
  const [filledValue, setFilledValue] = useState("INR");
  const [errorValue, setErrorValue] = useState("");

  return (
    <InputShowcaseCard
      sx={sx}
      title="Dropdowns"
      description="Custom Deluxe Veneers ERP dropdown field with themed popup states and maroon selection behavior."
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
        <InputStateTile title="Default" token="theme.components.select.default">
          <FieldExample label="Department">
            <ErpSelectField
              onChange={setDefaultValue}
              options={moduleOptions}
              value={defaultValue}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Hover" token="theme.components.select.hover">
          <FieldExample label="Workflow">
            <ErpSelectField
              onChange={setHoverValue}
              options={moduleOptions}
              state="hover"
              value={hoverValue}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Focused" token="theme.components.select.focused">
          <FieldExample label="Supplier">
            <ErpSelectField
              onChange={setFocusValue}
              options={moduleOptions}
              state="focus"
              value={focusValue}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Selected" token="theme.components.select.selected">
          <FieldExample label="Currency">
            <ErpSelectField
              onChange={setFilledValue}
              options={["INR", "USD", "EUR"]}
              state="filled"
              value={filledValue}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Error" token="theme.components.select.error">
          <FieldExample label="Veneer Type">
            <ErpSelectField
              helperText="Veneer type is required."
              onChange={setErrorValue}
              options={moduleOptions}
              state="error"
              value={errorValue}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile title="Disabled" token="theme.components.select.disabled">
          <FieldExample label="Warehouse">
            <ErpSelectField
              onChange={() => undefined}
              options={moduleOptions}
              state="disabled"
              value="Dispatch"
            />
          </FieldExample>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}

export function DatePickerShowcase({ sx }: ShowcaseProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date(2026, 5, 27));
  const [defaultDate, setDefaultDate] = useState<Date | null>(null);

  return (
    <InputShowcaseCard
      sx={sx}
      title="Date Picker"
      description="Custom ERP date field with branded calendar popup, today indicator, and maroon selected-day treatment."
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
        <InputStateTile title="Default" token="theme.components.datePicker.default">
          <FieldExample label="Inward Date">
            <ErpDatePickerField
              onChange={setDefaultDate}
              value={defaultDate}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile
          title="Selected Date"
          token="theme.components.datePicker.selected"
        >
          <FieldExample label="Invoice Date">
            <ErpDatePickerField
              onChange={setSelectedDate}
              state="filled"
              value={selectedDate}
            />
          </FieldExample>
        </InputStateTile>

        <InputStateTile
          title="Error"
          token="theme.components.datePicker.error"
          sx={{ gridColumn: { xs: "1 / -1" } }}
        >
          <FieldExample label="Dispatch Date">
            <ErpDatePickerField
              helperText="Dispatch date is required."
              onChange={() => undefined}
              state="error"
              value={null}
            />
          </FieldExample>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}

export function DateRangePickerShowcase({ sx }: ShowcaseProps) {
  const [defaultRange, setDefaultRange] = useState<{
    end: Date | null;
    start: Date | null;
  }>({
    start: null,
    end: null,
  });
  const [selectedRange, setSelectedRange] = useState<{
    end: Date | null;
    start: Date | null;
  }>({
    start: new Date(2026, 5, 24),
    end: new Date(2026, 5, 29),
  });

  return (
    <InputShowcaseCard
      sx={sx}
      title="Date Range Picker"
      description="Two-calendar ERP range selection for audit windows, dispatch planning, reporting periods, and production spans."
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
        <InputStateTile
          title="Default"
          token="theme.components.dateRangePicker.default"
        >
          <ErpDateRangePickerField
            onChange={(start, end) => setDefaultRange({ start, end })}
            startLabel="Start Date"
            endLabel="End Date"
            value={defaultRange}
          />
        </InputStateTile>

        <InputStateTile
          title="Selected Range"
          token="theme.components.dateRangePicker.selectedRange"
        >
          <ErpDateRangePickerField
            onChange={(start, end) => setSelectedRange({ start, end })}
            startLabel="Start Date"
            endLabel="End Date"
            state="filled"
            value={selectedRange}
          />
        </InputStateTile>

        <InputStateTile
          title="Error"
          token="theme.components.dateRangePicker.error"
          sx={{ gridColumn: { xs: "1 / -1" } }}
        >
          <ErpDateRangePickerField
            helperText="A valid reporting range is required."
            onChange={() => undefined}
            startLabel="Start Date"
            endLabel="End Date"
            state="error"
            value={{ start: null, end: null }}
          />
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}
