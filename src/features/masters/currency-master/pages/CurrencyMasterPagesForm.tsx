import { useEffect, useState } from "react";
import { useParams } from "react-router";

import { invalidateMaster } from "../../../../query/queryClient";
import { MasterFormPage } from "../../shared";
import type { MasterRecord } from "../../shared/types";
import {
  createCurrencyApi,
  getCurrencyByIdApi,
  updateCurrencyApi,
} from "../api/currencyMasterApi";
import { currencyMasterDefinition } from "../currencyMasterDefinition";

export function CurrencyMasterFormPage({ mode }: { mode: "add" | "edit" | "view" }) {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<MasterRecord | undefined>();
  const [isLoading, setIsLoading] = useState(mode !== "add");
  const [errorMessage, setErrorMessage] = useState("");

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
        setErrorMessage("Currency id is missing.");
        return;
      }

      setIsLoading(true);

      try {
        const item = await getCurrencyByIdApi(params.id);
        if (!ignore) {
          setRecord(item ?? undefined);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error ? error.message : "Unable to load currency.",
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
      definition={currencyMasterDefinition}
      errorMessage={errorMessage}
      loading={isLoading}
      mode={mode}
      {...(record ? { record } : {})}
      onSave={async ({ mode: saveMode, row, values }) => {
        const currencyName = String(values.currencyName || values.name || "");
        const remark =
          typeof values.remark === "string"
            ? values.remark
            : typeof values.remarks === "string"
              ? values.remarks
              : null;
        const status =
          typeof values.status === "boolean" || typeof values.status === "string"
            ? values.status
            : undefined;

        if (saveMode === "edit" && row?.id) {
          await updateCurrencyApi(row.id, {
            currencyName,
            remark,
            ...(status !== undefined ? { status } : {}),
          });
          void invalidateMaster("currency");
          return;
        }

        await createCurrencyApi({
          currencyName,
          remark,
          status: status ?? true,
        });
        void invalidateMaster("currency");
      }}
    />
  );
}
