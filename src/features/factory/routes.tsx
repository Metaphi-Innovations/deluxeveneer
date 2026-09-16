import type { RouteObject } from "react-router";

import {
  AddCNCFlutingPage,
  CNCFlutingListPage,
  EditCNCFlutingPage,
  ViewCNCFlutingPage,
} from "./cnc-fluting";
import {
  AddDryingPage,
  DryingListPage,
  EditDryingPage,
  ViewDryingPage,
} from "./drying";
import { InspectionListPage } from "./inspection";
import {
  AddEmbossingPage,
  EditEmbossingPage,
  EmbossingListPage,
  ViewEmbossingPage,
} from "./embossing";
import {
  AddFinishingPage,
  EditFinishingPage,
  FinishingListPage,
  ViewFinishingPage,
} from "./finishing";
import {
  AddGroupingPage,
  EditGroupingPage,
  GroupingListPage,
  ViewGroupingPage,
} from "./grouping";
import {
  AddMarquetryPage,
  EditMarquetryPage,
  MarquetryListPage,
  ViewMarquetryPage,
} from "./marquetry";
import {
  AddPressingPage,
  EditPressingPage,
  PressingListPage,
  ViewPressingPage,
} from "./pressing";
import {
  AddSlicingPage,
  EditSlicingPage,
  SlicingListPage,
  ViewSlicingPage,
} from "./slicing";
import {
  AddSawingPage,
  EditSawingPage,
  SawingListPage,
  ViewSawingPage,
} from "./sawing";
import {
  AddSplicingPage,
  EditSplicingPage,
  SplicingListPage,
  ViewSplicingPage,
} from "./splicing";

export const factoryRoutes: RouteObject[] = [
  { path: "factory/sawing", Component: SawingListPage },
  { path: "factory/sawing/add", Component: AddSawingPage },
  { path: "factory/sawing/edit/:id", Component: EditSawingPage },
  { path: "factory/sawing/view/:id", Component: ViewSawingPage },

  { path: "factory/slicing", Component: SlicingListPage },
  { path: "factory/slicing/add", Component: AddSlicingPage },
  { path: "factory/slicing/edit/:id", Component: EditSlicingPage },
  { path: "factory/slicing/view/:id", Component: ViewSlicingPage },

  { path: "factory/drying", Component: DryingListPage },
  { path: "factory/drying/add", Component: AddDryingPage },
  { path: "factory/drying/edit/:id", Component: EditDryingPage },
  { path: "factory/drying/view/:id", Component: ViewDryingPage },

  { path: "factory/inspection", Component: InspectionListPage },

  { path: "factory/grouping", Component: GroupingListPage },
  { path: "factory/grouping/add", Component: AddGroupingPage },
  { path: "factory/grouping/edit/:id", Component: EditGroupingPage },
  { path: "factory/grouping/view/:id", Component: ViewGroupingPage },

  { path: "factory/splicing", Component: SplicingListPage },
  { path: "factory/splicing/add", Component: AddSplicingPage },
  { path: "factory/splicing/edit/:id", Component: EditSplicingPage },
  { path: "factory/splicing/view/:id", Component: ViewSplicingPage },

  { path: "factory/pressing", Component: PressingListPage },
  { path: "factory/pressing/add", Component: AddPressingPage },
  { path: "factory/pressing/edit/:id", Component: EditPressingPage },
  { path: "factory/pressing/view/:id", Component: ViewPressingPage },

  { path: "factory/finishing", Component: FinishingListPage },
  { path: "factory/finishing/add", Component: AddFinishingPage },
  { path: "factory/finishing/edit/:id", Component: EditFinishingPage },
  { path: "factory/finishing/view/:id", Component: ViewFinishingPage },

  { path: "factory/cnc-fluting", Component: CNCFlutingListPage },
  { path: "factory/cnc-fluting/add", Component: AddCNCFlutingPage },
  { path: "factory/cnc-fluting/edit/:id", Component: EditCNCFlutingPage },
  { path: "factory/cnc-fluting/view/:id", Component: ViewCNCFlutingPage },

  { path: "factory/embossing", Component: EmbossingListPage },
  { path: "factory/embossing/add", Component: AddEmbossingPage },
  { path: "factory/embossing/edit/:id", Component: EditEmbossingPage },
  { path: "factory/embossing/view/:id", Component: ViewEmbossingPage },

  { path: "factory/marquetry", Component: MarquetryListPage },
  { path: "factory/marquetry/add", Component: AddMarquetryPage },
  { path: "factory/marquetry/edit/:id", Component: EditMarquetryPage },
  { path: "factory/marquetry/view/:id", Component: ViewMarquetryPage },
];
