import { useState } from "react";
import type { JSX } from "react";
import { Box, Stack } from "@mui/material";

import { ComponentLibraryHeader } from "./components/ComponentLibraryHeader";
import { ContentContainer } from "./components/ContentContainer";
import { SectionTabs } from "./components/SectionTabs";
import { DataDisplaySection } from "./sections/DataDisplaySection";
import { ERPSection } from "./sections/ERPSection";
import { FormsSection } from "./sections/FormsSection";
import { InputsSection } from "./sections/InputsSection";
import { NavigationSection } from "./sections/NavigationSection";
import { PrimitivesSection } from "./sections/PrimitivesSection";

type ComponentLibraryTab =
  | "primitives"
  | "forms"
  | "data-display"
  | "navigation"
  | "erp-patterns"
  | "colors";

const sectionRegistry = [
  {
    value: "primitives" as const,
    label: "Primitives",
    Component: InputsSection,
  },
  {
    value: "forms" as const,
    label: "Forms",
    Component: FormsSection,
  },
  {
    value: "data-display" as const,
    label: "Data Display",
    Component: DataDisplaySection,
  },
  {
    value: "navigation" as const,
    label: "Navigation",
    Component: NavigationSection,
  },
  {
    value: "erp-patterns" as const,
    label: "ERP Patterns",
    Component: ERPSection,
  },
  {
    value: "colors" as const,
    label: "Colors",
    Component: PrimitivesSection,
  },
] satisfies ReadonlyArray<{
  value: ComponentLibraryTab;
  label: string;
  Component: () => JSX.Element;
}>;

export function ComponentLibraryPage() {
  const [activeTab, setActiveTab] =
    useState<ComponentLibraryTab>("primitives");

  const activeSection =
    sectionRegistry.find((section) => section.value === activeTab) ??
    sectionRegistry[0]!;
  const ActiveSection = activeSection.Component;

  return (
    <Box
      sx={(theme) => ({
        minHeight: "100%",
        bgcolor: "background.paper",
        px: { xs: theme.spacing(2), md: theme.spacing(3) },
        py: { xs: theme.spacing(2), md: theme.spacing(3) },
      })}
    >
      <Stack
        sx={(theme) => ({
          width: "100%",
          gap: theme.spacing(2.5),
        })}
      >
        <ComponentLibraryHeader />

        <SectionTabs
          activeTab={activeTab}
          tabs={sectionRegistry.map(({ label, value }) => ({
            label,
            value,
          }))}
          onChange={setActiveTab}
        />

        <ContentContainer>
          <ActiveSection />
        </ContentContainer>
      </Stack>
    </Box>
  );
}
