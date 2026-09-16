import { forwardRef, useImperativeHandle, useState } from "react";
import {
  Box,
  IconButton,
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

interface SupplierContactPerson {
  contactPersonName: string;
  designation: string;
  email: string;
  phoneNumber: string;
}

export interface SupplierContactPersonTableHandle {
  validate: () => boolean;
}

interface SupplierContactPersonTableProps {
  contacts: SupplierContactPerson[];
  onChange: (contacts: SupplierContactPerson[]) => void;
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
>(function SupplierContactPersonTable({ contacts, onChange }, ref) {
  const theme = useTheme();
  const [draftContact, setDraftContact] =
    useState<SupplierContactPerson>(emptyContact);
  const [draftErrors, setDraftErrors] = useState<
    Partial<Record<keyof SupplierContactPerson, string>>
  >({});
  const [tableError, setTableError] = useState("");

  const handleAddContact = () => {
    const errors = getContactValidationErrors(draftContact);

    setDraftErrors(errors);

    if (hasContactValidationErrors(errors)) {
      return;
    }

    onChange([...contacts, draftContact]);
    setDraftContact(emptyContact);
    setDraftErrors({});
    setTableError("");
  };

  useImperativeHandle(ref, () => ({
    validate: () => {
      setTableError("");
      return true;
    },
  }), []);

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
              <TableCell width={96}>Action</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            <TableRow>
              {contactColumns.map((column) => (
                <TableCell key={column.key}>
                  <TextField
                    fullWidth
                    error={Boolean(draftErrors[column.key])}
                    helperText={draftErrors[column.key] ?? ""}
                    value={draftContact[column.key]}
                    onChange={(event) =>
                      setDraftContact((current) => ({
                        ...current,
                        [column.key]:
                          column.key === "phoneNumber"
                            ? event.target.value.replace(/\D/g, "").slice(0, 10)
                            : event.target.value,
                      }))
                    }
                    sx={getCompactFieldSx(
                      theme,
                      draftErrors[column.key] ? "error" : "default",
                    )}
                  />
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
                      backgroundColor: theme.customTokens.navigation.hoverBackground,
                      borderColor: theme.customTokens.brand.primary,
                    },
                  }}
                  type="button"
                >
                  <Plus color={theme.customTokens.brand.primary} size={15} />
                </IconButton>
              </TableCell>
            </TableRow>

            {contacts.map((contact, index) => (
              <TableRow key={`${contact.contactPersonName}-${index}`}>
                {contactColumns.map((column) => (
                  <TableCell key={column.key}>{contact[column.key]}</TableCell>
                ))}
                <TableCell>
                  <IconButton
                    aria-label="Remove contact person"
                    onClick={() =>
                      onChange(
                        contacts.filter((_, contactIndex) => contactIndex !== index),
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
