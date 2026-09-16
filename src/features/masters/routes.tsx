import type { RouteObject } from "react-router";

import {
  AddColorMasterPage,
  ColorMasterListPage,
  EditColorMasterPage,
  ViewColorMasterPage,
} from "./color-master";
import {
  AddCurrencyMasterPage,
  CurrencyMasterListPage,
  EditCurrencyMasterPage,
  ViewCurrencyMasterPage,
} from "./currency-master";
import {
  AddCutMasterPage,
  CutMasterListPage,
  EditCutMasterPage,
  ViewCutMasterPage,
} from "./cut-master";
import {
  AddDepartmentMasterPage,
  DepartmentMasterListPage,
  EditDepartmentMasterPage,
  ViewDepartmentMasterPage,
} from "./department-master";
import {
  AddCustomerMasterPage,
  CustomerMasterListPage,
  EditCustomerMasterPage,
  ViewCustomerMasterPage,
} from "./customer-master";
import {
  AddGSTMasterPage,
  EditGSTMasterPage,
  GSTMasterListPage,
  ViewGSTMasterPage,
} from "./gst-master";
import {
  AddGradeMasterPage,
  EditGradeMasterPage,
  GradeMasterListPage,
  ViewGradeMasterPage,
} from "./grade-master";
import {
  AddHSNMasterPage,
  EditHSNMasterPage,
  HSNMasterListPage,
  ViewHSNMasterPage,
} from "./hsn-master";
import {
  AddItemCategoryMasterPage,
  EditItemCategoryMasterPage,
  ItemCategoryMasterListPage,
  ViewItemCategoryMasterPage,
} from "./item-category-master";
import {
  AddItemMasterPage,
  EditItemMasterPage,
  ItemMasterListPage,
  ViewItemMasterPage,
} from "./item-name-master";
import {
  AddItemSubCategoryMasterPage,
  EditItemSubCategoryMasterPage,
  ItemSubCategoryMasterListPage,
  ViewItemSubCategoryMasterPage,
} from "./item-sub-category-master";
import {
  AddSupplierMasterPage,
  EditSupplierMasterPage,
  SupplierMasterListPage,
  ViewSupplierMasterPage,
} from "./supplier-master";
import {
  AddTransporterMasterPage,
  EditTransporterMasterPage,
  TransporterMasterListPage,
  ViewTransporterMasterPage,
} from "./transporter-master";
import {
  AddUnitMasterPage,
  EditUnitMasterPage,
  UnitMasterListPage,
  ViewUnitMasterPage,
} from "./unit-master";
import {
  AddWarehouseLocationMasterPage,
  EditWarehouseLocationMasterPage,
  ViewWarehouseLocationMasterPage,
  WarehouseLocationMasterListPage,
} from "./warehouse-location-master";

