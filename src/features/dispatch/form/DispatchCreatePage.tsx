import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { ChevronLeft, Pencil, Save } from "lucide-react";
import { useNavigate, useParams } from "react-router";

import {
  MasterPageShell,
  MasterSectionCard,
} from "../../masters/shared";
import { ConfirmationDialog } from "../../../components/feedback/ConfirmationDialog";
import {
  getTransporterMasterOptions,
  refreshTransporterMasterCache,
} from "../../masters/shared/masterDefinitions";
import { getCachedCustomerMasterRows } from "../../masters/customer-master/api/customerMasterApi";
import {
  createDispatchEntry,
  packingOrderTypeOptions,
  type PackingRecord,
  usePackingRecords,
} from "../../packing/shared/packingStore";
import { canAccessPermission } from "../../permissions";
import {
  recordFormActionButtonSx,
  recordViewActionButtonSx,
} from "../../shared/buttonStyles";
import { FormSectionHeader } from "../../shared/formSectionStyles";
import {
  formatAmount as formatAmountShared,
  formatQuantity,
  formatSQM,
  parseNumericValue,
} from "../../shared/numberFormat";
import {
  getAutocompleteListboxSx,
  getAutocompletePaperSx,
  getAutocompletePopperSlotProps,
} from "../../shared/dropdownMenuStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import { ErpDatePickerField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";

const ALL_OPTION = "All";

interface DispatchRecordPageProps {
  mode?: "add" | "edit" | "view";
}

interface DispatchFormState {
  dispatchDate: Date | null;
  customerName: string;
  orderCategories: string[];
  productCategories: string[];
  packingList: string[];
  buyerAddress: string;
  sellerAddress: string;
  transactionType: string;
  transporter: string;
  transportMode: string;
  remark: string;
}

interface DispatchItemRow {
  id: string;
  recordId: string;
  srNo: string;
  orderNo: string;
  salesItemName: string;
  orderItemNo: string;
  productCategory: string;
  groupNo: string;
  itemName: string;
  itemSubCategory: string;
  length: string;
  width: string;
  thickness: string;
  totalQuantity: string;
  dispatchQuantity: string;
  remainingQuantity: string;
  noOfSheets: string;
  sqm: string;
  rate: string;
  itemAmount: string;
  discountPercent: string;
  itemAmountWithDiscount: string;
  gstPercent: string;
  gstAmount: string;
  cgstAmount: string;
  sgstAmount: string;
  igstAmount: string;
  finalAmount: string;
  remark: string;
}

interface DispatchSummaryRow {
  totalQuantity: string;
  totalSqm: string;
  baseAmountWithoutGst: string;
  otherAmount: string;
  expenseAmountWithGst: string;
  baseAmountWithGst: string;
  grandTotal: string;
}

interface ItemColumnConfig {
  key: keyof DispatchItemRow;
  label: string;
  minWidth: number;
}

const baseItemTableColumns: readonly ItemColumnConfig[] = [
  { key: "srNo", label: "Sr. No", minWidth: 80 },
  { key: "orderNo", label: "Order No", minWidth: 140 },
  { key: "salesItemName", label: "Sales Item Name", minWidth: 200 },
  { key: "orderItemNo", label: "Order Item No", minWidth: 130 },
  { key: "productCategory", label: "Product Category", minWidth: 160 },
  { key: "groupNo", label: "Group No", minWidth: 120 },
  { key: "itemName", label: "Item Name", minWidth: 180 },
  { key: "itemSubCategory", label: "Item Sub Category", minWidth: 170 },
  { key: "length", label: "Length", minWidth: 110 },
  { key: "width", label: "Width", minWidth: 110 },
  { key: "thickness", label: "Thickness", minWidth: 120 },
  { key: "totalQuantity", label: "Total Qty", minWidth: 110 },
  { key: "dispatchQuantity", label: "Dispatch Qty", minWidth: 130 },
  { key: "remainingQuantity", label: "Remaining Qty", minWidth: 130 },
  { key: "sqm", label: "SQM", minWidth: 110 },
  { key: "rate", label: "Rate", minWidth: 120 },
  { key: "itemAmount", label: "Item Amount", minWidth: 140 },
];

function extractStateFromAddress(addressText: string): string {
  const text = (addressText || "").toLowerCase();
  const knownStates = [
    "gujarat",
    "maharashtra",
    "delhi",
    "rajasthan",
    "madhya pradesh",
    "karnataka",
    "tamil nadu",
    "west bengal",
    "uttar pradesh",
    "punjab",
    "haryana",
    "kerala",
    "telangana",
    "andhra pradesh",
    "goa",
    "assam",
    "bihar",
    "chhattisgarh",
    "jharkhand",
    "odisha",
    "uttarakhand",
    "himachal pradesh",
  ];
  for (const st of knownStates) {
    if (text.includes(st)) {
      return st;
    }
  }
  return "";
}

function resolveCustomerState(customerName: string, buyerAddress: string): string {
  const fromAddr = extractStateFromAddress(buyerAddress);
  if (fromAddr) return fromAddr;
  if (!customerName) return "";
  const match = getCachedCustomerMasterRows().find(
    (row) => String(row.customerName ?? "").trim().toLowerCase() === customerName.trim().toLowerCase(),
  );
  if (match?.state) {
    return String(match.state).trim().toLowerCase();
  }
  return "";
}

