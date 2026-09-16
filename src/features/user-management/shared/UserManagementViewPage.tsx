import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronLeft, Pencil } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterPageShell, MasterSectionCard } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { UserPermissionMatrix } from "./UserPermissionMatrix";
import {
  getUserManagementPaths,
  type UserManagementDetail,
} from "./userManagementConfig";
import { fetchUserManagementDetail } from "./userManagementApi";

type ViewTab = "overview" | "permissions";

export function UserManagementViewPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getUserManagementPaths();
  const canEdit = canAccessPermission("userManagement", "edit");
  const canView = canAccessPermission("userManagement", "view");

  const [row, setRow] = useState<UserManagementDetail | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");
      setNotFound(false);

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
  }, [params.id]);

  const displayName = useMemo(() => {
    if (!row) {
      return "User";
    }

    const fullName = `${row.firstName} ${row.lastName}`.trim();
    return fullName || row.userName || row.email || "User";
  }, [row]);

  const initials = getInitials(displayName);
  const isActive = Boolean(row?.isActive);

  const actionButtonSx = {
    minHeight: 36,
    height: 36,
    borderRadius: "8px",
    fontSize: "0.875rem",
    fontWeight: 500,
    px: 1.75,
    boxShadow: "none",
    textTransform: "none" as const,
    "&:hover": {
      boxShadow: "none",
    },
  };

  if (!canView) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "User Management", to: paths.list },
          { label: "View User" },
        ]}
        title="View User"
        subtitle="Review user profile and account access."
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view users.
        </Alert>
      </MasterPageShell>
    );
  }

  if (notFound) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "User Management", to: paths.list },
          { label: "Not Found" },
        ]}
        title="View User"
        contentGap={1.5}
      >
        <MasterSectionCard>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            {errorMessage || "The requested user could not be found."}
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "User Management", to: paths.list },
        { label: "View User" },
      ]}
      title="View User"
      subtitle="Review user profile and account access."
      contentGap={1.5}
      actions={
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Button
            onClick={() => navigate(paths.list)}
            startIcon={<ChevronLeft size={14} />}
            sx={[recordViewActionButtonSx, actionButtonSx]}
            variant="outlined"
          >
            Back
          </Button>

          {row && canEdit ? (
            <Button
              onClick={() => navigate(paths.edit(row.id))}
              startIcon={<Pencil size={14} />}
              sx={[recordViewActionButtonSx, actionButtonSx]}
              variant="contained"
            >
              Edit
            </Button>
          ) : null}
        </Stack>
      }
    >
      <Box
        sx={{
          width: "100%",
        }}
      >
        {errorMessage && !notFound ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {isLoading || !row ? (
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            Loading user details...
          </Typography>
        ) : (
          <Stack spacing={1.5}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 2,
                flexWrap: "wrap",
                minHeight: 112,
                px: 2,
                py: 1.75,
                borderRadius: "10px",
                border: `1px solid ${theme.customTokens.borders.default}`,
                backgroundColor: theme.customTokens.surfaces.surface,
              }}
            >
              <Avatar
                sx={{
                  width: 52,
                  height: 52,
                  bgcolor: theme.customTokens.brand.primaryScale[100],
                  color: theme.customTokens.brand.primary,
                  fontSize: "1rem",
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </Avatar>

              <Stack spacing={0.35} sx={{ minWidth: 0, flex: "1 1 180px" }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1}
                  flexWrap="wrap"
                  useFlexGap
                >
                  <Typography
                    sx={{
                      fontSize: "1.1875rem",
                      fontWeight: 600,
                      letterSpacing: "-0.01em",
                      color: theme.customTokens.text.primary,
                      lineHeight: 1.25,
                    }}
                  >
                    {displayName}
                  </Typography>

                  <Chip
                    label={isActive ? "Active" : "Inactive"}
                    size="small"
                    sx={{
                      height: 22,
                      borderRadius: "6px",
                      fontSize: "0.6875rem",
                      fontWeight: 600,
                      backgroundColor: isActive
                        ? theme.customTokens.semanticScale.success[100]
                        : theme.customTokens.neutrals[100],
                      color: isActive
                        ? theme.customTokens.semanticScale.success[800]
                        : theme.customTokens.neutrals[700],
                      border: `1px solid ${
                        isActive
                          ? theme.customTokens.semanticScale.success[200]
                          : theme.customTokens.neutrals[200]
                      }`,
                      "& .MuiChip-label": {
                        px: 1,
                      },
                    }}
                  />
                </Stack>

                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    color: theme.customTokens.text.secondary,
                    lineHeight: 1.3,
                  }}
                >
                  {row.email || "—"}
                </Typography>
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr)",
                  columnGap: 1.25,
                  rowGap: 0.75,
                  minWidth: { xs: "100%", sm: 240 },
                  flex: "1 1 220px",
                }}
              >
                <SummaryMetaLabel>Department</SummaryMetaLabel>
                <SummaryMetaValue>{row.department || "—"}</SummaryMetaValue>
                <SummaryMetaLabel>Phone</SummaryMetaLabel>
                <SummaryMetaValue>{row.phoneNo || "—"}</SummaryMetaValue>
              </Box>

              {canEdit ? (
                <Button
                  onClick={() => navigate(paths.edit(row.id))}
                  startIcon={<Pencil size={14} />}
                  sx={[
                    recordViewActionButtonSx,
                    actionButtonSx,
                    { ml: { xs: 0, md: "auto" } },
                  ]}
                  variant="outlined"
                >
                  Edit
                </Button>
              ) : null}
            </Box>

            <Tabs
              value={activeTab}
              onChange={(_, value: ViewTab) => setActiveTab(value)}
              sx={{
                minHeight: 36,
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
                "& .MuiTab-root": {
                  minHeight: 36,
                  px: 1.25,
                  py: 0.75,
                  color: theme.customTokens.text.secondary,
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  textTransform: "none",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: theme.customTokens.brand.primary,
                  fontWeight: 600,
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: theme.customTokens.brand.primary,
                  height: 2,
                },
              }}
            >
              <Tab label="Overview" value="overview" />
              <Tab label="Permissions" value="permissions" />
            </Tabs>

            {activeTab === "permissions" ? (
              <UserPermissionMatrix
                permissions={row.permissions}
                readOnly
                onToggle={() => undefined}
              />
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gap: 1.5,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(2, minmax(0, 1fr))",
                  },
                }}
              >
                <DetailCard title="Account Details">
                  <DetailGrid
                    items={[
                      { label: "User Name", value: row.userName },
                      { label: "First Name", value: row.firstName },
                      { label: "Last Name", value: row.lastName },
                      { label: "Email", value: row.email },
                      { label: "Phone", value: row.phoneNo },
                      { label: "Department", value: row.department },
                    ]}
                  />
                </DetailCard>

                <DetailCard title="Personal Details">
                  <DetailGrid
                    items={[
                      {
                        label: "Date of Birth",
                        value: formatDisplayDate(row.dateOfBirth),
                      },
                      { label: "Age", value: row.age },
                      { label: "Blood Group", value: row.bloodGroup },
                    ]}
                  />
                </DetailCard>

                <DetailCard title="Address">
                  <DetailGrid
                    items={[
                      { label: "Address", value: row.address, fullWidth: true },
                      { label: "Country", value: row.country },
                      { label: "State", value: row.state },
                      { label: "City", value: row.city },
                      { label: "Pincode", value: row.pincode },
                    ]}
                  />
                </DetailCard>

                <DetailCard title="Identity Documents">
                  <DetailGrid
                    items={[
                      { label: "Aadhaar No", value: row.aadhaarNo ?? "" },
                      {
                        label: "Aadhaar Upload",
                        value: row.aadhaarUpload ?? "",
                      },
                      { label: "PAN No", value: row.panNo ?? "" },
                      { label: "PAN Upload", value: row.panUpload ?? "" },
                    ]}
                  />
                </DetailCard>

                <DetailCard title="Additional Information">
                  <DetailField
                    label="Remarks"
                    value={row.remarks}
                    allowWrap
                  />
                </DetailCard>
              </Box>
            )}
          </Stack>
        )}
      </Box>
    </MasterPageShell>
  );
}

