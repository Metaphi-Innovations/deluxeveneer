import { useMemo, useState } from "react";

import type { EnterpriseTableCellValue } from "../../../components/data-display/EnterpriseDataTable";
import {
  dispatchDoneListingColumns,
  dispatchIssuedListingColumns,
  type DispatchTabValue,
  usePackingRecords,
} from "../../packing/shared/packingStore";

export function useDispatchList() {
  const records = usePackingRecords();
  const [activeTab, setActiveTab] = useState<DispatchTabValue>("issued");
  const [searchValue, setSearchValue] = useState("");

  const columns = useMemo(
    () =>
      activeTab === "issued"
        ? dispatchIssuedListingColumns
        : dispatchDoneListingColumns,
    [activeTab],
  );

  const rows = useMemo(() => {
    const tabRows = records.filter((record) =>
      activeTab === "issued"
        ? record.packingState === "done"
        : record.packingState === "dispatched",
    );
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return tabRows;
    }

    return tabRows.filter((row) =>
      Object.values(row).some((value) =>
        formatDispatchSearchValue(value).includes(normalizedSearch),
      ),
    );
  }, [activeTab, records, searchValue]);

  return {
    activeTab,
    columns,
    rows,
    searchValue,
    setActiveTab,
    setSearchValue,
  };
}

function formatDispatchSearchValue(value: EnterpriseTableCellValue) {
  if (value instanceof Date) {
    return new Intl.DateTimeFormat("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
      .format(value)
      .toLowerCase();
  }

  if (value === null || typeof value === "undefined") {
    return "";
  }

  return String(value).toLowerCase();
}
