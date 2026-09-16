import { createTheme } from "@mui/material/styles";

import { deluxeTokens } from "./tokens";
import {
  portalControlHeights,
  portalFontFamily,
  portalTypography,
} from "./typography";

const controlTextSx = {
  fontFamily: portalFontFamily,
  fontSize: portalTypography.control.fontSize,
  fontWeight: portalTypography.control.fontWeight,
  lineHeight: portalTypography.control.lineHeight,
} as const;

export const appTheme = createTheme({
  cssVariables: true,
  spacing: deluxeTokens.spacingUnit,
  shape: {
    borderRadius: deluxeTokens.radius.md,
  },
  palette: {
    mode: "light",
    primary: {
      main: deluxeTokens.brand.primary,
      light: deluxeTokens.brand.primaryScale[500],
      dark: deluxeTokens.brand.primaryScale[800],
      contrastText: deluxeTokens.colors.white,
    },
    secondary: {
      main: deluxeTokens.brand.secondary,
      light: deluxeTokens.brand.accent,
      dark: deluxeTokens.brand.primaryScale[700],
      contrastText: deluxeTokens.colors.white,
    },
    grey: deluxeTokens.neutrals,
    background: {
      default: deluxeTokens.surfaces.background,
      paper: deluxeTokens.surfaces.surface,
    },
    text: {
      primary: deluxeTokens.text.primary,
      secondary: deluxeTokens.text.secondary,
      disabled: deluxeTokens.text.disabled,
    },
    divider: deluxeTokens.borders.divider,
    success: {
      main: deluxeTokens.semantic.success,
      contrastText: deluxeTokens.colors.white,
    },
    warning: {
      main: deluxeTokens.semantic.warning,
      contrastText: deluxeTokens.colors.white,
    },
    error: {
      main: deluxeTokens.semantic.error,
      contrastText: deluxeTokens.colors.white,
    },
    info: {
      main: deluxeTokens.semantic.info,
      contrastText: deluxeTokens.colors.white,
    },
    action: {
      hover: deluxeTokens.navigation.hoverBackground,
      selected: deluxeTokens.navigation.activeBackground,
      focus: deluxeTokens.navigation.activeBackground,
      disabled: deluxeTokens.text.disabled,
      disabledBackground: deluxeTokens.navigation.hoverBackground,
    },
  },
  typography: {
    fontFamily: portalFontFamily,
    fontSize: 13,
    fontWeightLight: 400,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      ...deluxeTokens.typographyScale.h1,
      fontFamily: portalFontFamily,
    },
    h2: {
      ...deluxeTokens.typographyScale.h2,
      fontFamily: portalFontFamily,
    },
    h3: {
      ...deluxeTokens.typographyScale.h3,
      fontFamily: portalFontFamily,
    },
    h4: {
      fontSize: "16px",
      fontWeight: 600,
      lineHeight: 1.35,
      fontFamily: portalFontFamily,
    },
    h5: {
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: portalFontFamily,
    },
    h6: {
      fontSize: "14px",
      fontWeight: 600,
      lineHeight: 1.4,
      fontFamily: portalFontFamily,
    },
    body1: {
      ...deluxeTokens.typographyScale.body,
      fontFamily: portalFontFamily,
    },
    body2: {
      ...deluxeTokens.typographyScale.body,
      fontFamily: portalFontFamily,
    },
    subtitle1: {
      ...deluxeTokens.typographyScale.title,
      fontFamily: portalFontFamily,
    },
    subtitle2: {
      ...deluxeTokens.typographyScale.label,
      fontFamily: portalFontFamily,
    },
    caption: {
      ...deluxeTokens.typographyScale.caption,
      fontFamily: portalFontFamily,
    },
    overline: {
      fontSize: portalTypography.sectionTitle.fontSize,
      fontWeight: portalTypography.sectionTitle.fontWeight,
      lineHeight: portalTypography.sectionTitle.lineHeight,
      letterSpacing: portalTypography.sectionTitle.letterSpacing,
      textTransform: "uppercase",
      fontFamily: portalFontFamily,
    },
    button: {
      ...portalTypography.button,
      letterSpacing: "0.01em",
      textTransform: "none",
      fontFamily: portalFontFamily,
    },
  },
  shadows: deluxeTokens.shadows,
  navigation: deluxeTokens.themeNavigation,
  customTokens: {
    brand: deluxeTokens.brand,
    layout: deluxeTokens.layout,
    radius: deluxeTokens.radius,
    iconSizes: deluxeTokens.iconSizes,
    navigation: deluxeTokens.navigation,
    surfaces: deluxeTokens.surfaces,
    text: deluxeTokens.text,
    semantic: deluxeTokens.semantic,
    semanticScale: deluxeTokens.semanticScale,
    neutrals: deluxeTokens.neutrals,
    borders: deluxeTokens.borders,
    elevation: deluxeTokens.elevation,
    spacingScale: deluxeTokens.spacingScale,
    typographyScale: deluxeTokens.typographyScale,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        html: {
          minHeight: "100%",
        },
        body: {
          minHeight: "100%",
          backgroundColor: deluxeTokens.surfaces.background,
          fontFamily: portalFontFamily,
          fontSize: portalTypography.body.fontSize,
          fontWeight: portalTypography.body.fontWeight,
          lineHeight: portalTypography.body.lineHeight,
          WebkitFontSmoothing: "antialiased",
          MozOsxFontSmoothing: "grayscale",
        },
        "#root": {
          minHeight: "100dvh",
          fontFamily: portalFontFamily,
        },
        "input, textarea, select, button": {
          fontFamily: "inherit",
        },
        "input::placeholder, textarea::placeholder": {
          fontSize: portalTypography.placeholder.fontSize,
          fontWeight: portalTypography.placeholder.fontWeight,
          opacity: 1,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          h1: "h1",
          h2: "h2",
          h3: "h3",
        },
      },
      styleOverrides: {
        root: {
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiDrawer: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        paper: {
          backgroundColor: deluxeTokens.navigation.surface,
          backgroundImage: "none",
          borderRight: `1px solid ${deluxeTokens.borders.divider}`,
          boxShadow: "none",
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
        color: "inherit",
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderBottom: `1px solid ${deluxeTokens.borders.divider}`,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: deluxeTokens.radius.md,
          fontSize: portalTypography.sidebar.fontSize,
          fontWeight: portalTypography.sidebar.fontWeight,
          lineHeight: portalTypography.sidebar.lineHeight,
        },
      },
    },
    MuiListItemText: {
      styleOverrides: {
        primary: {
          fontSize: portalTypography.sidebar.fontSize,
          fontWeight: portalTypography.sidebar.fontWeight,
          lineHeight: portalTypography.sidebar.lineHeight,
        },
        secondary: {
          fontSize: portalTypography.helper.fontSize,
          fontWeight: portalTypography.helper.fontWeight,
          lineHeight: portalTypography.helper.lineHeight,
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          borderRadius: deluxeTokens.radius.md,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          ...portalTypography.button,
          fontFamily: portalFontFamily,
          alignItems: "center",
          display: "inline-flex",
          flex: "0 0 auto",
          justifyContent: "center",
          minHeight: portalControlHeights.button,
          height: portalControlHeights.button,
          minWidth: 0,
          width: "fit-content",
          maxWidth: "100%",
          paddingLeft: 14,
          paddingRight: 14,
          paddingTop: 0,
          paddingBottom: 0,
          borderRadius: "7px",
          boxShadow: "none",
          textAlign: "center",
          verticalAlign: "middle",
          textTransform: "none",
          whiteSpace: "nowrap",
          "&:hover": {
            boxShadow: "none",
          },
        },
        sizeSmall: {
          ...portalTypography.button,
          minHeight: portalControlHeights.dense,
          height: portalControlHeights.dense,
          paddingLeft: 11,
          paddingRight: 11,
          borderRadius: "7px",
          fontSize: "12.5px",
        },
        sizeMedium: {
          ...portalTypography.button,
          minHeight: portalControlHeights.button,
          height: portalControlHeights.button,
          paddingLeft: 14,
          paddingRight: 14,
        },
        sizeLarge: {
          ...portalTypography.button,
          minHeight: portalControlHeights.standard,
          height: portalControlHeights.standard,
          paddingLeft: 16,
          paddingRight: 16,
        },
        startIcon: {
          alignItems: "center",
          display: "inline-flex",
          lineHeight: 0,
          marginRight: "8px",
          marginLeft: 0,
          "& > *:nth-of-type(1)": {
            fontSize: 16,
          },
          "& svg": {
            width: 16,
            height: 16,
            strokeWidth: 2,
          },
        },
        endIcon: {
          alignItems: "center",
          display: "inline-flex",
          lineHeight: 0,
          marginLeft: "8px",
          marginRight: 0,
          "& > *:nth-of-type(1)": {
            fontSize: 16,
          },
          "& svg": {
            width: 16,
            height: 16,
            strokeWidth: 2,
          },
        },
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: {
          ...controlTextSx,
        },
        input: {
          ...controlTextSx,
          "&::placeholder": {
            fontSize: portalTypography.placeholder.fontSize,
            fontWeight: portalTypography.placeholder.fontWeight,
            opacity: 1,
          },
        },
        inputSizeSmall: {
          ...controlTextSx,
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          ...controlTextSx,
          minHeight: portalControlHeights.standard,
        },
        input: {
          ...controlTextSx,
          paddingTop: 0,
          paddingBottom: 0,
          height: "100%",
          boxSizing: "border-box",
        },
        sizeSmall: {
          minHeight: portalControlHeights.compact,
        },
      },
    },
    MuiFilledInput: {
      styleOverrides: {
        root: {
          ...controlTextSx,
          minHeight: portalControlHeights.standard,
        },
        input: {
          ...controlTextSx,
        },
      },
    },
    MuiInput: {
      styleOverrides: {
        root: {
          ...controlTextSx,
        },
        input: {
          ...controlTextSx,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "medium",
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          ...controlTextSx,
          minHeight: "unset",
          display: "flex",
          alignItems: "center",
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          ...controlTextSx,
          minHeight: portalControlHeights.standard,
        },
        input: {
          ...controlTextSx,
        },
        option: {
          ...controlTextSx,
          minHeight: 34,
        },
        groupLabel: {
          ...portalTypography.dropdownGroup,
          fontFamily: portalFontFamily,
          lineHeight: `${portalTypography.dropdownGroup.lineHeight}`,
        },
        noOptions: {
          ...controlTextSx,
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          ...controlTextSx,
          minHeight: 34,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          ...portalTypography.formLabel,
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          ...portalTypography.formLabel,
          fontFamily: portalFontFamily,
        },
        sizeSmall: {
          ...portalTypography.formLabel,
        },
      },
    },
    MuiFormHelperText: {
      styleOverrides: {
        root: {
          ...portalTypography.helper,
          fontFamily: portalFontFamily,
          marginLeft: 0,
        },
      },
    },
    MuiFormControlLabel: {
      styleOverrides: {
        label: {
          ...portalTypography.body,
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          ...portalTypography.tabs,
          fontFamily: portalFontFamily,
          textTransform: "none",
          minHeight: 35,
          paddingTop: 6,
          paddingBottom: 6,
          "&.Mui-selected": {
            fontWeight: 700,
          },
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          minHeight: 35,
        },
        indicator: {
          height: 2,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          fontFamily: portalFontFamily,
          fontSize: portalTypography.tableBody.fontSize,
          fontWeight: portalTypography.tableBody.fontWeight,
          lineHeight: portalTypography.tableBody.lineHeight,
        },
        head: {
          fontSize: portalTypography.tableHeader.fontSize,
          fontWeight: portalTypography.tableHeader.fontWeight,
          lineHeight: portalTypography.tableHeader.lineHeight,
        },
        body: {
          fontSize: portalTypography.tableBody.fontSize,
          fontWeight: portalTypography.tableBody.fontWeight,
          lineHeight: portalTypography.tableBody.lineHeight,
        },
      },
    },
    MuiTablePagination: {
      styleOverrides: {
        root: {
          ...controlTextSx,
        },
        selectLabel: {
          ...controlTextSx,
        },
        displayedRows: {
          ...controlTextSx,
        },
        select: {
          ...controlTextSx,
        },
        menuItem: {
          ...controlTextSx,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        label: {
          fontFamily: portalFontFamily,
          fontSize: portalTypography.helper.fontSize,
          fontWeight: 500,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          fontFamily: portalFontFamily,
          fontSize: "16px",
          fontWeight: 700,
          lineHeight: 1.3,
        },
      },
    },
    MuiDialogContentText: {
      styleOverrides: {
        root: {
          ...portalTypography.body,
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          ...portalTypography.helper,
          fontFamily: portalFontFamily,
        },
      },
    },
    MuiBreadcrumbs: {
      styleOverrides: {
        li: {
          fontFamily: portalFontFamily,
          fontSize: portalTypography.breadcrumb.fontSize,
          fontWeight: portalTypography.breadcrumb.fontWeight,
          lineHeight: portalTypography.breadcrumb.lineHeight,
        },
      },
    },
  },
});
