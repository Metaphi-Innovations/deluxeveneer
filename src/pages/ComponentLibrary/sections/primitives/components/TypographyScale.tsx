import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";

export function TypographyScale() {
  const theme = useTheme();

  const samples = [
    {
      label: "Display",
      preview: "Deluxe Veneers ERP",
      tokenName: "theme.customTokens.typographyScale.display",
      value: theme.customTokens.typographyScale.display,
    },
    {
      label: "H1",
      preview: "Component Foundations",
      tokenName: "theme.typography.h1",
      value: theme.customTokens.typographyScale.h1,
    },
    {
      label: "H2",
      preview: "Enterprise Page Structure",
      tokenName: "theme.typography.h2",
      value: theme.customTokens.typographyScale.h2,
    },
    {
      label: "H3",
      preview: "Section Heading",
      tokenName: "theme.typography.h3",
      value: theme.customTokens.typographyScale.h3,
    },
    {
      label: "Title",
      preview: "Reusable component title",
      tokenName: "theme.typography.subtitle1",
      value: theme.customTokens.typographyScale.title,
    },
    {
      label: "Body Large",
      preview: "Primary reading copy for ERP layouts and product guidance.",
      tokenName: "theme.typography.body1",
      value: theme.customTokens.typographyScale.bodyLarge,
    },
    {
      label: "Body",
      preview: "Secondary supporting copy for interface descriptions and notes.",
      tokenName: "theme.typography.body2",
      value: theme.customTokens.typographyScale.body,
    },
    {
      label: "Caption",
      preview: "Token metadata and compact annotations.",
      tokenName: "theme.typography.caption",
      value: theme.customTokens.typographyScale.caption,
    },
    {
      label: "Label",
      preview: "FIELD LABEL",
      tokenName: "theme.typography.subtitle2",
      value: theme.customTokens.typographyScale.label,
    },
  ] as const;

  return (
    <TableContainer
      sx={(theme) => ({
        overflowX: "auto",
        border: `1px solid ${theme.customTokens.borders.light}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: theme.customTokens.surfaces.surface,
      })}
    >
      <Table size="small">
        <TableHead>
          <TableRow>
            {["Style", "Preview", "Font Size", "Weight", "Line Height", "Token"].map(
              (heading) => (
                <TableCell
                  key={heading}
                  sx={(theme) => ({
                    py: theme.spacing(1.25),
                    px: theme.spacing(1.5),
                    borderBottom: `1px solid ${theme.customTokens.borders.light}`,
                    color: "text.secondary",
                    fontSize: theme.typography.caption.fontSize,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  })}
                >
                  {heading}
                </TableCell>
              ),
            )}
          </TableRow>
        </TableHead>

        <TableBody>
          {samples.map((sample) => (
            <TableRow key={sample.label}>
              <TableCell
                sx={(theme) => ({
                  py: theme.spacing(1.5),
                  px: theme.spacing(1.5),
                  borderBottom: `1px solid ${theme.customTokens.borders.light}`,
                  whiteSpace: "nowrap",
                })}
              >
                <Typography variant="subtitle2" color="text.primary">
                  {sample.label}
                </Typography>
              </TableCell>

              <TableCell
                sx={(theme) => ({
                  py: theme.spacing(1.5),
                  px: theme.spacing(1.5),
                  borderBottom: `1px solid ${theme.customTokens.borders.light}`,
                  minWidth: 260,
                })}
              >
                <Typography
                  color="text.primary"
                  sx={{
                    fontFamily: theme.typography.fontFamily,
                    fontSize: sample.value.fontSize,
                    fontWeight: sample.value.fontWeight,
                    lineHeight: sample.value.lineHeight,
                    letterSpacing: sample.value.letterSpacing,
                  }}
                >
                  {sample.preview}
                </Typography>
              </TableCell>

              <DataCell value={sample.value.fontSize} />
              <DataCell value={String(sample.value.fontWeight)} />
              <DataCell value={String(sample.value.lineHeight)} />
              <DataCell value={sample.tokenName} wrap />
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

type DataCellProps = {
  value: string;
  wrap?: boolean;
};

function DataCell({ value, wrap = false }: DataCellProps) {
  return (
    <TableCell
      sx={(theme) => ({
        py: theme.spacing(1.5),
        px: theme.spacing(1.5),
        borderBottom: `1px solid ${theme.customTokens.borders.light}`,
        whiteSpace: wrap ? "normal" : "nowrap",
      })}
    >
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{
          wordBreak: wrap ? "break-word" : "normal",
        }}
      >
        {value}
      </Typography>
    </TableCell>
  );
}