function resolveSellerState(sellerAddress: string): string {
  const fromAddr = extractStateFromAddress(sellerAddress);
  if (fromAddr) return fromAddr;
  return "gujarat"; // Deluxe Veneers primary factory state
}

function getDispatchGstMode(
  customerName: string,
  buyerAddress: string,
  sellerAddress: string,
): "intra" | "inter" | "none" {
  const custState = resolveCustomerState(customerName, buyerAddress);
  const sellerState = resolveSellerState(sellerAddress);
  if (!custState) {
    // Default to intra (SGST + CGST) if customer is in Gujarat or state is unknown
    return "intra";
  }
  return custState === sellerState ? "intra" : "inter";
}

function getDynamicItemTableColumns(
  rows: readonly DispatchItemRow[],
  gstMode: "intra" | "inter" | "none",
): readonly ItemColumnConfig[] {
  const cols: ItemColumnConfig[] = [...baseItemTableColumns];

  // If discount is applicable (> 0) on any item, display discount % and item amount with discount
  const hasDiscount = rows.some((row) => parseAmount(row.discountPercent) > 0);
  if (hasDiscount) {
    cols.push(
      { key: "discountPercent", label: "Discount %", minWidth: 120 },
      { key: "itemAmountWithDiscount", label: "Item Amount With Discount", minWidth: 210 },
    );
  }

  // GST logic:
  // Add GST % column when GST applies with percentage segregation
  // If intra state (same state), display SGST (9%) and CGST (9%)
  // If inter state (another state), display IGST (18%)
  // If none or null, do not display
  if (gstMode === "intra") {
    cols.push(
      { key: "gstPercent", label: "GST %", minWidth: 100 },
      { key: "cgstAmount", label: "CGST (9%)", minWidth: 140 },
      { key: "sgstAmount", label: "SGST (9%)", minWidth: 140 },
    );
  } else if (gstMode === "inter") {
    cols.push(
      { key: "gstPercent", label: "GST %", minWidth: 100 },
      { key: "igstAmount", label: "IGST (18%)", minWidth: 140 },
    );
  }

  cols.push(
    { key: "finalAmount", label: "Final Amount", minWidth: 140 },
    { key: "remark", label: "Remark", minWidth: 160 },
  );

  return cols;
}

const summaryTableColumns: readonly {
  key: keyof DispatchSummaryRow;
  label: string;
  minWidth: number;
}[] = [
    { key: "totalQuantity", label: "Total Quantity", minWidth: 140 },
    { key: "totalSqm", label: "Total SQM", minWidth: 130 },
    {
      key: "baseAmountWithoutGst",
      label: "Base Amount Without GST",
      minWidth: 190,
    },
    { key: "otherAmount", label: "Other Amount", minWidth: 140 },
    {
      key: "expenseAmountWithGst",
      label: "Expense Amount With GST(18%)",
      minWidth: 220,
    },
    {
      key: "baseAmountWithGst",
      label: "Base Amount With GST",
      minWidth: 180,
    },
    { key: "grandTotal", label: "Grand Total", minWidth: 150 },
  ];

const transportModeOptions = ["Road", "Air", "Rail", "Ship"];
const transactionTypeOptions = [
  "REGULAR",
  "BILL TO SHIP TO",
  "BILL FORM DISPATCH FROM",
  "BILL TO SHIP TO AND BILL FROM DISPATCH FROM",
] as const;

