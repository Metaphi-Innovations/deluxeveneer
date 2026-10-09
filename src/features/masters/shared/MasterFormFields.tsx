import { useEffect, useRef, useState, type ReactNode } from "react";
import { Eye, FileText, Upload, X } from "lucide-react";
import {
  getCountries,
  getCountryCallingCode,
  type CountryCode,
} from "libphonenumber-js";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";

import { ErpToggleSwitch } from "../../../components/inputs/ErpToggleSwitch";
import {
  loadLocationCityOptions,
  loadLocationCountryOptions,
  loadLocationStateOptions,
  locationSearchVisibleOptionLimit,
  resolveLocationByPincode,
} from "../../shared/locationOptions";
import { ErpDatePickerField, ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import {
  getSelectDropdownOptionSx,
  getSelectDropdownPaperSx,
} from "../../shared/dropdownMenuStyles";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  getMastersCompactFieldSx,
  mastersErpControlHeight,
  mastersFormGridGap,
  mastersFormLabelSx,
} from "./mastersFormStyles";
import type {
  MasterDefinition,
  MasterFieldDefinition,
  MasterFieldValue,
  MasterUploadedFileValue,
} from "./types";
import { normalizeMasterStatusValue, formatMasterValue } from "./utils";
import {
  getMasterDocumentDisplayName,
  getMasterDocumentUrl,
} from "./masterDocumentValue";

type FormFieldLayoutDefinition = {
  fields: readonly MasterFieldDefinition[];
  gridColumns: MasterDefinition["gridColumns"];
};

interface MasterFormFieldsProps {
  compact?: boolean | undefined;
  definition: FormFieldLayoutDefinition;
  fieldActions?: Partial<Record<string, ReactNode>> | undefined;
  onChange: (key: string, value: MasterFieldValue) => void;
  presentation?: "form" | "details" | undefined;
  readOnly?: boolean | undefined;
  showRequiredErrors?: boolean | undefined;
  values: Record<string, MasterFieldValue>;
  /**
   * Masters Add/Edit density treatment. Other modules must omit this
   * (or leave default) so their forms stay unchanged.
   */
  variant?: "default" | "masters" | undefined;
}

interface PreviewState {
  mimeType?: string;
  name: string;
  previewUrl: string;
}

const acceptedUploadExtensions = [".pdf", ".png", ".jpg", ".jpeg"];
const acceptedUploadMimeTypes = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
]);

const uploadAcceptAttribute =
  ".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg";

function isMasterUploadedFileValue(
  value: MasterFieldValue,
): value is MasterUploadedFileValue {
  return (
    typeof value === "object" &&
    value !== null &&
    "name" in value &&
    typeof value.name === "string"
  );
}

function getMasterFileName(value: MasterFieldValue, fallbackLabel = "Document") {
  if (isMasterUploadedFileValue(value)) {
    return value.name || getMasterDocumentDisplayName(value.previewUrl, fallbackLabel);
  }

  if (typeof value === "string") {
    return getMasterDocumentDisplayName(value, fallbackLabel);
  }

  return "";
}

function getMasterFileUrl(value: MasterFieldValue) {
  if (isMasterUploadedFileValue(value)) {
    if (value.previewUrl) {
      return getMasterDocumentUrl(value.previewUrl) || value.previewUrl.trim();
    }

    if (typeof value.name === "string" && value.name.startsWith("{")) {
      return getMasterDocumentUrl(value.name);
    }

    return "";
  }

  if (typeof value === "string") {
    return getMasterDocumentUrl(value);
  }

  return "";
}

const countryNameFormatter = new Intl.DisplayNames(["en"], { type: "region" });

export const countryCodeOptions = Array.from(
  getCountries()
    .reduce((countryGroups, country) => {
      const code = `+${getCountryCallingCode(country)}`;
      const countries = countryGroups.get(code) ?? [];

      countries.push(getCountryName(country));
      countryGroups.set(code, countries);

      return countryGroups;
    }, new Map<string, string[]>())
    .entries(),
)
  .map(([code, countries]) => {
    const sortedCountries = countries.sort((first, second) =>
      first.localeCompare(second),
    );
    const firstCountry = sortedCountries[0] ?? code;
    const displayCountries =
      sortedCountries.length > 2
        ? `${sortedCountries.slice(0, 2).join(" / ")} +${sortedCountries.length - 2}`
        : sortedCountries.join(" / ");

    return {
      code,
      label: displayCountries,
      sortLabel: firstCountry,
    };
  })
  .sort((first, second) => first.sortLabel.localeCompare(second.sortLabel));

