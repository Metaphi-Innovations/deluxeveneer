import {
  Box,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  useTheme,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";

import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  formatSQF,
  formatSQM,
  parseNumericValue,
  sanitizeAmountInput,
  sanitizeAreaInput,
  SQM_TO_SQF,
} from "../../shared/numberFormat";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";

export type RejectAvailableValues = {
  amount: string;
  length: string;
  remark: string;
  sqf: string;
  sqm: string;
  thickness: string;
  type: string;
  width: string;
};

export type RejectAvailableKey = keyof RejectAvailableValues;

export type RejectAvailableAreaLimits = {
  issuedLength: number;
  issuedSqf: number;
  issuedSqm: number;
  issuedThickness: number;
  issuedWidth: number;
};

export type RejectAvailableValidationSeverity = "error" | "warning";

export type RejectAvailableValidationIssue = {
  message: string;
  severity: RejectAvailableValidationSeverity;
};

export type RejectAvailableValidationIssues = Partial<
  Record<RejectAvailableKey, RejectAvailableValidationIssue>
>;

type RejectAvailableColumn = {
  key: RejectAvailableKey;
  label: string;
  minWidth: number;
  options: readonly string[];
  type: "select" | "text";
};

const rejectAvailableColumns: readonly RejectAvailableColumn[] = [
  {
    key: "type",
    label: "Type",
    minWidth: 150,
    options: ["Reject", "Available"],
    type: "select",
  },
  {
    key: "length",
    label: "Length",
    minWidth: 150,
    options: [],
    type: "text",
  },
  {
    key: "width",
    label: "Width",
    minWidth: 150,
    options: [],
    type: "text",
  },
  {
    key: "thickness",
    label: "Thickness",
    minWidth: 150,
    options: [],
    type: "text",
  },
  {
    key: "sqm",
    label: "SQM",
    minWidth: 150,
    options: [],
    type: "text",
  },
  {
    key: "sqf",
    label: "SQF",
    minWidth: 150,
    options: [],
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    minWidth: 150,
    options: [],
    type: "text",
  },
  {
    key: "remark",
    label: "Remark",
    minWidth: 220,
    options: [],
    type: "text",
  },
] as const;

const areaSourceKeys = {
  sqf: [
    "sqf",
    "totalSqf",
    "availableSqf",
    "avSqf",
    "issuedSqf",
    "outputSqf",
    "consumedSqf",
    "consumeSqf",
    "finishedSqf",
  ],
  sqm: [
    "sqm",
    "totalSqm",
    "availableSqm",
    "avSqm",
    "issuedSqm",
    "outputSqm",
    "consumedSqm",
    "consumeSqm",
    "finishedSqm",
  ],
} as const;

const dimensionSourceKeys = {
  length: ["length"],
  thickness: ["height", "thickness", "thickess"],
  width: ["width"],
} as const;

const decimalFieldConfigs = {
  length: {
    label: "Length",
    limitKey: "issuedLength",
    limitLabel: "issued length",
  },
  sqf: {
    label: "SQF",
    limitKey: "issuedSqf",
    limitLabel: "issued SQF",
  },
  sqm: {
    label: "SQM",
    limitKey: "issuedSqm",
    limitLabel: "issued SQM",
  },
  thickness: {
    label: "Thickness",
    limitKey: "issuedThickness",
    limitLabel: "issued thickness",
  },
  width: {
    label: "Width",
    limitKey: "issuedWidth",
    limitLabel: "issued width",
  },
} as const;

const derivedAreaFieldKeys = new Set<RejectAvailableKey>(["sqm", "sqf"]);

