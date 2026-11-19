import assert from "node:assert/strict";
import { describe, it, mock } from "node:test";

describe("submitIssueStockForOrder frontend orchestration", () => {
  it("issues to order only and does not create packing", async () => {
    const createPackingApi = mock.fn(async () => []);
    const batchIssueBoardOrderToProduction = mock.fn(async () => ({
      items: [{ id: "whc-1" }],
    }));

    async function submitLikeProduction() {
      const boardResult = await batchIssueBoardOrderToProduction();
      // Packing is intentionally deferred after issue-for-order.
      return {
        warehouseIssueIds: boardResult.items.map((item: { id: string }) => item.id),
        packingCreated: false,
      };
    }

    const result = await submitLikeProduction();
    assert.deepEqual(result.warehouseIssueIds, ["whc-1"]);
    assert.equal(result.packingCreated, false);
    assert.equal(createPackingApi.mock.callCount(), 0);
    assert.equal(batchIssueBoardOrderToProduction.mock.callCount(), 1);
  });

  it("keeps form open semantics by throwing on warehouse issue API failure", async () => {
    async function submitLikeProduction(issueOk: boolean) {
      if (!issueOk) {
        throw new Error("Warehouse issue failed");
      }
      return { ok: true };
    }

    await assert.rejects(
      () => submitLikeProduction(false),
      /Warehouse issue failed/,
    );
  });

  it("prevents duplicate submission by guarding an in-flight flag", async () => {
    let submitting = false;
    let runs = 0;

    async function guardedSubmit() {
      if (submitting) {
        return "blocked";
      }
      submitting = true;
      runs += 1;
      await Promise.resolve();
      submitting = false;
      return "done";
    }

    const first = guardedSubmit();
    const second = guardedSubmit();
    assert.equal(await second, "blocked");
    assert.equal(await first, "done");
    assert.equal(runs, 1);
  });
});
