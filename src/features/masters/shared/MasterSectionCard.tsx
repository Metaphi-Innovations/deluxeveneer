import type { PropsWithChildren } from "react";
import { Box } from "@mui/material";

import { formSectionCardSx } from "../../shared/formSectionStyles";

/**
 * Shared form section surface used across Masters, Packing, Dispatch,
 * Orders view, Factory forms, User Management, etc.
 *
 * IMPORTANT: use string px radii — bare numbers in MUI `sx` multiply by
 * `theme.shape.borderRadius` and create giant pill-shaped cards.
 */
export function MasterSectionCard({ children }: PropsWithChildren) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      {children}
    </Box>
  );
}
