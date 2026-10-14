import React from "react";
import { Chip } from "@mui/material";

const ORDER_STATUS_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  Draft: { bg: "#e8eaf6", color: "#283593", border: "#9fa8da" },
  Confirmed: { bg: "#e3f2fd", color: "#0d47a1", border: "#90caf9" },
  "In Production": { bg: "#fff3e0", color: "#e65100", border: "#ffcc80" },
  "Partially Dispatched": {
    bg: "#fce4ec",
    color: "#880e4f",
    border: "#f48fb1",
  },
  Completed: { bg: "#e8f5e9", color: "#1b5e20", border: "#a5d6a7" },
  Cancelled: { bg: "#fafafa", color: "#616161", border: "#bdbdbd" },
};

export function OrderStatusChip({ status }: { status: string }) {
  const palette = ORDER_STATUS_COLORS[status] ?? {
    bg: "#f5f5f5",
    color: "#333",
    border: "#ccc",
  };

  return (
    <Chip
      label={status || "—"}
      size="small"
      sx={{
        backgroundColor: palette.bg,
        border: `1px solid ${palette.border}`,
        borderRadius: "999px",
        color: palette.color,
        fontWeight: 600,
        fontSize: "0.72rem",
        height: 22,
        letterSpacing: "0.02em",
      }}
    />
  );
}