export function MasterFormFields({
  compact = false,
  definition,
  fieldActions,
  onChange,
  presentation = "form",
  readOnly = false,
  showRequiredErrors = false,
  values,
  variant = "default",
}: MasterFormFieldsProps) {
  const theme = useTheme();
  const isMastersVariant = variant === "masters";
  const desktopColumns =
    definition.gridColumns === 5 ? 5 : definition.gridColumns === 4 ? 4 : 3;
  const fieldControlSize = "regular";
  const isDetailsPresentation = presentation === "details";
  const [previewState, setPreviewState] = useState<PreviewState | null>(null);
  const [locationOptions, setLocationOptions] = useState<Record<string, string[]>>(
    {},
  );
  const createdPreviewUrlsRef = useRef<Set<string>>(new Set());
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const pincodeLookupRequestRef = useRef(0);
  const fields = getOrderedFormFields(definition.fields);
  const useSingleColumn = fields.length <= 1;
  /** Compact forms use the 36px portal control height (not table-dense 33px). */
  const fieldSxOptions = compact ? { dense: false } : {};
  const resolveFieldSx = (
    state: Parameters<typeof getCompactFieldSx>[1] = "default",
  ) =>
    isMastersVariant
      ? getMastersCompactFieldSx(theme, state)
      : getCompactFieldSx(theme, state, fieldSxOptions);
  const mastersErpProps = isMastersVariant
    ? {
      controlHeight: mastersErpControlHeight,
      controlRadius: 6,
      focusRing: "subtle" as const,
    }
    : {};
  const selectedCountry = getLocationValue(definition.fields, values, "country");
  const selectedState = getLocationValue(definition.fields, values, "state");
  const handleFieldChange = (
    field: MasterFieldDefinition,
    value: MasterFieldValue,
  ) => {
    onChange(field.key, value);

    if (isCountryField(field)) {
      pincodeLookupRequestRef.current += 1;
      clearDependentLocationFields(definition.fields, onChange, ["state", "city"]);
      return;
    }

    if (isStateField(field)) {
      pincodeLookupRequestRef.current += 1;
      clearDependentLocationFields(definition.fields, onChange, ["city"]);
      return;
    }

    if (!isPincodeField(field) || typeof value !== "string") {
      return;
    }

    const normalizedPincode = value.trim();
    const lookupRequestId = pincodeLookupRequestRef.current + 1;

    pincodeLookupRequestRef.current = lookupRequestId;

    if (!/^\d{6}$/.test(normalizedPincode)) {
      return;
    }

    void resolveLocationByPincode(normalizedPincode).then((location) => {
      if (lookupRequestId !== pincodeLookupRequestRef.current || !location) {
        return;
      }

      applyPincodeLocation(definition.fields, location, onChange);
    });
  };

  useEffect(() => {
    return () => {
      createdPreviewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      createdPreviewUrlsRef.current.clear();
    };
  }, []);

  useEffect(() => {
    let ignore = false;
    const locationKeys = Array.from(
      new Set(
        definition.fields
          .filter(isLocationField)
          .map((field) => getNormalizedFieldKey(field)),
      ),
    );

    if (locationKeys.length === 0) {
      return () => {
        ignore = true;
      };
    }

    Promise.all(
      locationKeys.map(async (key) => {
        if (key === "country") {
          return [key, await loadLocationCountryOptions()] as const;
        }

        if (key === "state") {
          return [key, await loadLocationStateOptions(selectedCountry)] as const;
        }

        if (key === "city") {
          return [
            key,
            await loadLocationCityOptions(selectedCountry, selectedState),
          ] as const;
        }

        return [key, await loadLocationCityOptions("India")] as const;
      }),
    ).then((loadedOptions) => {
      if (ignore) {
        return;
      }

      setLocationOptions((current) => ({
        ...current,
        ...Object.fromEntries(loadedOptions),
      }));
    });

    return () => {
      ignore = true;
    };
  }, [definition.fields, selectedCountry, selectedState]);

  return (
    <>
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(
            isMastersVariant
              ? mastersFormGridGap.row
              : compact
                ? 1.25
                : 1.5,
          ),
          rowGap: theme.spacing(
            isMastersVariant
              ? mastersFormGridGap.row
              : compact
                ? 1.25
                : 1.5,
          ),
          columnGap: theme.spacing(
            isMastersVariant
              ? mastersFormGridGap.column
              : compact
                ? 1.5
                : 1.75,
          ),
          width: "100%",
          gridTemplateColumns: useSingleColumn
            ? "minmax(0, 1fr)"
            : {
              xs: "repeat(1, minmax(0, 1fr))",
              sm: compact
                ? "repeat(2, minmax(140px, 1fr))"
                : "repeat(1, minmax(0, 1fr))",
              md: compact
                ? "repeat(3, minmax(150px, 1fr))"
                : "repeat(2, minmax(160px, 1fr))",
              lg:
                desktopColumns >= 5
                  ? "repeat(5, minmax(140px, 1fr))"
                  : `repeat(${desktopColumns}, minmax(160px, 1fr))`,
              xl: `repeat(${desktopColumns}, minmax(160px, 1fr))`,
            },
        })}
      >
        {fields.map((field) => {
          const fieldValue = values[field.key] ?? null;
          const renderedFieldType = isStatusField(field) ? "toggle" : field.type;
          const isFullWidth = field.span === "full" || field.type === "textarea";
          const fieldIsReadOnly = readOnly || Boolean(field.readOnly);
          const fieldRequired = isRequiredField(field);
          const fieldHasRequiredError =
            showRequiredErrors &&
            !fieldIsReadOnly &&
            isRequiredFieldEmpty(field, fieldValue);
          const fieldValidationError =
            showRequiredErrors && !fieldIsReadOnly
              ? getFieldValidationError(field, fieldValue)
              : "";
          const fieldHelperText =
            fieldHasRequiredError
              ? getRequiredFieldMessage(field)
              : fieldValidationError || field.helperText;
          const fieldState = fieldHasRequiredError
            ? "error"
            : fieldValidationError
              ? "error"
              : fieldIsReadOnly
                ? "readOnly"
                : "default";
          const interactiveFieldState = fieldHasRequiredError
            ? "error"
            : fieldValidationError
              ? "error"
              : fieldIsReadOnly
                ? "disabled"
                : "default";
          const fieldAction = fieldActions?.[field.key] ?? null;

          return (
            <Stack
              key={field.key}
              sx={(theme) => ({
                gap: theme.spacing(
                  isMastersVariant
                    ? mastersFormGridGap.labelToField
                    : compact
                      ? 0.65
                      : 0.75,
                ),
                width: "100%",
                maxWidth: field.maxWidth ?? undefined,
                minWidth: 0,
                gridColumn: field.columnSpan
                  ? {
                    xs: "span 1",
                    sm: `span ${Math.min(field.columnSpan, 2)}`,
                    md: `span ${Math.min(field.columnSpan, desktopColumns)}`,
                    lg: `span ${Math.min(field.columnSpan, desktopColumns)}`,
                  }
                  : isFullWidth
                    ? {
                      xs: "span 1",
                      lg: useSingleColumn
                        ? "span 1"
                        : `span ${Math.min(desktopColumns, 2)}`,
                      xl: useSingleColumn
                        ? "span 1"
                        : `span ${Math.min(desktopColumns, 2)}`,
                    }
                    : undefined,
              })}
            >
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                sx={() => ({
                  gap: 1,
                  height: "20px",
                  minHeight: "20px",
                  maxHeight: "20px",
                })}
              >
                <FieldLabel
                  compact={compact}
                  label={field.label}
                  required={fieldRequired && !isDetailsPresentation}
                  masters={isMastersVariant}
                />

                {fieldAction}
              </Stack>

              {isDetailsPresentation ? (
                field.type === "file" ? (
                  <DetailFilePreview
                    label={field.label}
                    value={fieldValue}
                    onPreview={(preview) => setPreviewState(preview)}
                  />
                ) : isPhoneField(field) && formatDetailFieldValue(field, fieldValue, values) !== "—" ? (
                  <Typography
                    component="a"
                    href={`tel:${formatDetailFieldValue(field, fieldValue, values).replace(/[^\d+]/g, "")}`}
                    onClick={(event) => event.stopPropagation()}
                    sx={(currentTheme) => ({
                      color: currentTheme.customTokens.brand.primary,
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: 1.4,
                      minHeight: currentTheme.spacing(2.5),
                      wordBreak: "break-word",
                      textDecoration: "none",
                      cursor: "pointer",
                      "&:hover": {
                        textDecoration: "underline",
                      },
                    })}
                  >
                    {formatDetailFieldValue(field, fieldValue, values)}
                  </Typography>
                ) : (
                  <Typography
                    sx={(currentTheme) => ({
                      color: currentTheme.customTokens.text.primary,
                      fontSize: "14px",
                      fontWeight: 400,
                      lineHeight: 1.4,
                      minHeight: currentTheme.spacing(2.5),
                      wordBreak: "break-word",
                    })}
                  >
                    {formatDetailFieldValue(field, fieldValue, values)}
                  </Typography>
                )
              ) : null}

              {!isDetailsPresentation && field.type === "text" && isPhoneField(field) ? (
                <Box
                  sx={(currentTheme) => ({
                    display: "grid",
                    gap: currentTheme.spacing(0.75),
                    gridTemplateColumns: "65px minmax(0, 1fr)",
                  })}
                >
                  <TextField
                    disabled={fieldIsReadOnly}
                    select
                    value={getPhoneCountryCode(values, field.key)}
                    onChange={(event) =>
                      onChange(getPhoneCountryCodeKey(field.key), event.target.value)
                    }
                    sx={[
                      resolveFieldSx(fieldIsReadOnly ? "readOnly" : "default"),
                      {
                        "& .MuiSelect-select": {
                          alignItems: "center",
                          boxSizing: "border-box",
                          display: "flex",
                          height: "100%",
                          justifyContent: "flex-start",
                          lineHeight: 1,
                          minHeight: "0 !important",
                          paddingLeft: `${theme.spacing(1)} !important`,
                          paddingRight: `${theme.spacing(2.5)} !important`,
                          paddingTop: "0 !important",
                          paddingBottom: "0 !important",
                          fontSize: "0.8125rem !important",
                        },
                        "& .MuiSelect-icon": {
                          right: theme.spacing(0.5),
                          top: "50%",
                          transform: "translateY(-50%)",
                        },
                      },
                    ]}
                    slotProps={{
                      input: {
                        readOnly: fieldIsReadOnly,
                      },
                      select: {
                        MenuProps: {
                          anchorOrigin: {
                            horizontal: "left",
                            vertical: "bottom",
                          },
                          MenuListProps: {
                            dense: true,
                            sx: {
                              py: 0.5,
                            },
                          },
                          PaperProps: {
                            sx: {
                              ...getSelectDropdownPaperSx(theme, 280, {
                                preferredMinWidth: 280,
                              }),
                              maxHeight: 240,
                              overflowY: "auto",
                              scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
                              scrollbarWidth: "thin",
                              "& .MuiMenuItem-root": {
                                ...getSelectDropdownOptionSx(theme, true),
                              },
                              "&::-webkit-scrollbar": {
                                width: 6,
                              },
                              "&::-webkit-scrollbar-track": {
                                backgroundColor: theme.customTokens.surfaces.alt,
                                borderRadius: 999,
                              },
                              "&::-webkit-scrollbar-thumb": {
                                backgroundColor: theme.customTokens.brand.primary,
                                borderRadius: 999,
                              },
                              "&::-webkit-scrollbar-thumb:hover": {
                                backgroundColor:
                                  theme.customTokens.brand.primaryScale[800],
                              },
                            },
                          },
                          transformOrigin: {
                            horizontal: "left",
                            vertical: "top",
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
                        sx={(theme) => ({
                          fontSize: theme.typography.body2.fontSize,
                          minHeight: 32,
                        })}
                      >
                        {countryCode.code} - {countryCode.label}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    fullWidth
                    error={Boolean(fieldHasRequiredError || fieldValidationError)}
                    helperText={fieldHelperText}
                    value={getPhoneDisplayValue(
                      fieldValue,
                      getPhoneCountryCode(values, field.key),
                    )}
                    onChange={(event) => {
                      const countryCodeKey = getPhoneCountryCodeKey(field.key);
                      const countryCode = getPhoneCountryCode(values, field.key);

                      if (values[countryCodeKey] !== countryCode) {
                        onChange(countryCodeKey, countryCode);
                      }

                      onChange(
                        field.key,
                        normalizeTextInputValue(field, event.target.value),
                      );
                    }}
                    sx={{
                      ...resolveFieldSx(fieldState),
                      "& .MuiOutlinedInput-root": {
                        height: theme.spacing(4.5),
                        minHeight: theme.spacing(4.5),
                      },
                    }}
                    slotProps={{
                      input: {
                        readOnly: fieldIsReadOnly,
                      },
                      htmlInput: {
                        inputMode: "numeric",
                        maxLength: 10,
                        pattern: "[0-9]*",
                      },
                    }}
                  />
                </Box>
              ) : null}

              {!isDetailsPresentation && renderedFieldType === "text" &&
                !isPhoneField(field) &&
                !isLocationField(field) ? (
                <TextField
                  fullWidth
                  error={Boolean(fieldHasRequiredError || fieldValidationError)}
                  helperText={fieldHelperText}
                  value={typeof fieldValue === "string" ? fieldValue : ""}
                  onChange={(event) => {
                    const nextValue = normalizeTextInputValue(
                      field,
                      event.target.value,
                    );

                    handleFieldChange(field, nextValue);
                  }}
                  sx={
                    isMastersVariant
                      ? resolveFieldSx(fieldState)
                      : {
                        ...resolveFieldSx(fieldState),
                        "& .MuiOutlinedInput-root": {
                          height: theme.spacing(4.5),
                          minHeight: theme.spacing(4.5),
                        },
                      }
                  }
                  slotProps={getTextFieldSlotProps(field, fieldIsReadOnly)}
                />
              ) : null}

              {!isDetailsPresentation && renderedFieldType === "textarea" ? (
                <TextField
                  fullWidth
                  error={Boolean(fieldHasRequiredError || fieldValidationError)}
                  helperText={fieldHelperText}
                  multiline
                  minRows={field.rows ?? 3}
                  value={typeof fieldValue === "string" ? fieldValue : ""}
                  onChange={(event) => onChange(field.key, event.target.value)}
                  sx={resolveFieldSx(fieldState)}
                  slotProps={{
                    input: {
                      readOnly: fieldIsReadOnly,
                    },
                  }}
                />
              ) : null}

              {!isDetailsPresentation &&
                (renderedFieldType === "select" || isLocationField(field)) ? (
                <ErpSelectField
                  helperText={fieldHelperText}
                  maxVisibleOptions={
                    isLocationField(field)
                      ? locationSearchVisibleOptionLimit
                      : undefined
                  }
                  onChange={(value) => handleFieldChange(field, value)}
                  options={getSelectOptions(field, locationOptions)}
                  renderBottomAction={field.renderDropdownAction}
                  searchable
                  size={fieldControlSize}
                  state={interactiveFieldState}
                  value={typeof fieldValue === "string" ? fieldValue : ""}
                  {...mastersErpProps}
                />
              ) : null}

              {!isDetailsPresentation && renderedFieldType === "date" ? (
                <ErpDatePickerField
                  helperText={fieldHelperText}
                  onChange={(value) => onChange(field.key, value)}
                  size={fieldControlSize}
                  state={interactiveFieldState}
                  value={fieldValue instanceof Date ? fieldValue : null}
                  {...mastersErpProps}
                />
              ) : null}

              {!isDetailsPresentation && renderedFieldType === "file" ? (() => {
                const fileName = getMasterFileName(fieldValue, field.label);
                const uploadedFieldValue = isMasterUploadedFileValue(fieldValue)
                  ? fieldValue
                  : null;
                const canPreview = fileName.length > 0;
                const resolvedFileUrl = getMasterFileUrl(fieldValue);

                const previewButton = canPreview ? (
                  <IconButton
                    aria-label={`Preview ${field.label.toLowerCase()}`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      const fileUrl =
                        uploadedFieldValue?.previewUrl || resolvedFileUrl;

                      const previewMimeType = getUploadPreviewMimeType(
                        fileName,
                        uploadedFieldValue?.mimeType,
                        fileUrl,
                      );

                      setPreviewState({
                        ...(previewMimeType ? { mimeType: previewMimeType } : {}),
                        name: fileName,
                        previewUrl: fileUrl,
                      });
                    }}
                    size="small"
                    sx={{
                      color: theme.customTokens.navigation.activeText,
                      height: theme.spacing(3.25),
                      width: theme.spacing(3.25),
                    }}
                  >
                    <Eye size={14} />
                  </IconButton>
                ) : null;

                if (fieldIsReadOnly) {
                  return (
                    <TextField
                      fullWidth
                      value={fileName}
                      sx={{
                        ...resolveFieldSx(fieldHasRequiredError ? "error" : "readOnly"),
                        "& .MuiOutlinedInput-root": {
                          height: theme.spacing(4.5),
                          minHeight: theme.spacing(4.5),
                        },
                      }}
                      slotProps={{
                        input: {
                          readOnly: true,
                          endAdornment: canPreview ? (
                            <InputAdornment position="end">
                              {previewButton}
                            </InputAdornment>
                          ) : null,
                        },
                      }}
                    />
                  );
                }

                const fileUrl =
                  uploadedFieldValue?.previewUrl || resolvedFileUrl;
                const isImage =
                  fileUrl.startsWith("data:image/") ||
                  fileUrl.endsWith(".png") ||
                  fileUrl.endsWith(".jpg") ||
                  fileUrl.endsWith(".jpeg") ||
                  fileUrl.endsWith(".webp") ||
                  uploadedFieldValue?.mimeType?.startsWith("image/");

                return (
                  <Box
                    sx={(currentTheme) => ({
                      display: "flex",
                      gap: currentTheme.spacing(1),
                      alignItems: "center",
                      width: "100%",
                    })}
                  >
                    {isImage && fileUrl ? (
                      <Box
                        onClick={() => {
                          setPreviewState({
                            mimeType: "image/jpeg",
                            name: fileName || "Preview",
                            previewUrl: fileUrl,
                          });
                        }}
                        sx={(currentTheme) => ({
                          width: 36,
                          height: 36,
                          minWidth: 36,
                          borderRadius: `${currentTheme.customTokens.radius.md}px`,
                          overflow: "hidden",
                          border: `1px solid ${currentTheme.customTokens.borders.default}`,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: currentTheme.palette.background.paper,
                          transition: "transform 0.15s ease",
                          "&:hover": {
                            transform: "scale(1.08)",
                          },
                        })}
                      >
                        <img
                          src={fileUrl}
                          alt={fileName}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </Box>
                    ) : null}

                    <input
                      ref={(element) => {
                        fileInputRefs.current[field.key] = element;
                      }}
                      hidden
                      accept={uploadAcceptAttribute}
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];

                        if (!file) {
                          event.currentTarget.value = "";
                          return;
                        }

                        if (!isAcceptedUploadFile(file)) {
                          event.currentTarget.value = "";
                          return;
                        }

                        if (uploadedFieldValue?.previewUrl) {
                          URL.revokeObjectURL(uploadedFieldValue.previewUrl);
                          createdPreviewUrlsRef.current.delete(
                            uploadedFieldValue.previewUrl,
                          );
                        }

                        const previewUrl = URL.createObjectURL(file);
                        createdPreviewUrlsRef.current.add(previewUrl);

                        onChange(field.key, {
                          file,
                          mimeType: file.type,
                          name: file.name,
                          previewUrl,
                        });
                        event.currentTarget.value = "";
                      }}
                    />

                    <TextField
                      fullWidth
                      value={fileName}
                      sx={{
                        ...resolveFieldSx(fieldHasRequiredError ? "error" : "readOnly"),
                        flex: 1,
                        "& .MuiOutlinedInput-root": {
                          height: theme.spacing(4.5),
                          minHeight: theme.spacing(4.5),
                        },
                      }}
                      slotProps={{
                        input: {
                          readOnly: true,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                aria-label={`Upload ${field.label.toLowerCase()}`}
                                onClick={() =>
                                  fileInputRefs.current[field.key]?.click()
                                }
                                size="small"
                                sx={{
                                  color: theme.customTokens.navigation.activeText,
                                  height: theme.spacing(3.25),
                                  width: theme.spacing(3.25),
                                }}
                              >
                                <Upload size={14} />
                              </IconButton>
                              {previewButton}
                              {fileName.length > 0 ? (
                                <IconButton
                                  aria-label={`Remove ${field.label.toLowerCase()}`}
                                  onClick={(event) => {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    if (uploadedFieldValue?.previewUrl) {
                                      URL.revokeObjectURL(
                                        uploadedFieldValue.previewUrl,
                                      );
                                      createdPreviewUrlsRef.current.delete(
                                        uploadedFieldValue.previewUrl,
                                      );
                                    }

                                    onChange(field.key, "");
                                  }}
                                  size="small"
                                  sx={{
                                    color: theme.palette.text.secondary,
                                    height: theme.spacing(3.25),
                                    width: theme.spacing(3.25),
                                  }}
                                >
                                  <X size={14} />
                                </IconButton>
                              ) : null}
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>
                );
              })() : null}

              {!isDetailsPresentation && renderedFieldType === "toggle" ? (
                <Box
                  sx={(theme) => ({
                    minHeight: theme.spacing(4.5),
                    display: "flex",
                    alignItems: "center",
                    px: isStatusField(field) ? 0 : theme.spacing(1),
                    border: isStatusField(field)
                      ? "none"
                      : `1px solid ${theme.customTokens.borders.default}`,
                    borderRadius: isStatusField(field)
                      ? 0
                      : `${theme.customTokens.radius.md}px`,
                  })}
                >
                  <FormControlLabel
                    control={
                      <ErpToggleSwitch
                        checked={getToggleCheckedValue(field, fieldValue)}
                        disabled={fieldIsReadOnly}
                        onChange={(nextChecked) =>
                          onChange(
                            field.key,
                            isStatusField(field)
                              ? getStatusFieldValue(nextChecked)
                              : nextChecked,
                          )
                        }
                      />
                    }
                    label={
                      isStatusField(field)
                        ? getStatusFieldValue(getToggleCheckedValue(field, fieldValue))
                        : getToggleCheckedValue(field, fieldValue)
                          ? "Enabled"
                          : "Disabled"
                    }
                    sx={(theme) => ({
                      m: 0,
                      gap: theme.spacing(1),
                      "& .MuiFormControlLabel-label": {
                        color: theme.customTokens.text.primary,
                        fontSize: theme.typography.body2.fontSize,
                      },
                    })}
                  />
                </Box>
              ) : null}

              {!isDetailsPresentation && renderedFieldType === "checkbox" ? (
                <Box
                  sx={(theme) => ({
                    minHeight: theme.spacing(4.5),
                    display: "flex",
                    alignItems: "center",
                    px: theme.spacing(1),
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    borderRadius: `${theme.customTokens.radius.md}px`,
                  })}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={Boolean(fieldValue)}
                        disabled={readOnly}
                        onChange={(event) =>
                          onChange(field.key, event.target.checked)
                        }
                      />
                    }
                    label={field.helperText ?? field.label}
                    sx={{ m: 0 }}
                  />
                </Box>
              ) : null}
            </Stack>
          );
        })}
      </Box>

      <Dialog
        fullWidth
        maxWidth="md"
        onClose={() => setPreviewState(null)}
        open={previewState !== null}
      >
        <DialogTitle sx={{ m: 0, p: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Typography variant="h6" sx={{ fontSize: "1rem", fontWeight: 600 }}>
            {previewState?.name ?? "File Preview"}
          </Typography>
          <IconButton
            aria-label="close"
            onClick={() => setPreviewState(null)}
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
          {previewState?.previewUrl && (() => {
            const url = previewState.previewUrl.trim();
            const cleanPath = (url.split("?")[0] ?? "").toLowerCase();
            const isPdf =
              previewState.mimeType === "application/pdf" ||
              cleanPath.endsWith(".pdf") ||
              url.startsWith("data:application/pdf");

            if (!isPdf) {
              return (
                <Box
                  component="img"
                  src={url}
                  alt={previewState.name}
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
              );
            }

            return (
              <Box
                component="iframe"
                src={url}
                title={previewState.name}
                sx={{
                  width: "100%",
                  height: "70vh",
                  border: 0,
                  borderRadius: 1,
                }}
              />
            );
          })()}
          {!previewState?.previewUrl && (
            <Typography variant="body2" color="text.secondary">
              No preview available for this document.
            </Typography>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function hasRequiredFieldErrors(
  fields: readonly MasterFieldDefinition[],
  values: Record<string, MasterFieldValue>,
) {
  return fields.some((field) =>
    isRequiredFieldEmpty(field, values[field.key] ?? null),
  );
}

export function hasFormFieldErrors(
  fields: readonly MasterFieldDefinition[],
  values: Record<string, MasterFieldValue>,
) {
  return fields.some((field) =>
    isRequiredFieldEmpty(field, values[field.key] ?? null) ||
    Boolean(getFieldValidationError(field, values[field.key] ?? null)),
  );
}

function formatDetailFieldValue(
  field: MasterFieldDefinition,
  value: MasterFieldValue | null,
  values: Record<string, MasterFieldValue>,
) {
  if (isPhoneField(field)) {
    const countryCode = getPhoneCountryCode(values, field.key);
    const localDigits = typeof value === "string" ? getPhoneLocalDigits(value) : "";
    if (!localDigits) {
      return "—";
    }
    return `${countryCode} ${localDigits}`.trim();
  }

  if (isStatusField(field) || field.type === "toggle") {
    const checked = getToggleCheckedValue(field, value);
    if (isStatusField(field)) {
      return getStatusFieldValue(checked);
    }
    return checked ? "Enabled" : "Disabled";
  }

  if (field.type === "checkbox") {
    return value ? "Yes" : "No";
  }

  if (field.type === "file") {
    const fileName = getMasterFileName(value, field.label);
    return fileName || "—";
  }

  const display = formatMasterValue(
    value as Parameters<typeof formatMasterValue>[0],
    field.key,
    field.label,
  );
  return display.trim().length > 0 ? display : "—";
}

function FieldLabel({
  compact = false,
  label,
  masters = false,
  required: _required,
}: {
  compact?: boolean;
  label: string;
  masters?: boolean;
  required: boolean;
}) {
  return (
    <Typography
      variant="subtitle2"
      color="text.primary"
      sx={
        masters
          ? mastersFormLabelSx()
          : {
            fontSize: compact ? "12px" : "13px",
            fontWeight: 600,
            lineHeight: 1.3,
            whiteSpace: compact ? "nowrap" : undefined,
          }
      }
    >
      {getDisplayFieldLabel(label)}
    </Typography>
  );
}

function DetailFilePreview({
  label,
  value,
  onPreview,
}: {
  label: string;
  value: MasterFieldValue;
  onPreview: (preview: PreviewState) => void;
}) {
  const theme = useTheme();
  const fileName = getMasterFileName(value, label);
  const fileUrl = getMasterFileUrl(value);
  const hasValue = Boolean(fileUrl || fileName);

  if (!hasValue) {
    return (
      <Typography
        sx={{
          color: theme.customTokens.text.primary,
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: 1.4,
          minHeight: theme.spacing(2.5),
        }}
      >
        —
      </Typography>
    );
  }

  const previewMimeType = getUploadPreviewMimeType(
    fileName,
    isMasterUploadedFileValue(value) ? value.mimeType : undefined,
    fileUrl,
  );
  const isPdf =
    previewMimeType === "application/pdf" ||
    fileUrl.toLowerCase().includes(".pdf") ||
    fileUrl.startsWith("data:application/pdf") ||
    fileName.toLowerCase().endsWith(".pdf");

  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ minWidth: 0 }}>
      <Box
        onClick={() => {
          if (!fileUrl) {
            return;
          }

          onPreview({
            ...(previewMimeType ? { mimeType: previewMimeType } : {}),
            name: fileName || label,
            previewUrl: fileUrl,
          });
        }}
        title={fileUrl ? "Click to view" : undefined}
        sx={{
          width: 48,
          height: 48,
          minWidth: 48,
          borderRadius: "6px",
          overflow: "hidden",
          border: `1px solid ${theme.customTokens.borders.default}`,
          bgcolor: theme.customTokens.brand.primaryScale[50] || "#f8fafc",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: fileUrl ? "pointer" : "default",
          transition: "all 0.15s ease-in-out",
          position: "relative",
          flexShrink: 0,
          ...(fileUrl
            ? {
              "&:hover": {
                borderColor: theme.customTokens.navigation.activeText,
                boxShadow: "0 2px 8px rgba(0,0,0,0.14)",
                "& .preview-overlay": {
                  opacity: 1,
                },
              },
            }
            : {}),
        }}
      >
        {isPdf || !fileUrl ? (
          <FileText size={24} color={theme.customTokens.navigation.activeText} />
        ) : (
          <Box
            component="img"
            src={fileUrl}
            alt={fileName || label}
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
        {fileUrl ? (
          <Box
            className="preview-overlay"
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(0,0,0,0.4)",
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
        ) : null}
      </Box>

      <Typography
        sx={{
          color: theme.customTokens.text.primary,
          fontSize: "14px",
          fontWeight: 400,
          lineHeight: 1.4,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
        }}
        title={fileName || undefined}
      >
        {fileName || "—"}
      </Typography>
    </Stack>
  );
}

function getDisplayFieldLabel(label: string) {
  return label.trim().replace(/\s*\*+$/, "");
}

function getRequiredFieldMessage(field: MasterFieldDefinition) {
  return `${getDisplayFieldLabel(field.label)} is required.`;
}

function getFieldValidationError(
  field: MasterFieldDefinition,
  value: MasterFieldValue | null,
) {
  if (typeof value !== "string" || value.trim().length === 0) {
    return "";
  }

  const textValue = value.trim();

  if (isEmailField(field)) {
    if (!/^[A-Za-z0-9._-]+@[A-Za-z0-9.-]+$/.test(textValue)) {
      return "Please enter a valid email.";
    }
  }

  if (isPhoneField(field)) {
    if (/[A-Za-z]/.test(textValue)) {
      return "Phone number should contain numbers only.";
    }

    if (getPhoneLocalDigits(textValue).length > 10) {
      return "Phone number cannot exceed 10 digits.";
    }
  }

  if (isGstNoField(field) && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(textValue)) {
    return "GSTIN should be 15 characters in the format 22AAAAA0000A1Z5.";
  }

  if (isHsnCodeField(field) && !/^(?:\d{4}|\d{6}|\d{8})$/.test(textValue)) {
    return "HSN Code must be 4, 6, or 8 digits only.";
  }

  if (isGstOrHsnNumericField(field) && field.type !== "select" && !/^\d+$/.test(textValue)) {
    return `${getDisplayFieldLabel(field.label)} should contain numbers only.`;
  }

  if (isPincodeField(field) && !/^\d{6}$/.test(textValue)) {
    return "Pincode should be exactly 6 digits.";
  }

  if (isAgeField(field)) {
    if (!/^\d+$/.test(textValue)) {
      return "Age should be an integer.";
    }

    if (Number(textValue) > 100) {
      return "Age should not exceed 100.";
    }
  }

  if (isAadhaarField(field) && !/^\d{12}$/.test(textValue)) {
    return "Aadhaar No should be exactly 12 digits.";
  }

  if (isPanField(field) && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(textValue)) {
    return "PAN No should be 10 characters in the format AAAAA9999A.";
  }

  if (isFscCodeField(field) && !/^FSC-[CNP]\d{6}$/.test(textValue)) {
    return "FSC Code should match FSC-C123456, FSC-N123456, or FSC-P123456.";
  }

  if (isLettersOnlyField(field) && /[^A-Za-z\s]/.test(textValue)) {
    return `${getDisplayFieldLabel(field.label)} should contain letters only.`;
  }

  return "";
}

function isRequiredFieldEmpty(
  field: MasterFieldDefinition,
  value: MasterFieldValue | null,
) {
  if (!isRequiredField(field)) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (value === null) {
    return true;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime());
  }

  if (isMasterUploadedFileValue(value)) {
    return value.name.trim().length === 0;
  }

  return false;
}

function isRequiredField(_field: MasterFieldDefinition) {
  return false;
}

function isLettersOnlyField(field: MasterFieldDefinition) {
  if (field.type === "select" || field.readOnly) {
    return false;
  }
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field);

  // Name fields, color, currency, cut, grade, unit, city, state, country, department, msmeType, symbolicName, designation, category, item, sub category
  const isTargetField =
    key.includes("firstname") ||
    key.includes("lastname") ||
    key.includes("colorname") ||
    key.includes("cutname") ||
    key.includes("gradename") ||
    key.includes("unitname") ||
    key.includes("departmentname") ||
    key.includes("symbolicname") ||
    key.includes("categoryname") ||
    key.includes("itemname") ||
    key.includes("itemsubcategory") ||
    key.includes("subcategory") ||
    key.includes("currencyname") ||
    key.includes("contactpersonname") ||
    key.includes("suppliername") ||
    key.includes("customername") ||
    key === "color" ||
    key === "currency" ||
    key === "cut" ||
    key === "grade" ||
    key === "department" ||
    key === "category" ||
    key === "item" ||
    key === "city" ||
    key === "state" ||
    key === "country" ||
    key === "designation" ||
    key === "msmetype" ||
    label.includes("first name") ||
    label.includes("last name") ||
    label.includes("color name") ||
    label.includes("currency name") ||
    label.includes("cut name") ||
    label.includes("grade name") ||
    label.includes("unit name") ||
    label.includes("department name") ||
    label.includes("symbolic name") ||
    label.includes("category name") ||
    label.includes("item name") ||
    label.includes("sub category") ||
    label.includes("contact person name") ||
    label.includes("supplier name") ||
    label.includes("customer name") ||
    label === "designation" ||
    label === "city" ||
    label === "state" ||
    label === "country" ||
    label === "msme type";

  return isTargetField;
}

function normalizeTextInputValue(field: MasterFieldDefinition, value: string) {
  if (isEmailField(field)) {
    return value.replace(/[^A-Za-z0-9@._-]/g, "");
  }

  if (isPhoneField(field)) {
    return value.replace(/\D/g, "").slice(0, 10);
  }

  if (isGstNoField(field)) {
    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 15);
  }

  if (isHsnCodeField(field)) {
    return value.replace(/\D/g, "").slice(0, 8);
  }

  if (isGstOrHsnNumericField(field) && field.type !== "select") {
    return value.replace(/\D/g, "").slice(0, 2);
  }

  if (isPincodeField(field)) {
    return value.replace(/\D/g, "").slice(0, 6);
  }

  if (isAgeField(field)) {
    const integerValue = value.replace(/\D/g, "").slice(0, 3);

    if (!integerValue) {
      return "";
    }

    return String(Math.min(Number(integerValue), 100));
  }

  if (isAadhaarField(field)) {
    return value.replace(/\D/g, "").slice(0, 12);
  }

  if (isPanField(field)) {
    return value.replace(/[^A-Za-z0-9]/g, "").toUpperCase().slice(0, 10);
  }

  if (isFscCodeField(field)) {
    return value.replace(/[^A-Za-z0-9-]/g, "").toUpperCase().slice(0, 11);
  }

  if (isLettersOnlyField(field)) {
    // Only allow letters (A-Z, a-z) and single spaces
    return value.replace(/[^A-Za-z\s]/g, "");
  }

  return value;
}

function getNormalizedFieldKey(field: MasterFieldDefinition) {
  return field.key.toLowerCase();
}

function getNormalizedFieldLabel(field: MasterFieldDefinition) {
  return field.label.toLowerCase();
}

function isEmailField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field).includes("email");
}

function isPhoneField(field: MasterFieldDefinition) {
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field);

  return (
    key.includes("phone") ||
    key.includes("mobile") ||
    label.includes("phone") ||
    label.includes("mobile")
  );
}

