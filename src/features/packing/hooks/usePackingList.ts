import { useMemo, useState } from "react";

import type { EnterpriseTableCellValue } from "../../../components/data-display/EnterpriseDataTable";
import {
  packingDoneListingColumns,
  packingIssuedListingColumns,
  type PackingTabValue,
  usePackingRecords,
} from "../shared/packingStore";

export function usePackingList() {
  const records = usePackingRecords();
  const [activeTab, setActiveTab] = useState<PackingTabValue>("issued");
  const [searchValue, setSearchValue] = useState("");

  const columns = useMemo(
    () =>
      activeTab === "issued"
        ? packingIssuedListingColumns
        : packingDoneListingColumns,
    [activeTab],
  );

  const rows = useMemo(() => {
    const tabRows = records.filter((record) =>
      activeTab === "issued"
        ? record.packingState === "issued"
        : record.packingState === "done",
    );
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return tabRows;
    }

    return tabRows.filter((row) =>
      Object.values(row).some((value) =>
        formatPackingSearchValue(value).includes(normalizedSearch),
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

function formatPackingSearchValue(value: EnterpriseTableCellValue) {
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
