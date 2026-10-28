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
  Typography,
  useTheme,
} from "@mui/material";
import { Eye, FileCheck, FileText, MapPin, MessageSquare, Pencil, UserCheck, X } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import { MasterDetailLoadAlert, MasterPageShell } from "../../../shared";
import { ContentLoader } from "../../../../../components/feedback/ContentLoader";
import { canAccessPermission } from "../../../../permissions";
import { recordViewActionButtonSx } from "../../../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../../../shared/formSectionStyles";
import { getGmailComposeUrl, getMasterPaths } from "../../../shared/utils";
import {
  fetchCustomerMasterDetail,
  type CustomerMasterDetail,
} from "../../api/customerMasterApi";
import { parseCustomerAddresses, type CustomerAddress } from "../CustomerMasterPagesForm";
import {
  getMasterDocumentDisplayName,
  getMasterDocumentUrl,
} from "../../../shared/masterDocumentValue";

export function ViewCustomerMasterPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const paths = getMasterPaths("customer-master");
  const canEdit = canAccessPermission("customerMaster", "edit");
  const canView = canAccessPermission("customerMaster", "view");

  const detailQuery = useQuery({
    queryKey: ["customer-master", "detail", params.id ?? ""],
    queryFn: () => fetchCustomerMasterDetail(params.id!),
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

  const [previewDoc, setPreviewDoc] = useState<{
    name: string;
    url: string;
    isPdf: boolean;
  } | null>(null);

  const handleBack = () => {
    navigate(paths.list);
  };

  const openDocumentPreview = (title: string, rawDocumentValue?: string | null) => {
    if (!rawDocumentValue || !rawDocumentValue.trim()) return;
    const resolvedUrl = getMasterDocumentUrl(rawDocumentValue);
    if (!resolvedUrl) return;

    const displayName = getMasterDocumentDisplayName(rawDocumentValue, title);
    const cleanPath = (resolvedUrl.split("?")[0] ?? "").toLowerCase();
    const isPdf =
      cleanPath.endsWith(".pdf") ||
      resolvedUrl.startsWith("data:application/pdf");

    setPreviewDoc({
      name: displayName || title,
      url: resolvedUrl,
      isPdf,
    });
  };

  const displayName = useMemo(() => {
    if (!row) return "Customer";
    const name = typeof row.customerName === "string" ? row.customerName.trim() : "";
    const company = typeof row.companyName === "string" ? row.companyName.trim() : "";
    return name || company || "Customer";
  }, [row]);

  const initials = getInitials(displayName);
  const isActive = String(row?.status ?? "Active").toLowerCase() !== "inactive";

  const addresses: CustomerAddress[] = useMemo(() => {
    if (!row) return [];
    const primaryAddr: CustomerAddress = {
      address: typeof row.address === "string" ? row.address : "",
      pincode: typeof row.pincode === "string" ? row.pincode : "",
      country: typeof row.country === "string" ? row.country : "",
      state: typeof row.state === "string" ? row.state : "",
      city: typeof row.city === "string" ? row.city : "",
    };
    const additional = parseCustomerAddresses(row.customerAddresses);
    if (primaryAddr.address || primaryAddr.pincode || primaryAddr.city || additional.length > 0) {
      return [primaryAddr, ...additional];
    }
    return [];
  }, [row]);

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
          { label: "Customer Master", to: paths.list },
          { label: "View Customer Master" },
        ]}
        title="View Customer Master"
        contentGap={1.5}
      >
        <Alert severity="warning">
          You do not have permission to view customer master records.
        </Alert>
      </MasterPageShell>
    );
  }

  if (notFound) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Customer Master", to: paths.list },
          { label: "Not Found" },
        ]}
        title="View Customer Master"
        contentGap={1.5}
      >
        <MasterDetailLoadAlert
          error={detailQuery.error || errorMessage}
          notFoundLabel="Customer record not found."
        />
      </MasterPageShell>
    );
  }

  const phoneValue = row
    ? [row.phoneNumberCountryCode, row.phoneNumber].filter(Boolean).join(" ")
    : "";

  const remarkValue = typeof row?.remarks === "string" ? row.remarks : typeof row?.remark === "string" ? row.remark : "";

  return (
    <MasterPageShell
      backNav={{
        label: "Back to Customer Master",
        to: paths.list,
        onBack: handleBack,
      }}
      breadcrumbs={[
        { label: "Customer Master", to: paths.list },
        { label: "View Customer Master" },
      ]}
      title="View Customer Master"
      contentGap={1.5}
      actions={
        row && canEdit ? (
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              onClick={() => navigate(paths.edit(String(row.id)))}
              startIcon={<Pencil size={16} />}
              sx={[recordViewActionButtonSx, actionButtonSx]}
              variant="contained"
            >
              Edit Customer
            </Button>
          </Stack>
        ) : null
      }
    >
      <Box sx={{ width: "100%" }}>
        {errorMessage && !notFound ? (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            {errorMessage}
          </Alert>
        ) : null}

        {isLoading || !row ? (
          <ContentLoader label="Loading customer details..." minHeight={200} />
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
              <Stack direction="row" alignItems="center" spacing={2} sx={{ minWidth: 0, flex: "1 1 auto" }}>
                <Avatar
                  sx={{
                    width: 40,
                    height: 40,
                    bgcolor: theme.customTokens.brand.primaryScale[100],
                    color: theme.customTokens.brand.primary,
                    fontSize: "0.9375rem",
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
                        fontSize: "1.0625rem",
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
                        border: `1px solid ${
                          isActive
                            ? theme.customTokens.semanticScale.success[200]
                            : theme.customTokens.neutrals[200]
                        }`,
                        "& .MuiChip-label": {
                          px: 0.85,
                        },
                      }}
                    />

                    {row.customerType ? (
                      <Chip
                        label={String(row.customerType)}
                        size="small"
                        sx={{
                          height: 20,
                          borderRadius: "5px",
                          fontSize: "0.6875rem",
                          fontWeight: 600,
                          backgroundColor: theme.customTokens.brand.primaryScale[50] || "#fef2f2",
                          color: theme.customTokens.brand.primary,
                          border: `1px solid ${theme.customTokens.brand.primaryScale[200] || "#fecaca"}`,
                          "& .MuiChip-label": {
                            px: 0.85,
                          },
                        }}
                      />
                    ) : null}
                  </Stack>

                  <Typography
                    component="div"
                    sx={{
                      fontSize: "0.8125rem",
                      color: theme.customTokens.text.secondary,
                      lineHeight: 1.35,
                    }}
                  >
                    {[
                      row.companyName ? `Company: ${row.companyName}` : "",
                      row.email ? String(row.email).trim() : "",
                      phoneValue || "",
                    ]
                      .filter(Boolean)
                      .map((part, index, parts) => {
                        const emailValue = row.email ? String(row.email).trim() : "";
                        const isEmailPart = Boolean(emailValue) && part === emailValue;

                        return (
                          <Box
                            key={`${part}-${index}`}
                            component="span"
                          >
                            {isEmailPart ? (
                              <Typography
                                component="a"
                                href={getGmailComposeUrl(emailValue)}
                                target="_blank"
                                rel="noopener noreferrer"
                                sx={{
                                  color: theme.customTokens.brand.primary,
                                  textDecoration: "none",
                                  fontSize: "inherit",
                                  "&:hover": {
                                    textDecoration: "underline",
                                  },
                                }}
                              >
                                {emailValue}
                              </Typography>
                            ) : (
                              part
                            )}
                            {index < parts.length - 1 ? " · " : null}
                          </Box>
                        );
                      })}
                  </Typography>
                </Stack>
              </Stack>
            </Box>

            {/* 2-Column Responsive Layout: Customer Information & Identity / Tax Details */}
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
              {/* Customer Information Card */}
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                })}
              >
                <FormSectionHeader
                  title="Customer Information"
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
                    rowGap: 1,
                    mt: 1,
                  }}
                >
                  <ProfileField label="Customer Name" value={row.customerName as string} />
                  <ProfileField label="Company Name" value={row.companyName as string} />
                  <ProfileField label="Customer Type" value={row.customerType as string} />
                  <ProfileField
                    label="Email"
                    value={row.email as string}
                    isEmail
                  />
                  <ProfileField
                    label="Phone Number"
                    value={phoneValue || (row.phoneNumber as string)}
                  />
                  <ProfileField
                    label="Date of Birth"
                    value={formatDisplayDate(row.dob as string | Date | undefined)}
                  />
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
                  <ProfileField label="GSTIN" value={row.gstNo as string} />
                  <DocumentStatusField
                    label="GSTIN Document"
                    fileUrl={row.gstUpload as string}
                    title="GSTIN Document"
                    onPreview={openDocumentPreview}
                  />
                  <ProfileField label="PAN No" value={row.panNo as string} />
                  <DocumentStatusField
                    label="PAN Document"
                    fileUrl={row.panUpload as string}
                    title="PAN Document"
                    onPreview={openDocumentPreview}
                  />
                </Box>
              </Box>
            </Box>

            {/* Customer Addresses Section */}
            <Box
              sx={(theme) => ({
                ...formSectionCardSx(theme),
                borderRadius: "8px",
                display: "flex",
                flexDirection: "column",
              })}
            >
              <FormSectionHeader
                title="Customer Addresses"
                icon={MapPin}
                variant="cardTop"
              />
              <Box sx={{ mt: 1.5 }}>
                {addresses.length === 0 ? (
                  <Typography
                    sx={{
                      fontSize: "0.875rem",
                      color: theme.customTokens.text.secondary,
                      py: 1,
                    }}
                  >
                    No addresses added.
                  </Typography>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "repeat(2, minmax(0, 1fr))",
                      },
                      gap: 1.5,
                    }}
                  >
                    {addresses.map((address, index) => {
                      const isPrimary = index === 0;
                      return (
                        <Box
                          key={`view-addr-${index}`}
                          sx={{
                            border: `1px solid ${
                              isPrimary
                                ? theme.customTokens.brand.primaryScale[300] || theme.customTokens.borders.divider
                                : theme.customTokens.borders.divider
                            }`,
                            borderRadius: "6px",
                            px: 1.5,
                            py: 1.25,
                            backgroundColor: isPrimary ? "rgba(116, 22, 22, 0.02)" : "transparent",
                            display: "flex",
                            flexDirection: "column",
                            height: "100%",
                          }}
                        >
                          <Stack
                            direction="row"
                            alignItems="center"
                            spacing={1}
                            sx={{ mb: 1 }}
                          >
                            <Typography sx={{ fontSize: "0.75rem", fontWeight: 700 }}>
                              Address {index + 1}
                            </Typography>
                            {isPrimary ? (
                              <Box
                                component="span"
                                sx={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  fontSize: "0.625rem",
                                  fontWeight: 700,
                                  px: 0.75,
                                  py: 0.15,
                                  borderRadius: "10px",
                                  backgroundColor: theme.customTokens.brand.primary,
                                  color: "#FFFFFF",
                                }}
                              >
                                Primary Address
                              </Box>
                            ) : null}
                          </Stack>

                          <Box
                            sx={{
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                              },
                              columnGap: 2,
                              rowGap: 0.75,
                            }}
                          >
                            <Box sx={{ gridColumn: { xs: "1", sm: "1 / -1" } }}>
                              <ProfileField label="Address" value={address.address} allowWrap />
                            </Box>
                            <ProfileField label="City" value={address.city} />
                            <ProfileField label="State" value={address.state} />
                            <ProfileField label="Pincode" value={address.pincode} />
                            <ProfileField label="Country" value={address.country} />
                          </Box>
                        </Box>
                      );
                    })}
                  </Box>
                )}
              </Box>
            </Box>

            {/* Remarks Section (if provided) */}
            {remarkValue && remarkValue.trim() ? (
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
                  <ProfileField label="Remarks" value={remarkValue} allowWrap />
                </Box>
              </Box>
            ) : null}

            {/* Audit Metadata Card */}
            {(row.createdBy || row.createdDate || row.editedBy || row.updatedBy || row.updatedDate) ? (
              <Box
                sx={(theme) => ({
                  ...formSectionCardSx(theme),
                  borderRadius: "8px",
                  backgroundColor: theme.customTokens.surfaces.alt || "transparent",
                })}
              >
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
                  }}
                >
                  <ProfileField label="Created By" value={row.createdBy as string} />
                  <ProfileField
                    label="Created Date"
                    value={formatDisplayDateTime(row.createdDate as string | Date | undefined)}
                  />
                  <ProfileField
                    label="Updated By"
                    value={(row.editedBy || row.updatedBy) as string}
                  />
                  <ProfileField
                    label="Updated Date"
                    value={formatDisplayDateTime(row.updatedDate as string | Date | undefined)}
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
                width: "auto",
                height: "auto",
                objectFit: "contain",
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
    </MasterPageShell>
  );
}

