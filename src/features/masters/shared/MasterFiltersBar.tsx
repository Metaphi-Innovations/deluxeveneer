import { Box, Stack, Typography } from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import type { MasterFilterDefinition } from "./types";

interface MasterFiltersBarProps {
  filterValues: Record<string, string>;
  filters: MasterFilterDefinition[];
  onFilterChange: (key: string, value: string) => void;
  onSearchChange: (value: string) => void;
  searchValue: string;
}

export function MasterFiltersBar({
  filterValues,
  filters,
  onFilterChange,
  onSearchChange,
  searchValue,
}: MasterFiltersBarProps) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(2),
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "repeat(1, minmax(0, 1fr))",
            md: "minmax(0, 1.5fr) repeat(2, minmax(0, 1fr))",
            xl: "minmax(0, 1.75fr) repeat(3, minmax(0, 1fr))",
          },
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(0.75),
          })}
        >
          <Typography variant="subtitle2" color="text.primary">
            Search
          </Typography>

          <ClearableSearchField
            value={searchValue}
            onChange={onSearchChange}
            sx={{ width: "100%" }}
          />
        </Stack>

        {filters.map((filter) => (
          <Stack
            key={filter.key}
            sx={(theme) => ({
              gap: theme.spacing(0.75),
            })}
          >
            <Typography variant="subtitle2" color="text.primary">
              {filter.label}
            </Typography>

            <ErpSelectField
              onChange={(value) => onFilterChange(filter.key, value)}
              options={filter.options}
              value={filterValues[filter.key] ?? ""}
            />
          </Stack>
        ))}
      </Box>
    </Stack>
  );
}
