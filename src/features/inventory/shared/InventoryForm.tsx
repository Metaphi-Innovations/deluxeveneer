import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router";

import { env } from "../../../config/env";
import { buildInwardHeaderAutofillValues } from "../../warehouses/inward/inwardAddAutofill";
import {
  MasterFormFields,
  MasterSectionCard,
  hasFormFieldErrors,
  type MasterFieldDefinition,
  type MasterFieldValue,
} from "../../masters/shared";
import {
  canAccessPermission,
  getWarehousePermissionKey,
} from "../../permissions";
import { getDynamicWarehousePermissionKey } from "../../shared/warehousePermission";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/formSectionStyles";
import { InventoryPageShell } from "./InventoryPageShell";
import {
  isWarehouseAAddStockSlug,
  type WarehouseAAddStockSlug,
} from "./WarehouseAAddStockLineItems";
import {
  WarehouseAAddStockWorkspace,
  type WarehouseAAddStockWorkspaceHandle,
} from "./WarehouseAAddStockWorkspace";
import {
  buildWarehouseAAddStockInitialValues,
  createWarehouseAAddStockHeaderFields,
  isInrCurrency,
} from "./warehouseAAddStockConfig";
import { saveWarehouseAInwardItems } from "../../warehouses/shared/warehouseAInwardStore";
import { createInwardApi, getInwardInventoryTypeFromSlug } from "../../warehouses/api/inwardApi";
import { buildCreateInwardPayload } from "../../warehouses/api/buildCreateInwardPayload";
import { resolveInwardAttachmentUrl } from "../../warehouses/api/resolveInwardAttachment";
import { isApiSupportedInwardSlug } from "../../warehouses/inward/supportedInwardTypes";
import { ApiInwardEditForm } from "../../warehouses/pages/ApiInwardEditForm";
import { ApiInwardViewForm } from "../../warehouses/pages/ApiInwardViewForm";
import { ProductionInventoryRecordPage } from "../../warehouses/production/pages/ProductionInventoryRecordPage";
import { refreshSupplierMasterCache } from "../../masters/supplier-master/api/supplierMasterApi";
import { fetchWarehouseMasterDetail } from "../../masters/warehouse-location-master/api/warehouseMasterApi";
import {
  getInventoryPageTitle,
  getInventoryProcessTab,
  getInventoryPaths,
  getInventoryWarehouseContext,
  getWarehouseInventoryListPath,
  getWarehouseLabel,
  getWarehouseRootPath,
  type InventoryWarehouseContext,
} from "./inventoryUtils";
import {
  buildWarehouseARecordInitialValues,
  findInventoryContextRow,
  getInventoryBreadcrumbs,
  getInventoryContextRows,
  getInventoryViewFieldGroups,
  getWarehouseAInvoiceDetailFields,
  getWarehouseAInwardDetailFields,
  getWarehouseAItemDetailFields,
  InventoryItemDetailsTable,
  WarehouseAInvoiceDetails,
  WarehouseARecordDetailTabs,
} from "./inventoryFormSections";
import type { InventoryDefinition, InventoryPageMode, InventoryRecord } from "./types";

interface InventoryFormProps<Row extends InventoryRecord> {
  definition: InventoryDefinition<Row>;
  mode: Exclude<InventoryPageMode, "list">;
}

