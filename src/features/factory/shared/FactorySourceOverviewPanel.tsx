import type { ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

import {
  formFieldLabelSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";

export type FactorySourceOverviewItem = {
  label: string;
  value: ReactNode;
};

export function FactorySourceOverviewPanel({
  items,
  title = "Source Overview",
}: {
  items: readonly FactorySourceOverviewItem[];
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
        ...formSectionCardSx(theme),
      })}
    >
      <Stack spacing={1.5}>
        <FormSectionHeader title={title} />

        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(2),
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
          })}
        >
          {visibleItems.map((item) => (
            <Stack key={item.label} spacing={0.5} sx={{ minWidth: 0 }}>
              <Typography
                sx={(theme) => ({
                  ...formFieldLabelSx(theme),
                })}
              >
                {item.label}
              </Typography>
              <Typography
                sx={(theme) => ({
                  color: theme.customTokens.text.primary,
                  fontSize: "14px",
                  fontWeight: 400,
                  lineHeight: 1.45,
                  wordBreak: "break-word",
                })}
              >
                {item.value}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Stack>
    </Box>
  );
}
