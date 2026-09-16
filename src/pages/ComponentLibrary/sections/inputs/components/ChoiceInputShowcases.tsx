import type { ReactNode } from "react";
import type { SxProps, Theme } from "@mui/material/styles";
import {
  Box,
  Checkbox,
  useTheme,
} from "@mui/material";

import { ErpToggleSwitch } from "../../../../../components/inputs/ErpToggleSwitch";
import { InputShowcaseCard } from "./InputShowcaseCard";
import { InputStateTile } from "./InputStateTile";

type ShowcaseProps = {
  sx?: SxProps<Theme>;
};

function CenteredControl({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {children}
    </Box>
  );
}

function getCheckboxSx(theme: Theme) {
  return {
    color: theme.customTokens.borders.strong,
    "& .MuiSvgIcon-root": {
      borderRadius: `${theme.customTokens.radius.sm}px`,
    },
    "&.Mui-checked": {
      color: theme.customTokens.brand.primary,
    },
    "&.MuiCheckbox-indeterminate": {
      color: theme.customTokens.brand.primary,
    },
    "&.Mui-focusVisible": {
      boxShadow: `0 0 0 3px ${theme.customTokens.navigation.activeBackground}`,
    },
    "&.Mui-disabled": {
      color: theme.palette.text.disabled,
    },
  };
}

export function CheckboxShowcase({ sx }: ShowcaseProps) {
  const theme = useTheme();

  return (
    <InputShowcaseCard
      sx={sx}
      title="Checkbox"
      description="Deluxe Veneers checkbox used for confirmations, approval flags, and optional ERP workflow controls."
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(5, minmax(0, 1fr))",
          },
        })}
      >
        <InputStateTile
          title="Unchecked"
          token="theme.components.checkbox.unchecked"
          previewAlign="center"
        >
          <CenteredControl>
            <Checkbox sx={getCheckboxSx(theme)} />
          </CenteredControl>
        </InputStateTile>

        <InputStateTile
          title="Checked"
          token="theme.components.checkbox.checked"
          previewAlign="center"
        >
          <CenteredControl>
            <Checkbox defaultChecked sx={getCheckboxSx(theme)} />
          </CenteredControl>
        </InputStateTile>

        <InputStateTile
          title="Indeterminate"
          token="theme.components.checkbox.indeterminate"
          previewAlign="center"
        >
          <CenteredControl>
            <Checkbox indeterminate sx={getCheckboxSx(theme)} />
          </CenteredControl>
        </InputStateTile>

        <InputStateTile
          title="Disabled"
          token="theme.components.checkbox.disabled"
          previewAlign="center"
        >
          <CenteredControl>
            <Checkbox disabled sx={getCheckboxSx(theme)} />
          </CenteredControl>
        </InputStateTile>

        <InputStateTile
          title="Disabled Checked"
          token="theme.components.checkbox.disabledChecked"
          previewAlign="center"
        >
          <CenteredControl>
            <Checkbox disabled checked sx={getCheckboxSx(theme)} />
          </CenteredControl>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}

export function SwitchShowcase({ sx }: ShowcaseProps) {
  const theme = useTheme();

  return (
    <InputShowcaseCard
      sx={sx}
      title="Toggle Switch"
      description="Deluxe Veneers switch for immediate ERP settings such as auto-allocation, alerts, and background behaviors."
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1.5),
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            xl: "repeat(4, minmax(0, 1fr))",
          },
        })}
      >
        <InputStateTile
          title="Off"
          token="theme.components.switch.off"
          previewAlign="center"
        >
          <CenteredControl>
            <ErpToggleSwitch checked={false} />
          </CenteredControl>
        </InputStateTile>

        <InputStateTile
          title="On"
          token="theme.components.switch.on"
          previewAlign="center"
        >
          <CenteredControl>
            <ErpToggleSwitch checked />
          </CenteredControl>
        </InputStateTile>
      </Box>
    </InputShowcaseCard>
  );
}
