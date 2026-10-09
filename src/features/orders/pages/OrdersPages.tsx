import { OrderRecordPage } from "../form/OrderRecordPage";
import { OrdersListingPage } from "../listing/OrdersListingPage";

export function OrdersPage() {
  return <OrdersListingPage />;
}

export function AddOrderPage() {
  return <OrderRecordPage mode="add" />;
}

export function EditOrderPage() {
  return <OrderRecordPage mode="edit" />;
}

export function ViewOrderPage() {
  return <OrdersListingPage />;
}
