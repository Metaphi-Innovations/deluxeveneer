import { Button, Chip, Stack, Typography, useTheme } from "@mui/material";
import { X } from "lucide-react";

import { formatActiveFilterChipLabel } from "./formatActiveFilterLabel";
import {
  isActiveColumnFilter,
  type ColumnFilterValue,
} from "./types";

export type ActiveColumnFilterChip = {
  columnKey: string;
  columnLabel: string;
  filter: ColumnFilterValue;
};

export function ActiveColumnFiltersBar({
  filters,
  onClearAll,
  onRemove,
}: {
  filters: readonly ActiveColumnFilterChip[];
  onClearAll: () => void;
  onRemove: (columnKey: string) => void;
}) {
  const theme = useTheme();
  const activeFilters = filters.filter((entry) =>
    isActiveColumnFilter(entry.filter),
  );

  if (activeFilters.length === 0) {
    return null;
  }

  return (
    <Stack
      direction="row"
      alignItems="center"
      flexWrap="wrap"
      useFlexGap
      spacing={1}
      sx={{
        py: 0.25,
      }}
    >
      <Typography
        sx={{
          color: theme.customTokens.text.secondary,
          fontSize: "13px",
          fontWeight: 500,
          mr: 0.25,
        }}
      >
        Filters:
      </Typography>

      {activeFilters.map((entry) => (
        <Chip
          key={entry.columnKey}
          label={formatActiveFilterChipLabel(entry.columnLabel, entry.filter)}
          onDelete={() => onRemove(entry.columnKey)}
          deleteIcon={<X size={14} />}
          size="small"
          sx={{
            height: 28,
            borderRadius: "8px",
            backgroundColor: theme.customTokens.navigation.activeBackground,
            color: theme.customTokens.navigation.activeText,
            border: `1px solid ${theme.customTokens.brand.primaryScale[200]}`,
            "& .MuiChip-label": {
              fontSize: "12.5px",
              fontWeight: 500,
              px: 1,
            },
            "& .MuiChip-deleteIcon": {
              color: theme.customTokens.navigation.activeText,
              mx: 0.5,
              "&:hover": {
                color: theme.customTokens.brand.primaryScale[800],
              },
            },
          }}
        />
      ))}

      <Button
        type="button"
        variant="text"
        onClick={onClearAll}
        sx={{
          minHeight: 28,
          px: 1,
          fontSize: "13px",
          fontWeight: 500,
          textTransform: "none",
          color: theme.customTokens.text.secondary,
          "&:hover": {
            backgroundColor: "transparent",
            color: theme.customTokens.brand.primary,
          },
        }}
      >
        Clear All
      </Button>
    </Stack>
  );
}

export function buildActiveFilterChips<TKey extends string>(
  filters: Partial<Record<TKey, ColumnFilterValue>>,
  columns: readonly { key: TKey; label: string }[],
): ActiveColumnFilterChip[] {
  const chips: ActiveColumnFilterChip[] = [];

  columns.forEach((column) => {
    const filter = filters[column.key];

    if (!isActiveColumnFilter(filter)) {
      return;
    }

    chips.push({
      columnKey: column.key,
      columnLabel: column.label,
      filter,
    });
  });

  return chips;
}
