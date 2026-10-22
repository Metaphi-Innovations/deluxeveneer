import type { ReactNode } from "react";
import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  formSectionCardSx,
  FormSectionHeader,
  plainFormSectionHeadingSx,
} from "../../shared/formSectionStyles";
import {
  getDialogBodyCellSx,
  getDialogHeaderCellSx,
  getDialogScrollableTableSx,
} from "./listing/factoryListingParts";

export type FactorySourceOverviewItem = {
  label: string;
  value: ReactNode;
  wide?: boolean;
};

export function FactorySourceOverviewPanel({
  items,
  plain = false,
  title = "Source Overview",
}: {
  items: readonly FactorySourceOverviewItem[];
  plain?: boolean;
  title?: string;
}) {
  const visibleItems = items.filter((item) => {
    if (item.value === null || typeof item.value === "undefined") {
      return false;
    }

    if (typeof item.value === "string") {
      return item.value.trim().length > 0;
    }

    return true;
  });

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <Box
      sx={(theme) => ({
        ...(plain ? {} : formSectionCardSx(theme)),
      })}
    >
      <Stack spacing={1.5}>
        {plain ? (
          <Typography component="h2" sx={plainFormSectionHeadingSx}>
            {title}
          </Typography>
        ) : (
          <FormSectionHeader title={title} />
        )}
        <Box
          sx={(theme) =>
            plain
              ? {
                  backgroundColor: theme.customTokens.surfaces.surface,
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  overflow: "hidden",
                }
              : {}
          }
        >
          <Box sx={getDialogScrollableTableSx}>
            <Table size="small" sx={{ minWidth: "100%" }}>
              <TableHead>
                <TableRow>
                  {visibleItems.map((item) => (
                    <TableCell key={item.label} sx={getDialogHeaderCellSx}>
                      {item.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  {visibleItems.map((item) => (
                    <TableCell key={item.label} sx={getDialogBodyCellSx}>
                      {item.value}
                    </TableCell>
                  ))}
                </TableRow>
              </TableBody>
            </Table>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