function DetailCard({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        ...formSectionCardSx(theme),
        borderRadius: "8px",
        minWidth: 0,
      }}
    >
      <Stack spacing={1.25}>
        <FormSectionHeader title={title} />
        {children}
      </Stack>
    </Box>
  );
}

function DetailGrid({
  items,
}: {
  items: {
    label: string;
    value: string;
    fullWidth?: boolean;
  }[];
}) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
        },
        columnGap: 2,
        rowGap: 1.25,
      }}
    >
      {items.map((item) => (
        <Box
          key={item.label}
          sx={{
            gridColumn: item.fullWidth ? "1 / -1" : "auto",
            minWidth: 0,
          }}
        >
          <DetailField label={item.label} value={item.value} />
        </Box>
      ))}
    </Box>
  );
}

function DetailField({
  label,
  value,
  allowWrap = false,
}: {
  label: string;
  value: string;
  allowWrap?: boolean;
}) {
  const theme = useTheme();

  return (
    <Stack spacing={0.5}>
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 500,
          color: theme.customTokens.text.secondary,
          lineHeight: 1.3,
        }}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 400,
          color: theme.customTokens.text.primary,
          lineHeight: 1.45,
          whiteSpace: allowWrap ? "pre-wrap" : "nowrap",
          overflow: allowWrap ? "visible" : "hidden",
          textOverflow: allowWrap ? "clip" : "ellipsis",
          wordBreak: allowWrap ? "break-word" : "normal",
        }}
      >
        {value?.trim() ? value : "—"}
      </Typography>
    </Stack>
  );
}

function SummaryMetaLabel({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <Typography
      sx={{
        fontSize: "0.75rem",
        fontWeight: 500,
        color: theme.customTokens.text.secondary,
        lineHeight: 1.35,
      }}
    >
      {children}
    </Typography>
  );
}

function SummaryMetaValue({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <Typography
      sx={{
        fontSize: "0.8125rem",
        fontWeight: 500,
        color: theme.customTokens.text.primary,
        lineHeight: 1.35,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </Typography>
  );
}

function formatDisplayDate(value: Date | string | undefined) {
  if (!value) {
    return "—";
  }

  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