function isPincodeField(field: MasterFieldDefinition) {
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field);

  return key.includes("pincode") || label.includes("pincode");
}

function isAgeField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field) === "age" || getNormalizedFieldLabel(field) === "age";
}

function isAadhaarField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field) === "aadhaarno";
}

function isPanField(field: MasterFieldDefinition) {
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field).replace(/\s+/g, "");
  return key === "panno" || label === "panno" || label === "pancard";
}

function isGstNoField(field: MasterFieldDefinition) {
  if (field.type === "select") {
    return false;
  }
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field).replace(/\s+/g, "");

  if (key.includes("percent") || label.includes("%") || label.includes("percent")) {
    return false;
  }

  return (
    key === "gstno" ||
    key === "gstin" ||
    label === "gstno" ||
    label === "gstin" ||
    label.includes("gstin")
  );
}

function isHsnCodeField(field: MasterFieldDefinition) {
  if (field.type === "select") {
    return false;
  }
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field).replace(/\s+/g, "");
  return (
    key === "hsncode" ||
    key === "hsn" ||
    label === "hsncode" ||
    label === "hsn"
  );
}

function isFscCodeField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field) === "fsccode";
}

function isGstOrHsnNumericField(field: MasterFieldDefinition) {
  const key = getNormalizedFieldKey(field);
  const label = getNormalizedFieldLabel(field).replace(/\s+/g, "");

  return (
    key === "gstpercentage" ||
    label === "gst%"
  );
}

