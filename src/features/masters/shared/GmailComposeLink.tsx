import { Typography } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";

import { getGmailComposeUrl } from "./utils";

const gmailComposeLinkSx = (theme: Theme) => ({
  color: theme.customTokens.brand.primary,
  textDecoration: "none",
  cursor: "pointer",
  "&:hover": {
    textDecoration: "underline",
  },
});

export function GmailComposeLink({
  email,
  sx,
}: {
  email: string;
  sx?: SxProps<Theme>;
}) {
  return (
    <Typography
      component="a"
      variant="inherit"
      href={getGmailComposeUrl(email)}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(event) => event.stopPropagation()}
      sx={[gmailComposeLinkSx, ...(sx ? (Array.isArray(sx) ? sx : [sx]) : [])]}
    >
      {email}
    </Typography>
  );
}
