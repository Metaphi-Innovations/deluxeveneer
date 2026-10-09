import { cncFlutingProcessDate } from "../cnc-fluting/cncFlutingCreateRules";
import { dryingProcessDate } from "../drying/dryingCreateRules";
import { embossingProcessDate } from "../embossing/embossingCreateRules";
import { exportOemProcessDate } from "../export-oem/exportOemCreateRules";
import { finishingProcessDate } from "../finishing/finishingCreateRules";
import { groupingProcessDate } from "../grouping/groupingCreateRules";
import { marquetryProcessDate } from "../marquetry/marquetryCreateRules";
import { pressingProcessDate } from "../pressing/pressingCreateRules";
import { sampleSheetsProcessDate } from "../sample-sheets/sampleSheetsCreateRules";
import { sawingProcessDate } from "../sawing/sawingCreateRules";
import { slicingProcessDate } from "../slicing/slicingCreateRules";
import { splicingProcessDate as splicingDate } from "../splicing/splicingCreateRules";

export const processDateBySlug: Record<
  string,
  {
    key: string;
    label: string;
    aliases?: readonly string[];
  }
> = {
  sawing: sawingProcessDate,
  slicing: slicingProcessDate,
  drying: dryingProcessDate,
  grouping: groupingProcessDate,
  "sample-sheets": sampleSheetsProcessDate,
  splicing: splicingDate,
  pressing: pressingProcessDate,
  "cnc-fluting": cncFlutingProcessDate,
  embossing: embossingProcessDate,
  finishing: finishingProcessDate,
  "export-oem": exportOemProcessDate,
  marquetry: marquetryProcessDate,
};
