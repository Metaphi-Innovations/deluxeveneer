import { type ReactNode, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Popover,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import { Info, Pencil, Save } from "lucide-react";
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

function isAddMode(mode: "add" | "edit" | "view") {
  return mode === "add";
}

interface DispatchFormState {
  dispatchDate: Date | null;
  customerName: string;
  productCategories: string[];
  packingList: string[];
  buyerAddress: string;
  sellerAddress: string;
  transactionType: string;
  transporter: string;
  transportMode: string;
  remark: string;
}

interface RoadDetailsState {
  vehicleNumber: string;
  driverName: string;
  driverMobileNumber: string;
}

interface AirDetailsState {
  airlineName: string;
  awbNumber: string;
  flightNumber: string;
  originAirport: string;
  destinationAirport: string;
}

interface RailDetailsState {
  rrNumber: string;
  trainNumber: string;
  containerNumber: string;
  originRailwayStation: string;
  destinationRailwayStation: string;
}

interface ShipDetailsState {
  shippingLineName: string;
  vesselName: string;
  voyageNumber: string;
  billOfLadingNumber: string;
  blDate: Date | null;
  containerNumber: string;
  containerType: string;
  sealNumber: string;
  portOfLoading: string;
  portOfDischarge: string;
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
  sqf: string;
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
  subTotalNum: number;
  cgstNum: number;
  sgstNum: number;
  igstNum: number;
  taxableAmountNum: number;
  totalNum: number;
  otherAmountNum: number;
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
  { key: "groupNo", label: "Group No", minWidth: 120 },
  { key: "itemName", label: "Item Name", minWidth: 180 },
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
const emptyRoadDetails: RoadDetailsState = {
  vehicleNumber: "",
  driverName: "",
  driverMobileNumber: "",
};
const emptyAirDetails: AirDetailsState = {
  airlineName: "",
  awbNumber: "",
  flightNumber: "",
  originAirport: "",
  destinationAirport: "",
};
const emptyRailDetails: RailDetailsState = {
  rrNumber: "",
  trainNumber: "",
  containerNumber: "",
  originRailwayStation: "",
  destinationRailwayStation: "",
};
const emptyShipDetails: ShipDetailsState = {
  shippingLineName: "",
  vesselName: "",
  voyageNumber: "",
  billOfLadingNumber: "",
  blDate: null,
  containerNumber: "",
  containerType: "",
  sealNumber: "",
  portOfLoading: "",
  portOfDischarge: "",
};
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
    () => records.filter((record) => record.packingState === "dispatchIssued"),
    [records],
  );
  const [values, setValues] = useState<DispatchFormState>(() =>
    buildDispatchInitialValues(sourceRecord),
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [roadDetails, setRoadDetails] = useState<RoadDetailsState>(emptyRoadDetails);
  const [airDetails, setAirDetails] = useState<AirDetailsState>(emptyAirDetails);
  const [railDetails, setRailDetails] = useState<RailDetailsState>(emptyRailDetails);
  const [shipDetails, setShipDetails] = useState<ShipDetailsState>(emptyShipDetails);
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
  const productCategoryOptions = useMemo(
    () =>
      uniqueStrings(
        dispatchSourceRecords
          .filter((record) =>
            values.customerName ? record.customerName === values.customerName : true,
          )
          .map((record) => record.productCategory),
      ),
    [dispatchSourceRecords, values.customerName],
  );
  const canSelectPackingList =
    values.customerName.trim().length > 0 &&
    values.productCategories.length > 0;
  const packingListRecords = useMemo(
    () =>
      canSelectPackingList
        ? dispatchSourceRecords.filter(
          (record) =>
            record.customerName === values.customerName &&
            values.productCategories.includes(record.productCategory),
        )
        : [],
    [
      canSelectPackingList,
      dispatchSourceRecords,
      values.customerName,
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
  const createPackingListRecords = useMemo(
    () =>
      values.customerName
        ? dispatchSourceRecords.filter(
          (record) => record.customerName === values.customerName,
        )
        : [],
    [dispatchSourceRecords, values.customerName],
  );
  const createPackingListOptions = useMemo(
    () =>
      uniqueStrings(
        createPackingListRecords.map(
          (record) => `${record.packingId} - ${record.orderNo}`,
        ),
      ),
    [createPackingListRecords],
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
      .catch(() => { });
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
  const createItemColumns = useMemo(
    () =>
      dynamicItemColumns.flatMap((column) =>
        column.key === "sqm"
          ? [column, { key: "sqf" as const, label: "SQF", minWidth: 110 }]
          : [column],
      ),
    [dynamicItemColumns],
  );

  const dispatchSummaryRow = useMemo(
    () => buildSummaryRow(dispatchItemRows, gstMode),
    [dispatchItemRows, gstMode],
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

  const handleLoadPackingLists = () => {
    const selectedRecords = createPackingListRecords.filter((record) =>
      values.packingList.includes(`${record.packingId} - ${record.orderNo}`),
    );
    setLoadedRecords(selectedRecords);
    const initialQtyMap: Record<string, number> = {};
    selectedRecords.forEach((record) => {
      initialQtyMap[record.id] = parseInt(record.noOfSheets, 10) || 0;
    });
    setDispatchQuantityMap(initialQtyMap);
    setErrorMessage("");
  };

  const handleSubmit = () => {
    if (isSubmitting) return;

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
        "Please select a Packing List and click 'Load' to include items for dispatch.",
      );
      return;
    }

    if (
      mode === "add" &&
      values.transportMode === "Road" &&
      getDriverMobileValidationError(roadDetails.driverMobileNumber)
    ) {
      setErrorMessage(getDriverMobileValidationError(roadDetails.driverMobileNumber));
      return;
    }

    if (
      mode === "add" &&
      values.transportMode === "Ship" &&
      !isValidOptionalDate(shipDetails.blDate)
    ) {
      setErrorMessage("Please enter a valid BL Date.");
      return;
    }

    const activeTransportDetails =
      mode === "add"
        ? buildActiveTransportDetails(
          values.transportMode,
          roadDetails,
          airDetails,
          railDetails,
          shipDetails,
        )
        : null;

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
        "Please enter a Dispatch Quantity greater than 0 for at least one item.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      loadedRecords.forEach((record) => {
        const totalSheetsNum = parseInt(record.noOfSheets, 10) || 0;
        const dispatchQty =
          dispatchQuantityMap[record.id] !== undefined
            ? dispatchQuantityMap[record.id]!
            : totalSheetsNum;

        if (dispatchQty <= 0) return;

        const originalAmount = parseAmount(record.amount);
        const itemAmount =
          totalSheetsNum > 0
            ? (originalAmount / totalSheetsNum) * dispatchQty
            : originalAmount;
        const grandTotal = itemAmount * 1.18;
        const originalSqf = parseAmount(record.sqf);
        const dispatchSqf =
          totalSheetsNum > 0
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
          orderType: record.orderType,
          productCategory: record.productCategory,
          remark: values.remark,
          ...(activeTransportDetails
            ? { dispatchTransportDetails: activeTransportDetails }
            : {}),
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
          state: { dispatchFlashMessage: successMsg },
        });
      }
    } catch {
      setIsSubmitting(false);
      setErrorMessage("Unable to save the dispatch. Please try again.");
    }
  };

  if (isAddMode(mode)) {
    return (
      <MasterPageShell
        backNav={{ label: "Back to Dispatch", to: "/dispatch", onBack: handleRequestBack }}
        breadcrumbs={[
          { label: "Dispatch", to: "/dispatch" },
          { label: pageLabel },
        ]}
        title={pageLabel}
      >
        <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
          {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

          <MasterSectionCard>
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              <FormSectionHeader title="Dispatch Details" />
              <Box sx={dispatchDetailsGridSx}>
                <LabeledField label="Dispatch Date *">
                  <ErpDatePickerField
                    helperText={hasSubmitted && !values.dispatchDate ? "Dispatch Date is required." : ""}
                    onChange={(dispatchDate) => {
                      setErrorMessage("");
                      setValues((current) => ({ ...current, dispatchDate }));
                    }}
                    state={hasSubmitted && !values.dispatchDate ? "error" : "default"}
                    value={values.dispatchDate}
                  />
                </LabeledField>

                <SingleSelectField
                  error={hasSubmitted && !values.customerName}
                  label="Customer Name *"
                  options={customerOptions}
                  value={values.customerName}
                  onChange={(customerName) => {
                    setErrorMessage("");
                    setValues((current) => ({
                      ...current,
                      customerName,
                      productCategories: [],
                      packingList: [],
                    }));
                    setLoadedRecords([]);
                    setDispatchQuantityMap({});
                  }}
                />

                <MultiSelectField
                  disabled={!values.customerName}
                  error={hasSubmitted && loadedRecords.length === 0}
                  label="Packing List *"
                  options={createPackingListOptions}
                  showAllOption
                  showCheckboxes
                  value={values.packingList}
                  onChange={(packingList) => {
                    setValues((current) => ({ ...current, packingList }));
                    setLoadedRecords([]);
                    setDispatchQuantityMap({});
                  }}
                />
                <Button
                  disabled={values.packingList.length === 0}
                  onClick={handleLoadPackingLists}
                  sx={createLoadButtonSx}
                  variant="contained"
                >
                  Load
                </Button>
              </Box>

              {!values.customerName ? (
                <Typography sx={compactHintSx}>
                  Select a customer to view eligible packing lists.
                </Typography>
              ) : createPackingListOptions.length === 0 ? (
                <Typography sx={compactHintSx}>
                  No eligible packing items are available for this selection.
                </Typography>
              ) : null}
            </Stack>
          </MasterSectionCard>

          <MasterSectionCard>
            <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
              <FormSectionHeader title="Buyer & Shipping Information" />
              <Box sx={buyerShippingGridSx}>
                <TextInputField
                  label="Address of Buyer"
                  value={values.buyerAddress}
                  onChange={(buyerAddress) =>
                    setValues((current) => ({ ...current, buyerAddress }))
                  }
                />
                <TextInputField
                  label="Address of Seller"
                  value={values.sellerAddress}
                  onChange={(sellerAddress) =>
                    setValues((current) => ({ ...current, sellerAddress }))
                  }
                />
                <SingleSelectField
                  error={false}
                  label="Transaction Type"
                  options={transactionTypeOptions}
                  value={values.transactionType}
                  onChange={(transactionType) =>
                    setValues((current) => ({ ...current, transactionType }))
                  }
                />
                <SingleSelectField
                  error={false}
                  label="Transporter"
                  options={transporterOptions}
                  value={values.transporter}
                  onChange={(transporter) =>
                    setValues((current) => ({ ...current, transporter }))
                  }
                />
                <SingleSelectField
                  error={false}
                  label="Transport Mode"
                  options={transportModeOptions}
                  value={values.transportMode}
                  onChange={(transportMode) => {
                    setErrorMessage("");
                    setValues((current) => ({ ...current, transportMode }));
                  }}
                />
                <TextInputField
                  label="Remark"
                  value={values.remark}
                  onChange={(remark) => setValues((current) => ({ ...current, remark }))}
                />
              </Box>
            </Stack>
          </MasterSectionCard>

          {values.transportMode ? (
            <MasterSectionCard>
              <Stack sx={(theme) => ({ gap: theme.spacing(1.5) })}>
                <FormSectionHeader title="Transport Details" />
                <Box
                  sx={
                    values.transportMode === "Ship" ||
                      values.transportMode === "Air" ||
                      values.transportMode === "Rail"
                      ? fiveColumnTransportDetailsGridSx
                      : transportDetailsGridSx
                  }
                >
                  {values.transportMode === "Road" ? (
                    <>
                      <TextInputField label="Vehicle Number" value={roadDetails.vehicleNumber} onChange={(vehicleNumber) => setRoadDetails((current) => ({ ...current, vehicleNumber }))} />
                      <TextInputField label="Driver Name" value={roadDetails.driverName} onChange={(driverName) => setRoadDetails((current) => ({ ...current, driverName }))} />
                      <TextInputField
                        error={Boolean(hasSubmitted && getDriverMobileValidationError(roadDetails.driverMobileNumber))}
                        helperText={hasSubmitted ? getDriverMobileValidationError(roadDetails.driverMobileNumber) : ""}
                        label="Driver Mobile Number"
                        type="tel"
                        value={roadDetails.driverMobileNumber}
                        onChange={(driverMobileNumber) => {
                          setErrorMessage("");
                          setRoadDetails((current) => ({ ...current, driverMobileNumber }));
                        }}
                      />
                    </>
                  ) : null}
                  {values.transportMode === "Air" ? (
                    <>
                      <TextInputField label="Airline Name" value={airDetails.airlineName} onChange={(airlineName) => setAirDetails((current) => ({ ...current, airlineName }))} />
                      <TextInputField label="AWB Number" value={airDetails.awbNumber} onChange={(awbNumber) => setAirDetails((current) => ({ ...current, awbNumber }))} />
                      <TextInputField label="Flight Number" value={airDetails.flightNumber} onChange={(flightNumber) => setAirDetails((current) => ({ ...current, flightNumber }))} />
                      <TextInputField label="Origin Airport" value={airDetails.originAirport} onChange={(originAirport) => setAirDetails((current) => ({ ...current, originAirport }))} />
                      <TextInputField label="Destination Airport" value={airDetails.destinationAirport} onChange={(destinationAirport) => setAirDetails((current) => ({ ...current, destinationAirport }))} />
                    </>
                  ) : null}
                  {values.transportMode === "Rail" ? (
                    <>
                      <TextInputField label="RR Number" value={railDetails.rrNumber} onChange={(rrNumber) => setRailDetails((current) => ({ ...current, rrNumber }))} />
                      <TextInputField label="Train Number" value={railDetails.trainNumber} onChange={(trainNumber) => setRailDetails((current) => ({ ...current, trainNumber }))} />
                      <TextInputField label="Container Number" value={railDetails.containerNumber} onChange={(containerNumber) => setRailDetails((current) => ({ ...current, containerNumber }))} />
                      <TextInputField label="Origin Railway Station" value={railDetails.originRailwayStation} onChange={(originRailwayStation) => setRailDetails((current) => ({ ...current, originRailwayStation }))} />
                      <TextInputField label="Destination Railway Station" value={railDetails.destinationRailwayStation} onChange={(destinationRailwayStation) => setRailDetails((current) => ({ ...current, destinationRailwayStation }))} />
                    </>
                  ) : null}
                  {values.transportMode === "Ship" ? (
                    <>
                      <TextInputField label="Shipping Line Name" value={shipDetails.shippingLineName} onChange={(shippingLineName) => setShipDetails((current) => ({ ...current, shippingLineName }))} />
                      <TextInputField label="Vessel Name" value={shipDetails.vesselName} onChange={(vesselName) => setShipDetails((current) => ({ ...current, vesselName }))} />
                      <TextInputField label="Voyage Number" value={shipDetails.voyageNumber} onChange={(voyageNumber) => setShipDetails((current) => ({ ...current, voyageNumber }))} />
                      <TextInputField label="Bill of Lading (BL) Number" value={shipDetails.billOfLadingNumber} onChange={(billOfLadingNumber) => setShipDetails((current) => ({ ...current, billOfLadingNumber }))} />
                      <LabeledField label="BL Date">
                        <ErpDatePickerField
                          helperText={hasSubmitted && !isValidOptionalDate(shipDetails.blDate) ? "Enter a valid BL Date." : ""}
                          onChange={(blDate) => {
                            setErrorMessage("");
                            setShipDetails((current) => ({ ...current, blDate }));
                          }}
                          state={hasSubmitted && !isValidOptionalDate(shipDetails.blDate) ? "error" : "default"}
                          value={shipDetails.blDate}
                        />
                      </LabeledField>
                      <TextInputField label="Container Number" value={shipDetails.containerNumber} onChange={(containerNumber) => setShipDetails((current) => ({ ...current, containerNumber }))} />
                      <TextInputField label="Container Type" value={shipDetails.containerType} onChange={(containerType) => setShipDetails((current) => ({ ...current, containerType }))} />
                      <TextInputField label="Seal Number" value={shipDetails.sealNumber} onChange={(sealNumber) => setShipDetails((current) => ({ ...current, sealNumber }))} />
                      <TextInputField label="Port of Loading" value={shipDetails.portOfLoading} onChange={(portOfLoading) => setShipDetails((current) => ({ ...current, portOfLoading }))} />
                      <TextInputField label="Port of Discharge" value={shipDetails.portOfDischarge} onChange={(portOfDischarge) => setShipDetails((current) => ({ ...current, portOfDischarge }))} />
                    </>
                  ) : null}
                </Box>
              </Stack>
            </MasterSectionCard>
          ) : null}

          <MasterSectionCard>
            <Stack sx={(theme) => ({ gap: theme.spacing(1.25) })}>
              <FormSectionHeader
                title="Dispatch Items"
                endAdornment={hasLoadedItems ? <Chip label={`${dispatchItemRows.length} ${dispatchItemRows.length === 1 ? "item" : "items"}`} size="small" sx={itemCountChipSx} /> : null}
              />
              <Typography sx={sectionSubtitleSx}>
                Items loaded from the selected packing list.
              </Typography>
              {hasLoadedItems ? (
                <DispatchItemsTable
                  columns={createItemColumns}
                  rows={dispatchItemRows}
                  onQuantityChange={(recordId, nextQty) => {
                    setDispatchQuantityMap((current) => ({ ...current, [recordId]: nextQty }));
                  }}
                />
              ) : (
                <Box sx={emptyStateSx}>
                  Select a packing list and click Load to view dispatch items.
                </Box>
              )}
            </Stack>
          </MasterSectionCard>

          {hasLoadedItems ? (
            <Box sx={dispatchSummaryPlacementSx}>
              <DispatchSummaryCards
                gstMode={gstMode}
                row={dispatchSummaryRow}
              />
            </Box>
          ) : null}

          <Box sx={stickyActionBarSx}>
            <Button
              disabled={isSubmitting}
              onClick={() =>
                setLeaveConfirmation({
                  open: true,
                  title: "Cancel Changes",
                  description: "Are you sure you want to cancel? Any unsaved changes will be discarded.",
                  action: handleRequestBack,
                })
              }
              sx={recordFormActionButtonSx}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              disabled={isSubmitting}
              onClick={handleSubmit}
              startIcon={isSubmitting ? <CircularProgress color="inherit" size={16} /> : <Save size={16} />}
              sx={recordFormActionButtonSx}
              variant="contained"
            >
              {isSubmitting ? "Submitting..." : "Submit"}
            </Button>
          </Box>
        </Stack>

        <ConfirmationDialog
          cancelLabel="Stay on Page"
          confirmLabel="Leave"
          description={leaveConfirmation.description}
          onClose={() => setLeaveConfirmation((current) => ({ ...current, open: false }))}
          onConfirm={() => {
            const action = leaveConfirmation.action;
            setLeaveConfirmation((current) => ({ ...current, open: false }));
            action();
          }}
          open={leaveConfirmation.open}
          title={leaveConfirmation.title}
          tone="default"
        />
      </MasterPageShell>
    );
  }

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
                  productCategories: [],
                  packingList: [],
                }));
              }}
            />

            <MultiSelectField
              disabled={readOnly || !values.customerName}
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
              onChange={(nextValue) => {
                setErrorMessage("");
                setValues((current) => ({ ...current, transportMode: nextValue }))
              }}
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

          {false && values.transportMode ? (
            <>
              <FormSectionHeader title="Transport Details" variant="nested" />
              <Box sx={transportDetailsGridSx}>
                {values.transportMode === "Road" ? (
                  <>
                    <TextInputField
                      label="Vehicle Number"
                      value={roadDetails.vehicleNumber}
                      onChange={(vehicleNumber) =>
                        setRoadDetails((current) => ({ ...current, vehicleNumber }))
                      }
                    />
                    <TextInputField
                      label="Driver Name"
                      value={roadDetails.driverName}
                      onChange={(driverName) =>
                        setRoadDetails((current) => ({ ...current, driverName }))
                      }
                    />
                    <TextInputField
                      error={Boolean(
                        hasSubmitted &&
                        getDriverMobileValidationError(roadDetails.driverMobileNumber),
                      )}
                      helperText={
                        hasSubmitted
                          ? getDriverMobileValidationError(roadDetails.driverMobileNumber)
                          : ""
                      }
                      label="Driver Mobile Number"
                      type="tel"
                      value={roadDetails.driverMobileNumber}
                      onChange={(driverMobileNumber) => {
                        setErrorMessage("");
                        setRoadDetails((current) => ({ ...current, driverMobileNumber }));
                      }}
                    />
                  </>
                ) : null}

                {values.transportMode === "Air" ? (
                  <>
                    <TextInputField
                      label="Airline Name"
                      value={airDetails.airlineName}
                      onChange={(airlineName) =>
                        setAirDetails((current) => ({ ...current, airlineName }))
                      }
                    />
                    <TextInputField
                      label="AWB Number"
                      value={airDetails.awbNumber}
                      onChange={(awbNumber) =>
                        setAirDetails((current) => ({ ...current, awbNumber }))
                      }
                    />
                    <TextInputField
                      label="Flight Number"
                      value={airDetails.flightNumber}
                      onChange={(flightNumber) =>
                        setAirDetails((current) => ({ ...current, flightNumber }))
                      }
                    />
                    <TextInputField
                      label="Origin Airport"
                      value={airDetails.originAirport}
                      onChange={(originAirport) =>
                        setAirDetails((current) => ({ ...current, originAirport }))
                      }
                    />
                    <TextInputField
                      label="Destination Airport"
                      value={airDetails.destinationAirport}
                      onChange={(destinationAirport) =>
                        setAirDetails((current) => ({ ...current, destinationAirport }))
                      }
                    />
                  </>
                ) : null}

                {values.transportMode === "Rail" ? (
                  <>
                    <TextInputField
                      label="RR Number"
                      value={railDetails.rrNumber}
                      onChange={(rrNumber) =>
                        setRailDetails((current) => ({ ...current, rrNumber }))
                      }
                    />
                    <TextInputField
                      label="Train Number"
                      value={railDetails.trainNumber}
                      onChange={(trainNumber) =>
                        setRailDetails((current) => ({ ...current, trainNumber }))
                      }
                    />
                    <TextInputField
                      label="Container Number"
                      value={railDetails.containerNumber}
                      onChange={(containerNumber) =>
                        setRailDetails((current) => ({ ...current, containerNumber }))
                      }
                    />
                    <TextInputField
                      label="Origin Railway Station"
                      value={railDetails.originRailwayStation}
                      onChange={(originRailwayStation) =>
                        setRailDetails((current) => ({ ...current, originRailwayStation }))
                      }
                    />
                    <TextInputField
                      label="Destination Railway Station"
                      value={railDetails.destinationRailwayStation}
                      onChange={(destinationRailwayStation) =>
                        setRailDetails((current) => ({ ...current, destinationRailwayStation }))
                      }
                    />
                  </>
                ) : null}

                {values.transportMode === "Ship" ? (
                  <>
                    <TextInputField
                      label="Shipping Line Name"
                      value={shipDetails.shippingLineName}
                      onChange={(shippingLineName) =>
                        setShipDetails((current) => ({ ...current, shippingLineName }))
                      }
                    />
                    <TextInputField
                      label="Vessel Name"
                      value={shipDetails.vesselName}
                      onChange={(vesselName) =>
                        setShipDetails((current) => ({ ...current, vesselName }))
                      }
                    />
                    <TextInputField
                      label="Voyage Number"
                      value={shipDetails.voyageNumber}
                      onChange={(voyageNumber) =>
                        setShipDetails((current) => ({ ...current, voyageNumber }))
                      }
                    />
                    <TextInputField
                      label="Bill of Lading (BL) Number"
                      value={shipDetails.billOfLadingNumber}
                      onChange={(billOfLadingNumber) =>
                        setShipDetails((current) => ({ ...current, billOfLadingNumber }))
                      }
                    />
                    <LabeledField label="BL Date">
                      <ErpDatePickerField
                        helperText={
                          hasSubmitted && !isValidOptionalDate(shipDetails.blDate)
                            ? "Enter a valid BL Date."
                            : ""
                        }
                        onChange={(blDate) => {
                          setErrorMessage("");
                          setShipDetails((current) => ({ ...current, blDate }));
                        }}
                        state={
                          hasSubmitted && !isValidOptionalDate(shipDetails.blDate)
                            ? "error"
                            : "default"
                        }
                        value={shipDetails.blDate}
                      />
                    </LabeledField>
                    <TextInputField
                      label="Container Number"
                      value={shipDetails.containerNumber}
                      onChange={(containerNumber) =>
                        setShipDetails((current) => ({ ...current, containerNumber }))
                      }
                    />
                    <TextInputField
                      label="Container Type"
                      value={shipDetails.containerType}
                      onChange={(containerType) =>
                        setShipDetails((current) => ({ ...current, containerType }))
                      }
                    />
                    <TextInputField
                      label="Seal Number"
                      value={shipDetails.sealNumber}
                      onChange={(sealNumber) =>
                        setShipDetails((current) => ({ ...current, sealNumber }))
                      }
                    />
                    <TextInputField
                      label="Port of Loading"
                      value={shipDetails.portOfLoading}
                      onChange={(portOfLoading) =>
                        setShipDetails((current) => ({ ...current, portOfLoading }))
                      }
                    />
                    <TextInputField
                      label="Port of Discharge"
                      value={shipDetails.portOfDischarge}
                      onChange={(portOfDischarge) =>
                        setShipDetails((current) => ({ ...current, portOfDischarge }))
                      }
                    />
                  </>
                ) : null}
              </Box>
            </>
          ) : null}

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

                    if (
                      false &&
                      values.transportMode === "Road" &&
                      getDriverMobileValidationError(roadDetails.driverMobileNumber)
                    ) {
                      setErrorMessage(
                        getDriverMobileValidationError(roadDetails.driverMobileNumber),
                      );
                      return;
                    }

                    if (
                      false &&
                      values.transportMode === "Ship" &&
                      !isValidOptionalDate(shipDetails.blDate)
                    ) {
                      setErrorMessage("Please enter a valid BL Date.");
                      return;
                    }

                    const activeTransportDetails =
                      false
                        ? buildActiveTransportDetails(
                          values.transportMode,
                          roadDetails,
                          airDetails,
                          railDetails,
                          shipDetails,
                        )
                        : null;

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

                      const dispatchPayload = {
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
                        orderType: record.orderType,
                        productCategory: values.productCategories.join(", "),
                        remark: values.remark,
                        // Future API/store mapping: the current frontend store does not
                        // persist this field yet, but only the active mode is submitted.
                        ...(activeTransportDetails
                          ? { dispatchTransportDetails: activeTransportDetails }
                          : {}),
                      };

                      createDispatchEntry(record.id, dispatchPayload);
                    });

                    const successMsg =
                      false
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
                  Save
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
  helperText,
  label,
  onChange,
  required,
  type,
  value,
}: {
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  type?: string;
  value: string;
}) {
  return (
    <LabeledField label={label} required={Boolean(required)}>
      <TextField
        disabled={disabled}
        error={error}
        helperText={helperText || (error ? `${label} is required` : undefined)}
        type={type}
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
  const [popoverAnchor, setPopoverAnchor] = useState<{
    element: HTMLElement;
    row: DispatchItemRow;
  } | null>(null);

  const activeRow = popoverAnchor?.row;

  return (
    <TableContainer sx={tableContainerSx}>
      <Table sx={{ minWidth: 1800 }}>
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

                if (column.key === "orderItemNo") {
                  return (
                    <TableCell key={column.key} sx={(theme) => getBodyCellSx(theme)}>
                      <Box sx={{ display: "inline-flex", alignItems: "center", gap: 0.75 }}>
                        <Typography component="span" sx={{ fontSize: "inherit", fontWeight: "inherit" }}>
                          {row.orderItemNo}
                        </Typography>
                        <Tooltip title="View item details">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPopoverAnchor({
                                element: e.currentTarget,
                                row,
                              });
                            }}
                            sx={(theme) => ({
                              p: 0.35,
                              borderRadius: `${theme.customTokens.radius.sm}px`,
                              color: theme.customTokens.brand.primary,
                              backgroundColor: `${theme.customTokens.brand.primary}12`,
                              border: `1px solid ${theme.customTokens.brand.primary}25`,
                              "&:hover": {
                                backgroundColor: `${theme.customTokens.brand.primary}22`,
                              },
                            })}
                          >
                            <Info size={14} />
                          </IconButton>
                        </Tooltip>
                      </Box>
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

      <Popover
        open={Boolean(popoverAnchor)}
        anchorEl={popoverAnchor?.element}
        onClose={() => setPopoverAnchor(null)}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "left",
        }}
        transformOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        PaperProps={{
          sx: (theme) => ({
            mt: 0.5,
            p: 1.75,
            minWidth: 320,
            maxWidth: 380,
            borderRadius: `${theme.customTokens.radius.md}px`,
            border: `1px solid ${theme.customTokens.borders.default}`,
            backgroundColor: theme.customTokens.surfaces.surface,
            boxShadow: theme.shadows[3],
          }),
        }}
      >
        {activeRow ? (
          <Stack spacing={1.25}>
            <Box sx={{ pb: 0.75, borderBottom: (theme) => `1px solid ${theme.customTokens.borders.default}` }}>
              <Typography variant="caption" sx={(theme) => ({ color: theme.customTokens.text.secondary, textTransform: "uppercase", fontWeight: 600, letterSpacing: "0.04em", fontSize: "0.6875rem" })}>
                Order Item #{activeRow.orderItemNo}
              </Typography>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, fontSize: "0.875rem" }}>
                {activeRow.itemName}
              </Typography>
            </Box>

            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                rowGap: 1,
                columnGap: 2,
                fontSize: "0.8125rem",
              }}
            >
              <Box>
                <Typography variant="caption" sx={(theme) => ({ color: theme.customTokens.text.secondary, display: "block" })}>
                  Order No
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                  {activeRow.orderNo}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={(theme) => ({ color: theme.customTokens.text.secondary, display: "block" })}>
                  Sales Item Name
                </Typography>
                <Typography sx={{ fontWeight: 600, fontSize: "0.8125rem" }}>
                  {activeRow.salesItemName}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={(theme) => ({ color: theme.customTokens.text.secondary, display: "block" })}>
                  Product Category
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                  {activeRow.productCategory || "-"}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" sx={(theme) => ({ color: theme.customTokens.text.secondary, display: "block" })}>
                  Group No / Series
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: "0.8125rem" }}>
                  {activeRow.groupNo || "-"}
                </Typography>
              </Box>
            </Box>
          </Stack>
        ) : null}
      </Popover>
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

