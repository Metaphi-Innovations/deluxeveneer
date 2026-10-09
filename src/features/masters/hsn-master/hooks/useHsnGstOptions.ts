import { useEffect, useState } from "react";

import type { MasterDefinition, MasterRecord } from "../../shared/types";
import { fetchGstsApi, syncGstMasterToStorage } from "../../gst-master/api/gstMasterApi";
import { hsnMasterDefinition } from "../hsnMasterDefinition";

export function useHsnGstOptions() {
  const [definition, setDefinition] = useState<MasterDefinition>(hsnMasterDefinition);

  useEffect(() => {
    fetchGstsApi()
      .then((gstRecords) => {
        if (!gstRecords || gstRecords.length === 0) {
          return;
        }

        syncGstMasterToStorage(gstRecords);
        const options: string[] = Array.from(
          new Set(
            gstRecords
              .filter(
                (record: MasterRecord) =>
                  String(record.status ?? "Active").toLowerCase() !== "inactive",
              )
              .map((record: MasterRecord) => {
                const value = record.gstPercentage || record.percentage;
                return String(value).endsWith("%") ? String(value) : `${value}%`;
              })
              .filter((value): value is string => Boolean(value)),
          ),
        );

        if (options.length === 0) {
          return;
        }

        setDefinition((current) => ({
          ...current,
          fields: current.fields.map((field) =>
            field.key === "gstPercentage" || field.key === "gst"
              ? { ...field, options }
              : field,
          ),
        }));
      })
      .catch(() => {});
  }, []);

  return definition;
}
