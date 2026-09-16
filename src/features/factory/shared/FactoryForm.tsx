import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import {
  MasterFormFields,
  MasterSectionCard,
  hasRequiredFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import {
  canAccessPermission,
  getFactoryPermissionKey,
} from "../../permissions";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { FactoryPageShell } from "./FactoryPageShell";
import {
  buildFactoryInitialValues,
  getFactoryPageSubtitle,
  getFactoryPageTitle,
  getFactoryPaths,
} from "./factoryUtils";
import { getFactoryIssuedWorkById, factoryIssuedWorkToRow } from "./factoryIssuedWorkStore";
import { getExistingGroupNo } from "./groupNoStore";
import { getCommonFactoryItemFieldDefinitions, commonFactoryItemFieldAliases } from "./factoryCommonItemFields";
import type {
  FactoryDefinition,
  FactoryFormSection,
  FactoryPageMode,
  FactoryRecord,
} from "./types";

const groupingExcludedFieldKeys = new Set([
  "orderDate",
  "orderNo",
  "orderItemNo",
  "customerName",
  "productName",
  "issuedFor",
]);

function sanitizeGroupingFormSections(
  sections: readonly FactoryFormSection[],
): FactoryFormSection[] {
  return sections.map((section) => ({
    ...section,
    fields: section.fields.filter(
      (field) => !groupingExcludedFieldKeys.has(field.key),
    ),
  }));
}

function withGroupNoField(
  sections: readonly FactoryFormSection[],
  row: FactoryRecord | undefined,
): FactoryFormSection[] {
  const groupNo = getExistingGroupNo(row as Record<string, unknown> | undefined);
  if (!groupNo) {
    return [...sections];
  }

  return sections.map((section, index) => {
    if (index !== 0) {
      return section;
    }

    if (section.fields.some((field) => field.key === "groupNo")) {
      return section;
    }

    return {
      ...section,
      fields: [
        {
          key: "groupNo",
          label: "Group No.",
          type: "text",
          readOnly: true,
        },
        ...section.fields,
      ],
    };
  });
}

interface FactoryFormProps<Row extends FactoryRecord> {
  definition: FactoryDefinition<Row>;
  mode: Exclude<FactoryPageMode, "list">;
}

export function FactoryForm<Row extends FactoryRecord>({
  definition,
  mode,
}: FactoryFormProps<Row>) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getFactoryPaths(definition.slug);
  const permissionKey = getFactoryPermissionKey(definition.slug);
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const canUseMode =
    (mode === "add" && canCreate) ||
    (mode === "edit" && canEdit) ||
    (mode === "view" && canView);

  const row =
    mode === "add"
      ? undefined
      : definition.rows.find((record) => record.id === params.id) ??
        (() => {
          const workItem = params.id
            ? getFactoryIssuedWorkById(params.id)
            : null;
          return workItem
            ? (factoryIssuedWorkToRow(workItem) as Row)
            : undefined;
        })();

  const formSections = useMemo(() => {
    let sections = [...definition.formSections];
    if (definition.slug === "grouping") {
      sections = sanitizeGroupingFormSections(sections);
    }
    return definition.slug === "marquetry"
      ? sections
      : withGroupNoField(sections, row);
  }, [definition.formSections, definition.slug, row]);

  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildFactoryInitialValues(formSections, row),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);

  useEffect(() => {
    setValues(buildFactoryInitialValues(formSections, row));
  }, [formSections, row]);

  const shouldShowItemTable =
    (mode === "view" || mode === "edit") && definition.slug !== "slicing";
  const itemTableFields = shouldShowItemTable
    ? definition.slug === "sawing"
      ? sawingItemTableFields
      : factoryItemTableFields
    : [];
  const visibleFormSections =
    shouldShowItemTable
      ? formSections.filter((section) => !isFactoryItemSection(section))
      : formSections;

  if ((mode === "edit" || mode === "view") && !row) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: paths.list },
          { label: "Not Found" },
        ]}
        title={definition.title}
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested factory process record could not be found in the mock dataset.
          </Typography>
        </MasterSectionCard>
      </FactoryPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: definition.title, to: paths.list },
          { label: mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View" },
        ]}
        title={getFactoryPageTitle(definition, mode)}
      >
        <Alert severity="warning">
          You do not have permission to {mode} this factory process.
        </Alert>
      </FactoryPageShell>
    );
  }

  const primaryLabel = mode === "add" ? "Save" : "Update";

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: definition.title, to: paths.list },
        { label: mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View" },
      ]}
      subtitle={getFactoryPageSubtitle(definition, mode)}
      title={getFactoryPageTitle(definition, mode)}
    >
      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          {visibleFormSections.map((section, sectionIndex) => (
            <Stack
              key={section.title}
              sx={(theme) => ({
                gap: theme.spacing(1.25),
              })}
            >
              <FormSectionHeader
                title={section.title}
                variant={sectionIndex === 0 ? "cardTop" : "nested"}
              />

              {section.description ? (
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.secondary,
                    fontSize: "12.5px",
                    fontWeight: 400,
                    lineHeight: 1.4,
                  })}
                >
                  {section.description}
                </Typography>
              ) : null}

              <MasterFormFields
                compact
                definition={{
                  gridColumns: 4,
                  fields: section.fields,
                }}
                onChange={(key, value) =>
                  setValues((current) => ({
                    ...current,
                    [key]: value,
                  }))
                }
                presentation={mode === "view" ? "details" : "form"}
                readOnly={mode === "view"}
                showRequiredErrors={mode === "add" && hasSubmitted}
                values={values}
              />
            </Stack>
          ))}

          {shouldShowItemTable && row && itemTableFields.length > 0 ? (
            <FactoryItemTable fields={itemTableFields} row={row} />
          ) : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              gap: theme.spacing(1),
              flexWrap: "wrap",
              pt: theme.spacing(0.5),
              borderTop: `1px solid ${theme.customTokens.borders.divider}`,
            })}
          >
            {mode === "view" ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeft size={16} />}
                  onClick={() => navigate(paths.list)}
                  sx={recordViewActionButtonSx}
                >
                  Back
                </Button>

                {canEdit ? (
                  <Button
                    variant="contained"
                    startIcon={<Pencil size={16} />}
                    sx={recordViewActionButtonSx}
                    onClick={() => {
                      if (row) {
                        navigate(paths.edit(row.id));
                      }
                    }}
                  >
                    Edit
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={() => navigate(paths.list)}
                  sx={recordFormActionButtonSx}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  startIcon={<Save size={16} />}
                  sx={recordFormActionButtonSx}
                  onClick={() => {
                    setHasSubmitted(true);
                    if (
                      mode === "add" &&
                      formSections.some((section) =>
                        hasRequiredFieldErrors(section.fields, values),
                      )
                    ) {
                      return;
                    }
                    navigate(paths.list);
                  }}
                >
                  {primaryLabel}
                </Button>
              </>
            )}
          </Box>
        </Stack>
      </MasterSectionCard>
    </FactoryPageShell>
  );
}

