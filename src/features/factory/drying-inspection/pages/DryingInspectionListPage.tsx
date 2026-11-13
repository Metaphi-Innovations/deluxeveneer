import { useEffect, useState } from "react";
import { FactoryListing } from "../../shared/FactoryListing";
import { dryingInspectionDefinition } from "../../shared/factoryDefinitions";
import { fetchDryingHistory } from "../../drying/api/dryingApi";
import { syncDryingInspectionWork } from "../../shared/factoryIssuedWorkStore";

export function DryingInspectionListPage() {
  const [synced, setSynced] = useState(false);

  useEffect(() => {
    let isMounted = true;
    fetchDryingHistory({ limit: 1000 })
      .then((res) => {
        if (!isMounted || !res?.items || res.items.length === 0) return;
        syncDryingInspectionWork(res.items);
        if (isMounted) {
          setSynced(true);
        }
      })
      .catch((err) => {
        console.error("Failed to sync drying history to drying inspection", err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return <FactoryListing key={synced ? "synced" : "init"} definition={dryingInspectionDefinition} />;
}

export const InspectionListPage = DryingInspectionListPage;
