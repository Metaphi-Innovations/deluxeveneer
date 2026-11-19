import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIssueSummaryLines,
  calculateIssuedArea,
  dimensionsMatch,
  encodePackingSourceRef,
  filterCompatibleOrderItems,
  orderItemMatchesMaterial,
  parsePackingSourceRef,
  parseWholeQuantity,
  validateIssueStockForPacking,
} from "./issueStockForPacking.logic";
import type {
  IssueStockOrderItemOption,
  IssueStockOrderOption,
  IssueStockRow,
} from "./issueStockForPacking.types";

function stock(overrides: Partial<IssueStockRow> = {}): IssueStockRow {
  return {
    id: "inv-1",
    storageSrNo: "STG-1",
    productionSrNo: "PRS-1",
    palletNo: "PAL-1",
    batchNo: "BATCH-9",
    itemName: "Oak Veneer",
    subCategory: "Natural",
    materialType: "raw-veneer",
    grade: "A",
    color: "Natural",
    length: "2500",
    width: "120",
    thickness: "0.6",
    receivedQty: 100,
    availableQty: 80,
    availableSqm: 24,
    availableSqf: 258.336,
    ...overrides,
  };
}

function orderItem(
  overrides: Partial<IssueStockOrderItemOption> = {},
): IssueStockOrderItemOption {
  return {
    id: "oi-1",
    orderItemNo: "OI-007",
    productCategory: "Veneer",
    itemName: "Oak Veneer",
    grade: "A",
    length: "2500",
    width: "120",
    thickness: "0.6",
    orderedQty: 100,
    previouslyIssuedQty: 20,
    remainingQty: 80,
    sqm: 30,
    sqf: 323,
    ...overrides,
  };
}

function order(
  overrides: Partial<IssueStockOrderOption> = {},
): IssueStockOrderOption {
  return {
    id: "ord-1",
    orderNo: "ORD-RAW-1001",
    orderDate: "2026-01-01",
    deliveryDate: "2026-02-01",
    customerName: "Acme",
    status: "Active",
    orderType: "Raw",
    items: [orderItem()],
    ...overrides,
  };
}

