import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  InputAdornment,
  Popover,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Check, Search } from "lucide-react";

import { getCompactFieldSx } from "../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { getSelectDropdownOptionSx } from "./dropdownMenuStyles";

export type ColumnFilterOption = {
  value: string;
  label: string;
};

type SearchableMultiSelectColumnFilterProps = {
  anchorEl: HTMLElement | null;
  open: boolean;
  onClose: () => void;
  label: string;
  options: readonly ColumnFilterOption[];
  selectedValues: readonly string[];
  onApply: (values: string[]) => void;
  onClear: () => void;
  searchable?: boolean;
  searchPlaceholder?: string;
};

export function SearchableMultiSelectColumnFilter({
  anchorEl,
  open,
  onClose,
  label,
  options,
  selectedValues,
  onApply,
  onClear,
  searchable = true,
  searchPlaceholder,
}: SearchableMultiSelectColumnFilterProps) {
  const theme = useTheme();
  const [draftValues, setDraftValues] = useState<string[]>([...selectedValues]);
  const [searchValue, setSearchValue] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraftValues([...selectedValues]);
    setSearchValue("");
  }, [open, selectedValues]);

  const filteredOptions = useMemo(() => {
    const query = searchValue.trim().toLowerCase();

    if (!query) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(query),
    );
  }, [options, searchValue]);

  const allVisibleSelected =
    filteredOptions.length > 0 &&
    filteredOptions.every((option) => draftValues.includes(option.value));

  const someVisibleSelected =
    filteredOptions.some((option) => draftValues.includes(option.value)) &&
    !allVisibleSelected;

  const toggleValue = (value: string) => {
    setDraftValues((current) =>
      current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value],
    );
  };

  const handleSelectAllVisible = () => {
    if (allVisibleSelected) {
      const visibleSet = new Set(filteredOptions.map((option) => option.value));
      setDraftValues((current) =>
        current.filter((value) => !visibleSet.has(value)),
      );
      return;
    }

    setDraftValues((current) => {
      const next = new Set(current);
      filteredOptions.forEach((option) => next.add(option.value));
      return Array.from(next);
    });
  };

  const handleApply = () => {
    onApply(draftValues);
    onClose();
  };

  const handleClear = () => {
    setDraftValues([]);
    onClear();
    onClose();
  };

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      transformOrigin={{ vertical: "top", horizontal: "left" }}
      slotProps={{
        paper: {
          sx: {
            mt: 0.5,
            width: 260,
            minWidth: 240,
            maxWidth: `min(280px, calc(100vw - 24px))`,
            borderRadius: "8px",
            border: `1px solid ${theme.customTokens.borders.default}`,
            boxShadow: theme.customTokens.elevation.sm,
            overflow: "hidden",
          },
        },
      }}
    >
      <Stack>
        <Box sx={{ px: 1.25, pt: 1.25, pb: 1 }}>
          <TextField
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder={searchPlaceholder ?? "Search values..."}
            size="small"
            fullWidth
            autoFocus
            sx={[
              getCompactFieldSx(theme),
              {
                "& .MuiOutlinedInput-root": {
                  height: 36,
                  minHeight: 36,
                  borderRadius: "8px",
                },
              },
            ]}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search
                      size={16}
                      strokeWidth={2}
                      color={theme.customTokens.text.secondary}
                    />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Box>

        {filteredOptions.length > 0 ? (
          <Box
            component="button"
            type="button"
            onClick={handleSelectAllVisible}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              width: "100%",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              px: 1.5,
              minHeight: 33,
              height: 33,
              textAlign: "left",
              fontFamily: "inherit",
              borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
              "&:hover": {
                backgroundColor: theme.customTokens.surfaces.alt,
              },
            }}
          >
            <FilterCheckboxVisual
              checked={allVisibleSelected}
              indeterminate={someVisibleSelected}
            />
            <Typography
              sx={{
                fontSize: "13px",
                fontWeight: 500,
                color: theme.customTokens.text.secondary,
              }}
            >
              Select All
            </Typography>
          </Box>
        ) : null}

        <Box
          sx={{
            maxHeight: 240,
            overflowY: "auto",
            py: 0.35,
          }}
        >
          {filteredOptions.length === 0 ? (
            <Typography
              sx={{
                px: 1.5,
                py: 2,
                fontSize: "13px",
                color: theme.customTokens.text.secondary,
                textAlign: "center",
              }}
            >
              No options found.
            </Typography>
          ) : (
            filteredOptions.map((option) => {
              const selected = draftValues.includes(option.value);

              return (
                <Box
                  key={option.value === "" ? "__blank__" : option.value}
                  component="button"
                  type="button"
                  onClick={() => toggleValue(option.value)}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 1,
                    width: "100%",
                    border: "none",
                    cursor: "pointer",
                    px: 1.5,
                    minHeight: 33,
                    height: 33,
                    textAlign: "left",
                    fontFamily: "inherit",
                    backgroundColor: selected
                      ? theme.customTokens.brand.primaryScale[50]
                      : "transparent",
                    "&:hover": {
                      backgroundColor: selected
                        ? theme.customTokens.brand.primaryScale[50]
                        : theme.customTokens.surfaces.alt,
                    },
                  }}
                >
                  <FilterCheckboxVisual checked={selected} />
                  <Typography
                    title={option.label}
                    sx={{
                      ...getSelectDropdownOptionSx(theme, true),
                      px: 0,
                      py: 0,
                      fontSize: "13px",
                      fontWeight: selected ? 600 : 400,
                      color: selected
                        ? theme.customTokens.brand.primary
                        : theme.customTokens.text.primary,
                    }}
                  >
                    {option.label}
                  </Typography>
                </Box>
              );
            })
          )}
        </Box>

        <Stack
          direction="row"
          justifyContent="space-between"
          spacing={1}
          sx={{
            px: 1.25,
            py: 1,
            borderTop: `1px solid ${theme.customTokens.borders.divider}`,
          }}
        >
          <Button
            type="button"
            variant="text"
            onClick={handleClear}
            disabled={draftValues.length === 0 && selectedValues.length === 0}
            sx={{
              minHeight: 32,
              px: 1,
              fontSize: "13px",
              fontWeight: 500,
              color: theme.customTokens.text.secondary,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "transparent",
                color: theme.customTokens.brand.primary,
              },
            }}
          >
            Clear
          </Button>

          <Button
            type="button"
            variant="contained"
            onClick={handleApply}
            sx={{
              minHeight: 32,
              px: 1.75,
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 600,
              textTransform: "none",
              boxShadow: "none",
              backgroundColor: theme.customTokens.brand.primary,
              "&:hover": {
                boxShadow: "none",
                backgroundColor: theme.customTokens.brand.primaryScale[800],
              },
            }}
          >
            Apply
          </Button>
        </Stack>
      </Stack>
    </Popover>
  );
}

function FilterCheckboxVisual({
  checked,
  indeterminate = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
}) {
  const theme = useTheme();
  const selected = checked || indeterminate;

  return (
    <Box
      aria-hidden
      sx={{
        width: 16,
        height: 16,
        borderRadius: "4px",
        border: `1.5px solid ${
          selected
            ? theme.customTokens.brand.primary
            : theme.customTokens.borders.strong
        }`,
        backgroundColor: selected
          ? theme.customTokens.brand.primary
          : theme.customTokens.surfaces.surface,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#FFFFFF",
        flexShrink: 0,
      }}
    >
      {checked ? <Check size={11} strokeWidth={2.75} /> : null}
      {indeterminate && !checked ? (
        <Box
          sx={{
            width: 8,
            height: 2,
            borderRadius: 1,
            backgroundColor: "#FFFFFF",
          }}
        />
      ) : null}
    </Box>
  );
}
