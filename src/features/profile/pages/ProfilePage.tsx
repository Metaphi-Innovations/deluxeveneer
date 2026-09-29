import { useEffect, useMemo, useState } from "react";
import { Avatar, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
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
import {
  userManagementFormFields,
  fetchUserManagementDetail,
  updateUserManagementRecord,
} from "../../user-management/shared";

export function ProfilePage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<AuthenticatedUserProfile>(() =>
    getCurrentUser(),
  );
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildProfileInitialValues(currentUser),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [roleOptions, setRoleOptions] = useState<string[]>([]);
  const profileFields = useMemo(
    () => withProfileRoleOptions(userManagementFormFields, roleOptions, currentUser.role),
    [currentUser.role, roleOptions],
  );

  // Fetch fresh profile data directly from database on mount
  useEffect(() => {
    let ignore = false;
    const activeUser = getCurrentUser();

    if (activeUser?.id) {
      setIsLoadingProfile(true);
      fetchUserManagementDetail(activeUser.id)
        .then((detail) => {
          if (!ignore && detail) {
            const syncedUser: AuthenticatedUserProfile = {
              ...activeUser,
              userName: detail.userName || activeUser.userName,
              firstName: detail.firstName || activeUser.firstName,
              lastName: detail.lastName || activeUser.lastName,
              email: detail.email || activeUser.email,
              phoneNo: detail.phoneNo || activeUser.phoneNo,
              department: detail.department || activeUser.department,
              dateOfBirth: detail.dateOfBirth,
              age: detail.age || activeUser.age,
              bloodGroup: detail.bloodGroup || activeUser.bloodGroup,
              address: detail.address || activeUser.address,
              pincode: detail.pincode || activeUser.pincode,
              country: detail.country || activeUser.country,
              state: detail.state || activeUser.state,
              city: detail.city || activeUser.city,
              remarks: detail.remarks || activeUser.remarks,
              ...(detail.aadhaarNo || activeUser.aadhaarNo
                ? { aadhaarNo: detail.aadhaarNo || activeUser.aadhaarNo }
                : {}),
              ...(detail.aadhaarUpload || activeUser.aadhaarUpload
                ? { aadhaarUpload: detail.aadhaarUpload || activeUser.aadhaarUpload }
                : {}),
              ...(detail.panNo || activeUser.panNo
                ? { panNo: detail.panNo || activeUser.panNo }
                : {}),
              ...(detail.panUpload || activeUser.panUpload
                ? { panUpload: detail.panUpload || activeUser.panUpload }
                : {}),
            };
            setCurrentUser(syncedUser);
            saveCurrentUser(syncedUser);
            setValues(buildProfileInitialValues(syncedUser));
          }
        })
        .catch((err) => {
          console.error("[ProfilePage] Failed to fetch profile from database:", err);
        })
        .finally(() => {
          if (!ignore) {
            setIsLoadingProfile(false);
          }
        });
    }

    return () => {
      ignore = true;
    };
  }, []);

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

  const handleSave = async () => {
    setHasSubmitted(true);

    if (hasFormFieldErrors(profileFields, values)) {
      return;
    }

    const nextUser = buildProfileFromValues(values, currentUser);

    try {
      setIsSaving(true);
      // Persist directly to backend database if user has an ID
      if (currentUser.id) {
        const updatedDetail = await updateUserManagementRecord(currentUser.id, values);
        if (updatedDetail) {
          nextUser.userName = updatedDetail.userName || nextUser.userName;
          nextUser.firstName = updatedDetail.firstName || nextUser.firstName;
          nextUser.lastName = updatedDetail.lastName || nextUser.lastName;
          nextUser.email = updatedDetail.email || nextUser.email;
          nextUser.phoneNo = updatedDetail.phoneNo || nextUser.phoneNo;
          nextUser.department = updatedDetail.department || nextUser.department;
          nextUser.dateOfBirth = updatedDetail.dateOfBirth;
          nextUser.age = updatedDetail.age || nextUser.age;
          nextUser.bloodGroup = updatedDetail.bloodGroup || nextUser.bloodGroup;
          nextUser.address = updatedDetail.address || nextUser.address;
          nextUser.pincode = updatedDetail.pincode || nextUser.pincode;
          nextUser.country = updatedDetail.country || nextUser.country;
          nextUser.state = updatedDetail.state || nextUser.state;
          nextUser.city = updatedDetail.city || nextUser.city;
          const aadhaarNo = updatedDetail.aadhaarNo || nextUser.aadhaarNo;
          if (aadhaarNo) {
            nextUser.aadhaarNo = aadhaarNo;
          } else {
            delete nextUser.aadhaarNo;
          }

          const aadhaarUpload = updatedDetail.aadhaarUpload || nextUser.aadhaarUpload;
          if (aadhaarUpload) {
            nextUser.aadhaarUpload = aadhaarUpload;
          } else {
            delete nextUser.aadhaarUpload;
          }

          const panNo = updatedDetail.panNo || nextUser.panNo;
          if (panNo) {
            nextUser.panNo = panNo;
          } else {
            delete nextUser.panNo;
          }

          const panUpload = updatedDetail.panUpload || nextUser.panUpload;
          if (panUpload) {
            nextUser.panUpload = panUpload;
          } else {
            delete nextUser.panUpload;
          }

          nextUser.remarks = updatedDetail.remarks || nextUser.remarks;
        }
      }
      saveCurrentUser(nextUser);
      setCurrentUser(nextUser);
      setValues(buildProfileInitialValues(nextUser));
      closeProfilePage(navigate);
    } catch (error) {
      console.error("[ProfilePage] Failed to save profile to database:", error);
      // Fallback save to session
      saveCurrentUser(nextUser);
      setCurrentUser(nextUser);
      closeProfilePage(navigate);
    } finally {
      setIsSaving(false);
    }
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
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save size={16} />}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              {isSaving ? "Saving..." : "Save"}
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
