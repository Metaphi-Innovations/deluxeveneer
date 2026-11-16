import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Info, Pencil, Plus, Save, Trash2, X } from "lucide-react";

import { ErpSelectField } from "../../../pages/ComponentLibrary/shared/ErpFieldControls";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import type { MasterRecord } from "../../masters/shared";
import { formatAmount, formatSQM, SQM_TO_SQF } from "../../shared/numberFormat";
import { buildLocalMasterDefinition } from "../../masters/shared/localMasterStore";
import {
  itemMasterDefinition,
} from "../../masters/shared/masterDefinitions";
import {
  getCachedItemMasterRows,
  refreshItemMasterCache,
} from "../../masters/item-name-master/api/itemMasterApi";
import {
  fetchItemSubCategoriesApi,
  getCachedItemSubCategoryMasterRows,
  refreshItemSubCategoryMasterCache,
} from "../../masters/item-sub-category-master/api/itemSubCategoryMasterApi";
import { fetchOrderDropdownsApi } from "../api/ordersApi";
import { formatMasterValue } from "../../masters/shared";
import { recordFormActionButtonSx } from "../../shared/buttonStyles";
import {
  formFieldLabelSx,
  formInlineActionButtonSx,
  formSectionCardSx,
  FormSectionHeader,
} from "../../shared/formSectionStyles";
import {
  transactionTableBodyCellSx,
  transactionTableHeaderCellSx,
} from "../../shared/listingTableStyles";
import {
  gradeOptions,
  productCategoryOptions,
  seriesOptions,
  type OrderCreateVariant,
  type OrderLineItem,
} from "../shared/ordersStore";

type OrderLineItemColumn = {
  controlWidth: number;
  dropdownWidth?: number;
  key: keyof Omit<OrderLineItem, "id">;
  label: string;
  minWidth: number;
  numeric?: boolean;
  options?: readonly string[];
  readOnly?: boolean;
  showItemDetails?: boolean;
  type: "select" | "text";
};

type EntryRowConfig = {
  keys: readonly (keyof Omit<OrderLineItem, "id">)[];
  template: {
    xs: string;
    sm?: string;
    md: string;
  };
};

const sqmToSqf = SQM_TO_SQF;

export function normalizeProductType(value?: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";
  // Strip classification suffix like ' (Raw)', ' (Finished)', ' (Wood)', or ' (Pressed Veneer)'
  const base = trimmed
    .replace(/\s*\((?:Raw|Finished|Wood|Pressed Veneer)\)$/i, "")
    .trim()
    .toLowerCase();
  return base;
}

export function formatProductTypeLabel(value?: string): string {
  const trimmed = (value ?? "").trim();
  if (!trimmed) return "";

  const norm = normalizeProductType(trimmed);
  if (norm === "veneer") return "Veneer (Raw)";
  if (norm === "sawing") return "Sawing (Wood)";
  if (norm === "mdf") return "MDF";
  if (norm === "plywood") return "Plywood";

  const finishedLabels: Record<string, string> = {
    decorative: "Decorative (Pressed Veneer)",
    marquetry: "Marquetry (Finished)",
    fluted: "Fluted (Finished)",
    embossed: "Embossed (Finished)",
  };
  if (finishedLabels[norm]) {
    return finishedLabels[norm];
  }

  if (
    trimmed.endsWith(" (Raw)") ||
    trimmed.endsWith(" (Finished)") ||
    trimmed.endsWith(" (Wood)") ||
    trimmed.endsWith(" (Pressed Veneer)")
  ) {
    return trimmed;
  }

  return `${trimmed} (Finished)`;
}

/** Finished craft types: Base Type on row 1; Base Name + Remark on row 3 (no Base Type on row 3). */
function usesBaseTypeFirstRowFlow(productType?: string): boolean {
  const norm = normalizeProductType(productType);
  return ["decorative", "marquetry", "fluted", "embossed"].includes(norm);
}

function usesFlutedOrEmbossedCraftFlow(productType?: string): boolean {
  const norm = normalizeProductType(productType);
  return norm === "fluted" || norm === "embossed";
}

function showsStructuredCodeField(productType?: string): boolean {
  return usesFlutedOrEmbossedCraftFlow(productType);
}

function getCraftProductTypeRowConfig(
  typeKey: "productCategory" | "finishedType",
  productType?: string,
): Pick<EntryRowConfig, "keys" | "template"> {
  if (!usesBaseTypeFirstRowFlow(productType)) {
    return {
      keys:
        typeKey === "finishedType"
          ? ["finishedType", "subCategory", "itemName"]
          : ["productCategory", "subCategory", "itemName"],
      template:
        typeKey === "finishedType"
          ? {
              xs: "1fr",
              sm: `${productTypeControlWidth}px 200px 350px`,
              md: `${productTypeControlWidth}px 200px 350px`,
            }
          : { ...productTypeRowTemplate },
    };
  }

  if (usesFlutedOrEmbossedCraftFlow(productType)) {
    return {
      keys:
        typeKey === "finishedType"
          ? ["finishedType", "baseType", "structuredCode", "subCategory", "itemName"]
          : ["productCategory", "baseType", "structuredCode", "subCategory", "itemName"],
      template: { ...flutedEmbossedProductTypeRowTemplate },
    };
  }

  return {
    keys:
      typeKey === "finishedType"
        ? ["finishedType", "baseType", "subCategory", "itemName"]
        : ["productCategory", "baseType", "subCategory", "itemName"],
    template: { ...decorativeProductTypeRowTemplate },
  };
}

const finishedTypeOptions = [
  "Marquetry",
  "Fluted",
  "Embossed",
  "Decorative",
] as const;

const baseTypeOptions = ["Plywood", "MDF", "Fleece Back", "Twist"] as const;

const productTypeControlWidth = 220;

const unifiedOrderLineItemColumns: readonly OrderLineItemColumn[] = [
  {
    key: "productCategory",
    label: "Product Type",
    controlWidth: productTypeControlWidth,
    dropdownWidth: 280,
    minWidth: productTypeControlWidth,
    options: [...productCategoryOptions],
    type: "select",
  },
  { key: "subCategory", label: "Sub Category", controlWidth: 200, dropdownWidth: 280, minWidth: 200, type: "select" },
  { key: "itemName", label: "Item Name", controlWidth: 350, dropdownWidth: 400, minWidth: 350, showItemDetails: true, type: "select" },
  { key: "logNo", label: "Log No.", controlWidth: 150, minWidth: 130, type: "text" },
  { key: "batchNo", label: "Batch No", controlWidth: 150, minWidth: 130, type: "text" },
  { key: "length", label: "Length", controlWidth: 130, minWidth: 110, numeric: true, type: "text" },
  { key: "width", label: "Width", controlWidth: 130, minWidth: 110, numeric: true, type: "text" },
  { key: "thickness", label: "Thickness", controlWidth: 120, minWidth: 110, numeric: true, type: "text" },
  { key: "quantitySheets", label: "No. of Sheets", controlWidth: 130, minWidth: 120, numeric: true, type: "text" },
  { key: "noOfLeaves", label: "No. of Leaves", controlWidth: 130, minWidth: 120, numeric: true, type: "text" },
  { key: "groupNo", label: "Group No.", controlWidth: 140, minWidth: 120, type: "text" },
  { key: "photoNo", label: "Photo No.", controlWidth: 140, minWidth: 120, type: "text" },
  { key: "cbm", label: "CBM", controlWidth: 130, minWidth: 110, numeric: true, readOnly: true, type: "text" },
  { key: "cft", label: "CFT", controlWidth: 130, minWidth: 110, numeric: true, readOnly: true, type: "text" },
  { key: "ratePerCbm", label: "Rate / CBM", controlWidth: 140, minWidth: 130, numeric: true, type: "text" },
  { key: "sqm", label: "SQM", controlWidth: 130, minWidth: 120, numeric: true, readOnly: true, type: "text" },
  { key: "totalSqm", label: "SQF", controlWidth: 130, minWidth: 120, numeric: true, readOnly: true, type: "text" },
  { key: "ratePerSqf", label: "Rate / SQF", controlWidth: 140, minWidth: 130, numeric: true, type: "text" },
  { key: "amount", label: "Amount", controlWidth: 150, minWidth: 120, numeric: true, readOnly: true, type: "text" },
  { key: "baseType", label: "Base Type", controlWidth: 160, minWidth: 140, options: baseTypeOptions, type: "select" },
  { key: "baseName", label: "Base Name", controlWidth: 350, dropdownWidth: 400, minWidth: 350, type: "select" },
  { key: "designCode", label: "Design Code", controlWidth: 160, minWidth: 140, type: "text" },
  { key: "structuredCode", label: "Structured Code", controlWidth: 170, minWidth: 150, type: "text" },
  { key: "remark", label: "Remark", controlWidth: 400, minWidth: 400, type: "text" },
];

const productTypeRowTemplate = {
  xs: "1fr",
  sm: `${productTypeControlWidth}px 200px 350px`,
  md: `${productTypeControlWidth}px 200px 350px`,
} as const;

const decorativeProductTypeRowTemplate = {
  xs: "1fr",
  sm: `${productTypeControlWidth}px 160px 200px 350px`,
  md: `${productTypeControlWidth}px 160px 200px 350px`,
} as const;

const flutedEmbossedProductTypeRowTemplate = {
  xs: "1fr",
  sm: `${productTypeControlWidth}px 160px 170px 200px 350px`,
  md: `${productTypeControlWidth}px 160px 170px 200px 350px`,
} as const;

const sawingEntryRows: readonly EntryRowConfig[] = [
  {
    keys: ["productCategory", "subCategory", "itemName"],
    template: { ...productTypeRowTemplate },
  },
  {
    keys: [
      "logNo",
      "batchNo",
      "length",
      "width",
      "thickness",
      "cbm",
      "cft",
      "cbf",
      "ratePerCbm",
      "amount",
      "remark",
    ],
    template: {
      xs: "1fr 1fr",
      sm: "repeat(3, minmax(110px, 1fr))",
      md: "repeat(9, minmax(100px, 1fr)) 400px",
    },
  },
];

const unifiedEntryRows: readonly EntryRowConfig[] = [
  { keys: ["productCategory", "subCategory", "itemName"], template: { ...productTypeRowTemplate } },
  { keys: ["length", "width", "thickness", "quantitySheets", "sqm", "totalSqm", "ratePerSqf", "amount"], template: { xs: "1fr 1fr", sm: "repeat(4, minmax(120px, 1fr))", md: "repeat(8, minmax(105px, 1fr))" } },
  { keys: ["baseType", "baseName", "designCode", "structuredCode", "remark"], template: { xs: "1fr", sm: "1fr 1fr", md: "minmax(120px, 1fr) 350px minmax(130px, 1fr) minmax(130px, 1fr) 400px" } },
];

