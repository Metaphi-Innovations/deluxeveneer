import type { EnterpriseTableAction } from "../../../components/data-display/EnterpriseDataTable";
import { canAccessPermission } from "../../permissions";
import { createFactoryIssueAction } from "../shared/listing/factoryListingParts";
import { storePressingSampleInProduction } from "../shared/sampleSheetIdentityStore";
import type { FactoryRecord } from "../shared/types";
import { getPressingDoneIssuedForLabel } from "./pressingIssuedForLabel";

type PressingDoneDestination = "Decorative" | "Embossing" | "Finishing" | "Fluting" | "Marquetry" | "Pressing";

function resolvePressingIssuedFor(row: FactoryRecord): PressingDoneDestination | "" {
  const issuedFor = getPressingDoneIssuedForLabel(row.issuedFor).trim().toLowerCase();

  if (issuedFor === "pressing") {
    return "Pressing";
  }
  if (issuedFor.includes("marquetry")) {
    return "Marquetry";
  }
  if (issuedFor.includes("decor")) {
    return "Decorative";
  }
  if (issuedFor.includes("emboss")) {
    return "Embossing";
  }
  if (issuedFor.includes("flut")) {
    return "Fluting";
  }

  return "";
}

function withIssueLabel<Row extends FactoryRecord>(
  action: EnterpriseTableAction<Row> & { permissionKey?: string },
  label: string,
) {
  return {
    ...action,
    label,
  };
}

export function getPressingNextProcessActions<Row extends FactoryRecord>(
  row: Row,
  sourceSlug: string,
) {
  const issuedFor = resolvePressingIssuedFor(row);
  const actions: Array<EnterpriseTableAction<Row> & { permissionKey?: string }> = [];

  if (issuedFor === "Pressing") {
    const action = createFactoryIssueAction<Row>("Pressing", sourceSlug);
    actions.push({
      ...action,
      id: "issue-for-sample-sheet",
      label: "Issue for Sample Sheet",
      onSelect: (selectedRow) => {
        storePressingSampleInProduction(selectedRow);
      },
    });
  }

  if (issuedFor === "Marquetry" || issuedFor === "Decorative") {
    actions.push(
      withIssueLabel(createFactoryIssueAction<Row>("Finishing", sourceSlug), "Issue for Finishing"),
    );
  }

  if (issuedFor === "Embossing") {
    actions.push(
      withIssueLabel(createFactoryIssueAction<Row>("Embossing", sourceSlug), "Issue to Embossing"),
    );
  }

  if (issuedFor === "Fluting") {
    actions.push(
      withIssueLabel(createFactoryIssueAction<Row>("Fluting", sourceSlug), "Issue to Fluting"),
    );
  }

  return actions.filter((action) => canAccessPermission(action.permissionKey, "create"));
}
