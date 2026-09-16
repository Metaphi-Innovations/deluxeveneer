import type { PropsWithChildren } from "react";
import { Box, Stack, Typography } from "@mui/material";

type SectionCardProps = PropsWithChildren<{
  description: string;
  title: string;
}>;

export function SectionCard({
  children,
  description,
  title,
}: SectionCardProps) {
  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: `${theme.customTokens.radius.lg}px`,
        backgroundColor: theme.customTokens.surfaces.surface,
        p: { xs: theme.spacing(3), md: theme.spacing(4) },
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
          })}
        >
          <Typography variant="h3" color="text.primary">
            {title}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        </Stack>

        {children}
      </Stack>
    </Box>
  );
}
