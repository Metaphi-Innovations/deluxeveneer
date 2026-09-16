import type { PropsWithChildren, ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type TableShowcaseCardProps = PropsWithChildren<{
  description: string;
  footer?: ReactNode | undefined;
  title: string;
  token: string;
}>;

export function TableShowcaseCard({
  children,
  description,
  footer,
  title,
  token,
}: TableShowcaseCardProps) {
  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: theme.customTokens.surfaces.surface,
        p: theme.spacing(3),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: theme.spacing(2),
            flexWrap: "wrap",
          })}
        >
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(0.75),
              maxWidth: 760,
            })}
          >
            <Typography variant="h3" color="text.primary">
              {title}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Stack>

          <Box
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.light}`,
              borderRadius: `${theme.customTokens.radius.pill}px`,
              backgroundColor: theme.customTokens.surfaces.alt,
              px: theme.spacing(1.5),
              py: theme.spacing(0.75),
            })}
          >
            <Typography variant="caption" color="text.secondary">
              {token}
            </Typography>
          </Box>
        </Box>

        {children}

        {footer ? (
          <Box
            sx={(theme) => ({
              borderTop: `1px solid ${theme.customTokens.borders.light}`,
              pt: theme.spacing(2.5),
            })}
          >
            {footer}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}