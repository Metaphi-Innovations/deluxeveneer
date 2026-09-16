import { Box, Stack, Typography } from "@mui/material";
import { Plus } from "lucide-react";

import {
  EnterpriseDataTable,
  type EnterpriseTableAction,
  type EnterpriseTableColumn,
  type EnterpriseTableRow,
  standardInventoryTableActions,
} from "../../../../../components/data-display/EnterpriseDataTable";
import { TableShowcaseCard } from "./TableShowcaseCard";

type TableRowRecord = EnterpriseTableRow & {
  amount: string;
  approvalStatus: string;
  bundleNumber: string;
  currency: string;
  inwardDate: Date;
  inwardSrNo: string;
  inwardType: string;
  invoiceNo: string;
  itemName: string;
  length: string;
  noOfLeavesSheets: string;
  palletNo: string;
  remark: string;
  srNo: string;
  subCategory: string;
  supplierCode: string;
  supplierItemName: string;
  supplierName: string;
  thickness: string;
  timberColor: string;
  totalSqm: string;
  veneerSrNo: string;
  width: string;
};

type EnterpriseTableShowcaseProps = {
  description: string;
  selectable?: boolean | undefined;
  title: string;
  token: string;
};

const columns: ReadonlyArray<EnterpriseTableColumn<TableRowRecord>> = [
  { key: "srNo", label: "Sr No" },
  { key: "inwardSrNo", label: "Inward Sr No" },
  { key: "inwardType", label: "Inward Type" },
  { key: "inwardDate", label: "Inward Date" },
  { key: "invoiceNo", label: "Invoice No" },
  { key: "veneerSrNo", label: "Veneer Sr No" },
  { key: "supplierName", label: "Supplier Name" },
  { key: "supplierItemName", label: "Supplier Item Name" },
  { key: "supplierCode", label: "Supplier Code" },
  { key: "subCategory", label: "Sub Category" },
  { key: "itemName", label: "Item Name" },
  { key: "timberColor", label: "Timber Color" },
  { key: "bundleNumber", label: "Bundle Number" },
  { key: "palletNo", label: "Pallet No" },
  { key: "length", label: "Length" },
  { key: "width", label: "Width" },
  { key: "thickness", label: "Thickness" },
  { key: "noOfLeavesSheets", label: "No of Leaves/Sheets" },
  { key: "totalSqm", label: "Total SQM" },
  { key: "currency", label: "Currency" },
  { key: "amount", label: "Amount" },
  { key: "remark", label: "Remark" },
  { key: "approvalStatus", label: "Approval Status" },
];

