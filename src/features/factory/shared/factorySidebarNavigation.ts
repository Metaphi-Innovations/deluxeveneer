import {
  ClipboardCheck,
  Cog,
  Factory,
  Layers,
  Puzzle,
  Scissors,
  Slice,
  Sparkles,
  Stamp,
  Wind,
} from "lucide-react";

import {
  matchesSidebarPath,
  type SidebarNavigationGroup,
} from "../../../layouts/sidebarNavigationModel";

export const factorySidebarEntry: SidebarNavigationGroup = {
  id: "factory",
  label: "Factory",
  icon: Factory,
  items: [
    {
      id: "factory-sawing",
      label: "Sawing",
      icon: Scissors,
      to: "/factory/sawing",
      match: (location) => matchesSidebarPath(location, "/factory/sawing"),
    },
    {
      id: "factory-sawing-inspection",
      label: "Sawing Inspection",
      icon: ClipboardCheck,
      to: "/factory/sawing-inspection",
      match: (location) => matchesSidebarPath(location, "/factory/sawing-inspection"),
    },
    {
      id: "factory-slicing",
      label: "Slicing",
      icon: Slice,
      to: "/factory/slicing",
      match: (location) => matchesSidebarPath(location, "/factory/slicing"),
    },
    {
      id: "factory-drying",
      label: "Drying",
      icon: Wind,
      to: "/factory/drying",
      match: (location) => matchesSidebarPath(location, "/factory/drying"),
    },
    {
      id: "factory-drying-inspection",
      label: "Drying Inspection",
      icon: ClipboardCheck,
      to: "/factory/drying-inspection",
      match: (location) =>
        matchesSidebarPath(location, "/factory/drying-inspection") ||
        matchesSidebarPath(location, "/factory/inspection"),
    },
    {
      id: "factory-grouping",
      label: "Grouping",
      icon: Layers,
      to: "/factory/grouping",
      match: (location) => matchesSidebarPath(location, "/factory/grouping"),
    },
    {
      id: "factory-splicing",
      label: "Splicing",
      icon: Layers,
      to: "/factory/splicing",
      match: (location) => matchesSidebarPath(location, "/factory/splicing"),
    },
    {
      id: "factory-marquetry",
      label: "Marquetry",
      icon: Puzzle,
      to: "/factory/marquetry",
      match: (location) => matchesSidebarPath(location, "/factory/marquetry"),
    },
    {
      id: "factory-pressing",
      label: "Pressing",
      icon: Stamp,
      to: "/factory/pressing",
      match: (location) => matchesSidebarPath(location, "/factory/pressing"),
    },
    {
      id: "factory-cnc-fluting",
      label: "Fluting",
      icon: Cog,
      to: "/factory/cnc-fluting",
      match: (location) => matchesSidebarPath(location, "/factory/cnc-fluting"),
    },
    {
      id: "factory-embossing",
      label: "Embossing",
      icon: Stamp,
      to: "/factory/embossing",
      match: (location) => matchesSidebarPath(location, "/factory/embossing"),
    },
    {
      id: "factory-finishing",
      label: "Finishing",
      icon: Sparkles,
      to: "/factory/finishing",
      match: (location) => matchesSidebarPath(location, "/factory/finishing"),
    },
  ],
};
