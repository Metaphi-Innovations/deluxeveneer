import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  Box,
  ClickAwayListener,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Popper,
  Popover,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import {
  getSelectClosedValueSx,
  getSelectDropdownListboxSx,
  getSelectDropdownOptionSx,
  getSelectDropdownPaperSx,
} from "../../../features/shared/dropdownMenuStyles";

export type InteractiveFieldState =
  | "default"
  | "filled"
  | "focus"
  | "hover"
  | "disabled"
  | "error"
  | "readOnly";

type FieldSize = "regular" | "dense";

type BaseFieldProps = {
  helperText?: string | undefined;
  placeholder?: string | undefined;
  size?: FieldSize;
  state?: InteractiveFieldState;
  /** Optional override — Masters forms use 36px without changing other modules. */
  controlHeight?: number | undefined;
  /** Optional radius override (Masters: 6). */
  controlRadius?: number | undefined;
  /** Subtle maroon focus ring for Masters; default keeps existing glow. */
  focusRing?: "default" | "subtle" | undefined;
};

export type ErpSelectFieldProps = BaseFieldProps & {
  dropdownWidth?: number | string | undefined;
  maxVisibleOptions?: number | undefined;
  onChange: (value: string) => void;
  options: ReadonlyArray<string>;
  searchable?: boolean;
  value: string;
};

export type ErpDatePickerFieldProps = BaseFieldProps & {
  onChange: (value: Date | null) => void;
  value: Date | null;
};

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const defaultVisibleOptionLimit = 160;
const monthLabels = Array.from({ length: 12 }, (_, monthIndex) =>
  new Intl.DateTimeFormat("en-US", { month: "short" }).format(
    new Date(2026, monthIndex, 1),
  ),
);

type CalendarView = "days" | "months" | "years";

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function startOfMonth(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), 1);
}

function addMonths(value: Date, months: number) {
  return new Date(value.getFullYear(), value.getMonth() + months, 1);
}

function addYears(value: Date, years: number) {
  return new Date(value.getFullYear() + years, value.getMonth(), 1);
}

function addDays(value: Date, days: number) {
  const next = new Date(value);
  next.setDate(next.getDate() + days);
  return next;
}

function isSameDay(left: Date | null, right: Date | null) {
  if (!left || !right) {
    return false;
  }

  return startOfDay(left).getTime() === startOfDay(right).getTime();
}

function getMonthDays(month: Date) {
  const monthStart = startOfMonth(month);
  const offset = (monthStart.getDay() + 6) % 7;
  const gridStart = addDays(monthStart, -offset);

  return Array.from({ length: 42 }, (_, index) => addDays(gridStart, index));
}

function formatMonthLabel(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(value);
}

function getMonthName(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
  }).format(value);
}

function getYearRangeStart(year: number) {
  return Math.floor((year - 1) / 10) * 10 + 1;
}

function getYearRangeLabel(month: Date) {
  const start = getYearRangeStart(month.getFullYear());

  return `${start}-${start + 9}`;
}

