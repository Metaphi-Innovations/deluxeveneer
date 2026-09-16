import type { ReactNode } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  Typography,
} from "@mui/material";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";

export type IssueOrderValues = {
  orderItemNo: string;
  orderNo: string;
};

export function IssueOrderDialog({
  itemNoOptions,
  onChange,
  onClose,
  onSubmit,
  open,
  orderNoOptions,
  values,
}: {
  itemNoOptions: readonly string[];
  onChange: (values: IssueOrderValues) => void;
  onClose: () => void;
  onSubmit: () => void;
  open: boolean;
  orderNoOptions: readonly string[];
  values: IssueOrderValues;
}) {
  return (
    <Dialog
      fullWidth
      maxWidth="sm"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: (theme) => ({
          borderRadius: `${theme.customTokens.radius.lg}px`,
          border: `1px solid ${theme.customTokens.borders.default}`,
          boxShadow: theme.customTokens.elevation.lg,
        }),
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          fontSize: theme.typography.h3.fontSize,
          fontWeight: 700,
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        Issue Order
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          px: theme.spacing(2),
          py: `${theme.spacing(2)} !important`,
        })}
      >
        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(2),
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
          })}
        >
          <Stack spacing={0.75}>
            <IssueOrderFieldLabel>Order No</IssueOrderFieldLabel>
            <ErpSelectField
              onChange={(value) =>
                onChange({
                  orderItemNo: "",
                  orderNo: value,
                })
              }
              options={orderNoOptions}
              size="dense"
              state={orderNoOptions.length === 0 ? "disabled" : "default"}
              value={values.orderNo}
            />
          </Stack>

          <Stack spacing={0.75}>
            <IssueOrderFieldLabel>Order Item No</IssueOrderFieldLabel>
            <ErpSelectField
              onChange={(value) =>
                onChange({
                  ...values,
                  orderItemNo: value,
                })
              }
              options={itemNoOptions}
              size="dense"
              state={!values.orderNo ? "disabled" : "default"}
              value={values.orderItemNo}
            />
          </Stack>
        </Box>
      </DialogContent>

      <DialogActions
        sx={(theme) => ({
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          gap: theme.spacing(1),
          justifyContent: "flex-end",
          px: theme.spacing(2),
          py: theme.spacing(1.5),
        })}
      >
        <Button onClick={onClose} sx={recordFormActionButtonSx} variant="outlined">
          Cancel
        </Button>
        <Button
          disabled={!values.orderNo || !values.orderItemNo}
          onClick={onSubmit}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Submit
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function IssueOrderFieldLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      sx={(theme) => ({
        color: theme.customTokens.text.primary,
        fontSize: theme.typography.caption.fontSize,
        fontWeight: 700,
      })}
    >
      {children}
    </Typography>
  );
}
