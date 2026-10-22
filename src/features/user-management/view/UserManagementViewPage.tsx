import { useMemo, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { ChevronLeft, Eye, FileCheck, FileText, MapPin, MessageSquare, Pencil, UserCheck, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterPageShell, MasterSectionCard } from "../../masters/shared";
import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import { ContentLoader } from "../../../components/feedback/ContentLoader";
import { canAccessPermission } from "../../permissions";
import { recordViewActionButtonSx } from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { UserPermissionMatrix } from "../shared/UserPermissionMatrix";
import {
  getUserManagementPaths,
  type UserManagementDetail,
} from "../shared/userManagementConfig";
import { fetchUserManagementDetail } from "../api/userManagementApi";
import { queryKeys } from "../../../query/queryKeys";

type ViewTab = "overview" | "permissions";

export function UserManagementViewPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getUserManagementPaths();
  const canEdit = canAccessPermission("userManagement", "edit");
  const canView = canAccessPermission("userManagement", "view");

  const detailQuery = useQuery({
    queryKey: queryKeys.users.detail(params.id ?? ""),
    queryFn: () => fetchUserManagementDetail(params.id!),
    enabled: Boolean(params.id),
  });
  const row = detailQuery.data;
  const isLoading = Boolean(params.id) && detailQuery.isLoading;
  const notFound = !params.id || detailQuery.isError;
  const errorMessage =
    !params.id
      ? ""
      : detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "";
  const [activeTab, setActiveTab] = useState<ViewTab>("overview");
  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
    isPdf: boolean;
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

  const handleBack = () => {
    navigate(paths.list);
  };

  const openDocumentPreview = (title: string, fileUrlOrName?: string) => {
    if (!fileUrlOrName || !fileUrlOrName.trim()) return;
    const url = fileUrlOrName.trim();
    const cleanPath = (url.split("?")[0] ?? "").toLowerCase();
    const isPdf = cleanPath.endsWith(".pdf") || url.startsWith("data:application/pdf");
    setPreviewDoc({
      name: title,
      url,
      isPdf,
    });
  };

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
        subtitle=" "
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
      backNav={{
        label: "Back to User Management",
        to: paths.list,
        onBack: handleBack,
      }}
      breadcrumbs={[
        { label: "User Management", to: paths.list },
        { label: "View User" },
      ]}
      title="View User"
      contentGap={1.5}
      actions={
        row && canEdit ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              onClick={() => navigate(paths.edit(row.id))}
              startIcon={<Pencil size={14} />}
              sx={[recordViewActionButtonSx, actionButtonSx]}
              variant="contained"
            >
              Edit
            </Button>
          </Stack>
        ) : null
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
          <ContentLoader label="Loading..." minHeight={200} />
        ) : (
          <Stack spacing={2}>
            {/* Compact Professional Profile Header Card */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
                flexWrap: "wrap",
                px: 2.25,
                py: 1.75,
                borderRadius: "8px",
                border: `1px solid ${theme.customTokens.borders.default}`,
                backgroundColor: theme.customTokens.surfaces.surface,
              }}
            >
              <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: "1 1 auto" }}>
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: theme.customTokens.brand.primaryScale[100],
                    color: theme.customTokens.brand.primary,
                    fontSize: "1.05rem",
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </Avatar>

                <Stack spacing={0.35} sx={{ minWidth: 0 }}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.25}
                    flexWrap="wrap"
                    useFlexGap
                  >
                    <Typography
                      sx={{
                        fontSize: "1.125rem",
                        fontWeight: 700,
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
                        height: 20,
                        borderRadius: "5px",
                        fontSize: "0.6875rem",
                        fontWeight: 600,
                        backgroundColor: isActive
                          ? theme.customTokens.semanticScale.success[100]
                          : theme.customTokens.neutrals[100],
                        color: isActive
                          ? theme.customTokens.semanticScale.success[800]
                          : theme.customTokens.neutrals[700],
                        border: `1px solid ${isActive
                          ? theme.customTokens.semanticScale.success[200]
                          : theme.customTokens.neutrals[200]
                          }`,
                        "& .MuiChip-label": {
                          px: 0.85,
                        },
                      }}
                    />
                  </Stack>

                  <Typography
                    sx={{
                      fontSize: "0.8125rem",
                      color: theme.customTokens.text.secondary,
                      lineHeight: 1.35,
                    }}
                  >
                    {[
                      row.userName ? `@${row.userName}` : "",
                      row.department || "",
                      row.email || "",
                      row.role ? `Role: ${row.role}` : "",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            <Tabs
              value={activeTab}
              onChange={(_, value: ViewTab) => setActiveTab(value)}
              sx={{
                minHeight: 36,
                borderBottom: `1px solid ${theme.customTokens.borders.divider}`,
                "& .MuiTab-root": {
                  minHeight: 36,
                  px: 1.5,
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
              <Stack spacing={2}>
                {/* 2-Column Responsive Layout: Personal Information & Contact/Address */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      lg: "repeat(2, minmax(0, 1fr))",
                    },
                    gap: 2,
                  }}
                >
                  {/* Personal Information Card */}
                  <Box
                    sx={(theme) => ({
                      ...formSectionCardSx(theme),
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                    })}
                  >
                    <FormSectionHeader
                      title="Personal Information"
                      icon={UserCheck}
                      variant="cardTop"
                    />
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        columnGap: 2.5,
                        rowGap: 1.5,
                        mt: 1.5,
                      }}
                    >
                      <ProfileField label="First Name" value={row.firstName} />
                      <ProfileField label="Last Name" value={row.lastName} />
                      <ProfileField
                        label="Date Of Birth"
                        value={formatDisplayDate(row.dateOfBirth)}
                      />
                      <ProfileField label="Age" value={row.age} />
                      <ProfileField label="Blood Group" value={row.bloodGroup} />
                      <ProfileField label="Gender" value={row.gender} />
                    </Box>
                  </Box>

                  {/* Contact & Address Card */}
                  <Box
                    sx={(theme) => ({
                      ...formSectionCardSx(theme),
                      borderRadius: "8px",
                      display: "flex",
                      flexDirection: "column",
                    })}
                  >
                    <FormSectionHeader
                      title="Contact & Address"
                      icon={MapPin}
                      variant="cardTop"
                    />
                    <Box
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          sm: "repeat(2, minmax(0, 1fr))",
                        },
                        columnGap: 2.5,
                        rowGap: 1.5,
                        mt: 1.5,
                      }}
                    >
                      <ProfileField label="Phone Number" value={row.phoneNo} isPhone />
                      <ProfileField label="City" value={row.city} />
                      <ProfileField label="State" value={row.state} />
                      <ProfileField label="Country" value={row.country} />
                      <ProfileField label="Pincode" value={row.pincode} />
                      <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                        <ProfileField label="Address" value={row.address} allowWrap />
                      </Box>
                    </Box>
                  </Box>
                </Box>

                {/* Identity Documents Card */}
                <Box
                  sx={(theme) => ({
                    ...formSectionCardSx(theme),
                    borderRadius: "8px",
                  })}
                >
                  <FormSectionHeader
                    title="Identity Documents"
                    icon={FileCheck}
                    variant="cardTop"
                  />
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))",
                      },
                      columnGap: 2.5,
                      rowGap: 1.5,
                      mt: 1.5,
                    }}
                  >
                    <ProfileField
                      label="Aadhaar Number"
                      value={row.aadhaarNo}
                    />
                    <DocumentStatusField
                      label="Aadhaar Document"
                      fileUrl={row.aadhaarUpload}
                      title="Aadhaar Document"
                      onPreview={openDocumentPreview}
                    />
                    <ProfileField
                      label="PAN Number"
                      value={row.panNo}
                    />
                    <DocumentStatusField
                      label="PAN Document"
                      fileUrl={row.panUpload}
                      title="PAN Document"
                      onPreview={openDocumentPreview}
                    />
                  </Box>
                </Box>

                {/* Remarks (Only shown if present) */}
                {row.remarks && row.remarks.trim() ? (
                  <Box
                    sx={(theme) => ({
                      ...formSectionCardSx(theme),
                      borderRadius: "8px",
                    })}
                  >
                    <FormSectionHeader
                      title="Remarks"
                      icon={MessageSquare}
                      variant="cardTop"
                    />
                    <Box sx={{ mt: 1.5 }}>
                      <ProfileField label="Remarks" value={row.remarks} allowWrap />
                    </Box>
                  </Box>
                ) : null}
              </Stack>
            )}
          </Stack>
        )}
      </Box>

      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setPreviewDoc(null)}
        open={previewDoc !== null}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            {previewDoc?.name ?? "Document Preview"}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setPreviewDoc(null)}
            size="small"
            sx={{ color: (theme) => theme.palette.grey[500] }}
          >
            <X size={18} />
          </IconButton>
        </DialogTitle>
        <DialogContent
          dividers
          sx={{
            p: 1.5,
            minHeight: 450,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
          }}
        >
          {previewDoc?.url && !previewDoc.isPdf ? (
            <Box
              component="img"
              src={previewDoc.url}
              alt={previewDoc.name}
              sx={{
                maxWidth: "100%",
                maxHeight: "70vh",
                width: "auto",
                height: "auto",
                objectFit: "contain",
                display: "block",
                borderRadius: 1,
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            />
          ) : previewDoc?.url && previewDoc.isPdf ? (
            <Box
              component="iframe"
              src={previewDoc.url}
              title={previewDoc.name}
              sx={{
                width: "100%",
                height: "70vh",
                border: 0,
                borderRadius: 1,
              }}
            />
          ) : (
            <Typography variant="body2" color="text.secondary">
              No preview available for this document.
            </Typography>
          )}
        </DialogContent>
      </Dialog>

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

function ProfileField({
  label,
  value,
  isPhone = false,
  allowWrap = false,
}: {
  label: string;
  value?: string | number | null;
  isPhone?: boolean;
  allowWrap?: boolean;
}) {
  const theme = useTheme();
  const rawValue = value !== undefined && value !== null ? String(value).trim() : "";
  const hasValue = Boolean(rawValue);

  return (
    <Box sx={{ minWidth: 0, py: 0.25 }}>
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: theme.customTokens.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.3,
          mb: 0.35,
        }}
      >
        {label}
      </Typography>

      {isPhone && hasValue ? (
        <Typography
          component="a"
          href={`tel:${rawValue.replace(/[^\d+]/g, "")}`}
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: theme.customTokens.brand.primary,
            lineHeight: 1.4,
            textDecoration: "none",
            display: "inline-block",
            "&:hover": {
              textDecoration: "underline",
            },
          }}
        >
          {rawValue}
        </Typography>
      ) : (
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: hasValue
              ? theme.customTokens.text.primary
              : theme.customTokens.text.secondary,
            lineHeight: 1.4,
            whiteSpace: allowWrap ? "pre-wrap" : "nowrap",
            overflow: allowWrap ? "visible" : "hidden",
            textOverflow: allowWrap ? "clip" : "ellipsis",
            wordBreak: allowWrap ? "break-word" : "normal",
          }}
        >
          {hasValue ? rawValue : "—"}
        </Typography>
      )}
    </Box>
  );
}

