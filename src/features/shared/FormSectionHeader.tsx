import type { ReactNode } from "react";
import { Box, Typography } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import {
  Boxes,
  ClipboardList,
  CreditCard,
  FileCheck,
  FileText,
  Layers,
  MapPin,
  MessageSquare,
  Package,
  ShieldCheck,
  Truck,
  UserCheck,
} from "lucide-react";

import { portalTypography } from "../../theme/typography";

type FormSectionHeaderVariant = "cardTop" | "nested";

function resolveSectionHeaderIcon(title: string) {
  const t = title.toLowerCase();
  if (t.includes("account")) return ShieldCheck;
  if (t.includes("personal") || t.includes("user")) return UserCheck;
  if (t.includes("address") || t.includes("location") || t.includes("contact")) return MapPin;
  if (t.includes("document") || t.includes("identity") || t.includes("aadhaar") || t.includes("pan")) return FileCheck;
  if (t.includes("remark") || t.includes("note") || t.includes("comment")) return MessageSquare;
  if (t.includes("item") || t.includes("product") || t.includes("material")) return Package;
  if (t.includes("production") || t.includes("factory") || t.includes("process")) return Layers;
  if (t.includes("inward") || t.includes("dispatch") || t.includes("transport") || t.includes("truck")) return Truck;
  if (t.includes("charge") || t.includes("cost") || t.includes("price") || t.includes("billing")) return CreditCard;
  if (t.includes("summary") || t.includes("overview")) return ClipboardList;
  if (t.includes("stock") || t.includes("warehouse") || t.includes("inventory")) return Boxes;
  return FileText;
}

/** Compact light strip for form section titles (32–36px). */
export function formSectionHeaderBarSx(
  theme: Theme,
  variant: FormSectionHeaderVariant = "cardTop",
) {
  const isCardTop = variant === "cardTop";

  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 1,
    boxSizing: "border-box" as const,
    height: 34,
    minHeight: 34,
    maxHeight: 34,
    px: 1.5,
    // Bleed to section card edges (matches formSectionCardSx padding 1.75 / 1.5)
    mx: -1.75,
    mt: isCardTop ? -1.5 : 0,
    mb: 0,
    width: "auto",
    alignSelf: "stretch",
    backgroundColor: theme.customTokens.brand.primaryScale[50] || "#fcf4f5",
    borderBottom: `1px solid ${theme.customTokens.brand.primaryScale[100] || theme.customTokens.borders.default}`,
    borderTopLeftRadius: isCardTop ? "7px" : 0,
    borderTopRightRadius: isCardTop ? "7px" : 0,
    color: theme.customTokens.brand.primary,
  } as const;
}

export function formSectionHeaderTextSx(theme: Theme) {
  return {
    m: 0,
    color: theme.customTokens.brand.primary,
    fontSize: portalTypography.sectionTitle.fontSize,
    fontWeight: 700,
    letterSpacing: portalTypography.sectionTitle.letterSpacing,
    lineHeight: 1.2,
    textTransform: "uppercase" as const,
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  };
}

/** Replaces plain section title lines with a compact header strip. */
export function FormSectionHeader({
  title,
  icon: Icon,
  startAdornment,
  endAdornment,
  variant = "cardTop",
}: {
  title: string;
  icon?: any;
  startAdornment?: ReactNode;
  endAdornment?: ReactNode;
  variant?: FormSectionHeaderVariant;
}) {
  const EffectiveIcon = Icon || resolveSectionHeaderIcon(title);

  return (
    <Box
      sx={(theme) => ({
        ...formSectionHeaderBarSx(theme, variant),
      })}
    >
      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        {EffectiveIcon ? (
          <Box
            component="span"
            sx={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              lineHeight: 0,
            }}
          >
            {typeof EffectiveIcon === "function" || typeof EffectiveIcon === "object" ? (
              <EffectiveIcon size={15} strokeWidth={2.2} />
            ) : (
              EffectiveIcon
            )}
          </Box>
        ) : null}
        <Typography
          component="h3"
          sx={(theme) => ({
            ...formSectionHeaderTextSx(theme),
          })}
        >
          {title}
        </Typography>
        {startAdornment ? (
          <Box sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0, ml: 0.5 }}>
            {startAdornment}
          </Box>
        ) : null}
      </Box>
      {endAdornment ? (
        <Box sx={{ display: "inline-flex", alignItems: "center", flexShrink: 0 }}>
          {endAdornment}
        </Box>
      ) : null}
    </Box>
  );
}
