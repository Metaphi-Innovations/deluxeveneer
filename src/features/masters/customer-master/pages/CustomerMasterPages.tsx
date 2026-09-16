import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Plus, Trash2 } from "lucide-react";
import { useParams } from "react-router";

import {
  loadLocationCityOptions,
  loadLocationCountryOptions,
  loadLocationStateOptions,
} from "../../../shared/locationOptions";
import { ErpSelectField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getMastersCompactFieldSx } from "../../shared/mastersFormStyles";
import {
  MasterFormPage,
  MasterListingPage,
  type MasterFieldValue,
} from "../../shared";
import { buildLocalMasterDefinition } from "../../shared/localMasterStore";
import { customerMasterDefinition } from "../mock/customerMasterData";

interface CustomerAddress {
  address: string;
  pincode: string;
  country: string;
  state: string;
  city: string;
}

const EMPTY_ADDRESS: CustomerAddress = {
  address: "",
  pincode: "",
  country: "",
  state: "",
  city: "",
};

export function CustomerMasterListPage() {
  return <MasterListingPage definition={customerMasterDefinition} />;
}

export function AddCustomerMasterPage() {
  return <CustomerMasterFormPage mode="add" />;
}

export function EditCustomerMasterPage() {
  return <CustomerMasterFormPage mode="edit" />;
}

export function ViewCustomerMasterPage() {
  return <CustomerMasterFormPage mode="view" />;
}

function CustomerMasterFormPage({ mode }: { mode: "add" | "edit" | "view" }) {
  const params = useParams<{ id: string }>();
  const localDefinition = useMemo(
    () => buildLocalMasterDefinition(customerMasterDefinition),
    [],
  );
  const row = localDefinition.rows.find((record) => record.id === params.id);
  const [addresses, setAddresses] = useState<CustomerAddress[]>(() =>
    parseCustomerAddresses(row?.customerAddresses),
  );

  useEffect(() => {
    setAddresses(parseCustomerAddresses(row?.customerAddresses));
  }, [row]);

  const handleAddressChange = (
    index: number,
    key: keyof CustomerAddress,
    value: string,
  ) => {
    setAddresses((current) =>
      current.map((address, addressIndex) =>
        addressIndex === index
          ? {
              ...address,
              [key]: value,
              ...(key === "country" ? { state: "", city: "" } : {}),
              ...(key === "state" ? { city: "" } : {}),
            }
          : address,
      ),
    );
  };

  return (
    <MasterFormPage
      additionalValues={{
        customerAddresses: JSON.stringify(addresses),
      }}
      afterFields={
        <CustomerAddressesSection
          addresses={addresses}
          onAdd={() => setAddresses((current) => [...current, { ...EMPTY_ADDRESS }])}
          onChange={handleAddressChange}
          onRemove={(index) =>
            setAddresses((current) =>
              current.filter((_, itemIndex) => itemIndex !== index),
            )
          }
          readOnly={mode === "view"}
        />
      }
      beforeSave={() =>
        addresses.every(
          (address) =>
            !address.pincode || /^\d{1,6}$/.test(address.pincode),
        )
      }
      definition={customerMasterDefinition}
      mode={mode}
    />
  );
}

