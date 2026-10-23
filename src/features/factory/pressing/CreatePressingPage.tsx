import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router";

import {
  highlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../shared/buttonStyles";
import {
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import { useOrderRecords } from "../../orders/shared/ordersStore";
import { FactoryPageShell } from "../shared/FactoryPageShell";
import {
  applyPressingProcessResult,
  completeFactoryIssuedWork,
  factoryIssuedWorkToRow,
  getFactoryIssuedWorkForListing,
  issueFactoryWork,
  reopenPressingIssuedWork,
  useFactoryIssuedWorkItems,
} from "../shared/factoryIssuedWorkStore";
import { pressingDefinition } from "../shared/factoryDefinitions";
import { getFactoryPaths, getFactoryRowsForTab } from "../shared/factoryUtils";
import { normalizeFactorySourceColumns } from "../shared/listing/factoryListingParts";
import {
  sampleToFactoryRecord,
  storePressingSampleInProduction,
  useSampleSheetRecords,
} from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";
import {
  getPressingEditContext,
  mergePressingBaseRows,
  readPressingEditForm,
  readPressingSourceSnapshot,
  readPressingVeneerRows,
  readPressingWorkItemId,
} from "./pressingEdit";
import {
  buildPressingDummyIssuedRows,
  buildPressingDummySampleIssuedRows,
  getPressingOrderLineItems,
  pressingDummyOrders,
} from "./pressingDummyIssuedRows";
import { pressingRowIssuedForOrder } from "./pressingOrderMatch";
import {
  PressingGroupDetailsTable,
  type PressingGroupDetailRow,
} from "./PressingGroupDetailsTable";
import {
  PressingBaseDetailsTable,
  type PressingBaseDetailRow,
} from "./PressingBaseDetailsTable";
import {
  PressingPurposeChoice,
  type PressingPurpose,
} from "./PressingPurposeChoice";
import {
  PressingProcessFields,
  type PressingProcessValues,
} from "./PressingProcessFields";
import {
  PressingRejectDetails,
  type PressingRejectValues,
} from "./PressingRejectDetails";
import {
  calculatePressingUsedArea,
  firstPressingText,
  getPressingAvailableQuantity,
  getPressingQtyError,
  isPressingOrderActive,
  isPressingSourceEligible,
  mapPressingIssuedListingRow,
  pressingText,
  sanitizePressingInteger,
  type PressingUsageDraft,
} from "./pressingQuantity";
import {
  usePressingBaseStock,
  type PressingBaseMaterialType,
} from "./usePressingBaseStock";

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

export function CreatePressingPage({
  mode = "create",
}: {
  mode?: "create" | "edit";
}) {
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const isEdit = mode === "edit";
  const paths = getFactoryPaths("pressing");
  const orderRecords = useOrderRecords();
  const sampleSheetRecords = useSampleSheetRecords();
  const pressingOrderRecords = useMemo(() => {
    const seen = new Set<string>();
    return [...orderRecords, ...pressingDummyOrders].filter((order) => {
      const key = order.orderNo.trim().toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [orderRecords]);
  const factoryIssuedWorkItems = useFactoryIssuedWorkItems();
  const editContext = useMemo(
    () =>
      isEdit
        ? getPressingEditContext(params.id, pressingDefinition.rows)
        : null,
    [factoryIssuedWorkItems, isEdit, params.id],
  );
  const editForm = useMemo(
    () =>
      editContext ? readPressingEditForm(editContext, todayInputValue()) : null,
    [editContext],
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [purpose, setPurpose] = useState<PressingPurpose>(
    editForm?.purpose ?? "",
  );
  const [orderNo, setOrderNo] = useState(editForm?.orderNo ?? "");
  const [orderItemNo, setOrderItemNo] = useState(editForm?.orderItemNo ?? "");
  const [sampleNo, setSampleNo] = useState(editForm?.sampleNo ?? "");
  const [selectedVeneerIds, setSelectedVeneerIds] = useState<string[]>(
    editForm?.veneerIds ?? [],
  );
  const [veneerDrafts, setVeneerDrafts] = useState<
    Record<string, PressingUsageDraft>
  >(editForm?.veneerDrafts ?? {});
  const [groupDetailRows, setGroupDetailRows] = useState<
    PressingGroupDetailRow[]
  >(() =>
    editForm?.veneerIds?.length
      ? editForm.veneerIds.map((id, index) => ({
          id: `grp-init-${index}`,
          selectedRecordId: id,
          consume: editForm?.veneerDrafts?.[id]?.qtyToUse ?? "",
          isSaved: true,
        }))
      : [],
  );
  const [baseType, setBaseType] = useState<PressingBaseMaterialType>(
    editForm?.baseType ?? "Plywood",
  );
  const [selectedBaseIds, setSelectedBaseIds] = useState<string[]>(
    editForm?.baseIds ?? [],
  );
  const [baseDrafts, setBaseDrafts] = useState<
    Record<string, PressingUsageDraft>
  >(editForm?.baseDrafts ?? {});
  const [baseDetailRows, setBaseDetailRows] = useState<PressingBaseDetailRow[]>(
    () =>
      editForm?.baseIds?.length
        ? editForm.baseIds.map((id, index) => ({
            id: `base-init-${index}`,
            baseType: editForm?.baseType ?? "Plywood",
            selectedRecordId: id,
            consumeSheets: editForm?.baseDrafts?.[id]?.qtyToUse ?? "",
            consumeSqm: "",
            isSaved: true,
          }))
        : [],
  );
  const [processValues, setProcessValues] = useState<PressingProcessValues>(
    editForm?.processValues ?? {
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
    },
  );
  const [rejectValues, setRejectValues] = useState<PressingRejectValues>(
    editForm?.rejectValues ?? {
      itemName: "",
      length: "",
      quantity: "",
      remark: "",
      thickness: "",
      type: "",
      width: "",
    },
  );
  const baseStock = usePressingBaseStock(baseType);
  const baseSelectionRows = useMemo(
    () =>
      mergePressingBaseRows(
        baseStock.rows,
        editForm?.baseType === baseType ? editForm.baseRows : [],
      ),
    [baseStock.rows, baseType, editForm],
  );

  const selectedOrder = pressingOrderRecords.find(
    (order) => order.orderNo === orderNo,
  );
  const orderActive = selectedOrder
    ? isPressingOrderActive(selectedOrder.status)
    : false;
  const allocationError =
    purpose === "Order" && selectedOrder && !orderActive
      ? "This order is cancelled or its allocation is no longer active. Issued pressing records were refreshed."
      : "";

  const orderItemOptions = useMemo(() => {
    if (!selectedOrder) {
      return [] as string[];
    }

    return getPressingOrderLineItems(String(selectedOrder.id)).map((_, index) =>
      String(index + 1),
    );
  }, [selectedOrder]);

  const selectedOrderLine = useMemo(() => {
    if (!selectedOrder || !orderItemNo) {
      return null;
    }

    return (
      getPressingOrderLineItems(String(selectedOrder.id))[
        Number(orderItemNo) - 1
      ] ?? null
    );
  }, [orderItemNo, selectedOrder]);

  const prevOrderSelectionRef = useMemo(() => ({ currentKey: "" }), []);

  useEffect(() => {
    if (purpose !== "Order") {
      prevOrderSelectionRef.currentKey = "";
      return;
    }

    const selectionKey = `${orderNo}__${orderItemNo}`;
    if (!orderNo || !orderItemNo) {
      prevOrderSelectionRef.currentKey = selectionKey;
      return;
    }

    const isOriginalEditSelection =
      isEdit &&
      orderNo === editForm?.orderNo &&
      orderItemNo === editForm?.orderItemNo;
    if (isOriginalEditSelection) {
      prevOrderSelectionRef.currentKey = selectionKey;
      return;
    }

    if (prevOrderSelectionRef.currentKey === selectionKey) {
      return;
    }
    prevOrderSelectionRef.currentKey = selectionKey;

    setProcessValues((current) => ({
      ...current,
      grade:
        pressingText(selectedOrderLine?.grade) ||
        pressingText(selectedOrder?.grade),
      itemSubCategory:
        pressingText(selectedOrderLine?.subCategory) ||
        pressingText(selectedOrder?.subCategory),
      length:
        pressingText(selectedOrderLine?.length) ||
        pressingText(selectedOrder?.length),
      noOfSheets: sanitizePressingInteger(
        pressingText(selectedOrderLine?.quantitySheets) ||
          pressingText(selectedOrder?.quantitySheets),
      ),
      outputItemName:
        pressingText(selectedOrderLine?.itemName) ||
        pressingText(selectedOrderLine?.salesItemName) ||
        pressingText(selectedOrder?.itemName),
      remark:
        pressingText(selectedOrderLine?.remark) ||
        pressingText(selectedOrder?.remark),
      thickness:
        pressingText(selectedOrderLine?.thickness) ||
        pressingText(selectedOrder?.thickness),
      width:
        pressingText(selectedOrderLine?.width) ||
        pressingText(selectedOrder?.width),
    }));
  }, [
    editForm,
    isEdit,
    orderItemNo,
    orderNo,
    prevOrderSelectionRef,
    purpose,
    selectedOrder,
    selectedOrderLine,
  ]);

  const issuedRows = useMemo(() => {
    const issuedWorkRows = getFactoryIssuedWorkForListing(
      "pressing",
      "issued",
    ).map((item) =>
      normalizeFactorySourceColumns(factoryIssuedWorkToRow(item), "pressing"),
    );
    const localIssuedRows = getFactoryRowsForTab(
      pressingDefinition.rows,
      "issued",
    ).map((row) => normalizeFactorySourceColumns(row, "pressing"));
    const sampleIssuedRows = sampleSheetRecords
      .filter(
        (sample) =>
          sample.nextProcess === "Pressing" && sample.availableSheets > 0,
      )
      .map((sample) =>
        normalizeFactorySourceColumns(
          sampleToFactoryRecord(sample, "issued"),
          "pressing",
        ),
      );
    const dummyIssuedRows = [
      ...buildPressingDummyIssuedRows(pressingOrderRecords),
      ...buildPressingDummySampleIssuedRows(),
    ].map((row) => normalizeFactorySourceColumns(row, "pressing"));
    const seen = new Set<string>();
    const rows = [
      ...issuedWorkRows,
      ...localIssuedRows,
      ...sampleIssuedRows,
      ...dummyIssuedRows,
    ].filter((row) => {
      const id = String(row.id);
      if (seen.has(id) || !isPressingSourceEligible(row)) {
        return false;
      }
      seen.add(id);
      return true;
    });

    const issuedForPurpose =
      purpose === "Order"
        ? !orderNo || !orderItemNo || !orderActive || !selectedOrder
          ? []
          : rows
              .filter((row) =>
                pressingRowIssuedForOrder(row, orderNo, orderItemNo),
              )
              .map(mapPressingIssuedListingRow)
        : purpose === "Sample Sheet"
          ? rows
              .filter(
                (row) =>
                  Boolean(row.sampleNo) ||
                  row.purpose === "SAMPLE" ||
                  row.forLabel === "Sample" ||
                  row.isSample === true,
              )
              .map(mapPressingIssuedListingRow)
          : [];
    const groupedRows = readPressingVeneerRows(editContext?.rows ?? []).filter(
      (row) => {
        if (purpose === "Order") {
          return (
            Boolean(orderNo && orderItemNo) &&
            pressingRowIssuedForOrder(row, orderNo, orderItemNo)
          );
        }

        if (purpose === "Sample Sheet") {
          const target = sampleNo.trim().toLowerCase();
          const rowSample = String(row.sampleNo ?? row.orderNo ?? "")
            .trim()
            .toLowerCase();
          return !target || rowSample === target;
        }

        return false;
      },
    );
    const seenIds = new Set(issuedForPurpose.map((row) => String(row.id)));

    return [
      ...groupedRows.filter((row) => !seenIds.has(String(row.id))),
      ...issuedForPurpose,
    ];
  }, [
    editContext,
    factoryIssuedWorkItems,
    orderActive,
    pressingOrderRecords,
    orderItemNo,
    orderNo,
    purpose,
    sampleNo,
    sampleSheetRecords,
    selectedOrder,
  ]);

  // Synchronize veneer selection and drafts from groupDetailRows
  useEffect(() => {
    const validGroupRows = groupDetailRows.filter((r) => r.selectedRecordId);
    const nextIds = validGroupRows.map((r) => r.selectedRecordId);
    setSelectedVeneerIds(nextIds);
    setVeneerDrafts(
      validGroupRows.reduce(
        (acc, r) => ({
          ...acc,
          [r.selectedRecordId]: {
            qtyToUse: r.consume,
            remark: "",
          },
        }),
        {} as Record<string, PressingUsageDraft>,
      ),
    );
    if (purpose === "Sample Sheet") {
      const selectedRow = issuedRows.find(
        (row) => String(row.id) === nextIds[0],
      );
      setSampleNo(
        selectedRow
          ? String(
              selectedRow.sampleNo ??
                selectedRow.groupNo ??
                selectedRow.orderNo ??
                "",
            )
          : "",
      );
    }
  }, [groupDetailRows, issuedRows, purpose]);

  // Synchronize base selection and drafts from baseDetailRows
  useEffect(() => {
    const validBaseRows = baseDetailRows.filter((r) => r.selectedRecordId);
    const nextIds = validBaseRows.map((r) => r.selectedRecordId);
    setSelectedBaseIds(nextIds);
    setBaseDrafts(
      validBaseRows.reduce(
        (acc, r) => ({
          ...acc,
          [r.selectedRecordId]: {
            qtyToUse: r.consumeSheets,
            remark: "",
          },
        }),
        {} as Record<string, PressingUsageDraft>,
      ),
    );
  }, [baseDetailRows]);

  const selectedVeneerRows = rowsFromIds(issuedRows, selectedVeneerIds);
  const selectedBaseRows = rowsFromIds(baseSelectionRows, selectedBaseIds);
  const detailSource = selectedVeneerRows[0];
  const detailSourceId = detailSource ? String(detailSource.id) : "";
  useEffect(() => {
    const keepsSavedOutput =
      isEdit &&
      Boolean(detailSourceId) &&
      (editContext?.rows ?? []).some(
        (row) => String(row.id) === detailSourceId,
      );
    if (keepsSavedOutput) {
      return;
    }

    if (purpose === "Order") {
      return;
    }

    const row = selectedVeneerRows[0];
    if (!row) {
      if (isEdit) {
        return;
      }

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
      itemSubCategory: firstPressingText(row, [
        "itemSubCategory",
        "subCategory",
      ]),
      length: pressingText(row.length),
      noOfSheets: sanitizePressingInteger(
        firstPressingText(row, [
          "availableQty",
          "availableSheets",
          "noOfSheets",
        ]),
      ),
      outputItemName: pressingText(row.itemName),
      thickness: pressingText(row.thickness),
      width: pressingText(row.width),
    }));
  }, [detailSourceId, editContext, isEdit, purpose]);
  const outputSheets = Number(processValues.noOfSheets);
  const veneerUseTotal = groupDetailRows.reduce(
    (sum, r) => sum + (Number(r.consume) || 0),
    0,
  );
  const baseUseTotal = baseDetailRows.reduce(
    (sum, r) => sum + (Number(r.consumeSheets) || 0),
    0,
  );
  const veneerQtyInvalid = groupDetailRows.some((r) => {
    if (!r.selectedRecordId) return true;
    const record = issuedRows.find(
      (item) => String(item.id) === r.selectedRecordId,
    );
    const available = record ? getPressingAvailableQuantity(record) : 0;
    const val = Number(r.consume);
    return (
      !r.consume.trim() || Number.isNaN(val) || val <= 0 || val > available
    );
  });
  const baseQtyInvalid = baseDetailRows.some((r) => {
    if (!r.selectedRecordId) return true;
    const record = baseSelectionRows.find(
      (item) => String(item.id) === r.selectedRecordId,
    );
    const available = record ? getPressingAvailableQuantity(record) : 0;
    const val = Number(r.consumeSheets);
    return (
      !r.consumeSheets.trim() ||
      Number.isNaN(val) ||
      val <= 0 ||
      val > available
    );
  });
  const outputExceedsVeneer =
    outputSheets > 0 && veneerUseTotal > 0 && outputSheets > veneerUseTotal;
  const outputExceedsBase =
    outputSheets > 0 && baseUseTotal > 0 && outputSheets > baseUseTotal;
  const outputError = outputExceedsVeneer
    ? "No of sheets cannot exceed the veneer quantity selected for use."
    : outputExceedsBase
      ? "No of sheets cannot exceed the selected base material sheets."
      : "";
  const rejectQuantityInvalid =
    Boolean(rejectValues.quantity.trim()) && Number(rejectValues.quantity) <= 0;
  const canCreate =
    (purpose === "Order"
      ? Boolean(orderNo && orderItemNo && orderActive)
      : purpose === "Sample Sheet") &&
    groupDetailRows.length > 0 &&
    !veneerQtyInvalid &&
    (baseType === "Plywood" || baseType === "MDF") &&
    baseDetailRows.length > 0 &&
    !baseQtyInvalid &&
    Boolean(
      processValues.pressingDate && processValues.outputItemName.trim(),
    ) &&
    outputSheets > 0 &&
    !outputExceedsVeneer &&
    !outputExceedsBase &&
    !rejectQuantityInvalid;

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
      receivedSheets: processValues.noOfSheets,
      availableSheets: processValues.noOfSheets,
      outputItemName: processValues.outputItemName,
      pressingDate: processValues.pressingDate,
      pressingFor: purpose,
      purpose: purpose === "Sample Sheet" ? "SAMPLE" : "ORDER",
      remark: processValues.remark,
      sqf: outputArea.sqf,
      sqm: outputArea.sqm,
      receivedSqf: outputArea.sqf,
      availableSqf: outputArea.sqf,
      receivedSqm: outputArea.sqm,
      availableSqm: outputArea.sqm,
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
        materialType: pressingText(row.materialType) || baseType,
        sheetsToUse: baseDrafts[String(row.id)]?.qtyToUse ?? "",
        remark: baseDrafts[String(row.id)]?.remark ?? "",
      })),
      rejectDetails: rejectValues,
    };
    const processId = editContext?.processId || `pressing-${Date.now()}`;
    const previousIds = new Set(
      (editContext?.rows ?? []).map((row) => String(row.id)),
    );
    const nextIds = new Set(selectedVeneerRows.map((row) => String(row.id)));

    if (isEdit) {
      previousIds.forEach((id) => {
        if (nextIds.has(id)) {
          return;
        }

        const previousRow = editContext?.rows.find(
          (row) => String(row.id) === id,
        );
        const workItemId = previousRow
          ? readPressingWorkItemId(previousRow)
          : "";
        if (workItemId) {
          reopenPressingIssuedWork(workItemId);
        }
      });
    }

    selectedVeneerRows.forEach((row) => {
      const draft = veneerDrafts[String(row.id)] ?? {
        qtyToUse: "",
        remark: "",
      };
      const sourceSnapshot = readPressingSourceSnapshot(row);
      const resultSnapshot = {
        ...sourceSnapshot,
        ...resultBase,
        pressingProcessId: processId,
        pressingSourceItem: sourceSnapshot,
        processRemark: processValues.remark,
        qtyToUse: draft.qtyToUse,
        remark: draft.remark || resultBase.remark,
      };
      const workItemId = readPressingWorkItemId(row);

      if (workItemId && previousIds.has(String(row.id))) {
        applyPressingProcessResult(workItemId, resultSnapshot);
        return;
      }

      if (workItemId) {
        completeFactoryIssuedWork(workItemId, resultSnapshot);
        return;
      }

      if (isEdit && previousIds.has(String(row.id))) {
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

    navigate(isEdit ? `${paths.list}?tab=done` : paths.list);
  };

  const issuedEmptyLabel =
    purpose === "Order"
      ? "No issued pressing records are available for this order item."
      : "No issued pressing records are available for this sample sheet.";
  const pressingReady =
    (purpose === "Order" &&
      Boolean(orderNo && orderItemNo && (orderActive || isEdit))) ||
    purpose === "Sample Sheet";
  const baseReady = baseType === "Plywood" || baseType === "MDF";
  const selectionReady = pressingReady && baseReady;
  const pageTitle = isEdit ? "Edit Pressing" : "Create Pressing";
  const listPath = isEdit ? `${paths.list}?tab=done` : paths.list;

  if (isEdit && !editContext) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: "Pressing", to: listPath },
          { label: pageTitle },
        ]}
        sectionGap={1}
        title={pageTitle}
      >
        <Alert severity="warning">
          The selected Pressing record was not found.
        </Alert>
      </FactoryPageShell>
    );
  }

  return (
    <FactoryPageShell
      breadcrumbs={[
        { label: "Factory", to: "/factory" },
        { label: "Pressing", to: listPath },
        { label: pageTitle },
      ]}
      sectionGap={2}
      title={pageTitle}
    >
      <PressingPurposeChoice
        allocationError={allocationError}
        baseType={baseType}
        onBaseTypeChange={(nextType) => {
          setBaseType(nextType);
          setSelectedBaseIds([]);
          setBaseDrafts({});
          setBaseDetailRows([]);
        }}
        onChange={(nextPurpose) => {
          setPurpose(nextPurpose);
          setOrderNo("");
          setOrderItemNo("");
          setSampleNo("");
          setSelectedVeneerIds([]);
          setVeneerDrafts({});
          setGroupDetailRows([]);
        }}
        onOrderItemNoChange={setOrderItemNo}
        onOrderNoChange={(nextOrderNo) => {
          setOrderNo(nextOrderNo);
          setOrderItemNo("");
        }}
        orderItemNo={orderItemNo}
        orderItemOptions={orderItemOptions}
        orderNo={orderNo}
        orderOptions={pressingOrderRecords.map((order) => order.orderNo)}
        orderRecords={pressingOrderRecords}
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
        <PressingProcessFields
          onChange={(patch) =>
            setProcessValues((current) => ({ ...current, ...patch }))
          }
          outputError={hasSubmitted ? outputError : ""}
          showErrors={hasSubmitted}
          values={processValues}
        />
      ) : null}

      {pressingReady ? (
        <PressingGroupDetailsTable
          availableRows={issuedRows}
          emptyMessage={issuedEmptyLabel}
          onRowsChange={setGroupDetailRows}
          rows={groupDetailRows}
          showErrors={hasSubmitted}
        />
      ) : null}

      {baseReady ? (
        <PressingBaseDetailsTable
          availableRows={baseSelectionRows}
          currentBaseType={baseType}
          emptyMessage={
            baseStock.emptyLabel ||
            `No ${baseType.toLowerCase()} stock with available sheets in the production warehouse.`
          }
          onRowsChange={setBaseDetailRows}
          rows={baseDetailRows}
          showErrors={hasSubmitted}
        />
      ) : null}

      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexWrap: "wrap",
          gap: 1,
          justifyContent: "flex-end",
        }}
      >
        <Button
          onClick={() => navigate(listPath)}
          sx={recordFormActionButtonSx}
          variant="outlined"
        >
          Cancel
        </Button>
        <Button
          disableElevation
          disabled={!canCreate}
          onClick={handleCreate}
          sx={highlightedRecordFormPrimaryButtonSx}
          variant="contained"
        >
          {isEdit ? "Update Pressing" : "Create Pressing"}
        </Button>
      </Box>
    </FactoryPageShell>
  );
}