export function InventoryForm<Row extends InventoryRecord>({
  definition,
  mode,
}: InventoryFormProps<Row>) {
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeWarehouse = getInventoryWarehouseContext(
    searchParams.get("warehouse"),
  );
  const apiWarehouseId = searchParams.get("warehouseId")?.trim() || "";
  const apiWarehouseName = searchParams.get("warehouseName")?.trim() || "";
  const activeProcessTab = getInventoryProcessTab(searchParams.get("tab"));
  const paths = getInventoryPaths(
    definition.slug,
    activeProcessTab,
    activeWarehouse,
  );
  const returnToPath = searchParams.get("returnTo");
  const listPath = returnToPath?.startsWith("/") ? returnToPath : paths.list;
  const warehouseLabel = apiWarehouseName || getWarehouseLabel(activeWarehouse);
  const warehouseRootPath = apiWarehouseId
    ? `/warehouses/${apiWarehouseId}`
    : getWarehouseRootPath(activeWarehouse);

  // Inward warehouses pass warehouseId — never resolve from local mock rows.
  if (
    apiWarehouseId &&
    (mode === "view" || mode === "edit") &&
    isApiSupportedInwardSlug(definition.slug) &&
    params.id
  ) {
    const warehousePermissionKey = getDynamicWarehousePermissionKey(apiWarehouseId);
    const canOpen =
      (mode === "view" && canAccessPermission(warehousePermissionKey, "view")) ||
      (mode === "edit" && canAccessPermission(warehousePermissionKey, "edit"));

    if (!canOpen) {
      return (
        <InventoryPageShell
          breadcrumbs={[
            { label: "Warehouses" },
            { label: warehouseLabel, to: warehouseRootPath },
            { label: mode === "edit" ? "Edit" : "View" },
          ]}
          title={mode === "edit" ? "Edit Stock" : "View Stock"}
        >
          <Alert severity="warning">
            You do not have permission to {mode} this inward record.
          </Alert>
        </InventoryPageShell>
      );
    }

    const editUrl = new URL(
      paths.edit(params.id),
      window.location.origin,
    );
    editUrl.searchParams.set("warehouse", "warehouse-a");
    editUrl.searchParams.set("warehouseId", apiWarehouseId);
    editUrl.searchParams.set("warehouseName", warehouseLabel);
    editUrl.searchParams.set("returnTo", listPath);
    const editPath = `${editUrl.pathname}?${editUrl.searchParams.toString()}`;

    if (mode === "view") {
      return (
        <ApiInwardViewForm
          editPath={editPath}
          inwardId={params.id}
          listPath={listPath}
          warehouseId={apiWarehouseId}
          warehouseName={warehouseLabel}
          warehouseRootPath={warehouseRootPath}
        />
      );
    }

    return (
      <ApiInwardEditForm
        inwardId={params.id}
        listPath={listPath}
        warehouseId={apiWarehouseId}
        warehouseName={warehouseLabel}
        warehouseRootPath={warehouseRootPath}
      />
    );
  }

  return (
    <InventoryFormContent
      definition={definition}
      mode={mode}
    />
  );
}

