import { useMemo, useState } from "react";
import {
  Alert,
  Button,
  Stack,
  useTheme,
} from "@mui/material";
import { Plus } from "lucide-react";
import { Link as RouterLink } from "react-router";

import { getListingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import {
  canAccessAnyAction,
  canAccessPermission,
  getMasterPermissionKey,
} from "../../permissions";
import { MasterPageShell } from "./MasterPageShell";
import { MasterTable } from "./MasterTable";
import {
  buildLocalMasterDefinition,
  updateLocalMasterStatus,
} from "./localMasterStore";
import type { MasterDefinition, MasterRecord } from "./types";
import { formatMasterValue, getMasterPaths } from "./utils";

interface MasterListingPageProps {
  definition: MasterDefinition;
}

export function MasterListingPage({ definition }: MasterListingPageProps) {
  const theme = useTheme();
  const localDefinition = useMemo(
    () => buildLocalMasterDefinition(definition),
    [definition],
  );
  const paths = getMasterPaths(localDefinition.slug);
  const permissionKey = getMasterPermissionKey(localDefinition.slug);
  const canCreate = canAccessPermission(permissionKey, "create");
  const canEdit = canAccessPermission(permissionKey, "edit");
  const canView = canAccessPermission(permissionKey, "view");
  const canOpenPage = canAccessAnyAction(permissionKey);
  const [searchValue, setSearchValue] = useState("");

  const filteredRows = useMemo(() => {
    return localDefinition.rows.filter((row) => {
      const matchesSearch =
        searchValue.trim().length === 0 ||
        Object.values(row).some((value) =>
          formatMasterValue(value)
            .toLowerCase()
            .includes(searchValue.trim().toLowerCase()),
        );

      return matchesSearch;
    });
  }, [localDefinition.rows, searchValue]);

  const entityLabel = localDefinition.title.replace(/ Master$/, "");
  const addButtonLabel = `Add ${entityLabel}`;
  const searchPlaceholder = `Search ${entityLabel.toLowerCase()}s...`;

  const handleStatusChange = (row: MasterRecord, checked: boolean) => {
    updateLocalMasterStatus(localDefinition, row, checked);
  };

  return (
    <MasterPageShell
      breadcrumbs={[
        { label: "Masters", to: "/masters" },
        { label: localDefinition.title },
      ]}
      title={localDefinition.title}
      subtitle={`Manage ${entityLabel.toLowerCase()} records used across the system.`}
      contentGap={2}
    >
      {!canOpenPage ? (
        <Alert severity="warning">
          You do not have permission to access this master.
        </Alert>
      ) : null}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "stretch", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
      >
        <ClearableSearchField
          value={searchValue}
          onChange={setSearchValue}
          placeholder={searchPlaceholder}
          sx={{
            width: { xs: "100%", sm: 300 },
            maxWidth: "100%",
          }}
        />

        {canCreate ? (
          <Button
            component={RouterLink}
            to={paths.add}
            variant="contained"
            startIcon={<Plus size={15} />}
            sx={(theme) => getListingToolbarButtonSx(theme)}
          >
            {addButtonLabel}
          </Button>
        ) : null}
      </Stack>

      <Stack
        sx={(theme) => ({
          pt: theme.spacing(0.5),
        })}
      >
        <MasterTable
          canChangeStatus={canEdit}
          canEdit={canEdit}
          canView={canView}
          columns={localDefinition.columns}
          getEditPath={paths.edit}
          getViewPath={paths.view}
          onStatusChange={handleStatusChange}
          rows={canView ? filteredRows : []}
        />
      </Stack>
    </MasterPageShell>
  );
}
