import type { ReactNode } from "react";
import { Stack, Typography } from "@mui/material";

type ShowcaseMetaProps = {
  sizes?: ReactNode | undefined;
  usage: string;
};

export function ShowcaseMeta({ sizes, usage }: ShowcaseMetaProps) {
  return (
    <Stack
      sx={(theme) => ({
        gap: theme.spacing(2),
      })}
    >
      {sizes ? (
        <Stack
          sx={(theme) => ({
            gap: theme.spacing(1),
          })}
        >
          <Typography variant="subtitle2" color="text.primary">
            Sizes
          </Typography>

          {sizes}
        </Stack>
      ) : null}

      <Stack
        sx={(theme) => ({
          gap: theme.spacing(0.75),
        })}
      >
        <Typography variant="subtitle2" color="text.primary">
          Usage
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {usage}
        </Typography>
      </Stack>
    </Stack>
  );
}
