import { Box, Typography } from "@mui/material";

export function NavigationTokenBadge({ token }: { token: string }) {
  return (
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
  );
}