export function DispatchCreatePage({
  mode = "add",
}: DispatchRecordPageProps) {
  const records = usePackingRecords();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const sourceRecord = useMemo(
    () => records.find((entry) => entry.id === id),
    [id, records],
  );
  const canCreate = canAccessPermission("dispatch", "create");
  const canEdit = canAccessPermission("dispatch", "edit");
  const canView = canAccessPermission("dispatch", "view");
  const canUseMode =
    mode === "add" ? canCreate : mode === "edit" ? canEdit : canView;
  const pageLabel =
    mode === "add"
      ? "Create Dispatch"
      : mode === "edit"
        ? "Edit Dispatch"
        : "View Dispatch";
  const readOnly = mode === "view";
  const dispatchSourceRecords = useMemo(
    () => records.filter((record) => record.packingState === "done"),
    [records],
  );
  const [values, setValues] = useState<DispatchFormState>(() =>
    buildDispatchInitialValues(sourceRecord),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loadedRecords, setLoadedRecords] = useState<readonly PackingRecord[]>(
    () => (sourceRecord ? [sourceRecord] : []),
  );
  const [dispatchQuantityMap, setDispatchQuantityMap] = useState<Record<string, number>>({});
  const [leaveConfirmation, setLeaveConfirmation] = useState<{
    open: boolean;
    title: string;
    description: string;
    action: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    action: () => undefined,
  });
  const customerOptions = useMemo(
    () => uniqueOptions(dispatchSourceRecords, "customerName"),
    [dispatchSourceRecords],
  );
  const orderCategoryOptions = useMemo(
    () => [...packingOrderTypeOptions],
    [],
  );
  const productCategoryOptions = useMemo(
    () =>
      uniqueStrings(
        dispatchSourceRecords
          .filter((record) =>
            values.customerName ? record.customerName === values.customerName : true,
          )
          .filter((record) =>
            values.orderCategories.length > 0
              ? values.orderCategories.includes(record.orderType)
              : false,
          )
          .map((record) => record.productCategory),
      ),
    [dispatchSourceRecords, values.customerName, values.orderCategories],
  );
  const canSelectPackingList =
    values.customerName.trim().length > 0 &&
    values.orderCategories.length > 0 &&
    values.productCategories.length > 0;
  const packingListRecords = useMemo(
    () =>
      canSelectPackingList
        ? dispatchSourceRecords.filter(
          (record) =>
            record.customerName === values.customerName &&
            values.orderCategories.includes(record.orderType) &&
            values.productCategories.includes(record.productCategory),
        )
        : [],
    [
      canSelectPackingList,
      dispatchSourceRecords,
      values.customerName,
      values.orderCategories,
      values.productCategories,
    ],
  );
  const packingListOptions = useMemo(
    () =>
      uniqueStrings(
        packingListRecords.map(
          (record) => `${record.packingId} - ${record.orderNo}`,
        ),
      ),
    [packingListRecords],
  );
  const [transporterOptions, setTransporterOptions] = useState<string[]>(() =>
    getTransporterMasterOptions(),
  );

  useEffect(() => {
    setTransporterOptions(getTransporterMasterOptions());
    void refreshTransporterMasterCache()
      .then(() => {
        setTransporterOptions(getTransporterMasterOptions());
      })
      .catch(() => {});
  }, []);

  const gstMode = useMemo(
    () => getDispatchGstMode(values.customerName, values.buyerAddress, values.sellerAddress),
    [values.customerName, values.buyerAddress, values.sellerAddress],
  );

  const dispatchItemRows = useMemo(
    () =>
      loadedRecords.map((record, index) => {
        const totalSheetsNum = parseInt(record.noOfSheets, 10) || 0;
        const currentDispatchQty =
          typeof dispatchQuantityMap[record.id] === "number"
            ? dispatchQuantityMap[record.id]!
            : totalSheetsNum;
        return mapDispatchItemRow(record, index, currentDispatchQty, gstMode);
      }),
    [dispatchQuantityMap, gstMode, loadedRecords],
  );

  const dynamicItemColumns = useMemo(
    () => getDynamicItemTableColumns(dispatchItemRows, gstMode),
    [dispatchItemRows, gstMode],
  );

  const dispatchSummaryRow = useMemo(
    () => buildSummaryRow(dispatchItemRows),
    [dispatchItemRows],
  );
  const hasLoadedItems = loadedRecords.length > 0;

  useEffect(() => {
    const nextValues = buildDispatchInitialValues(sourceRecord);
    setValues(nextValues);
    setLoadedRecords(sourceRecord ? [sourceRecord] : []);
    if (sourceRecord) {
      const total = parseInt(sourceRecord.noOfSheets, 10) || 0;
      setDispatchQuantityMap({ [sourceRecord.id]: total });
    } else {
      setDispatchQuantityMap({});
    }
  }, [sourceRecord]);

  if ((mode === "edit" || mode === "view") && !sourceRecord) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Dispatch", to: "/dispatch" },
          { label: "Not Found" },
        ]}
        title="Dispatch"
      >
        <MasterSectionCard>
          <Typography variant="body2" color="text.secondary">
            The requested dispatch record could not be found.
          </Typography>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  if (!canUseMode) {
    return (
      <MasterPageShell
        breadcrumbs={[
          { label: "Dispatch", to: "/dispatch" },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <MasterSectionCard>
          <Alert severity="warning">
            You do not have permission to access this dispatch action.
          </Alert>
        </MasterSectionCard>
      </MasterPageShell>
    );
  }

  const handleRequestBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/dispatch");
    }
  };

  return (
    <MasterPageShell
      backNav={{
        label: "Back to Dispatch",
        to: "/dispatch",
        onBack: handleRequestBack,
      }}
      breadcrumbs={[
        { label: "Dispatch", to: "/dispatch" },
        { label: pageLabel },
      ]}
      title={pageLabel}
    >
      <MasterSectionCard>
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1.5),
          })}
        >
          <FormSectionHeader title="Dispatch Details" />

          {errorMessage ? (
            <Alert severity="error" sx={{ mb: 1 }}>
              {errorMessage}
            </Alert>
          ) : null}

          <Box
            sx={(theme) => ({
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(4, minmax(0, 1fr))",
              },
              gap: theme.spacing(1.25),
              alignItems: "start",
            })}
          >
            <LabeledField label="Dispatch Date *">
              <ErpDatePickerField
                helperText={hasSubmitted && !values.dispatchDate ? "Dispatch Date is required." : ""}
                onChange={(nextValue) => {
                  setErrorMessage("");
                  setValues((current) => ({
                    ...current,
                    dispatchDate: nextValue,
                  }));
                }}
                state={
                  readOnly
                    ? "readOnly"
                    : hasSubmitted && !values.dispatchDate
                      ? "error"
                      : "default"
                }
                value={values.dispatchDate}
              />
            </LabeledField>

            <SingleSelectField
              disabled={readOnly}
              error={hasSubmitted && !values.customerName}
              label="Customer Name *"
              options={customerOptions}
              value={values.customerName}
              onChange={(nextValue) => {
                setErrorMessage("");
                setValues((current) => ({
                  ...current,
                  customerName: nextValue,
                  orderCategories: [],
                  productCategories: [],
                  packingList: [],
                }));
                if (mode === "add") {
                  setLoadedRecords([]);
                }
              }}
            />

            <MultiSelectField
              disabled={readOnly || !values.customerName}
              error={false}
              label="Order Category"
              options={orderCategoryOptions}
              value={values.orderCategories}
              onChange={(nextValue) => {
                setValues((current) => ({
                  ...current,
                  orderCategories: nextValue,
                  productCategories: [],
                  packingList: [],
                }));
                if (mode === "add") {
                  setLoadedRecords([]);
                }
              }}
            />

            <MultiSelectField
              disabled={readOnly || values.orderCategories.length === 0}
              error={false}
              label="Product Category"
              options={productCategoryOptions}
              value={values.productCategories}
              onChange={(nextValue) => {
                setValues((current) => ({
                  ...current,
                  productCategories: nextValue,
                  packingList: [],
                }));
                if (mode === "add") {
                  setLoadedRecords([]);
                }
              }}
            />

            {canSelectPackingList ? (
              <MultiSelectField
                disabled={readOnly}
                error={hasSubmitted && loadedRecords.length === 0}
                label="Packing List *"
                labelAction={
                  !readOnly ? (
                    <Button
                      disabled={values.packingList.length === 0}
                      onClick={() => {
                        const selectedRecords = packingListRecords.filter((record) =>
                          values.packingList.includes(
                            `${record.packingId} - ${record.orderNo}`,
                          ),
                        );
                        setLoadedRecords(selectedRecords);
                        const initialQtyMap: Record<string, number> = {};
                        selectedRecords.forEach((record) => {
                          initialQtyMap[record.id] = parseInt(record.noOfSheets, 10) || 0;
                        });
                        setDispatchQuantityMap(initialQtyMap);
                        setErrorMessage("");
                      }}
                      sx={loadButtonSx}
                      variant="contained"
                    >
                      Load
                    </Button>
                  ) : null
                }
                options={packingListOptions}
                showAllOption
                showCheckboxes
                value={values.packingList}
                onChange={(nextValue) => {
                  setValues((current) => ({
                    ...current,
                    packingList: nextValue,
                  }));
                  if (mode === "add") {
                    setLoadedRecords([]);
                  }
                }}
              />
            ) : null}

            <TextInputField
              disabled={readOnly}
              error={false}
              label="Address of Buyer"
              value={values.buyerAddress}
              onChange={(nextValue) =>
                setValues((current) => ({ ...current, buyerAddress: nextValue }))
              }
            />

            <TextInputField
              disabled={readOnly}
              error={false}
              label="Address of Seller"
              value={values.sellerAddress}
              onChange={(nextValue) =>
                setValues((current) => ({ ...current, sellerAddress: nextValue }))
              }
            />

            <SingleSelectField
              disabled={readOnly}
              error={false}
              label="Transaction Type"
              options={transactionTypeOptions}
              value={values.transactionType}
              onChange={(nextValue) =>
                setValues((current) => ({
                  ...current,
                  transactionType: nextValue,
                }))
              }
            />

            <SingleSelectField
              disabled={readOnly}
              error={false}
              label="Transporter"
              options={transporterOptions}
              value={values.transporter}
              onChange={(nextValue) =>
                setValues((current) => ({ ...current, transporter: nextValue }))
              }
            />

            <SingleSelectField
              disabled={readOnly}
              error={false}
              label="Transport Mode"
              options={transportModeOptions}
              value={values.transportMode}
              onChange={(nextValue) =>
                setValues((current) => ({ ...current, transportMode: nextValue }))
              }
            />

            <TextInputField
              disabled={readOnly}
              label="Remark"
              value={values.remark}
              onChange={(nextValue) =>
                setValues((current) => ({ ...current, remark: nextValue }))
              }
            />
          </Box>

          {hasLoadedItems ? (
            <>
              <DispatchItemsTable
                columns={dynamicItemColumns}
                readOnly={readOnly}
                rows={dispatchItemRows}
                onQuantityChange={(recordId, nextQty) => {
                  setDispatchQuantityMap((prev) => ({
                    ...prev,
                    [recordId]: nextQty,
                  }));
                }}
              />
              <DispatchSummaryTable row={dispatchSummaryRow} />
            </>
          ) : null}

          <Box
            sx={(theme) => ({
              display: "flex",
              justifyContent: "center",
              gap: theme.spacing(1.5),
              flexWrap: "wrap",
            })}
          >
            {mode === "view" ? (
              <>
                <Button
                  onClick={handleRequestBack}
                  startIcon={<ChevronLeft size={16} />}
                  sx={recordViewActionButtonSx}
                  variant="outlined"
                >
                  Back
                </Button>

                {canEdit && sourceRecord ? (
                  <Button
                    onClick={() => navigate(`/dispatch/edit/${sourceRecord.id}`)}
                    startIcon={<Pencil size={16} />}
                    sx={recordViewActionButtonSx}
                    variant="contained"
                  >
                    Edit
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() =>
                    setLeaveConfirmation({
                      open: true,
                      title: "Cancel Changes",
                      description: "Are you sure you want to cancel? Any unsaved changes will be discarded.",
                      action: () => {
                        if (window.history.length > 1) {
                          navigate(-1);
                        } else {
                          navigate("/dispatch");
                        }
                      },
                    })
                  }
                  sx={recordFormActionButtonSx}
                  variant="outlined"
                >
                  Cancel
                </Button>

                <Button
                  type="button"
                  onClick={() => {
                    setHasSubmitted(true);
                    setErrorMessage("");

                    if (!values.dispatchDate) {
                      setErrorMessage("Please enter a valid Dispatch Date.");
                      return;
                    }

                    if (!values.customerName) {
                      setErrorMessage("Please select a Customer Name.");
                      return;
                    }

                    if (loadedRecords.length === 0) {
                      setErrorMessage(
                        "Please select a Packing List and click 'Load' to include items for dispatch."
                      );
                      return;
                    }

                    const validItems = loadedRecords.filter((record) => {
                      const totalSheetsNum = parseInt(record.noOfSheets, 10) || 0;
                      const dispatchQty =
                        dispatchQuantityMap[record.id] !== undefined
                          ? dispatchQuantityMap[record.id]!
                          : totalSheetsNum;
                      return dispatchQty > 0;
                    });

                    if (validItems.length === 0) {
                      setErrorMessage(
                        "Please enter a Dispatch Quantity greater than 0 for at least one item."
                      );
                      return;
                    }

                    loadedRecords.forEach((record) => {
                      const totalSheetsNum = parseInt(record.noOfSheets, 10) || 0;
                      const dispatchQty =
                        dispatchQuantityMap[record.id] !== undefined
                          ? dispatchQuantityMap[record.id]!
                          : totalSheetsNum;

                      // Skip items with 0 dispatch quantity
                      if (dispatchQty <= 0) {
                        return;
                      }

                      const originalAmount = parseAmount(record.amount);
                      const itemAmount = totalSheetsNum > 0
                        ? (originalAmount / totalSheetsNum) * dispatchQty
                        : originalAmount;
                      const grandTotal = itemAmount * 1.18;
                      const originalSqf = parseAmount(record.sqf);
                      const dispatchSqf = totalSheetsNum > 0
                        ? ((originalSqf / totalSheetsNum) * dispatchQty).toFixed(3)
                        : record.sqf;

                      createDispatchEntry(record.id, {
                        customerName: values.customerName,
                        dispatchDate: values.dispatchDate,
                        dispatchGrandTotal: formatAmount(grandTotal),
                        dispatchTotalQuantity: String(dispatchQty),
                        dispatchTotalSqf: dispatchSqf,
                        dispatchBuyerAddress: values.buyerAddress,
                        dispatchSellerAddress: values.sellerAddress,
                        dispatchTransactionType: values.transactionType,
                        dispatchTransporter: values.transporter,
                        dispatchTransportMode: values.transportMode,
                        orderType: values.orderCategories.join(", "),
                        productCategory: values.productCategories.join(", "),
                        remark: values.remark,
                      });
                    });

                    const successMsg =
                      mode === "add"
                        ? "Dispatch created successfully."
                        : "Dispatch updated successfully.";

                    if (window.history.length > 1) {
                      navigate(-1);
                    } else {
                      navigate("/dispatch", {
                        state: {
                          dispatchFlashMessage: successMsg,
                        },
                      });
                    }
                  }}
                  startIcon={<Save size={16} />}
                  sx={recordFormActionButtonSx}
                  variant="contained"
                >
                  {mode === "add" ? "Submit" : "Save"}
                </Button>
              </>
            )}
          </Box>
        </Stack>
      </MasterSectionCard>

      <ConfirmationDialog
        cancelLabel="Stay on Page"
        confirmLabel="Leave"
        description={leaveConfirmation.description}
        onClose={() => setLeaveConfirmation((c) => ({ ...c, open: false }))}
        onConfirm={() => {
          const act = leaveConfirmation.action;
          setLeaveConfirmation((c) => ({ ...c, open: false }));
          act();
        }}
        open={leaveConfirmation.open}
        title={leaveConfirmation.title}
        tone="default"
      />
    </MasterPageShell>
  );
}