const sampleRows: ReadonlyArray<TableRowRecord> = [
  {
    id: "inward-001",
    srNo: "1",
    inwardSrNo: "INW-2026-0001",
    inwardType: "Purchase",
    inwardDate: new Date("2026-06-02"),
    invoiceNo: "INV-PL-2401",
    veneerSrNo: "VNR-00041",
    supplierName: "Arihant Veneers LLP",
    supplierItemName: "Oak Quarter Cut Import Sheet",
    supplierCode: "SUP-ARH-014",
    subCategory: "Quarter Cut",
    itemName: "Oak Veneer",
    timberColor: "Natural",
    bundleNumber: "BDL-OAK-2104",
    palletNo: "PAL-01-A",
    length: "2600 mm",
    width: "1220 mm",
    thickness: "0.60 mm",
    noOfLeavesSheets: "48",
    totalSqm: "152.34",
    currency: "INR",
    amount: "184,500.00",
    remark: "Moisture within approved inward range.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-002",
    srNo: "2",
    inwardSrNo: "INW-2026-0002",
    inwardType: "Import",
    inwardDate: new Date("2026-06-03"),
    invoiceNo: "INV-IT-7712",
    veneerSrNo: "VNR-00042",
    supplierName: "Euro Timber Exports",
    supplierItemName: "Walnut Crown Cut Export Pack",
    supplierCode: "SUP-EUR-009",
    subCategory: "Crown Cut",
    itemName: "Walnut Veneer",
    timberColor: "Dark Walnut",
    bundleNumber: "BDL-WAL-1820",
    palletNo: "PAL-02-B",
    length: "2500 mm",
    width: "1270 mm",
    thickness: "0.55 mm",
    noOfLeavesSheets: "52",
    totalSqm: "165.10",
    currency: "USD",
    amount: "3,820.00",
    remark: "Imported bundle tagged for premium grade allocation.",
    approvalStatus: "Pending Review",
  },
  {
    id: "inward-003",
    srNo: "3",
    inwardSrNo: "INW-2026-0003",
    inwardType: "Domestic",
    inwardDate: new Date("2026-06-05"),
    invoiceNo: "INV-DM-1189",
    veneerSrNo: "VNR-00043",
    supplierName: "Shree Wood Panels",
    supplierItemName: "Teak Natural Decorative Sheet",
    supplierCode: "SUP-SWP-022",
    subCategory: "Natural",
    itemName: "Teak Veneer",
    timberColor: "Golden Brown",
    bundleNumber: "BDL-TEK-1942",
    palletNo: "PAL-03-C",
    length: "2400 mm",
    width: "1200 mm",
    thickness: "0.50 mm",
    noOfLeavesSheets: "44",
    totalSqm: "126.72",
    currency: "INR",
    amount: "132,400.00",
    remark: "Dispatch-ready after warehouse inspection.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-004",
    srNo: "4",
    inwardSrNo: "INW-2026-0004",
    inwardType: "Purchase",
    inwardDate: new Date("2026-06-07"),
    invoiceNo: "INV-PL-2407",
    veneerSrNo: "VNR-00044",
    supplierName: "Prime Timber Sources",
    supplierItemName: "Ash Crown Cut Bundle",
    supplierCode: "SUP-PTS-031",
    subCategory: "Crown Cut",
    itemName: "Ash Veneer",
    timberColor: "Light Ash",
    bundleNumber: "BDL-ASH-1106",
    palletNo: "PAL-04-A",
    length: "2550 mm",
    width: "1240 mm",
    thickness: "0.58 mm",
    noOfLeavesSheets: "50",
    totalSqm: "158.10",
    currency: "INR",
    amount: "141,800.00",
    remark: "One pallet kept aside for remeasurement.",
    approvalStatus: "On Hold",
  },
  {
    id: "inward-005",
    srNo: "5",
    inwardSrNo: "INW-2026-0005",
    inwardType: "Import",
    inwardDate: new Date("2026-06-09"),
    invoiceNo: "INV-IT-7720",
    veneerSrNo: "VNR-00045",
    supplierName: "Nordic Veneer House",
    supplierItemName: "Oak Rift Cut Architectural Sheet",
    supplierCode: "SUP-NVH-011",
    subCategory: "Rift Cut",
    itemName: "Oak Veneer",
    timberColor: "Smoked Natural",
    bundleNumber: "BDL-OAK-2198",
    palletNo: "PAL-05-D",
    length: "2800 mm",
    width: "1250 mm",
    thickness: "0.65 mm",
    noOfLeavesSheets: "40",
    totalSqm: "140.00",
    currency: "EUR",
    amount: "4,650.00",
    remark: "Long-sheet inward suited for export furniture program.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-006",
    srNo: "6",
    inwardSrNo: "INW-2026-0006",
    inwardType: "Domestic",
    inwardDate: new Date("2026-06-11"),
    invoiceNo: "INV-DM-1198",
    veneerSrNo: "VNR-00046",
    supplierName: "Mewar Decorative Woods",
    supplierItemName: "Walnut Quarter Cut Standard Pack",
    supplierCode: "SUP-MDW-019",
    subCategory: "Quarter Cut",
    itemName: "Walnut Veneer",
    timberColor: "Rich Walnut",
    bundleNumber: "BDL-WAL-1904",
    palletNo: "PAL-06-B",
    length: "2500 mm",
    width: "1220 mm",
    thickness: "0.62 mm",
    noOfLeavesSheets: "46",
    totalSqm: "140.30",
    currency: "INR",
    amount: "168,900.00",
    remark: "Supplier label matched inward purchase order.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-007",
    srNo: "7",
    inwardSrNo: "INW-2026-0007",
    inwardType: "Purchase",
    inwardDate: new Date("2026-06-13"),
    invoiceNo: "INV-PL-2415",
    veneerSrNo: "VNR-00047",
    supplierName: "Heritage Panel Works",
    supplierItemName: "Teak Crown Cut Interior Pack",
    supplierCode: "SUP-HPW-027",
    subCategory: "Crown Cut",
    itemName: "Teak Veneer",
    timberColor: "Honey Teak",
    bundleNumber: "BDL-TEK-1995",
    palletNo: "PAL-07-C",
    length: "2450 mm",
    width: "1210 mm",
    thickness: "0.52 mm",
    noOfLeavesSheets: "54",
    totalSqm: "160.08",
    currency: "INR",
    amount: "149,750.00",
    remark: "Approved with note for crown cut grain variation.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-008",
    srNo: "8",
    inwardSrNo: "INW-2026-0008",
    inwardType: "Domestic",
    inwardDate: new Date("2026-06-16"),
    invoiceNo: "INV-DM-1210",
    veneerSrNo: "VNR-00048",
    supplierName: "City Timber Traders",
    supplierItemName: "Ash Natural Light Bundle",
    supplierCode: "SUP-CTT-018",
    subCategory: "Natural",
    itemName: "Ash Veneer",
    timberColor: "Soft Grey",
    bundleNumber: "BDL-ASH-1164",
    palletNo: "PAL-08-A",
    length: "2350 mm",
    width: "1180 mm",
    thickness: "0.48 mm",
    noOfLeavesSheets: "56",
    totalSqm: "155.29",
    currency: "INR",
    amount: "126,300.00",
    remark: "Pending approval after moisture retest.",
    approvalStatus: "Pending Review",
  },
  {
    id: "inward-009",
    srNo: "9",
    inwardSrNo: "INW-2026-0009",
    inwardType: "Import",
    inwardDate: new Date("2026-06-18"),
    invoiceNo: "INV-IT-7744",
    veneerSrNo: "VNR-00049",
    supplierName: "Baltic Timber Supply",
    supplierItemName: "Oak Crown Cut Premium Set",
    supplierCode: "SUP-BTS-007",
    subCategory: "Crown Cut",
    itemName: "Oak Veneer",
    timberColor: "Warm Natural",
    bundleNumber: "BDL-OAK-2237",
    palletNo: "PAL-09-D",
    length: "2700 mm",
    width: "1250 mm",
    thickness: "0.64 mm",
    noOfLeavesSheets: "42",
    totalSqm: "141.75",
    currency: "USD",
    amount: "3,960.00",
    remark: "QC requested closer veneer serial verification.",
    approvalStatus: "Pending Review",
  },
  {
    id: "inward-010",
    srNo: "10",
    inwardSrNo: "INW-2026-0010",
    inwardType: "Purchase",
    inwardDate: new Date("2026-06-20"),
    invoiceNo: "INV-PL-2421",
    veneerSrNo: "VNR-00050",
    supplierName: "Royal Laminates India",
    supplierItemName: "Walnut Natural Feature Bundle",
    supplierCode: "SUP-RLI-029",
    subCategory: "Natural",
    itemName: "Walnut Veneer",
    timberColor: "Classic Walnut",
    bundleNumber: "BDL-WAL-1968",
    palletNo: "PAL-10-B",
    length: "2480 mm",
    width: "1230 mm",
    thickness: "0.60 mm",
    noOfLeavesSheets: "49",
    totalSqm: "149.45",
    currency: "INR",
    amount: "171,200.00",
    remark: "Released for production issue to premium line.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-011",
    srNo: "11",
    inwardSrNo: "INW-2026-0011",
    inwardType: "Domestic",
    inwardDate: new Date("2026-06-22"),
    invoiceNo: "INV-DM-1226",
    veneerSrNo: "VNR-00051",
    supplierName: "Saarthak Woodcraft",
    supplierItemName: "Teak Quarter Cut Project Pack",
    supplierCode: "SUP-SWC-012",
    subCategory: "Quarter Cut",
    itemName: "Teak Veneer",
    timberColor: "Golden Teak",
    bundleNumber: "BDL-TEK-2041",
    palletNo: "PAL-11-C",
    length: "2520 mm",
    width: "1195 mm",
    thickness: "0.53 mm",
    noOfLeavesSheets: "47",
    totalSqm: "142.91",
    currency: "INR",
    amount: "154,680.00",
    remark: "Shortlisted for hospitality wall panel project.",
    approvalStatus: "Approved",
  },
  {
    id: "inward-012",
    srNo: "12",
    inwardSrNo: "INW-2026-0012",
    inwardType: "Import",
    inwardDate: new Date("2026-06-24"),
    invoiceNo: "INV-IT-7753",
    veneerSrNo: "VNR-00052",
    supplierName: "Scandic Wood Surfaces",
    supplierItemName: "Ash Quarter Cut Large Sheet Pack",
    supplierCode: "SUP-SWS-005",
    subCategory: "Quarter Cut",
    itemName: "Ash Veneer",
    timberColor: "Pale Natural",
    bundleNumber: "BDL-ASH-1209",
    palletNo: "PAL-12-D",
    length: "2850 mm",
    width: "1260 mm",
    thickness: "0.57 mm",
    noOfLeavesSheets: "39",
    totalSqm: "139.75",
    currency: "EUR",
    amount: "4,120.00",
    remark: "Awaiting finance confirmation for import duty reconciliation.",
    approvalStatus: "On Hold",
  },
];