function isStatusField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field) === "status";
}

function isLocationField(field: MasterFieldDefinition) {
  const key = getNormalizedFieldKey(field);

  return (
    key === "city" ||
    key === "state" ||
    key === "country" ||
    key === "areaofoperation"
  );
}

function isCountryField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field) === "country";
}

function isStateField(field: MasterFieldDefinition) {
  return getNormalizedFieldKey(field) === "state";
}

function getLocationValue(
  fields: readonly MasterFieldDefinition[],
  values: Record<string, MasterFieldValue>,
  key: "country" | "state",
) {
  const field = fields.find(
    (currentField) => getNormalizedFieldKey(currentField) === key,
  );
  const value = field ? values[field.key] : "";

  return typeof value === "string" ? value : "";
}

function clearDependentLocationFields(
  fields: readonly MasterFieldDefinition[],
  onChange: (key: string, value: MasterFieldValue) => void,
  keys: Array<"state" | "city">,
) {
  keys.forEach((key) => {
    const field = fields.find(
      (currentField) => getNormalizedFieldKey(currentField) === key,
    );

    if (field) {
      onChange(field.key, "");
    }
  });
}

function isPincodeOrLocationField(field: MasterFieldDefinition) {
  return isPincodeField(field) || isLocationField(field);
}

function getOrderedFormFields(fields: readonly MasterFieldDefinition[]) {
  const fieldsWithStatusLast = getFieldsWithStatusLast(fields);
  const locationFields = fieldsWithStatusLast.filter(isPincodeOrLocationField);

  if (!locationFields.some(isPincodeField)) {
    return fieldsWithStatusLast;
  }

  const orderedLocationFields = ["pincode", "country", "state", "city"]
    .map((key) =>
      locationFields.find((field) => getNormalizedFieldKey(field) === key),
    )
    .filter((field): field is MasterFieldDefinition => Boolean(field));

  let locationFieldsInserted = false;

  return fieldsWithStatusLast.reduce<MasterFieldDefinition[]>((orderedFields, field) => {
    if (!isPincodeOrLocationField(field)) {
      orderedFields.push(field);
      return orderedFields;
    }

    if (!locationFieldsInserted) {
      orderedFields.push(...orderedLocationFields);
      locationFieldsInserted = true;
    }

    return orderedFields;
  }, []);
}

