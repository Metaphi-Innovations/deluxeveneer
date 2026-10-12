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
  type MasterFieldValue,
  type MasterRecord,
} from "../../shared";
import type { ColumnFilterValue } from "../../../shared/columnFilters";
import { isActiveColumnFilter } from "../../../shared/columnFilters";
import { supplierMasterDefinition } from "../supplierMasterDefinition";
import {
  createSupplierMasterRecord,
  fetchSupplierMasterColumnDropdown,
  fetchSupplierMasterDetail,
  fetchSupplierMasterMeta,
  fetchSupplierMasterPaginated,
  refreshSupplierMasterCache,
  updateSupplierMasterRecord,
  updateSupplierMasterStatus,
  type SupplierContactPersonInput,
  type SupplierMasterDetail,
} from "../api/supplierMasterApi";
import {
  SupplierContactPersonTable,
  type SupplierContactPersonTableHandle,
} from "./SupplierContactPersonTable";

function parseContacts(value: unknown): SupplierContactPersonInput[] {
  if (typeof value !== "string" || !value.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.map((entry) => ({
      contactPersonName: String(
        (entry as { contactPersonName?: string }).contactPersonName ?? "",
      ),
      designation: String((entry as { designation?: string }).designation ?? ""),
      email: String((entry as { email?: string }).email ?? ""),
      phoneNumber: String((entry as { phoneNumber?: string }).phoneNumber ?? ""),
      countryCode: String((entry as { countryCode?: string }).countryCode ?? "+91"),
    }));
  } catch {
    return [];
  }
}

const SUPPLIER_SORT_FIELD_MAP: Record<string, string> = {
  supplierName: "name",
  name: "name",
  gstNo: "gstNo",
  msmeType: "msmeType",
  country: "country",
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

export function SupplierMasterFormPage({ mode }: { mode: "add" | "edit" | "view" }) {
  const params = useParams<{ id: string }>();
  const contactTableRef = useRef<SupplierContactPersonTableHandle>(null);
  const [record, setRecord] = useState<SupplierMasterDetail | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");
  const [contacts, setContacts] = useState<SupplierContactPersonInput[]>([]);
  const [msmeTypeOptions, setMsmeTypeOptions] = useState<string[]>([]);

  const firstContactValues = useMemo<Record<string, MasterFieldValue>>(() => {
    const firstContact = contacts[0];

    if (!firstContact) {
      return {};
    }

    return {
      contactPersonName: firstContact.contactPersonName,
      designation: firstContact.designation,
      emailAddress: firstContact.email,
      mobileNumber: firstContact.phoneNumber,
      mobileNumberCountryCode: firstContact.countryCode || "+91",
    };
  }, [contacts]);

  const definition = useMemo(
    () => ({
      ...supplierMasterDefinition,
      fields: supplierMasterDefinition.fields.map((field) =>
        field.key === "msmeType"
          ? {
            ...field,
            type: "select" as const,
            options: msmeTypeOptions.length > 0 ? msmeTypeOptions : (field.options ?? []),
          }
          : field,
      ),
      rows: [],
    }),
    [msmeTypeOptions],
  );

  useEffect(() => {
    void fetchSupplierMasterMeta().then((meta) => {
      if (meta.msmeTypes && meta.msmeTypes.length > 0) {
        setMsmeTypeOptions(meta.msmeTypes.map((entry) => entry.label));
      }
    });
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadDetail() {
      setErrorMessage("");

      if (mode === "add") {
        setRecord(undefined);
        setContacts([]);
        setIsLoading(false);
        return;
      }

      if (!params.id) {
        setRecord(undefined);
        setIsLoading(false);
        setErrorMessage("Supplier id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const nextRecord = await fetchSupplierMasterDetail(params.id);
        if (!ignore) {
          setRecord(nextRecord);
          setContacts(parseContacts(nextRecord.contactPersonsJson));
        }
      } catch (error) {
        if (!ignore) {
          setRecord(undefined);
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load supplier.",
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
      additionalValues={{
        ...firstContactValues,
        contactPersonsJson: JSON.stringify(contacts),
      }}
      afterFields={
        <SupplierContactPersonTable
          ref={contactTableRef}
          contacts={contacts}
          onChange={setContacts}
          readOnly={mode === "view"}
        />
      }
      beforeSave={() => contactTableRef.current?.validate() ?? true}
      definition={definition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        if (saveMode === "edit" && row?.id) {
          await updateSupplierMasterRecord(row.id, values, contacts);
        } else {
          await createSupplierMasterRecord(values, contacts);
        }
        void invalidateMaster("supplier");
      }}
    />
  );
}
