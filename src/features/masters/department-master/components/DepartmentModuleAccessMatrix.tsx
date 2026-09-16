import { Checkbox, FormControlLabel, Stack, Typography, useTheme } from "@mui/material";
import { Box } from "@mui/system";
import type { Theme } from "@mui/material/styles";

import type { DepartmentAccessSection } from "../mock/departmentMasterData";

interface DepartmentModuleAccessMatrixProps {
  onToggleAll: (checked: boolean) => void;
  onToggleItem: (key: string, checked: boolean) => void;
  readOnly?: boolean;
  sections: readonly DepartmentAccessSection[];
  selectedKeys: readonly string[];
}

export function DepartmentModuleAccessMatrix({
  onToggleAll,
  onToggleItem,
  readOnly = false,
  sections,
  selectedKeys,
}: DepartmentModuleAccessMatrixProps) {
  const theme = useTheme();
  const allKeys = sections.flatMap((section) => section.items.map((item) => item.key));
  const selectedKeySet = new Set(selectedKeys);
  const selectedCount = allKeys.filter((key) => selectedKeySet.has(key)).length;
  const allSelected = allKeys.length > 0 && selectedCount === allKeys.length;
  const partiallySelected = selectedCount > 0 && selectedCount < allKeys.length;

  return (
    <Stack
      sx={(currentTheme) => ({
        gap: currentTheme.spacing(2.5),
      })}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1.5}
      >
        <Typography variant="h4" color="text.primary">
          Select Department
        </Typography>

        <FormControlLabel
          control={
            <Checkbox
              checked={allSelected}
              disabled={readOnly}
              indeterminate={partiallySelected}
              onChange={(event) => onToggleAll(event.target.checked)}
              sx={checkboxSx(theme)}
            />
          }
          label="Select All"
          sx={{ m: 0 }}
        />
      </Stack>

      {sections.map((section) => (
        <Stack
          key={section.id}
          sx={(currentTheme) => ({
            gap: currentTheme.spacing(1.5),
          })}
        >
          <Box
            sx={{
              px: theme.spacing(2),
              py: theme.spacing(0.75),
              backgroundColor: theme.customTokens.navigation.hoverBackground,
              borderRadius: `${theme.customTokens.radius.sm}px`,
            }}
          >
            <Typography
              variant="caption"
              color={theme.customTokens.navigation.activeText}
              sx={{
                display: "block",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textAlign: "center",
                textTransform: "uppercase",
              }}
            >
              {section.label}
            </Typography>
          </Box>

          <Box
            sx={(currentTheme) => ({
              display: "grid",
              gap: currentTheme.spacing(1),
              gridTemplateColumns: {
                xs: "repeat(1, minmax(0, 1fr))",
                sm: "repeat(2, minmax(0, 1fr))",
                md: "repeat(3, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
                xl: "repeat(5, minmax(0, 1fr))",
              },
            })}
          >
            {section.items.map((item) => (
              <Box
                key={item.key}
                sx={(currentTheme) => ({
                  minHeight: currentTheme.spacing(4.5),
                  display: "flex",
                  alignItems: "center",
                })}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={selectedKeySet.has(item.key)}
                      disabled={readOnly}
                      onChange={(event) =>
                        onToggleItem(item.key, event.target.checked)
                      }
                      sx={checkboxSx(theme)}
                    />
                  }
                  label={item.label}
                  sx={{
                    m: 0,
                    "& .MuiFormControlLabel-label": {
                      color: theme.customTokens.text.primary,
                      fontSize: theme.typography.body2.fontSize,
                    },
                  }}
                />
              </Box>
            ))}
          </Box>
        </Stack>
      ))}
    </Stack>
  );
}

function checkboxSx(theme: Theme) {
  return {
    color: theme.customTokens.borders.strong,
    "&.Mui-checked": {
      color: theme.customTokens.brand.primary,
    },
    "&.MuiCheckbox-indeterminate": {
      color: theme.customTokens.brand.primary,
    },
  };
}
