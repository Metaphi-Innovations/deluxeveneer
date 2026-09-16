import { Factory, ShoppingCart } from "lucide-react";
import { Box, Button, Stack, Typography } from "@mui/material";

import { PageHeader } from "../../../../../components/navigation/PageHeader";
import { NavigationShowcaseCard } from "./NavigationShowcaseCard";

export function PageHeaderShowcase() {
  return (
    <NavigationShowcaseCard
      title="ERP Page Header"
      description="Portal-wide page header: icon + title + optional description. Create/Edit screens use a small back link instead of breadcrumb chains."
      token="PageHeader"
    >
      <Stack spacing={2.5}>
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "10px",
            backgroundColor: theme.customTokens.surfaces.surface,
            px: theme.spacing(2),
          })}
        >
          <PageHeader
            icon={Factory}
            subtitle="Track drying jobs and completed production."
            title="Drying"
          />
        </Box>

        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "10px",
            backgroundColor: theme.customTokens.surfaces.surface,
            px: theme.spacing(2),
          })}
        >
          <PageHeader
            actions={
              <Button variant="contained" size="small">
                Export
              </Button>
            }
            backNav={{ label: "Back to Orders", to: "/orders" }}
            icon={ShoppingCart}
            subtitle="Create a raw / non-finished material customer order."
            title="Create Raw Order"
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          Listing pages show a single title. Transactional pages show ← Back to
          parent above the title.
        </Typography>
      </Stack>
    </NavigationShowcaseCard>
  );
}
