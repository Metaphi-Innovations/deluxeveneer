import { useEffect, useState } from "react";
import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Menu } from "lucide-react";
import { Outlet } from "react-router";

import deluxeMark from "../assets/favicon.png";
import { Sidebar } from "./Sidebar";

export function AppShell() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (isDesktop) {
      setMobileOpen(false);
    }
  }, [isDesktop]);

  const sidebarWidth = desktopCollapsed
    ? theme.customTokens.layout.sidebarCollapsedWidth
    : theme.customTokens.layout.sidebarExpandedWidth;

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100dvh",
        bgcolor: "background.paper",
      }}
    >
      {!isDesktop ? (
        <AppBar
          position="fixed"
          sx={{
            bgcolor: "background.paper",
            color: "text.primary",
          }}
        >
          <Toolbar
            sx={{
              minHeight: theme.customTokens.layout.mobileHeaderHeight,
              px: 2,
              gap: 1.5,
            }}
          >
            <IconButton
              aria-label="Open navigation"
              color="inherit"
              onClick={() => setMobileOpen(true)}
              sx={{
                color: "primary.main",
              }}
            >
              <Menu size={theme.customTokens.iconSizes.md} />
            </IconButton>

            <Box
              component="img"
              src={deluxeMark}
              alt="Deluxe Veneers brand mark"
              sx={{
                width: 28,
                height: 28,
                objectFit: "contain",
              }}
            />

            <Typography variant="subtitle1" color="text.primary">
              Deluxe Veneers
            </Typography>
          </Toolbar>
        </AppBar>
      ) : null}

      <Sidebar
        collapsed={desktopCollapsed}
        isDesktop={isDesktop}
        open={isDesktop ? true : mobileOpen}
        onClose={() => setMobileOpen(false)}
        onToggleCollapse={() => setDesktopCollapsed((current) => !current)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          minHeight: "100dvh",
          ml: isDesktop ? `${sidebarWidth}px` : 0,
          pt: isDesktop ? 0 : `${theme.customTokens.layout.mobileHeaderHeight}px`,
          bgcolor: "background.paper",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
