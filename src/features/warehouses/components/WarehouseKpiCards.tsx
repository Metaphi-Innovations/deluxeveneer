import type { LucideIcon } from "lucide-react";
import { Box, Skeleton, Stack, Typography } from "@mui/material";
import { portalTypography } from "../../../theme/typography";

export interface WarehouseKpiCardData {
  id: string;
  label: string;
  value: string;
  secondaryValue?: string | undefined;
  icon: LucideIcon;
  subtext?: string | undefined;
  colorScheme?: "primary" | "success" | "warning" | "neutral";
}

interface WarehouseKpiCardsProps {
  cards: WarehouseKpiCardData[];
  isLoading?: boolean;
}

export function WarehouseKpiCards({ cards, isLoading }: WarehouseKpiCardsProps) {
  if (cards.length === 0) return null;

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: cards.length === 4 ? "repeat(2, minmax(0, 1fr))" : `repeat(${Math.min(cards.length, 3)}, minmax(0, 1fr))`,
          md: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))`,
        },
        gap: 1,
        width: "100%",
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <Box
            key={card.id}
            sx={(theme) => ({
              border: `1px solid ${theme.customTokens.borders.default}`,
              borderRadius: "6px",
              backgroundColor: theme.customTokens.surfaces.surface,
              boxShadow: "none",
              px: 1.25,
              py: 0.9,
              minWidth: 0,
              transition: "border-color 150ms ease, background-color 150ms ease",
              "&:hover": {
                borderColor: theme.palette.divider,
                backgroundColor: theme.customTokens.surfaces.alt,
              },
            })}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                sx={(theme) => ({
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: 28,
                  height: 28,
                  flexShrink: 0,
                  borderRadius: "6px",
                  backgroundColor:
                    card.colorScheme === "success"
                      ? theme.customTokens.semanticScale.success[100]
                      : card.colorScheme === "warning"
                      ? theme.customTokens.semanticScale.warning[100]
                      : theme.customTokens.brand.primaryScale[100],
                  color:
                    card.colorScheme === "success"
                      ? theme.customTokens.semanticScale.success[800]
                      : card.colorScheme === "warning"
                      ? theme.customTokens.semanticScale.warning[900]
                      : theme.customTokens.brand.primary,
                })}
              >
                <Icon size={16} strokeWidth={2.25} />
              </Box>

              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  sx={(theme) => ({
                    color: theme.customTokens.text.secondary,
                    fontSize: "11px",
                    fontWeight: 600,
                    lineHeight: 1.2,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    letterSpacing: "0.02em",
                  })}
                >
                  {card.label}
                </Typography>

                {isLoading ? (
                  <Skeleton width="60%" height={22} sx={{ mt: 0.2 }} />
                ) : (
                  <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mt: 0.2, flexWrap: "wrap" }}>
                    <Typography
                      sx={(theme) => ({
                        color: theme.customTokens.text.primary,
                        fontSize: "15px",
                        fontWeight: 700,
                        lineHeight: 1.2,
                        letterSpacing: "-0.01em",
                      })}
                    >
                      {card.value}
                    </Typography>

                    {card.secondaryValue ? (
                      <Typography
                        sx={(theme) => ({
                          color: theme.customTokens.text.secondary,
                          fontSize: "11.5px",
                          fontWeight: 500,
                          lineHeight: 1.2,
                        })}
                      >
                        {card.secondaryValue}
                      </Typography>
                    ) : null}
                  </Stack>
                )}

                {card.subtext ? (
                  <Typography
                    sx={(theme) => ({
                      mt: 0.2,
                      color: theme.customTokens.text.disabled,
                      fontSize: "10.5px",
                      fontWeight: 500,
                      lineHeight: 1.2,
                    })}
                  >
                    {card.subtext}
                  </Typography>
                ) : null}
              </Box>
            </Stack>
          </Box>
        );
      })}
    </Box>
  );
}
