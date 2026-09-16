import { Button, Stack } from "@mui/material";
import { FileOutput, Plus } from "lucide-react";
import { Link as RouterLink } from "react-router";

import {
  getListingToolbarButtonSx,
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";

interface InventoryToolbarProps {
  addLabel: string;
  addPath: string;
  canAdd?: boolean;
  canExport?: boolean;
  onExport?: (() => void) | undefined;
}

export function InventoryToolbar({
  addLabel,
  addPath,
  canAdd = true,
  canExport = true,
  onExport,
}: InventoryToolbarProps) {
  return (
    <Stack
      direction="row"
      spacing={portalButtonGroupGap}
      useFlexGap
      sx={{
        alignItems: "center",
        justifyContent: "flex-end",
        flexWrap: "wrap",
      }}
    >
      {canAdd ? (
        <Button
          component={RouterLink}
          to={addPath}
          variant="contained"
          startIcon={<Plus size={15} />}
          sx={(theme) => getListingToolbarButtonSx(theme)}
        >
          {addLabel}
        </Button>
      ) : null}

      {canExport ? (
        <Button
          variant="outlined"
          startIcon={<FileOutput size={15} />}
          onClick={onExport}
          disabled={!onExport}
          sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
        >
          Export
        </Button>
      ) : null}
    </Stack>
  );
}

/** @deprecated Prefer getListingToolbarButtonSx — kept for existing imports. */
export const inventoryToolbarButtonSx = getListingToolbarButtonSx;
