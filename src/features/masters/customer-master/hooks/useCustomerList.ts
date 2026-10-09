import { useMemo } from "react";

import { useMasterListingController } from "../../shared/useMasterListingController";
import {
  fetchCustomerMasterColumnDropdown,
  fetchCustomerMasterPaginated,
  refreshCustomerMasterCache,
  updateCustomerMasterStatus,
} from "../api/customerMasterApi";
import { customerMasterDefinition } from "../customerMasterDefinition";

const CUSTOMER_SORT_FIELD_MAP: Record<string, string> = {
  customerName: "customerName",
  companyName: "companyName",
  customerType: "customerType",
  email: "email",
  phoneNumber: "phoneNumber",
  gstNo: "gstNo",
  remark: "remarks",
  remarks: "remarks",
  status: "status",
  createdDate: "createdAt",
  createdAt: "createdAt",
  createdBy: "createdAt",
  updatedDate: "updatedAt",
  updatedAt: "updatedAt",
  editedBy: "updatedAt",
  updatedBy: "updatedAt",
};

const STATIC_CUSTOMER_TYPE_OPTIONS = ["Platinum", "Gold", "Silver"];

export function useCustomerList() {
  const list = useMasterListingController({
    master: "customer",
    sortFieldMap: CUSTOMER_SORT_FIELD_MAP,
    fetchPage: fetchCustomerMasterPaginated,
    fetchColumnDropdown: fetchCustomerMasterColumnDropdown,
    onLoaded: (items) => {
      void refreshCustomerMasterCache(items);
    },
    updateStatus: updateCustomerMasterStatus,
    statusErrorMessage: "Unable to update customer status.",
  });
  const definition = useMemo(
    () => ({
      ...customerMasterDefinition,
      filters: customerMasterDefinition.filters.map((filter) => {
        if (filter.key === "companyName") {
          return {
            ...filter,
            options: (list.filterOptionsByColumn.companyName ?? []).map(
              (entry) => entry.label,
            ),
          };
        }
        if (filter.key === "customerType") {
          return { ...filter, options: STATIC_CUSTOMER_TYPE_OPTIONS };
        }
        return filter;
      }),
    }),
    [list.filterOptionsByColumn],
  );

  return { ...list, definition };
}
