import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invalidateMaster } from "../../../../query/queryClient";
import { queryKeys } from "../../../../query/queryKeys";
import { useColumnDropdownQuery } from "../../../../query/useColumnDropdownQuery";
import { useMasterListQuery } from "../../../../query/useMasterListQuery";
import { useParams } from "react-router";

import {
  MasterFormPage,
  MasterListingPage,
  type MasterRecord,
} from "../../shared";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { transporterMasterDefinition } from "../transporterMasterDefinition";
import {
  createTransporterMasterRecord,
  fetchTransporterMasterColumnDropdown,
  fetchTransporterMasterDetail,
  fetchTransporterMasterMeta,
  fetchTransporterMasterPaginated,
  refreshTransporterMasterCache,
  updateTransporterMasterRecord,
  updateTransporterMasterStatus,
  type TransporterMasterDetail,
} from "../api/transporterMasterApi";

const TRANSPORTER_SORT_FIELD_MAP: Record<string, string> = {
  transporterName: "name",
  name: "name",
  branchName: "branchName",
  transporterId: "transporterCode",
  transporterCode: "transporterCode",
  type: "type",
  areaOfOperation: "areaOfOperation",
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

const STATIC_TRANSPORTER_TYPE_OPTIONS = ["Road", "Air", "Rail"];

export function TransporterMasterFormPage({
  mode,
}: {
  mode: "add" | "edit" | "view";
}) {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<TransporterMasterDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");
  const [typeOptions, setTypeOptions] = useState<string[]>(
    STATIC_TRANSPORTER_TYPE_OPTIONS,
  );

  const definition = useMemo(
    () => ({
      ...transporterMasterDefinition,
      fields: transporterMasterDefinition.fields.map((field) => {
        if (field.key === "type") {
          return { ...field, options: typeOptions };
        }
        return field;
      }),
      rows: [],
    }),
    [typeOptions],
  );

  useEffect(() => {
    void fetchTransporterMasterMeta().then((meta) => {
      if (meta.types.length > 0) {
        setTypeOptions(meta.types.map((entry) => entry.label));
      }
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");

      if (mode === "add") {
        setRecord(undefined);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setRecord(undefined);
        setIsLoading(false);
        setErrorMessage("Transporter id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const nextRecord = await fetchTransporterMasterDetail(params.id);
        if (!ignore) {
          setRecord(nextRecord);
        }
      } catch (error) {
        if (!ignore) {
          setRecord(undefined);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load transporter.",
          );
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();

    return () => {
      ignore = true;
    };
  }, [mode, params.id]);

  return (
    <MasterFormPage
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        if (saveMode === "edit" && row?.id) {
          await updateTransporterMasterRecord(row.id, values);
        } else {
          await createTransporterMasterRecord(values);
        }
        void invalidateMaster("transporter");
      }}
    />
  );
}
