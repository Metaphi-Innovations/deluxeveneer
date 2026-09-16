import type {
  MasterFieldDefinition,
  MasterFieldValue,
} from "../../masters/shared";
import type {
  FactoryDefinition,
  FactoryFormSection,
  FactoryPageMode,
  FactoryRecord,
} from "./types";

export type FactoryProcessTab = "issued" | "done" | "history" | "rejected";

const factoryTabOrder: readonly FactoryProcessTab[] = [
  "issued",
  "done",
  "history",
  "rejected",
];

const factorySequenceKeys = new Set([
  "issueSrNo",
  "sampleSrNo",
  "groupNo",
  "orderNo",
  "orderItemNo",
  "palletNo",
]);

export function createFactoryRows<Row extends FactoryRecord>(
  prefix: string,
  rows: ReadonlyArray<Omit<Row, "id"> & Partial<Pick<Row, "id">>>,
) {
  return rows.map((row, index) => ({
    id: row.id ?? `${prefix}-${index + 1}`,
    ...row,
  })) as unknown as Row[];
}

export function expandFactoryRowsForTabs<Row extends FactoryRecord>(
  prefix: string,
  rows: readonly Row[],
  targetPerTab = 12,
) {
  return factoryTabOrder.flatMap((tab, tabIndex) =>
    Array.from({ length: targetPerTab }, (_, index) => {
      const baseRow = rows[index % rows.length]!;
      const dayOffset = tabIndex * targetPerTab + index;
      const sequence = String(index + 1).padStart(2, "0");

      return {
        ...baseRow,
        ...decorateFactoryListingRow(baseRow, tab, dayOffset, sequence),
        id: `${prefix}-${tab}-${index + 1}`,
        listingState: tab,
      } as Row;
    }),
  );
}

export function uniqueFactoryOptions(
  rows: readonly FactoryRecord[],
  key: string,
) {
  return Array.from(
    new Set(
      rows
        .map((row) => row[key])
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  );
}

export function flattenFactorySections(
  sections: readonly FactoryFormSection[],
) {
  return sections.flatMap((section) => section.fields);
}

export function buildFactoryInitialValues(
  sections: readonly FactoryFormSection[],
  row?: FactoryRecord,
) {
  return flattenFactorySections(sections).reduce<Record<string, MasterFieldValue>>(
    (accumulator, field) => {
      const value = row?.[field.key];

      if (field.type === "date") {
        accumulator[field.key] = value instanceof Date ? value : null;
        return accumulator;
      }

      if (field.type === "checkbox" || field.type === "toggle") {
        accumulator[field.key] = typeof value === "boolean" ? value : false;
        return accumulator;
      }

      if (value instanceof Date) {
        accumulator[field.key] = new Intl.DateTimeFormat("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).format(value);
        return accumulator;
      }

      accumulator[field.key] = typeof value === "string" ? value : "";
      return accumulator;
    },
    {},
  );
}

export function getFactoryPaths(slug: string) {
  return {
    add: `/factory/${slug}/add`,
    edit: (id: string) => `/factory/${slug}/edit/${id}`,
    list: `/factory/${slug}`,
    view: (id: string) => `/factory/${slug}/view/${id}`,
  };
}

export function getFactoryProcessTabs(title: string) {
  if (title === "Inspection") {
    return [
      { label: "Inspection Pending", value: "issued" },
      { label: "Inspection Done", value: "done" },
    ] as const satisfies readonly { label: string; value: FactoryProcessTab }[];
  }

  return [
    {
      label: title === "Marquetry" ? "Marquetry Warehouse" : `Issued for ${title}`,
      value: "issued",
    },
    {
      label: `${title} Done`,
      value: "done",
    },
    {
      label: `${title} History`,
      value: "history",
    },
    {
      label: `Rejected ${title}`,
      value: "rejected",
    },
  ] as const satisfies readonly { label: string; value: FactoryProcessTab }[];
}

export function getFactoryRowsForTab<Row extends FactoryRecord>(
  rows: readonly Row[],
  tab: FactoryProcessTab,
) {
  return rows.filter((row, index) => {
    const listingState = row.listingState;

    if (typeof listingState === "string") {
      return listingState === tab;
    }

    const tabBucket: Record<FactoryProcessTab, number> = {
      issued: 0,
      done: 1,
      history: 2,
      rejected: 3,
    };

    return index % 4 === tabBucket[tab];
  });
}

export function getFactoryPageTitle<Row extends FactoryRecord>(
  definition: FactoryDefinition<Row>,
  mode: FactoryPageMode,
) {
  if (mode === "list") {
    return definition.title;
  }

  if (mode === "add") {
    return `Add ${definition.title} Entry`;
  }

  if (mode === "edit") {
    return `Edit ${definition.title} Entry`;
  }

  return `View ${definition.title} Entry`;
}

export function getFactoryPageSubtitle<Row extends FactoryRecord>(
  definition: FactoryDefinition<Row>,
  mode: Exclude<FactoryPageMode, "list">,
) {
  if (mode === "add") {
    return `Create a new ${definition.title.toLowerCase()} process entry using the standard production workflow form.`;
  }

  if (mode === "edit") {
    return `Update the ${definition.title.toLowerCase()} process entry using the same reusable stage form layout.`;
  }

  return `Review the ${definition.title.toLowerCase()} process entry in a read-only workflow layout.`;
}

export function createSection(
  title: string,
  fields: readonly MasterFieldDefinition[],
  description?: string,
): FactoryFormSection {
  return {
    fields,
    title,
    ...(description ? { description } : {}),
  };
}

function decorateFactoryListingRow<Row extends FactoryRecord>(
  row: Row,
  tab: FactoryProcessTab,
  dayOffset: number,
  sequence: string,
) {
  return Object.entries(row).reduce<Partial<Row>>((accumulator, [key, value]) => {
    if (value instanceof Date) {
      accumulator[key as keyof Row] = addDays(value, dayOffset) as Row[keyof Row];
      return accumulator;
    }

    if (typeof value !== "string") {
      return accumulator;
    }

    if (factorySequenceKeys.has(key)) {
      accumulator[key as keyof Row] =
        `${value}-${sequence}` as Row[keyof Row];
      return accumulator;
    }

    if (key === "status") {
      accumulator[key as keyof Row] =
        getFactoryStatusForTab(tab) as Row[keyof Row];
    }

    return accumulator;
  }, {});
}

function getFactoryStatusForTab(tab: FactoryProcessTab) {
  switch (tab) {
    case "done":
      return "Completed";
    case "history":
      return "Archived";
    case "rejected":
      return "Rejected";
    default:
      return "Issued";
  }
}

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}