const rawOrderLineItemColumns: readonly OrderLineItemColumn[] = [
  {
    key: "productCategory",
    label: "Product Type",
    controlWidth: productTypeControlWidth,
    dropdownWidth: 280,
    minWidth: productTypeControlWidth,
    options: productCategoryOptions,
    type: "select",
  },
  {
    key: "subCategory",
    label: "Sub Category",
    controlWidth: 200,
    dropdownWidth: 280,
    minWidth: 200,
    type: "select",
  },
  {
    key: "itemName",
    label: "Item Name",
    controlWidth: 350,
    dropdownWidth: 400,
    minWidth: 350,
    showItemDetails: true,
    type: "select",
  },
  {
    key: "grade",
    label: "Grade",
    controlWidth: 120,
    minWidth: 120,
    options: gradeOptions,
    type: "select",
  },
  {
    key: "length",
    label: "Length",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "width",
    label: "Width",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "thickness",
    label: "Thickness",
    controlWidth: 120,
    minWidth: 110,
    numeric: true,
    type: "text",
  },
  {
    key: "quantitySheets",
    label: "No. of Sheets",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "noOfLeaves",
    label: "No. of Leaves",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "groupNo",
    label: "Group No.",
    controlWidth: 140,
    minWidth: 120,
    type: "text",
  },
  {
    key: "photoNo",
    label: "Photo No.",
    controlWidth: 140,
    minWidth: 120,
    type: "text",
  },
  {
    key: "sqm",
    label: "SQM",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "totalSqm",
    label: "SQF",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "ratePerSqf",
    label: "Rate / SQF",
    controlWidth: 140,
    minWidth: 130,
    numeric: true,
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    controlWidth: 160,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "baseType",
    label: "Base Type",
    controlWidth: 160,
    minWidth: 140,
    options: baseTypeOptions,
    type: "select",
  },
  {
    key: "baseName",
    label: "Base Name",
    controlWidth: 350,
    dropdownWidth: 400,
    minWidth: 350,
    type: "select",
  },
  {
    key: "designCode",
    label: "Design Code",
    controlWidth: 160,
    minWidth: 140,
    type: "text",
  },
  {
    key: "structuredCode",
    label: "Structured Code",
    controlWidth: 170,
    minWidth: 150,
    type: "text",
  },
  {
    key: "remark",
    label: "Remark",
    controlWidth: 400,
    minWidth: 400,
    type: "text",
  },
];

const finishedOrderLineItemColumns: readonly OrderLineItemColumn[] = [
  {
    key: "finishedType",
    label: "Finished Type",
    controlWidth: productTypeControlWidth,
    dropdownWidth: 280,
    minWidth: productTypeControlWidth,
    options: finishedTypeOptions,
    type: "select",
  },
  {
    key: "subCategory",
    label: "Sub Category",
    controlWidth: 200,
    dropdownWidth: 280,
    minWidth: 200,
    type: "select",
  },
  {
    key: "itemName",
    label: "Item Name",
    controlWidth: 350,
    dropdownWidth: 400,
    minWidth: 350,
    showItemDetails: true,
    type: "select",
  },
  {
    key: "length",
    label: "Length",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "width",
    label: "Width",
    controlWidth: 140,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "thickness",
    label: "Thickness",
    controlWidth: 120,
    minWidth: 110,
    numeric: true,
    type: "text",
  },
  {
    key: "quantitySheets",
    label: "No. of Sheets",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    type: "text",
  },
  {
    key: "sqm",
    label: "SQM",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "totalSqm",
    label: "SQF",
    controlWidth: 130,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "ratePerSqf",
    label: "Rate / SQF",
    controlWidth: 140,
    minWidth: 130,
    numeric: true,
    type: "text",
  },
  {
    key: "amount",
    label: "Amount",
    controlWidth: 160,
    minWidth: 120,
    numeric: true,
    readOnly: true,
    type: "text",
  },
  {
    key: "baseType",
    label: "Base Type",
    controlWidth: 180,
    minWidth: 150,
    options: baseTypeOptions,
    type: "select",
  },
  {
    key: "baseName",
    label: "Base Name",
    controlWidth: 350,
    dropdownWidth: 400,
    minWidth: 350,
    type: "select",
  },
  {
    key: "designCode",
    label: "Design Code",
    controlWidth: 160,
    minWidth: 140,
    type: "text",
  },
  {
    key: "structuredCode",
    label: "Structured Code",
    controlWidth: 170,
    minWidth: 150,
    type: "text",
  },
  {
    key: "remark",
    label: "Remark",
    controlWidth: 400,
    minWidth: 400,
    type: "text",
  },
];

const finishedProductBaseRow: EntryRowConfig = {
  keys: ["baseType", "baseName", "remark"],
  template: {
    xs: "1fr",
    sm: "1fr 1fr",
    md: "minmax(130px, 1.1fr) 350px 400px",
  },
};

const finishedProductDecorativeRow: EntryRowConfig = {
  keys: ["baseName", "remark"],
  template: {
    xs: "1fr",
    sm: "1fr 1fr",
    md: "350px 400px",
  },
};

function getFinishedOrderEntryRows(finishedType?: string): readonly EntryRowConfig[] {
  const normalized = normalizeProductType(finishedType);
  const thirdRow = usesBaseTypeFirstRowFlow(finishedType)
    ? finishedProductDecorativeRow
    : finishedProductBaseRow;

  const middleKeys: readonly (keyof Omit<OrderLineItem, "id">)[] =
    normalized === "decorative"
      ? [
          "groupNo",
          "photoNo",
          "length",
          "width",
          "thickness",
          "quantitySheets",
          "sqm",
          "totalSqm",
          "ratePerSqf",
          "amount",
        ]
      : normalized === "fluted" || normalized === "embossed" || normalized === "marquetry"
        ? [
            "length",
            "width",
            "thickness",
            "quantitySheets",
            "sqm",
            "totalSqm",
            "ratePerSqf",
            "amount",
          ]
        : [
              "length",
              "width",
              "thickness",
              "quantitySheets",
              "sqm",
              "totalSqm",
              "ratePerSqf",
              "amount",
            ];

  const firstRow = getCraftProductTypeRowConfig("finishedType", finishedType);

  return [
    {
      keys: firstRow.keys,
      template: firstRow.template,
    },
    {
      keys: middleKeys,
      template: {
        xs: "1fr 1fr",
        sm: "repeat(4, minmax(120px, 1fr))",
        md: `repeat(${middleKeys.length}, minmax(105px, 1fr))`,
      },
    },
    thirdRow,
  ];
}

const veneerEntryRows: readonly EntryRowConfig[] = [
  {
    keys: ["productCategory", "subCategory", "itemName"],
    template: { ...productTypeRowTemplate },
  },
  {
    keys: ["length", "width", "thickness", "noOfLeaves", "sqm", "ratePerSqf", "amount", "remark"],
    template: {
      xs: "1fr 1fr",
      sm: "repeat(4, 1fr)",
      md: "minmax(110px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(130px, 1.1fr) minmax(130px, 1.1fr) 400px",
    },
  },
];

const sheetBasedRawEntryRows: readonly EntryRowConfig[] = [
  {
    keys: ["productCategory", "subCategory", "itemName"],
    template: { ...productTypeRowTemplate },
  },
  {
    keys: ["length", "width", "thickness", "quantitySheets", "sqm", "ratePerSqf", "amount", "remark"],
    template: {
      xs: "1fr 1fr",
      sm: "repeat(4, 1fr)",
      md: "minmax(110px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(110px, 1fr) minmax(130px, 1.1fr) minmax(130px, 1.1fr) 400px",
    },
  },
];

const emptySelectionEntryRows: readonly EntryRowConfig[] = [
  {
    keys: ["productCategory", "subCategory", "itemName"],
    template: { ...productTypeRowTemplate },
  },
];

function getDynamicEntryRows(productType?: string): readonly EntryRowConfig[] {
  const normalized = normalizeProductType(productType);
  if (!normalized) {
    return emptySelectionEntryRows;
  }
  if (normalized === "sawing") {
    return sawingEntryRows;
  }
  if (normalized === "veneer") {
    return veneerEntryRows;
  }
  if (normalized === "plywood" || normalized === "mdf" || normalized === "raw") {
    return sheetBasedRawEntryRows;
  }
  if (["decorative", "marquetry", "fluted", "embossed"].includes(normalized)) {
    const thirdRow = usesBaseTypeFirstRowFlow(productType)
      ? finishedProductDecorativeRow
      : finishedProductBaseRow;

    const middleKeys: readonly (keyof Omit<OrderLineItem, "id">)[] =
      normalized === "decorative"
        ? [
            "groupNo",
            "photoNo",
            "length",
            "width",
            "thickness",
            "quantitySheets",
            "sqm",
            "totalSqm",
            "ratePerSqf",
            "amount",
          ]
        : [
            "length",
            "width",
            "thickness",
            "quantitySheets",
            "sqm",
            "totalSqm",
            "ratePerSqf",
            "amount",
          ];

    const firstRow = getCraftProductTypeRowConfig("productCategory", productType);

    return [
      {
        keys: firstRow.keys,
        template: firstRow.template,
      },
      {
        keys: middleKeys,
        template: {
          xs: "1fr 1fr",
          sm: "repeat(4, minmax(120px, 1fr))",
          md: `repeat(${middleKeys.length}, minmax(105px, 1fr))`,
        },
      },
      thirdRow,
    ];
  }
  return [
    {
      keys: ["productCategory", "subCategory", "itemName"],
      template: { ...productTypeRowTemplate },
    },
    {
      keys: [
        "quantitySheets",
        "length",
        "width",
        "thickness",
        "sqm",
        "ratePerSqf",
        "amount",
        "remark",
      ],
      template: {
        xs: "1fr 1fr",
        sm: "repeat(4, minmax(120px, 1fr))",
        md: "repeat(7, minmax(110px, 1fr)) 400px",
      },
    },
  ];
}

const itemDetailColumns = [
  { key: "itemName", label: "Item Name", minWidth: 180 },
  { key: "itemCode", label: "Item Code", minWidth: 130 },
  { key: "category", label: "Category", minWidth: 150 },
  { key: "subCategory", label: "Sub Category", minWidth: 160 },
  { key: "color", label: "Color", minWidth: 130 },
  { key: "hsn", label: "HSN Code", minWidth: 130 },
  { key: "gst", label: "GSTIN", minWidth: 120 },
  { key: "remark", label: "Remark", minWidth: 220 },
] as const;

export interface OrderLineItemsTableHandle {
  validate: () => boolean;
}

