import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { MasterFormPage } from "../../../shared";
import type { MasterRecord } from "../../../shared/types";
import { getUnitByIdApi } from "../../api/unitMasterApi";
import { unitMasterDefinition } from "../../unitMasterDefinition";

export function ViewUnitMasterPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let ignore = false;

    async function loadRecord() {
      if (!params.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        const item = await getUnitByIdApi(params.id);
        if (!ignore) {
          setRecord(item || undefined);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(error instanceof Error ? error.message : "Failed to load unit.");
        }
      } finally {
        if (!ignore) {
          setIsLoading(false);
        }
      }
    }

    void loadRecord();
    return () => {
      ignore = true;
    };
  }, [params.id]);

  return (
    <MasterFormPage
      definition={unitMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode="view"
      {...(record ? { record } : {})}
    />
  );
}
