import type { PropsWithChildren, ReactNode } from "react";
import { Box } from "@mui/material";

import {
  FormSectionHeader,
  formSectionCardSx,
} from "../../shared/formSectionStyles";

type DashboardSectionCardProps = PropsWithChildren<{
  title: string;
  endAdornment?: ReactNode;
  bodySx?: object;
}>;

/** Compact titled surface matching portal form section cards. */
export function DashboardSectionCard({
  title,
  endAdornment,
  children,
  bodySx,
}: DashboardSectionCardProps) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
        display: "flex",
        flexDirection: "column",
        minWidth: 0,
      })}
    >
      <FormSectionHeader endAdornment={endAdornment} title={title} />
      <Box
        sx={{
          pt: 1.25,
          minWidth: 0,
          ...bodySx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
