import type { ReactNode } from "react";
import { Box } from "@mui/material";

import {
  MasterFormFields,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../masters/shared";
import {
  formFieldColumnGap,
  formFieldRowGap,
  getFormFieldSlotSx,
  type FormFieldSize,
} from "./formFieldSizes";

type SizedMasterFormFieldsProps = {
  fieldActions?: Partial<Record<string, ReactNode>> | undefined;
  fields: readonly MasterFieldDefinition[];
  onChange: (key: string, value: MasterFieldValue) => void;
  presentation?: "form" | "details";
  readOnly?: boolean;
  showRequiredErrors?: boolean;
  sizes: Partial<Record<string, FormFieldSize>>;
  values: Record<string, MasterFieldValue>;
};

/**
 * Renders master fields in a compact flex row with fixed slot widths.
 * Prevents equal-column grids from shrinking single controls.
 */
export function SizedMasterFormFields({
  fieldActions,
  fields,
  onChange,
  presentation = "form",
  readOnly = false,
  showRequiredErrors = false,
  sizes,
  values,
}: SizedMasterFormFieldsProps) {
  return (
    <Box
      sx={(theme) => ({
        display: "flex",
        flexWrap: "wrap",
        gap: theme.spacing(formFieldRowGap),
        columnGap: theme.spacing(formFieldColumnGap),
        alignItems: "flex-start",
        width: "100%",
      })}
    >
      {fields.map((field) => {
        const size = sizes[field.key] ?? (field.span === "full" ? "full" : "md");

        return (
          <Box key={field.key} sx={getFormFieldSlotSx(size)}>
            <MasterFormFields
              compact
              definition={{
                fields: [field],
                gridColumns: 3,
              }}
              {...(fieldActions ? { fieldActions } : {})}
              onChange={onChange}
              presentation={presentation}
              readOnly={readOnly}
              showRequiredErrors={showRequiredErrors}
              values={values}
            />
          </Box>
        );
      })}
    </Box>
  );
}
