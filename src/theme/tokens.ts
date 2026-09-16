import type { Shadows } from "@mui/material/styles";

import { portalFontFamily, portalTypography } from "./typography";

const brandPalette = {
  brandPrimary: "#741616",
  brandSecondary: "#A83F3F",
  warmIvory: "#FAF8F7",
  warmSurfaceAlt: "#FCFAFA",
  warmPaper: "#F5F1F1",
  white: "#FFFFFF",
  darkCharcoal: "#1F1F1F",
  mutedCharcoal: "#5B5555",
  disabledTaupe: "#8F8686",
  inverseText: "#F8F5F0",
  borderDefault: "#E5DDDD",
  divider: "#EFE7E7",
  lightNeutralGray: "#F5F1F1",
  strongNeutralGray: "#D2C7C7",
  successGreen: "#5E7A5A",
  warningAmber: "#B98A45",
  errorRose: "#AD655A",
  infoSlate: "#6F84A0",
  navActiveBackground: "#F5EAEA",
  navHoverBackground: "#F9F1F1",
} as const;

const neutralScale = {
  50: "#FCFAFA",
  100: "#F5F1F1",
  200: "#E5DDDD",
  300: "#D2C7C7",
  400: "#B5A6A6",
  500: "#968686",
  600: "#776A6A",
  700: "#5B5555",
  800: "#403B3B",
  900: "#1F1F1F",
} as const;

const primaryScale = {
  50: "#FCF7F7",
  100: "#F8ECEC",
  200: "#EBCFCF",
  300: "#DEAEAE",
  400: "#CC8686",
  500: "#B86060",
  600: "#A83F3F",
  700: "#741616",
  800: "#5D1010",
  900: "#420808",
} as const;

const secondaryScale = {
  50: "#FCF7F7",
  100: "#F8ECEC",
  200: "#F1D2D2",
  300: "#E7B0B0",
  400: "#D68585",
  500: "#C36060",
  600: "#A83F3F",
  700: "#883131",
  800: "#672323",
  900: "#471617",
} as const;

const semanticScale = {
  success: {
    50: "#F3FBF4",
    100: "#DDF3E0",
    200: "#BFE6C5",
    300: "#97D49C",
    400: "#6FC276",
    500: "#43A047",
    600: "#388E3C",
    700: "#2E7D32",
    800: "#256628",
    900: "#1B4D1F",
  },
  warning: {
    50: "#FFF9EB",
    100: "#FFF0C7",
    200: "#FFE08F",
    300: "#FFD05A",
    400: "#F4B942",
    500: "#D89A1E",
    600: "#C6861A",
    700: "#AA6E12",
    800: "#8C5B0E",
    900: "#6F470A",
  },
  error: {
    50: "#FDF2F2",
    100: "#FADDDD",
    200: "#F2BABA",
    300: "#E98D8D",
    400: "#DB6464",
    500: "#C94A4A",
    600: "#B34747",
    700: "#963939",
    800: "#742A2A",
    900: "#531C1C",
  },
  info: {
    50: "#F3F7FD",
    100: "#DFEAF9",
    200: "#BDD5F3",
    300: "#94BDEB",
    400: "#6D9FE0",
    500: "#4D82D4",
    600: "#3F6FA6",
    700: "#355D8A",
    800: "#294A6D",
    900: "#1D3552",
  },
} as const;

const elevationNone = "none";
const elevationXs =
  "0px 1px 2px rgba(45, 32, 18, 0.05), 0px 2px 4px rgba(45, 32, 18, 0.04)";
const elevationSm =
  "0px 2px 6px rgba(45, 32, 18, 0.06), 0px 6px 12px rgba(45, 32, 18, 0.05)";
const elevationMd =
  "0px 4px 10px rgba(45, 32, 18, 0.07), 0px 10px 20px rgba(45, 32, 18, 0.06)";
const elevationLg =
  "0px 8px 18px rgba(45, 32, 18, 0.08), 0px 16px 30px rgba(45, 32, 18, 0.07)";

const shadows: Shadows = [
  elevationNone,
  elevationXs,
  elevationSm,
  elevationMd,
  elevationLg,
  elevationLg,
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
  "none",
];

