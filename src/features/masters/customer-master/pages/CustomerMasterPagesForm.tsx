import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import {
  Box,
  Button,
  IconButton,
  Snackbar,
  Alert,
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
  resolveLocationByPincode,
} from "../../../shared/locationOptions";
import { ErpSelectField } from "../../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getMastersCompactFieldSx } from "../../shared/mastersFormStyles";
import {
  MasterFormFields,
  MasterFormPage,
  MasterListingPage,
  type MasterFieldValue,
  type MasterRecord,
} from "../../shared";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { customerMasterDefinition } from "../customerMasterDefinition";
import {
  createCustomerMasterRecord,
  fetchCustomerMasterColumnDropdown,
  fetchCustomerMasterDetail,
  fetchCustomerMasterMeta,
  fetchCustomerMasterPaginated,
  refreshCustomerMasterCache,
  updateCustomerMasterRecord,
  updateCustomerMasterStatus,
  type CustomerMasterDetail,
} from "../api/customerMasterApi";

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

const STATIC_CUSTOMER_TYPE_OPTIONS = ["Platinum", "Gold", "Silver"];

const CUSTOMER_SORT_FIELD_MAP: Record<string, string> = {
  customerName: "customerName",
  companyName: "companyName",
  customerType: "customerType",
  email: "email",
  phoneNumber: "phoneNumber",
  gstNo: "gstNo",
  remark: "remarks",
  remarks: "remarks",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

export function CustomerMasterFormPage({ mode }: { mode: "add" | "edit" | "view" }) {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<CustomerMasterDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");
  const [customerTypeOptions, setCustomerTypeOptions] = useState<string[]>([
    "Platinum",
    "Gold",
    "Silver",
  ]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  const definition = useMemo(
    () => ({
      ...customerMasterDefinition,
      fields: customerMasterDefinition.fields.map((field) =>
        field.key === "customerType"
          ? { ...field, options: customerTypeOptions }
          : field,
      ),
      rows: [],
    }),
    [customerTypeOptions],
  );

  useEffect(() => {
    void fetchCustomerMasterMeta().then((meta) => {
      if (meta.customerTypes.length > 0) {
        setCustomerTypeOptions(meta.customerTypes.map((entry) => entry.label));
      }
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");

      if (mode === "add") {
        setRecord(undefined);
        setAddresses([]);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setRecord(undefined);
        setIsLoading(false);
        setErrorMessage("Customer id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const nextRecord = await fetchCustomerMasterDetail(params.id);
        if (!ignore) {
          setRecord(nextRecord);
          const primaryAddr: CustomerAddress = {
            address: typeof nextRecord.address === "string" ? nextRecord.address : "",
            pincode: typeof nextRecord.pincode === "string" ? nextRecord.pincode : "",
            country: typeof nextRecord.country === "string" ? nextRecord.country : "",
            state: typeof nextRecord.state === "string" ? nextRecord.state : "",
            city: typeof nextRecord.city === "string" ? nextRecord.city : "",
          };
          const additional = parseCustomerAddresses(nextRecord.customerAddresses);
          // If primary address has any data or there are additional addresses, show them unified with primary at top
          if (
            primaryAddr.address ||
            primaryAddr.pincode ||
            additional.length > 0
          ) {
            setAddresses([primaryAddr, ...additional]);
          } else {
            setAddresses([]);
          }
        }
      } catch (error) {
        if (!ignore) {
          setRecord(undefined);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load customer.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [mode, params.id]);

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

  const handleAddressPatch = (
    index: number,
    patch: Partial<CustomerAddress>,
  ) => {
    setAddresses((current) =>
      current.map((address, addressIndex) =>
        addressIndex === index ? { ...address, ...patch } : address,
      ),
    );
  };

  return (
    <MasterFormPage
      additionalValues={{
        customerAddresses: JSON.stringify(addresses.slice(1)),
      }}
      beforeSave={() =>
        addresses.every(
          (address) => !address.pincode || /^\d{1,6}$/.test(address.pincode),
        )
      }
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      renderFields={({ definition: formDefinition, values, onChange, readOnly, showRequiredErrors }) => {
        const line1Keys = ["customerType", "customerName", "companyName", "email", "phoneNumber", "dob"];
        const line3Keys = ["gstNo", "gstUpload", "panNo", "panUpload", "remark"];

        const line1Fields = line1Keys
          .map((key) => formDefinition.fields.find((f) => f.key === key))
          .filter(Boolean) as typeof formDefinition.fields;

        const line3Fields = line3Keys
          .map((key) => formDefinition.fields.find((f) => f.key === key))
          .filter(Boolean) as typeof formDefinition.fields;

        // Effective address list: addresses from state, or default from initial form values
        const effectiveAddresses: CustomerAddress[] =
          addresses.length > 0
            ? addresses
            : [
                {
                  address: typeof values.address === "string" ? values.address : "",
                  pincode: typeof values.pincode === "string" ? values.pincode : "",
                  country: typeof values.country === "string" ? values.country : "",
                  state: typeof values.state === "string" ? values.state : "",
                  city: typeof values.city === "string" ? values.city : "",
                },
              ];

        const syncPrimaryToForm = (addr: CustomerAddress) => {
          onChange("address", addr.address);
          onChange("pincode", addr.pincode);
          onChange("country", addr.country);
          onChange("state", addr.state);
          onChange("city", addr.city);
        };

        const handleItemChange = (
          index: number,
          key: keyof CustomerAddress,
          val: string,
        ) => {
          if (addresses.length === 0) {
            setAddresses(effectiveAddresses);
          }
          handleAddressChange(index, key, val);
          if (index === 0) {
            onChange(key, val);
            if (key === "country") {
              onChange("state", "");
              onChange("city", "");
            } else if (key === "state") {
              onChange("city", "");
            }
          }
        };

        const handleItemPatch = (index: number, patch: Partial<CustomerAddress>) => {
          if (addresses.length === 0) {
            setAddresses(effectiveAddresses);
          }
          handleAddressPatch(index, patch);
          if (index === 0) {
            Object.entries(patch).forEach(([k, v]) => {
              onChange(k, v ?? "");
            });
          }
        };

        // When user chooses an address to make primary: move it to the top (index 0) so primary is always at top!
        const handleMakePrimary = (index: number) => {
          if (index === 0) return;
          const chosen = effectiveAddresses[index];
          if (!chosen) return;

          const updatedList = [
            chosen,
            ...effectiveAddresses.filter((_, i) => i !== index),
          ];
          setAddresses(updatedList);
          syncPrimaryToForm(chosen);
        };

        const handleRemove = (index: number) => {
          const updatedList = effectiveAddresses.filter((_, i) => i !== index);
          setAddresses(updatedList);
          if (index === 0 && updatedList[0]) {
            syncPrimaryToForm(updatedList[0]);
          }
        };

        return (
          <Stack spacing={1.5} sx={{ width: "100%" }}>
            {/* Line 1: Customer Type, Customer Name, Company Name, Email, Phone, DOB (6 items) */}
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                "& > div": {
                  display: "grid !important",
                  width: "100%",
                  minWidth: { xs: 0, lg: 960 },
                  gridTemplateColumns: {
                    xs: "1fr !important",
                    sm: "repeat(2, minmax(0, 1fr)) !important",
                    md: "repeat(3, minmax(0, 1fr)) !important",
                    lg: "minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1fr) minmax(0, 1.4fr) minmax(182px, 185px) minmax(0, 0.95fr) !important",
                  },
                  columnGap: "12px !important",
                  rowGap: "12px !important",
                  alignItems: "start !important",
                },
                "& > div > .MuiStack-root:nth-of-type(5) > .MuiBox-root": {
                  gridTemplateColumns: "65px minmax(0, 1fr) !important",
                  gap: "6px !important",
                },
                "& > div > .MuiStack-root:nth-of-type(5) .MuiSelect-select": {
                  paddingLeft: "8px !important",
                  paddingRight: "20px !important",
                  fontSize: "0.775rem !important",
                },
                "& > div > .MuiStack-root:nth-of-type(5) .MuiSelect-icon": {
                  right: "3px !important",
                },
              }}
            >
              <MasterFormFields
                compact
                definition={{
                  ...formDefinition,
                  fields: line1Fields,
                  gridColumns: 5,
                }}
                onChange={onChange}
                presentation={mode === "view" ? "details" : "form"}
                readOnly={readOnly}
                showRequiredErrors={showRequiredErrors}
                values={values}
                variant="masters"
              />
            </Box>

            {/* Line 2: GSTIN, GSTIN Upload, PAN, PAN Upload, Remark (5 items) */}
            <Box
              sx={{
                width: "100%",
                overflowX: "auto",
                "& > div": {
                  display: "grid !important",
                  width: "100%",
                  minWidth: { xs: 0, lg: 960 },
                  gridTemplateColumns: {
                    xs: "1fr !important",
                    sm: "repeat(2, minmax(0, 1fr)) !important",
                    md: "repeat(3, minmax(0, 1fr)) !important",
                    lg: "repeat(5, minmax(0, 1fr)) !important",
                  },
                  columnGap: "12px !important",
                  rowGap: "12px !important",
                  alignItems: "start !important",
                },
              }}
            >
              <MasterFormFields
                compact
                definition={{
                  ...formDefinition,
                  fields: line3Fields,
                  gridColumns: 5,
                }}
                onChange={onChange}
                presentation={mode === "view" ? "details" : "form"}
                readOnly={readOnly}
                showRequiredErrors={showRequiredErrors}
                values={values}
                variant="masters"
              />
            </Box>

            {/* Address Management Section */}
            <CustomerAddressesSection
              addresses={effectiveAddresses}
              primaryIndex={0}
              onMakePrimary={handleMakePrimary}
              onAdd={() =>
                setAddresses((current) => [
                  ...(current.length > 0 ? current : effectiveAddresses),
                  { ...EMPTY_ADDRESS },
                ])
              }
              onChange={handleItemChange}
              onPatch={handleItemPatch}
              onRemove={handleRemove}
              readOnly={readOnly}
            />
          </Stack>
        );
      }}
      onSave={async ({ mode: saveMode, row, values }) => {
        const effectiveList =
          addresses.length > 0
            ? addresses
            : [
                {
                  address: typeof values.address === "string" ? values.address : "",
                  pincode: typeof values.pincode === "string" ? values.pincode : "",
                  country: typeof values.country === "string" ? values.country : "",
                  state: typeof values.state === "string" ? values.state : "",
                  city: typeof values.city === "string" ? values.city : "",
                },
              ];
        const primaryAddr = effectiveList[0];
        const additionalAddrs = effectiveList.slice(1);

        const updatedValues = {
          ...values,
          address: primaryAddr?.address || "",
          pincode: primaryAddr?.pincode || "",
          country: primaryAddr?.country || "",
          state: primaryAddr?.state || "",
          city: primaryAddr?.city || "",
        };

        if (saveMode === "edit" && row?.id) {
          await updateCustomerMasterRecord(row.id, updatedValues, additionalAddrs);
        } else {
          await createCustomerMasterRecord(updatedValues, additionalAddrs);
        }
        void invalidateMaster("customer");
      }}
    />
  );
}

export function CustomerAddressesSection({
  addresses,
  primaryIndex,
  onMakePrimary,
  onAdd,
  onChange,
  onPatch,
  onRemove,
  readOnly,
}: {
  addresses: CustomerAddress[];
  primaryIndex: number;
  onMakePrimary: (index: number) => void;
  onAdd: () => void;
  onChange: (index: number, key: keyof CustomerAddress, value: string) => void;
  onPatch: (index: number, patch: Partial<CustomerAddress>) => void;
  onRemove: (index: number) => void;
  readOnly: boolean;
}) {
  const [countryOptions, setCountryOptions] = useState<string[]>([]);
  const [stateOptions, setStateOptions] = useState<Record<string, string[]>>(
    {},
  );
  const [cityOptions, setCityOptions] = useState<Record<string, string[]>>({});
  const [toastMessage, setToastMessage] = useState("");
  const pincodeLookupRequestRef = useRef<Record<string, number>>({});

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
          ? loadLocationStateOptions(address.country).then(
              (options) => [`state:${address.country}`, options] as const,
            )
          : Promise.resolve(null),
        address.country
          ? loadLocationCityOptions(address.country, address.state).then(
              (options) =>
                [
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

  const firstAddress = addresses[0];
  const isFirstAddressComplete = isCustomerAddressComplete(firstAddress);
  const canAddAddress =
    isFirstAddressComplete &&
    (addresses.length === 1 ||
      isCustomerAddressComplete(addresses[addresses.length - 1]));

  const handleAddAddress = () => {
    if (!isFirstAddressComplete) {
      setToastMessage(
        "Please fill in Address 1 completely before adding another address.",
      );
      return;
    }

    if (!canAddAddress) {
      setToastMessage(
        "Please complete the current address before adding another.",
      );
      return;
    }

    onAdd();
  };

  const handlePincodeChange = (index: number, rawValue: string) => {
    const pincode = rawValue.replace(/\D/g, "").slice(0, 6);
    onChange(index, "pincode", pincode);

    const nextRequestId = (pincodeLookupRequestRef.current[`addr-${index}`] ?? 0) + 1;
    pincodeLookupRequestRef.current[`addr-${index}`] = nextRequestId;

    if (!/^\d{6}$/.test(pincode)) {
      return;
    }

    void resolveLocationByPincode(pincode).then((location) => {
      if (
        pincodeLookupRequestRef.current[`addr-${index}`] !== nextRequestId ||
        !location
      ) {
        return;
      }

      onPatch(index, {
        pincode,
        country: location.country,
        state: location.state,
        city: location.city,
      });
    });
  };

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
        sx={{ mb: 1.5 }}
      >
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
          Customer Addresses
        </Typography>
        {!readOnly ? (
          <Button
            disabled={!canAddAddress}
            onClick={handleAddAddress}
            size="small"
            startIcon={<Plus size={15} strokeWidth={2.5} />}
            variant="contained"
            sx={(theme) => ({
              textTransform: "none",
              fontWeight: 600,
              fontSize: "0.8125rem",
              borderRadius: "6px",
              px: 1.75,
              py: 0.6,
              backgroundColor: theme.customTokens.brand.primary,
              color: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(116, 22, 22, 0.2)",
              "&:hover": {
                backgroundColor: theme.customTokens.brand.primaryScale[800],
                boxShadow: "0 2px 6px rgba(116, 22, 22, 0.3)",
              },
              "&.Mui-disabled": {
                opacity: 0.5,
                backgroundColor: theme.palette.action.disabledBackground,
                color: theme.palette.action.disabled,
              },
            })}
          >
            Add Address
          </Button>
        ) : null}
      </Stack>

      <Snackbar
        open={Boolean(toastMessage)}
        autoHideDuration={3000}
        onClose={() => setToastMessage("")}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert
          onClose={() => setToastMessage("")}
          severity="warning"
          variant="filled"
          sx={{ width: "100%" }}
        >
          {toastMessage}
        </Alert>
      </Snackbar>

      <Stack spacing={1.25}>
        {addresses.map((address, index) => {
          const isPrimary = index === primaryIndex;
          return (
            <Box
              key={`customer-address-${index}`}
              sx={(theme) => ({
                border: isPrimary
                  ? `1px solid ${theme.customTokens.brand.primaryScale[300] || theme.customTokens.borders.divider}`
                  : `1px solid ${theme.customTokens.borders.divider}`,
                borderRadius: "6px",
                p: 1.25,
                backgroundColor: isPrimary ? "rgba(116, 22, 22, 0.02)" : "transparent",
              })}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 1 }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Typography sx={{ fontSize: "0.8125rem", fontWeight: isPrimary ? 700 : 600 }}>
                    Address {index + 1}
                  </Typography>
                  {isPrimary ? (
                    <Box
                      component="span"
                      sx={(theme) => ({
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "0.6875rem",
                        fontWeight: 700,
                        px: 1,
                        py: 0.25,
                        borderRadius: "12px",
                        backgroundColor: theme.customTokens.brand.primary,
                        color: "#FFFFFF",
                      })}
                    >
                      Primary Address
                    </Box>
                  ) : !readOnly ? (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => onMakePrimary(index)}
                      sx={(theme) => ({
                        fontSize: "0.6875rem",
                        py: 0.1,
                        px: 0.9,
                        minHeight: 22,
                        textTransform: "none",
                        borderColor: theme.customTokens.borders.default,
                        color: theme.customTokens.text.primary,
                        borderRadius: "12px",
                        "&:hover": {
                          borderColor: theme.customTokens.brand.primary,
                          color: theme.customTokens.brand.primary,
                          backgroundColor: "rgba(116, 22, 22, 0.04)",
                        },
                      })}
                    >
                      Set as Primary
                    </Button>
                  ) : null}
                </Stack>
                {!readOnly && addresses.length > 1 ? (
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
                    sm: "repeat(2, minmax(0, 1fr))",
                    md: "repeat(3, minmax(0, 1fr))",
                    lg: "repeat(5, minmax(0, 1fr))",
                  },
                }}
              >
                <AddressTextField
                  label="Address"
                  value={address.address}
                  readOnly={readOnly}
                  onChange={(value) => onChange(index, "address", value)}
                />
                <AddressTextField
                  error={Boolean(
                    address.pincode && !/^\d{1,6}$/.test(address.pincode),
                  )}
                  {...(address.pincode && !/^\d{1,6}$/.test(address.pincode)
                    ? { helperText: "Pincode must contain up to 6 digits." }
                    : {})}
                  inputMode="numeric"
                  label="Pincode"
                  maxLength={6}
                  value={address.pincode}
                  readOnly={readOnly}
                  onChange={(value) => handlePincodeChange(index, value)}
                />
                <AddressSelectField
                  label="Country"
                  options={mergeOption(countryOptions, address.country)}
                  value={address.country}
                  readOnly={readOnly}
                  onChange={(value) => onChange(index, "country", value)}
                />
                <AddressSelectField
                  label="State"
                  options={mergeOption(
                    stateOptions[`state:${address.country}`] ?? [],
                    address.state,
                  )}
                  value={address.state}
                  readOnly={readOnly}
                  onChange={(value) => onChange(index, "state", value)}
                />
                <AddressSelectField
                  label="City"
                  options={mergeOption(
                    cityOptions[
                      `city:${address.country}:${address.state}`
                    ] ?? [],
                    address.city,
                  )}
                  value={address.city}
                  readOnly={readOnly}
                  onChange={(value) => onChange(index, "city", value)}
                />
              </Box>
            </Box>
          );
        })}
      </Stack>
    </Box>
  );
}

export function AddressTextField({
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

export function AddressSelectField({
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

export function mergeOption(options: string[], currentValue: string) {
  return currentValue && !options.includes(currentValue)
    ? [...options, currentValue]
    : options;
}

export function parseCustomerAddresses(value: MasterFieldValue | undefined) {
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

export function isCustomerAddress(value: unknown): value is CustomerAddress {
  return Boolean(value && typeof value === "object");
}

export function isCustomerAddressComplete(address: CustomerAddress | undefined) {
  if (!address) {
    return false;
  }

  return Boolean(
    address.address.trim() &&
      address.pincode.trim() &&
      /^\d{1,6}$/.test(address.pincode.trim()) &&
      address.country.trim() &&
      address.state.trim() &&
      address.city.trim(),
  );
}
