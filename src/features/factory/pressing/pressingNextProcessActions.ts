import { canAccessPermission } from "../../permissions";
import { createFactoryIssueAction } from "../shared/listing/factoryListingParts";
import type { FactoryRecord } from "../shared/types";

export function getPressingNextProcessActions<Row extends FactoryRecord>(
  row: Row,
  sourceSlug: string,
) {
  const issuedFor = typeof row.issuedFor === "string" ? row.issuedFor.trim() : "";
  const normalizedIssuedFor = issuedFor.toLowerCase();
  const nextProcessesByOrderType: Record<string, readonly string[]> = {
    "CNC / Fluting": ["Fluting"],
    "CNC/Fluting": ["Fluting"],
    Decorative: ["Finishing"],
    Embossed: ["Embossing"],
    Embossing: ["Embossing"],
    Fluted: ["Fluting"],
    Fluting: ["Fluting"],
    Marquetry: [],
  };
  const nextProcesses =
    normalizedIssuedFor === "embossed" || normalizedIssuedFor === "embossing"
      ? ["Embossing"]
      : issuedFor in nextProcessesByOrderType
        ? nextProcessesByOrderType[issuedFor]!
        : ["Fluting", "Embossing"];

  return nextProcesses
    .map((process) => createFactoryIssueAction<Row>(process, sourceSlug))
    .filter((action) => canAccessPermission(action.permissionKey, "create"));
}