const typographyScale = {
  display: {
    fontSize: "2rem",
    fontWeight: 600,
    lineHeight: 1.2,
    letterSpacing: "-0.02em",
  },
  h1: {
    ...portalTypography.pageTitle,
  },
  h2: {
    fontSize: "18px",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  h3: {
    fontSize: "16px",
    fontWeight: 600,
    lineHeight: 1.35,
  },
  title: {
    ...portalTypography.emphasis,
  },
  bodyLarge: {
    ...portalTypography.body,
  },
  body: {
    ...portalTypography.body,
  },
  caption: {
    ...portalTypography.helper,
  },
  label: {
    ...portalTypography.formLabel,
  },
} as const;

const spacingScale = [
  { value: 4, multiplier: 0.5, tokenName: "theme.spacing(0.5)" },
  { value: 8, multiplier: 1, tokenName: "theme.spacing(1)" },
  { value: 12, multiplier: 1.5, tokenName: "theme.spacing(1.5)" },
  { value: 16, multiplier: 2, tokenName: "theme.spacing(2)" },
  { value: 20, multiplier: 2.5, tokenName: "theme.spacing(2.5)" },
  { value: 24, multiplier: 3, tokenName: "theme.spacing(3)" },
  { value: 32, multiplier: 4, tokenName: "theme.spacing(4)" },
  { value: 40, multiplier: 5, tokenName: "theme.spacing(5)" },
  { value: 48, multiplier: 6, tokenName: "theme.spacing(6)" },
  { value: 64, multiplier: 8, tokenName: "theme.spacing(8)" },
] as const;

const themeNavigation = {
  breadcrumb: {
    default: {
      currentColor: brandPalette.darkCharcoal,
      currentFontWeight: 600,
      itemColor: brandPalette.brandPrimary,
      itemFontWeight: 500,
      fontSize: portalTypography.breadcrumb.fontSize,
      mobileFontSize: portalTypography.breadcrumb.fontSize,
      lineHeight: portalTypography.breadcrumb.lineHeight,
      letterSpacing: "0",
      separatorColor: brandPalette.disabledTaupe,
      separatorSize: 16,
      separatorStrokeWidth: 2,
      separatorSpacing: 0.5,
    },
  },
} as const;

export const deluxeTokens = {
  colors: brandPalette,
  brand: {
    primary: brandPalette.brandPrimary,
    secondary: brandPalette.brandSecondary,
    accent: secondaryScale[200],
    primaryScale,
    secondaryScale,
  },
  spacingUnit: 8,
  radius: {
    sm: 8,
    md: 8,
    lg: 12,
    xl: 16,
    pill: 999,
  },
  layout: {
    sidebarExpandedWidth: 226,
    sidebarCollapsedWidth: 72,
    mobileHeaderHeight: 56,
  },
  iconSizes: {
    /** Form adornments, search, buttons */
    sm: 16,
    /** Page titles / sidebar parents */
    md: 18,
  },
  typography: {
    fontFamily: portalFontFamily,
  },
  navigation: {
    surface: brandPalette.warmSurfaceAlt,
    activeBackground: brandPalette.navActiveBackground,
    hoverBackground: brandPalette.navHoverBackground,
    activeIndicator: brandPalette.brandPrimary,
    activeText: brandPalette.brandPrimary,
    inactiveText: brandPalette.mutedCharcoal,
    indicatorWidth: 4,
    sectionLabelColor: neutralScale[600],
  },
  surfaces: {
    background: brandPalette.warmIvory,
    surface: brandPalette.white,
    alt: brandPalette.warmSurfaceAlt,
    paper: brandPalette.warmPaper,
  },
  text: {
    primary: brandPalette.darkCharcoal,
    secondary: brandPalette.mutedCharcoal,
    disabled: brandPalette.disabledTaupe,
    inverse: brandPalette.inverseText,
  },
  semantic: {
    success: brandPalette.successGreen,
    warning: brandPalette.warningAmber,
    error: brandPalette.errorRose,
    info: brandPalette.infoSlate,
  },
  semanticScale,
  neutrals: neutralScale,
  borders: {
    default: brandPalette.borderDefault,
    hover: neutralScale[300],
    focus: brandPalette.brandPrimary,
    selected: brandPalette.brandSecondary,
    subtle: brandPalette.borderDefault,
    divider: brandPalette.divider,
    light: brandPalette.lightNeutralGray,
    strong: brandPalette.strongNeutralGray,
  },
  elevation: {
    none: elevationNone,
    xs: elevationXs,
    sm: elevationSm,
    md: elevationMd,
    lg: elevationLg,
  },
  themeNavigation,
  spacingScale,
  typographyScale,
  shadows,
} as const;
