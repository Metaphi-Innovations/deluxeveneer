import { Button, Stack } from "@mui/material";
import { FileOutput } from "lucide-react";

import {
  getListingToolbarOutlinedButtonSx,
  portalButtonGroupGap,
} from "../../shared/buttonStyles";

export function FactoryToolbar() {
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
        type="button"
        variant="outlined"
        startIcon={<FileOutput size={15} />}
        sx={(theme) => getListingToolbarOutlinedButtonSx(theme)}
      >
        Export
      </Button>
    </Stack>
  );
}
