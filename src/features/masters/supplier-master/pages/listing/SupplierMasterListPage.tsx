import { MasterListingPage } from "../../../shared";
import { useSupplierList } from "../../hooks/useSupplierList";

export function SupplierMasterListPage() {
  const list = useSupplierList();

  return (
    <MasterListingPage
      columnFilters={list.columnFilters}
      definition={list.definition}
      errorMessage={list.errorMessage}
      filterOptionsByColumn={list.filterOptionsByColumn}
      loading={list.isLoading}
      onColumnFilterOpen={(columnKey) => {
        void list.loadColumnDropdown(columnKey);
      }}
      onColumnFiltersChange={list.handleColumnFiltersChange}
      onSearchChange={list.handleSearchChange}
      onStatusChange={list.handleStatusToggle}
      pagination={{
        page: list.page,
        rowsPerPage: list.rowsPerPage,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onRowsPerPageChange: list.handleRowsPerPageChange,
      }}
      rows={list.rows}
      searchValue={list.searchValue}
      serverSearch
      sorting={{
        sortBy: list.sortBy,
        sortOrder: list.sortOrder,
        onSortChange: list.handleSortChange,
      }}
    />
  );
}
