import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  UserPermissionMatrix,
  type UserPermissionFlags,
} from "../../user-management/shared";
import {
  buildDefaultRolePermissions,
  buildRolePermissionInitialValues,
  getRolePermissionDetail,
  getRolePermissionPaths,
  rolePermissionConfigureFields,
  type RolePermissionDetail,
  withRolePermissionDepartmentOptions,
} from "../shared";
import {
  fetchRolePermissionDepartmentOptions,
  fetchRolePermissionDetail,
  updateRolePermissionMatrix,
} from "../shared/rolesPermissionsApi";

type ConfigureRecord = RolePermissionDetail | undefined;

function buildValues(
  fields: readonly MasterFieldDefinition[],
  selectedRole: ConfigureRecord,
) {
  return buildRolePermissionInitialValues(fields, selectedRole);
}

function buildPermissions(record: ConfigureRecord) {
  if (record?.permissions) {
    return record.permissions;
  }

  return buildDefaultRolePermissions();
}

function getPageTitle(selectedRole: ConfigureRecord) {
  return selectedRole ? "Configure Role" : "Configure Permissions";
}

export function RolesPermissionsConfigurePage() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const paths = getRolePermissionPaths();
  const canEditPermissions = canAccessPermission("rolesPermissions", "edit");
  const [selectedRole, setSelectedRole] = useState<ConfigureRecord>();
  const [isLoading, setIsLoading] = useState(Boolean(params.id));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const selectedRecord = selectedRole;
  const [departmentOptions, setDepartmentOptions] = useState<string[]>([]);
  const activeFields = useMemo(
    () =>
      withRolePermissionDepartmentOptions(
        rolePermissionConfigureFields,
        departmentOptions,
        selectedRole?.department,
      ) as MasterFieldDefinition[],
    [departmentOptions, selectedRole?.department],
  );
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildValues(activeFields, selectedRole),
  );
  const [permissions, setPermissions] = useState<Record<string, UserPermissionFlags>>(
    () => buildPermissions(selectedRecord),
  );

  useEffect(() => {
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
  }, []);

  useEffect(() => {
    if (!params.id) {
      setSelectedRole(undefined);
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    setIsLoading(true);
    setErrorMessage("");

    fetchRolePermissionDetail(params.id)
      .then((rolePermission) => {
        if (isMounted) {
          setSelectedRole(rolePermission);
        }
      })
      .catch((error: unknown) => {
        if (isMounted) {
          const fallbackRole = getRolePermissionDetail(params.id ?? "");
          setSelectedRole(fallbackRole);
          setErrorMessage(
            fallbackRole
              ? ""
              : error instanceof Error
              ? error.message
                : "Unable to load role configuration.",
          );
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [params.id]);

  useEffect(() => {
    setValues(buildValues(activeFields, selectedRole));
    setPermissions(buildPermissions(selectedRecord));
  }, [activeFields, selectedRole, selectedRecord]);

  const handleSave = async () => {
    if (!params.id || !selectedRole) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const updatedRole = await updateRolePermissionMatrix(params.id, permissions);
      navigate(paths.list, {
        replace: true,
        state: {
          rolesPermissionsFlashMessage: `Permissions saved for ${updatedRole.roleName}.`,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to save role permissions.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Roles & Permissions", to: paths.list },
          { label: "Configure Role" },
        ]}
        title="Configure Role"
      >
        <Stack alignItems="center" sx={{ py: 4 }}>
          <CircularProgress size={28} />
        </Stack>
      </MasterPageShell>
    );
  }

  if (!selectedRecord) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Roles & Permissions", to: paths.list },
          { label: "Not Found" },
        ]}
        title="Roles & Permissions"
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            {errorMessage || "The requested configuration record could not be found."}
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (!canEditPermissions) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Roles & Permissions", to: paths.list },
          { label: "Configure Role" },
        ]}
        title="Configure Role"
      >
        <Alert severity="warning">
          You do not have permission to configure roles.
        </Alert>
      </MasterPageShell>
    );
  }

  const pageTitle = getPageTitle(selectedRole);

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Roles & Permissions", to: paths.list },
        { label: pageTitle },
      ]}
      title={pageTitle}
    >
      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <MasterFormFields
            compact
            definition={{
              fields: activeFields,
              gridColumns: 4,
            }}
            onChange={(key, value) => {
              setValues((current) => ({
                ...current,
                [key]: value,
              }));
            }}
            values={values}
          />

          <UserPermissionMatrix
            onToggle={(itemKey, action, checked) =>
              setPermissions((current) => {
                const currentPermissions = current[itemKey] ?? {
                  create: false,
                  edit: false,
                  view: false,
                };

                return {
                  ...current,
                  [itemKey]: {
                    ...currentPermissions,
                    [action]: checked,
                  },
                };
              })
            }
            permissions={permissions}
          />

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "center",
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
            <Button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              startIcon={<Save size={16} />}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              {isSaving ? "Saving" : "Save"}
            </Button>
          </Box>
        </Stack>
      </MasterSectionCard>
    </MasterPageShell>
  );
}