function getFieldsWithStatusLast(fields: readonly MasterFieldDefinition[]) {
  const statusFields = fields.filter(isStatusField);

  if (statusFields.length === 0) {
    return fields;
  }

  return [
    ...fields.filter((field) => !isStatusField(field)),
    ...statusFields,
  ];
}

function applyPincodeLocation(
  fields: readonly MasterFieldDefinition[],
  location: { city: string; country: string; state: string },
  onChange: (key: string, value: MasterFieldValue) => void,
) {
  const countryField = fields.find(
    (field) => getNormalizedFieldKey(field) === "country",
  );
  const stateField = fields.find((field) => getNormalizedFieldKey(field) === "state");
  const cityField = fields.find((field) => getNormalizedFieldKey(field) === "city");

  if (countryField) {
    onChange(countryField.key, location.country);
  }

  if (stateField) {
    onChange(stateField.key, location.state);
  }

  if (cityField) {
    onChange(cityField.key, location.city);
  }
}

function getSelectOptions(
  field: MasterFieldDefinition,
  locationOptions: Record<string, string[]>,
) {
  const key = getNormalizedFieldKey(field);

  if (key === "country") {
    return locationOptions.country ?? [];
  }

  if (key === "state") {
    return locationOptions.state ?? [];
  }

  if (key === "city") {
    return locationOptions.city ?? [];
  }

  if (key === "areaofoperation") {
    return locationOptions.areaofoperation ?? [];
  }

  if (field.options && field.options.length > 0) {
    return field.options;
  }

  return [];
}

