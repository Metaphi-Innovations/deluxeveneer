import { Button, Stack } from "@mui/material";
import { Download } from "lucide-react";

import {
  getListingToolbarButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";

export function FactoryToolbar({
  disabled = false,
  onExport,
}: {
  disabled?: boolean;
  onExport: () => void;
}) {
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
      <Button
        disabled={disabled}
        onClick={onExport}
        type="button"
        variant="contained"
        startIcon={<Download size={14} />}
        sx={(theme) => getListingToolbarButtonSx(theme)}
      >
        Export
      </Button>
    </Stack>
  );
}
