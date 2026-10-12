import { useEffect, useMemo, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router";

import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import { formSectionCardSx, FormSectionHeader } from "../../shared/formSectionStyles";
import { getOrderLineItems, useOrderRecords } from "../../orders/shared/ordersStore";
import { FactoryPageShell } from "../shared/FactoryPageShell";
import {
  completeFactoryIssuedWork,
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkForListing,
  issueFactoryWork,
  useFactoryIssuedWorkItems,
} from "../shared/factoryIssuedWorkStore";
import { pressingDefinition } from "../shared/factoryDefinitions";
import { getFactoryPaths, getFactoryRowsForTab } from "../shared/factoryUtils";
import { normalizeFactorySourceColumns } from "../shared/listing/factoryListingParts";
import {
  storePressingSampleInProduction,
  useSampleSheetRecords,
} from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";
import { PressingIssuedSelection } from "./PressingIssuedSelection";
import {
  pressingBaseStockColumns,
  pressingOrderIssuedColumns,
  pressingSampleIssuedColumns,
} from "./pressingCreateIssuedColumns";
import { buildPressingDummyIssuedRows } from "./pressingDummyIssuedRows";
import { pressingRowIssuedForOrder } from "./pressingOrderMatch";
import { PressingPurposeChoice, type PressingPurpose } from "./PressingPurposeChoice";
import { PressingProcessFields, type PressingProcessValues } from "./PressingProcessFields";
import { PressingRejectDetails, type PressingRejectValues } from "./PressingRejectDetails";
import { PressingSelectedBase, PressingSelectedVeneer } from "./PressingSelectedTables";
import {
  calculatePressingUsedArea,
  firstPressingText,
  getPressingQtyError,
  isPressingOrderActive,
  isPressingSourceEligible,
  mapPressingIssuedListingRow,
  pressingText,
  sanitizePressingInteger,
  sumPressingDraftQuantity,
  type PressingUsageDraft,
} from "./pressingQuantity";
import { usePressingBaseStock, type PressingBaseMaterialType } from "./usePressingBaseStock";

function todayInputValue() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

function rowsFromIds(rows: readonly FactoryRecord[], ids: readonly string[]) {
  return ids.flatMap((id) => {
    const row = rows.find((entry) => String(entry.id) === id);
    return row ? [row] : [];
  });
}

export function CreatePressingPage() {
  const navigate = useNavigate();
  const paths = getFactoryPaths("pressing");
  const orderRecords = useOrderRecords();
  const sampleSheetRecords = useSampleSheetRecords();
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [purpose, setPurpose] = useState<PressingPurpose>("");
  const [orderNo, setOrderNo] = useState("");
  const [orderItemNo, setOrderItemNo] = useState("");
  const [sampleNo, setSampleNo] = useState("");
  const [selectedVeneerIds, setSelectedVeneerIds] = useState<string[]>([]);
  const [veneerDrafts, setVeneerDrafts] = useState<Record<string, PressingUsageDraft>>({});
  const [baseType, setBaseType] = useState<PressingBaseMaterialType>("");
  const [selectedBaseIds, setSelectedBaseIds] = useState<string[]>([]);
  const [baseDrafts, setBaseDrafts] = useState<Record<string, PressingUsageDraft>>({});
  const [processValues, setProcessValues] = useState<PressingProcessValues>({
    cutColor: "",
    grade: "",
    itemSubCategory: "",
    length: "",
    noOfSheets: "",
    outputItemName: "",
    pressingDate: todayInputValue(),
    remark: "",
    thickness: "",
    width: "",
  });
  const [rejectValues, setRejectValues] = useState<PressingRejectValues>({
    itemName: "",
    length: "",
    quantity: "",
    remark: "",
    thickness: "",
    type: "",
    width: "",
  });
  const baseStock = usePressingBaseStock(baseType);

  const selectedOrder = orderRecords.find((order) => order.orderNo === orderNo);
  const orderActive = selectedOrder ? isPressingOrderActive(selectedOrder.status) : false;
  const allocationError =
    purpose === "Order" && selectedOrder && !orderActive
      ? "This order is cancelled or its allocation is no longer active. Issued pressing records were refreshed."
      : "";

  const orderItemOptions = useMemo(() => {
    if (!selectedOrder) {
      return [] as string[];
    }

    return getOrderLineItems(selectedOrder.id).map((_, index) => String(index + 1));
  }, [selectedOrder]);

  const issuedRows = useMemo(() => {
    const issuedWorkRows = getFactoryIssuedWorkForListing("pressing", "issued").map((item) =>
      normalizeFactorySourceColumns(factoryIssuedWorkToRow(item), "pressing"),
    );
    const localIssuedRows = getFactoryRowsForTab(pressingDefinition.rows, "issued").map((row) =>
      normalizeFactorySourceColumns(row, "pressing"),
    );
    const dummyIssuedRows = buildPressingDummyIssuedRows(orderRecords).map((row) =>
      normalizeFactorySourceColumns(row, "pressing"),
    );
    const seen = new Set<string>();
    const rows = [...issuedWorkRows, ...localIssuedRows, ...dummyIssuedRows].filter((row) => {
      const id = String(row.id);
      if (seen.has(id) || !isPressingSourceEligible(row)) {
        return false;
      }
      seen.add(id);
      return true;
    });

    if (purpose === "Order") {
      if (!orderNo || !orderItemNo || !orderActive || !selectedOrder) {
        return [] as FactoryRecord[];
      }

      return rows
        .filter((row) => pressingRowIssuedForOrder(row, orderNo, orderItemNo))
        .map(mapPressingIssuedListingRow);
    }

    if (purpose === "Sample Sheet") {
      const target = sampleNo.trim().toLowerCase();
      if (!target) {
        return [] as FactoryRecord[];
      }

      return rows
        .filter((row) => {
          const rowSample = String(row.sampleNo ?? row.orderNo ?? "")
            .trim()
            .toLowerCase();
          return rowSample === target;
        })
        .map(mapPressingIssuedListingRow);
    }

    return [] as FactoryRecord[];
  }, [
    factoryIssuedWorkItems,
    orderActive,
    orderRecords,
    orderItemNo,
    orderNo,
    purpose,
    sampleNo,
    selectedOrder,
  ]);

  const selectedVeneerRows = rowsFromIds(issuedRows, selectedVeneerIds);
  const selectedBaseRows = rowsFromIds(baseStock.rows, selectedBaseIds);
  const detailSource = selectedVeneerRows[0] ?? issuedRows[0];
  const detailSourceId = detailSource ? String(detailSource.id) : "";
  useEffect(() => {
    const row = selectedVeneerRows[0] ?? issuedRows[0];
    if (!row) {
      setProcessValues((current) => ({
        ...current,
        cutColor: "",
        grade: "",
        itemSubCategory: "",
        length: "",
        noOfSheets: "",
        outputItemName: "",
        thickness: "",
        width: "",
      }));
      return;
    }

    setProcessValues((current) => ({
      ...current,
      cutColor: firstPressingText(row, ["cutColor", "color"]),
      grade: pressingText(row.grade),
      itemSubCategory: firstPressingText(row, ["itemSubCategory", "subCategory"]),
      length: pressingText(row.length),
      noOfSheets: sanitizePressingInteger(
        firstPressingText(row, ["availableQty", "availableSheets", "noOfSheets"]),
      ),
      outputItemName: pressingText(row.itemName),
      thickness: pressingText(row.thickness),
      width: pressingText(row.width),
    }));
  }, [detailSourceId]);
  const outputSheets = Number(processValues.noOfSheets);
  const veneerUseTotal = sumPressingDraftQuantity(selectedVeneerIds, veneerDrafts);
  const baseUseTotal = sumPressingDraftQuantity(selectedBaseIds, baseDrafts);
  const veneerQtyInvalid = selectedVeneerRows.some((row) =>
    Boolean(
      getPressingQtyError(
        veneerDrafts[String(row.id)]?.qtyToUse ?? "",
        row.availableQty,
        true,
        "Qty to use",
      ),
    ),
  );
  const baseQtyInvalid = selectedBaseRows.some((row) =>
    Boolean(
      getPressingQtyError(
        baseDrafts[String(row.id)]?.qtyToUse ?? "",
        row.availableSheets,
        true,
        "Sheets to use",
      ),
    ),
  );
  const outputExceedsVeneer =
    outputSheets > 0 && veneerUseTotal > 0 && outputSheets > veneerUseTotal;
  const outputExceedsBase =
    outputSheets > 0 && baseUseTotal > 0 && outputSheets > baseUseTotal;
  const outputError = outputExceedsVeneer
    ? "No of sheets cannot exceed the veneer quantity selected for use."
    : outputExceedsBase
      ? "No of sheets cannot exceed the selected base material sheets."
      : "";
  const rejectQuantityInvalid = Boolean(rejectValues.quantity.trim()) && Number(rejectValues.quantity) <= 0;
  const canCreate =
    (purpose === "Order"
      ? Boolean(orderNo && orderItemNo && orderActive)
      : purpose === "Sample Sheet" && Boolean(sampleNo)) &&
    selectedVeneerRows.length > 0 &&
    !veneerQtyInvalid &&
    (baseType === "Plywood" || baseType === "MDF") &&
    selectedBaseRows.length > 0 &&
    !baseQtyInvalid &&
    Boolean(processValues.pressingDate && processValues.outputItemName.trim()) &&
    outputSheets > 0 &&
    !outputExceedsVeneer &&
    !outputExceedsBase &&
    !rejectQuantityInvalid;

  useEffect(() => {
    setSelectedVeneerIds((current) => {
      const next = current.filter((id) => issuedRows.some((row) => String(row.id) === id));
      return next.length === current.length ? current : next;
    });
  }, [issuedRows]);

  useEffect(() => {
    setSelectedBaseIds((current) => {
      const next = current.filter((id) => baseStock.rows.some((row) => String(row.id) === id));
      return next.length === current.length ? current : next;
    });
  }, [baseStock.rows]);

  const handleCreate = () => {
    setHasSubmitted(true);
    if (!canCreate) {
      return;
    }

    const outputArea = calculatePressingUsedArea(
      processValues.length,
      processValues.width,
      processValues.noOfSheets,
    );
    const resultBase = {
      baseMaterialType: baseType,
      cutColor: processValues.cutColor,
      grade: processValues.grade,
      itemName: processValues.outputItemName,
      itemSubCategory: processValues.itemSubCategory,
      length: processValues.length,
      listingState: "done",
      noOfSheets: processValues.noOfSheets,
      outputItemName: processValues.outputItemName,
      pressingDate: processValues.pressingDate,
      pressingFor: purpose,
      purpose: purpose === "Sample Sheet" ? "SAMPLE" : "ORDER",
      remark: processValues.remark,
      sqf: outputArea.sqf,
      sqm: outputArea.sqm,
      thickness: processValues.thickness,
      width: processValues.width,
      for: purpose === "Sample Sheet" ? "Sample" : "Order",
      forLabel: purpose === "Sample Sheet" ? "Sample" : "Order",
      ...(purpose === "Sample Sheet" ? { sampleNo } : {}),
      ...(purpose === "Order" && selectedOrder
        ? {
            customerName: selectedOrder.customerName,
            orderDate: selectedOrder.orderDate,
            orderItemNo,
            orderNo: selectedOrder.orderNo,
          }
        : {}),
      selectedBaseMaterial: selectedBaseRows.map((row) => ({
        ...row,
        sheetsToUse: baseDrafts[String(row.id)]?.qtyToUse ?? "",
        remark: baseDrafts[String(row.id)]?.remark ?? "",
      })),
      rejectDetails: rejectValues,
    };

    selectedVeneerRows.forEach((row) => {
      const draft = veneerDrafts[String(row.id)] ?? { qtyToUse: "", remark: "" };
      const resultSnapshot = {
        ...(row as Record<string, unknown>),
        ...resultBase,
        qtyToUse: draft.qtyToUse,
        remark: draft.remark || resultBase.remark,
      };
      const workItemId =
        typeof row.workItemId === "string"
          ? row.workItemId
          : String(row.id).startsWith("factory-work-")
            ? String(row.id)
            : "";

      if (workItemId) {
        completeFactoryIssuedWork(workItemId, resultSnapshot);
        return;
      }

      const issued = issueFactoryWork({
        destinationProcess: "Pressing",
        sourceProcess: "Pressing",
        sourceRow: row,
        sourceSlug: "pressing",
      });
      completeFactoryIssuedWork(issued.id, resultSnapshot);
    });

    if (purpose === "Sample Sheet" && sampleNo) {
      const pressedRow = selectedVeneerRows[0];
      storePressingSampleInProduction({
        ...(pressedRow ?? {}),
        id: pressedRow?.id ?? sampleNo,
        sampleNo,
        outputItemName: processValues.outputItemName,
        itemSubCategory: processValues.itemSubCategory,
        cutColor: processValues.cutColor,
        length: processValues.length,
        width: processValues.width,
        thickness: processValues.thickness,
        noOfSheets: processValues.noOfSheets,
        remark: processValues.remark,
      });
    }

    navigate(paths.list);
  };

  const issuedEmptyLabel =
    purpose === "Order"
      ? "No issued pressing records are available for this order item."
      : "No issued pressing records are available for this sample sheet.";
  const pressingReady =
    (purpose === "Order" && Boolean(orderNo && orderItemNo && orderActive)) ||
    (purpose === "Sample Sheet" && Boolean(sampleNo));
  const baseReady = baseType === "Plywood" || baseType === "MDF";
  const selectionReady = pressingReady && baseReady;

  return (
    <FactoryPageShell
      actions={
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Button onClick={() => navigate(paths.list)} sx={recordFormActionButtonSx} variant="outlined">
            Cancel
          </Button>
          <Button
            disableElevation
            disabled={!canCreate}
            onClick={handleCreate}
            sx={highlightedRecordFormPrimaryButtonSx}
            variant="contained"
          >
            Create Pressing
          </Button>
        </Box>
      }
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: "Pressing", to: paths.list },
        { label: "Create Pressing" },
      ]}
      sectionGap={1}
      title="Create Pressing"
    >
      <PressingPurposeChoice
        allocationError={allocationError}
        baseType={baseType}
        onBaseTypeChange={(nextType) => {
          setBaseType(nextType);
          setSelectedBaseIds([]);
        }}
        onChange={(nextPurpose) => {
          setPurpose(nextPurpose);
          setOrderNo("");
          setOrderItemNo("");
          setSampleNo("");
          setSelectedVeneerIds([]);
        }}
        onOrderItemNoChange={setOrderItemNo}
        onOrderNoChange={(nextOrderNo) => {
          setOrderNo(nextOrderNo);
          setOrderItemNo("");
        }}
        onSampleNoChange={setSampleNo}
        orderItemNo={orderItemNo}
        orderItemOptions={orderItemOptions}
        orderNo={orderNo}
        orderOptions={orderRecords.map((order) => order.orderNo)}
        orderRecords={orderRecords}
        sampleNo={sampleNo}
        sampleOptions={sampleSheetRecords.map((sample) => sample.sampleNo)}
        showError={hasSubmitted}
        value={purpose}
      />

      {!selectionReady ? (
        <Typography
          sx={(theme) => ({
            color: theme.customTokens.neutrals[600],
            fontSize: "0.875rem",
            fontWeight: 600,
          })}
        >
          Select the pressing and base material.
        </Typography>
      ) : null}

      {selectionReady ? (
        <Stack
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            gap: theme.spacing(1),
            maxWidth: "100%",
            minWidth: 0,
            width: "100%",
          })}
        >
          <FormSectionHeader title="Issued for Pressing" />
          <PressingIssuedSelection
            columns={
              purpose === "Sample Sheet" ? pressingSampleIssuedColumns : pressingOrderIssuedColumns
            }
            emptyLabel={issuedEmptyLabel}
            onSelectedIdsChange={setSelectedVeneerIds}
            rows={issuedRows}
            selectedIds={selectedVeneerIds}
            showError={hasSubmitted && selectedVeneerRows.length === 0}
          />
        </Stack>
      ) : null}

      {selectionReady ? (
        <Stack
          sx={(theme) => ({
            ...formSectionCardSx(theme),
            gap: theme.spacing(1),
            maxWidth: "100%",
            minWidth: 0,
            width: "100%",
          })}
        >
          <FormSectionHeader title="Available Base Material" />
          <PressingIssuedSelection
            columns={pressingBaseStockColumns}
            emptyLabel={
              baseStock.emptyLabel ||
              `No ${baseType.toLowerCase()} stock with available sheets in the production warehouse.`
            }
            errorText={`Select at least one ${baseType} stock record.`}
            loading={baseStock.isLoading}
            onSelectedIdsChange={setSelectedBaseIds}
            placeholder={`Search ${baseType.toLowerCase()} stock...`}
            rows={baseStock.rows}
            selectedIds={selectedBaseIds}
            showError={hasSubmitted && selectedBaseRows.length === 0}
          />
        </Stack>
      ) : null}

      {selectionReady ? (
        <PressingProcessFields
          onChange={(patch) => setProcessValues((current) => ({ ...current, ...patch }))}
          outputError={hasSubmitted ? outputError : ""}
          showErrors={hasSubmitted}
          values={processValues}
        />
      ) : null}

      {selectedVeneerRows.length > 0 ? (
        <PressingSelectedVeneer
          drafts={veneerDrafts}
          onDraftChange={(rowId, patch) =>
            setVeneerDrafts((current) => ({
              ...current,
              [rowId]: {
                qtyToUse: current[rowId]?.qtyToUse ?? "",
                remark: current[rowId]?.remark ?? "",
                ...patch,
              },
            }))
          }
          onRemove={(rowId) =>
            setSelectedVeneerIds((current) => current.filter((id) => id !== rowId))
          }
          rows={selectedVeneerRows}
          showErrors={hasSubmitted}
        />
      ) : null}

      {selectedBaseRows.length > 0 ? (
        <PressingSelectedBase
          drafts={baseDrafts}
          materialType={baseType}
          onDraftChange={(rowId, patch) =>
            setBaseDrafts((current) => ({
              ...current,
              [rowId]: {
                qtyToUse: current[rowId]?.qtyToUse ?? "",
                remark: current[rowId]?.remark ?? "",
                ...patch,
              },
            }))
          }
          onRemove={(rowId) => setSelectedBaseIds((current) => current.filter((id) => id !== rowId))}
          rows={selectedBaseRows}
          showErrors={hasSubmitted}
        />
      ) : null}

      {selectionReady ? (
        <PressingRejectDetails
          onChange={(patch) => setRejectValues((current) => ({ ...current, ...patch }))}
          values={rejectValues}
        />
      ) : null}
    </FactoryPageShell>
  );
}
