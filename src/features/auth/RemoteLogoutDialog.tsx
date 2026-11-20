import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogContent,
  Divider,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { ArrowRight, ShieldOff } from "lucide-react";
import { useNavigate } from "react-router";

import deluxeMark from "../../assets/favicon.png";
import {
  getHighlightedRecordFormPrimaryButtonSx,
  recordFormActionButtonSx,
} from "../../components/shared/buttonStyles";
import { portalIconSize, portalIconStroke } from "../../components/shared/portalIconStandards";
import { AUTH_REMOTE_LOGOUT_EVENT } from "./authSession";

export function RemoteLogoutDialog() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handleRemoteLogout = () => {
      setOpen(true);
    };

    window.addEventListener(AUTH_REMOTE_LOGOUT_EVENT, handleRemoteLogout);
    return () => {
      window.removeEventListener(AUTH_REMOTE_LOGOUT_EVENT, handleRemoteLogout);
    };
  }, []);

  const handleReturnToLogin = () => {
    setOpen(false);
    navigate("/", { replace: true });
  };

  const primaryButtonSx = [
    recordFormActionButtonSx,
    getHighlightedRecordFormPrimaryButtonSx(theme),
    {
      width: "100%",
      minHeight: 42,
      height: 42,
      borderRadius: "8px",
    },
  ];

  return (
    <Dialog
      disableEscapeKeyDown
      open={open}
      slotProps={{
        backdrop: {
          sx: {
            backdropFilter: "blur(14px) saturate(0.88)",
            backgroundColor: "rgba(247, 243, 238, 0.72)",
            backgroundImage: `
              radial-gradient(ellipse 70% 60% at 50% 40%, rgba(116, 22, 22, 0.07), transparent 65%),
              linear-gradient(180deg, rgba(255, 255, 255, 0.15) 0%, rgba(236, 226, 214, 0.25) 100%)
            `,
          },
        },
        paper: {
          elevation: 0,
          sx: {
            borderRadius: `${theme.customTokens.radius.sm}px`,
            border: `1px solid ${theme.customTokens.neutrals[200]}`,
            boxShadow:
              "0 24px 56px rgba(67, 32, 32, 0.14), 0 8px 20px rgba(67, 32, 32, 0.08)",
            outline: "none",
            overflow: "hidden",
            width: "min(460px, calc(100vw - 32px))",
            "&:focus, &:focus-visible": {
              outline: "none",
            },
          },
        },
      }}
    >
      <Box
        sx={{
          height: 4,
          width: "100%",
          background: `linear-gradient(90deg, ${theme.customTokens.brand.primaryScale[700]} 0%, ${theme.customTokens.brand.primary} 48%, ${theme.customTokens.brand.primaryScale[600]} 100%)`,
        }}
      />

      <DialogContent
        sx={{
          display: "flex",
          flexDirection: "column",
          gap: theme.spacing(2.75),
          px: theme.spacing(3.5),
          py: theme.spacing(3.5),
          backgroundColor: theme.customTokens.surfaces.surface,
        }}
      >
        <Stack alignItems="center" direction="row" justifyContent="center" spacing={1}>
          <Box
            alt=""
            component="img"
            src={deluxeMark}
            sx={{
              width: 28,
              height: 28,
              objectFit: "contain",
            }}
          />
          <Typography
            color="text.primary"
            sx={{ fontWeight: 600, letterSpacing: "0.02em" }}
            variant="subtitle2"
          >
            Deluxe Veneers
          </Typography>
        </Stack>

        <Divider sx={{ borderColor: theme.customTokens.neutrals[200] }} />

        <Stack alignItems="center" spacing={1.75} sx={{ textAlign: "center" }}>
          <Box
            sx={{
              alignItems: "center",
              background: `linear-gradient(145deg, ${theme.customTokens.brand.primaryScale[50]} 0%, ${theme.customTokens.brand.primaryScale[100]} 100%)`,
              border: `1px solid ${theme.customTokens.brand.primaryScale[200]}`,
              borderRadius: "50%",
              boxShadow: `0 8px 20px ${theme.customTokens.brand.primaryScale[100]}`,
              color: theme.customTokens.brand.primary,
              display: "flex",
              height: 56,
              justifyContent: "center",
              width: 56,
            }}
          >
            <ShieldOff size={26} strokeWidth={portalIconStroke.default} />
          </Box>

          <Stack spacing={0.75}>
            <Typography color="text.primary" variant="h3">
              Session ended
            </Typography>
            <Typography color="text.secondary" sx={{ maxWidth: 360, mx: "auto" }} variant="body2">
              You signed out in another browser tab. This tab is no longer
              authenticated — sign in again to continue working in Deluxe Veneers.
            </Typography>
          </Stack>

          <Box
            sx={{
              backgroundColor: theme.customTokens.brand.primaryScale[50],
              border: `1px solid ${theme.customTokens.brand.primaryScale[100]}`,
              borderRadius: `${theme.customTokens.radius.sm}px`,
              color: theme.customTokens.brand.primaryScale[900],
              maxWidth: 380,
              px: 2,
              py: 1.25,
              width: "100%",
            }}
          >
            <Typography sx={{ fontSize: "0.8125rem", lineHeight: 1.5 }} variant="body2">
              For your security, unsaved changes on this page cannot be submitted
              until you log in again.
            </Typography>
          </Box>
        </Stack>

        <Button
          endIcon={
            <ArrowRight
              size={portalIconSize.md}
              strokeWidth={portalIconStroke.default}
            />
          }
          onClick={handleReturnToLogin}
          sx={primaryButtonSx}
          variant="contained"
        >
          Return to login
        </Button>
      </DialogContent>
    </Dialog>
  );
}