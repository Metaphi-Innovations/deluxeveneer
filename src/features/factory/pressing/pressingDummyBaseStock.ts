import { formatSQF, formatSQM, SQM_TO_SQF } from "../../shared/numberFormat";
import { calculateSlicingSqmValue } from "../shared/slicingAreaCalculation";
import type { FactoryRecord } from "../shared/types";

const plywoodNames = ["Commercial Plywood", "Marine Plywood", "BWR Plywood", "Flexible Plywood"] as const;
const mdfNames = ["Plain MDF", "Exterior MDF", "HDF Board", "Moisture Resistant MDF"] as const;
const subCategories = ["MR Grade", "BWR Grade", "Commercial", "Premium"] as const;
const grades = ["A", "A+", "B", "Premium"] as const;

export function buildPressingDummyBaseStock(materialType: "Plywood" | "MDF"): FactoryRecord[] {
  const names = materialType === "MDF" ? mdfNames : plywoodNames;
  const prefix = materialType === "MDF" ? "MDF" : "PLY";

  return names.map((itemName, index) => {
    const sequence = index + 1;
    const available = 12 + index * 4;
    const received = available + 6;
    const length = `${2440 - index * 20} mm`;
    const width = `${1220 - index * 10} mm`;
    const thickness = `${12 + index} mm`;
    const sqmValue = calculateSlicingSqmValue(length, width, available);
    const sqm = sqmValue > 0 ? sqmValue : 20 + index * 3;

    return {
      id: `pressing-dummy-base-${prefix.toLowerCase()}-${sequence}`,
      storageSrNo: `PRS-${prefix}-${String(sequence).padStart(4, "0")}`,
      inwardSrNo: `INW-${prefix}-${String(1800 + sequence)}`,
      itemName,
      itemSubCategory: subCategories[index] ?? "Commercial",
      palletNo: `PAL-WC-${String(30 + sequence).padStart(2, "0")}`,
      length,
      width,
      thickness,
      receivedSheets: String(received),
      availableSheets: String(available),
      sqm: formatSQM(sqm),
      sqf: formatSQF(sqm * SQM_TO_SQF),
      grade: grades[index] ?? "A",
      remark: `${materialType} stock available in the production warehouse.`,
    };
  });
}
