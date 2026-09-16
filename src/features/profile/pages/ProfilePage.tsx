import { useEffect, useMemo, useState } from "react";
import { Avatar, Box, Button, Stack, Typography } from "@mui/material";
import { Save } from "lucide-react";
import { useNavigate } from "react-router";

import {
  getCurrentUser,
  getUserDisplayName,
  getUserInitials,
  saveCurrentUser,
  type AuthenticatedUserProfile,
} from "../../auth";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { fetchRolePermissionRows } from "../../roles-permissions/shared/rolesPermissionsApi";
import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
  hasFormFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import { userManagementFormFields } from "../../user-management/shared";

export function ProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserProfile>(() =>
    getCurrentUser(),
  );
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildProfileInitialValues(currentUser),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const profileFields = useMemo(
    () => withProfileRoleOptions(userManagementFormFields, roleOptions, currentUser.role),
    [currentUser.role, roleOptions],
  );

  useEffect(() => {
    setValues(buildProfileInitialValues(currentUser));
  }, [currentUser]);

  useEffect(() => {
    let ignore = false;

    fetchRolePermissionRows()
      .then((rows) => {
        if (!ignore) {
          setRoleOptions(
            Array.from(
              new Set(
                rows
                  .filter((role) => role.isActive !== false)
                  .map((role) => role.roleName.trim())
                  .filter(Boolean),
              ),
            ),
          );
        }
      })
      .catch(() => {
        if (!ignore) {
          setRoleOptions([]);
        }
      });

    return () => {
      ignore = true;
    };
  }, []);

  const displayName = useMemo(() => getUserDisplayName(currentUser), [currentUser]);
  const initials = useMemo(() => getUserInitials(displayName), [displayName]);

  const handleCancel = () => {
    const persistedUser = getCurrentUser();
    setCurrentUser(persistedUser);
    setValues(buildProfileInitialValues(persistedUser));
    closeProfilePage(navigate);
  };

  const handleSave = () => {
    setHasSubmitted(true);

    if (hasFormFieldErrors(profileFields, values)) {
      return;
    }

    const nextUser = buildProfileFromValues(values, currentUser);
    saveCurrentUser(nextUser);
    setCurrentUser(nextUser);
    setValues(buildProfileInitialValues(nextUser));
    closeProfilePage(navigate);
  };

  return (
    <MasterPageShell breadcrumbs={[{ label: "Profile" }]} title="Profile">
      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(3),
          })}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems={{ xs: "flex-start", md: "center" }}
            sx={(theme) => ({
              pb: theme.spacing(3),
              borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
            })}
          >
            <Avatar
              sx={(theme) => ({
                width: 72,
                height: 72,
                bgcolor: theme.customTokens.brand.primary,
                color: theme.customTokens.text.inverse,
                fontSize: theme.typography.h3.fontSize,
                fontWeight: 700,
              })}
            >
              {initials}
            </Avatar>

            <Stack spacing={0.5}>
              <Typography variant="h3" color="text.primary">
                {displayName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {currentUser.accountRole}
              </Typography>
            </Stack>
          </Stack>

          <MasterFormFields
            definition={{
              fields: profileFields as MasterFieldDefinition[],
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
              onClick={handleCancel}
              sx={recordFormActionButtonSx}
              variant="outlined"
            >
              Cancel
            </Button>

            <Button
              type="button"
              onClick={handleSave}
              startIcon={<Save size={16} />}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              Save
            </Button>
          </Box>
        </Stack>
      </MasterSectionCard>
    </MasterPageShell>
  );
}

function buildProfileInitialValues(user: AuthenticatedUserProfile) {
  return userManagementFormFields.reduce<Record<string, MasterFieldValue>>(
    (accumulator, field) => {
      const value = user[field.key as keyof AuthenticatedUserProfile];

      if (field.type === "date") {
        accumulator[field.key] = value instanceof Date ? value : null;
        return accumulator;
      }

      accumulator[field.key] = typeof value === "string" ? value : "";
      return accumulator;
    },
    {},
  );
}

function buildProfileFromValues(
  values: Record<string, MasterFieldValue>,
  currentUser: AuthenticatedUserProfile,
): AuthenticatedUserProfile {
  return {
    accountRole: currentUser.accountRole,
    address: getStringValue(values.address),
    age: getStringValue(values.age),
    approver: getStringValue(values.approver),
    bloodGroup: getStringValue(values.bloodGroup),
    city: getStringValue(values.city),
    country: getStringValue(values.country),
    dateOfBirth: values.dateOfBirth instanceof Date ? values.dateOfBirth : null,
    department: getStringValue(values.department),
    email: getStringValue(values.email),
    firstName: getStringValue(values.firstName),
    gender: getStringValue(values.gender),
    id: currentUser.id,
    lastName: getStringValue(values.lastName),
    phoneNo: getStringValue(values.phoneNo),
    pincode: getStringValue(values.pincode),
    permissions: currentUser.permissions,
    remarks: getStringValue(values.remarks),
    role: getStringValue(values.role),
    state: getStringValue(values.state),
    userName: getStringValue(values.userName),
    userType: getStringValue(values.userType),
  };
}

function getStringValue(value: MasterFieldValue | undefined) {
  return typeof value === "string" ? value : "";
}

function withProfileRoleOptions(
  fields: readonly MasterFieldDefinition[],
  roleOptions: readonly string[],
  currentRole?: string,
) {
  const options = Array.from(
    new Set(
      [...roleOptions, currentRole ?? ""]
        .map((option) => option.trim())
        .filter(Boolean),
    ),
  );

  return fields.map((field) =>
    field.key === "role"
      ? {
          ...field,
          options,
        }
      : field,
  );
}

function closeProfilePage(navigate: ReturnType<typeof useNavigate>) {
  if (typeof window !== "undefined" && window.history.length > 1) {
    navigate(-1);
    return;
  }

  navigate("/dashboard");
}