describe("issueStockForPacking.logic", () => {
  it("parses only positive whole quantities", () => {
    assert.equal(parseWholeQuantity("12"), 12);
    assert.equal(parseWholeQuantity("0"), 0);
    assert.equal(parseWholeQuantity("12.5"), null);
    assert.equal(parseWholeQuantity("-3"), null);
    assert.equal(parseWholeQuantity("abc"), null);
  });

  it("matches material filters for veneer/plywood/mdf", () => {
    assert.equal(orderItemMatchesMaterial("Veneer", "raw-veneer"), true);
    assert.equal(orderItemMatchesMaterial("Plywood", "plywood"), true);
    assert.equal(orderItemMatchesMaterial("MDF Board", "mdf"), true);
    assert.equal(orderItemMatchesMaterial("Plywood", "raw-veneer"), false);
    assert.equal(orderItemMatchesMaterial("Veneer", "mdf"), false);
  });

  it("filters compatible order items and keeps actual order item numbers", () => {
    const items = [
      orderItem({ id: "a", orderItemNo: "OI-101", productCategory: "Veneer" }),
      orderItem({ id: "b", orderItemNo: "OI-202", productCategory: "Plywood" }),
      orderItem({ id: "c", orderItemNo: "OI-303", productCategory: "MDF" }),
    ];
    const veneer = filterCompatibleOrderItems(items, "raw-veneer");
    assert.deepEqual(
      veneer.map((item) => item.orderItemNo),
      ["OI-101"],
    );
  });

  it("detects dimension mismatches instead of allowing incompatible stock", () => {
    assert.equal(
      dimensionsMatch(stock(), orderItem({ length: "2500", width: "120", thickness: "0.6" })),
      true,
    );
    assert.equal(
      dimensionsMatch(stock(), orderItem({ length: "2400", width: "120", thickness: "0.6" })),
      false,
    );
  });

  it("allows partial issue within available and remaining qty", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([["inv-1", stock()]]),
      order: order(),
      orderItem: orderItem({ remainingQty: 50 }),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-1", qtyToIssue: "30" }],
    });
    assert.equal(result.ok, true);
  });

  it("supports multiple stock rows for the same order item", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([
        ["inv-1", stock({ id: "inv-1", availableQty: 40 })],
        ["inv-2", stock({ id: "inv-2", availableQty: 40, productionSrNo: "PRS-2" })],
      ]),
      order: order(),
      orderItem: orderItem({ remainingQty: 80 }),
      issueDate: "2026-03-01",
      lines: [
        { inventoryId: "inv-1", qtyToIssue: "25" },
        { inventoryId: "inv-2", qtyToIssue: "25" },
      ],
    });
    assert.equal(result.ok, true);
    const summary = buildIssueSummaryLines({
      material: "raw-veneer",
      stockById: new Map([
        ["inv-1", stock({ id: "inv-1", availableQty: 40 })],
        ["inv-2", stock({ id: "inv-2", availableQty: 40 })],
      ]),
      lines: [
        { inventoryId: "inv-1", qtyToIssue: "25" },
        { inventoryId: "inv-2", qtyToIssue: "25" },
      ],
    });
    assert.equal(summary.length, 2);
    assert.equal(summary.reduce((sum, line) => sum + line.qty, 0), 50);
  });

  it("rejects over-issuing available warehouse stock", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([["inv-1", stock({ availableQty: 10 })]]),
      order: order(),
      orderItem: orderItem({ remainingQty: 100 }),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-1", qtyToIssue: "11" }],
    });
    assert.equal(result.ok, false);
    assert.match(result.lineErrors["inv-1"] ?? "", /available/);
  });

  it("rejects total issue above remaining requirement", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([["inv-1", stock({ availableQty: 80 })]]),
      order: order(),
      orderItem: orderItem({ remainingQty: 20 }),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-1", qtyToIssue: "25" }],
    });
    assert.equal(result.ok, false);
    assert.match(result.formError, /remaining requirement/i);
  });

  it("rejects incompatible material or dimensions with a clear mismatch error", () => {
    const materialMismatch = validateIssueStockForPacking({
      material: "plywood",
      stockById: new Map([
        ["inv-1", stock({ materialType: "raw-veneer" })],
      ]),
      order: order({
        items: [orderItem({ productCategory: "Plywood" })],
      }),
      orderItem: orderItem({ productCategory: "Plywood" }),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-1", qtyToIssue: "5" }],
    });
    assert.equal(materialMismatch.ok, false);
    assert.match(materialMismatch.formError, /Incompatible material/i);

    const dimensionMismatch = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([["inv-1", stock({ length: "2000" })]]),
      order: order(),
      orderItem: orderItem(),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-1", qtyToIssue: "5" }],
    });
    assert.equal(dimensionMismatch.ok, false);
    assert.match(dimensionMismatch.formError, /Dimension mismatch/i);
  });

  it("rejects duplicate stock rows", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([["inv-1", stock()]]),
      order: order(),
      orderItem: orderItem(),
      issueDate: "2026-03-01",
      lines: [
        { inventoryId: "inv-1", qtyToIssue: "5" },
        { inventoryId: "inv-1", qtyToIssue: "3" },
      ],
    });
    assert.equal(result.ok, false);
    assert.match(result.formError, /duplicate/i);
  });

  it("treats missing/stale stock as invalid during revalidation", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map(),
      order: order(),
      orderItem: orderItem(),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-gone", qtyToIssue: "5" }],
    });
    assert.equal(result.ok, false);
    assert.match(result.formError, /stale/i);
  });

  it("rejects concurrent over-issue when refreshed remaining is lower", () => {
    const result = validateIssueStockForPacking({
      material: "raw-veneer",
      stockById: new Map([["inv-1", stock({ availableQty: 80 })]]),
      order: order(),
      orderItem: orderItem({ remainingQty: 4 }),
      issueDate: "2026-03-01",
      lines: [{ inventoryId: "inv-1", qtyToIssue: "10" }],
    });
    assert.equal(result.ok, false);
  });

  it("calculates issued area proportionally for partial issues", () => {
    const area = calculateIssuedArea({
      availableQty: 80,
      availableSqm: 24,
      availableSqf: 258.336,
      qtyToIssue: 40,
    });
    assert.equal(area.sqm, 12);
    assert.equal(area.sqf, 129.168);
  });

  it("encodes and preserves batch/source refs for packing visibility", () => {
    const sourceRef = encodePackingSourceRef({
      warehouseIssueId: "whc-issue-55",
      inventoryId: "inv-1",
      storageSrNo: "STG-1",
      productionSrNo: "PRS-1",
      palletNo: "PAL-1",
      batchNo: "BATCH-9",
    });
    const parsed = parsePackingSourceRef(sourceRef);
    assert.equal(parsed.warehouseIssueId, "whc-issue-55");
    assert.equal(parsed.inventoryId, "inv-1");
    assert.equal(parsed.batchNo, "BATCH-9");
    assert.equal(parsed.palletNo, "PAL-1");
    assert.equal(parsed.storageSrNo, "STG-1");
    assert.equal(parsed.productionSrNo, "PRS-1");
  });
});
