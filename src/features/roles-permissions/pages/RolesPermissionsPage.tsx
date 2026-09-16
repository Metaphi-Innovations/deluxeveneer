import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Button,
  IconButton,
  Stack,
  useTheme,
} from "@mui/material";
import { Plus, Settings2 } from "lucide-react";
import { Link as RouterLink, useLocation, useNavigate } from "react-router";

import { EnterpriseDataTable } from "../../../components/data-display/EnterpriseDataTable";
import { formatMasterValue, MasterPageShell } from "../../masters/shared";
import { canAccessPermission } from "../../permissions";
import { getListingToolbarButtonSx } from "../../shared/buttonStyles";
import { ClearableSearchField } from "../../shared/ClearableSearchField";
import {
  fetchRolePermissionRows,
  getRolePermissionSearchValues,
  getRolePermissionPaths,
  rolePermissionColumns,
  rolePermissionRows,
  type RolePermissionRecord,
} from "../shared";

export function RolesPermissionsPage() {
  const theme = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const paths = getRolePermissionPaths();
  const canCreate = canAccessPermission("rolesPermissions", "create");
  const canEdit = canAccessPermission("rolesPermissions", "edit");
  const canView = canAccessPermission("rolesPermissions", "view");
  const [searchValue, setSearchValue] = useState("");
  const [rows, setRows] = useState<RolePermissionRecord[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(() =>
    getRolesPermissionsFlashMessage(location.state),
  );

  useEffect(() => {
    const nextSuccessMessage = getRolesPermissionsFlashMessage(location.state);

    if (!nextSuccessMessage) {
      return;
    }

    setSuccessMessage(nextSuccessMessage);
    navigate(`${location.pathname}${location.search}`, {
      replace: true,
      state: null,
    });
  }, [location.pathname, location.search, location.state, navigate]);

  useEffect(() => {
    let ignore = false;

    async function loadRows() {
      setErrorMessage("");

      try {
        const nextRows = await fetchRolePermissionRows();
        if (!ignore) {
          setRows(nextRows.length > 0 ? nextRows : [...rolePermissionRows]);
        }
      } catch (error) {
        if (!ignore) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Unable to load roles and permissions.",
          );
        }
      }
    }

    loadRows();

    return () => {
      ignore = true;
    };
  }, []);

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (!normalizedSearch) {
      return rows;
    }

    return rows.filter((row) =>
      getRolePermissionSearchValues(row).some((value) =>
        formatMasterValue(value)
          .toLowerCase()
          .includes(normalizedSearch),
      ),
    );
  }, [rows, searchValue]);

  return (
    <MasterPageShell
      breadcrumbs={[{ label: "Roles & Permissions" }]}
      title="Roles & Permissions"
      subtitle="Manage roles and the permissions assigned across the system."
      contentGap={2}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
      >
        <ClearableSearchField
          value={searchValue}
          onChange={setSearchValue}
          placeholder="Search roles..."
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
            startIcon={<Plus size={14} />}
            sx={(currentTheme) => getListingToolbarButtonSx(currentTheme)}
          >
            Add Role
          </Button>
        ) : null}
      </Stack>

      {successMessage ? (
        <Alert severity="success" onClose={() => setSuccessMessage("")}>
          {successMessage}
        </Alert>
      ) : null}

      {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

      <EnterpriseDataTable
        actionColumnLabel="Actions"
        actionColumnWidth={88}
        columns={rolePermissionColumns}
        defaultRowsPerPage={10}
        initialSort={{ key: "updatedDate", direction: "desc" }}
        {...(canEdit
          ? {
              renderActionCell: (row: RolePermissionRecord) => (
                <IconButton
                  aria-label={`Configure ${row.roleName}`}
                  onClick={() => navigate(paths.configure(row.id))}
                  size="small"
                  sx={{
                    color: theme.customTokens.navigation.activeText,
                    borderRadius: `${theme.customTokens.radius.md}px`,
                    "&:hover": {
                      backgroundColor:
                        theme.customTokens.navigation.hoverBackground,
                      color: theme.customTokens.brand.secondary,
                    },
                  }}
                >
                  <Settings2 size={16} />
                </IconButton>
              ),
            }
          : {})}
        rows={canView ? filteredRows : []}
      />
    </MasterPageShell>
  );
}

function getRolesPermissionsFlashMessage(state: unknown) {
  if (!state || typeof state !== "object") {
    return "";
  }

  const message = (state as { rolesPermissionsFlashMessage?: unknown })
    .rolesPermissionsFlashMessage;

  return typeof message === "string" ? message : "";
}
