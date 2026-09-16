import { useState } from "react";
import {
  Box,
  Step,
  StepButton,
  Stepper,
  Stack,
  Typography,
} from "@mui/material";

import { NavigationShowcaseCard } from "./NavigationShowcaseCard";
import { NavigationTokenBadge } from "./NavigationTokenBadge";

const navigationTokens = [
  {
    title: "Sidebar",
    token: "theme.navigation.sidebar",
    description: "Module rail, active item treatment, nested indentation, and collapsed behavior.",
  },
  {
    title: "Tabs",
    token: "theme.navigation.tabs",
    description: "Section tabs, indicator styling, hover treatment, and disabled states.",
  },
  {
    title: "Breadcrumb",
    token: "theme.navigation.breadcrumb",
    description: "Path hierarchy, separator treatment, collapsed trail behavior, and links.",
  },
  {
    title: "Pagination",
    token: "theme.navigation.pagination",
    description: "Page controls, rows-per-page selector, current page styles, and disabled edges.",
  },
  {
    title: "Stepper",
    token: "theme.navigation.stepper",
    description: "Workflow step states for approval, production, and quality progressions.",
  },
  {
    title: "Header",
    token: "theme.navigation.header",
    description: "Page-level title framing, subtitle spacing, breadcrumb placement, and actions.",
  },
] as const;

const workflowSteps = ["Procurement", "Inspection", "Grading", "Stock"] as const;

export function DeveloperNotesShowcase() {
  const [activeStep, setActiveStep] = useState(1);

  return (
    <NavigationShowcaseCard
      title="Developer Notes"
      description="Navigation tokens and supporting guidance for consistent implementation across future ERP modules."
      token="theme.navigation.reference"
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(3),
        })}
      >
        <Box
          sx={(theme) => ({
            display: "grid",
            gap: theme.spacing(2),
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
          })}
        >
          {navigationTokens.map((item) => (
            <Box
              key={item.token}
              sx={(theme) => ({
                border: `1px solid ${theme.customTokens.borders.light}`,
                borderRadius: `${theme.customTokens.radius.md}px`,
                backgroundColor: theme.customTokens.surfaces.alt,
                p: theme.spacing(2),
              })}
            >
              <Stack
                sx={(theme) => ({
                  gap: theme.spacing(1),
                })}
              >
                <Typography variant="subtitle1" color="text.primary">
                  {item.title}
                </Typography>

                <NavigationTokenBadge token={item.token} />

                <Typography variant="body2" color="text.secondary">
                  {item.description}
                </Typography>
              </Stack>
            </Box>
          ))}
        </Box>

        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.light}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.surfaces.alt,
            p: theme.spacing(2.5),
          })}
        >
          <Stack
            sx={(theme) => ({
              gap: theme.spacing(2),
            })}
          >
            <Stack
              sx={(theme) => ({
                gap: theme.spacing(0.5),
              })}
            >
              <Typography variant="subtitle1" color="text.primary">
                Workflow Stepper
              </Typography>

              <NavigationTokenBadge token="theme.navigation.stepper" />
            </Stack>

            <Stepper
              activeStep={activeStep}
              alternativeLabel
              sx={(theme) => ({
                "& .MuiStepConnector-line": {
                  borderColor: theme.customTokens.borders.default,
                },
                "& .MuiStepIcon-root": {
                  color: theme.customTokens.borders.strong,
                },
                "& .MuiStepIcon-root.Mui-active": {
                  color: theme.customTokens.brand.primary,
                },
                "& .MuiStepIcon-root.Mui-completed": {
                  color: theme.customTokens.brand.secondary,
                },
                "& .MuiStepLabel-label": {
                  color: theme.customTokens.text.secondary,
                  fontSize: theme.typography.caption.fontSize,
                  fontWeight: 600,
                },
                "& .MuiStepLabel-label.Mui-active": {
                  color: theme.customTokens.navigation.activeText,
                },
              })}
            >
              {workflowSteps.map((step, index) => (
                <Step key={step} completed={index < activeStep}>
                  <StepButton color="inherit" onClick={() => setActiveStep(index)}>
                    {step}
                  </StepButton>
                </Step>
              ))}
            </Stepper>
          </Stack>
        </Box>
      </Stack>
    </NavigationShowcaseCard>
  );
}