function DispatchSummaryCards({
  row,
  gstMode = "intra",
}: {
  row: DispatchSummaryRow;
  gstMode?: "intra" | "inter" | "none";
}) {
  const theme = useTheme();

  return (
    <Box
      sx={{
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: `${theme.customTokens.radius.md}px`,
        backgroundColor: theme.customTokens.surfaces.alt,
        px: theme.spacing(2),
        py: theme.spacing(1.5),
        width: { xs: "100%", sm: 380 },
        maxWidth: "100%",
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          mb: 1,
          fontSize: "0.75rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          color: theme.customTokens.text.secondary,
        }}
      >
        INVOICE TOTALS
      </Typography>

      <Stack spacing={0.75}>
        <SummaryLine
          label="Total Quantity"
          valueText={row.totalQuantity}
        />
        <SummaryLine
          label="Total SQM"
          valueText={row.totalSqm}
        />
        <SummaryLine
          label="Sub Total"
          value={row.subTotalNum}
        />
        {row.otherAmountNum > 0 ? (
          <SummaryLine
            label="Additional Charges"
            value={row.otherAmountNum}
          />
        ) : null}
        <SummaryLine
          label="Taxable Amount"
          value={row.taxableAmountNum}
        />
        {gstMode === "intra" ? (
          <>
            <SummaryLine
              label="CGST (9%)"
              value={row.cgstNum}
            />
            <SummaryLine
              label="SGST (9%)"
              value={row.sgstNum}
            />
          </>
        ) : gstMode === "inter" ? (
          <SummaryLine
            label="IGST (18%)"
            value={row.igstNum}
          />
        ) : null}
        <Divider sx={{ borderColor: theme.customTokens.borders.default }} />
        <SummaryLine
          emphasize
          label="Total"
          value={row.totalNum}
        />
      </Stack>
    </Box>
  );
}