function getTextInputHtmlProps(field: MasterFieldDefinition) {
  if (isAadhaarField(field)) {
    return {
      inputMode: "numeric" as const,
      maxLength: 12,
      pattern: "[0-9]{12}",
    };
  }

  if (isPanField(field)) {
    return {
      maxLength: 10,
      pattern: "[A-Z]{5}[0-9]{4}[A-Z]",
    };
  }

  if (isGstNoField(field)) {
    return {
      maxLength: 15,
      pattern: "[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}",
    };
  }

  if (isHsnCodeField(field)) {
    return {
      inputMode: "numeric" as const,
      maxLength: 8,
      pattern: "[0-9]*",
    };
  }

  if (isFscCodeField(field)) {
    return {
      maxLength: 11,
      pattern: "FSC-[CNP][0-9]{6}",
    };
  }

  if (isGstOrHsnNumericField(field)) {
    return {
      inputMode: "numeric" as const,
      maxLength: 2,
      pattern: "[0-9]*",
    };
  }

  if (isPincodeField(field) || isAgeField(field)) {
    return {
      inputMode: "numeric" as const,
      pattern: "[0-9]*",
    };
  }

  if (isLettersOnlyField(field)) {
    return {
      pattern: "[A-Za-z\\s]*",
    };
  }

  return undefined;
}

