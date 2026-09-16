/**
 * Portal-wide typography + control density standard.
 * Prefer these tokens over one-off fontSize/fontWeight in feature screens.
 */
export const portalFontFamily =
  '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
export const portalTypography = {
  pageTitle: {
    fontSize: "22px",
    fontWeight: 700,
    lineHeight: 1.2,
  },
  pageDescription: {
    fontSize: "12.5px",
    fontWeight: 400,
    lineHeight: 1.4,
  },
  sectionTitle: {
    fontSize: "13px",
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "0.03em",
  },
  formLabel: {
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  body: {
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: 1.4,
  },
  control: {
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: 1.35,
  },
  placeholder: {
    fontSize: "13px",
    fontWeight: 400,
  },
  tableHeader: {
    fontSize: "12px",
    fontWeight: 700,
    lineHeight: 1.3,
  },
  tableBody: {
    fontSize: "13px",
    fontWeight: 400,
    lineHeight: 1.35,
  },
  tableEmphasis: {
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: 1.35,
  },
  tabs: {
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  button: {
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.2,
  },
  breadcrumb: {
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.3,
  },
  sidebar: {
    fontSize: "13px",
    fontWeight: 500,
    lineHeight: 1.35,
  },
  helper: {
    fontSize: "12px",
    fontWeight: 400,
    lineHeight: 1.35,
  },
  emphasis: {
    fontSize: "13px",
    fontWeight: 600,
    lineHeight: 1.35,
  },
  dropdownGroup: {
    fontSize: "12px",
    fontWeight: 600,
    lineHeight: 1.3,
  },
} as const;
/** Standard interactive control heights (search, inputs, buttons). */
export const portalControlHeights = {
  standard: 36,
  compact: 36,
  dense: 33,
  button: 36,
} as const;
/** Table density targets (padding drives ~34–40px row height). */
export const portalTableDensity = {
  headerPy: 0.85,
  headerPx: 1.35,
  bodyPy: 0.85,
  bodyPx: 1.35,
  iconSize: 13,
} as const;