function formatDateLabel(value: Date | null) {
  if (!value) {
    return "";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(value);
}

function getControlMetrics(
  theme: Theme,
  size: FieldSize,
  controlHeightOverride?: number,
) {
  const controlHeight =
    controlHeightOverride ?? (size === "dense" ? 38 : 40);

  return {
    calendarWidth: size === "dense" ? theme.spacing(24) : theme.spacing(26),
    controlHeight,
    daySize: size === "dense" ? theme.spacing(3.25) : theme.spacing(3.5),
    iconButtonSize: size === "dense" ? theme.spacing(3.25) : theme.spacing(3.5),
    menuItemHeight: size === "dense" ? 38 : 40,
    popoverPadding: size === "dense" ? 0.75 : 1,
  } as const;
}

function getInteractiveFieldStyles(
  theme: Theme,
  state: InteractiveFieldState = "default",
  open = false,
  focusRing: "default" | "subtle" = "default",
) {
  const isDisabled = state === "disabled";
  const isError = state === "error";
  const isReadOnly = state === "readOnly";
  const isFocus = open || state === "focus";
  const isHover = state === "hover";

  const borderColor = isError
    ? theme.palette.error.main
    : isFocus
      ? theme.customTokens.borders.focus
      : isHover
        ? theme.customTokens.borders.hover
        : theme.customTokens.borders.default;

  const focusShadow =
    focusRing === "subtle"
      ? "0 0 0 1px rgba(116, 22, 22, 0.08)"
      : `0 0 0 3px ${theme.customTokens.navigation.activeBackground}`;

  return {
    backgroundColor:
      isDisabled || isReadOnly
        ? theme.customTokens.surfaces.alt
        : theme.customTokens.surfaces.surface,
    borderColor,
    boxShadow: isFocus && !isError ? focusShadow : "none",
    color: isDisabled
      ? theme.palette.text.disabled
      : theme.palette.text.primary,
    cursor: isDisabled || isReadOnly ? "not-allowed" : "pointer",
    helperColor: isError ? theme.palette.error.main : theme.palette.text.secondary,
  } as const;
}

function FieldValue({
  size,
  theme,
  value,
}: {
  size: FieldSize;
  theme: Theme;
  value: string;
}) {
  const hasValue = value.trim().length > 0;

  return (
    <Typography
      title={hasValue ? value : undefined}
      variant="body2"
      sx={{
        color: hasValue ? theme.palette.text.primary : theme.palette.text.secondary,
        ...getSelectClosedValueSx(theme, size === "dense"),
      }}
    >
      {hasValue ? value : "\u00a0"}
    </Typography>
  );
}

function CalendarMonth({
  month,
  onSelectDate,
  selectedDate,
  size,
}: {
  month: Date;
  onSelectDate: (date: Date) => void;
  selectedDate?: Date | null;
  size: FieldSize;
}) {
  const theme = useTheme();
  const metrics = getControlMetrics(theme, size);
  const today = startOfDay(new Date());
  const days = getMonthDays(month);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
        gap: theme.spacing(0.5),
      }}
    >
      {weekdayLabels.map((label) => (
        <Typography
          key={label}
          variant="caption"
          sx={{
            textAlign: "center",
            color: theme.palette.text.secondary,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 600,
            pb: theme.spacing(0.25),
          }}
        >
          {label}
        </Typography>
      ))}

      {days.map((day) => {
        const isCurrentMonth = day.getMonth() === month.getMonth();
        const isSelected = isSameDay(day, selectedDate ?? null);
        const isToday = isSameDay(day, today);

        return (
          <Box
            key={day.toISOString()}
            component="button"
            onClick={() => onSelectDate(day)}
            sx={{
              appearance: "none",
              border: isSelected
                ? `1px solid ${theme.customTokens.brand.primary}`
                : isToday
                  ? `1px solid ${theme.customTokens.brand.secondary}`
                  : "1px solid transparent",
              backgroundColor: isSelected
                ? theme.customTokens.brand.primary
                : "transparent",
              borderRadius: `${theme.customTokens.radius.sm}px`,
              color: isSelected
                ? theme.customTokens.text.inverse
                : isCurrentMonth
                  ? theme.palette.text.primary
                  : theme.palette.text.secondary,
              cursor: "pointer",
              height: metrics.daySize,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: isSelected ? 600 : 500,
              opacity: isCurrentMonth ? 1 : 0.56,
              transition: theme.transitions.create(["background-color", "border-color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                backgroundColor: isSelected
                  ? theme.customTokens.brand.secondary
                  : theme.customTokens.navigation.hoverBackground,
              },
            }}
            type="button"
          >
            {day.getDate()}
          </Box>
        );
      })}
    </Box>
  );
}

