import type { PropsWithChildren, ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import { Box, Stack, Typography } from "@mui/material";

import { NavigationTokenBadge } from "./NavigationTokenBadge";

type NavigationStateTileProps = PropsWithChildren<{
  note?: ReactNode | undefined;
  previewAlign?: "center" | "flex-start";
  sx?: SxProps<Theme> | undefined;
  token?: string | undefined;
  title: string;
}>;

export function NavigationStateTile({
  children,
  note,
  previewAlign = "flex-start",
  sx,
  token,
  title,
}: NavigationStateTileProps) {
  return (
    <Box
      sx={[
        {
          height: "100%",
          minWidth: 0,
        },
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
          <Typography variant="subtitle2" color="text.primary">
            {title}
          </Typography>

          {token ? <NavigationTokenBadge token={token} /> : null}

          {note ? (
            <Typography variant="caption" color="text.secondary">
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