export function DispatchEditPage() {
  return <DispatchCreatePage mode="edit" />;
}

export function DispatchViewPage() {
  return <DispatchCreatePage mode="view" />;
}

function SingleSelectField({
  disabled,
  error,
  label,
  onChange,
  options,
  required,
  value,
}: {
  disabled?: boolean;
  error?: boolean;
  label: string;
  onChange: (value: string) => void;
  options: readonly string[];
  required?: boolean;
  value: string;
}) {
  const theme = useTheme();
  const normalizedOptions = uniqueStrings([value, ...options]);

  return (
    <LabeledField label={label} required={Boolean(required)}>
      <Autocomplete
        disabled={disabled}
        options={normalizedOptions}
        value={value || null}
        onChange={(_, nextValue) => onChange(nextValue ?? "")}
        renderInput={(params) => (
          <TextField
            {...params}
            error={error}
            helperText={error ? `${label} is required` : undefined}
            size="small"
            title={value.trim() ? value : undefined}
            sx={{
              ...fieldSx,
              "& .MuiInputBase-input": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props} title={option}>
            {option}
          </li>
        )}
        slotProps={{
          popper: {
            ...getAutocompletePopperSlotProps(theme, 420),
          },
          paper: {
            sx: getAutocompletePaperSx(theme),
          },
          listbox: {
            sx: getAutocompleteListboxSx(theme),
          },
        }}
      />
    </LabeledField>
  );
}

function MultiSelectField({
  disabled,
  error,
  label,
  labelAction,
  onChange,
  options,
  required,
  showAllOption = false,
  showCheckboxes = false,
  value,
}: {
  disabled?: boolean;
  error?: boolean;
  label: string;
  labelAction?: ReactNode;
  onChange: (value: string[]) => void;
  options: readonly string[];
  required?: boolean;
  showAllOption?: boolean;
  showCheckboxes?: boolean;
  value: readonly string[];
}) {
  const theme = useTheme();
  const normalizedOptions = uniqueStrings([...value, ...options]);
  const finalOptions =
    showAllOption && normalizedOptions.length > 0
      ? [ALL_OPTION, ...normalizedOptions]
      : normalizedOptions;

  return (
    <LabeledField
      label={label}
      labelAction={labelAction}
      required={Boolean(required)}
    >
      <Autocomplete
        multiple
        disabled={disabled}
        options={finalOptions}
        value={[...value]}
        onChange={(_, nextValue) => {
          if (nextValue.includes(ALL_OPTION)) {
            const isAllAlreadySelected = value.length === normalizedOptions.length;
            onChange(isAllAlreadySelected ? [] : normalizedOptions);
            return;
          }

          onChange(nextValue.filter((item) => item !== ALL_OPTION));
        }}
        renderTags={(selectedValues, getTagProps) =>
          selectedValues.map((option, index) => {
            const { key, ...tagProps } = getTagProps({ index });
            return (
              <Chip
                key={key}
                label={option}
                size="small"
                title={option}
                {...tagProps}
                sx={(currentTheme) => ({
                  height: 22,
                  maxWidth: 220,
                  borderRadius: `${currentTheme.customTokens.radius.pill}px`,
                  backgroundColor: currentTheme.customTokens.surfaces.paper,
                  color: currentTheme.customTokens.text.secondary,
                  fontSize: currentTheme.typography.caption.fontSize,
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  },
                  "& .MuiChip-deleteIcon": {
                    color: currentTheme.customTokens.neutrals[500],
                    fontSize: 15,
                  },
                })}
              />
            );
          })
        }
        renderOption={(props, option) => {
          const checked =
            option === ALL_OPTION
              ? value.length === options.length && options.length > 0
              : value.includes(option);

          return (
            <Box
              component="li"
              {...props}
              title={option}
              sx={(currentTheme) => ({
                alignItems: "flex-start",
                gap: showCheckboxes ? currentTheme.spacing(1) : 0,
                fontSize: currentTheme.typography.body2.fontSize,
                whiteSpace: "normal",
                overflowWrap: "anywhere",
                lineHeight: 1.35,
              })}
            >
              {showCheckboxes ? (
                <Checkbox
                  checked={checked}
                  size="small"
                  sx={(currentTheme) => ({
                    color: currentTheme.customTokens.neutrals[500],
                    p: 0,
                    mt: 0.25,
                    "&.Mui-checked": {
                      color: currentTheme.palette.primary.main,
                    },
                  })}
                />
              ) : null}
              {option}
            </Box>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            error={error}
            helperText={error ? `${label} is required` : undefined}
            size="small"
            sx={fieldSx}
          />
        )}
        slotProps={{
          popper: {
            ...getAutocompletePopperSlotProps(theme, 420),
          },
          paper: {
            sx: getAutocompletePaperSx(theme),
          },
          listbox: {
            sx: getAutocompleteListboxSx(theme),
          },
        }}
      />
    </LabeledField>
  );
}

function TextInputField({
  disabled,
  error,
  label,
  onChange,
  required,
  value,
}: {
  disabled?: boolean;
  error?: boolean;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <LabeledField label={label} required={Boolean(required)}>
      <TextField
        disabled={disabled}
        error={error}
        helperText={error ? `${label} is required` : undefined}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        size="small"
        sx={fieldSx}
      />
    </LabeledField>
  );
}

function LabeledField({
  children,
  label,
  labelAction,
  required = false,
}: {
  children: ReactNode;
  label: string;
  labelAction?: ReactNode;
  required?: boolean;
}) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(0.75),
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: "center",
          display: "flex",
          gap: theme.spacing(1),
          justifyContent: "space-between",
          minHeight: 24,
        })}
      >
        <Typography
          component="label"
          sx={(theme) => ({
            color: theme.customTokens.text.primary,
            fontSize: theme.typography.caption.fontSize,
            fontWeight: 700,
            lineHeight: 1.2,
          })}
        >
          {label}
        </Typography>
        {labelAction}
      </Box>
      {children}
    </Stack>
  );
}

