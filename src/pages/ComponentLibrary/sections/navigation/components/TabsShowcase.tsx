import { useState } from "react";
import { Box, Stack, Tab, Tabs, Typography } from "@mui/material";

import { NavigationShowcaseCard } from "./NavigationShowcaseCard";
import { NavigationStateTile } from "./NavigationStateTile";

const tabs = [
  { value: "general", label: "General" },
  { value: "details", label: "Details" },
  { value: "attachments", label: "Attachments" },
  { value: "history", label: "History" },
  { value: "approvals", label: "Approvals" },
  { value: "audit", label: "Audit" },
] as const;

function PreviewFrame({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={(theme) => ({
        width: "100%",
        border: `1px solid ${theme.customTokens.borders.light}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: theme.customTokens.surfaces.alt,
        p: theme.spacing(2),
      })}
    >
      {children}
    </Box>
  );
}

export function TabsShowcase() {
  const [defaultTab, setDefaultTab] = useState("general");
  const [activeTab, setActiveTab] = useState("details");
  const [disabledTab, setDisabledTab] = useState("history");
  const [scrollableTab, setScrollableTab] = useState("approvals");

  return (
    <NavigationShowcaseCard
      title="ERP Tabs"
      description="The reusable tab component for record detail pages, process stages, and supporting ERP sections."
      token="theme.navigation.tabs"
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(2.5),
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <NavigationStateTile
          title="Default"
          token="theme.navigation.tabs.default"
          note="Base tab row with neutral labels and default hover treatment."
        >
          <PreviewFrame>
            <Box
              sx={(theme) => ({
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
              })}
            >
              <Tabs
                allowScrollButtonsMobile
                onChange={(_, value: string) => setDefaultTab(value)}
                scrollButtons="auto"
                value={defaultTab}
                variant="scrollable"
                sx={(theme) => ({
                  minHeight: theme.spacing(6),
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: `${theme.customTokens.radius.pill}px ${theme.customTokens.radius.pill}px 0 0`,
                    backgroundColor: theme.customTokens.navigation.activeIndicator,
                  },
                })}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={`default-${tab.value}`}
                    disableRipple
                    label={tab.label}
                    value={tab.value}
                    sx={(theme) => ({
                      minHeight: theme.spacing(6),
                      minWidth: "auto",
                      px: theme.spacing(1.5),
                      py: theme.spacing(1.25),
                      color: theme.customTokens.navigation.inactiveText,
                      fontSize: theme.typography.subtitle2.fontSize,
                      fontWeight: 600,
                      lineHeight: theme.typography.subtitle2.lineHeight,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        color: theme.customTokens.navigation.activeText,
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                      "&.Mui-selected": {
                        color: theme.customTokens.navigation.activeText,
                      },
                    })}
                  />
                ))}
              </Tabs>
            </Box>
          </PreviewFrame>
        </NavigationStateTile>

        <NavigationStateTile
          title="Active"
          token="theme.navigation.tabs.active"
          note="Selected tab uses the maroon indicator and active text treatment."
        >
          <PreviewFrame>
            <Box
              sx={(theme) => ({
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
              })}
            >
              <Tabs
                allowScrollButtonsMobile
                onChange={(_, value: string) => setActiveTab(value)}
                scrollButtons="auto"
                value={activeTab}
                variant="scrollable"
                sx={(theme) => ({
                  minHeight: theme.spacing(6),
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: `${theme.customTokens.radius.pill}px ${theme.customTokens.radius.pill}px 0 0`,
                    backgroundColor: theme.customTokens.navigation.activeIndicator,
                  },
                })}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={`active-${tab.value}`}
                    disableRipple
                    label={tab.label}
                    value={tab.value}
                    sx={(theme) => ({
                      minHeight: theme.spacing(6),
                      minWidth: "auto",
                      px: theme.spacing(1.5),
                      py: theme.spacing(1.25),
                      color: theme.customTokens.navigation.inactiveText,
                      fontSize: theme.typography.subtitle2.fontSize,
                      fontWeight: 600,
                      lineHeight: theme.typography.subtitle2.lineHeight,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        color: theme.customTokens.navigation.activeText,
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                      "&.Mui-selected": {
                        color: theme.customTokens.navigation.activeText,
                      },
                    })}
                  />
                ))}
              </Tabs>
            </Box>
          </PreviewFrame>
        </NavigationStateTile>

        <NavigationStateTile
          title="Disabled"
          token="theme.navigation.tabs.disabled"
          note="Restricted or unavailable sections keep the disabled text state."
        >
          <PreviewFrame>
            <Box
              sx={(theme) => ({
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
              })}
            >
              <Tabs
                allowScrollButtonsMobile
                onChange={(_, value: string) => setDisabledTab(value)}
                scrollButtons="auto"
                value={disabledTab}
                variant="scrollable"
                sx={(theme) => ({
                  minHeight: theme.spacing(6),
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: `${theme.customTokens.radius.pill}px ${theme.customTokens.radius.pill}px 0 0`,
                    backgroundColor: theme.customTokens.navigation.activeIndicator,
                  },
                })}
              >
                {tabs.map((tab) => (
                  <Tab
                    key={`disabled-${tab.value}`}
                    disableRipple
                    disabled={tab.value === "audit"}
                    label={tab.label}
                    value={tab.value}
                    sx={(theme) => ({
                      minHeight: theme.spacing(6),
                      minWidth: "auto",
                      px: theme.spacing(1.5),
                      py: theme.spacing(1.25),
                      color: theme.customTokens.navigation.inactiveText,
                      fontSize: theme.typography.subtitle2.fontSize,
                      fontWeight: 600,
                      lineHeight: theme.typography.subtitle2.lineHeight,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        color: theme.customTokens.navigation.activeText,
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                      "&.Mui-selected": {
                        color: theme.customTokens.navigation.activeText,
                      },
                      "&.Mui-disabled": {
                        color: theme.customTokens.text.disabled,
                      },
                    })}
                  />
                ))}
              </Tabs>
            </Box>
          </PreviewFrame>
        </NavigationStateTile>

        <NavigationStateTile
          title="Scrollable"
          token="theme.navigation.tabs.scrollable"
          note="Long tab sets remain on a single line and scroll horizontally."
        >
          <PreviewFrame>
            <Box
              sx={(theme) => ({
                maxWidth: 460,
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
              })}
            >
              <Tabs
                allowScrollButtonsMobile
                onChange={(_, value: string) => setScrollableTab(value)}
                scrollButtons="auto"
                value={scrollableTab}
                variant="scrollable"
                sx={(theme) => ({
                  minHeight: theme.spacing(6),
                  "& .MuiTabs-indicator": {
                    height: 3,
                    borderRadius: `${theme.customTokens.radius.pill}px ${theme.customTokens.radius.pill}px 0 0`,
                    backgroundColor: theme.customTokens.navigation.activeIndicator,
                  },
                })}
              >
                {[
                  "General",
                  "Details",
                  "Attachments",
                  "History",
                  "Approvals",
                  "Audit",
                  "Commercial Notes",
                  "Supplier References",
                ].map((label) => (
                  <Tab
                    key={label}
                    disableRipple
                    label={label}
                    value={label.toLowerCase().replaceAll(" ", "-")}
                    sx={(theme) => ({
                      minHeight: theme.spacing(6),
                      minWidth: "auto",
                      px: theme.spacing(1.5),
                      py: theme.spacing(1.25),
                      color: theme.customTokens.navigation.inactiveText,
                      fontSize: theme.typography.subtitle2.fontSize,
                      fontWeight: 600,
                      textTransform: "none",
                      whiteSpace: "nowrap",
                      "&:hover": {
                        color: theme.customTokens.navigation.activeText,
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                      "&.Mui-selected": {
                        color: theme.customTokens.navigation.activeText,
                      },
                    })}
                  />
                ))}
              </Tabs>
            </Box>
          </PreviewFrame>
        </NavigationStateTile>
      </Box>
    </NavigationShowcaseCard>
  );
}