function InventoryFormContent<Row extends InventoryRecord>({
  definition,
  mode,
}: InventoryFormProps<Row>) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const activeWarehouse = getInventoryWarehouseContext(
    searchParams.get("warehouse"),
  );
  const apiWarehouseId = searchParams.get("warehouseId")?.trim() || "";
  const apiWarehouseName = searchParams.get("warehouseName")?.trim() || "";
  const isApiInward = Boolean(apiWarehouseId);
  const isApiInwardAdd = isApiInward && mode === "add";
  const permissionKey = apiWarehouseId
    ? getDynamicWarehousePermissionKey(apiWarehouseId)
    : getWarehousePermissionKey(activeWarehouse);
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const canUseMode =
    (mode === "add" && canCreate) ||
    (mode === "edit" && canEdit) ||
    (mode === "view" && canView);
  const activeProcessTab = getInventoryProcessTab(searchParams.get("tab"));
  const paths = getInventoryPaths(
    definition.slug,
    activeProcessTab,
    activeWarehouse,
  );
  const returnToPath = searchParams.get("returnTo");
  const listPath = returnToPath?.startsWith("/") ? returnToPath : paths.list;
  const warehouseLabel = apiWarehouseName || getWarehouseLabel(activeWarehouse);
  const warehouseRootPath = apiWarehouseId
    ? `/warehouses/${apiWarehouseId}`
    : getWarehouseRootPath(activeWarehouse);
  const inventoryListPath = getWarehouseInventoryListPath(
    activeWarehouse,
    definition.slug,
    activeProcessTab,
  );
  const inventoryRows = isApiInward
    ? []
    : getInventoryContextRows(definition, activeWarehouse);

  const row =
    mode === "add" || isApiInward
      ? undefined
      : findInventoryContextRow(inventoryRows, params.id);
  const warehouseAAddStockSlug =
    mode === "add" &&
    activeWarehouse === "warehouse-a" &&
    isWarehouseAAddStockSlug(definition.slug)
      ? definition.slug
      : null;
  const warehouseRecordDetailSlug =
    (activeWarehouse === "warehouse-a" ||
      activeWarehouse === "warehouse-b" ||
      activeWarehouse === "warehouse-c") &&
    isWarehouseAAddStockSlug(definition.slug)
      ? definition.slug
      : null;
  const closeInventoryForm = () => {
    navigate(listPath, { replace: true, flushSync: true });
  };

  const baseFields =
    mode === "add"
      ? definition.formFields
      : mode === "edit"
        ? definition.editFields ?? definition.viewFields
        : definition.viewFields;
  const [values, setValues] = useState<Record<string, MasterFieldValue>>(() =>
    warehouseAAddStockSlug
      ? buildWarehouseAAddStockInitialValues(warehouseAAddStockSlug)
      : buildWarehouseARecordInitialValues(
          baseFields,
          row,
          warehouseRecordDetailSlug,
        ),
  );
  const fields = warehouseAAddStockSlug
    ? createWarehouseAAddStockHeaderFields(
        typeof values.currency === "string" ? values.currency : "INR",
      )
    : baseFields;
  const shouldSplitInventoryDetails = mode === "view" || mode === "edit";
  const viewFieldGroups = shouldSplitInventoryDetails
    ? getInventoryViewFieldGroups(
        mode === "view" || mode === "edit" ? baseFields : fields,
      )
    : null;
  const warehouseAInvoiceFields =
    shouldSplitInventoryDetails && warehouseRecordDetailSlug
      ? getWarehouseAInvoiceDetailFields(baseFields, row)
      : [];
  const warehouseAInwardFields =
    shouldSplitInventoryDetails &&
    warehouseRecordDetailSlug &&
    viewFieldGroups
      ? getWarehouseAInwardDetailFields(viewFieldGroups.commonFields, row)
      : [];
  const warehouseAItemFields =
    shouldSplitInventoryDetails &&
    warehouseRecordDetailSlug &&
    viewFieldGroups
      ? getWarehouseAItemDetailFields(
          warehouseRecordDetailSlug,
          viewFieldGroups.itemFields,
        )
      : [];

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [supplierOptionsRevision, setSupplierOptionsRevision] = useState(0);
  const [warehouseState, setWarehouseState] = useState("");
  const [autofillItemCount, setAutofillItemCount] = useState("1");
  const warehouseAWorkspaceRef = useRef<WarehouseAAddStockWorkspaceHandle>(null);
  const showInwardAutofill =
    env.VITE_INWARD_AUTOFILL && Boolean(warehouseAAddStockSlug) && mode === "add";

  useEffect(() => {
    if (warehouseAAddStockSlug) {
      setValues(buildWarehouseAAddStockInitialValues(warehouseAAddStockSlug));
      return;
    }

    setValues(
      buildWarehouseARecordInitialValues(
        baseFields,
        row,
        warehouseRecordDetailSlug,
      ),
    );
  }, [baseFields, row, warehouseAAddStockSlug, warehouseRecordDetailSlug]);

  useEffect(() => {
    if (!isApiInwardAdd) {
      return;
    }

    void refreshSupplierMasterCache()
      .then(() => {
        setSupplierOptionsRevision((current) => current + 1);
      })
      .catch(() => undefined);
  }, [isApiInwardAdd]);

  useEffect(() => {
    if (!apiWarehouseId) {
      setWarehouseState("");
      return;
    }

    let ignore = false;

    void fetchWarehouseMasterDetail(apiWarehouseId)
      .then((warehouse) => {
        if (!ignore) {
          setWarehouseState(String(warehouse.state ?? ""));
        }
      })
      .catch(() => {
        if (!ignore) {
          setWarehouseState("");
        }
      });

    return () => {
      ignore = true;
    };
  }, [apiWarehouseId]);

  if ((mode === "edit" || mode === "view") && !row) {
    // Production warehouse stock must never use inward or mock lookup.
    if (
      activeWarehouse === "warehouse-c" &&
      params.id &&
      (definition.slug === "raw-veneer" ||
        definition.slug === "plywood" ||
        definition.slug === "mdf")
    ) {
      const productionListPath = returnToPath?.startsWith("/")
        ? returnToPath
        : apiWarehouseId
          ? `/warehouses/${apiWarehouseId}?inventory=${definition.slug}`
          : `/warehouse-c?section=inventory&inventory=${definition.slug}`;
      const productionEditUrl = new URL(
        paths.edit(params.id),
        window.location.origin,
      );
      productionEditUrl.searchParams.set("warehouse", "warehouse-c");
      if (apiWarehouseId) {
        productionEditUrl.searchParams.set("warehouseId", apiWarehouseId);
      }
      productionEditUrl.searchParams.set("warehouseName", warehouseLabel);
      productionEditUrl.searchParams.set("returnTo", productionListPath);
      productionEditUrl.searchParams.set("source", "production");
      const productionEditPath = `${productionEditUrl.pathname}?${productionEditUrl.searchParams.toString()}`;

      return (
        <ProductionInventoryRecordPage
          inventoryId={params.id}
          inventorySlug={definition.slug}
          listPath={productionListPath}
          mode={mode}
          warehouseId={apiWarehouseId}
          warehouseName={warehouseLabel}
          warehouseRootPath={warehouseRootPath}
          {...(mode === "view" ? { editPath: productionEditPath } : {})}
        />
      );
    }

    // API inward view/edit must never fall through to mock lookup.
    if (
      isApiInward &&
      apiWarehouseId &&
      isApiSupportedInwardSlug(definition.slug) &&
      params.id
    ) {
      const editUrl = new URL(
        paths.edit(params.id),
        window.location.origin,
      );
      editUrl.searchParams.set("warehouse", "warehouse-a");
      editUrl.searchParams.set("warehouseId", apiWarehouseId);
      editUrl.searchParams.set("warehouseName", warehouseLabel);
      editUrl.searchParams.set("returnTo", listPath);
      const editPath = `${editUrl.pathname}?${editUrl.searchParams.toString()}`;

      if (mode === "view") {
        return (
          <ApiInwardViewForm
            editPath={editPath}
            inwardId={params.id}
            listPath={listPath}
            warehouseId={apiWarehouseId}
            warehouseName={warehouseLabel}
            warehouseRootPath={warehouseRootPath}
          />
        );
      }

      return (
        <ApiInwardEditForm
          inwardId={params.id}
          listPath={listPath}
          warehouseId={apiWarehouseId}
          warehouseName={warehouseLabel}
          warehouseRootPath={warehouseRootPath}
        />
      );
    }

    return (
      <InventoryPageShell
        breadcrumbs={getInventoryBreadcrumbs({
          currentLabel: "Not Found",
          definitionTitle: definition.title,
          inventoryListPath,
          warehouseLabel,
          warehouseRootPath,
        })}
        title={definition.title}
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested inventory record could not be found.
          </Typography>
        </MasterSectionCard>
      </InventoryPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <InventoryPageShell
        breadcrumbs={getInventoryBreadcrumbs({
          currentLabel: mode === "add" ? "Add Stock" : mode === "edit" ? "Edit" : "View",
          definitionTitle: definition.title,
          inventoryListPath,
          warehouseLabel,
          warehouseRootPath,
        })}
        title={getInventoryPageTitle(definition, mode)}
      >
        <Alert severity="warning">
          You do not have permission to {mode} this inventory record.
        </Alert>
      </InventoryPageShell>
    );
  }

  const primaryLabel = warehouseAAddStockSlug ? "Save Inward" : "Save";
  const pageTitle = warehouseAAddStockSlug
    ? "Add Stock"
    : getInventoryPageTitle(definition, mode);
  const pageSubtitle = warehouseAAddStockSlug
    ? " "
    : undefined;
  const warehouseInventoryBreadcrumbs = warehouseAAddStockSlug
    ? [
        { label: "Warehouses" },
        { label: warehouseLabel, to: warehouseRootPath },
        { label: "Add Stock" },
      ]
    : getInventoryBreadcrumbs({
        currentLabel:
          mode === "add" ? "Add Stock" : mode === "edit" ? "Edit" : "View",
        definitionTitle: definition.title,
        inventoryListPath,
        warehouseLabel,
        warehouseRootPath,
      });

  const handleHeaderFieldChange = (key: string, value: MasterFieldValue) => {
    setValues((current) => {
      const nextValues = {
        ...current,
        [key]: value,
      };

      if (key === "currency" && isInrCurrency(value)) {
        nextValues.exchangeRate = "";
      }

      return nextValues;
    });
  };

  return (
    <InventoryPageShell
      breadcrumbs={warehouseInventoryBreadcrumbs}
      subtitle={pageSubtitle}
      title={pageTitle}
    >
      <MasterSectionCard>
        <Box
          sx={(theme) => ({
            display: "flex",
            flexDirection: "column",
            gap: theme.spacing(warehouseAAddStockSlug ? 1.5 : 1.75),
            width: "100%",
          })}
        >
          {shouldSplitInventoryDetails && viewFieldGroups ? (
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              {warehouseRecordDetailSlug ? (
                <Stack spacing={1.15}>
                  <FormSectionHeader title="Inward Details" />
                  <MasterFormFields
                    key={`${definition.slug}-${mode}-${row?.id ?? "new"}-${activeWarehouse}-inward`}
                    compact
                    definition={{
                      gridColumns: 5,
                      fields: warehouseAInwardFields,
                    }}
                    onChange={(key, value) =>
                      setValues((current) => ({
                        ...current,
                        [key]: value,
                      }))
                    }
                    presentation="form"
                    readOnly={mode === "view"}
                    values={values}
                  />
                </Stack>
              ) : (
                <MasterFormFields
                  key={`${definition.slug}-${mode}-${row?.id ?? "new"}-common`}
                  compact
                  definition={{
                    gridColumns: 4,
                    fields: viewFieldGroups.commonFields,
                  }}
                  onChange={(key, value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  presentation={mode === "view" ? "details" : "form"}
                  readOnly={mode === "view"}
                  values={values}
                />
              )}

              {warehouseRecordDetailSlug &&
              warehouseAInvoiceFields.length > 0 ? (
                <WarehouseARecordDetailTabs
                  invoiceDetails={
                    <WarehouseAInvoiceDetails
                      fields={warehouseAInvoiceFields}
                      onChange={(key, value) =>
                        setValues((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                      readOnly={mode === "view"}
                      showTitle={false}
                      values={values}
                    />
                  }
                  itemDetails={
                    <InventoryItemDetailsTable
                      fields={warehouseAItemFields}
                      onChange={(key, value) =>
                        setValues((current) => ({
                          ...current,
                          [key]: value,
                        }))
                      }
                      readOnly={mode === "view"}
                      values={values}
                    />
                  }
                />
              ) : (
                <InventoryItemDetailsTable
                  fields={viewFieldGroups.itemFields}
                  onChange={(key, value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  readOnly={mode === "view"}
                  values={values}
                />
              )}
            </Stack>
          ) : (
            <>
              {warehouseAAddStockSlug ? (
                <Stack spacing={1.15}>
                  <FormSectionHeader title="Inward Details" />
                  <MasterFormFields
                    key={`${definition.slug}-${mode}-${warehouseAAddStockSlug}-${supplierOptionsRevision}`}
                    compact
                    definition={{
                      gridColumns: 5,
                      fields,
                    }}
                    onChange={handleHeaderFieldChange}
                    showRequiredErrors={hasSubmitted}
                    values={values}
                  />
                </Stack>
              ) : (
                <MasterFormFields
                  key={`${definition.slug}-${mode}-${row?.id ?? "new"}`}
                  compact
                  definition={{
                    gridColumns: 4,
                    fields,
                  }}
                  onChange={(key, value) =>
                    setValues((current) => ({
                      ...current,
                      [key]: value,
                    }))
                  }
                  presentation={mode === "view" ? "details" : "form"}
                  readOnly={mode === "view"}
                  showRequiredErrors={mode !== "view" && hasSubmitted}
                  values={values}
                />
              )}
            </>
          )}

          {warehouseAAddStockSlug ? (
            <WarehouseAAddStockWorkspace
              invoiceDate={
                values.inwardDate instanceof Date ? values.inwardDate : null
              }
              onRemarkChange={(value) =>
                setValues((current) => ({ ...current, remark: value }))
              }
              ref={warehouseAWorkspaceRef}
              remark={
                typeof values.remark === "string"
                  ? values.remark
                  : typeof values.remarks === "string"
                    ? values.remarks
                    : ""
              }
              slug={warehouseAAddStockSlug}
              supplierName={
                typeof values.supplierName === "string"
                  ? values.supplierName
                  : ""
              }
              warehouseState={warehouseState}
            />
          ) : null}

          {saveError ? <Alert severity="error">{saveError}</Alert> : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: warehouseAAddStockSlug ? "flex-end" : "center",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
              pt: theme.spacing(0.5),
              borderTop: warehouseAAddStockSlug
                ? `1px solid ${theme.customTokens.borders.divider}`
                : undefined,
            })}
          >
            {mode === "view" ? (
              <>
                <Button
                  variant="outlined"
                  startIcon={<ChevronLeft size={16} />}
                  onClick={closeInventoryForm}
                  sx={recordViewActionButtonSx}
                >
                  Back
                </Button>

                {row && canEdit ? (
                  <Button
                    variant="contained"
                    startIcon={<Pencil size={16} />}
                    onClick={() => navigate(paths.edit(row.id))}
                    sx={recordViewActionButtonSx}
                  >
                    Edit
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                {showInwardAutofill ? (
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mr: "auto" }}
                  >
                    <TextField
                      type="number"
                      size="small"
                      label="Items"
                      value={autofillItemCount}
                      disabled={isSaving}
                      onChange={(event) => {
                        setAutofillItemCount(event.target.value);
                      }}
                      inputProps={{ min: 1, max: 50, step: 1 }}
                      sx={{ width: 88 }}
                    />
                    <Button
                      type="button"
                      variant="outlined"
                      disabled={isSaving}
                      sx={recordFormActionButtonSx}
                      onClick={() => {
                        void (async () => {
                          setSaveError("");
                          try {
                            await refreshSupplierMasterCache();
                            setSupplierOptionsRevision((current) => current + 1);
                          } catch {
                            // Still attempt autofill from whatever options are cached.
                          }

                          const count = Math.min(
                            50,
                            Math.max(
                              1,
                              Math.floor(Number(autofillItemCount) || 1),
                            ),
                          );
                          setAutofillItemCount(String(count));

                          setValues((current) =>
                            buildInwardHeaderAutofillValues(current),
                          );
                          warehouseAWorkspaceRef.current?.applyTestAutofill(
                            count,
                          );
                        })();
                      }}
                    >
                      Autofill test data
                    </Button>
                  </Stack>
                ) : null}

                <Button
                  type="button"
                  variant="outlined"
                  onClick={closeInventoryForm}
                  sx={recordFormActionButtonSx}
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  variant="contained"
                  startIcon={<Save size={16} />}
                  disabled={isSaving}
                  sx={recordFormActionButtonSx}
                  onClick={() => {
                    void (async () => {
                      setHasSubmitted(true);
                      setSaveError("");

                      const workspaceIsValid = warehouseAAddStockSlug
                        ? warehouseAWorkspaceRef.current?.validate() ?? true
                        : true;

                      const hasBaseFieldErrors = hasFormFieldErrors(
                        fields,
                        values,
                      );

                      if (hasBaseFieldErrors || !workspaceIsValid) {
                        return;
                      }

                      if (warehouseAAddStockSlug) {
                        const lineItems =
                          warehouseAWorkspaceRef.current?.getLineItems() ?? [];
                        const additionalCharges =
                          warehouseAWorkspaceRef.current?.getAdditionalCharges() ??
                          [];

                        const attachmentUrl = await resolveInwardAttachmentUrl(
                          values.attachment,
                        );

                        const header = {
                          currency:
                            typeof values.currency === "string"
                              ? values.currency
                              : "INR",
                          attachment: attachmentUrl,
                          eta:
                            values.eta instanceof Date ? values.eta : null,
                          etd:
                            values.etd instanceof Date ? values.etd : null,
                          invoiceNo:
                            typeof values.invoiceNo === "string"
                              ? values.invoiceNo
                              : "",
                          inwardDate:
                            values.inwardDate instanceof Date
                              ? values.inwardDate
                              : new Date(),
                          inwardType:
                            typeof values.inwardType === "string"
                              ? values.inwardType
                              : "",
                          mode:
                            typeof values.mode === "string" ? values.mode : "",
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
                        };

                        if (apiWarehouseId) {
                          if (!isApiSupportedInwardSlug(warehouseAAddStockSlug)) {
                            setSaveError(
                              "Only Veneer Blocks, Raw Veneer, Plywood, MDF, and Consumables inward are supported currently.",
                            );
                            return;
                          }

                          setIsSaving(true);
                          try {
                            const payload = await buildCreateInwardPayload({
                              warehouseId: apiWarehouseId,
                              inventorySlug: warehouseAAddStockSlug,
                              header,
                              lineItems,
                              additionalCharges,
                            });
                            await createInwardApi(payload);
                            closeInventoryForm();
                          } catch (error) {
                            setSaveError(
                              error instanceof Error
                                ? error.message
                                : "Failed to save inward.",
                            );
                          } finally {
                            setIsSaving(false);
                          }
                          return;
                        }

                        // Legacy local-only path (no warehouseId query).
                        if (warehouseAAddStockSlug !== "consumables") {
                          saveWarehouseAInwardItems({
                            header,
                            lineItems,
                            slug: warehouseAAddStockSlug,
                          });
                        }
                      }

                      closeInventoryForm();
                    })();
                  }}
                >
                  {isSaving ? "Saving..." : primaryLabel}
                </Button>
              </>
            )}
          </Box>
        </Box>
      </MasterSectionCard>
    </InventoryPageShell>
  );
}
