import { Box, Stack, Typography } from "@mui/material";

import {
  ErpBreadcrumbs,
  type ErpBreadcrumbItem,
} from "../../components/navigation/ErpBreadcrumbs";

interface FeaturePlaceholderPageProps {
  breadcrumbs: ErpBreadcrumbItem[];
  title: string;
}

export function FeaturePlaceholderPage({
  breadcrumbs,
  title,
}: FeaturePlaceholderPageProps) {
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
          gap: theme.spacing(2),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
            pb: theme.spacing(2),
            borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
          })}
        >
          <ErpBreadcrumbs items={breadcrumbs} />

          <Typography variant="h2" color="text.primary">
            {title}
          </Typography>
        </Stack>
      </Stack>
    </Box>
  );
}
