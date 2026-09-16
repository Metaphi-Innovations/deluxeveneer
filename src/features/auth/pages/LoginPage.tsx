import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import { ArrowRight, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router";

import deluxeLogo from "../../../assets/deluxe-veneers.png";
import { getCompactFieldSx } from "../../../pages/ComponentLibrary/sections/inputs/components/inputFieldStyles";
import {
  demoCredentials,
  getDefaultAuthenticatedRoute,
  isAuthenticated,
  resetDemoPassword,
  signIn,
} from "../authSession";

type ForgotPasswordStep = "email" | "otp";

export function LoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();
  const authenticated = useMemo(() => isAuthenticated(), []);
  const [email, setEmail] = useState<string>(demoCredentials.email);
  const [password, setPassword] = useState<string>(demoCredentials.password);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loginNotice, setLoginNotice] = useState("");
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [resetPasswordOpen, setResetPasswordOpen] = useState(false);
  const [forgotPasswordStep, setForgotPasswordStep] =
    useState<ForgotPasswordStep>("email");
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const [forgotPasswordOtp, setForgotPasswordOtp] = useState("");
  const [forgotPasswordNewPassword, setForgotPasswordNewPassword] = useState("");
  const [forgotPasswordConfirmPassword, setForgotPasswordConfirmPassword] =
    useState("");
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");

  if (authenticated) {
    return <Navigate to={getDefaultAuthenticatedRoute()} replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage("");

    try {
      if (await signIn(email, password)) {
        navigate(getDefaultAuthenticatedRoute(), { replace: true });
        return;
      }

      setLoginNotice("");
      setErrorMessage("Invalid email or password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForgotPasswordState = () => {
    setForgotPasswordStep("email");
    setForgotPasswordEmail(email);
    setForgotPasswordOtp("");
    setForgotPasswordNewPassword("");
    setForgotPasswordConfirmPassword("");
    setForgotPasswordMessage("");
    setForgotPasswordError("");
    setResetPasswordOpen(false);
  };

  const handleOpenForgotPassword = () => {
    resetForgotPasswordState();
    setForgotPasswordOpen(true);
  };

  const handleCloseForgotPassword = () => {
    setForgotPasswordOpen(false);
    setForgotPasswordMessage("");
    setForgotPasswordError("");
  };

  const handleCloseResetPassword = () => {
    setResetPasswordOpen(false);
    setForgotPasswordNewPassword("");
    setForgotPasswordConfirmPassword("");
    setForgotPasswordMessage("");
    setForgotPasswordError("");
  };

  const handleForgotPasswordAction = () => {
    setForgotPasswordError("");

    if (forgotPasswordStep === "email") {
      if (!forgotPasswordEmail.trim()) {
        setForgotPasswordError("Enter email address.");
        return;
      }

      if (forgotPasswordEmail.trim().toLowerCase() !== demoCredentials.email) {
        setForgotPasswordError("Email address not found.");
        return;
      }

      setForgotPasswordStep("otp");
      setForgotPasswordMessage("OTP sent. Enter the OTP to continue.");
      return;
    }

    if (forgotPasswordStep === "otp") {
      if (!forgotPasswordOtp.trim()) {
        setForgotPasswordError("Enter OTP.");
        return;
      }

      if (forgotPasswordOtp.trim().length < 4) {
        setForgotPasswordError("Enter a valid OTP.");
        return;
      }

      setForgotPasswordOpen(false);
      setResetPasswordOpen(true);
      setForgotPasswordMessage("Email verified. Set your new password.");
    }
  };

  const handleResetPasswordAction = () => {
    setForgotPasswordError("");

    if (!forgotPasswordNewPassword.trim()) {
      setForgotPasswordError("Enter new password.");
      return;
    }

    if (forgotPasswordNewPassword.trim().length < 4) {
      setForgotPasswordError("Password must be at least 4 characters.");
      return;
    }

    if (forgotPasswordNewPassword !== forgotPasswordConfirmPassword) {
      setForgotPasswordError("Passwords do not match.");
      return;
    }

    resetDemoPassword(forgotPasswordNewPassword);
    setEmail(forgotPasswordEmail.trim().toLowerCase());
    setPassword("");
    setErrorMessage("");
    setLoginNotice("Password reset successful. Sign in with the new password.");
    handleCloseResetPassword();
    resetForgotPasswordState();
  };

  const forgotPasswordPrimaryLabel =
    forgotPasswordStep === "email" ? "Verify Email" : "Verify";

  const fieldVisualState = errorMessage ? "error" : "default";
  const loginFieldSx = [
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
              Precision.
              <br />
              Process.
              <br />
              Performance.
            </Typography>

            <Typography
              sx={{
                fontSize: "0.875rem",
                lineHeight: 1.6,
                color: theme.customTokens.text.secondary,
                maxWidth: 340,
              }}
            >
              Manage inventory, production, orders and operations from one
              secure workspace.
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

        {/* Right — login area */}
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
                <Typography
                  sx={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: theme.customTokens.brand.primary,
                  }}
                >
                  Deluxe Veneers ERP
                </Typography>

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
                  Welcome back
                </Typography>

                <Typography
                  sx={{
                    fontSize: "0.875rem",
                    color: theme.customTokens.text.secondary,
                    lineHeight: 1.5,
                  }}
                >
                  Sign in to continue to your workspace.
                </Typography>
              </Stack>

              <Stack spacing={2.25}>
                <Stack spacing={0.75}>
                  <Typography
                    component="label"
                    htmlFor="login-email"
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.primary,
                    }}
                  >
                    Email Address
                  </Typography>
                  <TextField
                    id="login-email"
                    autoComplete="username"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      if (errorMessage) {
                        setErrorMessage("");
                      }
                    }}
                    fullWidth
                    sx={loginFieldSx}
                  />
                </Stack>

                <Stack spacing={0.75}>
                  <Typography
                    component="label"
                    htmlFor="login-password"
                    sx={{
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.text.primary,
                    }}
                  >
                    Password
                  </Typography>
                  <TextField
                    id="login-password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(event) => {
                      setPassword(event.target.value);
                      if (errorMessage) {
                        setErrorMessage("");
                      }
                    }}
                    fullWidth
                    sx={loginFieldSx}
                    slotProps={{
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton
                              aria-label={
                                showPassword
                                  ? "Hide password"
                                  : "Show password"
                              }
                              edge="end"
                              onClick={() => setShowPassword((prev) => !prev)}
                              size="small"
                              sx={{
                                color: theme.customTokens.text.secondary,
                                "&:hover": {
                                  color: theme.customTokens.brand.primary,
                                  backgroundColor: "transparent",
                                },
                              }}
                            >
                              {showPassword ? (
                                <EyeOff size={18} strokeWidth={1.75} />
                              ) : (
                                <Eye size={18} strokeWidth={1.75} />
                              )}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Stack>

                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                    mt: -0.5,
                  }}
                >
                  <Button
                    type="button"
                    onClick={handleOpenForgotPassword}
                    variant="text"
                    sx={{
                      px: 0,
                      minWidth: 0,
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      color: theme.customTokens.brand.primary,
                      "&:hover": {
                        backgroundColor: "transparent",
                        color: theme.customTokens.brand.primaryScale[800],
                      },
                    }}
                  >
                    Forgot password?
                  </Button>
                </Box>

                {errorMessage ? (
                  <Alert
                    severity="error"
                    sx={{
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      py: 0.75,
                    }}
                  >
                    {errorMessage}
                  </Alert>
                ) : null}

                {loginNotice ? (
                  <Alert
                    severity="success"
                    sx={{
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      py: 0.75,
                    }}
                  >
                    {loginNotice}
                  </Alert>
                ) : null}

                <Button
                  disabled={isSubmitting}
                  type="submit"
                  variant="contained"
                  fullWidth
                  endIcon={
                    !isSubmitting ? (
                      <ArrowRight size={18} strokeWidth={2} />
                    ) : undefined
                  }
                  sx={{
                    minHeight: 42,
                    height: 42,
                    borderRadius: "9px",
                    boxShadow: "none",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    backgroundColor: theme.customTokens.brand.primary,
                    "&:hover": {
                      boxShadow: "none",
                      backgroundColor:
                        theme.customTokens.brand.primaryScale[800],
                    },
                    "&.Mui-disabled": {
                      backgroundColor:
                        theme.customTokens.brand.primaryScale[300],
                      color: "#FFFFFF",
                    },
                  }}
                >
                  {isSubmitting ? "Signing In" : "Sign In"}
                </Button>

                <Stack
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  justifyContent="center"
                  sx={{ pt: 0.5 }}
                >
                  <ShieldCheck
                    size={14}
                    strokeWidth={1.75}
                    color={theme.customTokens.text.disabled}
                  />
                  <Typography
                    sx={{
                      fontSize: "0.75rem",
                      color: theme.customTokens.text.disabled,
                      letterSpacing: "0.01em",
                    }}
                  >
                    Secure access to Deluxe Veneers ERP
                  </Typography>
                </Stack>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Box>

      <Box
        component="footer"
        sx={{
          px: { xs: 2.5, sm: 3 },
          py: 1.75,
          textAlign: "center",
          borderTop: `1px solid ${theme.customTokens.borders.divider}`,
          backgroundColor: theme.customTokens.surfaces.surface,
        }}
      >
        <Typography
          sx={{
            fontSize: "0.7rem",
            lineHeight: 1.5,
            color: theme.customTokens.text.disabled,
          }}
        >
          © 2026 Deluxe Veneers. All rights reserved. · Developed by{" "}
          <Box
            component="span"
            sx={{
              fontWeight: 600,
              color: theme.customTokens.text.secondary,
            }}
          >
            Metaphi Innovations Private Limited
          </Box>
        </Typography>
      </Box>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={forgotPasswordOpen}
        onClose={handleCloseForgotPassword}
        slotProps={{
          paper: {
            sx: {
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.lg}px`,
              boxShadow: theme.customTokens.elevation.sm,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
          }}
        >
          Forgot Password
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Verify your email and OTP before setting a new password.
            </Typography>

            <TextField
              label="Email Address"
              value={forgotPasswordEmail}
              onChange={(event) => {
                setForgotPasswordEmail(event.target.value);
                if (forgotPasswordError) {
                  setForgotPasswordError("");
                }
              }}
              sx={getCompactFieldSx(
                theme,
                forgotPasswordError && forgotPasswordStep === "email"
                  ? "error"
                  : forgotPasswordStep === "email"
                    ? "default"
                    : "readOnly",
              )}
              slotProps={{
                input: {
                  readOnly: forgotPasswordStep !== "email",
                },
              }}
            />

            {forgotPasswordStep !== "email" ? (
              <TextField
                label="OTP"
                value={forgotPasswordOtp}
                onChange={(event) => {
                  setForgotPasswordOtp(event.target.value);
                  if (forgotPasswordError) {
                    setForgotPasswordError("");
                  }
                }}
                sx={getCompactFieldSx(
                  theme,
                  forgotPasswordError && forgotPasswordStep === "otp"
                    ? "error"
                    : forgotPasswordStep === "otp"
                      ? "default"
                      : "readOnly",
                )}
                slotProps={{
                  input: {
                    readOnly: false,
                  },
                }}
              />
            ) : null}

            {forgotPasswordMessage ? (
              <Alert
                severity="success"
                sx={{
                  borderRadius: `${theme.customTokens.radius.md}px`,
                }}
              >
                {forgotPasswordMessage}
              </Alert>
            ) : null}

            {forgotPasswordError ? (
              <Alert
                severity="error"
                sx={{
                  borderRadius: `${theme.customTokens.radius.md}px`,
                }}
              >
                {forgotPasswordError}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={handleCloseForgotPassword}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            onClick={handleForgotPasswordAction}
          >
            {forgotPasswordPrimaryLabel}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        fullWidth
        maxWidth="xs"
        open={resetPasswordOpen}
        onClose={handleCloseResetPassword}
        slotProps={{
          paper: {
            sx: {
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: `${theme.customTokens.radius.lg}px`,
              boxShadow: theme.customTokens.elevation.sm,
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
          }}
        >
          Reset Password
        </DialogTitle>

        <DialogContent
          sx={{
            pt: 1,
          }}
        >
          <Stack spacing={2}>
            <Typography variant="body2" color="text.secondary">
              Set a new password for {forgotPasswordEmail || "your account"}.
            </Typography>

            <TextField
              label="New Password"
              type="password"
              value={forgotPasswordNewPassword}
              onChange={(event) => {
                setForgotPasswordNewPassword(event.target.value);
                if (forgotPasswordError) {
                  setForgotPasswordError("");
                }
              }}
              sx={getCompactFieldSx(
                theme,
                forgotPasswordError ? "error" : "default",
              )}
            />

            <TextField
              label="Confirm New Password"
              type="password"
              value={forgotPasswordConfirmPassword}
              onChange={(event) => {
                setForgotPasswordConfirmPassword(event.target.value);
                if (forgotPasswordError) {
                  setForgotPasswordError("");
                }
              }}
              sx={getCompactFieldSx(
                theme,
                forgotPasswordError ? "error" : "default",
              )}
            />

            {forgotPasswordMessage ? (
              <Alert
                severity="success"
                sx={{
                  borderRadius: `${theme.customTokens.radius.md}px`,
                }}
              >
                {forgotPasswordMessage}
              </Alert>
            ) : null}

            {forgotPasswordError ? (
              <Alert
                severity="error"
                sx={{
                  borderRadius: `${theme.customTokens.radius.md}px`,
                }}
              >
                {forgotPasswordError}
              </Alert>
            ) : null}
          </Stack>
        </DialogContent>

        <DialogActions
          sx={{
            px: 3,
            pb: 3,
            pt: 1,
          }}
        >
          <Button
            type="button"
            variant="outlined"
            onClick={handleCloseResetPassword}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="contained"
            onClick={handleResetPasswordAction}
          >
            Reset Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
