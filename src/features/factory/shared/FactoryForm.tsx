
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
import { ChevronLeft, Save } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router";

import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";

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
import { FactorySourceOverviewPanel } from "./FactorySourceOverviewPanel";
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

  const location = useLocation();
  const locationRecord = (location.state as any)?.record as Row | undefined;

  const row =
    mode === "add"
      ? undefined
      : locationRecord ??
      definition.rows.find((record) => record.id === params.id) ??
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
      : definition.slug === "pressing"
        ? factoryItemTableFields.filter(
            (field) => field.key !== "ratePerSqf" && field.key !== "amount",
          )
        : definition.slug === "finishing"
          ? factoryItemTableFields.filter(
              (field) => field.key !== "ratePerSqf" && field.key !== "amount",
            )
          : definition.slug === "cnc-fluting"
          ? insertItemDetailField(
              factoryItemTableFields.filter(
                (field) =>
                  field.key !== "ratePerSqf" &&
                  field.key !== "amount" &&
                  field.key !== "sqm" &&
                  field.key !== "sqf",
              ),
              {
                key: "designCode",
                label: "Design Code",
                type: "text",
              },
              "itemSubCategory",
            )
          : definition.slug === "embossing"
            ? insertItemDetailField(
                factoryItemTableFields.filter(
                  (field) => field.key !== "sqm" && field.key !== "sqf",
                ),
                {
                  key: "structureCode",
                  label: "Structure Code",
                  type: "text",
                },
                "itemSubCategory",
              )
            : factoryItemTableFields
    : [];
  const visibleFormSections =
    shouldShowItemTable
      ? formSections.filter((section) => !isFactoryItemSection(section))
      : formSections;

  const [leaveConfirmation, setLeaveConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => undefined,
  });

  const [saveConfirmationOpen, setSaveConfirmationOpen] = useState(false);

  const handleBack = () => {
    setLeaveConfirmation({
      open: true,
      title: "Leave Form",
      description: "Are you sure you want to go back? Any unsaved changes will be lost.",
      action: () => navigate(paths.list),
    });
  };

  const handleCancel = () => {
    setLeaveConfirmation({
      open: true,
      title: "Cancel Changes",
      description: "Are you sure you want to cancel? Any unsaved changes will be lost.",
      action: () => navigate(paths.list),
    });
  };

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
      backNav={{
        label: `Back to ${definition.title}`,
        to: paths.list,
        onBack: handleBack,
      }}
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: definition.title, to: paths.list },
        { label: mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View" },
      ]}
      subtitle={getFactoryPageSubtitle(definition, mode)}
      title={getFactoryPageTitle(definition, mode)}
    >
      {mode === "view" ? (
        row ? (
          <FactoryRecordView definition={definition} onBack={handleBack} row={row} />
        ) : null
      ) : (
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
                presentation="form"
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
            <Button
              type="button"
              variant="outlined"
              onClick={handleCancel}
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
                setSaveConfirmationOpen(true);
              }}
            >
              {primaryLabel}
            </Button>
          </Box>
        </Stack>
      </MasterSectionCard>
      )}

      <ConfirmationDialog
        cancelLabel="Stay on Page"
        confirmLabel="Leave"
        description={leaveConfirmation.description}
        onClose={() => setLeaveConfirmation((c) => ({ ...c, open: false }))}
        onConfirm={() => {
          const act = leaveConfirmation.action;
          setLeaveConfirmation((c) => ({ ...c, open: false }));
          act();
        }}
        open={leaveConfirmation.open}
        title={leaveConfirmation.title}
        tone="default"
      />

      <ConfirmationDialog
        cancelLabel="Cancel"
        confirmLabel={primaryLabel}
        description={`Are you sure you want to ${primaryLabel.toLowerCase()} this factory record?`}
        onClose={() => setSaveConfirmationOpen(false)}
        onConfirm={() => {
          setSaveConfirmationOpen(false);
          const successMsg = `${definition.title} record ${mode === "add" ? "created" : "updated"} successfully.`;
          navigate(paths.list, {
            state: {
              factoryFlashMessage: successMsg,
            },
          });
        }}
        open={saveConfirmationOpen}
        title={`Confirm ${primaryLabel}`}
        tone="default"
      />
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
  { key: "remark", label: "Remark", type: "text" },
];

function insertItemDetailField(
  fields: readonly MasterFieldDefinition[],
  field: MasterFieldDefinition,
  afterKey: string,
) {
  if (fields.some((entry) => entry.key === field.key)) {
    return fields;
  }

  const insertAt = fields.findIndex((entry) => entry.key === afterKey);
  if (insertAt === -1) {
    return [...fields, field];
  }

  return [
    ...fields.slice(0, insertAt + 1),
    field,
    ...fields.slice(insertAt + 1),
  ];
}

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

const viewHiddenKeysBySlug: Record<string, readonly string[]> = {
  pressing: ["amount", "consumedAmount", "rate", "ratePerSqf"],
  "cnc-fluting": ["amount", "rate", "ratePerSqf"],
  embossing: ["amount", "rate", "ratePerSqf"],
  finishing: ["amount", "rate", "ratePerSqf"],
};

const extraViewFieldsBySlug: Record<string, readonly (readonly [string, string])[]> = {
  "cnc-fluting": [["designCode", "Design Code"]],
  embossing: [["structureCode", "Structure Code"]],
  finishing: [
    ["designCode", "Design Code"],
    ["finishingType", "Finishing Type"],
    ["structureCode", "Structure Code"],
  ],
  pressing: [
    ["for", "For"],
    ["purpose", "Purpose"],
    ["sampleNo", "Sample No"],
  ],
};

