import type { LucideIcon } from "lucide-react";
import {
  ArrowDownToLine,
  Award,
  Boxes,
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

import type {
  SidebarWarehouseItem,
  WarehouseMasterType,
} from "../features/warehouses/shared/warehouseSidebarStore";

export type SidebarMatchLocation = {
  pathname: string;
  search: string;
};

const matchesPath = (location: SidebarMatchLocation, routePath: string) =>
  location.pathname === routePath ||
  location.pathname.startsWith(`${routePath}/`);

export type SidebarNavigationItem = {
  id: string;
  label: string;
  icon?: LucideIcon;
  warehouseType?: WarehouseMasterType;
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

export type { SidebarWarehouseItem as DynamicWarehouseSidebarItem };

export const WAREHOUSE_TYPE_ICONS: Record<WarehouseMasterType, LucideIcon> = {
  Inward: ArrowDownToLine,
  Storage: Boxes,
  Production: Factory,
};

const buildWarehouseNavigationItems = (
  warehouses: readonly SidebarWarehouseItem[] = [],
): SidebarNavigationItem[] =>
  warehouses.map((warehouse) => ({
    id: `master-warehouse-${warehouse.id}`,
    label: warehouse.label,
    icon: WAREHOUSE_TYPE_ICONS[warehouse.warehouseType] ?? Warehouse,
    warehouseType: warehouse.warehouseType,
    permissionKey: warehouse.permissionKey,
    to: `/warehouses/${warehouse.id}`,
    match: (location: SidebarMatchLocation) => {
      if (matchesPath(location, `/warehouses/${warehouse.id}`)) {
        return true;
      }

      // Keep warehouse highlighted on inventory view/edit routes.
      if (!location.pathname.startsWith("/inventory/")) {
        return false;
      }

      const params = new URLSearchParams(location.search);
      if (params.get("warehouseId") === warehouse.id) {
        return true;
      }

      const returnTo = params.get("returnTo") ?? "";
      return (
        returnTo === `/warehouses/${warehouse.id}` ||
        returnTo.startsWith(`/warehouses/${warehouse.id}?`)
      );
    },
  }));

const buildWarehousesNavigationEntry = (
  warehouses: readonly SidebarWarehouseItem[] = [],
): SidebarNavigationGroup => ({
  id: "warehouses",
  label: "Warehouses",
  icon: Warehouse,
  items: buildWarehouseNavigationItems(warehouses),
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
        id: "factory-sawing-inspection",
        label: "Sawing Inspection",
        icon: ClipboardCheck,
        to: "/factory/sawing-inspection",
        match: (location) => matchesPath(location, "/factory/sawing-inspection"),
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
        id: "factory-drying-inspection",
        label: "Drying Inspection",
        icon: ClipboardCheck,
        to: "/factory/drying-inspection",
        match: (location) =>
          matchesPath(location, "/factory/drying-inspection") ||
          matchesPath(location, "/factory/inspection"),
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
  warehouses: readonly SidebarWarehouseItem[] = [],
): SidebarNavigationEntry[] {
  const warehouseInsertIndex =
    staticSidebarNavigation.findIndex((entry) => entry.id === "masters") + 1;
  const insertIndex = warehouseInsertIndex || staticSidebarNavigation.length;

  return [
    ...staticSidebarNavigation.slice(0, insertIndex),
    buildWarehousesNavigationEntry(warehouses),
    ...staticSidebarNavigation.slice(insertIndex),
  ];
}

export const sidebarNavigation = getSidebarNavigation();
