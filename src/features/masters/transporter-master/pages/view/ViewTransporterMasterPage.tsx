import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Building2,
  ChevronLeft,
  Compass,
  GitBranch,
  MessageSquare,
  Pencil,
  Truck,
  UserCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterPageShell, MasterSectionCard } from "../../../shared";
import { ContentLoader } from "../../../../../components/feedback/ContentLoader";
import { canAccessPermission } from "../../../../permissions";
import { recordViewActionButtonSx } from "../../../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../../shared/formSectionStyles";
import { getMasterPaths } from "../../../shared/utils";
import { fetchTransporterMasterDetail } from "../../api/transporterMasterApi";

export function ViewTransporterMasterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getMasterPaths("transporter-master");
  const canEdit = canAccessPermission("transporterMaster", "edit");
  const canView = canAccessPermission("transporterMaster", "view");

  const detailQuery = useQuery({
    queryKey: ["transporter-master", "detail", params.id ?? ""],
    queryFn: () => fetchTransporterMasterDetail(params.id!),
    enabled: Boolean(params.id),
  });

  const row = detailQuery.data;
  const isLoading = Boolean(params.id) && detailQuery.isLoading;
  const notFound = !params.id || detailQuery.isError || (!detailQuery.isLoading && !row);
  const errorMessage =
    !params.id
      ? ""
      : detailQuery.error instanceof Error
        ? detailQuery.error.message
        : "";

  const handleBack = () => {
    navigate(paths.list);
  };

  const displayName = useMemo(() => {
    if (!row) return "Transporter";
    return String(row.transporterName || row.name || "Transporter").trim();
  }, [row]);

  const initials = useMemo(() => {
    if (!displayName) return "TR";
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0]! + parts[1][0]!).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const isActive = String(row?.status ?? "Active").toLowerCase() !== "inactive";
  const remarkValue = String(row?.remark ?? row?.remarks ?? "").trim();

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
          { label: "Transporter Master", to: paths.list },
          { label: "View Transporter" },
        ]}
        title="View Transporter"
        subtitle=" "
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view transporter master records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (notFound && !isLoading) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Transporter Master", to: paths.list },
          { label: "Not Found" },
        ]}
        title="View Transporter"
        contentGap={1.5}
      >
        <MasterSectionCard>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            Transporter record not found.
          </Typography>
          <Button
            onClick={handleBack}
            sx={{
              ...recordViewActionButtonSx,
              mt: 2,
              minHeight: 32,
              height: 32,
              borderRadius: "8px",
              fontSize: "0.8125rem",
              backgroundColor: theme.customTokens.brand.primary,
              color: "#FFFFFF",
            }}
            variant="contained"
          >
            Back to Listing
          </Button>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Transporter Master", to: paths.list },
        { label: displayName || "View Transporter" },
      ]}
      title="View Transporter"
      contentGap={1.5}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">
          <Button
            onClick={handleBack}
            startIcon={<ChevronLeft size={16} />}
            sx={{
              ...actionButtonSx,
              border: `1px solid ${theme.customTokens.borders.default}`,
              color: theme.customTokens.text.primary,
              backgroundColor: "transparent",
              "&:hover": {
                backgroundColor: theme.customTokens.surfaces.paper,
                borderColor: theme.customTokens.borders.default,
              },
            }}
            variant="outlined"
          >
            Back
          </Button>

          {canEdit && (
            <Button
              onClick={() => {
                if (params.id) {
                  navigate(paths.edit(params.id));
                }
              }}
              startIcon={<Pencil size={16} />}
              sx={[
                recordViewActionButtonSx,
                actionButtonSx,
                {
                  backgroundColor: theme.customTokens.brand.primary,
                  color: "#FFFFFF",
                },
              ]}
              variant="contained"
            >
              Edit Transporter
            </Button>
          )}
        </Stack>
      }
    >
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {isLoading || !row ? (
          <ContentLoader label="Loading transporter details..." minHeight={200} />
        ) : (
          <Stack spacing={2}>
            {/* Header Identity Card */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1.5,
                flexWrap: "wrap",
                px: 1.75,
                py: 1,
                borderRadius: "8px",
                border: `1px solid ${theme.customTokens.borders.default}`,
                backgroundColor: theme.customTokens.surfaces.surface,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="center" sx={{ minWidth: 0, flex: "1 1 auto" }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.customTokens.brand.primaryScale[100],
                    color: theme.customTokens.brand.primary,
                    fontSize: "0.9375rem",
                    fontWeight: 700,
                    borderRadius: "10px",
                    flexShrink: 0,
                  }}
                >
                  {initials}
                </Avatar>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontSize: "1.0625rem",
                      fontWeight: 700,
                      color: theme.customTokens.text.primary,
                      lineHeight: 1.25,
                    }}
                  >
                    {displayName}
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mt: 0.5, flexWrap: "wrap", gap: 0.5 }}
                  >
                    {row.transporterId || row.transporterCode ? (
                      <Typography
                        sx={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: theme.customTokens.text.secondary,
                        }}
                      >
                        ID: {String(row.transporterId || row.transporterCode)}
                      </Typography>
                    ) : null}

                    {row.branchName ? (
                      <Chip
                        label={`Branch: ${String(row.branchName)}`}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: theme.customTokens.surfaces.paper,
                          border: `1px solid ${theme.customTokens.borders.default}`,
                        }}
                      />
                    ) : null}

                    {row.type ? (
                      <Chip
                        label={String(row.type)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: theme.customTokens.surfaces.paper,
                          border: `1px solid ${theme.customTokens.borders.default}`,
                        }}
                      />
                    ) : null}

                    {row.areaOfOperation ? (
                      <Chip
                        label={String(row.areaOfOperation)}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.75rem",
                          fontWeight: 500,
                          backgroundColor: theme.customTokens.surfaces.paper,
                          border: `1px solid ${theme.customTokens.borders.default}`,
                        }}
                      />
                    ) : null}
                  </Stack>
                </Box>
              </Stack>

              <Chip
                label={isActive ? "Active" : "Inactive"}
                size="small"
                sx={{
                  alignSelf: { xs: "flex-start", sm: "center" },
                  height: 24,
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  backgroundColor: isActive
                    ? "rgba(46, 125, 50, 0.12)"
                    : "rgba(211, 47, 47, 0.12)",
                  color: isActive ? "#2E7D32" : "#D32F2F",
                  border: `1px solid ${
                    isActive ? "rgba(46, 125, 50, 0.3)" : "rgba(211, 47, 47, 0.3)"
                  }`,
                }}
              />
            </Box>

            {/* Main Information Cards Grid (2-column layout) */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "repeat(2, minmax(0, 1fr))",
                },
                gap: 1.25,
              }}
            >
              {/* Basic Transporter Details Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Transporter Details"
                  icon={Truck}
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
                    rowGap: 1,
                    mt: 1,
                  }}
                >
                  <ProfileField label="Transporter Name" value={row.transporterName ? String(row.transporterName) : undefined} />
                  <ProfileField label="Transporter ID" value={row.transporterId || row.transporterCode ? String(row.transporterId || row.transporterCode) : undefined} />
                  <ProfileField label="Branch Name" value={row.branchName ? String(row.branchName) : undefined} />
                  <ProfileField label="Status" value={isActive ? "Active" : "Inactive"} />
                </Box>
              </Box>

              {/* Transit & Operations Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Operations & Logistics"
                  icon={Compass}
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
                    rowGap: 1,
                    mt: 1,
                  }}
                >
                  <ProfileField label="Transport Mode / Type" value={row.type ? String(row.type) : undefined} />
                  <ProfileField label="Area of Operation" value={row.areaOfOperation ? String(row.areaOfOperation) : undefined} />
                </Box>
              </Box>
            </Box>

            {/* Remarks Section (if provided) */}
            {remarkValue ? (
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
                <Box sx={{ mt: 1 }}>
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: theme.customTokens.text.primary,
                      whiteSpace: "pre-wrap",
                      lineHeight: 1.6,
                      p: 1.5,
                      borderRadius: "6px",
                      backgroundColor: theme.customTokens.surfaces.paper,
                      border: `1px solid ${theme.customTokens.borders.default}`,
                    }}
                  >
                    {remarkValue}
                  </Typography>
                </Box>
              </Box>
            ) : null}

            {/* Audit Metadata Card */}
            {(row.createdBy || row.createdAt || row.createdDate) ? (
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                })}
              >
                <FormSectionHeader
                  title="Audit Information"
                  icon={UserCheck}
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
                    rowGap: 1,
                    mt: 1,
                  }}
                >
                  <ProfileField label="Created By" value={row.createdBy ? String(row.createdBy) : undefined} />
                  <ProfileField
                    label="Created Date"
                    value={formatDisplayDateTime(row.createdDate || row.createdAt)}
                  />
                  <ProfileField
                    label="Updated By"
                    value={
                      row.editedBy || row.updatedBy || row.createdBy
                        ? String(row.editedBy || row.updatedBy || row.createdBy)
                        : undefined
                    }
                  />
                  <ProfileField
                    label="Updated Date"
                    value={formatDisplayDateTime(row.updatedDate || row.updatedAt)}
                  />
                </Box>
              </Box>
            ) : null}
          </Stack>
        )}
      </Box>
    </MasterPageShell>
  );
}