function CalendarHeaderButton({
  children,
  onClick,
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  const theme = useTheme();

  return (
    <Typography
      component="button"
      onClick={onClick}
      variant="body2"
      sx={{
        appearance: "none",
        border: 0,
        borderRadius: `${theme.customTokens.radius.sm}px`,
        backgroundColor: "transparent",
        color: theme.palette.text.primary,
        cursor: "pointer",
        font: "inherit",
        fontWeight: 600,
        lineHeight: 1.35,
        px: theme.spacing(0.5),
        py: theme.spacing(0.25),
        "&:hover": {
          backgroundColor: theme.customTokens.navigation.hoverBackground,
          color: theme.customTokens.navigation.activeText,
        },
      }}
      type="button"
    >
      {children}
    </Typography>
  );
}

function CalendarMonthSelector({
  month,
  onSelectMonth,
  size,
}: {
  month: Date;
  onSelectMonth: (monthIndex: number) => void;
  size: FieldSize;
}) {
  const theme = useTheme();
  const metrics = getControlMetrics(theme, size);
  const selectedMonth = month.getMonth();

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
        gap: theme.spacing(0.5),
      }}
    >
      {monthLabels.map((label, monthIndex) => {
        const isSelected = monthIndex === selectedMonth;

        return (
          <Box
            key={label}
            component="button"
            onClick={() => onSelectMonth(monthIndex)}
            sx={{
              appearance: "none",
              border: isSelected
                ? `1px solid ${theme.customTokens.brand.primary}`
                : `1px solid ${theme.customTokens.borders.default}`,
              backgroundColor: isSelected
                ? theme.customTokens.brand.primary
                : theme.customTokens.surfaces.surface,
              borderRadius: `${theme.customTokens.radius.sm}px`,
              color: isSelected ? theme.customTokens.text.inverse : theme.palette.text.primary,
              cursor: "pointer",
              minHeight: metrics.menuItemHeight,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: isSelected ? 600 : 500,
              transition: theme.transitions.create(["background-color", "border-color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                backgroundColor: isSelected
                  ? theme.customTokens.brand.secondary
                  : theme.customTokens.navigation.hoverBackground,
                borderColor: theme.customTokens.brand.secondary,
              },
            }}
            type="button"
          >
            {label}
          </Box>
        );
      })}
    </Box>
  );
}

function CalendarYearSelector({
  month,
  onSelectYear,
  size,
}: {
  month: Date;
  onSelectYear: (year: number) => void;
  size: FieldSize;
}) {
  const theme = useTheme();
  const metrics = getControlMetrics(theme, size);
  const selectedYear = month.getFullYear();
  const currentYear = new Date().getFullYear();
  const rangeStart = getYearRangeStart(selectedYear);
  const years = Array.from({ length: 10 }, (_, index) => rangeStart + index);

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        gap: theme.spacing(0.5),
      }}
    >
      {years.map((year) => {
        const isSelected = year === selectedYear;
        const isCurrentYear = year === currentYear;

        return (
          <Box
            key={year}
            component="button"
            onClick={() => onSelectYear(year)}
            sx={{
              appearance: "none",
              border: isSelected
                ? `1px solid ${theme.customTokens.brand.primary}`
                : isCurrentYear
                  ? `1px solid ${theme.customTokens.brand.secondary}`
                  : `1px solid ${theme.customTokens.borders.default}`,
              backgroundColor: isSelected
                ? theme.customTokens.brand.primary
                : theme.customTokens.surfaces.surface,
              borderRadius: `${theme.customTokens.radius.sm}px`,
              color: isSelected ? theme.customTokens.text.inverse : theme.palette.text.primary,
              cursor: "pointer",
              minHeight: metrics.menuItemHeight,
              fontSize: theme.typography.caption.fontSize,
              fontWeight: isSelected ? 600 : 500,
              transition: theme.transitions.create(["background-color", "border-color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                backgroundColor: isSelected
                  ? theme.customTokens.brand.secondary
                  : theme.customTokens.navigation.hoverBackground,
                borderColor: theme.customTokens.brand.secondary,
              },
            }}
            type="button"
          >
            {year}
          </Box>
        );
      })}
    </Box>
  );
}

