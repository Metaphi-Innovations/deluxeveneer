import { Stack } from "@mui/material";

import { ColorPalette } from "./components/ColorPalette";
import { RadiusScale } from "./components/RadiusScale";
import { SectionCard } from "./components/SectionCard";
import { SpacingScale } from "./components/SpacingScale";
import { SurfaceBordersScale } from "./components/SurfaceBordersScale";
import { TypographyScale } from "./components/TypographyScale";

export function PrimitivesSection() {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(5),
      })}
    >
      <SectionCard
        description="Design tokens used throughout the Deluxe Veneers ERP interface."
        title="Colors"
      >
        <ColorPalette />
      </SectionCard>

      <SectionCard
        description="Typography styles for hierarchy, readability, and production-facing documentation."
        title="Typography"
      >
        <TypographyScale />
      </SectionCard>

      <SectionCard
        description="Spacing tokens built on the Deluxe Veneers 8-point system."
        title="Spacing"
      >
        <SpacingScale />
      </SectionCard>

      <SectionCard
        description="Radius tokens for surfaces, states, and reusable component framing."
        title="Border Radius"
      >
        <RadiusScale />
      </SectionCard>

      <SectionCard
        description="Border tokens used for structure, interaction states, and visual separation."
        title="Surface & Borders"
      >
        <SurfaceBordersScale />
      </SectionCard>
    </Stack>
  );
}
