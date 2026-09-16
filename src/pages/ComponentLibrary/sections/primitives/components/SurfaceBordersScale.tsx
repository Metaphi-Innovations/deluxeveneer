import { Box, Stack, Typography, useTheme } from "@mui/material";

export function SurfaceBordersScale() {
  const theme = useTheme();

  const items = [
    {
      label: "Default Border",
      tokenName: "theme.customTokens.borders.default",
      color: theme.customTokens.borders.default,
      thickness: "1px",
      style: "solid",
    },
    {
      label: "Hover Border",
      tokenName: "theme.customTokens.borders.hover",
      color: theme.customTokens.borders.hover,
      thickness: "1px",
      style: "solid",
    },
    {
      label: "Focus Border",
      tokenName: "theme.customTokens.borders.focus",
      color: theme.customTokens.borders.focus,
      thickness: "2px",
      style: "solid",
    },
    {
      label: "Selected Border",
      tokenName: "theme.customTokens.borders.selected",
      color: theme.customTokens.borders.selected,
      thickness: "1px",
      style: "solid",
    },
    {
      label: "Divider",
      tokenName: "theme.customTokens.borders.divider",
      color: theme.customTokens.borders.divider,
      thickness: "1px",
      style: "solid",
    },
  ] as const;

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: theme.spacing(2),
        gridTemplateColumns: {
          xs: "repeat(1, minmax(0, 1fr))",
          sm: "repeat(2, minmax(0, 1fr))",
          xl: "repeat(5, minmax(0, 1fr))",
        },
      })}
    >
      {items.map((item) => (
        <Box
          key={item.tokenName}
          sx={(theme) => ({
            height: "100%",
            border: `1px solid ${theme.customTokens.borders.light}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.surfaces.alt,
            p: theme.spacing(2),
          })}
        >
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(1.5),
            })}
          >
            <Box
              sx={(theme) => ({
                minHeight: theme.spacing(8),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: `${theme.customTokens.radius.sm}px`,
                backgroundColor: theme.customTokens.surfaces.surface,
              })}
            >
              {item.label === "Divider" ? (
                <Box
                  sx={{
                    width: "100%",
                    borderTop: `${item.thickness} ${item.style} ${item.color}`,
                  }}
                />
              ) : (
                <Box
                  sx={(theme) => ({
                    width: theme.spacing(8),
                    height: theme.spacing(6),
                    borderRadius: `${theme.customTokens.radius.sm}px`,
                    backgroundColor: theme.customTokens.surfaces.surface,
                    border: `${item.thickness} ${item.style} ${item.color}`,
                  })}
                />
              )}
            </Box>

            <Stack
              sx={(theme) => ({
                gap: theme.spacing(0.5),
              })}
            >
              <Typography variant="subtitle2" color="text.primary">
                {item.label}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {item.thickness} {item.style}
              </Typography>

              <Typography variant="caption" color="text.secondary">
                {item.tokenName}
              </Typography>
            </Stack>
          </Stack>
        </Box>
      ))}
    </Box>
  );
}