const viewItemKeys = new Set([
  "availableCbf",
  "availableCbm",
  "batchNo",
  "batchNoCode",
  "bundleNumber",
  "cbf",
  "cbm",
  "color",
  "cut",
  "cutColor",
  "designCode",
  "finishingType",
  "grade",
  "height",
  "itemName",
  "itemSubCategory",
  "length",
  "logNo",
  "noOfLeaves",
  "noOfSheets",
  "outputNoOfSheets",
  "palletNo",
  "productName",
  "receivedCbm",
  "sqf",
  "sqm",
  "structureCode",
  "subCategory",
  "thickness",
  "width",
]);

const viewHistoryKeys = new Set([
  "createdAt",
  "createdBy",
  "updatedAt",
  "updatedBy",
]);

const viewSkippedKeys = new Set([
  "doneId",
  "eventType",
  "id",
  "inventoryRecordId",
  "inventorySlug",
  "issueRemark",
  "listingState",
  "remark",
  "sourceIssueId",
  "workItemId",
]);

function FactoryRecordView<Row extends FactoryRecord>({
  definition,
  onBack,
  row,
}: {
  definition: FactoryDefinition<Row>;
  onBack: () => void;
  row: Row;
}) {
  const groups = buildFactoryViewGroups(definition, row);
  const remark = readFactoryViewValue(row, "remark");

  return (
    <Stack sx={(theme) => ({ gap: theme.spacing(2) })}>
      {groups.map((group) => (
        <FactorySourceOverviewPanel
          key={group.title}
          items={group.items}
          title={group.title}
        />
      ))}
      {remark ? (
        <FactorySourceOverviewPanel
          items={[{ label: "Remark", value: remark, wide: true }]}
          title="Remark"
        />
      ) : null}
      <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
        <Button
          onClick={onBack}
          startIcon={<ChevronLeft size={16} />}
          sx={recordViewActionButtonSx}
          variant="outlined"
        >
          Back
        </Button>
      </Box>
    </Stack>
  );
}

function buildFactoryViewGroups<Row extends FactoryRecord>(
  definition: FactoryDefinition<Row>,
  row: Row,
) {
  const hiddenKeys = new Set(viewHiddenKeysBySlug[definition.slug] ?? []);
  const seenKeys = new Set<string>();
  const seenLabels = new Set<string>();
  const processItems: Array<{ label: string; value: string }> = [];
  const itemItems: Array<{ label: string; value: string }> = [];
  const historyItems: Array<{ label: string; value: string }> = [];

  const push = (key: string, label: string) => {
    if (viewSkippedKeys.has(key) || hiddenKeys.has(key) || seenKeys.has(key)) {
      return;
    }

    const value = readFactoryViewValue(row, key);
    if (!value) {
      return;
    }

    const labelKey = label.trim().toLowerCase();
    if (seenLabels.has(labelKey)) {
      return;
    }

    seenKeys.add(key);
    seenLabels.add(labelKey);
    const item = { label, value };
    if (viewHistoryKeys.has(key)) {
      historyItems.push(item);
      return;
    }
    if (viewItemKeys.has(key)) {
      itemItems.push(item);
      return;
    }
    processItems.push(item);
  };

  definition.listColumns.forEach((column) => {
    push(String(column.key), column.label);
  });
  definition.formSections.forEach((section) => {
    section.fields.forEach((field) => {
      push(field.key, field.label);
    });
  });
  (extraViewFieldsBySlug[definition.slug] ?? []).forEach(([key, label]) => {
    push(key, label);
  });

  return [
    processItems.length > 0
      ? { title: "Process Details", items: processItems }
      : null,
    itemItems.length > 0 ? { title: "Item Details", items: itemItems } : null,
    historyItems.length > 0 ? { title: "Record History", items: historyItems } : null,
  ].filter((group): group is { title: string; items: Array<{ label: string; value: string }> } =>
    Boolean(group),
  );
}

function readFactoryViewValue(row: FactoryRecord, key: string) {
  const aliases = [
    key,
    ...(commonFactoryItemFieldAliases[key] ?? []),
    ...(factoryViewAliases[key] ?? []),
  ];
  const seen = new Set<string>();

  for (const alias of aliases) {
    if (seen.has(alias)) {
      continue;
    }
    seen.add(alias);
    const formatted = formatFactoryViewValue(row[alias]);
    if (formatted) {
      return formatted;
    }
  }

  return "";
}

const factoryViewAliases: Record<string, readonly string[]> = {
  availableCbm: ["availableCbm", "receivedCbm", "cbm"],
  batchNo: ["batchNo", "logNo", "logCode"],
  cbf: ["cbf", "availableCbf"],
  cbm: ["cbm", "availableCbm", "receivedCbm"],
  for: ["forLabel", "for", "purpose"],
  issuedDate: ["issuedDate", "issueDate", "processDate"],
  issuedFrom: ["issuedFrom", "sourceProcess"],
  itemSubCategory: ["itemSubCategory", "subCategory"],
  noOfSheets: [
    "noOfSheets",
    "issuedNoOfSheets",
    "outputNoOfSheets",
    "finishedSheets",
    "availableSheets",
  ],
  receivedCbm: ["receivedCbm", "cbm"],
  remark: ["remark", "issueRemark"],
  sqf: ["sqf", "issuedSqf", "outputSqf", "totalSqf", "availableSqf"],
  sqm: ["sqm", "issuedSqm", "outputSqm", "totalSqm", "totalSqMeter", "availableSqm"],
  storageSrNo: ["storageSrNo", "storageSerialNumber"],
  thickness: ["thickness", "height"],
  warehouseName: ["warehouseName", "storageWarehouseName", "destinationWarehouse"],
};

function formatFactoryViewValue(value: FactoryRecord[string]) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(value);
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  if (typeof value === "string" && value.trim() && value.trim() !== "-") {
    return value.trim();
  }

  return "";
}
