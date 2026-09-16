import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Check } from "lucide-react";

import {
  type UserPermissionAction,
  type UserPermissionFlags,
  buildUserPermissionSections,
  userPermissionSections,
} from "./userManagementConfig";
import {
  getDynamicSidebarWarehouses,
  LOCAL_WAREHOUSES_UPDATED_EVENT,
} from "../../warehouses/shared/localWarehouseStore";
import type { UserPermissionItem } from "./userManagementConfig";

export type PermissionBulkUpdate = {
  itemKey: string;
  action: UserPermissionAction;
  checked: boolean;
};

interface UserPermissionMatrixProps {
  onToggle: (
    itemKey: string,
    action: UserPermissionAction,
    checked: boolean,
  ) => void;
  onBulkChange?: (updates: PermissionBulkUpdate[]) => void;
  permissions: Record<string, UserPermissionFlags>;
  readOnly?: boolean;
}

const permissionActions: readonly UserPermissionAction[] = [
  "view",
  "edit",
  "create",
];

type PermissionItem = UserPermissionItem;

export function UserPermissionMatrix({
  onToggle,
  onBulkChange,
  permissions,
  readOnly = false,
}: UserPermissionMatrixProps) {
  const theme = useTheme();
  const [dynamicWarehouses, setDynamicWarehouses] = useState(() =>
    getDynamicSidebarWarehouses(),
  );
  const permissionSections = useMemo(
    () => buildUserPermissionSections(dynamicWarehouses),
    [dynamicWarehouses],
  );
  const [selectedSectionId, setSelectedSectionId] = useState(
    userPermissionSections[0]?.id ?? "",
  );
  const [viewFilter, setViewFilter] = useState<"all" | "granted">("granted");

  const totals = useMemo(
    () => countPermissionBreakdown(permissions),
    [permissions],
  );

  const selectedSection =
    permissionSections.find((section) => section.id === selectedSectionId) ??
    permissionSections[0];

  const filteredItems = useMemo(() => {
    if (!selectedSection) {
      return [];
    }

    let items = selectedSection.items;

    if (readOnly && viewFilter === "granted") {
      items = items.filter((item) => {
        const flags = permissions[item.key];
        return Boolean(flags?.view || flags?.edit || flags?.create);
      });
    }

    return items;
  }, [permissions, readOnly, selectedSection, viewFilter]);

  useEffect(() => {
    if (
      !permissionSections.some((section) => section.id === selectedSectionId)
    ) {
      const first = permissionSections[0];
      if (first) {
        setSelectedSectionId(first.id);
      }
    }
  }, [permissionSections, selectedSectionId]);

  useEffect(() => {
    const handleWarehousesUpdate = () => {
      setDynamicWarehouses(getDynamicSidebarWarehouses());
    };

    window.addEventListener(
      LOCAL_WAREHOUSES_UPDATED_EVENT,
      handleWarehousesUpdate,
    );
    window.addEventListener("storage", handleWarehousesUpdate);

    return () => {
      window.removeEventListener(
        LOCAL_WAREHOUSES_UPDATED_EVENT,
        handleWarehousesUpdate,
      );
      window.removeEventListener("storage", handleWarehousesUpdate);
    };
  }, []);

  const applyUpdates = (updates: PermissionBulkUpdate[]) => {
    if (updates.length === 0 || readOnly) {
      return;
    }

    if (onBulkChange) {
      onBulkChange(updates);
      return;
    }

    updates.forEach((update) => {
      onToggle(update.itemKey, update.action, update.checked);
    });
  };

  const toggleCategoryAction = (action: UserPermissionAction) => {
    if (!selectedSection || readOnly) {
      return;
    }

    const fullySelected = isActionFullySelected(
      selectedSection.items,
      action,
      permissions,
    );

    applyUpdates(
      selectedSection.items.map((item) => ({
        itemKey: item.key,
        action,
        checked: !fullySelected,
      })),
    );
  };

  const clearCategory = () => {
    if (!selectedSection || readOnly) {
      return;
    }

    const updates: PermissionBulkUpdate[] = [];

    selectedSection.items.forEach((item) => {
      updates.push(
        { itemKey: item.key, action: "view", checked: false },
        { itemKey: item.key, action: "edit", checked: false },
        { itemKey: item.key, action: "create", checked: false },
      );
    });

    applyUpdates(updates);
  };

  return (
    <Box
      sx={{
        width: "100%",
        border: `1px solid ${theme.customTokens.borders.default}`,
        borderRadius: "10px",
        backgroundColor: theme.customTokens.surfaces.surface,
        overflow: "hidden",
      }}
    >
      <Box sx={{ px: 2, pt: 2, pb: 1.5 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          spacing={1.25}
        >
          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Stack direction="row" alignItems="baseline" spacing={1}>
              <Typography
                sx={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  color: theme.customTokens.text.primary,
                  letterSpacing: "-0.01em",
                }}
              >
                Permissions
              </Typography>
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  color: theme.customTokens.text.secondary,
                }}
              >
                {totals.total} enabled
              </Typography>
            </Stack>
            <Typography
              sx={{
                fontSize: "0.8125rem",
                color: theme.customTokens.text.secondary,
              }}
            >
              {readOnly
                ? "Access currently assigned to this user."
                : "Configure what this user can access."}
            </Typography>
          </Stack>
        </Stack>

        <Stack
          direction="row"
          flexWrap="wrap"
          useFlexGap
          spacing={0.75}
          sx={{ mt: 1.5 }}
        >
          {permissionSections.map((section) => {
            const selected = section.id === selectedSection?.id;
            const enabled = countEnabledModules(section.items, permissions);

            return (
              <Box
                key={section.id}
                component="button"
                type="button"
                onClick={() => setSelectedSectionId(section.id)}
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.75,
                  px: 1.25,
                  py: 0.65,
                  borderRadius: "8px",
                  border: `1px solid ${
                    selected
                      ? theme.customTokens.brand.primaryScale[200]
                      : theme.customTokens.borders.default
                  }`,
                  backgroundColor: selected
                    ? theme.customTokens.brand.primaryScale[50]
                    : theme.customTokens.surfaces.surface,
                  color: selected
                    ? theme.customTokens.brand.primary
                    : theme.customTokens.text.secondary,
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: selected
                      ? theme.customTokens.brand.primaryScale[50]
                      : theme.customTokens.surfaces.alt,
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: "0.8125rem",
                    fontWeight: selected ? 600 : 500,
                    color: "inherit",
                    lineHeight: 1.2,
                  }}
                >
                  {section.label}
                </Typography>
                <Typography
                  sx={{
                    fontSize: "0.6875rem",
                    fontWeight: 500,
                    color: "inherit",
                    opacity: 0.85,
                    lineHeight: 1.2,
                  }}
                >
                  {enabled}/{section.items.length}
                </Typography>
              </Box>
            );
          })}
        </Stack>
      </Box>

      <Box
        sx={{
          px: 2,
          py: 1.25,
          borderTop: `1px solid ${theme.customTokens.borders.divider}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          flexWrap: "wrap",
        }}
      >
        <Stack spacing={0.15}>
          <Typography
            sx={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: theme.customTokens.text.primary,
            }}
          >
            {selectedSection?.label ?? "Permissions"}
          </Typography>
          <Typography
            sx={{
              fontSize: "0.75rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            {filteredItems.length} module
            {filteredItems.length === 1 ? "" : "s"}
          </Typography>
        </Stack>

        {readOnly ? (
          <Stack direction="row" spacing={0.5}>
            <FilterChip
              label="Granted Only"
              selected={viewFilter === "granted"}
              onClick={() => setViewFilter("granted")}
            />
            <FilterChip
              label="All"
              selected={viewFilter === "all"}
              onClick={() => setViewFilter("all")}
            />
          </Stack>
        ) : (
          <Button
            type="button"
            variant="text"
            onClick={clearCategory}
            sx={{
              minHeight: 30,
              px: 1,
              fontSize: "0.75rem",
              fontWeight: 500,
              color: theme.customTokens.text.secondary,
              textTransform: "none",
              "&:hover": {
                backgroundColor: "transparent",
                color: theme.customTokens.brand.primary,
              },
            }}
          >
            Clear category
          </Button>
        )}
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "minmax(140px, 1fr) repeat(3, 76px)",
          alignItems: "center",
          px: 0,
          minHeight: 40,
          backgroundColor: theme.customTokens.neutrals[100],
          borderTop: `1px solid ${theme.customTokens.borders.divider}`,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.75rem",
            fontWeight: 600,
            color: theme.customTokens.neutrals[700],
            px: 2,
          }}
        >
          Module
        </Typography>

        {permissionActions.map((action) => {
          const fullySelected = selectedSection
            ? isActionFullySelected(
                selectedSection.items,
                action,
                permissions,
              )
            : false;
          const partlySelected = selectedSection
            ? isActionPartlySelected(
                selectedSection.items,
                action,
                permissions,
              )
            : false;

          return (
            <Box
              key={action}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.15,
                py: 0.5,
                borderLeft: `1px solid ${theme.customTokens.borders.divider}`,
                minHeight: 40,
              }}
            >
              <Typography
                sx={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: theme.customTokens.neutrals[700],
                  textTransform: "capitalize",
                }}
              >
                {action}
              </Typography>
              {!readOnly ? (
                <PermissionToggle
                  checked={fullySelected}
                  indeterminate={partlySelected && !fullySelected}
                  ariaLabel={`Select all ${action} for ${selectedSection?.label ?? "category"}`}
                  onToggle={() => toggleCategoryAction(action)}
                />
              ) : null}
            </Box>
          );
        })}
      </Box>

      {filteredItems.length === 0 ? (
        <Box sx={{ px: 2, py: 3, textAlign: "center" }}>
          <Typography
            sx={{
              fontSize: "0.8125rem",
              color: theme.customTokens.text.secondary,
            }}
          >
            {readOnly && viewFilter === "granted"
              ? "No granted permissions in this category."
              : "No modules available in this category."}
          </Typography>
        </Box>
      ) : (
        filteredItems.map((item) => (
          <Box
            key={item.key}
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(140px, 1fr) repeat(3, 76px)",
              alignItems: "stretch",
              px: 0,
              minHeight: 40,
              borderTop: `1px solid ${theme.customTokens.borders.divider}`,
              "&:hover": {
                backgroundColor: theme.customTokens.surfaces.alt,
              },
            }}
          >
            <Typography
              sx={{
                fontSize: "0.8125rem",
                fontWeight: 400,
                color: theme.customTokens.text.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                px: 2,
                display: "flex",
                alignItems: "center",
              }}
            >
              {item.label}
            </Typography>

            {permissionActions.map((action) => {
              const checked = permissions[item.key]?.[action] ?? false;

              return (
                <Box
                  key={action}
                  sx={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "stretch",
                    borderLeft: `1px solid ${theme.customTokens.borders.divider}`,
                  }}
                >
                  {readOnly ? (
                    <Box
                      sx={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <ReadOnlyMark
                        granted={checked}
                        label={`${item.label} ${action}`}
                      />
                    </Box>
                  ) : (
                    <PermissionToggle
                      checked={checked}
                      ariaLabel={`${item.label} ${action}`}
                      onToggle={() => onToggle(item.key, action, !checked)}
                      fillCell
                    />
                  )}
                </Box>
              );
            })}
          </Box>
        ))
      )}
    </Box>
  );
}

export function countSelectedPermissions(
  permissions: Record<string, UserPermissionFlags>,
) {
  return countPermissionBreakdown(permissions).total;
}

export function countPermissionBreakdown(
  permissions: Record<string, UserPermissionFlags>,
) {
  return Object.values(permissions).reduce(
    (totals, flags) => ({
      view: totals.view + (flags.view ? 1 : 0),
      edit: totals.edit + (flags.edit ? 1 : 0),
      create: totals.create + (flags.create ? 1 : 0),
      total:
        totals.total +
        (flags.view ? 1 : 0) +
        (flags.edit ? 1 : 0) +
        (flags.create ? 1 : 0),
    }),
    { view: 0, edit: 0, create: 0, total: 0 },
  );
}

function PermissionToggle({
  checked,
  indeterminate = false,
  ariaLabel,
  onToggle,
  fillCell = false,
}: {
  checked: boolean;
  indeterminate?: boolean;
  ariaLabel: string;
  onToggle: () => void;
  fillCell?: boolean;
}) {
  const theme = useTheme();
  const selected = checked || indeterminate;

  return (
    <Box
      component="label"
      sx={{
        position: "relative",
        width: fillCell ? "100%" : 36,
        height: fillCell ? "100%" : 36,
        minWidth: fillCell ? "100%" : 36,
        minHeight: 36,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        borderRadius: fillCell ? 0 : "8px",
        margin: 0,
        boxSizing: "border-box",
        "&:hover": {
          backgroundColor: theme.customTokens.brand.primaryScale[50],
        },
        "&:has(input:focus-visible)": {
          outline: `2px solid ${theme.customTokens.brand.primary}`,
          outlineOffset: -2,
        },
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        aria-label={ariaLabel}
        ref={(element) => {
          if (element) {
            element.indeterminate = indeterminate;
          }
        }}
        onChange={() => {
          onToggle();
        }}
        style={{
          position: "absolute",
          opacity: 0,
          width: "100%",
          height: "100%",
          margin: 0,
          cursor: "pointer",
          inset: 0,
          zIndex: 1,
        }}
      />
      <Box
        aria-hidden
        sx={{
          width: 18,
          height: 18,
          borderRadius: "4px",
          border: `1.5px solid ${
            selected
              ? theme.customTokens.brand.primary
              : theme.customTokens.borders.strong
          }`,
          backgroundColor: selected
            ? theme.customTokens.brand.primary
            : theme.customTokens.surfaces.surface,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          pointerEvents: "none",
          flexShrink: 0,
        }}
      >
        {checked ? <Check size={12} strokeWidth={2.75} /> : null}
        {indeterminate && !checked ? (
          <Box
            sx={{
              width: 8,
              height: 2,
              borderRadius: 1,
              backgroundColor: "#FFFFFF",
            }}
          />
        ) : null}
      </Box>
    </Box>
  );
}

function ReadOnlyMark({
  granted,
  label,
}: {
  granted: boolean;
  label: string;
}) {
  const theme = useTheme();

  return (
    <Box
      aria-label={`${label}: ${granted ? "granted" : "not granted"}`}
      sx={{
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {granted ? (
        <Box
          sx={{
            width: 20,
            height: 20,
            borderRadius: "4px",
            backgroundColor: theme.customTokens.brand.primaryScale[50],
            color: theme.customTokens.brand.primary,
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={12} strokeWidth={2.75} />
        </Box>
      ) : (
        <Typography
          sx={{
            fontSize: "0.875rem",
            color: theme.customTokens.text.disabled,
            lineHeight: 1,
          }}
        >
          —
        </Typography>
      )}
    </Box>
  );
}

function FilterChip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  const theme = useTheme();

  return (
    <Box
      component="button"
      type="button"
      onClick={onClick}
      sx={{
        px: 1.1,
        py: 0.5,
        borderRadius: "8px",
        border: `1px solid ${
          selected
            ? theme.customTokens.brand.primaryScale[200]
            : theme.customTokens.borders.default
        }`,
        backgroundColor: selected
          ? theme.customTokens.brand.primaryScale[50]
          : "transparent",
        color: selected
          ? theme.customTokens.brand.primary
          : theme.customTokens.text.secondary,
        fontSize: "0.75rem",
        fontWeight: selected ? 600 : 500,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
    >
      {label}
    </Box>
  );
}

function countEnabledModules(
  items: readonly PermissionItem[],
  permissions: Record<string, UserPermissionFlags>,
) {
  return items.reduce((count, item) => {
    const flags = permissions[item.key];
    if (!flags) {
      return count;
    }

    return flags.view || flags.edit || flags.create ? count + 1 : count;
  }, 0);
}

function getActionValues(
  items: readonly PermissionItem[],
  action: UserPermissionAction,
  permissions: Record<string, UserPermissionFlags>,
) {
  return items.map((item) => permissions[item.key]?.[action] ?? false);
}

function isActionFullySelected(
  items: readonly PermissionItem[],
  action: UserPermissionAction,
  permissions: Record<string, UserPermissionFlags>,
) {
  const values = getActionValues(items, action, permissions);
  return values.length > 0 && values.every(Boolean);
}

function isActionPartlySelected(
  items: readonly PermissionItem[],
  action: UserPermissionAction,
  permissions: Record<string, UserPermissionFlags>,
) {
  const values = getActionValues(items, action, permissions);
  return values.some(Boolean) && !values.every(Boolean);
}
