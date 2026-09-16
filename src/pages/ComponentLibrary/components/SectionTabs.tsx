import { Box, Tab, Tabs } from "@mui/material";

type SectionTabsProps<TTab extends string> = {
  activeTab: TTab;
  tabs: ReadonlyArray<{
    label: string;
    value: TTab;
  }>;
  onChange: (value: TTab) => void;
};

export function SectionTabs<TTab extends string>({
  activeTab,
  tabs,
  onChange,
}: SectionTabsProps<TTab>) {
  return (
    <Box
      sx={(theme) => ({
        borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
      })}
    >
      <Tabs
        allowScrollButtonsMobile
        onChange={(_, value: TTab) => onChange(value)}
        scrollButtons="auto"
        value={activeTab}
        variant="scrollable"
        sx={(theme) => ({
          minHeight: theme.spacing(6.5),
          "& .MuiTabs-indicator": {
            height: 3,
            borderRadius: `${theme.customTokens.radius.pill}px ${theme.customTokens.radius.pill}px 0 0`,
            backgroundColor: theme.customTokens.navigation.activeIndicator,
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
              minHeight: theme.spacing(6.5),
              minWidth: "auto",
              px: theme.spacing(1.75),
              py: theme.spacing(1.25),
              mr: theme.spacing(2),
              color: theme.customTokens.navigation.inactiveText,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.subtitle2.fontSize,
              fontWeight: 700,
              lineHeight: theme.typography.subtitle2.lineHeight,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              transition: theme.transitions.create(["color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
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
