import type { Theme } from "@mui/material/styles";

export function getErpSwitchSx(theme: Theme) {
  return {
    width: 42,
    height: 26,
    padding: 0,
    overflow: "hidden",
    "& .MuiSwitch-switchBase": {
      padding: 0,
      margin: 2,
      transitionDuration: "180ms",
      color: theme.customTokens.neutrals[400],
      "&.Mui-checked": {
        transform: "translateX(16px)",
        color: theme.customTokens.surfaces.surface,
        "& + .MuiSwitch-track": {
          backgroundColor: theme.customTokens.brand.primary,
          opacity: 1,
        },
      },
      "&.Mui-disabled + .MuiSwitch-track": {
        opacity: 0.58,
      },
    },
    "& .MuiSwitch-track": {
      height: "100%",
      backgroundColor: theme.customTokens.neutrals[300],
      borderRadius: 13,
      opacity: 1,
    },
    "& .MuiSwitch-thumb": {
      width: 22,
      height: 22,
      boxSizing: "border-box",
      display: "block",
      backgroundColor: theme.customTokens.surfaces.surface,
      borderRadius: "50%",
      boxShadow: "none",
    },
  };
}