const factoryItemTableFields: readonly MasterFieldDefinition[] =
  getCommonFactoryItemFieldDefinitions();

const sawingItemTableFields: readonly MasterFieldDefinition[] = [
  { key: "itemName", label: "Item Name", type: "text" },
  { key: "itemSubCategory", label: "Sub Category", type: "text" },
  { key: "color", label: "Color", type: "text" },
  { key: "logNo", label: "Batch No", type: "text" },
  { key: "length", label: "Length", type: "text" },
  { key: "width", label: "Width", type: "text" },
  { key: "height", label: "Thickness", type: "text" },
  { key: "cbm", label: "CBM", type: "text" },
  { key: "cbf", label: "CBF", type: "text" },
  { key: "ratePerSqf", label: "Rate per CBF", type: "text" },
  { key: "amount", label: "Amount", type: "text" },
  { key: "remark", label: "Remark", type: "text" },
];

function isFactoryItemSection(section: FactoryFormSection) {
  return section.title.toLowerCase().includes("item");
}

function FactoryItemTable({
  fields,
  row,
}: {
  fields: readonly MasterFieldDefinition[];
  row: FactoryRecord;
}) {
  const tableWidth = fields.reduce(
    (total, field) => total + getFactoryItemColumnWidth(field.label),
    0,
  );

  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
      })}
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1.15),
        })}
      >
        <FormSectionHeader title="Item Details" />

        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.default}`,
            borderRadius: "8px",
            backgroundColor: theme.customTokens.surfaces.surface,
            overflow: "hidden",
          })}
        >
        <Box
          sx={(theme) => ({
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
          })}
        >
          <Table
            size="small"
            sx={{
              minWidth: Math.max(tableWidth, 720),
              tableLayout: "auto",
            }}
          >
            <TableHead>
              <TableRow>
                {fields.map((field) => (
                  <TableCell
                    key={field.key}
                    sx={(theme) => ({
                      minWidth: getFactoryItemColumnWidth(field.label),
                      backgroundColor: theme.customTokens.neutrals[100],
                      borderBottom: `1px solid ${theme.customTokens.borders.default}`,
                      borderRight: `1px solid ${theme.customTokens.borders.divider}`,
                      color: theme.customTokens.neutrals[700],
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      letterSpacing: "0.02em",
                      textTransform: "uppercase",
                      py: theme.spacing(0.85),
                      whiteSpace: "nowrap",
                    })}
                  >
                    {field.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                {fields.map((field) => (
                  <TableCell
                    key={field.key}
                    sx={(theme) => ({
                      borderBottom: `1px solid ${theme.customTokens.borders.default}`,
                      borderRight: `1px solid ${theme.customTokens.borders.default}`,
                      py: theme.spacing(1.25),
                      verticalAlign: "top",
                      whiteSpace: "nowrap",
                    })}
                  >
                    <Typography variant="body2" color="text.primary">
                      {formatFactoryItemValue(
                        resolveFactoryItemFieldValue(row, field.key),
                      )}
                    </Typography>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </Box>
      </Stack>
    </Box>
  );
}

function getFactoryItemColumnWidth(label: string) {
  return Math.max(120, Math.min(220, label.length * 10 + 56));
}

function resolveFactoryItemFieldValue(row: FactoryRecord, key: string) {
  const aliases = commonFactoryItemFieldAliases[key] ?? [key];

  for (const alias of aliases) {
    const value = row[alias];
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      return value;
    }
    if (typeof value === "number" && Number.isFinite(value)) {
      return String(value);
    }
  }

  return row[key];
}

function formatFactoryItemValue(value: FactoryRecord[string]) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (value === null || typeof value === "undefined" || value === "") {
    return "-";
  }

  return String(value);
}
