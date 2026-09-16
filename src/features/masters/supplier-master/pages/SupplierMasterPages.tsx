import { useMemo, useRef, useState } from "react";

import type { MasterFieldValue } from "../../shared";
import { MasterFormPage, MasterListingPage } from "../../shared";
import { supplierMasterDefinition } from "../mock/supplierMasterData";
import {
  SupplierContactPersonTable,
  type SupplierContactPersonTableHandle,
} from "./SupplierContactPersonTable";

export function SupplierMasterListPage() {
  return <MasterListingPage definition={supplierMasterDefinition} />;
}

export function AddSupplierMasterPage() {
  const contactTableRef = useRef<SupplierContactPersonTableHandle>(null);
  const [contacts, setContacts] = useState<
    Array<{
      contactPersonName: string;
      designation: string;
      email: string;
      phoneNumber: string;
    }>
  >([]);
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
    };
  }, [contacts]);

  return (
    <MasterFormPage
      additionalValues={firstContactValues}
      afterFields={
        <SupplierContactPersonTable
          ref={contactTableRef}
          contacts={contacts}
          onChange={setContacts}
        />
      }
      beforeSave={() => contactTableRef.current?.validate() ?? true}
      definition={supplierMasterDefinition}
      mode="add"
    />
  );
}

export function EditSupplierMasterPage() {
  return <MasterFormPage definition={supplierMasterDefinition} mode="edit" />;
}

export function ViewSupplierMasterPage() {
  return <MasterFormPage definition={supplierMasterDefinition} mode="view" />;
}
