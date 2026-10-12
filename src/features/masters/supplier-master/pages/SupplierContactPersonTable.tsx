import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Box,
  IconButton,
  MenuItem,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";

import { getCompactFieldSx } from "../../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { countryCodeOptions } from "../../shared/MasterFormFields";
import {
  getSelectDropdownOptionSx,
  getSelectDropdownPaperSx,
} from "../../../shared/dropdownMenuStyles";

interface SupplierContactPerson {
  contactPersonName: string;
  designation: string;
  email: string;
  phoneNumber: string;
  countryCode?: string;
}

export interface SupplierContactPersonTableHandle {
  validate: () => boolean;
}

interface SupplierContactPersonTableProps {
  contacts: SupplierContactPerson[];
  onChange: (contacts: SupplierContactPerson[]) => void;
  readOnly?: boolean;
}

const contactColumns: Array<{
  key: keyof SupplierContactPerson;
  label: string;
}> = [
  {
    key: "contactPersonName",
    label: "Contact Person Name",
  },
  {
    key: "email",
    label: "Email",
  },
  {
    key: "phoneNumber",
    label: "Phone Number",
  },
  {
    key: "designation",
    label: "Designation",
  },
];

const emptyContact: SupplierContactPerson = {
  contactPersonName: "",
  designation: "",
  email: "",
  phoneNumber: "",
};

function getContactValidationErrors(contact: SupplierContactPerson) {
  const errors = {} as Partial<Record<keyof SupplierContactPerson, string>>;

  if (
    contact.email.trim() &&
    !/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(contact.email.trim())
  ) {
    errors.email = "Please enter a valid email.";
  }

  if (contact.phoneNumber.trim() && !/^\d{1,10}$/.test(contact.phoneNumber.trim())) {
    errors.phoneNumber = "Phone number should contain up to 10 digits.";
  }

  return errors;
}

function hasContactValidationErrors(
  errors: Partial<Record<keyof SupplierContactPerson, string>>,
) {
  return Object.values(errors).some(Boolean);
}

export const SupplierContactPersonTable = forwardRef<
  SupplierContactPersonTableHandle,
  SupplierContactPersonTableProps
