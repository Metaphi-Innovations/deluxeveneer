import {
  IconButton,
  InputAdornment,
  TextField,
  type SxProps,
  type Theme,
  useTheme,
} from "@mui/material";
import { Search, X } from "lucide-react";

import { getCompactFieldSx } from "../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  portalIconSize,
  portalIconStroke,
} from "./portalIconStandards";

interface ClearableSearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  sx?: SxProps<Theme>;
}

export function ClearableSearchField({
  value,
  onChange,
  placeholder,
  sx,
}: ClearableSearchFieldProps) {
  const theme = useTheme();

  return (
    <TextField
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      sx={[
        getCompactFieldSx(theme),
        { maxWidth: 320, width: { xs: "100%", sm: 300 } },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      slotProps={{
        input: {
          endAdornment: (
            <InputAdornment position="end">
              {value ? (
                <IconButton
                  aria-label="Clear search"
                  edge="end"
                  onClick={() => onChange("")}
                  size="small"
                  sx={{
                    color: theme.customTokens.text.secondary,
                    mr: theme.spacing(-0.5),
                    p: theme.spacing(0.5),
                    "&:hover": {
                      backgroundColor:
                        theme.customTokens.navigation.hoverBackground,
                      color: theme.palette.primary.main,
                    },
                  }}
                >
                  <X
                    size={portalIconSize.md}
                    strokeWidth={portalIconStroke.default}
                  />
                </IconButton>
              ) : (
                <Search
                  color={theme.customTokens.text.secondary}
                  size={portalIconSize.md}
                  strokeWidth={portalIconStroke.default}
                />
              )}
            </InputAdornment>
          ),
        },
      }}
    />
  );
}
