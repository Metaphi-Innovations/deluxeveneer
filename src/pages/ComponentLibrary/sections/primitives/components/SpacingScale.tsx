import { Box, Stack, Typography, useTheme } from "@mui/material";

export function SpacingScale() {
  const theme = useTheme();

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: theme.spacing(2),
        gridAutoRows: "1fr",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          sm: "repeat(3, minmax(0, 1fr))",
          md: "repeat(5, minmax(0, 1fr))",
          xl: "repeat(10, minmax(0, 1fr))",
        },
      })}
    >
      {theme.customTokens.spacingScale.map((token) => (
        <Box
          key={token.tokenName}
          sx={(theme) => ({
            height: "100%",
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: `${theme.customTokens.radius.sm}px`,
            backgroundColor: theme.customTokens.surfaces.surface,
            p: theme.spacing(2),
          })}
        >
          <Stack
            alignItems="center"
            sx={(theme) => ({
              gap: theme.spacing(1.5),
            })}
          >
            <Box
              sx={(theme) => ({
                width: "100%",
                minHeight: theme.spacing(12),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              })}
            >
              <Box
                sx={(theme) => ({
                  width: `${Math.max(12, Math.round(token.value * 1.2))}px`,
                  height: `${Math.max(12, Math.round(token.value * 1.2))}px`,
                  minWidth: `${Math.max(12, Math.round(token.value * 1.2))}px`,
                  minHeight: `${Math.max(12, Math.round(token.value * 1.2))}px`,
                  borderRadius: `${theme.customTokens.radius.sm}px`,
                  backgroundColor: theme.customTokens.brand.primaryScale[100],
                  border: `1px solid ${theme.customTokens.brand.primaryScale[400]}`,
                })}
              />
            </Box>

            <Stack
              alignItems="center"
              sx={(theme) => ({
                gap: theme.spacing(0.5),
              })}
            >
              <Typography variant="subtitle2" color="text.primary">
                {token.value}px
              </Typography>

              <Typography
                align="center"
                variant="caption"
                color="text.secondary"
                sx={{
                  wordBreak: "break-word",
                }}
              >
                {token.tokenName}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
