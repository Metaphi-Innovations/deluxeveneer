import { PackingRecordPage } from "../form/PackingRecordPage";
import { PackingListingPage } from "../listing/PackingListingPage";

export function PackingPage() {
  return <PackingListingPage />;
}

export function AddPackingPage() {
  return <PackingRecordPage mode="add" />;
}

export function EditPackingPage() {
  return <PackingRecordPage mode="edit" />;
}

export { ViewPackingPage } from "./ViewPackingPage";
