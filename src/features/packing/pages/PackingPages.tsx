import { PackingListingPage, PackingRecordPage } from "../shared";

export function PackingPage() {
  return <PackingListingPage />;
}

export function AddPackingPage() {
  return <PackingRecordPage mode="add" />;
}

export function EditPackingPage() {
  return <PackingRecordPage mode="edit" />;
}

export function ViewPackingPage() {
  return <PackingRecordPage mode="view" />;
}