function CalendarSurface({
  children,
  month,
  onNext,
  onPrevious,
  onShowMonths,
  onShowYears,
  size,
  view,
}: {
  children: ReactNode;
  month: Date;
  onNext: () => void;
  onPrevious: () => void;
  onShowMonths: () => void;
  onShowYears: () => void;
  size: FieldSize;
  view: CalendarView;
}) {
  const theme = useTheme();
  const metrics = getControlMetrics(theme, size);

  return (
    <Stack
      sx={{
        gap: theme.spacing(0.75),
        minWidth: metrics.calendarWidth,
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing(1),
        }}
      >
        <IconButton
          aria-label={`Previous ${view}`}
          onClick={onPrevious}
          size="small"
          sx={{
            width: metrics.iconButtonSize,
            height: metrics.iconButtonSize,
            border: `1px solid ${theme.customTokens.borders.default}`,
            color: theme.customTokens.navigation.activeText,
            backgroundColor: theme.customTokens.surfaces.surface,
            "&:hover": {
              backgroundColor: theme.customTokens.navigation.hoverBackground,
            },
          }}
        >
          <ChevronLeft size={14} />
        </IconButton>

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flex: 1,
            gap: theme.spacing(0.25),
          }}
        >
          {view === "days" ? (
            <>
              <CalendarHeaderButton onClick={onShowMonths}>
                {getMonthName(month)}
              </CalendarHeaderButton>
              <CalendarHeaderButton onClick={onShowYears}>
                {month.getFullYear()}
              </CalendarHeaderButton>
            </>
          ) : null}

          {view === "months" ? (
            <CalendarHeaderButton onClick={onShowYears}>
              {month.getFullYear()}
            </CalendarHeaderButton>
          ) : null}

          {view === "years" ? (
            <Typography variant="body2" color="text.primary" fontWeight={600}>
              {getYearRangeLabel(month)}
            </Typography>
          ) : null}
        </Box>

        <IconButton
          aria-label={`Next ${view}`}
          onClick={onNext}
          size="small"
          sx={{
            width: metrics.iconButtonSize,
            height: metrics.iconButtonSize,
            border: `1px solid ${theme.customTokens.borders.default}`,
            color: theme.customTokens.navigation.activeText,
            backgroundColor: theme.customTokens.surfaces.surface,
            "&:hover": {
              backgroundColor: theme.customTokens.navigation.hoverBackground,
            },
          }}
        >
          <ChevronRight size={14} />
        </IconButton>
      </Box>

      {children}
    </Stack>
  );
}

