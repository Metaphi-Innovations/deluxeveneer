import { ChevronRight } from "lucide-react";
import { Breadcrumbs, Link, Typography, useTheme } from "@mui/material";
import { Link as RouterLink } from "react-router";

export interface ErpBreadcrumbItem {
  label: string;
  to?: string;
}

interface ErpBreadcrumbsProps {
  items: readonly ErpBreadcrumbItem[];
}

export function ErpBreadcrumbs({ items }: ErpBreadcrumbsProps) {
  const theme = useTheme();
  const breadcrumbToken = theme.navigation.breadcrumb.default;
  const itemTypographySx = {
    display: "inline-flex",
    alignItems: "center",
    fontSize: {
      xs: breadcrumbToken.mobileFontSize,
      md: breadcrumbToken.fontSize,
    },
    lineHeight: breadcrumbToken.lineHeight,
    letterSpacing: breadcrumbToken.letterSpacing,
  } as const;

  return (
    <Breadcrumbs
      aria-label="breadcrumb"
      separator={
        <ChevronRight
          size={breadcrumbToken.separatorSize}
          strokeWidth={breadcrumbToken.separatorStrokeWidth}
        />
      }
      sx={{
        "& .MuiBreadcrumbs-ol": {
          alignItems: "center",
          flexWrap: "wrap",
          rowGap: theme.spacing(0.5),
        },
        "& .MuiBreadcrumbs-separator": {
          color: breadcrumbToken.separatorColor,
          mx: theme.spacing(breadcrumbToken.separatorSpacing),
          display: "inline-flex",
          alignItems: "center",
        },
      }}
    >
      {items.map((item, index) => {
        const to = item.to;
        const isCurrent = index === items.length - 1 || !to;

        if (isCurrent) {
          return (
            <Typography
              key={`${item.label}-${index}`}
              component="span"
              sx={{
                ...itemTypographySx,
                color: index === items.length - 1
                  ? breadcrumbToken.currentColor
                  : breadcrumbToken.itemColor,
                fontWeight: index === items.length - 1
                  ? breadcrumbToken.currentFontWeight
                  : breadcrumbToken.itemFontWeight,
              }}
            >
              {item.label}
            </Typography>
          );
        }

        return (
          <Link
            key={`${item.label}-${index}`}
            component={RouterLink}
            to={to}
            underline="none"
            variant="inherit"
            sx={{
              ...itemTypographySx,
              color: breadcrumbToken.itemColor,
              fontWeight: breadcrumbToken.itemFontWeight,
              cursor: "pointer",
              transition: theme.transitions.create(["color"], {
                duration: theme.transitions.duration.shorter,
              }),
              "&:hover": {
                color: breadcrumbToken.currentColor,
                textDecoration: "none",
              },
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
}
