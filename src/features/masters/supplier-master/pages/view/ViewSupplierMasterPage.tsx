import { useMemo, useState } from "react";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
  useTheme,
} from "@mui/material";
import {
  Building2,
  Eye,
  FileCheck,
  FileText,
  MapPin,
  MessageSquare,
  Pencil,
  ShieldCheck,
  UserCheck,
  Users,
  X,
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
import {
  fetchSupplierMasterDetail,
  type SupplierContactPersonInput,
  type SupplierMasterDetail,
} from "../../api/supplierMasterApi";
import {
  getMasterDocumentDisplayName,
  getMasterDocumentUrl,
} from "../../../shared/masterDocumentValue";

function parseContacts(value: unknown): SupplierContactPersonInput[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => ({
      contactPersonName: String(
        (entry as { contactPersonName?: string }).contactPersonName ?? "",
      ),
      designation: String((entry as { designation?: string }).designation ?? ""),
      email: String((entry as { email?: string }).email ?? ""),
      phoneNumber: String((entry as { phoneNumber?: string }).phoneNumber ?? ""),
      countryCode: String((entry as { countryCode?: string }).countryCode ?? "+91"),
    }));
  } catch {
    return [];
  }
}

export function ViewSupplierMasterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getMasterPaths("supplier-master");
  const canEdit = canAccessPermission("supplierMaster", "edit");
  const canView = canAccessPermission("supplierMaster", "view");

  const detailQuery = useQuery({
    queryKey: ["supplier-master", "detail", params.id ?? ""],
    queryFn: () => fetchSupplierMasterDetail(params.id!),
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

  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  const openDocumentPreview = (title: string, fileUrlOrName?: string) => {
    if (!fileUrlOrName || !fileUrlOrName.trim()) return;
    const url = getMasterDocumentUrl(fileUrlOrName.trim());
    if (!url) return;
    const cleanPath = (url.split("?")[0] ?? "").toLowerCase();
    const isPdf = cleanPath.endsWith(".pdf") || url.startsWith("data:application/pdf");
    setPreviewDoc({
      name: getMasterDocumentDisplayName(fileUrlOrName, title),
      url,
      isPdf,
    });
  };

  const displayName = useMemo(() => {
    if (!row) return "Supplier";
    return String(row.supplierName || row.name || "Supplier").trim();
  }, [row]);

  const initials = useMemo(() => {
    if (!displayName) return "SP";
    const parts = displayName.split(/\s+/).filter(Boolean);
    if (parts.length >= 2 && parts[0] && parts[1]) {
      return (parts[0][0]! + parts[1][0]!).toUpperCase();
    }
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const isActive = String(row?.status ?? "Active").toLowerCase() !== "inactive";
  const remarkValue = String(row?.remark ?? row?.remarks ?? "").trim();

  const contacts = useMemo(() => {
    if (!row?.contactPersonsJson) return [];
    return parseContacts(row.contactPersonsJson);
  }, [row?.contactPersonsJson]);

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
          { label: "Supplier Master", to: paths.list },
          { label: "View Supplier" },
        ]}
        title="View Supplier"
        subtitle=" "
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view supplier master records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (notFound && !isLoading) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Supplier Master", to: paths.list },
          { label: "Not Found" },
        ]}
        title="View Supplier"
        contentGap={1.5}
      >
        <MasterSectionCard>
          <Typography
            sx={{
              fontSize: "0.875rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            Supplier record not found.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Supplier Master", to: paths.list },
        { label: displayName || "View Supplier" },
      ]}
      title="View Supplier"
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
              Edit Supplier
            </Button>
          )}
        </Stack>
      }
    >
      <Box sx={{ width: "100%", display: "flex", flexDirection: "column", gap: 2 }}>
        {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

        {isLoading || !row ? (
          <ContentLoader label="Loading supplier details..." minHeight={200} />
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
                    {row.contactPersonName ? (
                      <Typography
                        sx={{
                          fontSize: "0.8125rem",
                          fontWeight: 500,
                          color: theme.customTokens.text.secondary,
                        }}
                      >
                        Contact: {String(row.contactPersonName)}
                      </Typography>
                    ) : null}

                    {row.msmeType ? (
                      <Chip
                        label={String(row.msmeType)}
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

                    {row.city || row.state ? (
                      <Chip
                        label={[row.city, row.state].filter(Boolean).join(", ")}
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
              {/* Supplier Information Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Supplier Information"
                  icon={Building2}
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
                  <ProfileField label="Supplier Name" value={row.supplierName ? String(row.supplierName) : undefined} />
                  <ProfileField label="Contact Person" value={row.contactPersonName ? String(row.contactPersonName) : undefined} />
                  <ProfileField label="Email" value={row.emailAddress ? String(row.emailAddress) : undefined} />
                  <ProfileField
                    label="Phone Number"
                    value={row.mobileNumber ? String(row.mobileNumber) : undefined}
                    isPhone
                  />
                  <ProfileField label="MSME Type" value={row.msmeType ? String(row.msmeType) : undefined} />
                  <ProfileField label="MSME No" value={row.msmeNo ? String(row.msmeNo) : undefined} />
                  <ProfileField label="FSC Code" value={row.fscCode ? String(row.fscCode) : undefined} />
                  <ProfileField label="Status" value={isActive ? "Active" : "Inactive"} />
                </Box>
              </Box>

              {/* Tax & Identification Documents Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Tax & Identification"
                  icon={FileCheck}
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
                  <ProfileField label="GSTIN" value={row.gstNo ? String(row.gstNo) : undefined} />
                  <DocumentStatusField
                    label="GSTIN Document"
                    fileUrl={row.gstUpload ? String(row.gstUpload) : undefined}
                    title="GSTIN Document"
                    onPreview={openDocumentPreview}
                  />
                  <ProfileField label="PAN Number" value={row.panNo ? String(row.panNo) : undefined} />
                  <DocumentStatusField
                    label="PAN Document"
                    fileUrl={row.panUpload ? String(row.panUpload) : undefined}
                    title="PAN Document"
                    onPreview={openDocumentPreview}
                  />
                </Box>
              </Box>
            </Box>

            {/* Address Details Card */}
            <Box
              sx={(theme) => ({
                ...formSectionCardSx(theme),
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
              })}
            >
              <FormSectionHeader
                title="Address Details"
                icon={MapPin}
                variant="cardTop"
              />
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(5, minmax(0, 1fr))",
                  },
                  columnGap: 2.5,
                    rowGap: 1,
                    mt: 1,
                }}
              >
                <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1", md: "span 2" } }}>
                  <ProfileField label="Address" value={row.address ? String(row.address) : undefined} allowWrap />
                </Box>
                <ProfileField label="City" value={row.city ? String(row.city) : undefined} />
                <ProfileField label="State" value={row.state ? String(row.state) : undefined} />
                <ProfileField label="Pincode" value={row.pincode ? String(row.pincode) : undefined} />
                <ProfileField label="Country" value={row.country ? String(row.country) : undefined} />
              </Box>
            </Box>

            {/* Contact Persons Section */}
            <Box
              sx={(theme) => ({
                ...formSectionCardSx(theme),
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
              })}
            >
              <FormSectionHeader
                title="Contact Persons"
                icon={Users}
                variant="cardTop"
              />
              <Box sx={{ mt: 1.5 }}>
                {contacts.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      color: theme.customTokens.text.secondary,
                      py: 1,
                    }}
                  >
                    No additional contact persons recorded.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      width: "100%",
                      overflowX: "auto",
                      border: `1px solid ${theme.customTokens.borders.default}`,
                      borderRadius: "6px",
                    }}
                  >
                    <Table size="small">
                      <TableHead sx={{ backgroundColor: theme.customTokens.surfaces.paper }}>
                        <TableRow>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.customTokens.text.secondary, py: 1 }}>
                            SR NO
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.customTokens.text.secondary, py: 1 }}>
                            NAME
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.customTokens.text.secondary, py: 1 }}>
                            DESIGNATION
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.customTokens.text.secondary, py: 1 }}>
                            EMAIL
                          </TableCell>
                          <TableCell sx={{ fontSize: "0.75rem", fontWeight: 700, color: theme.customTokens.text.secondary, py: 1 }}>
                            PHONE NUMBER
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {contacts.map((contact, idx) => (
                          <TableRow key={`contact-${idx}`} hover>
                            <TableCell sx={{ fontSize: "0.8125rem", py: 1 }}>
                              {idx + 1}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem", fontWeight: 600, py: 1 }}>
                              {contact.contactPersonName || "—"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem", color: theme.customTokens.text.secondary, py: 1 }}>
                              {contact.designation || "—"}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem", py: 1 }}>
                              {contact.email ? (
                                <Typography
                                  component="a"
                                  href={`mailto:${contact.email}`}
                                  sx={{
                                    fontSize: "0.8125rem",
                                    color: theme.customTokens.brand.primary,
                                    textDecoration: "none",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {contact.email}
                                </Typography>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8125rem", py: 1 }}>
                              {contact.phoneNumber ? (
                                <Typography
                                  component="a"
                                  href={`tel:${contact.countryCode || "+91"}${contact.phoneNumber}`}
                                  sx={{
                                    fontSize: "0.8125rem",
                                    color: theme.customTokens.brand.primary,
                                    textDecoration: "none",
                                    "&:hover": { textDecoration: "underline" },
                                  }}
                                >
                                  {[contact.countryCode || "+91", contact.phoneNumber].join(" ")}
                                </Typography>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                )}
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

      {/* Document Preview Dialog */}
      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setPreviewDoc(null)}
        open={previewDoc !== null}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
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
                objectFit: "contain",
                borderRadius: "4px",
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
                border: "none",
                borderRadius: "4px",
              }}
            />
          ) : (
            <Typography sx={{ color: theme.customTokens.text.secondary }}>
              No document preview available.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
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
  value?: string | number | null | undefined;
  isPhone?: boolean | undefined;
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
            lineHeight: 1.35,
          whiteSpace: allowWrap ? "normal" : "nowrap",
            overflow: allowWrap ? "visible" : "hidden",
            textOverflow: allowWrap ? "clip" : "ellipsis",
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
  fileUrl?: string | undefined;
  title: string;
  onPreview: (title: string, fileUrlOrName?: string) => void;
}) {
  const theme = useTheme();
  const rawUrl = fileUrl ? getMasterDocumentUrl(fileUrl) : "";
  const hasDocument = Boolean(rawUrl);
  const displayName = fileUrl ? getMasterDocumentDisplayName(fileUrl, title) : title;
  const isPdf = rawUrl.toLowerCase().includes(".pdf") || rawUrl.startsWith("data:application/pdf");

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

      {hasDocument ? (
        <Box
          onClick={() => onPreview(title, fileUrl)}
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1.25,
            p: 0.75,
            pr: 1.5,
            borderRadius: "6px",
            border: `1px solid ${theme.customTokens.borders.default}`,
            backgroundColor: theme.customTokens.surfaces.paper,
            cursor: "pointer",
            transition: "all 0.15s ease",
            "&:hover": {
              borderColor: theme.customTokens.brand.primary,
              backgroundColor: "rgba(116, 22, 22, 0.04)",
              "& .doc-preview-eye": {
                opacity: 1,
              },
            },
          }}
        >
          <Box
            sx={{
              position: "relative",
              width: 52,
              height: 52,
              borderRadius: "4px",
              overflow: "hidden",
              backgroundColor: theme.customTokens.surfaces.surface,
              border: `1px solid ${theme.customTokens.borders.default}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {isPdf ? (
              <FileText size={24} color={theme.customTokens.brand.primary} />
            ) : (
              <Box
                component="img"
                src={rawUrl}
                alt={displayName}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
            <Box
              className="doc-preview-eye"
              sx={{
                position: "absolute",
                inset: 0,
                backgroundColor: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.15s ease",
              }}
            >
              <Eye size={18} color="#FFFFFF" />
            </Box>
          </Box>

          <Box sx={{ minWidth: 0, overflow: "hidden" }}>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: theme.customTokens.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: 160,
              }}
            >
              {displayName}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.75rem",
                color: theme.customTokens.brand.primary,
                fontWeight: 500,
              }}
            >
              Click to preview
            </Typography>
          </Box>
        </Box>
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
