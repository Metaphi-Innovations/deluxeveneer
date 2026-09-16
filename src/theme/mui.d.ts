import "@mui/material/styles";

declare module "@mui/material/styles" {
  interface DeluxeTypographyScaleToken {
    fontSize: string;
    fontWeight: number;
    lineHeight: number;
    letterSpacing?: string;
  }

  interface DeluxeSpacingScaleToken {
    multiplier: number;
    tokenName: string;
    value: number;
  }

  interface DeluxeThemeTokens {
    brand: {
      accent: string;
      primary: string;
      primaryScale: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      secondary: string;
      secondaryScale: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
    };
    layout: {
      sidebarExpandedWidth: number;
      sidebarCollapsedWidth: number;
      mobileHeaderHeight: number;
    };
    radius: {
      sm: number;
      md: number;
      lg: number;
      xl: number;
      pill: number;
    };
    iconSizes: {
      sm: number;
      md: number;
    };
    navigation: {
      surface: string;
      activeBackground: string;
      hoverBackground: string;
      activeIndicator: string;
      activeText: string;
      inactiveText: string;
      indicatorWidth: number;
      sectionLabelColor: string;
    };
    surfaces: {
      background: string;
      surface: string;
      alt: string;
      paper: string;
    };
    text: {
      primary: string;
      secondary: string;
      disabled: string;
      inverse: string;
    };
    semantic: {
      success: string;
      warning: string;
      error: string;
      info: string;
    };
    semanticScale: {
      success: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      warning: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      error: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
      info: {
        50: string;
        100: string;
        200: string;
        300: string;
        400: string;
        500: string;
        600: string;
        700: string;
        800: string;
        900: string;
      };
    };
    neutrals: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
    borders: {
      default: string;
      hover: string;
      focus: string;
      selected: string;
      subtle: string;
      divider: string;
      light: string;
      strong: string;
    };
    elevation: {
      none: string;
      xs: string;
      sm: string;
      md: string;
      lg: string;
    };
    spacingScale: ReadonlyArray<DeluxeSpacingScaleToken>;
    typographyScale: {
      display: DeluxeTypographyScaleToken;
      h1: DeluxeTypographyScaleToken;
      h2: DeluxeTypographyScaleToken;
      h3: DeluxeTypographyScaleToken;
      title: DeluxeTypographyScaleToken;
      bodyLarge: DeluxeTypographyScaleToken;
      body: DeluxeTypographyScaleToken;
      caption: DeluxeTypographyScaleToken;
      label: DeluxeTypographyScaleToken;
    };
  }

  interface DeluxeNavigationTheme {
    breadcrumb: {
      default: {
        currentColor: string;
        currentFontWeight: number;
        itemColor: string;
        itemFontWeight: number;
        fontSize: string;
        mobileFontSize: string;
        lineHeight: number;
        letterSpacing: string;
        separatorColor: string;
        separatorSize: number;
        separatorStrokeWidth: number;
        separatorSpacing: number;
      };
    };
  }

  interface Theme {
    customTokens: DeluxeThemeTokens;
    navigation: DeluxeNavigationTheme;
  }

  interface ThemeOptions {
    customTokens?: Partial<DeluxeThemeTokens>;
    navigation?: Partial<DeluxeNavigationTheme>;
  }
}
