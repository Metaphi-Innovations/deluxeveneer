import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { MasterFormPage } from "../../../shared";
import type { MasterRecord } from "../../../shared/types";
import { getItemByIdApi } from "../../api/itemMasterApi";
import { itemMasterDefinition } from "../../itemMasterDefinition";

export function ViewItemMasterPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      return;
    }

    setIsLoading(true);
    getItemByIdApi(id)
      .then((nextRecord) => {
        if (nextRecord) {
          setRecord(nextRecord);
        }
      })
      .catch((error) => {
        console.warn("Failed to fetch item for view:", error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [id]);

  return (
    <MasterFormPage
      definition={itemMasterDefinition}
      mode="view"
      {...(record ? { record } : {})}
      loading={isLoading}
    />
  );
}
