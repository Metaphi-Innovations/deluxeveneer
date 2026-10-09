import { MasterListingPage } from "../../../shared";
import { colorMasterDefinition } from "../../colorMasterDefinition";
import { useColorList } from "../../hooks/useColorList";

export function ColorMasterListPage() {
  const list = useColorList();

  return (
    <MasterListingPage
      definition={colorMasterDefinition}
      errorMessage={list.errorMessage}
      loading={list.isLoading}
      onSearchChange={list.handleSearchChange}
      onStatusChange={list.handleStatusToggle}
      pagination={{
        page: list.page,
        rowsPerPage: list.rowsPerPage,
        totalCount: list.totalCount,
        onPageChange: list.setPage,
        onRowsPerPageChange: list.handleRowsPerPageChange,
      }}
      sorting={{
        sortBy: list.sortBy,
        sortOrder: list.sortOrder,
        onSortChange: list.handleSortChange,
      }}
      columnFilters={list.columnFilters}
      onColumnFilterOpen={(columnKey) => {
        list.loadColumnDropdown(columnKey);
      }}
      onColumnFiltersChange={list.handleColumnFiltersChange}
      filterOptionsByColumn={list.filterOptionsByColumn}
      rows={list.rows}
      searchValue={list.searchValue}
      serverSearch
    />
  );
}