export const OrderLineItemsTable = forwardRef<
  OrderLineItemsTableHandle,
  {
    createLayout?: boolean;
    items: readonly OrderLineItem[];
    onChange: (items: OrderLineItem[]) => void;
    readOnly?: boolean;
    variant?: OrderCreateVariant | null;
  }
>(function OrderLineItemsTable({
  createLayout = false,
  items,
  onChange,
  readOnly = false,
  variant,
}, ref) {
  const isUnifiedOrder = variant === "order";
  const isFinishedOrder = variant === "finished";
  const [itemsVersion, setItemsVersion] = useState(0);
  const [dropdownItems, setDropdownItems] = useState<Array<{ id?: string; name?: string; label?: string; category?: string; subCategory?: string }>>([]);
  const [subCategoryMasterRows, setSubCategoryMasterRows] = useState<MasterRecord[]>(
    () => getCachedItemSubCategoryMasterRows(),
  );
  const [subCategoryOptions, setSubCategoryOptions] = useState<string[]>(() =>
    getAllSubCategoryMasterOptions(getCachedItemSubCategoryMasterRows()),
  );

  useEffect(() => {
    let ignore = false;
    void Promise.all([
      refreshItemSubCategoryMasterCache(),
      getCachedItemMasterRows().length > 0
        ? Promise.resolve(getCachedItemMasterRows())
        : refreshItemMasterCache().catch(() => [] as MasterRecord[]),
    ])
      .then(([subRows]) => {
        if (ignore) return;
        setSubCategoryMasterRows(subRows);
        setSubCategoryOptions(getAllSubCategoryMasterOptions(subRows));
        setItemsVersion((v) => v + 1);
      })
      .catch(() => undefined);
    return () => {
      ignore = true;
    };
  }, []);

  const mergeDropdownItems = useCallback(
    (items: Array<{ id?: string; name?: string; label?: string; category?: string; subCategory?: string }>) => {
      if (!items.length) return;
      setDropdownItems((prev) => {
        const existingIds = new Set(prev.map((i) => i.id).filter(Boolean));
        const existingNames = new Set(
          prev.map((i) => String(i.name || i.label || "").trim().toLowerCase()).filter(Boolean),
        );
        const newItems = items.filter((i) => {
          const name = String(i.name || i.label || "").trim().toLowerCase();
          if (i.id && existingIds.has(i.id)) return false;
          if (name && existingNames.has(name)) return false;
          return Boolean(name);
        });
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
      setItemsVersion((v) => v + 1);
    },
    [],
  );

  const handleFetchDropdownsOnDemand = useCallback(
    (params?: { category?: string; subCategory?: string }) => {
      void fetchOrderDropdownsApi({
        type: "items",
        category: params?.category || undefined,
        subCategory: params?.subCategory || undefined,
        limit: 500,
      })
        .then((data) => {
          if (data?.items?.length) {
            mergeDropdownItems(data.items);
          }
        })
        .catch(() => {});
    },
    [mergeDropdownItems],
  );

  const itemRows = useMemo(() => {
    const fromMaster = getItemMasterRows();
    const fromDropdown = dropdownItems.map((d, idx) => ({
      id: d.id || `dd-item-${idx}`,
      itemName: d.name || d.label || "",
      category: d.category || "",
      subCategory: d.subCategory || "",
      status: "Active",
    }));

    const byName = new Map<string, MasterRecord>();
    [...fromMaster, ...fromDropdown].forEach((row) => {
      const name = String(row.itemName ?? "").trim().toLowerCase();
      if (!name) return;
      byName.set(name, row);
    });

    return Array.from(byName.values());
  }, [dropdownItems, itemsVersion]);

  const loadAllSubCategories = useCallback(() => {
    const cached = getCachedItemSubCategoryMasterRows();
    if (cached.length > 0) {
      setSubCategoryMasterRows(cached);
      setSubCategoryOptions(getAllSubCategoryMasterOptions(cached));
    }

    void fetchItemSubCategoriesApi({
      status: true,
      limit: 1000,
    })
      .then((rows) => {
        const activeRows = rows.filter(isActiveMasterRow);
        const source = activeRows.length > 0 ? activeRows : cached;
        void refreshItemSubCategoryMasterCache(source);
        setSubCategoryMasterRows(source);
        setSubCategoryOptions(getAllSubCategoryMasterOptions(source));
      })
      .catch(() => {
        const fallback =
          getCachedItemSubCategoryMasterRows().length > 0
            ? getCachedItemSubCategoryMasterRows()
            : subCategoryMasterRows;
        setSubCategoryOptions(getAllSubCategoryMasterOptions(fallback));
      });
  }, [subCategoryMasterRows]);
  const columns = useMemo(
    () => getOrderLineItemColumns(isFinishedOrder, isUnifiedOrder),
    [isFinishedOrder, isUnifiedOrder],
  );
  const nextRowId = useRef(1);
  const [draftValues, setDraftValues] = useState<Record<string, string>>(() =>
    createEmptyValues(columns),
  );
  const [draftSubmitAttempted, setDraftSubmitAttempted] = useState(false);
  const [lineItems, setLineItems] = useState<OrderLineItem[]>(() => [...items]);
  const [editingRowId, setEditingRowId] = useState<string | null>(null);
  const [selectedItemDetails, setSelectedItemDetails] =
    useState<MasterRecord | null>(null);

  useEffect(() => {
    setLineItems([...items]);
    const numericIds = items
      .map((item) => Number(String(item.id).split("-").pop()))
      .filter((value) => !Number.isNaN(value));
    nextRowId.current = (numericIds.length > 0 ? Math.max(...numericIds) : 0) + 1;
  }, [items]);

  useEffect(() => {
    // Only reset when switching row edit mode, NOT when options/columns update
  }, []);

  const commitLineItems = (nextItems: OrderLineItem[]) => {
    setLineItems(nextItems);
    onChange(nextItems);
  };

  const resetDraftForm = () => {
    setDraftValues(createEmptyValues(columns));
    setEditingRowId(null);
    setDraftSubmitAttempted(false);
  };

  const handleAddLineItem = () => {
    if (allValuesEmpty(draftValues)) {
      setDraftSubmitAttempted(true);
      return;
    }

    const validationErrors = getLineItemValidationErrors(
      columns,
      draftValues,
      isFinishedOrder,
    );

    if (hasValidationErrors(validationErrors)) {
      setDraftSubmitAttempted(true);
      return;
    }

    if (editingRowId) {
      commitLineItems(
        lineItems.map((row) =>
          row.id === editingRowId
            ? {
              id: row.id,
              ...mapValuesToLineItem(draftValues),
            }
            : row,
        ),
      );
    } else {
      const nextItems = [
        ...lineItems,
        {
          id: `order-line-item-${nextRowId.current}`,
          ...mapValuesToLineItem(draftValues),
        },
      ];
      nextRowId.current += 1;
      commitLineItems(nextItems);
    }

    resetDraftForm();
  };

  const handleDeleteLineItem = (rowId: string) => {
    commitLineItems(lineItems.filter((row) => row.id !== rowId));

    if (editingRowId === rowId) {
      resetDraftForm();
    }
  };

  const handleStartEdit = (row: OrderLineItem) => {
    setEditingRowId(row.id);
    setDraftValues(mapLineItemToValues(row));
    setDraftSubmitAttempted(false);
  };

  const updateDraftValue = (key: keyof Omit<OrderLineItem, "id">, value: string) => {
    setDraftValues((current) =>
      getNextLineItemValues(current, key, value, isFinishedOrder, itemRows),
    );

    if (key === "productCategory" || key === "finishedType") {
      const category = getProductTypeCategoryFilter(value);
      if (category) {
        handleFetchDropdownsOnDemand({ category });
      }
      return;
    }

    if (key === "subCategory" && value.trim()) {
      handleFetchDropdownsOnDemand({
        subCategory: value.trim(),
      });
      return;
    }

    if (key === "itemName" && value.trim()) {
      void fetchOrderDropdownsApi({
        type: "items",
        search: value.trim(),
      })
        .then((data) => {
          if (data?.items?.length) {
            mergeDropdownItems(data.items);
          }
        })
        .catch(() => {});
      return;
    }

    if (key === "baseType" && value.trim()) {
      handleFetchDropdownsOnDemand({ category: value.trim() });
      return;
    }

    if (key === "baseName" && value.trim()) {
      void fetchOrderDropdownsApi({
        type: "items",
        search: value.trim(),
      })
        .then((data) => {
          if (data?.items?.length) {
            mergeDropdownItems(data.items);
          }
        })
        .catch(() => {});
    }
  };

  const openItemDetails = (itemName: string) => {
    const itemDetails = getItemMasterRecord(itemRows, itemName);

    if (itemDetails) {
      setSelectedItemDetails(itemDetails);
    }
  };

  useImperativeHandle(
    ref,
    () => ({
      validate: () => {
        if (readOnly) {
          return true;
        }

        const draftHasValues = !allValuesEmpty(draftValues);
        const draftErrors = getLineItemValidationErrors(
          columns,
          draftValues,
          isFinishedOrder,
        );

        if (editingRowId) {
          setDraftSubmitAttempted(true);
          return !hasValidationErrors(draftErrors);
        }

        if (lineItems.length === 0 || (draftHasValues && hasValidationErrors(draftErrors))) {
          setDraftSubmitAttempted(true);
          return false;
        }

        return true;
      },
    }),
    [
      columns,
      draftValues,
      editingRowId,
      isFinishedOrder,
      lineItems.length,
      readOnly,
    ],
  );

  const selectedProductOrFinishedType = isFinishedOrder
    ? draftValues.finishedType
    : draftValues.productCategory;

  const entryRows = isFinishedOrder
    ? getFinishedOrderEntryRows(draftValues.finishedType)
    : getDynamicEntryRows(draftValues.productCategory);
  const columnsByKey = useMemo(() => {
    const map = new Map<string, OrderLineItemColumn>();
    columns.forEach((column) => map.set(column.key, column));
    return map;
  }, [columns]);

  return (
    <Stack sx={{ gap: 1.5 }}>
      {!readOnly ? (
        <Box
          sx={(theme) => ({
            ...formSectionCardSx(theme),
          })}
        >
          <Stack sx={{ gap: 1.15 }}>
            <FormSectionHeader
              endAdornment={createLayout ? (
                <Box
                  sx={(theme) => ({
                    backgroundColor: theme.customTokens.navigation.hoverBackground,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    borderRadius: "999px",
                    color: theme.customTokens.brand.primary,
                    fontSize: "11px",
                    fontWeight: 700,
                    lineHeight: 1,
                    px: 1.1,
                    py: 0.55,
                    whiteSpace: "nowrap",
                  })}
                >
                  {lineItems.length} {lineItems.length === 1 ? "item" : "items"} added
                </Box>
              ) : undefined}
              title={
                createLayout
                  ? `Add Order Item${editingRowId ? " · Editing" : ""}`
                  : `${isFinishedOrder ? "Finished Order Item" : "Raw Order Item"}${editingRowId ? " · Editing" : ""}`
              }
            />

            <Stack sx={{ gap: 1.15 }}>
              {entryRows.map((rowConfig, rowIndex) => (
                <Box
                  key={`entry-row-${rowIndex}`}
                  sx={(theme) => ({
                    display: "grid",
                    gap: theme.spacing(1.25),
                    alignItems: "flex-start",
                    gridTemplateColumns: {
                      xs: rowConfig.template.xs,
                      sm: rowConfig.template.sm ?? rowConfig.template.md,
                      md: rowConfig.template.md,
                    },
                  })}
                >
                  {rowConfig.keys.map((key) => {
                    const column = columnsByKey.get(key);

                    if (
                      !column ||
                      (isUnifiedOrder && isBaseField(column.key) && !isFinishedProductType(draftValues.productCategory)) ||
                      (column.key === "designCode" &&
                        showsStructuredCodeField(selectedProductOrFinishedType)) ||
                      (column.key === "structuredCode" &&
                        !showsStructuredCodeField(selectedProductOrFinishedType))
                    ) {
                      return null;
                    }

                    const normProduct = normalizeProductType(draftValues.productCategory || draftValues.finishedType);
                    const isRateField = column.key === "ratePerSqf";
                    const fieldLabel = isRateField && normProduct === "veneer" ? "Rate / SQM" : column.label;
                    const isRequired = isLineItemColumnRequired(column, draftValues, isFinishedOrder);

                    return (
                      <Stack
                        key={column.key}
                        spacing={0.5}
                        sx={{
                          minWidth: 0,
                          ...(column.key === "productCategory" ||
                          column.key === "finishedType" ||
                          column.key === "itemName" ||
                          column.key === "baseName" ||
                          column.key === "remark"
                            ? {
                                width: column.controlWidth,
                                maxWidth: column.controlWidth,
                              }
                            : {}),
                        }}
                      >
                        <FieldLabel required={isRequired}>{fieldLabel}</FieldLabel>
                        {renderField({
                          column,
                          currentValues: draftValues,
                          disabled: (() => {
                            const allVisibleKeys: string[] = [];
                            entryRows.forEach((r) => {
                              r.keys.forEach((k) => {
                                const col = columnsByKey.get(k);
                                if (
                                  col &&
                                  !(isUnifiedOrder && isBaseField(col.key) && !isFinishedProductType(draftValues.productCategory)) &&
                                  !(col.key === "designCode" &&
                                    showsStructuredCodeField(selectedProductOrFinishedType)) &&
                                  !(col.key === "structuredCode" &&
                                    !showsStructuredCodeField(selectedProductOrFinishedType))
                                ) {
                                  allVisibleKeys.push(k);
                                }
                              });
                            });
                            const keyIndex = allVisibleKeys.indexOf(column.key);
                            const normProduct = normalizeProductType(
                              draftValues.productCategory || draftValues.finishedType,
                            );
                            const isSequentialFirstRowFlow = usesBaseTypeFirstRowFlow(
                              draftValues.productCategory || draftValues.finishedType,
                            );
                            for (let i = 0; i < keyIndex; i++) {
                              const prevKey = allVisibleKeys[i];
                              if (!prevKey) continue;
                              if (!isSequentialFirstRowFlow) {
                                // Product type and sub category are independent.
                                if (
                                  (column.key === "subCategory" &&
                                    (prevKey === "productCategory" || prevKey === "finishedType")) ||
                                  ((column.key === "productCategory" || column.key === "finishedType") &&
                                    prevKey === "subCategory")
                                ) {
                                  continue;
                                }
                                // Item name depends only on sub category.
                                if (
                                  column.key === "itemName" &&
                                  prevKey !== "subCategory"
                                ) {
                                  continue;
                                }
                              }
                              const prevCol = columnsByKey.get(prevKey);
                              if (prevCol && !prevCol.readOnly) {
                                const prevReq = isLineItemColumnRequired(prevCol, draftValues, isFinishedOrder);
                                const prevVal = String(draftValues[prevKey] ?? "").trim();
                                if (prevReq && !prevVal) {
                                  return true;
                                }
                              }
                            }
                            return false;
                          })(),
                          errorText: draftSubmitAttempted
                            ? getFieldValidationError(
                              column,
                              draftValues,
                              isFinishedOrder,
                            )
                            : "",
                          itemRows,
                          onChange: (value) =>
                            updateDraftValue(column.key, value),
                          onOpenDropdown: () => {
                            if (column.key === "baseName") {
                              const baseType = (draftValues.baseType ?? "").trim();
                              if (baseType) {
                                handleFetchDropdownsOnDemand({ category: baseType });
                              } else {
                                handleFetchDropdownsOnDemand();
                              }
                              return;
                            }
                            if (column.key === "subCategory" || column.key === "itemName") {
                              if (column.key === "subCategory") {
                                loadAllSubCategories();
                                handleFetchDropdownsOnDemand();
                                return;
                              }
                              const subCategory = (draftValues.subCategory ?? "").trim();
                              if (subCategory) {
                                handleFetchDropdownsOnDemand({ subCategory });
                              } else {
                                handleFetchDropdownsOnDemand();
                              }
                            }
                          },
                          onOpenItemDetails: openItemDetails,
                          subCategoryOptions,
                          value: draftValues[column.key] ?? "",
                        })}
                      </Stack>
                    );
                  })}
                </Box>
              ))}
            </Stack>

            <Box
              sx={(theme) => ({
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
                gap: theme.spacing(1),
                flexWrap: "wrap",
                pt: 0.25,
              })}
            >
              {editingRowId ? (
                <Button
                  onClick={resetDraftForm}
                  sx={(theme) => ({
                    ...formInlineActionButtonSx(theme),
                    backgroundColor: "transparent",
                    color: theme.customTokens.text.primary,
                    border: `1px solid ${theme.customTokens.borders.default}`,
                    "&:hover": {
                      backgroundColor: theme.customTokens.neutrals[100],
                      boxShadow: "none",
                    },
                  })}
                  variant="outlined"
                >
                  Cancel Edit
                </Button>
              ) : null}
              <Button
                disableElevation
                onClick={handleAddLineItem}
                startIcon={
                  editingRowId ? <Save size={15} /> : <Plus size={15} />
                }
                sx={(theme) => formInlineActionButtonSx(theme)}
                variant="contained"
              >
                {editingRowId ? "Update Item" : "Add Item"}
              </Button>
            </Box>
          </Stack>
        </Box>
      ) : null}

      {createLayout || lineItems.length > 0 ? (
        <Box
          sx={(theme) => createLayout
            ? ({ ...formSectionCardSx(theme) })
            : ({})}
        >
          {createLayout ? (
            <FormSectionHeader
              endAdornment={
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.secondary,
                    fontSize: "11px",
                    fontWeight: 600,
                  })}
                >
                  {lineItems.length} {lineItems.length === 1 ? "item" : "items"} total
                </Typography>
              }
              title="Order Items"
            />
          ) : null}
          {lineItems.length > 0 ? (
          <Stack spacing={1.5} sx={{ mt: createLayout ? 1.25 : 0 }}>
          {Array.from(
            lineItems.reduce((map, item, globalIdx) => {
              const groupKey = formatProductTypeLabel(getUnifiedProductType(item)) || "Items";
              const current = map.get(groupKey) ?? [];
              current.push({ item, globalIdx });
              map.set(groupKey, current);
              return map;
            }, new Map<string, { item: OrderLineItem; globalIdx: number }[]>()),
          ).map(([groupTitle, groupEntries]) => {
            const groupItems = groupEntries.map((e) => e.item);
            const dynamicHeaders = getDynamicLineItemHeaders(groupItems);

            return (
              <Box
                key={groupTitle}
                sx={(theme) => ({
                  border: `1px solid ${theme.customTokens.borders.default}`,
                  borderRadius: "8px",
                  backgroundColor: theme.customTokens.surfaces.surface,
                  overflow: "hidden",
                  px: 1.75,
                  pt: 1.5,
                  pb: 0,
                })}
              >
                <FormSectionHeader title={`${groupTitle} (${groupEntries.length})`} />
                <Box sx={(theme) => ({ ...getScrollableTableSx(theme), mx: -1.75, mt: 1.15 })}>
                  <Table
                    size="medium"
                    sx={{ minWidth: isUnifiedOrder ? 1000 : isFinishedOrder ? 980 : 900 }}
                  >
                    <TableHead>
                      <TableRow>
                        {dynamicHeaders.map((header) => (
                          <TableCell
                            key={header.label}
                            sx={(theme) =>
                              getHeaderCellSx(theme, header.minWidth, header.align)
                            }
                          >
                            {header.label}
                          </TableCell>
                        ))}
                        {!readOnly ? (
                          <TableCell
                            sx={(theme) => getHeaderCellSx(theme, 96, "center")}
                          >
                            Actions
                          </TableCell>
                        ) : null}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {groupEntries.map(({ item: row, globalIdx }) => {
                        const isEditing = editingRowId === row.id;

                        return (
                          <TableRow
                            key={row.id}
                            sx={(theme) => ({
                              backgroundColor: isEditing
                                ? theme.customTokens.navigation.hoverBackground
                                : globalIdx % 2 === 0
                                  ? theme.customTokens.surfaces.surface
                                  : theme.customTokens.surfaces.alt,
                            })}
                          >
                            {getDynamicLineItemCells(row, globalIdx, dynamicHeaders).map((cell) => (
                              <TableCell
                                key={cell.label}
                                sx={(theme) => ({
                                  ...getBodyCellSx(theme, cell.align),
                                  fontSize: "14px",
                                  fontWeight: cell.emphasize ? 500 : 400,
                                })}
                              >
                                {cell.value || "—"}
                              </TableCell>
                            ))}
                            {!readOnly ? (
                              <TableCell
                                align="center"
                                sx={(theme) => ({
                                  ...getBodyCellSx(theme, "center"),
                                })}
                              >
                                <Stack
                                  direction="row"
                                  justifyContent="center"
                                  spacing={0.5}
                                >
                                  <IconButton
                                    aria-label="Edit item"
                                    disabled={isEditing}
                                    onClick={() => handleStartEdit(row)}
                                    size="small"
                                    sx={(theme) => getActionButtonSx(theme)}
                                    title="Edit"
                                  >
                                    <Pencil size={15} />
                                  </IconButton>
                                  <IconButton
                                    aria-label="Remove item"
                                    onClick={() => handleDeleteLineItem(row.id)}
                                    size="small"
                                    sx={(theme) => getActionButtonSx(theme)}
                                    title="Remove"
                                  >
                                    <Trash2 size={15} />
                                  </IconButton>
                                </Stack>
                              </TableCell>
                            ) : null}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            );
          })}
          </Stack>
          ) : (
            <Box
              sx={(theme) => ({
                alignItems: "center",
                backgroundColor: theme.customTokens.surfaces.alt,
                border: `1px dashed ${theme.customTokens.borders.default}`,
                borderRadius: "7px",
                color: theme.customTokens.text.secondary,
                display: "flex",
                fontSize: "13px",
                justifyContent: "center",
                mt: 1.25,
                px: 2,
                py: 2.25,
                textAlign: "center",
              })}
            >
              Add an order item above to build this order.
            </Box>
          )}
        </Box>
      ) : null}

      <ItemDetailsDialog
        item={selectedItemDetails}
        onClose={() => setSelectedItemDetails(null)}
        open={Boolean(selectedItemDetails)}
      />
    </Stack>
  );
});

function getOrderLineItemColumns(isFinishedOrder: boolean, isUnifiedOrder = false) {
  if (isUnifiedOrder) {
    return unifiedOrderLineItemColumns;
  }

  return isFinishedOrder
    ? finishedOrderLineItemColumns
    : rawOrderLineItemColumns;
}

function createEmptyValues(columns: readonly OrderLineItemColumn[]) {
  return columns.reduce<Record<string, string>>((accumulator, column) => {
    accumulator[column.key] = "";
    return accumulator;
  }, {});
}

function allValuesEmpty(values: Record<string, string>) {
  return Object.values(values).every((value) => value.trim().length === 0);
}

function getLineItemValidationErrors(
  columns: readonly OrderLineItemColumn[],
  values: Record<string, string>,
  isFinishedOrder: boolean,
) {
  return columns.reduce<Record<string, string>>((errors, column) => {
    const error = getFieldValidationError(column, values, isFinishedOrder);

    if (error) {
      errors[column.key] = error;
    }

    return errors;
  }, {});
}

function hasValidationErrors(errors: Record<string, string>) {
  return Object.keys(errors).length > 0;
}

function isLineItemColumnRequired(
  column: OrderLineItemColumn,
  values: Record<string, string>,
  _isFinishedOrder: boolean,
) {
  const normProduct = normalizeProductType(values.productCategory || values.finishedType);

  const isSawing = normProduct === "sawing";

  // Sawing conditional mandatory fields
  if (isSawing) {
    if (["productCategory", "subCategory", "itemName", "logNo", "batchNo", "length", "width", "thickness", "ratePerCbm"].includes(column.key)) {
      return true;
    }
    return false;
  }

  // Decorative conditional fields: mandatory only for Decorative
  if (column.key === "groupNo" || column.key === "photoNo") {
    return normProduct === "decorative";
  }

  if (column.key === "baseType") {
    return usesBaseTypeFirstRowFlow(values.productCategory || values.finishedType);
  }

  // Veneer conditional field: No. of Leaves is mandatory for Veneer
  if (column.key === "noOfLeaves") {
    return normProduct === "veneer";
  }

  // Quantity sheets is mandatory for non-Veneer sheet-based types
  if (column.key === "quantitySheets") {
    return normProduct !== "veneer" && !isSawing;
  }

  if (column.key === "finishedType") {
    return true;
  }

  // Core mandatory fields
  if (["productCategory", "subCategory", "itemName", "length", "width", "thickness", "ratePerSqf"].includes(column.key)) {
    return true;
  }

  return false;
}

function getFieldValidationError(
  column: OrderLineItemColumn,
  values: Record<string, string>,
  isFinishedOrder: boolean,
) {
  const normProduct = normalizeProductType(values.productCategory || values.finishedType);
  const isSawing = normProduct === "sawing";

  // When hidden for current product type, do not trigger validation errors
  if (isSawing) {
    if (!["productCategory", "subCategory", "itemName", "logNo", "batchNo", "length", "width", "thickness", "cbm", "cft", "cbf", "ratePerCbm", "amount", "remark"].includes(column.key)) {
      return "";
    }
  } else {
    if (["logNo", "batchNo", "cbm", "cft", "cbf", "ratePerCbm"].includes(column.key)) {
      return "";
    }
  }

  if ((column.key === "groupNo" || column.key === "photoNo") && normProduct !== "decorative") {
    return "";
  }
  if (column.key === "noOfLeaves" && normProduct !== "veneer") {
    return "";
  }
  if (column.key === "quantitySheets" && (normProduct === "veneer" || isSawing)) {
    return "";
  }
  if (
    isBaseField(column.key) &&
    !isFinishedProductType(values.productCategory || values.finishedType)
  ) {
    return "";
  }

  const rawValue = values[column.key] ?? "";
  const value = rawValue.trim();

  const isRateField = column.key === "ratePerSqf";
  const displayLabel = isRateField && normProduct === "veneer" ? "Rate / SQM" : column.label;

  if (isLineItemColumnRequired(column, values, isFinishedOrder) && value.length === 0) {
    return `${displayLabel} is required`;
  }

  // No. of Leaves validation for Veneer: positive whole number
  if (column.key === "noOfLeaves" && normProduct === "veneer" && value.length > 0) {
    if (!/^\d+$/.test(value) || Number(value) <= 0) {
      return "No. of Leaves must be a positive whole number";
    }
  }

  // Dimension & numeric fields validation
  if (column.numeric && value.length > 0) {
    if (!isValidDoubleValue(value)) {
      return `${displayLabel} must be a number`;
    }
    const num = Number(value.replace(/,/g, ""));
    if (num <= 0 && ["length", "width", "thickness", "ratePerSqf", "ratePerCbm", "quantitySheets"].includes(column.key)) {
      return `${displayLabel} must be greater than 0`;
    }
  }

  return "";
}

function FieldLabel({ children, required }: { children: string; required?: boolean }) {
  return (
    <Typography
      component="label"
      sx={(theme) => ({
        ...formFieldLabelSx(theme),
      })}
    >
      {children}
      {required ? (
        <Typography component="span" sx={{ color: "error.main", ml: 0.5, fontWeight: 700 }}>
          *
        </Typography>
      ) : null}
    </Typography>
  );
}

export type ListingCell = {
  align?: "left" | "right" | "center" | undefined;
  emphasize?: boolean | undefined;
  label: string;
  minWidth?: number | undefined;
  value: string;
};

export function getDynamicLineItemHeaders(lineItems: readonly OrderLineItem[]): readonly { label: string; minWidth: number; align?: "left" | "right" | "center" }[] {
  const types = new Set(lineItems.map((item) => normalizeProductType(item.productCategory || item.finishedType)));

  const hasSawing = types.has("sawing");
  const hasVeneer = types.has("veneer");
  const hasSheetRaw = types.has("raw") || types.has("mdf");
  const hasDecorative = types.has("decorative");
  const hasFluted = types.has("fluted");
  const hasEmbossed = types.has("embossed");
  const hasMarquetry = types.has("marquetry");
  const hasPlywood = types.has("plywood");
  const hasFinished = hasDecorative || hasFluted || hasEmbossed || hasMarquetry || hasPlywood;

  const headers: { label: string; minWidth: number; align?: "left" | "right" | "center" }[] = [
    { label: "Order Item No", minWidth: 120, align: "left" },
    { label: "Product Type", minWidth: 140, align: "left" },
    { label: "Item Name", minWidth: 180, align: "left" },
  ];

  if (hasSawing) {
    headers.push(
      { label: "Log No.", minWidth: 110, align: "left" },
      { label: "Batch No", minWidth: 110, align: "left" },
    );
  }

  if (hasDecorative) {
    headers.push(
      { label: "Group No", minWidth: 100, align: "left" },
      { label: "Photo No", minWidth: 100, align: "left" },
    );
  }

  if (hasFluted || hasEmbossed) {
    headers.push({ label: "Structured Code", minWidth: 130, align: "left" });
  }

  headers.push(
    { label: "Length", minWidth: 100, align: "left" },
    { label: "Width", minWidth: 100, align: "left" },
    { label: "Thickness", minWidth: 100, align: "left" },
  );

  if (hasSheetRaw || hasFinished) {
    headers.push({ label: "Sheets", minWidth: 80, align: "right" });
  }

  if (hasVeneer) {
    headers.push({ label: "Leaves", minWidth: 80, align: "right" });
  }

  if (hasSawing) {
    headers.push(
      { label: "CBM", minWidth: 90, align: "right" },
      { label: "CFT", minWidth: 90, align: "right" },
    );
  }

  if (hasVeneer || hasSheetRaw || hasFinished) {
    headers.push({ label: "SQM", minWidth: 90, align: "right" });
    headers.push({ label: "SQF", minWidth: 90, align: "right" });
  }

  headers.push(
    { label: "Rate", minWidth: 110, align: "right" },
    { label: "Amount", minWidth: 110, align: "right" },
  );

  if (hasFinished) {
    headers.push(
      { label: "Base Type", minWidth: 120, align: "left" },
      { label: "Base Name", minWidth: 150, align: "left" },
    );
  }

  headers.push({ label: "Remark", minWidth: 180, align: "left" });

  return headers;
}

export function getDynamicLineItemCells(
  row: OrderLineItem,
  index: number,
  headers: readonly { label: string; align?: "left" | "right" | "center" }[],
): readonly ListingCell[] {
  const normProduct = normalizeProductType(getUnifiedProductType(row));
  const isSawing = normProduct === "sawing";
  const isVeneer = normProduct === "veneer";
  const isFinished = isFinishedProductType(normProduct);

  const rateDisplay = isSawing
    ? (row.ratePerCbm || row.ratePerSqf)
    : row.ratePerSqf;

  return headers.map((header) => {
    let value = "";
    let emphasize = false;

    switch (header.label) {
      case "Order Item No":
        value = formatOrderItemNo(row.id, index);
        emphasize = true;
        break;
      case "Product Type":
        value = formatProductTypeLabel(getUnifiedProductType(row));
        break;
      case "Finished Type":
        value = row.finishedType || row.productCategory;
        break;
      case "Item Name":
        value = row.itemName;
        break;
      case "Log No.":
        value = isSawing ? (row.logNo ?? "") : "";
        break;
      case "Batch No":
        value = isSawing ? (row.batchNo ?? "") : "";
        break;
      case "Length":
        value = row.length;
        break;
      case "Width":
        value = row.width;
        break;
      case "Thickness":
        value = row.thickness;
        break;
      case "CBM":
        value = isSawing ? (row.cbm ?? "") : "";
        break;
      case "CFT":
      case "CBF":
        value = isSawing ? (row.cft ?? row.cbf ?? "") : "";
        break;
      case "Sheets":
        value = !isVeneer && !isSawing ? row.quantitySheets : "";
        break;
      case "Leaves":
        value = isVeneer ? (row.noOfLeaves ?? "") : "";
        break;
      case "SQM":
        value = !isSawing ? row.sqm : "";
        break;
      case "SQF":
        value = !isSawing ? row.totalSqm : "";
        break;
      case "Rate":
      case "Rate/SQF":
        value = rateDisplay;
        break;
      case "Amount":
        value = row.amount;
        emphasize = true;
        break;
      case "Group No":
        value = normProduct === "decorative" ? (row.groupNo ?? "") : "";
        break;
      case "Photo No":
        value = normProduct === "decorative" ? (row.photoNo ?? "") : "";
        break;
      case "Base Type":
        value = isFinished ? row.baseType : "";
        break;
      case "Base Name":
        value = isFinished ? row.baseName : "";
        break;
      case "Design Code":
        value = "";
        break;
      case "Structured Code":
        value = showsStructuredCodeField(normProduct) ? (row.structuredCode ?? "") : "";
        break;
      case "Remark":
        value = row.remark;
        break;
      default:
        value = "";
    }

    return {
      label: header.label,
      value,
      align: header.align,
      emphasize,
    };
  });
}

function getUnifiedProductType(row: OrderLineItem) {
  return row.productCategory === "Finished"
    ? row.finishedType
    : row.productCategory || row.finishedType;
}

function isFinishedProductType(value: string | undefined) {
  const norm = normalizeProductType(value);
  return ["decorative", "marquetry", "fluted", "embossed"].includes(norm);
}

function isBaseField(key: keyof Omit<OrderLineItem, "id">) {
  return ["baseType", "baseName"].includes(key);
}

function getFinishedListingValues(row: OrderLineItem, index: number) {
  return [
    {
      label: "Order Item No",
      value: formatOrderItemNo(row.id, index),
      align: "left" as const,
      emphasize: true,
    },
    {
      label: "Finished Type",
      value: row.finishedType,
      align: "left" as const,
    },
    {
      label: "Item Name",
      value: row.itemName,
      align: "left" as const,
    },
    { label: "Length", value: row.length, align: "left" as const },
    { label: "Width", value: row.width, align: "left" as const },
    { label: "Thickness", value: row.thickness, align: "left" as const },
    {
      label: "Sheets",
      value: row.quantitySheets,
      align: "right" as const,
    },
    { label: "SQM", value: row.sqm, align: "right" as const },
    { label: "SQF", value: row.totalSqm, align: "right" as const },
    { label: "Rate/SQF", value: row.ratePerSqf, align: "right" as const },
    {
      label: "Amount",
      value: row.amount,
      align: "right" as const,
      emphasize: true,
    },
    {
      label: "Group No",
      value: row.groupNo ?? "",
      align: "left" as const,
    },
    {
      label: "Photo No",
      value: row.photoNo ?? "",
      align: "left" as const,
    },
    {
      label: "Design Code",
      value: row.designCode ?? "",
      align: "left" as const,
    },
    {
      label: "Structured Code",
      value: row.structuredCode ?? "",
      align: "left" as const,
    },
  ];
}

function getRawListingValues(row: OrderLineItem, index: number) {
  const isSawing = (row.productCategory ?? "").trim().toLowerCase().includes("sawing");
  const rateDisplay = isSawing ? (row.ratePerCbm || row.ratePerSqf) : row.ratePerSqf;

  return [
    {
      label: "Order Item No",
      value: formatOrderItemNo(row.id, index),
      align: "left" as const,
      emphasize: true,
    },
    {
      label: "Product Type",
      value: formatProductTypeLabel(row.productCategory),
      align: "left" as const,
    },
    {
      label: "Item Name",
      value: row.itemName,
      align: "left" as const,
    },
    { label: "Log No.", value: row.logNo ?? "", align: "left" as const },
    { label: "Batch No", value: row.batchNo ?? "", align: "left" as const },
    { label: "Length", value: row.length, align: "left" as const },
    { label: "Width", value: row.width, align: "left" as const },
    { label: "Thickness", value: row.thickness, align: "left" as const },
    { label: "CBM", value: row.cbm ?? "", align: "right" as const },
    { label: "CFT", value: row.cft ?? row.cbf ?? "", align: "right" as const },
    {
      label: "Sheets",
      value: row.quantitySheets,
      align: "right" as const,
    },
    {
      label: "Leaves",
      value: row.noOfLeaves ?? "",
      align: "right" as const,
    },
    { label: "SQM", value: row.sqm, align: "right" as const },
    { label: "SQF", value: row.totalSqm, align: "right" as const },
    { label: "Rate", value: rateDisplay, align: "right" as const },
    {
      label: "Amount",
      value: row.amount,
      align: "right" as const,
      emphasize: true,
    },
    {
      label: "Design Code",
      value: row.designCode ?? "",
      align: "left" as const,
    },
    {
      label: "Structured Code",
      value: row.structuredCode ?? "",
      align: "left" as const,
    },
  ];
}


function mapValuesToLineItem(values: Record<string, string>): Omit<OrderLineItem, "id"> {
  return {
    productCategory: values.productCategory ?? "",
    finishedType: values.finishedType ?? "",
    salesItemName: values.salesItemName ?? "",
    itemName: values.itemName ?? "",
    subCategory: values.subCategory ?? "",
    series: values.series ?? "",
    grade: values.grade ?? "",
    logNo: values.logNo ?? "",
    batchNo: values.batchNo ?? "",
    cbm: values.cbm ?? "",
    cft: values.cft ?? values.cbf ?? "",
    cbf: values.cft ?? values.cbf ?? "",
    ratePerCbm: values.ratePerCbm ?? "",
    length: values.length ?? "",
    width: values.width ?? "",
    thickness: values.thickness ?? "",
    quantitySheets: values.quantitySheets ?? "",
    noOfLeaves: values.noOfLeaves ?? "",
    groupNo: values.groupNo ?? "",
    photoNo: values.photoNo ?? "",
    sqm: values.sqm ?? "",
    totalSqm: values.totalSqm ?? "",
    ratePerSqf: values.ratePerSqf ?? "",
    baseType: values.baseType ?? "",
    baseName: values.baseName ?? "",
    baseLength: values.baseLength ?? "",
    baseWidth: values.baseWidth ?? "",
    baseThickness: values.baseThickness ?? "",
    designCode: showsStructuredCodeField(values.productCategory || values.finishedType)
      ? ""
      : (values.designCode ?? ""),
    structuredCode: values.structuredCode ?? "",
    amount: values.amount ?? "",
    remark: values.remark ?? "",
  };
}

function mapLineItemToValues(lineItem: OrderLineItem) {
  return {
    productCategory:
      lineItem.productCategory === "Finished"
        ? lineItem.finishedType
        : lineItem.productCategory || lineItem.finishedType,
    finishedType: lineItem.finishedType,
    salesItemName: lineItem.salesItemName,
    itemName: lineItem.itemName,
    subCategory: lineItem.subCategory,
    series: lineItem.series,
    grade: lineItem.grade,
    logNo: lineItem.logNo ?? "",
    batchNo: lineItem.batchNo ?? "",
    cbm: lineItem.cbm ?? "",
    cft: lineItem.cft ?? lineItem.cbf ?? "",
    cbf: lineItem.cft ?? lineItem.cbf ?? "",
    ratePerCbm: lineItem.ratePerCbm ?? "",
    length: lineItem.length,
    width: lineItem.width,
    thickness: lineItem.thickness,
    quantitySheets: lineItem.quantitySheets,
    noOfLeaves: lineItem.noOfLeaves ?? "",
    groupNo: lineItem.groupNo ?? "",
    photoNo: lineItem.photoNo ?? "",
    sqm: lineItem.sqm,
    totalSqm: lineItem.totalSqm,
    ratePerSqf: lineItem.ratePerSqf,
    baseType: lineItem.baseType,
    baseName: lineItem.baseName,
    baseLength: lineItem.baseLength,
    baseWidth: lineItem.baseWidth,
    baseThickness: lineItem.baseThickness,
    designCode: lineItem.designCode ?? "",
    structuredCode: (() => {
      const structured = lineItem.structuredCode ?? "";
      if (structured.trim()) {
        return structured;
      }
      const norm = normalizeProductType(lineItem.productCategory || lineItem.finishedType);
      if (norm === "fluted") {
        return lineItem.designCode ?? "";
      }
      return "";
    })(),
    amount: lineItem.amount,
    remark: lineItem.remark,
  };
}

function getNextLineItemValues(
  currentValues: Record<string, string>,
  key: keyof Omit<OrderLineItem, "id">,
  value: string,
  isFinishedOrder: boolean,
  itemRows: readonly MasterRecord[],
) {
  const nextValue = key === "noOfLeaves"
    ? value.replace(/[^0-9]/g, "")
    : isNumericLineItemKey(key)
      ? sanitizeDoubleInput(value)
      : value;
  let nextValues = {
    ...currentValues,
    [key]: nextValue,
  };

  if (key === "productCategory" || key === "finishedType") {
    const norm = normalizeProductType(nextValue);
    if (usesBaseTypeFirstRowFlow(nextValue)) {
      nextValues.baseType = "";
      nextValues.subCategory = "";
      nextValues.itemName = "";
    } else if (key === "productCategory" && !isFinishedProductType(nextValue)) {
      nextValues.baseType = "";
      nextValues.baseName = "";
    } else if (key === "productCategory" || key === "finishedType") {
      nextValues.baseType = "";
      nextValues.baseName = "";
    }
    if (norm !== "decorative") {
      nextValues.groupNo = "";
      nextValues.photoNo = "";
    }
    if (!showsStructuredCodeField(nextValue)) {
      nextValues.structuredCode = "";
    }
    nextValues.designCode = "";
    if (norm !== "veneer") {
      nextValues.noOfLeaves = "";
    }
  }

  if (key === "baseType") {
    nextValues.baseName = "";
    if (usesBaseTypeFirstRowFlow(nextValues.productCategory || nextValues.finishedType)) {
      if (usesFlutedOrEmbossedCraftFlow(nextValues.productCategory || nextValues.finishedType)) {
        nextValues.structuredCode = "";
      }
      nextValues.subCategory = "";
      nextValues.itemName = "";
    }
  }

  if (key === "subCategory") {
    nextValues.itemName = "";
  }

  if (key === "itemName") {
    nextValues = applyOrderItemMasterDefaults(
      nextValues,
      nextValue,
      itemRows,
      isFinishedOrder,
    );
  }

  return applyLineItemCalculations(nextValues, isFinishedOrder, key);
}

function applyLineItemCalculations(
  values: Record<string, string>,
  isFinishedOrder: boolean,
  changedKey?: keyof Omit<OrderLineItem, "id">,
) {
  const normProduct = normalizeProductType(values.productCategory || values.finishedType);
  if (normProduct === "sawing") {
    const rawLen = parsePositiveNumber(values.length);
    const rawWid = parsePositiveNumber(values.width);
    const rawThick = parsePositiveNumber(values.thickness);
    const ratePerCbm = parsePositiveNumber(values.ratePerCbm || values.ratePerSqf);

    let nextValues = { ...values };
    if (rawLen > 0 && rawWid > 0 && rawThick > 0) {
      // Dimensions in mm -> / 1,000,000,000
      const isMm = rawLen > 50 || rawWid > 50 || rawThick > 50;
      const divisor = isMm ? 1_000_000_000 : 1;
      const cbmVal = (rawLen * rawWid * rawThick) / divisor;
      const cftVal = cbmVal * 35.3147;
      const amountVal = cbmVal * ratePerCbm;

      nextValues.cbm = cbmVal.toFixed(4);
      nextValues.cft = cftVal.toFixed(2);
      nextValues.cbf = cftVal.toFixed(2);
      nextValues.amount = ratePerCbm > 0 ? formatMoneyValue(amountVal) : "";
    } else {
      nextValues.cbm = "";
      nextValues.cft = "";
      nextValues.cbf = "";
      nextValues.amount = "";
    }
    return nextValues;
  }

  const shouldCalculateFromDimensions =
    isFinishedOrder ||
    changedKey === "itemName" ||
    changedKey === "length" ||
    changedKey === "width" ||
    changedKey === "quantitySheets" ||
    changedKey === "noOfLeaves";
  const areaValues: Record<string, string> = shouldCalculateFromDimensions
    ? applyDimensionAreaCalculations(values, { clearWhenIncomplete: isFinishedOrder })
    : { ...values };
  const sqm = parsePositiveNumber(areaValues.sqm);
  const nextValues: Record<string, string> =
    !isFinishedOrder && changedKey === "sqm" && sqm > 0
      ? { ...areaValues, totalSqm: formatAreaValue(sqm * sqmToSqf) }
      : areaValues;
  const sqf = parsePositiveNumber(nextValues.totalSqm);
  const rate = parsePositiveNumber(nextValues.ratePerSqf);

  const isVeneer = normProduct === "veneer";
  const effectiveArea = isVeneer ? sqm : (sqf > 0 ? sqf : sqm);

  return {
    ...nextValues,
    amount: effectiveArea > 0 && rate > 0 ? formatMoneyValue(effectiveArea * rate) : "",
  };
}

function applyDimensionAreaCalculations(
  values: Record<string, string>,
  options: { clearWhenIncomplete: boolean },
): Record<string, string> {
  const length = parseDimensionToMeters(values.length);
  const width = parseDimensionToMeters(values.width);
  const normProduct = normalizeProductType(values.productCategory || values.finishedType);
  const isVeneer = normProduct === "veneer";
  const count = isVeneer
    ? (parsePositiveNumber(values.noOfLeaves) || 1)
    : (parsePositiveNumber(values.quantitySheets) || 1);

  if (length > 0 && width > 0 && count > 0) {
    const sqm = length * width * count;

    return {
      ...values,
      sqm: formatAreaValue(sqm),
      totalSqm: formatAreaValue(sqm * sqmToSqf),
    };
  }

  if (!options.clearWhenIncomplete) {
    return values;
  }

  return {
    ...values,
    sqm: "",
    totalSqm: "",
  };
}

function parseDimensionToMeters(value: string | undefined) {
  const numberValue = parsePositiveNumber(value);

  if (numberValue <= 0) {
    return 0;
  }

  return numberValue > 100 ? numberValue / 1000 : numberValue;
}

function parsePositiveNumber(value: string | undefined) {
  if (!value) {
    return 0;
  }

  const numericValue = Number(value.replace(/,/g, ""));

  return Number.isNaN(numericValue) || numericValue < 0 ? 0 : numericValue;
}

function isValidDoubleValue(value: string) {
  return /^\d+(\.\d+)?$/.test(value.replace(/,/g, ""));
}

function sanitizeDoubleInput(value: string) {
  const sanitized = value.replace(/[^0-9.]/g, "");
  const [integerPart = "", ...decimalParts] = sanitized.split(".");

  if (decimalParts.length === 0) {
    return integerPart;
  }

  return `${integerPart}.${decimalParts.join("")}`;
}

function isNumericLineItemKey(key: keyof Omit<OrderLineItem, "id">) {
  return [
    "length",
    "width",
    "thickness",
    "quantitySheets",
    "noOfLeaves",
    "sqm",
    "totalSqm",
    "ratePerSqf",
    "amount",
  ].includes(key);
}

function formatAreaValue(value: number) {
  return formatSQM(value);
}

function formatMoneyValue(value: number) {
  return formatAmount(value);
}

function renderField({
  column,
  currentValues,
  disabled = false,
  errorText,
  itemRows,
  onChange,
  onOpenDropdown,
  onOpenItemDetails,
  subCategoryOptions = [],
  value,
}: {
  column: OrderLineItemColumn;
  currentValues: Record<string, string>;
  disabled?: boolean;
  errorText?: string;
  itemRows: readonly MasterRecord[];
  onChange: (value: string) => void;
  onOpenDropdown?: () => void;
  onOpenItemDetails: (itemName: string) => void;
  subCategoryOptions?: readonly string[];
  value: string;
}) {
  const selectOptions = getColumnOptions(
    column,
    itemRows,
    currentValues,
    subCategoryOptions,
  );
  const isFieldDisabled = disabled || column.readOnly;
  const control =
    column.type === "select" ? (
      <ErpSelectField
        dropdownWidth={column.dropdownWidth ?? Math.max(column.controlWidth, 240)}
        helperText={errorText}
        onChange={onChange}
        onOpen={
          column.key === "itemName" ||
          column.key === "subCategory" ||
          column.key === "baseName" ||
          column.key === "baseType"
            ? onOpenDropdown
            : undefined
        }
        options={selectOptions}
        searchable={selectOptions.length > 6}
        size="regular"
        state={errorText ? "error" : isFieldDisabled ? "disabled" : "default"}
        value={value}
      />
    ) : (
      <TextField
        disabled={disabled}
        error={Boolean(errorText)}
        fullWidth
        helperText={errorText}
        size="small"
        value={value}
        onChange={(event) =>
          onChange(column.numeric ? sanitizeDoubleInput(event.target.value) : event.target.value)
        }
        slotProps={{
          input: {
            inputMode: column.numeric ? "decimal" : undefined,
            readOnly: column.readOnly,
          },
        }}
        sx={(theme) => ({
          ...getCompactFieldSx(
            theme,
            errorText ? "error" : column.readOnly ? "readOnly" : "default",
            { large: true },
          ),
          "& .MuiInputBase-root": {
            minHeight: 40,
          },
          ...(column.readOnly
            ? {
              "& .MuiInputBase-root": {
                minHeight: 40,
                backgroundColor: theme.customTokens.surfaces.alt,
                color: theme.customTokens.text.secondary,
                cursor: "default",
              },
              "& .MuiInputBase-input": {
                fontWeight: 600,
              },
            }
            : {}),
        })}
      />
    );

  if (!column.showItemDetails) {
    return control;
  }

  return (
    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ width: "100%" }}>
      <Box sx={{ minWidth: 0, flex: 1 }}>{control}</Box>
      <IconButton
        aria-label="View item details"
        disabled={!getItemMasterRecord(itemRows, value)}
        onClick={() => onOpenItemDetails(value)}
        size="small"
        sx={(theme) => ({
          color: theme.customTokens.navigation.activeText,
          height: theme.spacing(4),
          width: theme.spacing(4),
          "&.Mui-disabled": {
            color: theme.palette.text.disabled,
          },
          "&:hover": {
            backgroundColor: theme.customTokens.navigation.hoverBackground,
          },
        })}
      >
        <Info size={14} />
      </IconButton>
    </Stack>
  );
}

function ItemDetailsDialog({
  item,
  onClose,
  open,
}: {
  item: MasterRecord | null;
  onClose: () => void;
  open: boolean;
}) {
  const detailValue = (key: string) => formatMasterValue(item?.[key]);
  const identityFields = itemDetailColumns
    .filter((column) => ["itemName", "itemCode", "category", "subCategory"].includes(column.key))
    .map((column) => ({ label: column.label, value: detailValue(column.key) }));
  const classificationFields = itemDetailColumns
    .filter((column) => ["color", "hsn", "gst"].includes(column.key))
    .map((column) => ({ label: column.label, value: detailValue(column.key) }));
  const remark = detailValue("remark");

  return (
    <Dialog
      fullWidth
      maxWidth="lg"
      onClose={onClose}
      open={open}
      slotProps={{
        paper: {
          sx: (theme) => ({
            borderRadius: `${theme.customTokens.radius.md}px`,
            boxShadow: theme.customTokens.elevation.md,
            maxHeight: "calc(100% - 32px)",
            overflow: "hidden",
            outline: "none",
            width: "min(94vw, 1120px)",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          }),
        },
      }}
    >
      <DialogTitle
        sx={(theme) => ({
          alignItems: "center",
          backgroundColor: theme.customTokens.surfaces.surface,
          borderBottom: `1px solid ${theme.customTokens.borders.default}`,
          display: "flex",
          gap: 1.25,
          px: 2.5,
          py: 1.5,
        })}
      >
        <Box
          sx={(theme) => ({
            alignItems: "center",
            backgroundColor: theme.customTokens.brand.primary,
            borderRadius: "7px",
            color: theme.customTokens.text.inverse,
            display: "flex",
            flexShrink: 0,
            height: 34,
            justifyContent: "center",
            width: 34,
          })}
        >
          <Info size={17} />
        </Box>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 17, fontWeight: 750, lineHeight: 1.25 }}>
            Item Details
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: 12.5, mt: 0.2 }}>
            Master information for the selected order item
          </Typography>
        </Box>
        <IconButton
          aria-label="Close item details"
          onClick={onClose}
          size="small"
          sx={(theme) => ({
            color: theme.customTokens.text.secondary,
            "&:hover": {
              backgroundColor: theme.customTokens.navigation.hoverBackground,
              color: theme.customTokens.brand.primary,
            },
          })}
        >
          <X size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent
        sx={(theme) => ({
          backgroundColor: theme.customTokens.surfaces.alt,
          p: "16px !important",
        })}
      >
        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(1.5),
            gridTemplateColumns: { xs: "1fr", md: "1.15fr 0.85fr" },
          })}
        >
          <ItemDetailSection fields={identityFields} title="Item Information" />
          <ItemDetailSection fields={classificationFields} title="Classification & Tax" />
          <ItemDetailSection
            fields={[{ label: "Remark", value: remark }]}
            fullWidth
            title="Remark"
          />
        </Box>
      </DialogContent>
      <DialogActions
        sx={(theme) => ({
          backgroundColor: theme.customTokens.surfaces.surface,
          borderTop: `1px solid ${theme.customTokens.borders.default}`,
          px: 2.5,
          py: 1.25,
        })}
      >
        <Button
          disableElevation
          onClick={onClose}
          sx={recordFormActionButtonSx}
          variant="contained"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ItemDetailSection({
  fields,
  fullWidth = false,
  title,
}: {
  fields: readonly { label: string; value: string }[];
  fullWidth?: boolean;
  title: string;
}) {
  return (
    <Box
      sx={(theme) => ({
        ...formSectionCardSx(theme),
        gridColumn: fullWidth ? "1 / -1" : "auto",
      })}
    >
      <FormSectionHeader title={title} />
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: theme.spacing(1),
          gridTemplateColumns: {
            xs: "1fr",
            sm: fullWidth ? "1fr" : "repeat(2, minmax(0, 1fr))",
          },
          pt: 1.15,
        })}
      >
        {fields.map((field) => (
          <Box
            key={field.label}
            sx={(theme) => ({
              backgroundColor: theme.customTokens.surfaces.alt,
              border: `1px solid ${theme.customTokens.borders.divider}`,
              borderRadius: "7px",
              minHeight: fullWidth ? 62 : 68,
              minWidth: 0,
              px: 1.25,
              py: 1,
            })}
          >
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.secondary,
                fontSize: 11.5,
                fontWeight: 600,
                letterSpacing: "0.02em",
                mb: 0.45,
                textTransform: "uppercase",
              })}
            >
              {field.label}
            </Typography>
            <Typography
              sx={(theme) => ({
                color: theme.customTokens.text.primary,
                fontSize: 13.5,
                fontWeight: 600,
                lineHeight: 1.45,
                overflowWrap: "anywhere",
              })}
            >
              {field.value || "-"}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
}

