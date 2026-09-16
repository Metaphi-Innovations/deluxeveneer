import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { ArrowRight, CheckCircle2, Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { Link as RouterLink, useNavigate, useSearchParams } from "react-router";

import deluxeLogo from "../../../assets/deluxe-veneers.png";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import { confirmPasswordReset } from "../authSession";

export function SetupPasswordPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setErrorMessage("Account setup token is missing or invalid. Please check the invitation link sent to your email.");
    }
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (!token) {
      setErrorMessage("Setup token is missing. Please use the link provided in your email.");
      return;
    }

    if (!password.trim()) {
      setErrorMessage("Please enter a password.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const msg = await confirmPasswordReset(token, password, confirmPassword);
      setSuccessMessage(msg || "Your password has been successfully configured!");
      setTimeout(() => {
        navigate("/", { replace: true });
      }, 2000);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to set password. The setup link may have expired.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldVisualState = errorMessage ? "error" : "default";
  const fieldSx = [
    getCompactFieldSx(theme, fieldVisualState, { large: true }),
    {
      "& .MuiOutlinedInput-root": {
        height: 42,
        minHeight: 42,
        borderRadius: "9px",
      },
    },
  ];

  const brandPanelBackground = {
    backgroundColor: "#F7F3EE",
    backgroundImage: `
      linear-gradient(165deg, rgba(247, 243, 238, 0.92) 0%, rgba(245, 239, 231, 0.88) 42%, rgba(236, 226, 214, 0.9) 100%),
      repeating-linear-gradient(
        118deg,
        transparent 0px,
        transparent 11px,
        rgba(148, 112, 78, 0.035) 11px,
        rgba(148, 112, 78, 0.035) 12px
      ),
      radial-gradient(ellipse 80% 55% at 12% 18%, rgba(116, 22, 22, 0.06), transparent 58%),
      radial-gradient(ellipse 70% 50% at 88% 78%, rgba(168, 120, 72, 0.1), transparent 55%),
      radial-gradient(ellipse 55% 40% at 55% 45%, rgba(255, 252, 248, 0.55), transparent 70%)
    `,
  };

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: theme.customTokens.surfaces.surface,
      }}
    >
      <Box
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          minHeight: 0,
        }}
      >
        {/* Left — brand panel */}
        <Box
          component="aside"
          sx={{
            display: { xs: "none", md: "flex" },
            flexDirection: "column",
            width: { md: "43%", lg: "44%" },
            flexShrink: 0,
            position: "relative",
            overflow: "hidden",
            px: { md: 5, lg: 7 },
            py: { md: 5, lg: 6 },
            ...brandPanelBackground,
            "&::before": {
              content: '""',
              position: "absolute",
              inset: 0,
              background: `
                linear-gradient(135deg, transparent 58%, rgba(180, 140, 100, 0.08) 58.2%, transparent 72%),
                linear-gradient(155deg, transparent 30%, rgba(160, 120, 85, 0.05) 30.3%, transparent 48%)
              `,
              pointerEvents: "none",
            },
            "&::after": {
              content: '""',
              position: "absolute",
              right: "-18%",
              bottom: "-22%",
              width: "70%",
              height: "70%",
              borderRadius: "48% 52% 44% 56%",
              background:
                "radial-gradient(circle at 40% 40%, rgba(116, 22, 22, 0.05), transparent 68%)",
              pointerEvents: "none",
            },
          }}
        >
          <Box
            component="img"
            src={deluxeLogo}
            alt="Deluxe Veneers"
            sx={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: { md: 168, lg: 196 },
              objectFit: "contain",
              alignSelf: "flex-start",
            }}
          />

          <Stack
            spacing={2.5}
            sx={{
              position: "relative",
              zIndex: 1,
              mt: "auto",
              mb: "auto",
              pt: 6,
              pb: 4,
              maxWidth: 420,
            }}
          >
            <Typography
              component="h1"
              sx={{
                fontSize: { md: "1.65rem", lg: "1.75rem" },
                fontWeight: 700,
                lineHeight: 1.25,
                letterSpacing: "-0.02em",
                color: theme.customTokens.text.primary,
              }}
            >
              Account Setup.
              <br />
              Secure Access.
            </Typography>

            <Typography
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: theme.customTokens.text.secondary,
                maxWidth: 340,
              }}
            >
              Create your personal password to activate your Deluxe Veneers workspace account and get started.
            </Typography>
          </Stack>

          <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            sx={{
              position: "relative",
              zIndex: 1,
              mt: "auto",
              pt: 2,
              borderTop: "1px solid rgba(148, 112, 78, 0.15)",
            }}
          >
            <ShieldCheck size={16} color="#741616" strokeWidth={2} />
            <Typography
              sx={{
                fontSize: "0.75rem",
                fontWeight: 500,
                color: theme.customTokens.text.secondary,
                letterSpacing: "0.01em",
              }}
            >
              256-bit encrypted authentication
            </Typography>
          </Stack>
        </Box>

        {/* Mobile brand header */}
        <Box
          sx={{
            display: { xs: "flex", md: "none" },
            alignItems: "center",
            justifyContent: "center",
            px: 3,
            pt: 3.5,
            pb: 1.5,
            ...brandPanelBackground,
          }}
        >
          <Box
            component="img"
            src={deluxeLogo}
            alt="Deluxe Veneers"
            sx={{
              width: "100%",
              maxWidth: 160,
              objectFit: "contain",
            }}
          />
        </Box>

        {/* Right — setup form area */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2.5, sm: 4, md: 5, lg: 7 },
            py: { xs: 3, md: 5 },
            backgroundColor: theme.customTokens.surfaces.surface,
            minWidth: 0,
          }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{
              width: "100%",
              maxWidth: 420,
            }}
          >
            <Stack spacing={3}>
              <Stack spacing={1}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 32,
                      height: 32,
                      borderRadius: "8px",
                      backgroundColor: "rgba(116, 22, 22, 0.08)",
                      color: theme.customTokens.brand.primary,
                    }}
                  >
                    <KeyRound size={18} />
                  </Box>
                  <Typography
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: 600,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      color: theme.customTokens.brand.primary,
                    }}
                  >
                    Welcome to Deluxe Veneers
                  </Typography>
                </Stack>

                <Typography
                  component="h2"
                  sx={{
                    fontSize: { xs: "1.5rem", sm: "1.625rem" },
                    fontWeight: 700,
                    letterSpacing: "-0.02em",
                    lineHeight: 1.25,
                    color: theme.customTokens.text.primary,
                  }}
                >
                  Set Up Password
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: theme.customTokens.text.secondary,
                    lineHeight: 1.5,
                  }}
                >
                  Please choose a secure password to complete your account setup and log in.
                </Typography>
              </Stack>

              {successMessage ? (
                <Alert
                  severity="success"
                  icon={<CheckCircle2 size={18} />}
                  sx={{
                    borderRadius: `${theme.customTokens.radius.md}px`,
                  }}
                >
                  {successMessage} Redirecting to login...
                </Alert>
              ) : null}

              {errorMessage ? (
                <Alert
                  severity="error"
                  sx={{
                    borderRadius: `${theme.customTokens.radius.md}px`,
                  }}
                >
                  {errorMessage}
                </Alert>
              ) : null}

              <Stack spacing={2.25}>
                <Stack spacing={0.75}>
                  <Typography
                    component="label"
                    htmlFor="setup-password"
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.primary,
                    }}
                  >
                    New Password
                  </Typography>
                  <TextField
                    id="setup-password"
                    autoComplete="new-password"
                    placeholder="Enter new password (min. 8 characters)"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    disabled={isSubmitting || Boolean(successMessage)}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (errorMessage) {
                        setErrorMessage("");
                      }
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword ? "Hide password" : "Show password"
                              }
                              edge="end"
                              onClick={() => setShowPassword((prev) => !prev)}
                              size="small"
                              sx={{ color: theme.customTokens.text.secondary }}
                            >
                              {showPassword ? (
                                <EyeOff size={16} strokeWidth={1.75} />
                              ) : (
                                <Eye size={16} strokeWidth={1.75} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    fullWidth
                    sx={fieldSx}
                  />
                </Stack>

                <Stack spacing={0.75}>
                  <Typography
                    component="label"
                    htmlFor="setup-confirm-password"
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.primary,
                    }}
                  >
                    Confirm Password
                  </Typography>
                  <TextField
                    id="setup-confirm-password"
                    autoComplete="new-password"
                    placeholder="Confirm your new password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    disabled={isSubmitting || Boolean(successMessage)}
                    onChange={(event) => {
                      setConfirmPassword(event.target.value);
                      if (errorMessage) {
                        setErrorMessage("");
                      }
                    }}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showConfirmPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              edge="end"
                              onClick={() =>
                                setShowConfirmPassword((prev) => !prev)
                              }
                              size="small"
                              sx={{ color: theme.customTokens.text.secondary }}
                            >
                              {showConfirmPassword ? (
                                <EyeOff size={16} strokeWidth={1.75} />
                              ) : (
                                <Eye size={16} strokeWidth={1.75} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                    fullWidth
                    sx={fieldSx}
                  />
                </Stack>
              </Stack>

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={isSubmitting || Boolean(successMessage) || !token}
                endIcon={<ArrowRight size={16} strokeWidth={2} />}
                sx={{
                  mt: 0.5,
                  py: 1.25,
                  borderRadius: "9px",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textTransform: "none",
                  backgroundColor: theme.customTokens.brand.primary,
                  boxShadow: "none",
                  "&:hover": {
                    backgroundColor: theme.customTokens.brand.primaryScale[800],
                    boxShadow: "none",
                  },
                }}
              >
                {isSubmitting ? "Saving..." : "Complete Setup & Sign In"}
              </Button>

              <Stack alignItems="center" sx={{ pt: 1 }}>
                <Typography
                  component={RouterLink}
                  to="/"
                  sx={{
                    fontSize: "0.8125rem",
                    color: theme.customTokens.text.secondary,
                    textDecoration: "none",
                    fontWeight: 500,
                    "&:hover": {
                      color: theme.customTokens.brand.primary,
                      textDecoration: "underline",
                    },
                  }}
                >
                  Return to Login
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
