import { OrderRecordPage } from "../form/OrderRecordPage";
import { OrdersListingPage } from "../listing/OrdersListingPage";
import { orderModuleConfig } from "../shared";

export function OrdersPage() {
  return <OrdersListingPage moduleConfig={orderModuleConfig} />;
}

export function AddOrderPage() {
  return <OrderRecordPage mode="add" moduleConfig={orderModuleConfig} />;
}

export function EditOrderPage() {
  return <OrderRecordPage mode="edit" moduleConfig={orderModuleConfig} />;
}

export function ViewOrderPage() {
  return <OrdersListingPage moduleConfig={orderModuleConfig} />;
}