export function RejectAvailableDetailsTable({
  fieldIssues,
  onChange,
  values,
}: {
  fieldIssues: RejectAvailableValidationIssues;
  onChange: (key: RejectAvailableKey, value: string) => void;
  values: RejectAvailableValues;
}) {
  const theme = useTheme();
  const tableWidth = rejectAvailableColumns.reduce(
    (total, column) => total + column.minWidth,
    0,
  );

  return (
    <Stack
      sx={(currentTheme) => ({
        ...formSectionCardSx(currentTheme),
        gap: currentTheme.spacing(1.5),
      })}
    >
      <FormSectionHeader title="Reject / Available Details" />
      <Box
        sx={{
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: "8px",
          backgroundColor: theme.customTokens.surfaces.surface,
          overflow: "hidden",
        }}
      >
        <Box sx={getScrollableTableSx(theme)}>
          <Table size="small" sx={{ minWidth: tableWidth, tableLayout: "auto" }}>
            <TableHead>
              <TableRow>
                {rejectAvailableColumns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={getHeaderCellSx(theme, column.minWidth)}
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {rejectAvailableColumns.map((column) => (
                  <TableCell key={column.key} sx={getBodyCellSx(theme)}>
                    {renderRejectAvailableField({
                      column,
                      issue: fieldIssues[column.key],
                      onChange,
                      theme,
                      value: values[column.key],
                    })}
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
    </Stack>
  );
}

export function createEmptyRejectAvailableValues(): RejectAvailableValues {
  return {
    amount: "",
    length: "",
    remark: "",
    sqf: "",
    sqm: "",
    thickness: "",
    type: "",
    width: "",
  };
}

export function getNextRejectAvailableValues(
  current: RejectAvailableValues,
  key: RejectAvailableKey,
  value: string,
): RejectAvailableValues {
  if (key === "amount") {
    return {
      ...current,
      amount: sanitizeAmountInput(value),
    };
  }

  if (key === "sqm" || key === "sqf") {
    return current;
  }

  if (key === "length" || key === "width" || key === "thickness") {
    return withDerivedRejectAvailableAreas({
      ...current,
      [key]: sanitizeDecimalValue(value, 3),
    });
  }

  return {
    ...current,
    [key]: value,
  };
}

export function getRejectAvailableValidationErrors(
  values: RejectAvailableValues,
  limits: RejectAvailableAreaLimits,
) {
  const issues: RejectAvailableValidationIssues = {};

  Object.entries(decimalFieldConfigs).forEach(([key, config]) => {
    const fieldKey = key as keyof typeof decimalFieldConfigs;
    const rawValue = values[fieldKey].trim();

    if (!rawValue) {
      return;
    }

    if (!isDecimalValue(rawValue)) {
      issues[fieldKey] = {
        message: `${config.label} must be a decimal value.`,
        severity: "error",
      };
      return;
    }

    const enteredValue = parseNumericValue(rawValue) ?? 0;
    const limitValue = limits[config.limitKey];

    if (limitValue > 0 && enteredValue > limitValue) {
      issues[fieldKey] = {
        message: `${config.label} exceeds ${config.limitLabel} (${formatLimitValue(fieldKey, limitValue)}).`,
        severity: "warning",
      };
    }
  });

  return issues;
}

export function resolveRejectAvailableAreaLimits(
  sourceRow: Record<string, unknown> | undefined,
  fallbackSqm = "",
  fallbackSqf = "",
  fallbackLength = "",
  fallbackWidth = "",
  fallbackThickness = "",
): RejectAvailableAreaLimits {
  const issuedLength =
    getFirstNumericValue(sourceRow, dimensionSourceKeys.length) ??
    parseNumericValue(fallbackLength) ??
    0;
  const issuedWidth =
    getFirstNumericValue(sourceRow, dimensionSourceKeys.width) ??
    parseNumericValue(fallbackWidth) ??
    0;
  const issuedThickness =
    getFirstNumericValue(sourceRow, dimensionSourceKeys.thickness) ??
    parseNumericValue(fallbackThickness) ??
    0;
  const issuedSqm =
    getFirstNumericValue(sourceRow, areaSourceKeys.sqm) ??
    parseNumericValue(fallbackSqm) ??
    0;
  const issuedSqf =
    getFirstNumericValue(sourceRow, areaSourceKeys.sqf) ??
    parseNumericValue(fallbackSqf) ??
    (issuedSqm > 0 ? issuedSqm * SQM_TO_SQF : 0);

  return {
    issuedLength,
    issuedSqf,
    issuedSqm,
    issuedThickness,
    issuedWidth,
  };
}

export function hasRejectAvailableValidationErrors(
  errors: RejectAvailableValidationIssues,
) {
  return Object.keys(errors).length > 0;
}

export function getVisibleRejectAvailableValidationIssues(
  issues: RejectAvailableValidationIssues,
  showErrors: boolean,
): RejectAvailableValidationIssues {
  if (showErrors) {
    return issues;
  }

  return Object.fromEntries(
    Object.entries(issues).filter(
      ([, issue]) => issue?.severity === "warning",
    ),
  ) as RejectAvailableValidationIssues;
}

function getFirstNumericValue(
  sourceRow: Record<string, unknown> | undefined,
  keys: readonly string[],
) {
  if (!sourceRow) {
    return null;
  }

  const sourceEntries = Object.entries(sourceRow);

  for (const key of keys) {
    const exactParsed = parseNumericValue(sourceRow[key]);

    if (exactParsed !== null) {
      return exactParsed;
    }

    const normalizedKey = normalizeSourceKey(key);
    const matchingEntry = sourceEntries.find(
      ([sourceKey]) => normalizeSourceKey(sourceKey) === normalizedKey,
    );
    const matchingParsed = parseNumericValue(matchingEntry?.[1]);

    if (matchingParsed !== null) {
      return matchingParsed;
    }
  }

  return null;
}

function normalizeSourceKey(key: string) {
  return key.replace(/[^a-z0-9]/giu, "").toLowerCase();
}

function renderRejectAvailableField({
  column,
  issue,
  onChange,
  theme,
  value,
}: {
  column: RejectAvailableColumn;
  issue: RejectAvailableValidationIssue | undefined;
  onChange: (key: RejectAvailableKey, value: string) => void;
  theme: Theme;
  value: string;
}) {
  const helperText = issue?.message ?? "";
  const isError = issue?.severity === "error";
  const isWarning = issue?.severity === "warning";
  const isDerivedAreaField = derivedAreaFieldKeys.has(column.key);

  if (column.type === "select") {
    return (
      <ErpSelectField
        onChange={(nextValue) => onChange(column.key, nextValue)}
        options={column.options}
        state="default"
        value={value}
      />
    );
  }

  return (
    <TextField
      error={Boolean(issue)}
      fullWidth
      helperText={helperText}
      inputProps={{ readOnly: isDerivedAreaField }}
      size="small"
      value={value}
      onChange={(event) => onChange(column.key, event.target.value)}
      sx={
        isWarning
          ? getWarningFieldSx(theme)
          : getCompactFieldSx(theme, isError ? "error" : "default")
      }
    />
  );
}

function isDecimalValue(value: string) {
  return /^\d+(?:\.\d+)?$/.test(value);
}

function sanitizeDecimalValue(raw: string, maxDecimals: number) {
  const cleaned = sanitizeAreaInput(raw);
  const [whole = "", fraction = ""] = cleaned.split(".");

  if (!cleaned.includes(".")) {
    return whole;
  }

  return `${whole}.${fraction.slice(0, maxDecimals)}`;
}

function withDerivedRejectAvailableAreas(
  values: RejectAvailableValues,
): RejectAvailableValues {
  const sqm = calculateRejectAvailableSqm(values);

  if (sqm <= 0) {
    return {
      ...values,
      sqf: "",
      sqm: "",
    };
  }

  return {
    ...values,
    sqf: formatDecimalInputValue(sqm * SQM_TO_SQF),
    sqm: formatDecimalInputValue(sqm),
  };
}

function calculateRejectAvailableSqm(values: RejectAvailableValues) {
  const length = parseNumericValue(values.length) ?? 0;
  const width = parseNumericValue(values.width) ?? 0;
  const thickness = parseNumericValue(values.thickness) ?? 0;

  if (length <= 0 || width <= 0 || thickness <= 0) {
    return 0;
  }

  return length * width * thickness;
}

function formatDecimalInputValue(value: number) {
  return value.toFixed(3).replace(/\.?0+$/u, "");
}

function formatLimitValue(
  key: keyof typeof decimalFieldConfigs,
  value: number,
) {
  if (key === "sqm") {
    return formatSQM(value);
  }

  if (key === "sqf") {
    return formatSQF(value);
  }

  return formatDecimalInputValue(value);
}

function getWarningFieldSx(theme: Theme) {
  return {
    ...getCompactFieldSx(theme, "default"),
    "& .MuiOutlinedInput-root": {
      ...getCompactFieldSx(theme, "default")["& .MuiOutlinedInput-root"],
      backgroundColor: theme.customTokens.semanticScale.error[50],
      "& fieldset": {
        borderColor: theme.palette.error.main,
        borderWidth: 1.5,
      },
      "&:hover fieldset": {
        borderColor: theme.palette.error.main,
      },
      "&.Mui-focused fieldset": {
        borderColor: theme.palette.error.main,
        borderWidth: 1.5,
      },
    },
    "& .MuiFormHelperText-root": {
      ...getCompactFieldSx(theme, "default")["& .MuiFormHelperText-root"],
      color: theme.palette.error.main,
    },
  } as const;
}

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
  } as const;
}

function getBodyCellSx(theme: Theme) {
  return {
    ...transactionTableBodyCellSx(theme),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
  } as const;
}

function getScrollableTableSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}