function CustomerAddressesSection({
  addresses,
  onAdd,
  onChange,
  onRemove,
  readOnly,
}: {
  addresses: CustomerAddress[];
  onAdd: () => void;
  onChange: (index: number, key: keyof CustomerAddress, value: string) => void;
  onRemove: (index: number) => void;
  readOnly: boolean;
}) {
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<Record<string, string[]>>({});
  const [cityOptions, setCityOptions] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let ignore = false;

    void loadLocationCountryOptions().then((options) => {
      if (!ignore) {
        setCountryOptions(options);
      }
    });

    void Promise.all(
      addresses.flatMap((address) => [
        address.country
          ? loadLocationStateOptions(address.country).then((options) => [
              `state:${address.country}`,
              options,
            ] as const)
          : Promise.resolve(null),
        address.country
          ? loadLocationCityOptions(address.country, address.state).then(
              (options) => [
                `city:${address.country}:${address.state}`,
                options,
              ] as const,
            )
          : Promise.resolve(null),
      ]),
    ).then((loadedOptions) => {
      if (ignore) {
        return;
      }

      const nextStates: Record<string, string[]> = {};
      const nextCities: Record<string, string[]> = {};

      loadedOptions.forEach((entry) => {
        if (!entry) {
          return;
        }

        if (entry[0].startsWith("state:")) {
          nextStates[entry[0]] = entry[1];
        } else {
          nextCities[entry[0]] = entry[1];
        }
      });

      setStateOptions((current) => ({ ...current, ...nextStates }));
      setCityOptions((current) => ({ ...current, ...nextCities }));
    });

    return () => {
      ignore = true;
    };
  }, [addresses]);

  return (
    <Box
      sx={(theme) => ({
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: "8px",
        p: 1.5,
      })}
    >
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={1}
        sx={{ mb: 1.25 }}
      >
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
          Additional Addresses
        </Typography>
        {!readOnly ? (
          <Button
            onClick={onAdd}
            size="small"
            startIcon={<Plus size={14} />}
            variant="outlined"
            sx={{ textTransform: "none" }}
          >
            Add Address
          </Button>
        ) : null}
      </Stack>

      {addresses.length === 0 ? (
        <Typography sx={{ color: "text.secondary", fontSize: "0.8125rem" }}>
          No additional addresses added.
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          {addresses.map((address, index) => (
            <Box
              key={`customer-address-${index}`}
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.divider}`,
                borderRadius: "6px",
                p: 1.25,
              })}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Typography sx={{ fontSize: "0.8125rem", fontWeight: 600 }}>
                  Address {index + 1}
                </Typography>
                {!readOnly ? (
                  <IconButton
                    aria-label={`Remove address ${index + 1}`}
                    onClick={() => onRemove(index)}
                    size="small"
                  >
                    <Trash2 size={15} />
                  </IconButton>
                ) : null}
              </Stack>

              <Box
                sx={{
                  display: "grid",
                  gap: 1.25,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(3, minmax(0, 1fr))",
                  },
                }}
              >
                <AddressTextField label="Address" value={address.address} readOnly={readOnly} onChange={(value) => onChange(index, "address", value)} />
                <AddressTextField
                  error={Boolean(address.pincode && !/^\d{1,6}$/.test(address.pincode))}
                  {...(address.pincode && !/^\d{1,6}$/.test(address.pincode)
                    ? { helperText: "Pincode must contain up to 6 digits." }
                    : {})}
                  inputMode="numeric"
                  label="Pincode"
                  maxLength={6}
                  value={address.pincode}
                  readOnly={readOnly}
                  onChange={(value) => onChange(index, "pincode", value.replace(/\D/g, "").slice(0, 6))}
                />
                <AddressSelectField label="Country" options={mergeOption(countryOptions, address.country)} value={address.country} readOnly={readOnly} onChange={(value) => onChange(index, "country", value)} />
                <AddressSelectField label="State" options={mergeOption(stateOptions[`state:${address.country}`] ?? [], address.state)} value={address.state} readOnly={readOnly} onChange={(value) => onChange(index, "state", value)} />
                <AddressSelectField label="City" options={mergeOption(cityOptions[`city:${address.country}:${address.state}`] ?? [], address.city)} value={address.city} readOnly={readOnly} onChange={(value) => onChange(index, "city", value)} />
              </Box>
            </Box>
          ))}
        </Stack>
      )}
    </Box>
  );
}

function AddressTextField({
  label,
  onChange,
  error = false,
  helperText,
  inputMode,
  maxLength,
  readOnly,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  error?: boolean;
  helperText?: string;
  inputMode?: "numeric";
  maxLength?: number;
  readOnly: boolean;
  value: string;
}) {
  return (
    <TextField
      fullWidth
      error={error}
      helperText={helperText}
      label={label}
      onChange={(event) => onChange(event.target.value)}
      size="small"
      sx={(theme) =>
        getMastersCompactFieldSx(
          theme,
          error ? "error" : readOnly ? "readOnly" : "default",
        )
      }
      slotProps={{
        input: { readOnly },
        htmlInput: {
          ...(inputMode ? { inputMode } : {}),
          ...(maxLength ? { maxLength } : {}),
        },
      }}
      value={value}
    />
  );
}

function AddressSelectField({
  label,
  onChange,
  options,
  readOnly,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: string[];
  readOnly: boolean;
  value: string;
}) {
  return (
    <Box sx={{ position: "relative", width: "100%" }}>
      <Typography
        sx={(theme) => ({
          backgroundColor: theme.customTokens.surfaces.surface,
          color: theme.customTokens.text.primary,
          fontSize: "0.6875rem",
          fontWeight: 600,
          left: value.trim() ? 10 : 12,
          lineHeight: value.trim() ? 1 : 1.2,
          pointerEvents: "none",
          px: value.trim() ? 0.5 : 0,
          position: "absolute",
          top: value.trim() ? -4 : 10,
          zIndex: 1,
        })}
      >
        {label}
      </Typography>
      <ErpSelectField
        controlHeight={36}
        controlRadius={6}
        focusRing="subtle"
        maxVisibleOptions={160}
        onChange={onChange}
        options={options}
        searchable
        size="regular"
        state={readOnly ? "readOnly" : "default"}
        value={value}
      />
    </Box>
  );
}

function mergeOption(options: string[], currentValue: string) {
  return currentValue && !options.includes(currentValue)
    ? [...options, currentValue]
    : options;
}

function parseCustomerAddresses(value: MasterFieldValue | undefined) {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(isCustomerAddress).map((address) => ({
      ...EMPTY_ADDRESS,
      ...address,
    }));
  } catch {
    return [];
  }
}

function isCustomerAddress(value: unknown): value is CustomerAddress {
  return Boolean(value && typeof value === "object");
}
