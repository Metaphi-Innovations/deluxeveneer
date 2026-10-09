import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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

function mapCustomerSortField(columnKey: string | null): string | undefined {
  if (!columnKey) {
    return undefined;
  }

  return CUSTOMER_SORT_FIELD_MAP[columnKey];
}

function toApiColumnFilters(
  columnFilters: Partial<Record<string, ColumnFilterValue>>,
): Record<string, string[]> {
  const filters: Record<string, string[]> = {};

  for (const [key, filter] of Object.entries(columnFilters)) {
    if (!isActiveColumnFilter(filter)) {
      continue;
    }

    filters[key] = filter.values;
  }

  return filters;
}

export function CustomerMasterListPage() {
  const [rows, setRows] = useState<MasterRecord[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const [columnFilters, setColumnFilters] = useState<
    Partial<Record<string, ColumnFilterValue>>
  >({});
  const [filterOptionsByColumn, setFilterOptionsByColumn] = useState<
    Record<string, Array<{ value: string; label: string }>>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const hasLoadedRowsRef = useRef(false);
  const columnDropdownRequestIdRef = useRef(0);

  const definition = useMemo(
    () => ({
      ...customerMasterDefinition,
      filters: customerMasterDefinition.filters.map((filter) => {
        if (filter.key === "companyName") {
          return {
            ...filter,
            options: (filterOptionsByColumn.companyName ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        if (filter.key === "customerType") {
          return { ...filter, options: STATIC_CUSTOMER_TYPE_OPTIONS };
        }
        return filter;
      }),
    }),
    [filterOptionsByColumn],
  );

  const loadColumnDropdown = useCallback(async (columnKey: string) => {
    const requestId = ++columnDropdownRequestIdRef.current;
    setFilterOptionsByColumn({});

    try {
      const result = await fetchCustomerMasterColumnDropdown(columnKey);
      if (requestId !== columnDropdownRequestIdRef.current) {
        return;
      }

      setFilterOptionsByColumn({
        [result.column]: result.options,
      });
    } catch {
      // Keep page usable; filter menus can fall back to page-local options.
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const timer = window.setTimeout(async () => {
      if (!hasLoadedRowsRef.current) {
        setIsLoading(true);
      }
      setErrorMessage("");

      try {
        const apiSortBy = mapCustomerSortField(sortBy);
        const apiFilters = toApiColumnFilters(columnFilters);
        const result = await fetchCustomerMasterPaginated({
          page,
          limit: rowsPerPage,
          search: searchValue,
          ...(apiSortBy ? { sortBy: apiSortBy } : {}),
          ...(sortOrder ? { sortOrder } : {}),
          ...(Object.keys(apiFilters).length > 0
            ? { filters: apiFilters }
            : {}),
        });

        if (!ignore) {
          setRows(result.items);
          setTotalCount(result.pagination.total);
          hasLoadedRowsRef.current = true;
          void refreshCustomerMasterCache(result.items);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load customers.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }, 300);

    return () => {
      ignore = true;
      window.clearTimeout(timer);
    };
  }, [
    reloadKey,
    searchValue,
    page,
    rowsPerPage,
    sortBy,
    sortOrder,
    columnFilters,
  ]);

  const handleStatusChange = useCallback(
    async (row: MasterRecord, checked: boolean) => {
      try {
        await updateCustomerMasterStatus(row.id, checked);
        setRows((current) =>
          current.map((entry) =>
            entry.id === row.id
              ? { ...entry, status: checked ? "Active" : "Inactive" }
              : entry,
          ),
        );
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to update customer status.",
        );
        setReloadKey((value) => value + 1);
      }
    },
    [],
  );

  const handleSearchChange = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  const handleRowsPerPageChange = useCallback((nextRowsPerPage: number) => {
    setRowsPerPage(nextRowsPerPage);
    setPage(1);
  }, []);

  const handleSortChange = useCallback(
    (nextSortBy: string, nextSortOrder: "asc" | "desc") => {
      setSortBy(nextSortBy);
      setSortOrder(nextSortOrder);
      setPage(1);
    },
    [],
  );

  const handleColumnFiltersChange = useCallback(
    (nextFilters: Partial<Record<string, ColumnFilterValue>>) => {
      setColumnFilters(nextFilters);
      setPage(1);
    },
    [],
  );

  return (
    <MasterListingPage
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      onSearchChange={handleSearchChange}
      onStatusChange={handleStatusChange}
      pagination={{
        page,
        rowsPerPage,
        totalCount,
        onPageChange: setPage,
        onRowsPerPageChange: handleRowsPerPageChange,
      }}
      sorting={{
        sortBy,
        sortOrder,
        onSortChange: handleSortChange,
      }}
      columnFilters={columnFilters}
      onColumnFilterOpen={(columnKey) => {
        void loadColumnDropdown(columnKey);
      }}
      onColumnFiltersChange={handleColumnFiltersChange}
      filterOptionsByColumn={filterOptionsByColumn}
      rows={rows}
      searchValue={searchValue}
      serverSearch
    />
  );
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
          setAddresses(parseCustomerAddresses(nextRecord.customerAddresses));
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
        customerAddresses: JSON.stringify(addresses),
      }}
      afterFields={
        <CustomerAddressesSection
          addresses={addresses}
          onAdd={() =>
            setAddresses((current) => [...current, { ...EMPTY_ADDRESS }])
          }
          onChange={handleAddressChange}
          onPatch={handleAddressPatch}
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
          (address) => !address.pincode || /^\d{1,6}$/.test(address.pincode),
        )
      }
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        if (saveMode === "edit" && row?.id) {
          await updateCustomerMasterRecord(row.id, values, addresses);
          return;
        }

        await createCustomerMasterRecord(values, addresses);
      }}
    />
  );
}

function CustomerAddressesSection({
  addresses,
  onAdd,
  onChange,
  onPatch,
  onRemove,
  readOnly,
}: {
  addresses: CustomerAddress[];
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
  const pincodeLookupRequestRef = useRef<Record<number, number>>({});

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

  const canAddAddress =
    addresses.length === 0 ||
    isCustomerAddressComplete(addresses[addresses.length - 1]);

  const handleAddAddress = () => {
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

    const nextRequestId = (pincodeLookupRequestRef.current[index] ?? 0) + 1;
    pincodeLookupRequestRef.current[index] = nextRequestId;

    if (!/^\d{6}$/.test(pincode)) {
      return;
    }

    void resolveLocationByPincode(pincode).then((location) => {
      if (
        pincodeLookupRequestRef.current[index] !== nextRequestId ||
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
        sx={{ mb: 1.25 }}
      >
        <Typography sx={{ fontSize: "0.875rem", fontWeight: 700 }}>
          Additional Addresses
        </Typography>
        {!readOnly ? (
          <Button
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

function isCustomerAddressComplete(address: CustomerAddress | undefined) {
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
