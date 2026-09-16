import type { PropsWithChildren, ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

type InputStateTileProps = PropsWithChildren<{
  note?: ReactNode | undefined;
  previewAlign?: "center" | "flex-start";
  sx?: SxProps<Theme> | undefined;
  token?: string | undefined;
  title: string;
}>;

export function InputStateTile({
  children,
  note,
  previewAlign = "flex-start",
  sx,
  token,
  title,
}: InputStateTileProps) {
  return (
    <Box
      sx={[
        (theme) => ({
          height: "100%",
          minWidth: 0,
        }),
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
    >
      <Stack
        sx={(theme) => ({
          height: "100%",
          gap: theme.spacing(1),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(0.25),
          })}
        >
          <Typography
            variant="subtitle2"
            color="text.primary"
            sx={(theme) => ({
              fontSize: theme.typography.subtitle2.fontSize,
            })}
          >
            {title}
          </Typography>

          {token ? (
            <Box
              sx={(theme) => ({
                width: "fit-content",
                border: `1px solid ${theme.customTokens.borders.light}`,
                borderRadius: `${theme.customTokens.radius.pill}px`,
                backgroundColor: theme.customTokens.neutrals[100],
                px: theme.spacing(1.25),
                py: theme.spacing(0.5),
              })}
            >
              <Typography
                component="code"
                color="text.secondary"
                sx={(theme) => ({
                  fontFamily: "monospace",
                  fontSize: "0.6875rem",
                  lineHeight: 1.4,
                  color: theme.customTokens.neutrals[700],
                })}
              >
                {token}
              </Typography>
            </Box>
          ) : null}

          {note ? (
            <Typography
              variant="caption"
              color="text.secondary"
              sx={(theme) => ({
                fontSize: theme.typography.caption.fontSize,
              })}
            >
              {note}
            </Typography>
          ) : null}
        </Stack>

        <Box
          sx={{
            display: "flex",
            flex: 1,
            alignItems: previewAlign,
            minWidth: 0,
          }}
        >
          {children}
        </Box>
      </Stack>
    </Box>
  );
}