function SummaryLine({
  emphasize = false,
  label,
  value,
  valueText,
}: {
  emphasize?: boolean;
  label: string;
  value?: number;
  valueText?: string;
}) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
      }}
    >
      <Typography
        sx={(theme) => ({
          fontSize: emphasize ? "0.875rem" : "0.8125rem",
          fontWeight: emphasize ? 700 : 500,
          color: emphasize
            ? theme.palette.text.primary
            : theme.customTokens.text.secondary,
        })}
      >
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: emphasize ? "0.875rem" : "0.8125rem",
          fontWeight: emphasize ? 700 : 600,
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {valueText !== undefined ? valueText : formatAmount(value ?? 0)}
      </Typography>
    </Box>
  );
}

function getDriverMobileValidationError(value: string): string {
  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return "";
  }

  const digitCount = (trimmedValue.match(/\d/g) ?? []).length;
  const hasValidCharacters = /^\+?[0-9().\-\s]+$/.test(trimmedValue);
  if (!hasValidCharacters || digitCount < 6 || digitCount > 15) {
    return "Enter a valid Driver Mobile Number.";
  }

  return "";
}

function isValidOptionalDate(value: Date | null): boolean {
  return value === null || (value instanceof Date && !Number.isNaN(value.getTime()));
}

function buildActiveTransportDetails(
  transportMode: string,
  roadDetails: RoadDetailsState,
  airDetails: AirDetailsState,
  railDetails: RailDetailsState,
  shipDetails: ShipDetailsState,
) {
  if (transportMode === "Road") {
    return {
      vehicleNumber: roadDetails.vehicleNumber.trim(),
      driverName: roadDetails.driverName.trim(),
      driverMobileNumber: roadDetails.driverMobileNumber.trim(),
    };
  }

  if (transportMode === "Air") {
    return {
      airlineName: airDetails.airlineName.trim(),
      awbNumber: airDetails.awbNumber.trim(),
      flightNumber: airDetails.flightNumber.trim(),
      originAirport: airDetails.originAirport.trim(),
      destinationAirport: airDetails.destinationAirport.trim(),
    };
  }

  if (transportMode === "Rail") {
    return {
      rrNumber: railDetails.rrNumber.trim(),
      trainNumber: railDetails.trainNumber.trim(),
      containerNumber: railDetails.containerNumber.trim(),
      originRailwayStation: railDetails.originRailwayStation.trim(),
      destinationRailwayStation: railDetails.destinationRailwayStation.trim(),
    };
  }

  if (transportMode === "Ship") {
    return {
      shippingLineName: shipDetails.shippingLineName.trim(),
      vesselName: shipDetails.vesselName.trim(),
      voyageNumber: shipDetails.voyageNumber.trim(),
      billOfLadingNumber: shipDetails.billOfLadingNumber.trim(),
      blDate: shipDetails.blDate,
      containerNumber: shipDetails.containerNumber.trim(),
      containerType: shipDetails.containerType.trim(),
      sealNumber: shipDetails.sealNumber.trim(),
      portOfLoading: shipDetails.portOfLoading.trim(),
      portOfDischarge: shipDetails.portOfDischarge.trim(),
    };
  }

  return null;
}