function formatOrderItemNo(itemId: string, index: number) {
  const numericTail = String(itemId).match(/(\d+)$/)?.[1];
  const sequence = numericTail
    ? Number.parseInt(numericTail, 10)
    : index + 1;

  return `OI-${String(Number.isFinite(sequence) ? sequence : index + 1).padStart(3, "0")}`;
}

function getItemMasterRows() {
  const cached = getCachedItemMasterRows();
  if (cached && cached.length > 0) {
    return cached;
  }
  return buildLocalMasterDefinition(itemMasterDefinition).rows;
}

function getProductTypeCategoryFilter(productType?: string): string {
  const norm = normalizeProductType(productType);
  if (!norm) return "";

  const labels: Record<string, string> = {
    veneer: "Veneer",
    sawing: "Sawing",
    mdf: "MDF",
    plywood: "Plywood",
    decorative: "Decorative",
    marquetry: "Marquetry",
    fluted: "Fluted",
    embossed: "Embossed",
  };

  return labels[norm] ?? norm;
}

function isActiveMasterRow(row: MasterRecord) {
  return String(row.status ?? "Active").toLowerCase() !== "inactive";
}

function getItemMasterOptionsForSelection(
  rows: readonly MasterRecord[],
  subCategory?: string,
) {
  const selectedSubCategory = String(subCategory ?? "").trim().toLowerCase();
  if (!selectedSubCategory) {
    return [];
  }

  return Array.from(
    new Set(
      rows
        .filter(isActiveMasterRow)
        .filter(
          (row) =>
            String(row.subCategory ?? "").trim().toLowerCase() === selectedSubCategory,
        )
        .map((row) => String(row.itemName ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getAllSubCategoryMasterOptions(subCategoryRows: readonly MasterRecord[]) {
  return Array.from(
    new Set(
      subCategoryRows
        .filter(isActiveMasterRow)
        .map((row) => String(row.itemSubCategory ?? row.name ?? "").trim())
        .filter(Boolean),
    ),
  );
}

function getColumnOptions(
  column: OrderLineItemColumn,
  itemRows: readonly MasterRecord[],
  values: Record<string, string>,
  subCategoryOptions: readonly string[] = [],
) {
  if (column.key === "baseName") {
    return getBaseNameOptions(itemRows, values.baseType);
  }

  if (column.key === "subCategory") {
    return subCategoryOptions.length > 0
      ? [...subCategoryOptions]
      : getAllSubCategoryMasterOptions(getCachedItemSubCategoryMasterRows());
  }

  if (column.key === "itemName") {
    return getItemMasterOptionsForSelection(itemRows, values.subCategory);
  }

  return column.options ?? [];
}

function getBaseNameOptions(rows: readonly MasterRecord[], baseType: string | undefined) {
  const normalizedBaseType = String(baseType ?? "").trim().toLowerCase();

  if (!normalizedBaseType) {
    return [];
  }

  const matched = Array.from(
    new Set(
      rows
        .filter(
          (row) => String(row.status ?? "Active").toLowerCase() !== "inactive",
        )
        .filter((row) =>
          [row.category, row.subCategory, row.itemName].some((fieldValue) =>
            String(fieldValue ?? "").toLowerCase().includes(normalizedBaseType),
          ),
        )
        .map((row) => String(row.itemName ?? "").trim())
        .filter(Boolean),
    ),
  );

  if (matched.length > 0) {
    return matched;
  }

  const label = baseType?.trim() || "Base";
  return [
    `${label} Commercial 01`,
    `${label} Marine Grade 02`,
    `${label} Standard Calibrated`,
    `${label} Premium Hardwood`,
  ];
}

function getItemMasterRecord(rows: readonly MasterRecord[], itemName: string) {
  const normalizedName = itemName.trim().toLowerCase();

  if (!normalizedName) {
    return undefined;
  }

  return rows.find(
    (row) => String(row.itemName ?? "").trim().toLowerCase() === normalizedName,
  );
}

function applyOrderItemMasterDefaults(
  values: Record<string, string>,
  itemName: string,
  itemRows: readonly MasterRecord[],
  isFinishedOrder: boolean,
) {
  const item = getItemMasterRecord(itemRows, itemName);

  if (!item) {
    return values;
  }

  const nextValues = { ...values };
  const category = masterRecordString(item, "category");
  const subCategory = masterRecordString(item, "subCategory");

  if (isFinishedOrder) {
    if (!nextValues.salesItemName?.trim()) {
      nextValues.salesItemName = itemName;
    }

    applyOrderItemDimensionDefaults(nextValues, item);

    return nextValues;
  }

  // Preserve user-selected Product Type (especially Embossed, Fluted, Marquetry, Decorative, etc.)
  if (!nextValues.productCategory?.trim()) {
    const productType = getRawProductTypeFromItem(item);

    if (productType) {
      nextValues.productCategory = formatProductTypeLabel(productType);
    } else if (category) {
      nextValues.productCategory = formatProductTypeLabel(category);
    }
  }

  if (subCategory && !nextValues.subCategory?.trim()) {
    nextValues.subCategory = subCategory;
  }

  applyOrderItemDimensionDefaults(nextValues, item);

  return nextValues;
}

function applyOrderItemDimensionDefaults(
  values: Record<string, string>,
  item: MasterRecord,
) {
  const dimensionDefaults: Array<[string, keyof Omit<OrderLineItem, "id">]> = [
    [getMasterValueFromKeys(item, ["length", "itemLength", "standardLength"]), "length"],
    [getMasterValueFromKeys(item, ["width", "itemWidth", "standardWidth"]), "width"],
    [
      getMasterValueFromKeys(item, ["thickness", "itemThickness", "standardThickness"]),
      "thickness",
    ],
    [
      getMasterValueFromKeys(item, [
        "quantitySheets",
        "noOfSheets",
        "numberOfSheets",
        "sheets",
      ]),
      "quantitySheets",
    ],
    [getMasterValueFromKeys(item, ["sqm", "totalSqm"]), "sqm"],
    [getMasterValueFromKeys(item, ["sqf", "totalSqf"]), "totalSqm"],
    [getMasterValueFromKeys(item, ["ratePerSqf", "rate", "ratePerSQF"]), "ratePerSqf"],
  ];

  dimensionDefaults.forEach(([value, key]) => {
    if (value) {
      values[key] = value;
    }
  });
}

function getMasterValueFromKeys(record: MasterRecord, keys: readonly string[]) {
  const value = keys
    .map((key) => record[key])
    .find((fieldValue) => String(fieldValue ?? "").trim().length > 0);

  return typeof value === "string" ? value.trim() : "";
}

function getRawProductTypeFromItem(item: MasterRecord) {
  const source = [
    masterRecordString(item, "category"),
    masterRecordString(item, "subCategory"),
    masterRecordString(item, "itemName"),
  ]
    .join(" ")
    .toLowerCase();

  if (source.includes("mdf")) {
    return "MDF";
  }

  if (source.includes("plywood")) {
    return "Plywood";
  }

  if (source.includes("veneer")) {
    return "Veneer";
  }

  return "";
}

function masterRecordString(record: MasterRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value.trim() : "";
}

function getHeaderCellSx(
  theme: Theme,
  minWidth: number,
  textAlign: "left" | "center" | "right" = "left",
) {
  return transactionTableHeaderCellSx(theme, minWidth, textAlign);
}

function getBodyCellSx(
  theme: Theme,
  textAlign: "left" | "center" | "right" = "left",
) {
  return {
    ...transactionTableBodyCellSx(theme, textAlign),
    verticalAlign: "middle" as const,
  } as const;
}

function getScrollableTableSx(theme: Theme) {
  return {
    overflowX: "auto",
    overflowY: "hidden",
    scrollbarWidth: "thin",
    scrollbarColor: `${theme.customTokens.brand.primary} ${theme.customTokens.surfaces.alt}`,
    "&::-webkit-scrollbar": {
      height: 8,
    },
    "&::-webkit-scrollbar-track": {
      backgroundColor: theme.customTokens.surfaces.alt,
    },
    "&::-webkit-scrollbar-thumb": {
      borderRadius: 999,
      backgroundColor: theme.customTokens.brand.primary,
    },
  } as const;
}

function getActionButtonSx(theme: Theme) {
  return {
    color: theme.customTokens.navigation.activeText,
    "&:hover": {
      backgroundColor: theme.customTokens.navigation.hoverBackground,
    },
  } as const;
}
