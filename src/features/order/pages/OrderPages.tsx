import {
  OrderRecordPage,
  OrdersListingPage,
  orderModuleConfig,
} from "../../orders/shared";

export function OrderPage() {
  return <OrdersListingPage moduleConfig={orderModuleConfig} />;
}

export function AddOrderModulePage() {
  return <OrderRecordPage mode="add" moduleConfig={orderModuleConfig} />;
}

export function EditOrderModulePage() {
  return <OrderRecordPage mode="edit" moduleConfig={orderModuleConfig} />;
}

export function ViewOrderModulePage() {
  return <OrdersListingPage moduleConfig={orderModuleConfig} />;
}
