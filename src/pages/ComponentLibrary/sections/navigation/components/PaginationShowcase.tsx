import { useMemo, useState } from "react";
import { ChevronRight, ChevronsRight } from "lucide-react";
import {
  Box,
  Button,
  FormControl,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { NavigationShowcaseCard } from "./NavigationShowcaseCard";
import { NavigationTokenBadge } from "./NavigationTokenBadge";

const rowsPerPageOptions = [10, 25, 50, 75, 100, 200] as const;
const totalRecords = 128;

export function PaginationShowcase() {
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<(typeof rowsPerPageOptions)[number]>(25);
  const [goToPage, setGoToPage] = useState("1");

  const pageCount = useMemo(
    () => Math.max(1, Math.ceil(totalRecords / rowsPerPage)),
    [rowsPerPage],
  );

  const start = (page - 1) * rowsPerPage + 1;
  const end = Math.min(page * rowsPerPage, totalRecords);

  const updatePage = (nextPage: number) => {
    const clamped = Math.min(Math.max(nextPage, 1), pageCount);
    setPage(clamped);
    setGoToPage(String(clamped));
  };

  return (
    <NavigationShowcaseCard
      title="ERP Pagination"
      description="Compact enterprise pagination for long-running transaction tables, masters, and approval lists."
      token="theme.navigation.pagination"
    >
      <Stack
        sx={(theme) => ({
          gap: theme.spacing(2),
        })}
      >
        <Box
          sx={(theme) => ({
            border: `1px solid ${theme.customTokens.borders.light}`,
            borderRadius: `${theme.customTokens.radius.md}px`,
            backgroundColor: theme.customTokens.surfaces.alt,
            p: theme.spacing(2),
          })}
        >
          <Box
            sx={(theme) => ({
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: theme.spacing(2),
              flexWrap: "wrap",
            })}
          >
            <Stack
              sx={(theme) => ({
                gap: theme.spacing(0.75),
              })}
            >
              <NavigationTokenBadge token="theme.navigation.pagination.summary" />

              <Typography variant="body2" color="text.secondary">
                Showing {start}-{end} of {totalRecords} records
              </Typography>
            </Stack>

            <Stack
              direction="row"
              sx={(theme) => ({
                alignItems: "flex-start",
                gap: theme.spacing(1.5),
                flexWrap: "wrap",
              })}
            >
              <Stack
                sx={(theme) => ({
                  gap: theme.spacing(0.75),
                })}
              >
                <NavigationTokenBadge token="theme.navigation.pagination.rowsPerPage" />

                <Stack
                  direction="row"
                  sx={(theme) => ({
                    alignItems: "center",
                    gap: theme.spacing(1),
                  })}
                >
                  <Typography variant="caption" color="text.secondary">
                    Rows Per Page
                  </Typography>

                  <FormControl size="small">
                    <Select
                      onChange={(event) => {
                        const nextRows = Number(event.target.value) as (typeof rowsPerPageOptions)[number];
                        setRowsPerPage(nextRows);
                        updatePage(1);
                      }}
                      value={rowsPerPage}
                      sx={(theme) => ({
                        minWidth: 88,
                        borderRadius: `${theme.customTokens.radius.md}px`,
                        backgroundColor: theme.customTokens.surfaces.surface,
                        "& .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.customTokens.borders.default,
                        },
                        "&:hover .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.customTokens.borders.hover,
                        },
                        "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                          borderColor: theme.customTokens.borders.focus,
                        },
                      })}
                    >
                      {rowsPerPageOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Stack>
              </Stack>

              <Stack
                sx={(theme) => ({
                  gap: theme.spacing(0.75),
                })}
              >
                <NavigationTokenBadge token="theme.navigation.pagination.controls" />

                <Stack
                  direction="row"
                  sx={(theme) => ({
                    alignItems: "center",
                    gap: theme.spacing(1),
                    flexWrap: "wrap",
                  })}
                >
                  <Button
                    disableElevation
                    disabled={page === 1}
                    onClick={() => updatePage(1)}
                    sx={(theme) => ({
                      minWidth: 0,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      color: theme.customTokens.navigation.activeText,
                      "&:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ChevronsRight
                        size={16}
                        style={{ transform: "rotate(180deg)" }}
                      />
                      <span>First</span>
                    </Stack>
                  </Button>

                  <Button
                    disableElevation
                    disabled={page === 1}
                    onClick={() => updatePage(page - 1)}
                    sx={(theme) => ({
                      minWidth: 0,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      color: theme.customTokens.navigation.activeText,
                      "&:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <ChevronRight
                        size={16}
                        style={{ transform: "rotate(180deg)" }}
                      />
                      <span>Previous</span>
                    </Stack>
                  </Button>

                  <Pagination
                    boundaryCount={1}
                    count={pageCount}
                    hideNextButton
                    hidePrevButton
                    onChange={(_, value) => updatePage(value)}
                    page={page}
                    shape="rounded"
                    siblingCount={1}
                    sx={(theme) => ({
                      "& .MuiPagination-ul": {
                        flexWrap: "nowrap",
                      },
                      "& .MuiPaginationItem-root": {
                        minWidth: 34,
                        height: 34,
                        borderRadius: `${theme.customTokens.radius.md}px`,
                        border: `1px solid ${theme.customTokens.borders.default}`,
                        color: theme.customTokens.text.secondary,
                        fontWeight: 600,
                      },
                      "& .MuiPaginationItem-root:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                      "& .MuiPaginationItem-root.Mui-selected": {
                        borderColor: theme.customTokens.brand.primary,
                        backgroundColor: theme.customTokens.brand.primary,
                        color: theme.customTokens.text.inverse,
                      },
                      "& .MuiPaginationItem-root.Mui-selected:hover": {
                        backgroundColor: theme.customTokens.brand.secondary,
                      },
                    })}
                  />

                  <Button
                    disableElevation
                    disabled={page === pageCount}
                    onClick={() => updatePage(page + 1)}
                    sx={(theme) => ({
                      minWidth: 0,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      color: theme.customTokens.navigation.activeText,
                      "&:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <span>Next</span>
                      <ChevronRight size={16} />
                    </Stack>
                  </Button>

                  <Button
                    disableElevation
                    disabled={page === pageCount}
                    onClick={() => updatePage(pageCount)}
                    sx={(theme) => ({
                      minWidth: 0,
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      color: theme.customTokens.navigation.activeText,
                      "&:hover": {
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    <Stack direction="row" alignItems="center" spacing={0.5}>
                      <span>Last</span>
                      <ChevronsRight size={16} />
                    </Stack>
                  </Button>
                </Stack>
              </Stack>

              <Stack
                sx={(theme) => ({
                  gap: theme.spacing(0.75),
                })}
              >
                <NavigationTokenBadge token="theme.navigation.pagination.goToPage" />

                <Stack
                  direction="row"
                  sx={(theme) => ({
                    alignItems: "center",
                    gap: theme.spacing(1),
                  })}
                >
                  <Typography variant="caption" color="text.secondary">
                    Go To Page
                  </Typography>

                  <TextField
                    onChange={(event) => setGoToPage(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        updatePage(Number(goToPage));
                      }
                    }}
                    size="small"
                    value={goToPage}
                    sx={(theme) => ({
                      width: 92,
                      "& .MuiOutlinedInput-root": {
                        borderRadius: `${theme.customTokens.radius.md}px`,
                        backgroundColor: theme.customTokens.surfaces.surface,
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.customTokens.borders.default,
                      },
                      "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.customTokens.borders.hover,
                      },
                      "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.customTokens.borders.focus,
                      },
                    })}
                  />

                  <Button
                    disableElevation
                    onClick={() => updatePage(Number(goToPage))}
                    sx={(theme) => ({
                      borderRadius: `${theme.customTokens.radius.md}px`,
                      border: `1px solid ${theme.customTokens.borders.default}`,
                      color: theme.customTokens.navigation.activeText,
                      "&:hover": {
                        borderColor: theme.customTokens.navigation.activeText,
                        backgroundColor: theme.customTokens.navigation.hoverBackground,
                      },
                    })}
                  >
                    Go
                  </Button>
                </Stack>
              </Stack>

              <Stack
                sx={(theme) => ({
                  gap: theme.spacing(0.75),
                })}
              >
                <NavigationTokenBadge token="theme.navigation.pagination.status" />

                <Typography variant="caption" color="text.secondary">
                  Page {page} of {pageCount}
                </Typography>
              </Stack>
            </Stack>
          </Box>
        </Box>
      </Stack>
    </NavigationShowcaseCard>
  );
}