export function ErpSelectField({
  controlHeight,
  controlRadius,
  dropdownWidth,
  focusRing = "default",
  helperText,
  maxVisibleOptions = defaultVisibleOptionLimit,
  onChange,
  options,
  placeholder: _placeholder,
  searchable = true,
  size = "regular",
  state = "default",
  value,
}: ErpSelectFieldProps) {
  const theme = useTheme();
  const metrics = getControlMetrics(theme, size, controlHeight);
  const resolvedRadius = controlRadius ?? theme.customTokens.radius.md;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [searchText, setSearchText] = useState("");

  const open = Boolean(anchorEl);
  const styles = getInteractiveFieldStyles(theme, state, open, focusRing);
  const shouldSearchOptions = searchable || options.length > 25;
  const visibleOptions = useMemo(
    () =>
      getVisibleSelectOptions({
        limit: maxVisibleOptions,
        options,
        query: searchText,
        value,
      }),
    [maxVisibleOptions, options, searchText, value],
  );

  useEffect(() => {
    if (!open) {
      setSearchText("");
    }
  }, [open]);

  const openSelectMenu = (anchor: HTMLElement) => {
    if (state === "disabled" || state === "readOnly") {
      return;
    }

    if (!open) {
      setSearchText(value);
    }

    setAnchorEl(anchor);
  };

  const fieldSearchValue = open ? searchText : value;
  const preferredMenuMinWidth =
    typeof dropdownWidth === "number"
      ? dropdownWidth
      : typeof dropdownWidth === "string"
        ? Number.parseFloat(dropdownWidth) || undefined
        : undefined;

  return (
    <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
      <Stack
        sx={{
          position: "relative",
          width: "100%",
          minWidth: 0,
          gap: theme.spacing(0.75),
        }}
      >
        {shouldSearchOptions ? (
          <TextField
            fullWidth
            disabled={state === "disabled"}
            title={!open && value.trim() ? value : undefined}
            value={fieldSearchValue}
            onChange={(event) => {
              if (!open) {
                setAnchorEl(event.currentTarget);
              }

              setSearchText(event.target.value);
            }}
            onClick={(event) => {
              openSelectMenu(event.currentTarget);
            }}
            onFocus={(event) => {
              if (!open) {
                openSelectMenu(event.currentTarget);
                event.currentTarget.select();
              }
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setAnchorEl(null);
                return;
              }

              if (event.key === "Enter" && visibleOptions[0]) {
                event.preventDefault();
                onChange(visibleOptions[0]);
                setAnchorEl(null);
              }
            }}
            slotProps={{
              input: {
                readOnly: state === "readOnly",
                endAdornment: (
                  <InputAdornment position="end">
                    <ChevronDown
                      color={
                        state === "disabled" || state === "readOnly"
                          ? theme.palette.text.disabled
                          : theme.customTokens.navigation.activeText
                      }
                      size={size === "dense" ? 14 : theme.customTokens.iconSizes.sm}
                      strokeWidth={2}
                      style={{
                        transform: open ? "rotate(180deg)" : "rotate(0deg)",
                        transition: "transform 160ms ease",
                      }}
                    />
                  </InputAdornment>
                ),
              },
            }}
            sx={{
              "& .MuiOutlinedInput-root": {
                height: metrics.controlHeight,
                minHeight: metrics.controlHeight,
                borderRadius: `${resolvedRadius}px`,
                backgroundColor: styles.backgroundColor,
                boxShadow: styles.boxShadow,
                color: styles.color,
                cursor: styles.cursor,
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: styles.borderColor,
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor:
                    state === "disabled" ||
                    state === "readOnly" ||
                    state === "error"
                      ? styles.borderColor
                      : theme.customTokens.borders.hover,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: styles.borderColor,
                  borderWidth: 1,
                },
              },
              "& .MuiInputBase-input": {
                ...getSelectClosedValueSx(theme, size === "dense"),
                py: 0,
              },
              "& .MuiInputAdornment-root": {
                marginLeft: theme.spacing(0.5),
                flexShrink: 0,
              },
            }}
          />
        ) : (
          <Box
            component="button"
            onClick={(event) => openSelectMenu(event.currentTarget)}
            sx={{
              appearance: "none",
              width: "100%",
              textAlign: "left",
              border: `1px solid ${styles.borderColor}`,
              borderRadius: `${resolvedRadius}px`,
              backgroundColor: styles.backgroundColor,
              boxShadow: styles.boxShadow,
              boxSizing: "border-box",
              color: styles.color,
              cursor: styles.cursor,
              height: metrics.controlHeight,
              minHeight: metrics.controlHeight,
              pl: theme.spacing(1.5),
              pr: theme.spacing(1),
              py: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: theme.spacing(1),
              "&:hover": {
                borderColor:
                  state === "disabled" || state === "readOnly" || state === "error"
                    ? styles.borderColor
                    : theme.customTokens.borders.hover,
                backgroundColor:
                  state === "disabled" || state === "readOnly"
                    ? styles.backgroundColor
                    : theme.customTokens.surfaces.surface,
              },
            }}
            type="button"
          >
            <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
              <FieldValue
                size={size}
                theme={theme}
                value={value}
              />
            </Box>

            <Box
              component="span"
              sx={{
                display: "inline-flex",
                flexShrink: 0,
                alignItems: "center",
              }}
            >
              <ChevronDown
                color={
                  state === "disabled" || state === "readOnly"
                    ? theme.palette.text.disabled
                    : theme.customTokens.navigation.activeText
                }
                size={size === "dense" ? 14 : theme.customTokens.iconSizes.sm}
                strokeWidth={2}
                style={{
                  transform: open ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 160ms ease",
                }}
              />
            </Box>
          </Box>
        )}

        {helperText ? (
          <Typography variant="caption" sx={{ color: styles.helperColor }}>
            {helperText}
          </Typography>
        ) : null}

        <Popper
          anchorEl={anchorEl}
          disablePortal={false}
          open={open}
          placement="bottom-start"
          sx={{ zIndex: theme.zIndex.modal }}
        >
          <Paper
            onMouseDown={(event) => {
              // Keep portaled menu clicks from racing ClickAwayListener close.
              event.preventDefault();
            }}
            sx={getSelectDropdownPaperSx(theme, anchorEl?.clientWidth, {
              ...(preferredMenuMinWidth !== undefined
                ? { preferredMinWidth: preferredMenuMinWidth }
                : {}),
            })}
          >
            <Box role="listbox" sx={getSelectDropdownListboxSx(theme)}>
              {visibleOptions.map((option) => {
                const selected = option === value;

                return (
                  <MenuItem
                    key={option}
                    selected={selected}
                    title={option}
                    onClick={() => {
                      onChange(option);
                      setAnchorEl(null);
                    }}
                    sx={{
                      minHeight: "auto",
                      ...getSelectDropdownOptionSx(theme, size === "dense"),
                      "&.Mui-selected": {
                        backgroundColor: theme.customTokens.brand.primary,
                        color: theme.customTokens.text.inverse,
                      },
                      "&.Mui-selected:hover": {
                        backgroundColor: theme.customTokens.brand.secondary,
                      },
                      "&:hover": {
                        backgroundColor: selected
                          ? theme.customTokens.brand.secondary
                          : theme.customTokens.navigation.hoverBackground,
                      },
                    }}
                  >
                    {option}
                  </MenuItem>
                );
              })}

              {visibleOptions.length === 0 ? (
                <MenuItem
                  disabled
                  sx={{
                    minHeight: metrics.menuItemHeight,
                    fontSize: "14px",
                    fontWeight: 400,
                  }}
                >
                  No options found
                </MenuItem>
              ) : null}
            </Box>
          </Paper>
        </Popper>
      </Stack>
    </ClickAwayListener>
  );
}