>(function SupplierContactPersonTable(
  { contacts, onChange, readOnly = false },
  ref,
) {
  const theme = useTheme();
  const [draftContact, setDraftContact] =
    useState<SupplierContactPerson>(emptyContact);
  const [draftErrors, setDraftErrors] = useState<
    Partial<Record<keyof SupplierContactPerson, string>>
  >({});
  const [tableError, setTableError] = useState("");

  const handleAddContact = () => {
    if (readOnly) {
      return;
    }

    const errors = getContactValidationErrors(draftContact);

    setDraftErrors(errors);

    if (hasContactValidationErrors(errors)) {
      return;
    }

    if (!draftContact.contactPersonName.trim()) {
      setDraftErrors({
        contactPersonName: "Contact person name is required.",
      });
      return;
    }

    onChange([...contacts, draftContact]);
    setDraftContact(emptyContact);
    setDraftErrors({});
    setTableError("");
  };

  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        setTableError("");
        return true;
      },
    }),
    [],
  );

  return (
    <Stack
      sx={(currentTheme) => ({
        gap: currentTheme.spacing(1.5),
      })}
    >
      <Typography variant="h3" color="text.primary">
        Contact Person Details
      </Typography>

      {tableError ? (
        <Typography variant="caption" color="error">
          {tableError}
        </Typography>
      ) : null}

      <Box
        sx={{
          border: `1px solid ${theme.customTokens.borders.default}`,
          borderRadius: `${theme.customTokens.radius.md}px`,
          overflowX: "auto",
          scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            height: 6,
          },
          "&::-webkit-scrollbar-track": {
            backgroundColor: theme.customTokens.surfaces.alt,
            borderRadius: 999,
          },
          "&::-webkit-scrollbar-thumb": {
            backgroundColor: theme.customTokens.brand.primary,
            borderRadius: 999,
          },
        }}
      >
        <Table
          size="small"
          sx={{
            minWidth: 860,
            tableLayout: "fixed",
            "& th": {
              backgroundColor: theme.customTokens.neutrals[100],
              borderBottom: `1px solid ${theme.customTokens.borders.default}`,
              color: theme.customTokens.neutrals[700],
              fontSize: "0.75rem",
              fontWeight: 600,
              letterSpacing: "0.02em",
              textTransform: "uppercase",
              py: 0.85,
            },
            "& td": {
              borderColor: theme.customTokens.borders.divider,
              py: 1,
              verticalAlign: "middle",
            },
          }}
        >
          <TableHead>
            <TableRow>
              {contactColumns.map((column) => (
                <TableCell key={column.key}>
                  <ColumnLabel label={column.label} required />
                </TableCell>
              ))}
              {!readOnly ? <TableCell width={96}>Action</TableCell> : null}
            </TableRow>
          </TableHead>

          <TableBody>
            {!readOnly ? (
              <TableRow>
                {contactColumns.map((column) => (
                  <TableCell key={column.key}>
                    {column.key === "phoneNumber" ? (
                      <Box
                        sx={{
                          display: "grid",
                          gap: 1,
                          gridTemplateColumns: "82px minmax(0, 1fr)",
                        }}
                      >
                        <TextField
                          select
                          value={draftContact.countryCode || "+91"}
                          onChange={(event) =>
                            setDraftContact((current) => ({
                              ...current,
                              countryCode: event.target.value,
                            }))
                          }
                          sx={{
                            ...getCompactFieldSx(theme, "default"),
                            "& .MuiSelect-select": {
                              alignItems: "center",
                              display: "flex",
                              height: "100%",
                              paddingLeft: `${theme.spacing(1)} !important`,
                              paddingRight: `${theme.spacing(3)} !important`,
                              fontSize: "0.8125rem",
                            },
                          }}
                          slotProps={{
                            select: {
                              MenuProps: {
                                anchorOrigin: {
                                  horizontal: "left",
                                  vertical: "bottom",
                                },
                                MenuListProps: {
                                  dense: true,
                                  sx: { py: 0.5 },
                                },
                                PaperProps: {
                                  sx: {
                                    ...getSelectDropdownPaperSx(theme, 280, {
                                      preferredMinWidth: 280,
                                    }),
                                    maxHeight: 240,
                                    overflowY: "auto",
                                    "& .MuiMenuItem-root": {
                                      ...getSelectDropdownOptionSx(theme, true),
                                    },
                                  },
                                },
                                variant: "menu",
                              },
                              renderValue: (selected) => String(selected),
                            },
                          }}
                        >
                          {countryCodeOptions.map((countryCode) => (
                            <MenuItem
                              key={countryCode.code}
                              value={countryCode.code}
                              sx={{
                                fontSize: "0.8125rem",
                                minHeight: 32,
                              }}
                            >
                              {countryCode.code} - {countryCode.label}
                            </MenuItem>
                          ))}
                        </TextField>

                        <TextField
                          fullWidth
                          error={Boolean(draftErrors[column.key])}
                          helperText={draftErrors[column.key] ?? ""}
                          value={draftContact[column.key]}
                          onChange={(event) =>
                            setDraftContact((current) => ({
                              ...current,
                              [column.key]: event.target.value.replace(/\D/g, "").slice(0, 10),
                            }))
                          }
                          sx={getCompactFieldSx(
                            theme,
                            draftErrors[column.key] ? "error" : "default",
                          )}
                          slotProps={{
                            htmlInput: {
                              inputMode: "numeric",
                              maxLength: 10,
                              pattern: "[0-9]*",
                            },
                          }}
                        />
                      </Box>
                    ) : (
                      <TextField
                        fullWidth
                        error={Boolean(draftErrors[column.key])}
                        helperText={draftErrors[column.key] ?? ""}
                        value={draftContact[column.key]}
                        onChange={(event) => {
                          const val = event.target.value;
                          const nextVal =
                            column.key === "contactPersonName" || column.key === "designation"
                              ? val.replace(/[^A-Za-z\s]/g, "")
                              : val;

                          setDraftContact((current) => ({
                            ...current,
                            [column.key]: nextVal,
                          }));
                        }}
                        sx={getCompactFieldSx(
                          theme,
                          draftErrors[column.key] ? "error" : "default",
                        )}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell>
                  <IconButton
                    aria-label="Add contact person"
                    onClick={handleAddContact}
                    size="small"
                    sx={{
                      border: `1px solid ${theme.customTokens.borders.default}`,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      color: theme.customTokens.brand.primary,
                      height: 30,
                      width: 30,
                      "&:hover": {
                        backgroundColor:
                          theme.customTokens.navigation.hoverBackground,
                        borderColor: theme.customTokens.brand.primary,
                      },
                    }}
                    type="button"
                  >
                    <Plus color={theme.customTokens.brand.primary} size={15} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ) : null}

            {contacts.length === 0 && readOnly ? (
              <TableRow>
                <TableCell colSpan={contactColumns.length}>
                  <Typography variant="body2" color="text.secondary">
                    No contact persons added.
                  </Typography>
                </TableCell>
              </TableRow>
            ) : null}

            {contacts.map((contact, index) => (
              <TableRow key={`${contact.contactPersonName}-${index}`}>
                {contactColumns.map((column) => (
                  <TableCell key={column.key}>
                    {column.key === "phoneNumber" && contact.phoneNumber ? (
                      <Typography
                        component="a"
                        href={`tel:${((contact.countryCode || "+91") + contact.phoneNumber).replace(/[^\d+]/g, "")}`}
                        onClick={(event) => event.stopPropagation()}
                        sx={{
                          color: theme.customTokens.brand.primary,
                          textDecoration: "none",
                          fontSize: "inherit",
                          cursor: "pointer",
                          whiteSpace: "nowrap",
                          "&:hover": {
                            textDecoration: "underline",
                          },
                        }}
                      >
                        {`${contact.countryCode || "+91"} ${contact.phoneNumber}`}
                      </Typography>
                    ) : (
                      contact[column.key] || "—"
                    )}
                  </TableCell>
                ))}
                {!readOnly ? (
                  <TableCell>
                    <IconButton
                      aria-label="Remove contact person"
                      onClick={() =>
                        onChange(
                          contacts.filter(
                            (_, contactIndex) => contactIndex !== index,
                          ),
                        )
                      }
                      size="small"
                      sx={{
                        color: theme.palette.error.main,
                      }}
                    >
                      <Trash2 size={15} />
                    </IconButton>
                  </TableCell>
                ) : null}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
    </Stack>
  );
});

function ColumnLabel({
  label,
  required,
}: {
  label: string;
  required: boolean;
}) {
  return (
    <Stack component="span" direction="row" spacing={0.25}>
      <span>{label}</span>
    </Stack>
  );
}
