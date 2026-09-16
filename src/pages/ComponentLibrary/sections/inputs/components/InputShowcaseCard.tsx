import type { PropsWithChildren, ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

type InputShowcaseCardProps = PropsWithChildren<{
  description: string;
  footer?: ReactNode | undefined;
  sx?: SxProps<Theme> | undefined;
  title: string;
  token?: string | undefined;
}>;

export function InputShowcaseCard({
  children,
  description,
  footer,
  sx,
  title,
  token,
}: InputShowcaseCardProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          height: "100%",
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          backgroundColor: theme.customTokens.surfaces.surface,
          p: theme.spacing(2.5),
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Stack
        sx={(theme) => ({
          height: "100%",
          gap: theme.spacing(2.5),
        })}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            gap: theme.spacing(1.5),
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
          })}
        >
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(0.5),
              maxWidth: 680,
            })}
          >
            <Typography variant="subtitle1" color="text.primary">
              {title}
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={(theme) => ({
                fontSize: theme.typography.subtitle2.fontSize,
              })}
            >
              {description}
            </Typography>
          </Stack>

          {token ? (
            <Box
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.light}`,
                borderRadius: `${theme.customTokens.radius.pill}px`,
                backgroundColor: theme.customTokens.surfaces.alt,
                px: theme.spacing(1.25),
                py: theme.spacing(0.5),
              })}
            >
              <Typography variant="caption" color="text.secondary">
                {token}
              </Typography>
            </Box>
          ) : null}
        </Box>

        {children}

        {footer ? (
          <Box
            sx={(theme) => ({
              borderTop: `1px solid ${theme.customTokens.borders.light}`,
              pt: theme.spacing(2),
            })}
          >
            {footer}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}