function DispatchItemsTable({
  readOnly,
  rows,
  columns,
  onQuantityChange,
}: {
  readOnly?: boolean;
  rows: readonly DispatchItemRow[];
  columns: readonly ItemColumnConfig[];
  onQuantityChange?: (recordId: string, quantity: number) => void;
}) {
  return (
    <TableContainer sx={tableContainerSx}>
      <Table sx={{ minWidth: 3000 }}>
        <TableHead>
          <TableRow>
            {columns.map((column) => (
              <TableCell
                key={column.key}
                sx={(theme) => getHeaderCellSx(theme, column.minWidth)}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              {columns.map((column) => {
                if (column.key === "dispatchQuantity" && !readOnly && onQuantityChange) {
                  const maxQty = parseInt(row.totalQuantity, 10) || 0;
                  const currentQty = parseInt(row.dispatchQuantity, 10) || 0;
                  return (
                    <TableCell key={column.key} sx={(theme) => getBodyCellSx(theme)}>
                      <TextField
                        type="number"
                        size="small"
                        value={currentQty}
                        inputProps={{ min: 0, max: maxQty }}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          const safeVal = Number.isNaN(val) ? 0 : Math.min(Math.max(0, val), maxQty);
                          onQuantityChange(row.recordId, safeVal);
                        }}
                        sx={(theme) => ({
                          width: 100,
                          "& .MuiOutlinedInput-root": {
                            height: 28,
                            minHeight: 28,
                            borderRadius: `${theme.customTokens.radius.md}px`,
                            fontSize: "0.8125rem",
                          },
                          "& .MuiInputBase-input": {
                            py: 0.25,
                            textAlign: "center",
                          },
                        })}
                      />
                    </TableCell>
                  );
                }

                return (
                  <TableCell key={column.key} sx={(theme) => getBodyCellSx(theme)}>
                    {row[column.key]}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function DispatchSummaryTable({ row }: { row: DispatchSummaryRow }) {
  return (
    <TableContainer sx={tableContainerSx}>
      <Table sx={{ minWidth: 1400 }}>
        <TableHead>
          <TableRow>
            {summaryTableColumns.map((column) => (
              <TableCell
                key={column.key}
                sx={(theme) => getHeaderCellSx(theme, column.minWidth)}
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          <TableRow>
            {summaryTableColumns.map((column) => (
              <TableCell key={column.key} sx={(theme) => getBodyCellSx(theme)}>
                {row[column.key]}
              </TableCell>
            ))}
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function buildDispatchInitialValues(
  record: PackingRecord | undefined,
): DispatchFormState {
  if (!record) {
    return {
      dispatchDate: new Date(),
      customerName: "",
      orderCategories: [],
      productCategories: [],
      packingList: [],
      buyerAddress: "",
      sellerAddress: "",
      transactionType: "",
      transporter: "",
      transportMode: "",
      remark: "",
    };
  }

  return {
    dispatchDate: record.dispatchDate ?? new Date(),
    customerName: record.customerName,
    orderCategories: [record.orderType].filter(Boolean),
    productCategories: [record.productCategory].filter(Boolean),
    packingList: [`${record.packingId} - ${record.orderNo}`],
    buyerAddress: record.dispatchBuyerAddress ?? "",
    sellerAddress: record.dispatchSellerAddress ?? "",
    transactionType: record.dispatchTransactionType ?? transactionTypeOptions[0] ?? "",
    transporter: record.dispatchTransporter ?? getTransporterMasterOptions()[0] ?? "",
    transportMode: record.dispatchTransportMode ?? transportModeOptions[0] ?? "",
    remark: record.remark,
  };
}

function mapDispatchItemRow(
  record: PackingRecord,
  index: number,
  dispatchQty: number,
  gstMode: "intra" | "inter" | "none" = "intra",
): DispatchItemRow {
  const totalSheetsNum = parseInt(record.noOfSheets, 10) || 0;
  const originalAmount = parseAmount(record.amount);
  const originalSqm = parseAmount(record.sqm);
  const sqmPerSheet = totalSheetsNum > 0 ? originalSqm / totalSheetsNum : 0;
  const amountPerSheet = totalSheetsNum > 0 ? originalAmount / totalSheetsNum : 0;

  const currentSqm = sqmPerSheet * dispatchQty;
  const currentAmount = amountPerSheet * dispatchQty;
  const rate = currentSqm > 0 ? currentAmount / currentSqm : (originalSqm > 0 ? originalAmount / originalSqm : 0);
  const totalGstRate = gstMode === "none" ? 0 : 0.18;
  const totalGstAmount = currentAmount * totalGstRate;
  const halfGstAmount = totalGstAmount / 2;

  const cgstAmount = gstMode === "intra" ? formatAmount(halfGstAmount) : "0.00";
  const sgstAmount = gstMode === "intra" ? formatAmount(halfGstAmount) : "0.00";
  const igstAmount = gstMode === "inter" ? formatAmount(totalGstAmount) : "0.00";
  const finalAmount = currentAmount + totalGstAmount;
  const remainingQty = Math.max(0, totalSheetsNum - dispatchQty);

  return {
    id: `${record.id}-dispatch-item`,
    recordId: record.id,
    srNo: String(index + 1),
    orderNo: record.orderNo,
    salesItemName: record.itemName,
    orderItemNo: String(index + 1),
    productCategory: record.productCategory,
    groupNo: record.series || "-",
    itemName: record.itemName,
    itemSubCategory: record.grade || "-",
    length: record.length,
    width: record.width,
    thickness: record.thickness,
    totalQuantity: String(totalSheetsNum),
    dispatchQuantity: String(dispatchQty),
    remainingQuantity: String(remainingQty),
    noOfSheets: String(dispatchQty),
    sqm: formatPlainNumber(currentSqm, 3),
    rate: formatAmount(rate),
    itemAmount: formatAmount(currentAmount),
    discountPercent: "0",
    itemAmountWithDiscount: formatAmount(currentAmount),
    gstPercent: gstMode === "none" ? "0%" : "18%",
    gstAmount: formatAmount(totalGstAmount),
    cgstAmount,
    sgstAmount,
    igstAmount,
    finalAmount: formatAmount(finalAmount),
    remark: record.remark || "-",
  };
}

function buildSummaryRow(rows: readonly DispatchItemRow[]): DispatchSummaryRow {
  const totalQuantity = rows.reduce(
    (total, row) => total + parseAmount(row.noOfSheets),
    0,
  );
  const totalSqm = rows.reduce((total, row) => total + parseAmount(row.sqm), 0);
  const baseAmount = rows.reduce(
    (total, row) => total + parseAmount(row.itemAmount),
    0,
  );
  const otherAmount = 0;
  const expenseAmountWithGst = otherAmount * 1.18;
  const baseAmountWithGst = baseAmount * 1.18;
  const grandTotal = baseAmountWithGst + expenseAmountWithGst;

  return {
    totalQuantity: formatPlainNumber(totalQuantity, 0),
    totalSqm: formatPlainNumber(totalSqm, 3),
    baseAmountWithoutGst: formatAmount(baseAmount),
    otherAmount: formatAmount(otherAmount),
    expenseAmountWithGst: formatAmount(expenseAmountWithGst),
    baseAmountWithGst: formatAmount(baseAmountWithGst),
    grandTotal: formatAmount(grandTotal),
  };
}

function uniqueOptions(
  records: readonly PackingRecord[],
  key: keyof PackingRecord,
) {
  return uniqueStrings(records.map((record) => String(record[key] ?? "")));
}

function uniqueStrings(values: readonly string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseAmount(value: string) {
  return parseNumericValue(value) ?? 0;
}

function formatAmount(value: number) {
  return formatAmountShared(value);
}

function formatPlainNumber(value: number, fractionDigits: number) {
  if (fractionDigits === 0) {
    return formatQuantity(value);
  }

  if (fractionDigits === 3) {
    return formatSQM(value);
  }

  return formatAmountShared(value);
}

const fieldSx: SxProps<Theme> = (theme) => ({
  "& .MuiOutlinedInput-root": {
    border: `1px solid ${theme.customTokens.neutrals[400]}`,
    height: 34,
    minHeight: 34,
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.palette.common.white,
    boxSizing: "border-box",
    color: theme.customTokens.text.primary,
    fontSize: "0.8125rem",
    py: 0,
    "& .MuiOutlinedInput-notchedOutline": {
      border: "none",
    },
    "&:hover": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-error": {
      borderColor: theme.palette.error.main,
    },
    "&.Mui-disabled": {
      borderColor: theme.customTokens.neutrals[300],
    },
  },
  "& .MuiInputBase-input": {
    minHeight: 20,
    py: theme.spacing(0.75),
  },
  "& .MuiAutocomplete-inputRoot": {
    alignContent: "center",
    flexWrap: "nowrap",
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "none",
    "&::-webkit-scrollbar": {
      display: "none",
    },
  },
  "& .MuiAutocomplete-tag": {
    flexShrink: 0,
    maxWidth: 180,
  },
  "& .MuiFormHelperText-root": {
    fontSize: theme.typography.caption.fontSize,
    mx: 0,
  },
});

const loadButtonSx: SxProps<Theme> = (theme) => ({
  minHeight: 28,
  px: theme.spacing(1.75),
  borderRadius: `${theme.customTokens.radius.md}px`,
  backgroundColor: theme.customTokens.brand.primary,
  color: theme.customTokens.text.inverse,
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 700,
  lineHeight: 1,
  textTransform: "none",
  boxShadow: "none",
  "&:hover": {
    backgroundColor: theme.customTokens.brand.primaryScale[800],
    boxShadow: "none",
  },
  "&.Mui-disabled": {
    backgroundColor: theme.customTokens.neutrals[200],
    color: theme.customTokens.neutrals[500],
  },
});

const tableContainerSx: SxProps<Theme> = (theme) => ({
  border: `1px solid ${theme.customTokens.borders.default}`,
  borderRadius: `${theme.customTokens.radius.md}px`,
  overflowX: "auto",
  overflowY: "hidden",
  "&::-webkit-scrollbar": {
    height: 8,
  },
  "&::-webkit-scrollbar-thumb": {
    backgroundColor: theme.palette.primary.main,
    borderRadius: theme.customTokens.radius.pill,
  },
  "&::-webkit-scrollbar-track": {
    backgroundColor: theme.customTokens.surfaces.paper,
  },
});

function getHeaderCellSx(theme: Theme, minWidth: number) {
  return {
    ...transactionTableHeaderCellSx(theme, minWidth),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    "&:last-of-type": {
      borderRight: "none",
    },
  };
}

function getBodyCellSx(theme: Theme) {
  return {
    ...transactionTableBodyCellSx(theme),
    borderRight: `1px solid ${theme.customTokens.borders.divider}`,
    color: theme.customTokens.text.primary,
    "&:last-of-type": {
      borderRight: "none",
    },
  };
}
