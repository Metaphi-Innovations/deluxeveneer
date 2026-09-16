import { MasterFormPage, MasterListingPage } from "../../shared";
import { currencyMasterDefinition } from "../mock/currencyMasterData";

export function CurrencyMasterListPage() {
  return <MasterListingPage definition={currencyMasterDefinition} />;
}

export function AddCurrencyMasterPage() {
  return <MasterFormPage definition={currencyMasterDefinition} mode="add" />;
}

export function EditCurrencyMasterPage() {
  return <MasterFormPage definition={currencyMasterDefinition} mode="edit" />;
}

export function ViewCurrencyMasterPage() {
  return <MasterFormPage definition={currencyMasterDefinition} mode="view" />;
}