function getVisibleSelectOptions({
  limit,
  options,
  query,
  value,
}: {
  limit: number;
  options: ReadonlyArray<string>;
  query: string;
  value: string;
}) {
  const normalizedQuery = query.trim().toLowerCase();
  const normalizedValue = value.trim().toLowerCase();
  const effectiveQuery = normalizedQuery === normalizedValue ? "" : normalizedQuery;
  const source = effectiveQuery
    ? options.filter((option) => option.toLowerCase().includes(effectiveQuery))
    : options;
  const visibleOptions = source.slice(0, limit);

  if (value && options.includes(value) && !visibleOptions.includes(value)) {
    return [value, ...visibleOptions.slice(0, Math.max(limit - 1, 0))];
  }

  return visibleOptions;
}

export function ErpDatePickerField({
  controlHeight,
  controlRadius,
  focusRing = "default",
  helperText,
  onChange,
  placeholder: _placeholder,
  size = "regular",
  state = "default",
  value,
}: ErpDatePickerFieldProps) {
  const theme = useTheme();
  const metrics = getControlMetrics(theme, size, controlHeight);
  const resolvedRadius = controlRadius ?? theme.customTokens.radius.md;
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [month, setMonth] = useState<Date>(startOfMonth(value ?? new Date()));
  const [calendarView, setCalendarView] = useState<CalendarView>("days");

  const open = Boolean(anchorEl);
  const styles = getInteractiveFieldStyles(theme, state, open, focusRing);

  const displayValue = formatDateLabel(value);
  const handlePrevious = () => {
    setMonth((current) => {
      if (calendarView === "years") {
        return addYears(current, -10);
      }

      if (calendarView === "months") {
        return addYears(current, -1);
      }

      return addMonths(current, -1);
    });
  };
  const handleNext = () => {
    setMonth((current) => {
      if (calendarView === "years") {
        return addYears(current, 10);
      }

      if (calendarView === "months") {
        return addYears(current, 1);
      }

      return addMonths(current, 1);
    });
  };

  return (
    <Stack
      sx={{
        width: "100%",
        gap: theme.spacing(0.75),
      }}
    >
      <Box
        component="button"
        onClick={(event) => {
          if (state !== "disabled" && state !== "readOnly") {
            setMonth(startOfMonth(value ?? new Date()));
            setCalendarView("days");
            setAnchorEl(event.currentTarget);
          }
        }}
        sx={{
          appearance: "none",
          width: "100%",
          textAlign: "left",
          border: `1px solid ${styles.borderColor}`,
          borderRadius: `${resolvedRadius}px`,
          backgroundColor: styles.backgroundColor,
          boxShadow: styles.boxShadow,
          boxSizing: "border-box",
          color: styles.color,
          cursor: styles.cursor,
          height: metrics.controlHeight,
          minHeight: metrics.controlHeight,
          px: theme.spacing(1.5),
          py: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: theme.spacing(1),
          "&:hover": {
            borderColor:
              state === "disabled" || state === "readOnly" || state === "error"
                ? styles.borderColor
                : theme.customTokens.borders.hover,
          },
        }}
        type="button"
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <FieldValue
            size={size}
            theme={theme}
            value={displayValue}
          />
        </Box>

        <CalendarDays
          color={
            state === "disabled" || state === "readOnly"
              ? theme.palette.text.disabled
              : theme.customTokens.navigation.activeText
          }
          size={size === "dense" ? 14 : theme.customTokens.iconSizes.sm}
          strokeWidth={2}
        />
      </Box>

      {helperText ? (
        <Typography variant="caption" sx={{ color: styles.helperColor }}>
          {helperText}
        </Typography>
      ) : null}

      <Popover
        anchorEl={anchorEl}
        open={open}
        onClose={() => {
          setAnchorEl(null);
          setCalendarView("days");
        }}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              mt: theme.spacing(0.75),
              p: metrics.popoverPadding,
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.lg}px`,
              backgroundColor: theme.customTokens.surfaces.surface,
              boxShadow: "none",
            },
          },
        }}
      >
        <CalendarSurface
          month={month}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onShowMonths={() => setCalendarView("months")}
          onShowYears={() => setCalendarView("years")}
          size={size}
          view={calendarView}
        >
          {calendarView === "days" ? (
            <CalendarMonth
              month={month}
              onSelectDate={(day) => {
                onChange(startOfDay(day));
                setAnchorEl(null);
                setCalendarView("days");
              }}
              selectedDate={value}
              size={size}
            />
          ) : null}

          {calendarView === "months" ? (
            <CalendarMonthSelector
              month={month}
              onSelectMonth={(monthIndex) => {
                setMonth((current) => new Date(current.getFullYear(), monthIndex, 1));
                setCalendarView("days");
              }}
              size={size}
            />
          ) : null}

          {calendarView === "years" ? (
            <CalendarYearSelector
              month={month}
              onSelectYear={(year) => {
                setMonth((current) => new Date(year, current.getMonth(), 1));
                setCalendarView("months");
              }}
              size={size}
            />
          ) : null}
        </CalendarSurface>
      </Popover>
    </Stack>
  );
}
