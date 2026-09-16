import { Alert, Box, Button, Stack } from "@mui/material";
import { Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";

import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
  hasRequiredFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  buildRolePermissionInitialValues,
  createRolePermissionRecord,
  fetchRolePermissionDepartmentOptions,
  getRolePermissionPaths,
  rolePermissionFormFields,
  withRolePermissionDepartmentOptions,
} from "../shared";

export function RolesPermissionsAddPage() {
  const navigate = useNavigate();
  const paths = getRolePermissionPaths();
  const canCreateRole = canAccessPermission("rolesPermissions", "create");
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildRolePermissionInitialValues(rolePermissionFormFields),
  );
  const [errorMessage, setErrorMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const selectedDepartment =
    typeof values.department === "string" ? values.department : "";
  const activeFields = useMemo(
    () =>
      withRolePermissionDepartmentOptions(
        rolePermissionFormFields,
        departmentOptions,
        selectedDepartment,
      ),
    [departmentOptions, selectedDepartment],
  );

  useEffect(() => {
    if (!canCreateRole) {
      return;
    }

    let isMounted = true;

    fetchRolePermissionDepartmentOptions()
      .then((options) => {
        if (isMounted) {
          setDepartmentOptions(options);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load departments from Department Master.",
          );
        }
      });

    return () => {
      isMounted = false;
    };
  }, [canCreateRole]);

  const handleSave = async () => {
    if (!canCreateRole) {
      return;
    }

    setHasSubmitted(true);

    if (hasRequiredFieldErrors(activeFields, values)) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      await createRolePermissionRecord(values);
      navigate(paths.list);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create role.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Roles & Permissions", to: paths.list },
        { label: "Add Role" },
      ]}
      title="Add Role"
    >
      {!canCreateRole ? (
        <Alert severity="warning">
          You do not have permission to add roles.
        </Alert>
      ) : null}

      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          {canCreateRole && errorMessage ? (
            <Alert severity="error">{errorMessage}</Alert>
          ) : null}

          {canCreateRole ? (
            <MasterFormFields
              compact
              definition={{
                fields: activeFields as MasterFieldDefinition[],
                gridColumns: 4,
              }}
              onChange={(key, value) =>
                setValues((current) => ({
                  ...current,
                  [key]: value,
                }))
              }
              showRequiredErrors={hasSubmitted}
              values={values}
            />
          ) : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
            })}
          >
            <Button
              type="button"
              onClick={() => navigate(paths.list)}
              sx={recordFormActionButtonSx}
              variant="outlined"
            >
              Cancel
            </Button>

            {canCreateRole ? (
              <Button
                type="button"
                disabled={isSaving}
                onClick={handleSave}
                startIcon={<Save size={16} />}
                sx={recordFormActionButtonSx}
                variant="contained"
              >
                Save
              </Button>
            ) : null}
          </Box>
        </Stack>
      </MasterSectionCard>
    </MasterPageShell>
  );
}
