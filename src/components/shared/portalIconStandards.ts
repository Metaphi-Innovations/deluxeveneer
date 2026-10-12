/**
 * Portal-wide Lucide icon + chrome sizing.
 * Prefer these tokens over one-off sizes so hierarchy stays consistent.
 */
export const portalIconStroke = {
  /** Default outline weight — slightly bold, not faint. */
  default: 2,
  /** Active / emphasized icons (filters, selected). */
  emphasis: 2.1,
  /** Filled-adjacent marks in sidebar. */
  filled: 1.95,
} as const;

export const portalIconSize = {
  /** Table sort / filter header icons */
  tableHeader: 14,
  /** Sidebar submodule / compact inline */
  sm: 14,
  /** Buttons, search, menus, 3-dot trigger, form adornments */
  md: 16,
  /** Sidebar parent / page title */
  lg: 18,
  /** Occasional large empty-state icons */
  xl: 20,
} as const;

export const portalIconGap = {
  /** Icon → label in action menus */
  menu: 1, // 8px
  /** Icon → label in buttons */
  button: 1, // 8px
  /** Icon → label in page title */
  pageTitle: 1, // 8px
  /** Icon → label in sidebar rows */
  sidebar: 1.25, // 10px
  /** Sort/filter icons beside table headers */
  tableHeader: 0.75, // 6px
} as const;

/** Compact sidebar row metrics (do not enlarge shell width). */
export const portalSidebarMetrics = {
  parentHeight: 40,
  childHeight: 34,
  parentPx: 1.5, // 12px
  childPl: "36px",
  chevronSize: 14,
  parentFontSize: "13.5px",
  childFontSize: "13px",
} as const;

/** Shared Lucide props helpers */
export const portalIconProps = {
  tableHeader: {
    size: portalIconSize.tableHeader,
    strokeWidth: portalIconStroke.default,
  },
  sm: {
    size: portalIconSize.sm,
    strokeWidth: portalIconStroke.default,
  },
  md: {
    size: portalIconSize.md,
    strokeWidth: portalIconStroke.default,
  },
  lg: {
    size: portalIconSize.lg,
    strokeWidth: portalIconStroke.default,
  },
} as const;
