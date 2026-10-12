import { fetchCurrenciesPaginated } from "../../masters/currency-master/api/currencyMasterApi";
import { fetchGstsPaginated } from "../../masters/gst-master/api/gstMasterApi";
import { fetchHsnsPaginated } from "../../masters/hsn-master/api/hsnMasterApi";
import { fetchItemsPaginated } from "../../masters/item-name-master/api/itemMasterApi";
import {
  getCachedSupplierMasterRows,
  refreshSupplierMasterCache,
} from "../../masters/supplier-master/api/supplierMasterApi";
import { fetchUnitsApi } from "../../masters/unit-master/api/unitMasterApi";
import type { MasterRecord } from "../../masters/shared";
import type {
  CreateInwardChargePayload,
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

async function resolveUnitId(unitName: string): Promise<string | null> {
  const normalized = normalizeLabel(unitName);
  if (!normalized) return null;

  const rows = await fetchUnitsApi({
    page: 1,
    limit: 100,
    status: true,
    search: unitName.trim(),
  });

  const match = rows.find(
    (row) =>
      normalizeLabel(String(row.unitName ?? "")) === normalized ||
      normalizeLabel(String(row.name ?? "")) === normalized,
  );

  return match?.id ? String(match.id) : null;
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
  const inwardItemCode = String(values.inwardItemCode ?? "").trim();
  const factoryCode = String(values.factoryCode ?? "").trim();
  const hsnCode = String(values.hsn ?? values.hsnCode ?? "").trim();
  const gstPercentage = String(values.gstPercentage ?? "").trim();

  if (!inwardItemCode) {
    throw new Error("Inward Item Code is required.");
  }
  if (!factoryCode) {
    throw new Error("Factory Code is required.");
  }

  const amount = parseRequiredNumber(
    values.productAmount ?? values.amount ?? "0",
  );
  const cgst = parseRequiredNumber(values.cgst);
  const sgst = parseRequiredNumber(values.sgst);
  const igst = parseRequiredNumber(values.igst);
  const totalAmount =
    parseNumber(values.totalAmount) ?? amount + cgst + sgst + igst;

  const itemMaster = await resolveItemMasterByName(itemName);
  const itemCategoryId = asOptionalId(itemMaster?.categoryId);

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
    itemSubCategoryId: null,
    hsnId,
    hsnCode: hsnCode || null,
    inwardItemCode,
    factoryCode,
    batchNo: String(values.batchNo ?? values.logCode ?? "").trim() || null,
    palletNo: String(values.palletNo ?? values.palletNumber ?? "").trim() || null,
    logCode: String(values.logCode ?? "").trim() || null,
    bundleNumber: String(values.bundleNumber ?? "").trim() || null,
    noOfLeaves: parseNumber(values.noOfLeaves) !== null ? Math.round(parseNumber(values.noOfLeaves)!) : null,
    sheets: parseNumber(values.sheets ?? values.noOfSheets ?? values.totalNoOfSheets) !== null ? Math.round(parseNumber(values.sheets ?? values.noOfSheets ?? values.totalNoOfSheets)!) : null,
    totalSqMeter: parseNumber(values.totalSqMeter ?? values.totalSqm),
    length: parseNumber(values.length),
    width: parseNumber(values.width),
    height: parseNumber(values.height),
    thickness: parseNumber(values.thickness),
    cbm: parseNumber(values.cbm),
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
      batchNo: null,
      logCode: String(values.logCode ?? "").trim() || null,
      bundleNumber: String(values.bundleNumber ?? "").trim() || null,
      palletNo: String(values.palletNo ?? "").trim() || null,
      noOfLeaves: parseNumber(values.noOfLeaves),
      totalSqMeter: parseNumber(values.totalSqMeter),
      thickness: parseNumber(values.thickness),
    };
  }

  if (inventoryType === "PLYWOOD" || inventoryType === "MDF") {
    return {
      ...base,
      batchNo: null,
      logCode: null,
      palletNo: String(values.palletNo ?? "").trim() || null,
      sheets: parseNumber(values.sheets),
      totalSqMeter: parseNumber(values.totalSqMeter),
      thickness: parseNumber(values.thickness),
      length: parseNumber(values.length),
      width: parseNumber(values.width),
    };
  }

  if (inventoryType === "CONSUMABLES") {
    const unitName = String(values.unitName ?? "").trim();
    const unitId = unitName ? await resolveUnitId(unitName) : null;
    return {
      ...base,
      batchNo: null,
      logCode: null,
      bundleNumber: null,
      palletNo: null,
      noOfLeaves: null,
      sheets: null,
      totalSqMeter: null,
      length: null,
      width: null,
      height: null,
      thickness: null,
      cbm: null,
      supplierItemName:
        String(values.supplierItemName ?? "").trim() || null,
      unitId,
      unitName: unitName || null,
      quantity: parseNumber(values.quantity),
    };
  }

  // Veneer Blocks: UI `thickness` → height. The Log No field still posts as batchNo until the API is renamed.
  return {
    ...base,
    batchNo: String(values.batchNo ?? values.logCode ?? "").trim() || null,
    logCode: null,
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
      (input.lineItems ?? []).map((line) =>
        mapLineItemToPayload(line.values, inventoryType),
      ),
    ),
  ]);

  const additionalCharges: CreateInwardChargePayload[] =
    (input.additionalCharges ?? [])
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
    additionalCharges,
  };
}