const rowActions: ReadonlyArray<EnterpriseTableAction<TableRowRecord>> = [
  {
    id: "edit",
    label: "Edit",
    icon: standardInventoryTableActions.edit,
    onSelect: () => undefined,
  },
  {
    id: "delete",
    label: "Delete",
    onSelect: () => undefined,
  },
  {
    id: "revert",
    label: "Revert",
    onSelect: () => undefined,
  },
  {
    id: "issue-next-process",
    label: "Issue for Next Process",
    icon: Plus,
    tone: "primary",
    onSelect: () => undefined,
  },
];

export function EnterpriseTableShowcase({
  description,
  selectable = false,
  title,
  token,
}: EnterpriseTableShowcaseProps) {
  return (
    <TableShowcaseCard
      title={title}
      token={token}
      description={description}
      footer={
        <Typography variant="body2" color="text.secondary">
          `theme.components.table.standard` and `theme.components.table.selectable` share the same density, sticky header, filters, pagination, and overflow actions.
        </Typography>
      }
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(1.5),
        })}
      >
        <Box
          sx={(theme) => ({
            display: "flex",
            justifyContent: "space-between",
            gap: theme.spacing(2),
            flexWrap: "wrap",
            alignItems: "center",
          })}
        >
          <Typography variant="caption" color="text.secondary">
            23 columns, sticky header, dynamic width, frozen actions, subtle maroon scrollbar
          </Typography>

          <Typography variant="caption" color="text.secondary">
            {selectable ? "Selectable enterprise variant" : "Standard enterprise variant"}
          </Typography>
        </Box>

        <EnterpriseDataTable
          actions={rowActions}
          columns={columns}
          defaultRowsPerPage={10}
          initialSort={{ key: "inwardDate", direction: "desc" }}
          rows={sampleRows}
          selectable={selectable}
        />
      </Stack>
    </TableShowcaseCard>
  );
}