function getTextFieldSlotProps(
  field: MasterFieldDefinition,
  readOnly: boolean,
) {
  const htmlInput = getTextInputHtmlProps(field) ?? {};

  return {
    input: {
      readOnly,
    },
    htmlInput: {
      autoComplete: "off",
      ...htmlInput,
    },
  };
}

function getToggleCheckedValue(
  field: MasterFieldDefinition,
  value: MasterFieldValue | null,
) {
  if (isStatusField(field)) {
    return normalizeMasterStatusValue(value) === "Active";
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return ["active", "enabled", "true"].includes(value.trim().toLowerCase());
  }

  return Boolean(value);
}

function getStatusFieldValue(checked: boolean) {
  return checked ? "Active" : "Inactive";
}

function isAcceptedUploadFile(file: File) {
  const normalizedName = file.name.toLowerCase();

  return (
    acceptedUploadMimeTypes.has(file.type) ||
    acceptedUploadExtensions.some((extension) =>
      normalizedName.endsWith(extension),
    )
  );
}

function getUploadPreviewMimeType(fileName: string, mimeType?: string, fileUrl?: string) {
  if (mimeType) {
    return mimeType;
  }

  const urlStr = fileUrl || "";
  if (urlStr.startsWith("data:image/")) {
    const match = urlStr.match(/^data:(image\/[a-zA-Z0-9.+-]+);/);
    return match ? match[1] : "image/jpeg";
  }
  if (urlStr.startsWith("data:application/pdf")) {
    return "application/pdf";
  }

  const normalizedTarget = ((fileUrl || fileName).split("?")[0] ?? "").toLowerCase();

  if (normalizedTarget.endsWith(".pdf")) {
    return "application/pdf";
  }

  if (normalizedTarget.endsWith(".png")) {
    return "image/png";
  }

  if (
    normalizedTarget.endsWith(".jpg") ||
    normalizedTarget.endsWith(".jpeg") ||
    normalizedTarget.endsWith(".webp") ||
    normalizedTarget.endsWith(".gif") ||
    normalizedTarget.endsWith(".svg")
  ) {
    return "image/jpeg";
  }

  // If filename also has image extension
  const normalizedFileName = (fileName.split("?")[0] ?? "").toLowerCase();
  if (
    normalizedFileName.endsWith(".png") ||
    normalizedFileName.endsWith(".jpg") ||
    normalizedFileName.endsWith(".jpeg") ||
    normalizedFileName.endsWith(".webp") ||
    normalizedFileName.endsWith(".gif") ||
    normalizedFileName.endsWith(".svg")
  ) {
    return "image/jpeg";
  }
  if (normalizedFileName.endsWith(".pdf")) {
    return "application/pdf";
  }

  return undefined;
}

function getPhoneCountryCodeKey(fieldKey: string) {
  return `${fieldKey}CountryCode`;
}

function getCountryName(country: CountryCode) {
  return countryNameFormatter.of(country) ?? country;
}

function getPhoneCountryCode(
  values: Record<string, MasterFieldValue>,
  fieldKey: string,
) {
  const value = values[getPhoneCountryCodeKey(fieldKey)];

  return typeof value === "string" && countryCodeOptions.some((option) => option.code === value)
    ? value
    : "+91";
}

function getPhoneDisplayValue(
  value: MasterFieldValue | null,
  countryCode: string,
) {
  if (typeof value !== "string") {
    return "";
  }

  const digits = value.replace(/\D/g, "");
  const countryDigits = countryCode.replace(/\D/g, "");

  if (digits.length > 10 && digits.startsWith(countryDigits)) {
    return digits.slice(countryDigits.length, countryDigits.length + 10);
  }

  return digits.slice(0, 10);
}

function getPhoneLocalDigits(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length > 10 && digits.startsWith("91")) {
    return digits.slice(2);
  }

  return digits;
}
