import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { Save } from "lucide-react";
import { useNavigate } from "react-router";

import {
  MasterFormFields,
  MasterSectionCard,
  hasFormFieldErrors,
  type MasterFieldValue,
} from "../../masters/shared";
import { ContentLoader } from "../../../components/feedback/ContentLoader";
import { refreshSupplierMasterCache } from "../../masters/supplier-master/api/supplierMasterApi";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/formSectionStyles";
import {
  createWarehouseAAddStockHeaderFields,
  isInrCurrency,
} from "../../inventory/shared/warehouseAAddStockConfig";
import {
  InwardEditStockWorkspace,
  type InwardEditStockWorkspaceHandle,
} from "../components/InwardEditStockWorkspace";
import { InventoryPageShell } from "../../inventory/shared/InventoryPageShell";
import {
  fetchInwardById,
  updateInwardApi,
  type InwardDetail,
  type InwardItemDetail,
} from "../api/inwardApi";
import { buildCreateInwardPayload } from "../api/buildCreateInwardPayload";
import {
  slugFromInventoryTypeLabel,
  type ApiSupportedInwardSlug,
} from "../inward/supportedInwardTypes";

type ApiInwardEditMode = "edit";

interface ApiInwardEditFormProps {
  inwardId: string;
  mode?: ApiInwardEditMode;
  warehouseId: string;
  warehouseName: string;
  warehouseRootPath: string;
  listPath: string;
  editPath?: string;
}

function parseDateOnly(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatOptionalNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "";
  }
  return String(value);
}

function mapDetailToHeaderValues(
  detail: InwardDetail,
): Record<string, MasterFieldValue> {
  return {
    inwardDate: parseDateOnly(detail.inwardDate) ?? new Date(),
    supplierName: detail.supplierName ?? "",
    invoiceNo: detail.invoiceNo ?? "",
    currency: detail.currency || "INR",
    mode: detail.mode ?? "",
    eta: parseDateOnly(detail.eta),
    etd: parseDateOnly(detail.etd),
    attachment: detail.attachmentUrl ?? "",
    exchangeRate:
      detail.exchangeRate === null || detail.exchangeRate === undefined
        ? ""
        : String(detail.exchangeRate),
    inwardType: detail.inventoryType || "Veneer Blocks",
    remark: detail.remarks ?? detail.remark ?? "",
  };
}

function formatGstPercentageDisplay(
  value: number | string | null | undefined,
): string {
  if (value === null || value === undefined || value === "") {
    return "";
  }
  const raw = String(value).trim();
  if (!raw) return "";
  if (raw.includes("%")) return raw;
  return `${raw}%`;
}

function mapDetailItemToLineValues(
  item: InwardItemDetail,
  slug: ApiSupportedInwardSlug,
): Record<string, string> {
  const shared = {
    itemName: item.itemName ?? "",
    itemSubCategory: item.itemSubCategoryName ?? "",
    hsn: item.hsnCode ?? "",
    length: formatOptionalNumber(item.length),
    width: formatOptionalNumber(item.width),
    rate: formatOptionalNumber(item.rate),
    productAmount: String(item.amount ?? 0),
    gstPercentage: formatGstPercentageDisplay(item.gstPercentage),
    cgst: String(item.cgst ?? 0),
    sgst: String(item.sgst ?? 0),
    igst: String(item.igst ?? 0),
    totalAmount: String(item.totalAmount ?? 0),
    remark: item.remark ?? "",
  };

  if (slug === "raw-veneer") {
    return {
      ...shared,
      logCode: item.logCode ?? "",
      bundleNumber: item.bundleNumber ?? "",
      palletNo: item.palletNo ?? "",
      thickness: formatOptionalNumber(item.thickness),
      noOfLeaves: formatOptionalNumber(item.noOfLeaves),
      totalSqMeter: formatOptionalNumber(item.totalSqMeter),
    };
  }

  if (slug === "plywood" || slug === "mdf") {
    return {
      ...shared,
      logCode: item.batchNo ?? "",
      palletNo: item.palletNo ?? "",
      thickness: formatOptionalNumber(item.thickness),
      sheets: formatOptionalNumber(item.sheets),
      totalSqMeter: formatOptionalNumber(item.totalSqMeter),
      remarks: item.remark ?? "",
    };
  }

  return {
    ...shared,
    logCode: item.batchNo ?? "",
    thickness: formatOptionalNumber(item.height),
    cbm: formatOptionalNumber(item.cbm),
  };
}

