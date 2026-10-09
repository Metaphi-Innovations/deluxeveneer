import { MasterListingPage } from "../../../shared";
import { itemCategoryMasterDefinition } from "../../itemCategoryMasterDefinition";
import { useItemCategoryList } from "../../hooks/useItemCategoryList";

export function ItemCategoryMasterListPage() {
  const list = useItemCategoryList();

  return (
    <MasterListingPage
      columnFilters={list.columnFilters}
      definition={itemCategoryMasterDefinition}
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