function DocumentStatusField({
  label,
  fileUrl,
  title,
  onPreview,
}: {
  label: string;
  fileUrl?: string | null;
  title: string;
  onPreview: (url: string, name: string) => void;
}) {
  const theme = useTheme();
  const hasFile = Boolean(fileUrl?.trim());

  return (
    <Box sx={{ minWidth: 0, py: 0.25 }}>
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: theme.customTokens.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.3,
          mb: 0.35,
        }}
      >
        {label}
      </Typography>

      {hasFile ? (
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            onClick={() => onPreview(fileUrl!, title)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 1.25,
              py: 0.4,
              borderRadius: "6px",
              cursor: "pointer",
              bgcolor: theme.customTokens.brand.primaryScale[50] || "#fef2f2",
              border: `1px solid ${theme.customTokens.brand.primaryScale[200] || "#fecaca"}`,
              color: theme.customTokens.brand.primary,
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: theme.customTokens.brand.primaryScale[100] || "#fee2e2",
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              },
            }}
          >
            <Eye size={14} />
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: "inherit",
              }}
            >
              Uploaded (View)
            </Typography>
          </Box>
        </Stack>
      ) : (
        <Typography
          sx={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: theme.customTokens.text.secondary,
            lineHeight: 1.4,
          }}
        >
          Not Uploaded
        </Typography>
      )}
    </Box>
  );
}

function maskAadhaar(val?: string | null) {
  if (!val || !val.trim()) return "—";
  const cleaned = val.replace(/\s+/g, "");
  if (cleaned.length >= 4) {
    return `XXXX XXXX ${cleaned.slice(-4)}`;
  }
  return val;
}

function maskPan(val?: string | null) {
  if (!val || !val.trim()) return "—";
  const cleaned = val.trim();
  if (cleaned.length >= 4) {
    return `*****${cleaned.slice(-4)}`;
  }
  return cleaned;
}

function formatDisplayDate(value: Date | string | undefined | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatDisplayDateTime(value: Date | string | undefined | null) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

