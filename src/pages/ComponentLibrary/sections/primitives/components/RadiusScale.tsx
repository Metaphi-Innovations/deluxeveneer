import { Box, Stack, Typography, useTheme } from "@mui/material";

export function RadiusScale() {
  const theme = useTheme();

  const items = [
    {
      label: "Small",
      tokenName: "theme.customTokens.radius.sm",
      value: theme.customTokens.radius.sm,
    },
    {
      label: "Medium",
      tokenName: "theme.customTokens.radius.md",
      value: theme.customTokens.radius.md,
    },
    {
      label: "Large",
      tokenName: "theme.customTokens.radius.lg",
      value: theme.customTokens.radius.lg,
    },
    {
      label: "Extra Large",
      tokenName: "theme.customTokens.radius.xl",
      value: theme.customTokens.radius.xl,
    },
    {
      label: "Pill",
      tokenName: "theme.customTokens.radius.pill",
      value: theme.customTokens.radius.pill,
    },
  ] as const;

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: theme.spacing(2),
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(5, minmax(0, 1fr))",
        },
      })}
    >
      {items.map((item) => (
        <Box
          key={item.tokenName}
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.light}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.surfaces.alt,
            p: theme.spacing(1.5),
          })}
        >
          <Stack
            alignItems="center"
            sx={(theme) => ({
              gap: theme.spacing(1.25),
            })}
          >
            <Box
              sx={(theme) => ({
                width: item.label === "Pill" ? theme.spacing(9) : theme.spacing(7),
                height: theme.spacing(5),
                borderRadius: `${item.value}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
                border: `1px solid ${theme.customTokens.borders.strong}`,
              })}
            />

            <Stack
              alignItems="center"
              sx={(theme) => ({
                gap: theme.spacing(0.5),
              })}
            >
              <Typography variant="subtitle2" color="text.primary">
                {item.label}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {item.value}px
              </Typography>

              <Typography
                align="center"
                variant="caption"
                color="text.secondary"
                sx={{
                  wordBreak: "break-word",
                }}
              >
                {item.tokenName}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
