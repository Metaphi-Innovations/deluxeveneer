import type { SxProps, Theme } from "@mui/material/styles";
import { Box, ButtonBase, useTheme } from "@mui/material";

interface ErpToggleSwitchProps {
  ariaLabel?: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  sx?: SxProps<Theme>;
}

export function ErpToggleSwitch({
  ariaLabel,
  checked,
  disabled = false,
  onChange,
  sx,
}: ErpToggleSwitchProps) {
  const theme = useTheme();

  return (
    <ButtonBase
      aria-checked={checked}
      aria-label={ariaLabel}
      disableRipple
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onChange?.(!checked);
      }}
      role="switch"
      sx={[
        {
          position: "relative",
          display: "inline-flex",
          alignItems: "center",
          width: 36,
          minWidth: 36,
          height: 20,
          borderRadius: "999px",
          overflow: "hidden",
          backgroundColor: checked
            ? theme.customTokens.brand.primary
            : theme.customTokens.neutrals[300],
          opacity: disabled ? 0.58 : 1,
          transition: "background-color 180ms ease",
          "&.Mui-focusVisible": {
            boxShadow: `0 0 0 3px ${theme.customTokens.navigation.activeBackground}`,
          },
          "&:hover": {
            backgroundColor: checked
              ? theme.customTokens.brand.primary
              : theme.customTokens.neutrals[300],
          },
        },
        ...(Array.isArray(sx) ? sx : sx ? [sx] : []),
      ]}
      type="button"
    >
      <Box
        sx={{
          position: "absolute",
          top: "50%",
          left: 2,
          width: 16,
          height: 16,
          borderRadius: "50%",
          backgroundColor: theme.customTokens.surfaces.surface,
          transform: checked ? "translate(16px, -50%)" : "translate(0, -50%)",
          transition: "transform 180ms ease",
          boxShadow: "none",
        }}
      />
    </ButtonBase>
  );
}
