import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Button, Snackbar, Stack, Typography } from "@mui/material";
import { ChevronLeft, Clock, FileText, Pencil, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import {
  canAccessPermission,
  getMasterPermissionKey,
} from "../../permissions";
import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import { ContentLoader } from "../../../components/feedback/ContentLoader";
import { MasterFormFields, hasFormFieldErrors } from "./MasterFormFields";
import { MasterPageShell } from "./MasterPageShell";
import { MasterSectionCard } from "./MasterSectionCard";
import {
  mastersFormOutlinedButtonSx,
  mastersFormPrimaryButtonSx,
  mastersFormSectionCardSx,
} from "./mastersFormStyles";
import { FormSectionHeader } from "../../shared/formSectionStyles";
import {
  buildLocalMasterDefinition,
  createLocalMasterRecord,
  updateLocalMasterRecord,
} from "./localMasterStore";
import type {
  MasterDefinition,
  MasterFieldDefinition,
  MasterFieldValue,
  MasterRecord,
} from "./types";
import {
  buildMasterInitialValues,
  getMasterPageTitle,
  getMasterPaths,
} from "./utils";
import { getMasterApiErrorMessage } from "./getMasterApiErrorMessage";

interface MasterFormPageProps {
  additionalValues?: Record<string, MasterFieldValue> | undefined;
  afterFields?: ReactNode;
  beforeSave?: () => boolean;
  cancelTo?: string;
  definition: MasterDefinition;
  errorMessage?: string;
  fieldActions?: Partial<Record<string, ReactNode>> | undefined;
  loading?: boolean;
  mode: "add" | "edit" | "view";
  renderFields?: ((context: {
    definition: MasterDefinition;
    values: Record<string, MasterFieldValue>;
    onChange: (key: string, value: MasterFieldValue) => void;
    readOnly: boolean;
    showRequiredErrors: boolean;
    hasSubmitted: boolean;
  }) => ReactNode) | undefined;
  /** When provided, used instead of looking up the row from local mock store. */
  record?: MasterRecord;
  onFieldChange?: (key: string, value: MasterFieldValue) => void;
  onSave?: (context: {
    definition: MasterDefinition;
    mode: "add" | "edit";
    row?: MasterRecord;
    values: Record<string, MasterFieldValue>;
  }) => void | Promise<void>;
}

const remarkField: MasterFieldDefinition = {
  key: "remark",
  label: "Remark",
  type: "text",
};

function hasRemarkField(fields: readonly MasterFieldDefinition[]) {
  return fields.some((field) => {
    const key = field.key.toLowerCase();
    const label = field.label.toLowerCase();

    return key === "remark" || key === "remarks" || label === "remark";
  });
}

function getAutoFillMatchCandidates(matchKey: string, row: MasterRecord) {
  const primary = row[matchKey];

  if (matchKey === "categoryName" || matchKey === "category" || matchKey === "name") {
    return [primary, row.categoryName, row.category, row.name];
  }

  if (matchKey === "hsnCode" || matchKey === "hsn" || matchKey === "code") {
    return [primary, row.hsnCode, row.code, row.hsn];
  }

  return [primary];
}

function findAutoFillRow(
  rows: MasterRecord[],
  matchKey: string,
  value: string,
) {
  const normalized = value.trim().toLowerCase();

  if (!normalized) {
    return undefined;
  }

  return rows.find((row) =>
    getAutoFillMatchCandidates(matchKey, row).some(
      (candidate) => String(candidate ?? "").trim().toLowerCase() === normalized,
    ),
  );
}

function resolveAutoFillValue(
  rows: MasterRecord[],
  matchKey: string,
  valueKey: string,
  value: string,
) {
  const matchedRow = findAutoFillRow(rows, matchKey, value);
  const resolved = matchedRow ? String(matchedRow[valueKey] ?? "").trim() : "";

  if (resolved || !matchedRow) {
    return resolved;
  }

  if (valueKey === "gst" || valueKey === "gstPercentage" || valueKey === "gstNo") {
    return String(
      matchedRow.gst ?? matchedRow.gstPercentage ?? matchedRow.gstNo ?? "",
    ).trim();
  }

  if (valueKey === "hsnCode" || valueKey === "hsn") {
    return String(matchedRow.hsnCode ?? matchedRow.hsn ?? matchedRow.code ?? "").trim();
  }

  return resolved;
}

function applyAutoFilledValues(
  fields: readonly MasterFieldDefinition[],
  values: Record<string, MasterFieldValue>,
) {
  const nextValues: Record<string, MasterFieldValue> = { ...values };

  const fillFromSource = (
    sourceKey: string,
    sourceValue: MasterFieldValue | undefined,
  ) => {
    fields.forEach((field) => {
      const autoFillConfig = field.autoFillFrom;

      if (!autoFillConfig || autoFillConfig.sourceKey !== sourceKey) {
        return;
      }

      if (typeof sourceValue !== "string") {
        nextValues[field.key] = "";
        return;
      }

      nextValues[field.key] = resolveAutoFillValue(
        autoFillConfig.rows,
        autoFillConfig.sourceMatchKey,
        autoFillConfig.sourceValueKey,
        sourceValue,
      );
    });
  };

  fields.forEach((field) => {
    const autoFillConfig = field.autoFillFrom;
    if (!autoFillConfig) {
      return;
    }
    fillFromSource(autoFillConfig.sourceKey, nextValues[autoFillConfig.sourceKey]);
  });

  // Second pass fills chained fields (HSN -> GST).
  fields.forEach((field) => {
    const autoFillConfig = field.autoFillFrom;
    if (!autoFillConfig) {
      return;
    }
    fillFromSource(autoFillConfig.sourceKey, nextValues[autoFillConfig.sourceKey]);
  });

  return nextValues;
}

function getMasterFormDefinitionForMode(
  definition: MasterDefinition,
  mode: "add" | "edit" | "view",
): MasterDefinition {
  const fields =
    mode === "add" || mode === "edit"
      ? definition.fields.filter((field) => field.key !== "status")
      : definition.fields;

  return {
    ...definition,
    fields: hasRemarkField(fields) ? fields : [...fields, remarkField],
  };
}

function formatAuditDateTime(value: any) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

export function MasterFormPage({
  additionalValues,
  afterFields,
  beforeSave,
  cancelTo,
  definition,
  errorMessage = "",
  fieldActions,
  loading = false,
  mode,
  onFieldChange,
  onSave,
  record,
  renderFields,
}: MasterFormPageProps) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const localDefinition = useMemo(
    () => buildLocalMasterDefinition(definition),
    [definition],
  );
  const paths = getMasterPaths(localDefinition.slug);
  const cancelPath = cancelTo ?? paths.list;
  const permissionKey = getMasterPermissionKey(localDefinition.slug);
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
      : (record ??
        localDefinition.rows.find((entry) => entry.id === params.id));

  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildMasterInitialValues(localDefinition, row),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [toastNotification, setToastNotification] = useState<{
    message: string;
    severity: "success" | "error" | "info" | "warning";
  } | null>(null);
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
  const formDefinition = useMemo(
    () => getMasterFormDefinitionForMode(localDefinition, mode),
    [localDefinition, mode],
  );
  const autoFillSignature = useMemo(
    () =>
      formDefinition.fields
        .map((field) => {
          const config = field.autoFillFrom;
          if (!config) {
            return field.key;
          }
          return `${field.key}:${config.sourceKey}:${config.sourceMatchKey}:${config.sourceValueKey}:${config.rows.length}:${config.rows.map((row) => row.id).join(",")}`;
        })
        .join("|"),
    [formDefinition.fields],
  );

  const handleCancel = () => {
    setLeaveConfirmation({
      open: true,
      title: "Cancel Changes",
      description: "Are you sure you want to cancel? Any unsaved changes will be discarded.",
      action: () => {
        navigate(cancelPath, { replace: true });
      },
    });
  };

  const handleBack = () => {
    navigate(cancelPath, { replace: true });
  };

  useEffect(() => {
    setValues((current) => {
      const nextValues = buildMasterInitialValues(localDefinition, row);

      if (row) {
        const phoneCountryCode = row.phoneNumberCountryCode || row.mobileNumberCountryCode;
        if (typeof phoneCountryCode === "string" && phoneCountryCode.trim()) {
          nextValues.phoneNumberCountryCode = phoneCountryCode;
          nextValues.mobileNumberCountryCode = phoneCountryCode;
        }
      }

      if (mode === "add" || mode === "edit") {
        const merged = { ...nextValues };
        Object.keys(current).forEach((key) => {
          if (current[key] !== undefined && current[key] !== "") {
            merged[key] = current[key];
          }
        });
        return merged;
      }

      return nextValues;
    });
  }, [localDefinition, row, mode]);

  useEffect(() => {
    setValues((current) => {
      const merged = {
        ...current,
        ...(additionalValues ?? {}),
      };
      const nextValues = applyAutoFilledValues(formDefinition.fields, merged);
      const changed = Object.keys({ ...current, ...nextValues }).some(
        (key) => current[key] !== nextValues[key],
      );
      return changed ? nextValues : current;
    });
  }, [additionalValues, autoFillSignature, formDefinition]);

  if (loading) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Masters", to: "/masters" },
          { label: localDefinition.title, to: paths.list },
          { label: mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View" },
        ]}
        title={getMasterPageTitle(localDefinition, mode)}
      >
        <ContentLoader label="Loading..." minHeight={240} />
      </MasterPageShell>
    );
  }

  if ((mode === "edit" || mode === "view") && !row) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Masters", to: "/masters" },
          { label: localDefinition.title, to: paths.list },
          { label: "Not Found" },
        ]}
        title={localDefinition.title}
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            {errorMessage ||
              "The requested record could not be found."}
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Masters", to: "/masters" },
          { label: localDefinition.title, to: paths.list },
          { label: mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View" },
        ]}
        title={getMasterPageTitle(localDefinition, mode)}
      >
        <Alert severity="warning">
          You do not have permission to {mode} this master record.
        </Alert>
      </MasterPageShell>
    );
  }

  const handleSave = async () => {
    if (mode === "view") {
      return;
    }

    setHasSubmitted(true);
    setSaveError("");

    const canSaveAdditionalContent = beforeSave?.() ?? true;

    const hasFormErrors = hasFormFieldErrors(formDefinition.fields, values);

    if (hasFormErrors || !canSaveAdditionalContent) {
      const msg = hasFormErrors
        ? "Please fill in all required fields marked with * and correct invalid entries."
        : "Please complete all required section details.";
      setSaveError(msg);
      setToastNotification({ message: msg, severity: "error" });
      return;
    }

    // Check for duplicate identifier or name only for the primary key of the CURRENT master
    const MASTER_PRIMARY_KEYS: Record<string, string[]> = {
      "item-name-master": ["itemName", "itemCode"],
      "item-category-master": ["categoryName"],
      "item-sub-category-master": ["itemSubCategory"],
      "color-master": ["colorName"],
      "currency-master": ["currencyName"],
      "cut-master": ["cutName"],
      "department-master": ["departmentName"],
      "grade-master": ["gradeName"],
      "unit-master": ["unitName", "symbolicName"],
      "gst-master": ["gstPercentage"],
      "hsn-master": ["hsnCode", "code"],
      "supplier-master": ["supplierName", "gstNo"],
      "customer-master": ["customerName", "gstNo"],
    };

    const targetKeysToCheck = MASTER_PRIMARY_KEYS[localDefinition.slug] ?? [];

    for (const key of targetKeysToCheck) {
      const val = values[key];
      if (typeof val === "string" && val.trim().length > 0) {
        const normalizedVal = val.trim().toLowerCase();
        const duplicate = localDefinition.rows.find((existingRow) => {
          if (row && existingRow.id === row.id) {
            return false;
          }
          const existingVal = existingRow[key] || (key === "hsnCode" ? existingRow.code : undefined);
          return (
            typeof existingVal === "string" &&
            existingVal.trim().toLowerCase() === normalizedVal
          );
        });

        if (duplicate) {
          const fieldDef = formDefinition.fields.find((f) => f.key === key);
          const fieldLabel = fieldDef ? fieldDef.label.replace(/\s*\*+$/, "") : key;
          const msg = `${fieldLabel} "${val.trim()}" already exists.`;
          setSaveError(msg);
          setToastNotification({ message: msg, severity: "error" });
          return;
        }
      }
    }

    const valuesToSave = {
      ...values,
      ...(additionalValues ?? {}),
      ...(mode === "add" && !values.status ? { status: "Active" } : {}),
    };

    const saveContext = row
      ? {
        definition: localDefinition,
        mode,
        row,
        values: valuesToSave,
      }
      : {
        definition: localDefinition,
        mode,
        values: valuesToSave,
      };

    try {
      setIsSaving(true);

      if (onSave) {
        await onSave(saveContext);
      } else if (row) {
        updateLocalMasterRecord(localDefinition, row, valuesToSave);
      } else {
        createLocalMasterRecord(localDefinition, valuesToSave);
      }

      const successMsg = `${localDefinition.title.replace(/ Master$/, "")} ${mode === "add" ? "created" : "updated"} successfully.`;
      navigate(paths.list, {
        state: {
          masterFlashMessage: successMsg,
        },
      });
    } catch (error) {
      const msg = getMasterApiErrorMessage(error, "Unable to save record.");
      setSaveError(msg);
      setToastNotification({ message: msg, severity: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: MasterFieldValue) => {
    onFieldChange?.(key, value);
    setValues((current) => {
      const nextValues = {
        ...current,
        [key]: value,
      };

      if (
        key === "category" &&
        formDefinition.fields.some((field) => field.key === "subCategory")
      ) {
        nextValues.subCategory = "";
      }

      return applyAutoFilledValues(formDefinition.fields, nextValues);
    });
  };

  return (
    <MasterPageShell
      backNav={{
        label: `Back to ${localDefinition.title}`,
        to: paths.list,
        onBack: handleBack,
      }}
      breadcrumbs={[
        { label: "Masters", to: "/masters" },
        { label: localDefinition.title, to: paths.list },
        { label: mode === "add" ? "Add" : mode === "edit" ? "Edit" : "View" },
      ]}
      title={getMasterPageTitle(localDefinition, mode)}
    >
      <Box
        sx={(theme) => ({
          ...mastersFormSectionCardSx(theme),
        })}
      >
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          {mode === "view" ? (
            <FormSectionHeader
              title={`${localDefinition.title.toUpperCase()} DETAILS`}
              icon={FileText}
              variant="cardTop"
              startAdornment={
                values.status !== undefined && values.status !== null ? (() => {
                  const statusVal = String(values.status).trim();
                  const isActive =
                    statusVal.toLowerCase() === "active" ||
                    statusVal.toLowerCase() === "enabled" ||
                    values.status === true;
                  return (
                    <Box
                      component="span"
                      sx={(theme) => ({
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 0.6,
                        px: 1.25,
                        py: 0.25,
                        borderRadius: "12px",
                        fontSize: "0.725rem",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        textTransform: "uppercase",
                        backgroundColor: isActive
                          ? theme.customTokens.semanticScale.success[100]
                          : theme.customTokens.neutrals[100],
                        color: isActive
                          ? theme.customTokens.semanticScale.success[800]
                          : theme.customTokens.neutrals[700],
                        border: `1px solid ${
                          isActive
                            ? theme.customTokens.semanticScale.success[300]
                            : theme.customTokens.neutrals[300]
                        }`,
                      })}
                    >
                      <Box
                        component="span"
                        sx={(theme) => ({
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          bgcolor: isActive
                            ? theme.customTokens.semanticScale.success[600]
                            : theme.customTokens.neutrals[500],
                        })}
                      />
                      {isActive ? "Active" : "Inactive"}
                    </Box>
                  );
                })() : undefined
              }
            />
          ) : null}

          {errorMessage || saveError ? (
            <Alert severity="error">
              {errorMessage
                ? getMasterApiErrorMessage(errorMessage, "Unable to load this record.")
                : getMasterApiErrorMessage(saveError, "Unable to save record.")}
            </Alert>
          ) : null}

          {renderFields ? (
            renderFields({
              definition: formDefinition,
              values,
              onChange: handleFieldChange,
              readOnly: mode === "view",
              showRequiredErrors: mode !== "view" && hasSubmitted,
              hasSubmitted,
            })
          ) : (
            <MasterFormFields
              compact
              definition={
                mode === "view"
                  ? {
                      ...formDefinition,
                      fields: formDefinition.fields.filter(
                        (f) => f.key.toLowerCase() !== "status",
                      ),
                    }
                  : formDefinition
              }
              fieldActions={fieldActions}
              onChange={handleFieldChange}
              presentation={mode === "view" ? "details" : "form"}
              readOnly={mode === "view"}
              showRequiredErrors={mode !== "view" && hasSubmitted}
              values={values}
              variant="masters"
            />
          )}

          {afterFields}

          {/* Created & Updated audit fields inside the same single card (except customer, supplier, transporter) */}
          {mode === "view" &&
          !["customer", "supplier", "transporter", "customers", "suppliers", "transporters"].some(
            (excluded) => localDefinition.slug?.toLowerCase().includes(excluded),
          ) ? (
            <Stack
              spacing={2}
              sx={{
                mt: 2,
              }}
            >
              {/* Row 1: Created By & Created At in one line */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(1, minmax(0, 1fr))",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      mb: 0.25,
                    })}
                  >
                    Created By
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: theme.customTokens.text.primary,
                    })}
                  >
                    {String(row?.createdBy || row?.created_by || "System")}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      mb: 0.25,
                    })}
                  >
                    Created At
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: theme.customTokens.text.primary,
                    })}
                  >
                    {formatAuditDateTime(row?.createdAt || row?.created_at || row?.createdDate)}
                  </Typography>
                </Box>
              </Box>

              {/* Row 2: Updated By & Updated At in one line */}
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "repeat(1, minmax(0, 1fr))",
                    sm: "repeat(2, minmax(0, 1fr))",
                  },
                  columnGap: 3,
                  rowGap: 2,
                }}
              >
                <Box>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      mb: 0.25,
                    })}
                  >
                    Updated By
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: theme.customTokens.text.primary,
                    })}
                  >
                    {String(row?.updatedBy || row?.updated_by || row?.createdBy || "System")}
                  </Typography>
                </Box>
                <Box>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.secondary,
                      textTransform: "uppercase",
                      letterSpacing: "0.04em",
                      mb: 0.25,
                    })}
                  >
                    Updated At
                  </Typography>
                  <Typography
                    sx={(theme) => ({
                      fontSize: "0.85rem",
                      fontWeight: 500,
                      color: theme.customTokens.text.primary,
                    })}
                  >
                    {formatAuditDateTime(row?.updatedAt || row?.updated_at || row?.updatedDate || row?.createdAt || row?.created_at)}
                  </Typography>
                </Box>
              </Box>
            </Stack>
          ) : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              gap: theme.spacing(1),
              flexWrap: "wrap",
              pt: theme.spacing(1),
              borderTop: `1px solid ${theme.customTokens.borders.divider}`,
            })}
          >
            {mode === "view" ? (
              canEdit ? (
                <Button
                  variant="contained"
                  startIcon={<Pencil size={16} />}
                  sx={(theme) => mastersFormPrimaryButtonSx(theme)}
                  onClick={() => {
                    if (row) {
                      navigate(paths.edit(row.id));
                    }
                  }}
                >
                  Edit
                </Button>
              ) : null
            ) : (
              <>
                <Button
                  type="button"
                  variant="outlined"
                  onClick={handleCancel}
                  disabled={isSaving}
                  sx={(theme) => mastersFormOutlinedButtonSx(theme)}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  startIcon={<Save size={16} />}
                  onClick={() => {
                    void handleSave();
                  }}
                  disabled={isSaving}
                  sx={(theme) => mastersFormPrimaryButtonSx(theme)}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </>
            )}
          </Box>
        </Stack>
      </Box>

      <Snackbar
        open={Boolean(toastNotification)}
        autoHideDuration={4000}
        onClose={() => setToastNotification(null)}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {toastNotification ? (
          <Alert
            onClose={() => setToastNotification(null)}
            severity={toastNotification.severity}
            variant="filled"
            sx={{ width: "100%", boxShadow: 3 }}
          >
            {toastNotification.message}
          </Alert>
        ) : undefined}
      </Snackbar>

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
    </MasterPageShell>
  );
}