function ProfileField({
  label,
  value,
  isEmail = false,
  allowWrap = false,
}: {
  label: string;
  value?: string | number | null | undefined;
  isEmail?: boolean | undefined;
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

      {isEmail && hasValue ? (
        <Typography
          component="a"
          href={getGmailComposeUrl(rawValue)}
          target="_blank"
          rel="noopener noreferrer"
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
  fileUrl: rawFileUrl,
  title,
  onPreview,
}: {
  label: string;
  fileUrl?: string | null | undefined;
  title: string;
  onPreview: (title: string, fileUrlOrName?: string | undefined) => void;
}) {
  const theme = useTheme();
  const fileUrl = rawFileUrl ? getMasterDocumentUrl(rawFileUrl) || rawFileUrl.trim() : "";
  const fileName = rawFileUrl ? getMasterDocumentDisplayName(rawFileUrl, title) : "";
  const hasFile = Boolean(fileUrl);

  const cleanPath = (fileUrl.split("?")[0] ?? "").toLowerCase();
  const isPdf =
    cleanPath.endsWith(".pdf") ||
    fileUrl.startsWith("data:application/pdf") ||
    fileName.toLowerCase().endsWith(".pdf");

  return (
    <Box sx={{ minWidth: 0, py: 0.1 }}>
      <Typography
        sx={{
          fontSize: "0.75rem",
          fontWeight: 700,
          color: theme.customTokens.text.secondary,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          lineHeight: 1.3,
          mb: 0.5,
        }}
      >
        {label}
      </Typography>

      {hasFile ? (
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
          <Box
            onClick={() => onPreview(fileName || title, rawFileUrl ?? undefined)}
            title="Click to view full preview"
            sx={{
              width: 52,
              height: 52,
              minWidth: 52,
              borderRadius: "6px",
              overflow: "hidden",
              border: `1px solid ${theme.customTokens.borders.default}`,
              bgcolor: theme.customTokens.brand.primaryScale[50] || "#f8fafc",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              transition: "all 0.15s ease-in-out",
              position: "relative",
              flexShrink: 0,
              "&:hover": {
                borderColor: theme.customTokens.brand.primary,
                boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
                "& .preview-overlay": {
                  opacity: 1,
                },
              },
            }}
          >
            {isPdf ? (
              <FileText size={26} color={theme.customTokens.brand.primary} />
            ) : (
              <Box
                component="img"
                src={fileUrl}
                alt={fileName || title}
                sx={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                }}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            )}
            <Box
              className="preview-overlay"
              sx={{
                position: "absolute",
                inset: 0,
                bgcolor: "rgba(0,0,0,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                opacity: 0,
                transition: "opacity 0.15s ease-in-out",
                color: "#fff",
              }}
            >
              <Eye size={18} />
            </Box>
          </Box>

          <Stack spacing={0.25} sx={{ minWidth: 0, overflow: "hidden" }}>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 600,
                color: theme.customTokens.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                cursor: "pointer",
                "&:hover": {
                  color: theme.customTokens.brand.primary,
                  textDecoration: "underline",
                },
              }}
              onClick={() => onPreview(fileName || title, rawFileUrl ?? undefined)}
              title={fileName || title}
            >
              {fileName || title}
            </Typography>
            <Typography
              sx={{
                fontSize: "0.72rem",
                fontWeight: 500,
                color: theme.customTokens.text.secondary,
              }}
            >
              {isPdf ? "PDF Document" : "Image File"} · Click to preview
            </Typography>
          </Stack>
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
  if (parts.length === 0) return "C";
  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
