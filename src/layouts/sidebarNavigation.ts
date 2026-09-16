import type { LucideIcon } from "lucide-react";
import {
  Award,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  Cog,
  Factory,
  Folder,
  FolderTree,
  Layers,
  LayoutDashboard,
  MapPin,
  Package,
  PackageOpen,
  Palette,
  Percent,
  Puzzle,
  Ruler,
  Scissors,
  ShoppingCart,
  Slice,
  Sparkles,
  Stamp,
  Star,
  Tags,
  Truck,
  User,
  UsersRound,
  Warehouse,
  Wind,
} from "lucide-react";

import { getDynamicWarehousePermissionKey } from "../features/shared/warehousePermission";

export type SidebarMatchLocation = {
  pathname: string;
  search: string;
};

const inventorySlugs = [
  "veneer-blocks",
  "raw-veneer",
  "plywood",
  "mdf",
  "consumables",
] as const;

const matchesPath = (location: SidebarMatchLocation, routePath: string) =>
  location.pathname === routePath ||
  location.pathname.startsWith(`${routePath}/`);

const getSearchParam = (location: SidebarMatchLocation, key: string) =>
  new URLSearchParams(location.search).get(key);

const matchesInventoryRecordRoute = (
  location: SidebarMatchLocation,
  slug: (typeof inventorySlugs)[number],
  warehouse: "warehouse-a" | "warehouse-b" | "warehouse-c",
) => {
  if (!matchesPath(location, `/inventory/${slug}`)) {
    return false;
  }

  const activeWarehouse = getSearchParam(location, "warehouse");

  if (warehouse === "warehouse-b") {
    return !activeWarehouse || activeWarehouse === "warehouse-b";
  }

  return activeWarehouse === warehouse;
};

const matchesAnyWarehouseInventoryRecordRoute = (
  location: SidebarMatchLocation,
  warehouse: "warehouse-a" | "warehouse-c",
) =>
  inventorySlugs.some((slug) =>
    matchesInventoryRecordRoute(location, slug, warehouse),
  );

export type SidebarNavigationItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  permissionKey?: string;
  to: string;
  match: (location: SidebarMatchLocation) => boolean;
};

type SidebarNavigationBase = {
  id: string;
  label: string;
  icon: LucideIcon;
  filledIcon?: boolean;
  permissionKey?: string;
};

export type SidebarNavigationLink = SidebarNavigationBase & {
  to: string;
  match: (location: SidebarMatchLocation) => boolean;
  items?: never;
  defaultOpen?: never;
};

export type SidebarNavigationGroup = SidebarNavigationBase & {
  additionalMatches?: readonly ((location: SidebarMatchLocation) => boolean)[];
  defaultOpen?: boolean;
  items: SidebarNavigationItem[];
  to?: never;
  match?: never;
};

export type SidebarNavigationEntry =
  | SidebarNavigationLink
  | SidebarNavigationGroup;

export interface DynamicWarehouseSidebarItem {
  id: string;
  label: string;
  slug: string;
  warehouseType: string;
}

const buildWarehouseNavigationItems = (
  dynamicWarehouses: readonly DynamicWarehouseSidebarItem[] = [],
): SidebarNavigationItem[] => [
    {
      id: "warehouse-a",
      label: "Warehouse A",
      icon: Warehouse,
      to: "/warehouse-a",
      match: (location) =>
        matchesPath(location, "/warehouse-a") ||
        matchesAnyWarehouseInventoryRecordRoute(location, "warehouse-a"),
    },
    {
      id: "warehouse-b",
      label: "Warehouse B",
      icon: Warehouse,
      to: "/warehouse-b",
      match: (location) =>
        matchesPath(location, "/warehouse-b") ||
        inventorySlugs
          .filter((slug) => slug !== "consumables")
          .some((slug) =>
            matchesInventoryRecordRoute(location, slug, "warehouse-b"),
          ),
    },
    {
      id: "warehouse-c",
      label: "Warehouse C",
      icon: Warehouse,
      to: "/warehouse-c",
      match: (location) =>
        matchesPath(location, "/warehouse-c") ||
        matchesAnyWarehouseInventoryRecordRoute(location, "warehouse-c"),
    },
    ...dynamicWarehouses.map<SidebarNavigationItem>((warehouse) => ({
      id: `dynamic-warehouse-${warehouse.slug}`,
      label: warehouse.label,
      icon: Warehouse,
      permissionKey: getDynamicWarehousePermissionKey(warehouse.slug),
      to: `/warehouses/${warehouse.slug}`,
      match: (location: SidebarMatchLocation) =>
        matchesPath(location, `/warehouses/${warehouse.slug}`),
    })),
  ];