function buildDispatchInitialValues(
  record: PackingRecord | undefined,
): DispatchFormState {
  if (!record) {
    return {
      dispatchDate: new Date(),
      customerName: "",
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
  const originalSqf = parseAmount(record.sqf);
  const sqmPerSheet = totalSheetsNum > 0 ? originalSqm / totalSheetsNum : 0;
  const sqfPerSheet = totalSheetsNum > 0 ? originalSqf / totalSheetsNum : 0;
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
    sqf: formatPlainNumber(sqfPerSheet * dispatchQty, 3),
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

function buildSummaryRow(
  rows: readonly DispatchItemRow[],
  gstMode: "intra" | "inter" | "none" = "intra",
): DispatchSummaryRow {
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
  const taxableAmount = baseAmount + otherAmount;
  const totalGstRate = gstMode === "none" ? 0 : 0.18;
  const totalGstAmount = taxableAmount * totalGstRate;
  const halfGstAmount = totalGstAmount / 2;
  const cgst = gstMode === "intra" ? halfGstAmount : 0;
  const sgst = gstMode === "intra" ? halfGstAmount : 0;
  const igst = gstMode === "inter" ? totalGstAmount : 0;
  const grandTotal = taxableAmount + totalGstAmount;

  return {
    totalQuantity: formatPlainNumber(totalQuantity, 0),
    totalSqm: formatPlainNumber(totalSqm, 3),
    baseAmountWithoutGst: formatAmount(baseAmount),
    otherAmount: formatAmount(otherAmount),
    expenseAmountWithGst: formatAmount(otherAmount * 1.18),
    baseAmountWithGst: formatAmount(taxableAmount + totalGstAmount),
    grandTotal: formatAmount(grandTotal),
    subTotalNum: baseAmount,
    cgstNum: cgst,
    sgstNum: sgst,
    igstNum: igst,
    taxableAmountNum: taxableAmount,
    totalNum: grandTotal,
    otherAmountNum: otherAmount,
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

const transportDetailsGridSx: SxProps<Theme> = (theme) => ({
  alignItems: "start",
  display: "grid",
  gap: theme.spacing(1.25),
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
});

const fiveColumnTransportDetailsGridSx: SxProps<Theme> = (theme) => ({
  alignItems: "start",
  display: "grid",
  gap: theme.spacing(1.25),
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(5, minmax(0, 1fr))",
  },
});

const dispatchDetailsGridSx: SxProps<Theme> = (theme) => ({
  alignItems: "end",
  display: "grid",
  gap: theme.spacing(1.25),
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(3, minmax(0, 1fr)) auto",
  },
});

const buyerShippingGridSx: SxProps<Theme> = (theme) => ({
  display: "grid",
  gap: theme.spacing(1.25),
  gridTemplateColumns: {
    xs: "1fr",
    md: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(3, minmax(0, 1fr))",
  },
});

const compactHintSx: SxProps<Theme> = (theme) => ({
  color: theme.customTokens.text.secondary,
  fontSize: theme.typography.caption.fontSize,
  lineHeight: 1.4,
});

const sectionSubtitleSx: SxProps<Theme> = (theme) => ({
  color: theme.customTokens.text.secondary,
  fontSize: theme.typography.body2.fontSize,
  lineHeight: 1.4,
});

const createLoadButtonSx: SxProps<Theme> = (theme) => ({
  ...loadButtonSx(theme),
  height: 34,
  minHeight: 34,
  minWidth: { xs: "100%", sm: 96 },
});

const itemCountChipSx: SxProps<Theme> = (theme) => ({
  height: 22,
  border: `1px solid ${theme.customTokens.borders.default}`,
  borderRadius: `${theme.customTokens.radius.pill}px`,
  backgroundColor: theme.customTokens.surfaces.surface,
  color: theme.customTokens.brand.primary,
  fontSize: theme.typography.caption.fontSize,
  fontWeight: 700,
});

const emptyStateSx: SxProps<Theme> = (theme) => ({
  alignItems: "center",
  border: `1px dashed ${theme.customTokens.borders.default}`,
  borderRadius: `${theme.customTokens.radius.md}px`,
  color: theme.customTokens.text.secondary,
  display: "flex",
  fontSize: theme.typography.body2.fontSize,
  justifyContent: "center",
  minHeight: 74,
  px: theme.spacing(2),
  textAlign: "center",
});

const dispatchSummaryPlacementSx: SxProps<Theme> = {
  display: "flex",
  justifyContent: "flex-end",
  width: "100%",
};

const dispatchSummaryPanelSx: SxProps<Theme> = (theme) => ({
  backgroundColor: theme.customTokens.surfaces.alt,
  border: `1px solid ${theme.customTokens.borders.default}`,
  borderRadius: `${theme.customTokens.radius.md}px`,
  maxWidth: "100%",
  minWidth: { xs: 0, sm: 380 },
  overflow: "hidden",
  px: theme.spacing(1.75),
  pb: theme.spacing(1.5),
  pt: theme.spacing(1.5),
  width: { xs: "100%", md: 440 },
});

const stickyActionBarSx: SxProps<Theme> = (theme) => ({
  alignItems: "center",
  backgroundColor: theme.customTokens.surfaces.surface,
  border: `1px solid ${theme.customTokens.borders.default}`,
  borderRadius: `${theme.customTokens.radius.md}px`,
  bottom: theme.spacing(1),
  display: "flex",
  flexWrap: "wrap",
  gap: theme.spacing(1.25),
  justifyContent: { xs: "stretch", sm: "flex-end" },
  px: theme.spacing(1.5),
  py: theme.spacing(1.25),
  position: "sticky",
  zIndex: 5,
  "& .MuiButton-root": {
    flex: { xs: "1 1 140px", sm: "0 0 auto" },
  },
});

function loadButtonSx(theme: Theme) {
  return {
    minHeight: 28,
    px: theme.spacing(1.75),
    borderRadius: `${theme.customTokens.radius.md}px`,
    backgroundColor: theme.customTokens.brand.primary,
    color: theme.customTokens.text.inverse,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 700,
    lineHeight: 1,
    textTransform: "none" as const,
    boxShadow: "none",
    "&:hover": {
      backgroundColor: theme.customTokens.brand.primaryScale[800],
      boxShadow: "none",
    },
    "&.Mui-disabled": {
      backgroundColor: theme.customTokens.neutrals[200],
      color: theme.customTokens.neutrals[500],
    },
  };
}

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
