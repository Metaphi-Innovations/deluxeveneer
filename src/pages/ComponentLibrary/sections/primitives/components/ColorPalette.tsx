import { Box, Stack, Tooltip, Typography, useTheme } from "@mui/material";

const shadeOrder = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

export function ColorPalette() {
  const theme = useTheme();

  const brandColors = [
    {
      label: "Maroon",
      tokenName: "theme.customTokens.brand.primary",
      value: normalizeHex(theme.customTokens.brand.primary),
    },
    {
      label: "Brick Red",
      tokenName: "theme.customTokens.brand.secondary",
      value: normalizeHex(theme.customTokens.brand.secondary),
    },
    {
      label: "Warm Cream",
      tokenName: "brand.reference.warmCream",
      value: "#FCF0C5",
    },
    {
      label: "White",
      tokenName: "theme.palette.common.white",
      value: normalizeHex(theme.palette.common.white),
    },
    {
      label: "Black",
      tokenName: "theme.palette.common.black",
      value: normalizeHex(theme.palette.common.black),
    },
  ] as const;

  const scaleRows = [
    {
      title: "Primary",
      tokenName: "theme.customTokens.brand.primaryScale",
      scale: theme.customTokens.brand.primaryScale,
    },
    {
      title: "Neutral",
      tokenName: "theme.customTokens.neutrals",
      scale: theme.customTokens.neutrals,
    },
    {
      title: "Success",
      tokenName: "theme.customTokens.semanticScale.success",
      scale: theme.customTokens.semanticScale.success,
    },
    {
      title: "Warning",
      tokenName: "theme.customTokens.semanticScale.warning",
      scale: theme.customTokens.semanticScale.warning,
    },
    {
      title: "Error",
      tokenName: "theme.customTokens.semanticScale.error",
      scale: theme.customTokens.semanticScale.error,
    },
    {
      title: "Info",
      tokenName: "theme.customTokens.semanticScale.info",
      scale: theme.customTokens.semanticScale.info,
    },
  ] as const;

  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(3),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <Typography variant="subtitle1" color="text.primary">
          Brand Colors
        </Typography>

        <Box
          sx={(theme) => ({
            display: "flex",
            gap: theme.spacing(1.5),
            flexWrap: "wrap",
          })}
        >
          {brandColors.map((color) => (
            <Tooltip
              key={color.tokenName}
              placement="top"
              title={
                <ColorTooltipContent
                  hexValue={color.value}
                  rgbValue={hexToRgb(color.value)}
                  title={color.label}
                  tokenName={color.tokenName}
                />
              }
              slotProps={{
                tooltip: {
                  sx: {
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    borderRadius: `${theme.customTokens.radius.md}px`,
                    backgroundColor: theme.customTokens.surfaces.surface,
                    color: theme.palette.text.primary,
                    px: theme.spacing(1.5),
                    py: theme.spacing(1.25),
                    boxShadow: "none",
                  },
                },
              }}
            >
              <Stack
                sx={(theme) => ({
                  width: {
                    xs: "calc(50% - 6px)",
                    sm: "auto",
                  },
                  minWidth: {
                    sm: theme.spacing(14),
                  },
                  gap: theme.spacing(1),
                })}
              >
                <Box
                  sx={(theme) => ({
                    width: theme.spacing(8),
                    height: theme.spacing(8),
                    borderRadius: `${theme.customTokens.radius.sm}px`,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    backgroundColor: color.value,
                    transition: theme.transitions.create(
                      ["border-color", "transform"],
                      {
                        duration: theme.transitions.duration.shorter,
                      },
                    ),
                    "&:hover": {
                      borderColor: theme.customTokens.navigation.activeText,
                      transform: "translateY(-1px)",
                    },
                  })}
                />

                <Stack
                  sx={(theme) => ({
                    gap: theme.spacing(0.25),
                  })}
                >
                  <Typography variant="subtitle2" color="text.primary">
                    {color.label}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    {color.value}
                  </Typography>
                </Stack>
              </Stack>
            </Tooltip>
          ))}
        </Box>
      </Stack>

      <Box
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.light}`,
          pt: theme.spacing(3),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(2),
          })}
        >
          <Typography variant="subtitle1" color="text.primary">
            Color Scales
          </Typography>

          <Stack
            sx={(theme) => ({
              gap: theme.spacing(3),
            })}
          >
            {scaleRows.map((row, index) => (
              <Box
                key={row.title}
                sx={(theme) => ({
                  pt: index === 0 ? 0 : theme.spacing(3),
                  borderTop:
                    index === 0
                      ? "none"
                      : `1px solid ${theme.customTokens.borders.light}`,
                })}
              >
                <Box
                  sx={(theme) => ({
                    display: "grid",
                    gap: theme.spacing(2),
                    gridTemplateColumns: {
                      xs: "1fr",
                      xl: "180px minmax(0, 1fr)",
                    },
                    alignItems: "start",
                  })}
                >
                  <Stack
                    sx={(theme) => ({
                      gap: theme.spacing(0.5),
                    })}
                  >
                    <Typography variant="subtitle1" color="text.primary">
                      {row.title}
                    </Typography>

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        lineHeight: 1.45,
                        overflowWrap: "anywhere",
                      }}
                    >
                      {row.tokenName}
                    </Typography>
                  </Stack>

                  <Box
                    sx={(theme) => ({
                      display: "grid",
                      gap: theme.spacing(1),
                      gridTemplateColumns: {
                        xs: "repeat(2, minmax(0, 1fr))",
                        sm: "repeat(5, minmax(0, 1fr))",
                        xl: "repeat(10, minmax(0, 1fr))",
                      },
                    })}
                  >
                    {shadeOrder.map((shade) => {
                      const hexValue = normalizeHex(row.scale[shade]);

                      return (
                        <Tooltip
                          key={`${row.title}-${shade}`}
                          placement="top"
                          title={
                            <ColorTooltipContent
                              hexValue={hexValue}
                              rgbValue={hexToRgb(hexValue)}
                              title={`${row.title} ${shade}`}
                              tokenName={`${row.tokenName}[${shade}]`}
                            />
                          }
                          slotProps={{
                            tooltip: {
                              sx: {
                                border: `1px solid ${theme.customTokens.borders.default}`,
                                borderRadius: `${theme.customTokens.radius.md}px`,
                                backgroundColor: theme.customTokens.surfaces.surface,
                                color: theme.palette.text.primary,
                                px: theme.spacing(1.5),
                                py: theme.spacing(1.25),
                                boxShadow: "none",
                              },
                            },
                          }}
                        >
                          <Stack
                            sx={(theme) => ({
                              gap: theme.spacing(0.75),
                              minWidth: 0,
                              cursor: "default",
                            })}
                          >
                            <Box
                              sx={(theme) => ({
                                height: theme.spacing(5.5),
                                borderRadius: `${theme.customTokens.radius.sm}px`,
                                border: `1px solid ${theme.customTokens.borders.default}`,
                                backgroundColor: hexValue,
                                transition: theme.transitions.create(
                                  ["border-color", "transform"],
                                  {
                                    duration: theme.transitions.duration.shorter,
                                  },
                                ),
                                "&:hover": {
                                  borderColor: theme.customTokens.navigation.activeText,
                                  transform: "translateY(-1px)",
                                },
                              })}
                            />

                            <Typography
                              variant="caption"
                              color="text.primary"
                              sx={{
                                fontWeight: 600,
                                lineHeight: 1.35,
                              }}
                            >
                              {shade}
                            </Typography>

                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{
                                lineHeight: 1.35,
                              }}
                            >
                              {hexValue}
                            </Typography>
                          </Stack>
                        </Tooltip>
                      );
                    })}
                  </Box>
                </Box>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Box>
    </Stack>
  );
}

type ColorTooltipContentProps = {
  hexValue: string;
  rgbValue: string;
  title: string;
  tokenName: string;
};

function ColorTooltipContent({
  hexValue,
  rgbValue,
  title,
  tokenName,
}: ColorTooltipContentProps) {
  return (
    <Stack spacing={0.5}>
      <Typography variant="subtitle2" color="text.primary">
        {title}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {hexValue}
      </Typography>

      <Typography variant="caption" color="text.secondary">
        {rgbValue}
      </Typography>

      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          overflowWrap: "anywhere",
        }}
      >
        {tokenName}
      </Typography>
    </Stack>
  );
}

function normalizeHex(value: string) {
  const hexValue = value.trim().toUpperCase();

  if (hexValue.length === 4) {
    return `#${hexValue[1]}${hexValue[1]}${hexValue[2]}${hexValue[2]}${hexValue[3]}${hexValue[3]}`;
  }

  return hexValue;
}

function hexToRgb(hexValue: string) {
  const sanitized = normalizeHex(hexValue).replace("#", "");
  const red = Number.parseInt(sanitized.slice(0, 2), 16);
  const green = Number.parseInt(sanitized.slice(2, 4), 16);
  const blue = Number.parseInt(sanitized.slice(4, 6), 16);

  return `rgb(${red}, ${green}, ${blue})`;
}
