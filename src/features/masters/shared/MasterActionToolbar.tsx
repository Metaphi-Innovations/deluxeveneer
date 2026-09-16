import { Button, Stack } from "@mui/material";
import { FileOutput, Plus } from "lucide-react";
import { Link as RouterLink } from "react-router";

interface MasterActionToolbarProps {
  addTo: string;
}

export function MasterActionToolbar({
  addTo,
}: MasterActionToolbarProps) {
  return (
    <Stack
      direction="row"
      flexWrap="wrap"
      useFlexGap
      spacing={1.25}
    >
      <Button
        component={RouterLink}
        to={addTo}
        variant="contained"
        startIcon={<Plus size={16} />}
      >
        Add
      </Button>

      <Button variant="outlined" startIcon={<FileOutput size={16} />}>
        Export
      </Button>

    </Stack>
  );
}
