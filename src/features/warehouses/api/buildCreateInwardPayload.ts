import { fetchCurrenciesPaginated } from "../../masters/currency-master/currencyMasterApi";
import { fetchGstsPaginated } from "../../masters/gst-master/gstMasterApi";
import { fetchHsnsPaginated } from "../../masters/hsn-master/hsnMasterApi";
import { fetchItemsPaginated } from "../../masters/item-name-master/itemMasterApi";
import { fetchItemSubCategoriesPaginated } from "../../masters/item-sub-category-master/itemSubCategoryMasterApi";
import {
  getCachedSupplierMasterRows,
  refreshSupplierMasterCache,
} from "../../masters/supplier-master/api/supplierMasterApi";
import type { MasterRecord } from "../../masters/shared";
import type {
  CreateInwardChargePayload,
  CreateInwardConsumablePayload,
  CreateInwardItemPayload,
  CreateInwardPayload,
  InwardInventoryType,
} from "../api/inwardApi";
import {
  inventoryTypeFromSlug,
  type ApiSupportedInwardSlug,
} from "../inward/supportedInwardTypes";

function parseNumber(value: string | undefined | null): number | null {
  if (value === undefined || value === null || value.trim() === "") {
    return null;
  }
  const parsed = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(value: string | undefined | null): number {
  return parseNumber(value) ?? 0;
}

function toDateOnly(value: Date | null | undefined): string {
  const date = value instanceof Date && !Number.isNaN(value.getTime())
    ? value
    : new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function toOptionalDateOnly(value: Date | null | undefined): string | null {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
    return null;
  }
  return toDateOnly(value);
}

function normalizeLabel(value: string | undefined | null): string {
  return String(value ?? "").trim().toLowerCase();
}

function asOptionalId(value: unknown): string | null {
  const id = String(value ?? "").trim();
  return id || null;
}

async function resolveSupplierId(supplierName: string): Promise<string> {
  let rows = getCachedSupplierMasterRows();
  if (rows.length === 0) {
    rows = await refreshSupplierMasterCache();
  }

  const normalized = normalizeLabel(supplierName);
  const match = rows.find(
    (row) =>
      normalizeLabel(String(row.supplierName ?? "")) === normalized ||
      normalizeLabel(String(row.name ?? "")) === normalized,
  );

  if (!match?.id) {
    throw new Error(
      `Supplier "${supplierName}" was not found. Refresh suppliers and try again.`,
    );
  }

  return String(match.id);
}

async function resolveCurrencyId(currencyName: string): Promise<string> {
  const result = await fetchCurrenciesPaginated({
    page: 1,
    limit: 100,
    status: true,
    search: currencyName,
  });

  const normalized = normalizeLabel(currencyName);
  const match =
    result.items.find(
      (row) =>
        normalizeLabel(String(row.currencyName ?? "")) === normalized ||
        normalizeLabel(String(row.name ?? "")) === normalized,
    ) ??
    result.items.find((row) =>
      normalizeLabel(String(row.currencyName ?? row.name ?? "")).includes(
        normalized,
      ),
    );

  if (!match?.id) {
    throw new Error(
      `Currency "${currencyName}" was not found in Currency Master.`,
    );
  }

  return String(match.id);
}

function mapMode(mode: string): string | null {
  const normalized = mode.trim();
  if (!normalized) return null;
  return normalized;
}

async function resolveItemMasterByName(
  itemName: string,
): Promise<MasterRecord | null> {
  const normalized = normalizeLabel(itemName);
  if (!normalized) return null;

  const result = await fetchItemsPaginated({
    page: 1,
    limit: 50,
    status: true,
    search: itemName.trim(),
  });

  return (
    result.items.find(
      (row) =>
        normalizeLabel(String(row.itemName ?? "")) === normalized ||
        normalizeLabel(String(row.name ?? "")) === normalized,
    ) ?? null
  );
}

async function resolveHsnRecord(hsnCode: string): Promise<MasterRecord | null> {
  const normalized = normalizeLabel(hsnCode);
  if (!normalized) return null;

  const result = await fetchHsnsPaginated({
    page: 1,
    limit: 50,
    status: true,
    search: hsnCode.trim(),
  });

  return (
    result.items.find(
      (row) =>
        normalizeLabel(String(row.hsnCode ?? "")) === normalized ||
        normalizeLabel(String(row.code ?? "")) === normalized ||
        normalizeLabel(String(row.hsn ?? "")) === normalized,
    ) ?? null
  );
}

async function resolveGstId(gstPercentage: string): Promise<string | null> {
  const numeric = parseNumber(String(gstPercentage).replace(/%/g, ""));
  if (numeric === null) return null;

  // Avoid server-side Decimal equality search — match client-side instead.
  const result = await fetchGstsPaginated({
    page: 1,
    limit: 100,
    status: true,
  });

  const match =
    result.items.find((row) => {
      const percentage = parseNumber(
        String(row.percentage ?? row.gstPercentage ?? "").replace(/%/g, ""),
      );
      return percentage !== null && Math.abs(percentage - numeric) < 0.001;
    }) ?? null;

  return asOptionalId(match?.id);
}

async function mapLineItemToPayload(
  values: Record<string, string>,
  inventoryType: InwardInventoryType,
): Promise<CreateInwardItemPayload> {
  const itemName = String(values.itemName ?? "").trim();
  const subCategoryName = String(
    values.itemSubCategory ?? values.subCategory ?? "",
  ).trim();
  const hsnCode = String(values.hsn ?? values.hsnCode ?? "").trim();
  const gstPercentage = String(values.gstPercentage ?? "").trim();

  const amount = parseRequiredNumber(
    values.productAmount ?? values.amount ?? "0",
  );
  const cgst = parseRequiredNumber(values.cgst);
  const sgst = parseRequiredNumber(values.sgst);
  const igst = parseRequiredNumber(values.igst);
  const totalAmount =
    parseNumber(values.totalAmount) ?? amount + cgst + sgst + igst;

  const itemMaster = await resolveItemMasterByName(itemName);

  let itemSubCategoryId =
    asOptionalId(itemMaster?.subCategoryId) &&
    normalizeLabel(String(itemMaster?.subCategory ?? "")) ===
      normalizeLabel(subCategoryName)
      ? asOptionalId(itemMaster?.subCategoryId)
      : null;

  let itemCategoryId = asOptionalId(itemMaster?.categoryId);

  if (!itemSubCategoryId && subCategoryName) {
    const result = await fetchItemSubCategoriesPaginated({
      page: 1,
      limit: 50,
      status: true,
      search: subCategoryName.trim(),
    });
    const match =
      result.items.find(
        (row) =>
          normalizeLabel(String(row.itemSubCategory ?? "")) ===
            normalizeLabel(subCategoryName) ||
          normalizeLabel(String(row.name ?? "")) ===
            normalizeLabel(subCategoryName) ||
          normalizeLabel(String(row.subCategory ?? "")) ===
            normalizeLabel(subCategoryName),
      ) ?? null;
    itemSubCategoryId = asOptionalId(match?.id);
    if (!itemCategoryId) {
      itemCategoryId = asOptionalId(match?.categoryId);
    }
  }

  if (subCategoryName && !itemSubCategoryId) {
    throw new Error(
      `Item Sub Category "${subCategoryName}" was not found. Refresh masters and try again.`,
    );
  }

  const hsnFromItemMaster =
    asOptionalId(itemMaster?.hsnId) &&
    normalizeLabel(String(itemMaster?.hsn ?? itemMaster?.hsnCode ?? "")) ===
      normalizeLabel(hsnCode)
      ? asOptionalId(itemMaster?.hsnId)
      : null;

  const hsnRecord = await resolveHsnRecord(hsnCode);
  const hsnId = hsnFromItemMaster || asOptionalId(hsnRecord?.id);

  const gstId =
    (await resolveGstId(gstPercentage)) ||
    asOptionalId(hsnRecord?.gstId) ||
    (await resolveGstId(
      String(
        hsnRecord?.gstPercentage ??
          hsnRecord?.gst ??
          itemMaster?.gstPercentage ??
          itemMaster?.gst ??
          "",
      ),
    ));

  if (gstPercentage && !gstId) {
    throw new Error(
      `GST "${gstPercentage}" was not found in GST master. Add it or pick a valid GST %.`,
    );
  }

  const base: CreateInwardItemPayload = {
    itemId: asOptionalId(itemMaster?.id),
    itemName,
    itemCategoryId,
    itemSubCategoryId,
    hsnId,
    hsnCode: hsnCode || null,
    length: parseNumber(values.length),
    width: parseNumber(values.width),
    rate: parseNumber(values.rate),
    amount,
    gstId,
    cgst,
    sgst,
    igst,
    totalAmount,
    remark: String(values.remark ?? values.remarks ?? "").trim() || null,
  };

  if (inventoryType === "RAW_VENEER") {
    return {
      ...base,
      logCode: String(values.logCode ?? "").trim() || null,
      bundleNumber: String(values.bundleNumber ?? "").trim() || null,
      palletNo: String(values.palletNo ?? "").trim() || null,
      noOfLeaves: parseNumber(values.noOfLeaves),
      totalSqMeter: parseNumber(values.totalSqMeter),
      thickness: parseNumber(values.thickness),
    };
  }

  // Veneer Blocks: UI `thickness` maps to DB `height`; `logCode` field is Batch No.
  return {
    ...base,
    batchNo: String(values.batchNo ?? values.logCode ?? "").trim() || null,
    height: parseNumber(values.height ?? values.thickness),
    cbm: parseNumber(values.cbm),
  };
}

export async function buildCreateInwardPayload(input: {
  warehouseId: string;
  /** Inventory slug (`veneer-blocks` | `raw-veneer`) or enum. Defaults to veneer blocks. */
  inventorySlug?: ApiSupportedInwardSlug | string;
  inventoryType?: InwardInventoryType;
  header: {
    attachment: string;
    currency: string;
    eta: Date | null;
    etd: Date | null;
    invoiceNo: string;
    inwardDate: Date | null;
    mode: string;
    supplierName: string;
    exchangeRate?: string;
    remarks?: string;
  };
  lineItems: ReadonlyArray<{ values: Record<string, string> }>;
  otherConsumables?: ReadonlyArray<{ consumableName: string; price: string }>;
  additionalCharges: ReadonlyArray<{ chargeName: string; amount: string }>;
}): Promise<CreateInwardPayload> {
  const inventoryType: InwardInventoryType =
    input.inventoryType ??
    (input.inventorySlug
      ? inventoryTypeFromSlug(input.inventorySlug)
      : null) ??
    "VENEER_BLOCKS";

  const [supplierId, currencyId, items] = await Promise.all([
    resolveSupplierId(input.header.supplierName),
    resolveCurrencyId(input.header.currency || "INR"),
    Promise.all(
      input.lineItems.map((line) =>
        mapLineItemToPayload(line.values, inventoryType),
      ),
    ),
  ]);

  const otherConsumables: CreateInwardConsumablePayload[] = (
    input.otherConsumables ?? []
  )
    .filter((row) => row.consumableName.trim())
    .map((row) => ({
      consumableName: row.consumableName.trim(),
      price: parseRequiredNumber(row.price),
    }));

  const additionalCharges: CreateInwardChargePayload[] =
    input.additionalCharges
      .filter((charge) => charge.chargeName.trim())
      .map((charge) => ({
        chargeName: charge.chargeName.trim(),
        amount: parseRequiredNumber(charge.amount),
      }));

  return {
    warehouseId: input.warehouseId,
    inventoryType,
    inwardDate: toDateOnly(input.header.inwardDate),
    supplierId,
    invoiceNo: input.header.invoiceNo.trim(),
    currencyId,
    mode: mapMode(input.header.mode),
    eta: toOptionalDateOnly(input.header.eta),
    etd: toOptionalDateOnly(input.header.etd),
    attachmentUrl: input.header.attachment.trim() || null,
    exchangeRate: parseNumber(input.header.exchangeRate ?? null),
    remarks: input.header.remarks?.trim() || null,
    items,
    otherConsumables,
    additionalCharges,
  };
}