const buildWarehousesNavigationEntry = (
  dynamicWarehouses: readonly DynamicWarehouseSidebarItem[] = [],
): SidebarNavigationGroup => ({
  id: "warehouses",
  label: "Warehouses",
  icon: Warehouse,
  items: buildWarehouseNavigationItems(dynamicWarehouses),
});

const staticSidebarNavigation: SidebarNavigationEntry[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    to: "/dashboard",
    match: (location) => matchesPath(location, "/dashboard"),
  },
  {
    id: "user-management",
    label: "User Management",
    icon: UsersRound,
    to: "/user-management",
    match: (location) => matchesPath(location, "/user-management"),
  },
  {
    id: "masters",
    label: "Masters",
    icon: Star,
    items: [
      {
        id: "color-master",
        label: "Color",
        icon: Palette,
        to: "/masters/color-master",
        match: (location) => matchesPath(location, "/masters/color-master"),
      },
      {
        id: "currency-master",
        label: "Currency",
        icon: CircleDollarSign,
        to: "/masters/currency-master",
        match: (location) => matchesPath(location, "/masters/currency-master"),
      },
      {
        id: "customer-master",
        label: "Customer",
        icon: User,
        to: "/masters/customer-master",
        match: (location) => matchesPath(location, "/masters/customer-master"),
      },
      {
        id: "cut-master",
        label: "Cut",
        icon: Scissors,
        to: "/masters/cut-master",
        match: (location) => matchesPath(location, "/masters/cut-master"),
      },
      {
        id: "department-master",
        label: "Department",
        icon: Building2,
        to: "/masters/department-master",
        match: (location) =>
          matchesPath(location, "/masters/department-master"),
      },
      {
        id: "grade-master",
        label: "Grade",
        icon: Award,
        to: "/masters/grade-master",
        match: (location) => matchesPath(location, "/masters/grade-master"),
      },
      {
        id: "gst-master",
        label: "GST",
        icon: Percent,
        to: "/masters/gst-master",
        match: (location) => matchesPath(location, "/masters/gst-master"),
      },
      {
        id: "hsn-master",
        label: "HSN",
        icon: Tags,
        to: "/masters/hsn-master",
        match: (location) => matchesPath(location, "/masters/hsn-master"),
      },
      {
        id: "item-category-master",
        label: "Item Category",
        icon: Folder,
        to: "/masters/item-category-master",
        match: (location) =>
          matchesPath(location, "/masters/item-category-master"),
      },
      {
        id: "item-name-master",
        label: "Item Name",
        icon: Package,
        to: "/masters/item-name-master",
        match: (location) =>
          matchesPath(location, "/masters/item-name-master"),
      },
      {
        id: "item-sub-category-master",
        label: "Item Sub Category",
        icon: FolderTree,
        to: "/masters/item-sub-category-master",
        match: (location) =>
          matchesPath(location, "/masters/item-sub-category-master"),
      },
      {
        id: "supplier-master",
        label: "Supplier",
        icon: Truck,
        to: "/masters/supplier-master",
        match: (location) =>
          matchesPath(location, "/masters/supplier-master") ||
          matchesPath(location, "/supplier-master"),
      },
      {
        id: "transporter-master",
        label: "Transporter",
        icon: Truck,
        to: "/masters/transporter-master",
        match: (location) =>
          matchesPath(location, "/masters/transporter-master"),
      },
      {
        id: "unit-master",
        label: "Unit",
        icon: Ruler,
        to: "/masters/unit-master",
        match: (location) => matchesPath(location, "/masters/unit-master"),
      },
      {
        id: "warehouse-location-master",
        label: "Warehouse / Location",
        icon: MapPin,
        to: "/masters/warehouse-location-master",
        match: (location) =>
          matchesPath(location, "/masters/warehouse-location-master"),
      },
    ],
  },
  {
    id: "factory",
    label: "Factory",
    icon: Factory,
    items: [
      {
        id: "factory-sawing",
        label: "Sawing",
        icon: Scissors,
        to: "/factory/sawing",
        match: (location) => matchesPath(location, "/factory/sawing"),
      },
      {
        id: "factory-slicing",
        label: "Slicing",
        icon: Slice,
        to: "/factory/slicing",
        match: (location) => matchesPath(location, "/factory/slicing"),
      },
      {
        id: "factory-drying",
        label: "Drying",
        icon: Wind,
        to: "/factory/drying",
        match: (location) => matchesPath(location, "/factory/drying"),
      },
      {
        id: "factory-inspection",
        label: "Inspection",
        icon: ClipboardCheck,
        to: "/factory/inspection",
        match: (location) => matchesPath(location, "/factory/inspection"),
      },
      {
        id: "factory-grouping",
        label: "Grouping",
        icon: Layers,
        to: "/factory/grouping",
        match: (location) => matchesPath(location, "/factory/grouping"),
      },
      {
        id: "factory-splicing",
        label: "Splicing",
        icon: Layers,
        to: "/factory/splicing",
        match: (location) => matchesPath(location, "/factory/splicing"),
      },
      {
        id: "factory-marquetry",
        label: "Marquetry",
        icon: Puzzle,
        to: "/factory/marquetry",
        match: (location) => matchesPath(location, "/factory/marquetry"),
      },
      {
        id: "factory-pressing",
        label: "Pressing",
        icon: Stamp,
        to: "/factory/pressing",
        match: (location) => matchesPath(location, "/factory/pressing"),
      },
      {
        id: "factory-cnc-fluting",
        label: "Fluting",
        icon: Cog,
        to: "/factory/cnc-fluting",
        match: (location) => matchesPath(location, "/factory/cnc-fluting"),
      },
      {
        id: "factory-embossing",
        label: "Embossing",
        icon: Stamp,
        to: "/factory/embossing",
        match: (location) => matchesPath(location, "/factory/embossing"),
      },
      {
        id: "factory-finishing",
        label: "Finishing",
        icon: Sparkles,
        to: "/factory/finishing",
        match: (location) => matchesPath(location, "/factory/finishing"),
      },
    ],
  },
  {
    id: "order",
    label: "Orders",
    icon: ShoppingCart,
    to: "/orders",
    match: (location) => matchesPath(location, "/orders"),
  },
  {
    id: "packing",
    label: "Packing",
    icon: PackageOpen,
    to: "/packing",
    match: (location) => matchesPath(location, "/packing"),
  },
  {
    id: "dispatch",
    label: "Dispatch",
    icon: Truck,
    to: "/dispatch",
    match: (location) => matchesPath(location, "/dispatch"),
  },
];

export function getSidebarNavigation(
  dynamicWarehouses: readonly DynamicWarehouseSidebarItem[] = [],
): SidebarNavigationEntry[] {
  const warehouseInsertIndex =
    staticSidebarNavigation.findIndex((entry) => entry.id === "masters") + 1;
  const insertIndex = warehouseInsertIndex || staticSidebarNavigation.length;

  return [
    ...staticSidebarNavigation.slice(0, insertIndex),
    buildWarehousesNavigationEntry(dynamicWarehouses),
    ...staticSidebarNavigation.slice(insertIndex),
  ];
}

export const sidebarNavigation = getSidebarNavigation();
