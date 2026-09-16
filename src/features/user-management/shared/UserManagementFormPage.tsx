import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { syncCurrentUserFromUserManagementDetail } from "../../auth";
import {
  MasterFormFields,
  MasterPageShell,
  MasterSectionCard,
  hasFormFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { formSectionCardSx } from "../../shared/formSectionStyles";
import { FormSectionHeader } from "../../shared/FormSectionHeader";
import {
  UserPermissionMatrix,
  countSelectedPermissions,
} from "./UserPermissionMatrix";
import {
  buildDefaultUserPermissions,
  buildUserManagementInitialValues,
  getUserManagementPaths,
  userManagementFormFields,
  userManagementViewFields,
  type UserManagementDetail,
  type UserPermissionFlags,
} from "./userManagementConfig";
import {
  createUserManagementRecord,
  fetchUserManagementDetail,
  updateUserManagementRecord,
} from "./userManagementApi";

interface UserManagementFormPageProps {
  mode: "add" | "edit" | "view";
}

type WorkflowStep = "basic" | "permissions";

const ACCOUNT_FIELD_KEYS = [
  "userName",
  "firstName",
  "lastName",
  "email",
  "phoneNo",
  "department",
] as const;

const PERSONAL_FIELD_KEYS = ["dateOfBirth", "age", "bloodGroup"] as const;

const ADDRESS_FIELD_KEYS = [
  "address",
  "pincode",
  "country",
  "state",
  "city",
] as const;

const IDENTITY_DOCUMENT_FIELD_KEYS = [
  "aadhaarNo",
  "aadhaarUpload",
  "panNo",
  "panUpload",
] as const;

const ADDITIONAL_FIELD_KEYS = ["remarks"] as const;

const STEPPER_STEPS: { id: WorkflowStep; label: string }[] = [
  { id: "basic", label: "Basic Details" },
  { id: "permissions", label: "Permissions" },
];

export function UserManagementFormPage({
  mode,
}: UserManagementFormPageProps) {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getUserManagementPaths();
  const canCreate = canAccessPermission("userManagement", "create");
  const canEdit = canAccessPermission("userManagement", "edit");
  const canView = canAccessPermission("userManagement", "view");
  const canUseMode =
    (mode === "add" && canCreate) ||
    (mode === "edit" && canEdit) ||
    (mode === "view" && canView);
  const baseFields =
    mode === "view" ? userManagementViewFields : userManagementFormFields;
  const [row, setRow] = useState<UserManagementDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [activeStep, setActiveStep] = useState<WorkflowStep>("basic");
  const [basicDetailsReady, setBasicDetailsReady] = useState(mode !== "add");
  const activeFields = useMemo(
    () => baseFields as MasterFieldDefinition[],
    [baseFields],
  );

  const accountFields = useMemo(
    () => filterFieldsByKeys(activeFields, ACCOUNT_FIELD_KEYS),
    [activeFields],
  );
  const personalFields = useMemo(
    () => filterFieldsByKeys(activeFields, PERSONAL_FIELD_KEYS),
    [activeFields],
  );
  const addressFields = useMemo(
    () => filterFieldsByKeys(activeFields, ADDRESS_FIELD_KEYS),
    [activeFields],
  );
  const identityDocumentFields = useMemo(
    () => filterFieldsByKeys(activeFields, IDENTITY_DOCUMENT_FIELD_KEYS),
    [activeFields],
  );
  const additionalFields = useMemo(
    () => filterFieldsByKeys(activeFields, ADDITIONAL_FIELD_KEYS),
    [activeFields],
  );

  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    buildUserManagementInitialValues(baseFields),
  );
  const [permissions, setPermissions] = useState<
    Record<string, UserPermissionFlags>
  >(() => buildDefaultUserPermissions());

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");
      setNotFound(false);

      if (mode === "add") {
        setRow(undefined);
        setValues(buildUserManagementInitialValues(baseFields));
        setPermissions(buildDefaultUserPermissions());
        setActiveStep("basic");
        setBasicDetailsReady(false);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setNotFound(true);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const nextRow = await fetchUserManagementDetail(params.id);
        if (!ignore) {
          setRow(nextRow);
          setValues(buildUserManagementInitialValues(baseFields, nextRow));
          setPermissions(nextRow.permissions ?? buildDefaultUserPermissions());
          setActiveStep("basic");
          setBasicDetailsReady(true);
        }
      } catch (error) {
        if (!ignore) {
          setNotFound(true);
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load user.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      ignore = true;
    };
  }, [baseFields, mode, params.id]);

  if ((mode === "edit" || mode === "view") && notFound) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "User Management", to: paths.list },
          { label: "Not Found" },
        ]}
        title="User Management"
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested user could not be found.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  const pageLabel =
    mode === "add" ? "Add User" : mode === "edit" ? "Edit User" : "View User";

  const pageSubtitle =
    mode === "add"
      ? "Create a user account and configure access."
      : mode === "edit"
        ? "Update user information and account access."
        : "Review user information and account details.";

  const liveIdentityName =
    `${String(values.firstName ?? "")} ${String(values.lastName ?? "")}`.trim() ||
    String(values.userName ?? "") ||
    String(values.email ?? "") ||
    (row
      ? `${row.firstName} ${row.lastName}`.trim() ||
        row.userName ||
        row.email ||
        "User"
      : "New User");

  const liveIdentityEmail =
    String(values.email ?? "") || row?.email || "";

  const selectedPermissionCount = countSelectedPermissions(permissions);

  const handleFieldChange = (key: string, value: MasterFieldValue) => {
    setValues((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handlePermissionToggle = (
    itemKey: string,
    action: "view" | "edit" | "create",
    checked: boolean,
  ) => {
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
    });
  };

  const handlePermissionBulkChange = (
    updates: {
      itemKey: string;
      action: "view" | "edit" | "create";
      checked: boolean;
    }[],
  ) => {
    setPermissions((current) => {
      const next = { ...current };

      updates.forEach((update) => {
        const currentPermissions = next[update.itemKey] ?? {
          create: false,
          edit: false,
          view: false,
        };

        next[update.itemKey] = {
          ...currentPermissions,
          [update.action]: update.checked,
        };
      });

      return next;
    });
  };

  const validateBasicDetails = () => {
    setHasSubmitted(true);
    return !hasFormFieldErrors(activeFields, values);
  };

  const handleContinueToPermissions = () => {
    if (!canUseMode || mode === "view") {
      setActiveStep("permissions");
      return;
    }

    if (!validateBasicDetails()) {
      setErrorMessage("");
      return;
    }

    setBasicDetailsReady(true);
    setActiveStep("permissions");
    setErrorMessage("");
  };

  const handleSave = async () => {
    if (!canUseMode) {
      return;
    }

    setHasSubmitted(true);

    if (hasFormFieldErrors(activeFields, values)) {
      setActiveStep("basic");
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      let savedUser: UserManagementDetail | undefined;

      if (mode === "add") {
        savedUser = await createUserManagementRecord(values, permissions);
      } else if (mode === "edit" && params.id) {
        savedUser = await updateUserManagementRecord(
          params.id,
          values,
          permissions,
        );
      }

      if (savedUser) {
        syncCurrentUserFromUserManagementDetail(savedUser);
      }

      navigate(paths.list);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to save user.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleSectionSelect = (step: WorkflowStep) => {
    if (step === "basic") {
      setActiveStep("basic");
      return;
    }

    if (mode === "edit" || mode === "view" || basicDetailsReady) {
      setActiveStep("permissions");
      return;
    }

    handleContinueToPermissions();
  };

  const compactFieldChromeSx = {
    "& .MuiOutlinedInput-root": {
      height: 36,
      minHeight: 36,
      borderRadius: "6px",
    },
    "& .MuiInputLabel-root": {
      fontSize: "0.75rem",
    },
    "& .MuiInputBase-input": {
      fontSize: "0.8125rem",
    },
  };

  const uniformFieldGridSx = {
    ...compactFieldChromeSx,
    "& > div": {
      display: "grid !important",
      width: "100%",
      gridTemplateColumns: {
        xs: "1fr !important",
        sm: "repeat(2, 1fr) !important",
        md: "repeat(3, 1fr) !important",
        lg: "repeat(3, 1fr) !important",
      },
      columnGap: "16px !important",
      rowGap: "16px !important",
      justifyItems: "stretch !important",
    },
    "& > div > .MuiStack-root": {
      width: "100% !important",
      minWidth: "0 !important",
      maxWidth: "100% !important",
    },
    "& > div > .MuiStack-root .MuiFormControl-root": {
      width: "100% !important",
    },
    "& .MuiBox-root": {
      width: "100%",
    },
  };

  const accountFieldGridSx = {
    ...compactFieldChromeSx,
    width: "100%",
    overflowX: "auto",
    "& > div": {
      display: "grid !important",
      width: "100%",
      minWidth: { xs: 0, lg: 960 },
      gridTemplateColumns: {
        xs: "1fr !important",
        sm: "repeat(2, 1fr) !important",
        md: "repeat(3, 1fr) !important",
        lg: "repeat(6, minmax(0, 1fr)) !important",
      },
      columnGap: "16px !important",
      rowGap: "16px !important",
      justifyItems: "stretch !important",
    },
    "& > div > .MuiStack-root": {
      width: "100% !important",
      minWidth: "0 !important",
      maxWidth: "100% !important",
    },
    "& > div > .MuiStack-root:nth-of-type(5) > .MuiBox-root": {
      gridTemplateColumns: "70px minmax(0, 1fr) !important",
      gap: "6px !important",
    },
    "& > div > .MuiStack-root:nth-of-type(5) .MuiSelect-select": {
      paddingLeft: "8px !important",
      paddingRight: "22px !important",
      fontSize: "0.775rem !important",
    },
    "& > div > .MuiStack-root:nth-of-type(5) .MuiSelect-icon": {
      right: "4px !important",
    },
  };

  const personalFieldGridSx = {
    ...compactFieldChromeSx,
    "& > div": {
      display: "grid !important",
      width: "100%",
      gridTemplateColumns: {
        xs: "1fr !important",
        sm: "repeat(2, minmax(0, 200px)) !important",
        md: "repeat(3, minmax(0, 200px)) !important",
      },
      columnGap: "16px !important",
      rowGap: "16px !important",
      justifyContent: "start !important",
      justifyItems: "start !important",
    },
    "& > div > .MuiStack-root": {
      width: "100% !important",
      minWidth: "0 !important",
      maxWidth: "200px !important",
    },
    "& > div > .MuiStack-root .MuiFormControl-root": {
      width: "100% !important",
    },
    "& .MuiBox-root": {
      width: "100%",
    },
  };

  const addressFieldGridSx = {
    ...compactFieldChromeSx,
    width: "100%",
    overflowX: "auto",
    "& > div": {
      display: "grid !important",
      width: "100%",
      minWidth: { xs: 0, lg: 960 },
      gridTemplateColumns: {
        xs: "1fr !important",
        sm: "repeat(2, 1fr) !important",
        md: "repeat(3, 1fr) !important",
        lg: "minmax(280px, 2.5fr) minmax(130px, 1fr) minmax(140px, 1.1fr) minmax(140px, 1.1fr) minmax(140px, 1.1fr) !important",
      },
      columnGap: "16px !important",
      rowGap: "16px !important",
      justifyItems: "stretch !important",
    },
    "& > div > .MuiStack-root": {
      width: "100% !important",
      minWidth: "0 !important",
      maxWidth: "100% !important",
    },
    "& > div > .MuiStack-root .MuiFormControl-root": {
      width: "100% !important",
    },
    "& .MuiBox-root": {
      width: "100%",
    },
  };

  const identityDocumentGridSx = {
    ...compactFieldChromeSx,
    width: "100%",
    overflowX: "auto",
    "& > div": {
      display: "grid !important",
      width: "100%",
      minWidth: { xs: 0, lg: 800 },
      gridTemplateColumns: {
        xs: "1fr !important",
        sm: "repeat(2, 1fr) !important",
        md: "repeat(4, minmax(0, 1fr)) !important",
        lg: "repeat(4, minmax(0, 1fr)) !important",
      },
      columnGap: "16px !important",
      rowGap: "16px !important",
      justifyItems: "stretch !important",
    },
    "& > div > .MuiStack-root": {
      width: "100% !important",
      minWidth: "0 !important",
      maxWidth: "100% !important",
    },
    "& > div > .MuiStack-root .MuiFormControl-root": {
      width: "100% !important",
    },
    "& .MuiBox-root": {
      width: "100%",
    },
  };

  const additionalFieldGridSx = uniformFieldGridSx;

  const actionButtonSx = {
    minHeight: 36,
    height: 36,
    borderRadius: "8px",
    fontSize: "13px",
    fontWeight: 600,
    px: "15px",
    width: "fit-content",
    flex: "0 0 auto",
    boxShadow: "none",
    textTransform: "none" as const,
    whiteSpace: "nowrap" as const,
    "&:hover": {
      boxShadow: "none",
    },
  };

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "User Management", to: paths.list },
        { label: pageLabel },
      ]}
      title={pageLabel}
      subtitle={pageSubtitle}
      contentGap={2}
    >
      <Box
        sx={{
          width: "100%",
          pb: 2,
        }}
      >
        {!canUseMode ? (
          <Alert severity="warning" sx={{ mb: 2 }}>
            You do not have permission to {mode} users.
          </Alert>
        ) : null}

        {canUseMode && errorMessage ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {canUseMode && isLoading ? (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            Loading user details...
          </Typography>
        ) : canUseMode ? (
          <Stack spacing={2}>
            {mode === "add" ? (
              <WorkflowStepper
                activeStep={activeStep}
                onSelect={handleSectionSelect}
                steps={STEPPER_STEPS}
              />
            ) : (
              <SectionTabs
                activeStep={activeStep}
                onSelect={handleSectionSelect}
              />
            )}

            {activeStep === "permissions" ? (
              <UserPermissionMatrix
                onToggle={handlePermissionToggle}
                onBulkChange={handlePermissionBulkChange}
                permissions={permissions}
                readOnly={mode === "view"}
              />
            ) : (
              <Stack spacing={1.5}>
                {mode === "edit" && row ? (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    sx={{ minWidth: 0 }}
                  >
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        bgcolor: theme.customTokens.brand.primaryScale[100],
                        color: theme.customTokens.brand.primary,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {getInitials(liveIdentityName)}
                    </Avatar>
                    <Stack spacing={0.1} sx={{ minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontSize: "0.875rem",
                          fontWeight: 600,
                          color: theme.customTokens.text.primary,
                          lineHeight: 1.3,
                        }}
                      >
                        {liveIdentityName}
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "0.75rem",
                          color: theme.customTokens.text.secondary,
                          lineHeight: 1.3,
                        }}
                      >
                        {liveIdentityEmail || "—"}
                      </Typography>
                    </Stack>
                  </Stack>
                ) : null}

                <Box
                  sx={(theme) => ({
                    ...formSectionCardSx(theme),
                    borderRadius: "8px",
                  })}
                >
                  <Stack spacing={1.25}>
                    <InlineFormSection title="Account Information" variant="cardTop">
                      <Box sx={accountFieldGridSx}>
                        <MasterFormFields
                          definition={{
                            fields: accountFields,
                            gridColumns: 3,
                          }}
                          onChange={handleFieldChange}
                          readOnly={mode === "view"}
                          showRequiredErrors={mode !== "view" && hasSubmitted}
                          values={values}
                        />
                      </Box>
                    </InlineFormSection>

                    <InlineFormSection title="Personal Information">
                      <Box sx={personalFieldGridSx}>
                        <MasterFormFields
                          definition={{
                            fields: personalFields,
                            gridColumns: 3,
                          }}
                          onChange={handleFieldChange}
                          readOnly={mode === "view"}
                          showRequiredErrors={mode !== "view" && hasSubmitted}
                          values={values}
                        />
                      </Box>
                    </InlineFormSection>

                    <InlineFormSection title="Address">
                      <Box sx={addressFieldGridSx}>
                        <MasterFormFields
                          definition={{
                            fields: addressFields,
                            gridColumns: 5,
                          }}
                          onChange={handleFieldChange}
                          readOnly={mode === "view"}
                          showRequiredErrors={mode !== "view" && hasSubmitted}
                          values={values}
                        />
                      </Box>
                    </InlineFormSection>

                    <InlineFormSection title="Identity Documents">
                      <Box sx={identityDocumentGridSx}>
                        <MasterFormFields
                          definition={{
                            fields: identityDocumentFields,
                            gridColumns: 4,
                          }}
                          onChange={handleFieldChange}
                          readOnly={mode === "view"}
                          showRequiredErrors={mode !== "view" && hasSubmitted}
                          values={values}
                        />
                      </Box>
                    </InlineFormSection>

                    <InlineFormSection title="Additional Information" last>
                      <Box sx={additionalFieldGridSx}>
                        <MasterFormFields
                          definition={{
                            fields: additionalFields,
                            gridColumns: 3,
                          }}
                          onChange={handleFieldChange}
                          readOnly={mode === "view"}
                          showRequiredErrors={mode !== "view" && hasSubmitted}
                          values={values}
                        />
                      </Box>
                    </InlineFormSection>
                  </Stack>
                </Box>
              </Stack>
            )}

            {mode !== "view" ? (
              <Box
                sx={{
                  width: "100%",
                  mt: 0.5,
                  pt: 1.5,
                  borderTop: `1px solid ${theme.customTokens.borders.divider}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1.5,
                  flexWrap: "wrap",
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  {activeStep === "permissions" ? (
                    <Typography
                      sx={{
                        fontSize: "0.8125rem",
                        color: theme.customTokens.text.secondary,
                      }}
                    >
                      {selectedPermissionCount} permissions selected
                    </Typography>
                  ) : null}
                </Box>

                <Stack direction="row" spacing={1.25} flexWrap="wrap" useFlexGap>
                  {activeStep === "basic" ? (
                    <>
                      <Button
                        type="button"
                        onClick={() => navigate(paths.list)}
                        sx={[recordFormActionButtonSx, actionButtonSx]}
                        variant="outlined"
                      >
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={
                          mode === "add"
                            ? handleContinueToPermissions
                            : handleSave
                        }
                        sx={[recordFormActionButtonSx, actionButtonSx]}
                        variant="contained"
                      >
                        {mode === "add"
                          ? "Save & Continue"
                          : isSaving
                            ? "Saving"
                            : "Save Changes"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        type="button"
                        onClick={() => navigate(paths.list)}
                        sx={[recordFormActionButtonSx, actionButtonSx]}
                        variant="outlined"
                      >
                        Cancel
                      </Button>

                      <Button
                        type="button"
                        disabled={isSaving}
                        onClick={handleSave}
                        startIcon={<Save size={14} />}
                        sx={[recordFormActionButtonSx, actionButtonSx]}
                        variant="contained"
                      >
                        {isSaving ? "Saving" : "Save Permissions"}
                      </Button>
                    </>
                  )}
                </Stack>
              </Box>
            ) : null}
          </Stack>
        ) : null}
      </Box>
    </MasterPageShell>
  );
}

function WorkflowStepper({
  activeStep,
  onSelect,
  steps,
}: {
  activeStep: WorkflowStep;
  onSelect: (step: WorkflowStep) => void;
  steps: { id: WorkflowStep; label: string }[];
}) {
  const theme = useTheme();

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" useFlexGap>
      {steps.map((step, index) => {
        const isActive = step.id === activeStep;
        const isComplete =
          step.id === "basic" ? activeStep === "permissions" : false;

        return (
          <Stack key={step.id} direction="row" alignItems="center" spacing={1}>
            {index > 0 ? (
              <Box
                sx={{
                  width: 20,
                  height: 1,
                  backgroundColor: theme.customTokens.borders.default,
                }}
              />
            ) : null}
            <Box
              component="button"
              type="button"
              onClick={() => onSelect(step.id)}
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                p: 0,
              }}
            >
              <Box
                sx={{
                  width: 22,
                  height: 22,
                  borderRadius: "999px",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor:
                    isActive || isComplete
                      ? theme.customTokens.brand.primary
                      : theme.customTokens.neutrals[100],
                  color:
                    isActive || isComplete
                      ? "#FFFFFF"
                      : theme.customTokens.text.secondary,
                }}
              >
                {index + 1}
              </Box>
              <Typography
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: isActive ? 600 : 500,
                  color: isActive
                    ? theme.customTokens.text.primary
                    : theme.customTokens.text.secondary,
                }}
              >
                {step.label}
              </Typography>
            </Box>
          </Stack>
        );
      })}
    </Stack>
  );
}

function SectionTabs({
  activeStep,
  onSelect,
}: {
  activeStep: WorkflowStep;
  onSelect: (step: WorkflowStep) => void;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: "flex",
        gap: 0.5,
        borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
      }}
    >
      {(
        [
          { id: "basic", label: "Basic Details" },
          { id: "permissions", label: "Permissions" },
        ] as const
      ).map((tab) => {
        const selected = tab.id === activeStep;

        return (
          <Box
            key={tab.id}
            component="button"
            type="button"
            onClick={() => onSelect(tab.id)}
            sx={{
              appearance: "none",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              px: 1.5,
              py: 1,
              mb: "-1px",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              fontWeight: selected ? 600 : 500,
              color: selected
                ? theme.customTokens.brand.primary
                : theme.customTokens.text.secondary,
              borderBottom: `2px solid ${
                selected ? theme.customTokens.brand.primary : "transparent"
              }`,
              "&:hover": {
                color: theme.customTokens.brand.primary,
              },
            }}
          >
            {tab.label}
          </Box>
        );
      })}
    </Box>
  );
}

function InlineFormSection({
  title,
  children,
  last = false,
  variant = "nested",
}: {
  title: string;
  children: ReactNode;
  last?: boolean;
  variant?: "cardTop" | "nested";
}) {
  return (
    <Stack spacing={1.5} sx={{ pb: last ? 0 : 0 }}>
      <FormSectionHeader title={title} variant={variant} />
      {children}
    </Stack>
  );
}

function filterFieldsByKeys(
  fields: readonly MasterFieldDefinition[],
  keys: readonly string[],
) {
  const keySet = new Set(keys);
  const byKey = new Map(fields.map((field) => [field.key, field]));

  return keys
    .filter((key) => keySet.has(key) && byKey.has(key))
    .map((key) => byKey.get(key)!);
}

function getCompactFieldGridSx(
  fieldMaxWidths: readonly number[],
  options: { phoneFieldIndex?: number } = {},
) {
  const fieldWidthRules = Object.fromEntries(
    fieldMaxWidths.map((maxWidth, index) => [
      `& > div > .MuiStack-root:nth-of-type(${index + 1})`,
      {
        width: "100%",
        minWidth: 0,
        maxWidth: {
          xs: "100%",
          sm: `min(100%, ${maxWidth}px)`,
          md: maxWidth,
        },
        justifySelf: "start",
      },
    ]),
  );

  const phoneFieldIndex = options.phoneFieldIndex;

  return {
    "& > div": {
      display: "grid !important",
      justifyContent: "start",
      justifyItems: "start",
      columnGap: "16px !important",
      rowGap: "14px !important",
      gridTemplateColumns: {
        xs: "minmax(0, 1fr) !important",
        sm: "repeat(2, minmax(0, max-content)) !important",
        md: "repeat(3, max-content) !important",
      },
    },
    ...fieldWidthRules,
    ...(phoneFieldIndex
      ? {
          [`& > div > .MuiStack-root:nth-of-type(${phoneFieldIndex}) > .MuiBox-root`]:
            {
              width: "100%",
              maxWidth: {
                xs: "100%",
                md: 308,
              },
              gridTemplateColumns: {
                xs: "80px minmax(0, 1fr) !important",
                md: "80px 220px !important",
              },
            },
        }
      : {}),
  };
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