function ProfileField({
  label,
  value,
  allowWrap = false,
}: {
  label: string;
  value?: string | number | null | undefined;
  allowWrap?: boolean | undefined;
}) {
  const theme = useTheme();
  const rawValue = value !== undefined && value !== null ? String(value).trim() : "";
  const hasValue = Boolean(rawValue);

  return (
    <Box sx={{ minWidth: 0, py: 0.1 }}>
      <Typography
        sx={{
          fontSize: "0.71875rem",
          fontWeight: 700,
          color: theme.customTokens.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.25,
          mb: 0.2,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: "0.875rem",
          fontWeight: 500,
          color: hasValue
            ? theme.customTokens.text.primary
            : theme.customTokens.text.secondary,
          lineHeight: 1.35,
          whiteSpace: allowWrap ? "normal" : "nowrap",
          overflow: allowWrap ? "visible" : "hidden",
          textOverflow: allowWrap ? "clip" : "ellipsis",
        }}
      >
        {hasValue ? rawValue : "—"}
      </Typography>
    </Box>
  );
}

function formatDisplayDateTime(dateVal?: unknown): string {
  if (!dateVal) return "—";
  try {
    const d = new Date(dateVal as string | number | Date);
    if (Number.isNaN(d.getTime())) return String(dateVal);
    return d.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateVal);
  }
}
