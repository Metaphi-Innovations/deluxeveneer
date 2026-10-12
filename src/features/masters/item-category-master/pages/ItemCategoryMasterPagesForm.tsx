import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import { useParams } from "react-router";
import { MasterFormPage, MasterListingPage } from "../../shared";
import type { MasterDefinition, MasterRecord } from "../../shared/types";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { itemCategoryMasterDefinition } from "../mock/itemCategoryMasterData";
import {
  createItemCategoryApi,
  fetchItemCategoriesApi,
  fetchItemCategoriesPaginated,
  fetchItemCategoryColumnDropdown,
  getItemCategoryByIdApi,
  syncItemCategoryMasterToStorage,
  updateItemCategoryApi,
  updateItemCategoryStatusApi,
} from "../api/itemCategoryMasterApi";
import {
  createLocalMasterRecord,
  updateLocalMasterRecord,
} from "../../shared/localMasterStore";
import { fetchHsnsApi } from "../../hsn-master/api/hsnMasterApi";

const ITEM_CATEGORY_SORT_FIELD_MAP: Record<string, string> = {
  categoryName: "name",
  name: "name",
  hsn: "hsn",
  hsnCode: "hsn",
  gst: "gst",
  gstNo: "gst",
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

export function useHsnOptions() {
  const [hsnOptions, setHsnOptions] = useState<string[]>([]);
  const [hsnRows, setHsnRows] = useState<MasterRecord[]>([]);

  useEffect(() => {
    fetchHsnsApi({ status: true, limit: 1000 }).then((records) => {
      const activeRecords = records.filter(
        (r) => String(r.status ?? "Active").toLowerCase() !== "inactive",
      );
      const codes = activeRecords
        .map((r) => String(r.hsnCode || r.code || "").trim())
        .filter(Boolean);
      setHsnOptions([...new Set(codes)]);
      setHsnRows(activeRecords);
    }).catch(() => { });
  }, []);

  return { hsnOptions, hsnRows };
}

export function buildCategoryDefinitionWithHsn(
  baseDefinition: MasterDefinition,
  hsnOptions: string[],
  hsnRows: MasterRecord[],
): MasterDefinition {
  if (!hsnOptions.length) return baseDefinition;
  return {
    ...baseDefinition,
    fields: baseDefinition.fields.map((field) => {
      if (field.key === "hsn") {
        return { ...field, options: hsnOptions };
      }
      if (field.key === "gst") {
        return {
          ...field,
          readOnly: true,
          autoFillFrom: {
            rows: hsnRows,
            sourceSlug: "hsn-master",
            sourceKey: "hsn",
            sourceMatchKey: "hsnCode",
            sourceValueKey: "gstPercentage",
          },
        };
      }
      return field;
    }),
  };
}
