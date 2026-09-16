import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";

export function ContentContainer({ children }: PropsWithChildren) {
  return (
    <Box
      sx={(theme) => ({
        minHeight: {
          xs: theme.spacing(40),
          md: theme.spacing(48),
        },
        borderRadius: `${theme.customTokens.radius.lg}px`,
        backgroundColor: "background.paper",
        boxShadow: "none",
        p: { xs: theme.spacing(1.5), md: theme.spacing(2) },
      })}
    >
      {children}
    </Box>
  );
}
