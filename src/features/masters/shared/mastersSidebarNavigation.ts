import {
  Award,
  Building2,
  CircleDollarSign,
  Folder,
  FolderTree,
  MapPin,
  Package,
  Palette,
  Percent,
  Ruler,
  Scissors,
  Star,
  Tags,
  Truck,
  User,
} from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationGroup,
} from "../../../layouts/sidebarNavigationModel";
import { MASTERS_SIDEBAR_ENTRY_ID } from "./mastersSidebarStyles";

export const mastersSidebarEntry: SidebarNavigationGroup = {
  id: MASTERS_SIDEBAR_ENTRY_ID,
  label: "Masters",
  icon: Star,
  items: [
    {
      id: "color-master",
      label: "Color",
      icon: Palette,
      to: "/masters/color-master",
      match: (location) => matchesSidebarPath(location, "/masters/color-master"),
    },
    {
      id: "currency-master",
      label: "Currency",
      icon: CircleDollarSign,
      to: "/masters/currency-master",
      match: (location) => matchesSidebarPath(location, "/masters/currency-master"),
    },
    {
      id: "customer-master",
      label: "Customer",
      icon: User,
      to: "/masters/customer-master",
      match: (location) => matchesSidebarPath(location, "/masters/customer-master"),
    },
    {
      id: "cut-master",
      label: "Cut",
      icon: Scissors,
      to: "/masters/cut-master",
      match: (location) => matchesSidebarPath(location, "/masters/cut-master"),
    },
    {
      id: "department-master",
      label: "Department",
      icon: Building2,
      to: "/masters/department-master",
      match: (location) => matchesSidebarPath(location, "/masters/department-master"),
    },
    {
      id: "grade-master",
      label: "Grade",
      icon: Award,
      to: "/masters/grade-master",
      match: (location) => matchesSidebarPath(location, "/masters/grade-master"),
    },
    {
      id: "gst-master",
      label: "GST",
      icon: Percent,
      to: "/masters/gst-master",
      match: (location) => matchesSidebarPath(location, "/masters/gst-master"),
    },
    {
      id: "hsn-master",
      label: "HSN",
      icon: Tags,
      to: "/masters/hsn-master",
      match: (location) => matchesSidebarPath(location, "/masters/hsn-master"),
    },
    {
      id: "item-category-master",
      label: "Item Category",
      icon: Folder,
      to: "/masters/item-category-master",
      match: (location) =>
        matchesSidebarPath(location, "/masters/item-category-master"),
    },
    {
      id: "item-name-master",
      label: "Item Name",
      icon: Package,
      to: "/masters/item-name-master",
      match: (location) => matchesSidebarPath(location, "/masters/item-name-master"),
    },
    {
      id: "item-sub-category-master",
      label: "Item Sub Category",
      icon: FolderTree,
      to: "/masters/item-sub-category-master",
      match: (location) =>
        matchesSidebarPath(location, "/masters/item-sub-category-master"),
    },
    {
      id: "supplier-master",
      label: "Supplier",
      icon: Truck,
      to: "/masters/supplier-master",
      match: (location) =>
        matchesSidebarPath(location, "/masters/supplier-master") ||
        matchesSidebarPath(location, "/supplier-master"),
    },
    {
      id: "transporter-master",
      label: "Transporter",
      icon: Truck,
      to: "/masters/transporter-master",
      match: (location) =>
        matchesSidebarPath(location, "/masters/transporter-master"),
    },
    {
      id: "unit-master",
      label: "Unit",
      icon: Ruler,
      to: "/masters/unit-master",
      match: (location) => matchesSidebarPath(location, "/masters/unit-master"),
    },
    {
      id: "warehouse-location-master",
      label: "Warehouse Master",
      icon: MapPin,
      to: "/masters/warehouse-location-master",
      match: (location) =>
        matchesSidebarPath(location, "/masters/warehouse-location-master"),
    },
  ],
};
