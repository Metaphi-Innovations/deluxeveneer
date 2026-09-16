import { Box, Tab, Tabs } from "@mui/material";
import { portalTypography } from "../../theme/typography";
type ModuleProcessTab<TValue extends string> = {
  label: string;
  value: TValue;
};
interface ModuleProcessTabsProps<TValue extends string> {
  onChange: (value: TValue) => void;
  tabs: readonly ModuleProcessTab<TValue>[];
  value: TValue;
}
export function ModuleProcessTabs<TValue extends string>({
  onChange,
  tabs,
  value,
}: ModuleProcessTabsProps<TValue>) {
  return (
    <Box
      sx={(theme) => ({
        borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
        mx: 0,
        width: "100%",
      })}
    >
      <Tabs
        allowScrollButtonsMobile
        onChange={(_, nextValue: TValue) => onChange(nextValue)}
        scrollButtons="auto"
        value={value}
        variant="scrollable"
        sx={(theme) => ({
          minHeight: 35,
          "& .MuiTabs-indicator": {
            height: 2,
            borderRadius: 0,
            backgroundColor: theme.customTokens.navigation.activeIndicator,
          },
          "& .MuiTabs-flexContainer": {
            gap: 0,
          },
        })}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            disableRipple
            label={tab.label}
            value={tab.value}
            sx={(theme) => ({
              minHeight: 35,
              minWidth: "auto",
              px: theme.spacing(0.5),
              py: theme.spacing(0.75),
              mr: theme.spacing(3.5),
              borderRadius: 0,
              color: theme.customTokens.navigation.inactiveText,
              fontFamily: theme.typography.fontFamily,
              fontSize: portalTypography.tabs.fontSize,
              fontWeight: portalTypography.tabs.fontWeight,
              lineHeight: portalTypography.tabs.lineHeight,
              textTransform: "none",
              whiteSpace: "nowrap",
              transition: theme.transitions.create(["color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                backgroundColor: "transparent",
                color: theme.customTokens.navigation.activeText,
              },
              "&.Mui-selected": {
                color: theme.customTokens.navigation.activeText,
                fontWeight: 700,
              },
            })}
          />
        ))}
      </Tabs>
    </Box>
  );
}
