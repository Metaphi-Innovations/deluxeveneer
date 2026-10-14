import { Alert } from "@mui/material";
import { useParams } from "react-router";

import {
  dryingDefinition,
  FactoryForm,
  FactoryListing,
  FactoryPageShell,
  FactoryProcessCreatePage,
} from "../../shared";
import {
  findDryingDoneRow,
  getDryingDoneEditBlockReason,
} from "../dryingFrontendStore";

import { DryingCreatePage } from "./DryingCreatePage";

export function DryingListPage() {
  return <FactoryListing definition={dryingDefinition} />;
}

export function AddDryingPage() {
  return <FactoryProcessCreatePage definition={dryingDefinition} />;
}

export function EditDryingPage() {
  const { id = "" } = useParams();
  const row = findDryingDoneRow(id, dryingDefinition.rows);
  const editBlockReason = row ? getDryingDoneEditBlockReason(row, dryingDefinition.rows) : "";

  if (editBlockReason) {
    return (
      <FactoryPageShell
        breadcrumbs={[
          { label: "Factory", to: "/factory" },
          { label: "Drying", to: "/factory/drying?tab=done" },
          { label: "Edit" },
        ]}
        title="Edit Drying"
      >
        <Alert severity="warning">{editBlockReason}</Alert>
      </FactoryPageShell>
    );
  }

  return <FactoryForm definition={dryingDefinition} mode="edit" />;
}

export function ViewDryingPage() {
  return <FactoryForm definition={dryingDefinition} mode="view" />;
}