export const masterRoutes: RouteObject[] = [
  { path: "masters/color-master", Component: ColorMasterListPage },
  { path: "masters/color-master/add", Component: AddColorMasterPage },
  { path: "masters/color-master/edit/:id", Component: EditColorMasterPage },
  { path: "masters/color-master/view/:id", Component: ViewColorMasterPage },

  { path: "masters/currency-master", Component: CurrencyMasterListPage },
  { path: "masters/currency-master/add", Component: AddCurrencyMasterPage },
  { path: "masters/currency-master/edit/:id", Component: EditCurrencyMasterPage },
  { path: "masters/currency-master/view/:id", Component: ViewCurrencyMasterPage },

  { path: "masters/cut-master", Component: CutMasterListPage },
  { path: "masters/cut-master/add", Component: AddCutMasterPage },
  { path: "masters/cut-master/edit/:id", Component: EditCutMasterPage },
  { path: "masters/cut-master/view/:id", Component: ViewCutMasterPage },

  { path: "masters/department-master", Component: DepartmentMasterListPage },
  { path: "masters/department-master/add", Component: AddDepartmentMasterPage },
  { path: "masters/department-master/edit/:id", Component: EditDepartmentMasterPage},
  { path: "masters/department-master/view/:id", Component: ViewDepartmentMasterPage,},

  { path: "masters/customer-master", Component: CustomerMasterListPage },
  { path: "masters/customer-master/add", Component: AddCustomerMasterPage },
  { path: "masters/customer-master/edit/:id", Component: EditCustomerMasterPage },
  { path: "masters/customer-master/view/:id", Component: ViewCustomerMasterPage },

  { path: "masters/grade-master", Component: GradeMasterListPage },
  { path: "masters/grade-master/add", Component: AddGradeMasterPage },
  { path: "masters/grade-master/edit/:id", Component: EditGradeMasterPage },
  { path: "masters/grade-master/view/:id", Component: ViewGradeMasterPage },

  { path: "masters/gst-master", Component: GSTMasterListPage },
  { path: "masters/gst-master/add", Component: AddGSTMasterPage },
  { path: "masters/gst-master/edit/:id", Component: EditGSTMasterPage },
  { path: "masters/gst-master/view/:id", Component: ViewGSTMasterPage },

  { path: "masters/hsn-master", Component: HSNMasterListPage },
  { path: "masters/hsn-master/add", Component: AddHSNMasterPage },
  { path: "masters/hsn-master/edit/:id", Component: EditHSNMasterPage },
  { path: "masters/hsn-master/view/:id", Component: ViewHSNMasterPage },

  { path: "masters/item-name-master", Component: ItemMasterListPage },
  { path: "masters/item-name-master/add", Component: AddItemMasterPage },
  { path: "masters/item-name-master/edit/:id", Component: EditItemMasterPage },
  { path: "masters/item-name-master/view/:id", Component: ViewItemMasterPage },

  { path: "masters/item-category-master", Component: ItemCategoryMasterListPage,},
  { path: "masters/item-category-master/add", Component: AddItemCategoryMasterPage,},
  { path: "masters/item-category-master/edit/:id", Component: EditItemCategoryMasterPage,},
  { path: "masters/item-category-master/view/:id", Component: ViewItemCategoryMasterPage,},

  { path: "masters/item-sub-category-master", Component: ItemSubCategoryMasterListPage,},
  { path: "masters/item-sub-category-master/add", Component: AddItemSubCategoryMasterPage,},
  { path: "masters/item-sub-category-master/edit/:id", Component: EditItemSubCategoryMasterPage,},
  { path: "masters/item-sub-category-master/view/:id", Component: ViewItemSubCategoryMasterPage,},

  { path: "masters/supplier-master", Component: SupplierMasterListPage },
  { path: "masters/supplier-master/add", Component: AddSupplierMasterPage },
  { path: "masters/supplier-master/edit/:id", Component: EditSupplierMasterPage },
  { path: "masters/supplier-master/view/:id", Component: ViewSupplierMasterPage },

  { path: "masters/transporter-master", Component: TransporterMasterListPage },
  { path: "masters/transporter-master/add", Component: AddTransporterMasterPage },
  { path: "masters/transporter-master/edit/:id", Component: EditTransporterMasterPage },
  { path: "masters/transporter-master/view/:id", Component: ViewTransporterMasterPage },

  { path: "masters/unit-master", Component: UnitMasterListPage },
  { path: "masters/unit-master/add", Component: AddUnitMasterPage },
  { path: "masters/unit-master/edit/:id", Component: EditUnitMasterPage },
  { path: "masters/unit-master/view/:id", Component: ViewUnitMasterPage },

  { path: "masters/warehouse-location-master", Component: WarehouseLocationMasterListPage,},
  { path: "masters/warehouse-location-master/add", Component: AddWarehouseLocationMasterPage,},
  { path: "masters/warehouse-location-master/edit/:id", Component: EditWarehouseLocationMasterPage,},
  { path: "masters/warehouse-location-master/view/:id", Component: ViewWarehouseLocationMasterPage,},
];
