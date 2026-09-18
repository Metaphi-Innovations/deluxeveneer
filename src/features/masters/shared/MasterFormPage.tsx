import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import {
  canAccessPermission,
  getMasterPermissionKey,
} from "../../permissions";
import { MasterFormFields, hasFormFieldErrors } from "./MasterFormFields";
import { MasterPageShell } from "./MasterPageShell";
import { MasterSectionCard } from "./MasterSectionCard";
import {
  mastersFormOutlinedButtonSx,
  mastersFormPrimaryButtonSx,
  mastersFormSectionCardSx,
} from "./mastersFormStyles";
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

interface MasterFormPageProps {
  additionalValues?: Record<string, MasterFieldValue>;
  afterFields?: ReactNode;
  beforeSave?: () => boolean;
  cancelTo?: string;
  definition: MasterDefinition;
  errorMessage?: string;
  loading?: boolean;
  mode: "add" | "edit" | "view";
  /** When provided, used instead of looking up the row from local mock store. */
  record?: MasterRecord;
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

export function MasterFormPage({
  additionalValues,
  afterFields,
  beforeSave,
  cancelTo,
  definition,
  errorMessage = "",
  loading = false,
  mode,
  onSave,
  record,
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
  const formDefinition = getMasterFormDefinitionForMode(localDefinition, mode);
  const handleCancel = () => {
    navigate(cancelPath, { replace: true });
  };

  useEffect(() => {
    const nextValues = buildMasterInitialValues(localDefinition, row);

    if (row) {
      const phoneCountryCode = row.phoneNumberCountryCode;
      if (typeof phoneCountryCode === "string" && phoneCountryCode.trim()) {
        nextValues.phoneNumberCountryCode = phoneCountryCode;
      }
    }

    setValues(nextValues);
  }, [localDefinition, row]);

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
        <Alert severity="info">Loading record...</Alert>
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

    if (
      hasFormFieldErrors(formDefinition.fields, values) ||
      !canSaveAdditionalContent
    ) {
      return;
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

      navigate(paths.list);
    } catch (error) {
      setSaveError(
        error instanceof Error ? error.message : "Unable to save record.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (key: string, value: MasterFieldValue) => {
    setValues((current) => {
      const nextValues = {
        ...current,
        [key]: value,
      };

      formDefinition.fields.forEach((field) => {
        const autoFillConfig = field.autoFillFrom;

        if (!autoFillConfig || autoFillConfig.sourceKey !== key) {
          return;
        }

        if (typeof value !== "string") {
          nextValues[field.key] = "";
          return;
        }

        const matchedRow = autoFillConfig.rows.find(
          (row) => String(row[autoFillConfig.sourceMatchKey] ?? "") === value,
        );

        nextValues[field.key] = matchedRow
          ? String(matchedRow[autoFillConfig.sourceValueKey] ?? "")
          : "";
      });

      return nextValues;
    });
  };

  return (
    <MasterPageShell
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
          {errorMessage || saveError ? (
            <Alert severity="error">{errorMessage || saveError}</Alert>
          ) : null}

          <MasterFormFields
            compact
            definition={formDefinition}
            onChange={handleFieldChange}
            presentation={mode === "view" ? "details" : "form"}
            readOnly={mode === "view"}
            showRequiredErrors={mode !== "view" && hasSubmitted}
            values={values}
            variant="masters"
          />

          {afterFields}

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
              <>
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeft size={16} />}
                  onClick={() => navigate(paths.list)}
                  sx={(theme) => mastersFormOutlinedButtonSx(theme)}
                >
                  Back
                </Button>

                {canEdit ? (
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
                ) : null}
              </>
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
    </MasterPageShell>
  );
}