export function ApiInwardEditForm({
  inwardId,
  warehouseId,
  warehouseName,
  warehouseRootPath,
  listPath,
}: ApiInwardEditFormProps) {
  const navigate = useNavigate();
  const workspaceRef = useRef<InwardEditStockWorkspaceHandle>(null);
  const [detail, setDetail] = useState<InwardDetail | null>(null);
  const [values, setValues] = useState<Record<string, MasterFieldValue>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [supplierOptionsRevision, setSupplierOptionsRevision] = useState(0);

  useEffect(() => {
    let ignore = false;

    const load = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        await refreshSupplierMasterCache().catch(() => undefined);
        if (!ignore) {
          setSupplierOptionsRevision((current) => current + 1);
        }

        const result = await fetchInwardById(inwardId);
        if (ignore) {
          return;
        }

        setDetail(result);
        setValues(mapDetailToHeaderValues(result));
      } catch (error) {
        if (!ignore) {
          setDetail(null);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Failed to load inward record.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    };

    void load();

    return () => {
      ignore = true;
    };
  }, [inwardId]);

  const inventorySlug = useMemo(
    () => slugFromInventoryTypeLabel(detail?.inventoryType),
    [detail?.inventoryType],
  );

  const fields = useMemo(
    () =>
      createWarehouseAAddStockHeaderFields(
        typeof values.currency === "string" ? values.currency : "INR",
      ),
    [values.currency, supplierOptionsRevision],
  );

  const initialLineItems = useMemo(
    () =>
      (detail?.items ?? []).map((item) => ({
        id: item.id,
        values: mapDetailItemToLineValues(item, inventorySlug),
      })),
    [detail, inventorySlug],
  );

  const initialOtherConsumables = useMemo(
    () =>
      (detail?.otherConsumables ?? []).map((row) => ({
        consumableName: row.consumableName,
        price: String(row.price ?? 0),
      })),
    [detail],
  );

  const initialAdditionalCharges = useMemo(
    () =>
      (detail?.additionalCharges ?? []).map((charge) => ({
        chargeName: charge.chargeName,
        amount: String(charge.amount ?? 0),
      })),
    [detail],
  );

  const closeForm = () => {
    navigate(listPath, { replace: true, flushSync: true });
  };

  const handleSave = async () => {
    if (!detail) {
      return;
    }

    setHasSubmitted(true);
    const workspaceIsValid = workspaceRef.current?.validate() ?? true;
    if (hasFormFieldErrors(fields, values) || !workspaceIsValid) {
      return;
    }

    setIsSaving(true);
    setErrorMessage("");

    try {
      const lineItems = workspaceRef.current?.getLineItems() ?? [];
      const otherConsumables =
        workspaceRef.current?.getOtherConsumables() ?? [];
      const additionalCharges =
        workspaceRef.current?.getAdditionalCharges() ?? [];

      const payload = await buildCreateInwardPayload({
        warehouseId,
        inventorySlug,
        header: {
          currency:
            typeof values.currency === "string" ? values.currency : "INR",
          attachment:
            typeof values.attachment === "string"
              ? values.attachment
              : values.attachment &&
                  typeof values.attachment === "object" &&
                  "name" in values.attachment
                ? String(values.attachment.name)
                : "",
          eta: values.eta instanceof Date ? values.eta : null,
          etd: values.etd instanceof Date ? values.etd : null,
          invoiceNo:
            typeof values.invoiceNo === "string" ? values.invoiceNo : "",
          inwardDate:
            values.inwardDate instanceof Date
              ? values.inwardDate
              : new Date(),
          mode: typeof values.mode === "string" ? values.mode : "",
          supplierName:
            typeof values.supplierName === "string"
              ? values.supplierName
              : "",
          exchangeRate:
            typeof values.exchangeRate === "string"
              ? values.exchangeRate
              : "",
          remarks:
            typeof values.remark === "string"
              ? values.remark
              : typeof values.remarks === "string"
                ? values.remarks
                : "",
        },
        lineItems,
        otherConsumables,
        additionalCharges,
      });

      await updateInwardApi(detail.id, {
        inwardDate: payload.inwardDate,
        supplierId: payload.supplierId,
        invoiceNo: payload.invoiceNo,
        currencyId: payload.currencyId,
        mode: payload.mode ?? null,
        eta: payload.eta ?? null,
        etd: payload.etd ?? null,
        attachmentUrl: payload.attachmentUrl ?? null,
        exchangeRate: payload.exchangeRate ?? null,
        remarks: payload.remarks ?? null,
        items: payload.items,
        ...(payload.otherConsumables
          ? { otherConsumables: payload.otherConsumables }
          : {}),
        ...(payload.additionalCharges
          ? { additionalCharges: payload.additionalCharges }
          : {}),
      });

      closeForm();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to save inward.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: warehouseName, to: warehouseRootPath },
          { label: "Edit Stock" },
        ]}
        title="Edit Stock"
      >
        <MasterSectionCard>
          <ContentLoader label="Loading inward record..." minHeight={220} />
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (!detail) {
    return (
      <InventoryPageShell
        breadcrumbs={[
          { label: "Warehouses" },
          { label: warehouseName, to: warehouseRootPath },
          { label: "Edit Stock" },
        ]}
        title="Edit Stock"
      >
        <MasterSectionCard>
          <Alert severity="error">
            {errorMessage || "The requested inward record could not be found."}
          </Alert>
          <Box sx={{ mt: 2 }}>
            <Button variant="outlined" onClick={closeForm}>
              Back
            </Button>
          </Box>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  return (
    <InventoryPageShell
      breadcrumbs={[
        { label: "Warehouses" },
        { label: warehouseName, to: warehouseRootPath },
        { label: "Edit Stock" },
      ]}
      subtitle="Record supplier invoice and inward stock details."
      title="Edit Stock"
    >
      <MasterSectionCard>
        <Box
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(1.5),
            width: "100%",
          })}
        >
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <Stack spacing={1.15}>
            <FormSectionHeader title="Inward Details" />
            <MasterFormFields
              key={`api-inward-header-${detail.id}-${supplierOptionsRevision}`}
              compact
              definition={{
                gridColumns: 5,
                fields,
              }}
              onChange={(key, value) => {
                setValues((current) => {
                  const next = { ...current, [key]: value };
                  if (key === "currency" && isInrCurrency(value)) {
                    next.exchangeRate = "";
                  }
                  return next;
                });
              }}
              presentation="form"
              showRequiredErrors={hasSubmitted}
              values={values}
            />
          </Stack>

          <InwardEditStockWorkspace
            key={`api-inward-workspace-${detail.id}`}
            invoiceDate={
              values.inwardDate instanceof Date ? values.inwardDate : null
            }
            initialAdditionalCharges={initialAdditionalCharges}
            initialOtherConsumables={initialOtherConsumables}
            initialLineItems={initialLineItems}
            onRemarkChange={(value) =>
              setValues((current) => ({ ...current, remark: value }))
            }
            ref={workspaceRef}
            remark={
              typeof values.remark === "string"
                ? values.remark
                : typeof values.remarks === "string"
                  ? values.remarks
                  : ""
            }
            slug={inventorySlug}
            supplierName={
              typeof values.supplierName === "string"
                ? values.supplierName
                : ""
            }
            supplierState={detail.supplierState ?? ""}
            warehouseState={detail.warehouseState ?? ""}
          />

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "flex-end",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
              pt: theme.spacing(0.5),
              borderTop: `1px solid ${theme.customTokens.borders.divider}`,
            })}
          >
            <Button
              type="button"
              variant="outlined"
              onClick={closeForm}
              sx={recordFormActionButtonSx}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="contained"
              disabled={isSaving}
              startIcon={<Save size={16} />}
              onClick={() => {
                void handleSave();
              }}
              sx={recordFormActionButtonSx}
            >
              {isSaving ? "Saving..." : "Save Inward"}
            </Button>
          </Box>
        </Box>
      </MasterSectionCard>
    </InventoryPageShell>
  );
}
