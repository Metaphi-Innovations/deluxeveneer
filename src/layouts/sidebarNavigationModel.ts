import type { LucideIcon } from "lucide-react";

import type { WarehouseMasterType } from "../features/warehouses/shared/warehouseSidebarStore";

export type SidebarMatchLocation = {
  pathname: string;
  search: string;
};

export const matchesSidebarPath = (
  location: SidebarMatchLocation,
  routePath: string,
) =>
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
