import { useState } from "react";
import { ChevronRight } from "lucide-react";
import {
  Breadcrumbs,
  Box,
  Link,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";

import { NavigationShowcaseCard } from "./NavigationShowcaseCard";
import { NavigationStateTile } from "./NavigationStateTile";

type BreadcrumbPreviewProps = {
  items: string[];
  maxItems?: number | undefined;
  token: string;
  title: string;
  onNavigate: (value: string) => void;
};

function PreviewBlock({
  items,
  maxItems,
  onNavigate,
  token,
  title,
}: BreadcrumbPreviewProps) {
  const theme = useTheme();
  const breadcrumbToken = theme.navigation.breadcrumb.default;

  return (
    <NavigationStateTile
      title={title}
      token={token}
      note="Interactive breadcrumb trail using Deluxe Veneers navigation tokens."
    >
      <Box
        sx={(theme) => ({
          width: "100%",
          border: `1px solid ${theme.customTokens.borders.light}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          backgroundColor: theme.customTokens.surfaces.alt,
          p: theme.spacing(2),
        })}
      >
        <Breadcrumbs
          itemsAfterCollapse={2}
          itemsBeforeCollapse={1}
          maxItems={maxItems}
          separator={
            <ChevronRight
              size={14}
              style={{ opacity: 0.7 }}
            />
          }
          sx={(theme) => ({
            "& .MuiBreadcrumbs-separator": {
              color: theme.navigation.breadcrumb.default.separatorColor,
            },
          })}
        >
          {items.map((item, index) => {
            const isLast = index === items.length - 1;

            return isLast ? (
              <Typography
                key={item}
                variant="body2"
                sx={{
                  color: breadcrumbToken.currentColor,
                  fontWeight: breadcrumbToken.currentFontWeight,
                }}
              >
                {item}
              </Typography>
            ) : (
              <Link
                key={item}
                component="button"
                onClick={() => onNavigate(item)}
                type="button"
                underline="hover"
                variant="body2"
                sx={{
                  color: breadcrumbToken.itemColor,
                  fontWeight: breadcrumbToken.itemFontWeight,
                }}
              >
                {item}
              </Link>
            );
          })}
        </Breadcrumbs>
      </Box>
    </NavigationStateTile>
  );
}

export function BreadcrumbsShowcase() {
  const [lastVisited, setLastVisited] = useState("Inventory");

  return (
    <NavigationShowcaseCard
      title="ERP Breadcrumbs"
      description="Breadcrumb patterns for record creation flows, deep masters, and operational drill-down pages."
      token="theme.navigation.breadcrumb"
      footer={
        <Typography variant="caption" color="text.secondary">
          Last breadcrumb interaction: {lastVisited}
        </Typography>
      }
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(2),
          gridTemplateColumns: {
            xs: "1fr",
            xl: "repeat(2, minmax(0, 1fr))",
          },
        })}
      >
        <PreviewBlock
          title="Default"
          items={["Home", "Inventory", "Inward", "Create Entry"]}
          onNavigate={setLastVisited}
          token="theme.navigation.breadcrumb.default"
        />

        <PreviewBlock
          title="Long Path"
          items={[
            "Home",
            "Purchase",
            "Import Inward",
            "Supplier Invoice",
            "Veneer Batch Review",
            "Approval Summary",
          ]}
          onNavigate={setLastVisited}
          token="theme.navigation.breadcrumb.longPath"
        />

        <PreviewBlock
          title="Collapsed Breadcrumb"
          items={[
            "Home",
            "Factory",
            "Production",
            "Drying",
            "QC Review",
            "Batch 24-A",
            "Inspection Detail",
          ]}
          maxItems={3}
          onNavigate={setLastVisited}
          token="theme.navigation.breadcrumb.collapsed"
        />

        <PreviewBlock
          title="Clickable Links"
          items={["Home", "Masters", "Species", "Edit Species"]}
          onNavigate={setLastVisited}
          token="theme.navigation.breadcrumb.clickable"
        />
      </Box>
    </NavigationShowcaseCard>
  );
}
