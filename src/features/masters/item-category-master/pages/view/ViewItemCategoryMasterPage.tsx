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
  Folder,
  MessageSquare,
  Pencil,
  Tag,
  UserCheck,
} from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterDetailLoadAlert, MasterPageShell } from "../../../shared";
import { ContentLoader } from "../../../../../components/feedback/ContentLoader";
import { canAccessPermission } from "../../../../permissions";
import { recordViewActionButtonSx } from "../../../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../../shared/formSectionStyles";
import { getMasterPaths } from "../../../shared/utils";
import { getItemCategoryByIdApi } from "../../api/itemCategoryMasterApi";

export function ViewItemCategoryMasterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getMasterPaths("item-category-master");
  const canEdit = canAccessPermission("itemCategoryMaster", "edit");
  const canView = canAccessPermission("itemCategoryMaster", "view");

  const detailQuery = useQuery({
    queryKey: ["item-category-master", "detail", params.id ?? ""],
    queryFn: () => getItemCategoryByIdApi(params.id!),
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

  const displayName = useMemo(() => {
    if (!row) return "Category";
    return String(row.categoryName || row.name || "Category").trim();
  }, [row]);

  const initials = useMemo(() => {
    if (!displayName) return "IC";
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
          { label: "Item Category Master", to: paths.list },
          { label: "View Item Category Master" },
        ]}
        title="View Item Category Master"
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view item category master records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (notFound && !isLoading) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Item Category Master", to: paths.list },
          { label: "Not Found" },
        ]}
        title="View Item Category Master"
        contentGap={1.5}
      >
        <MasterDetailLoadAlert
          error={detailQuery.error}
          notFoundLabel="Item category record not found."
        />
      </MasterPageShell>
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Item Category Master", to: paths.list },
        { label: displayName || "View Item Category" },
      ]}
      title="View Item Category Master"
      contentGap={1.5}
      actions={
        <Stack direction="row" spacing={1} alignItems="center">

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
              Edit Category
            </Button>
          )}
        </Stack>
      }
    >
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {isLoading || !row ? (
          <ContentLoader label="Loading item category details..." minHeight={200} />
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
                    {row.hsn || row.hsnCode ? (
                      <Chip
                        label={`HSN: ${String(row.hsn || row.hsnCode)}`}
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

                    {row.gst || row.gstNo ? (
                      <Chip
                        label={`GST: ${String(row.gst || row.gstNo).replace(/%/g, "")}%`}
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
              {/* Category Details Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Category Details"
                  icon={Folder}
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
                  <ProfileField label="Category Name" value={row.categoryName ? String(row.categoryName) : undefined} />
                  <ProfileField label="Status" value={isActive ? "Active" : "Inactive"} />
                </Box>
              </Box>

              {/* Taxation & Classification Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Tax & Classification"
                  icon={Tag}
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
                  <ProfileField label="HSN Code" value={row.hsn || row.hsnCode ? String(row.hsn || row.hsnCode) : undefined} />
                  <ProfileField
                    label="GST %"
                    value={
                      row.gst || row.gstNo
                        ? `${String(row.gst || row.gstNo).replace(/%/g, "")}%`
                        : undefined
                    }
                  />
                  <ProfileField label="Category ID" value={row.id ? String(row.id) : undefined} />
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
