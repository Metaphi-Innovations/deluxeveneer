import React from "react";
import { Chip } from "@mui/material";

const ORDER_STATUS_COLORS: Record<
  string,
  { bg: string; color: string; border: string }
> = {
  // Pending
  pending: { bg: "#fff8e1", color: "#b78103", border: "#ffe082" },
  // Draft
  draft: { bg: "#ede7f6", color: "#512da8", border: "#d1c4e9" },
  // Confirmed
  confirmed: { bg: "#e3f2fd", color: "#1565c0", border: "#90caf9" },
  // In Production / Processing
  "in production": { bg: "#fff3e0", color: "#e65100", border: "#ffb74d" },
  processing: { bg: "#fff3e0", color: "#e65100", border: "#ffb74d" },
  // Packed
  packed: { bg: "#e0f7fa", color: "#00838f", border: "#80deea" },
  // Dispatched / Partially Dispatched
  "partially dispatched": { bg: "#fce4ec", color: "#c2185b", border: "#f48fb1" },
  dispatched: { bg: "#e8f5e9", color: "#2e7d32", border: "#a5d6a7" },
  // Completed / Delivered
  completed: { bg: "#e8f5e9", color: "#1b5e20", border: "#81c784" },
  delivered: { bg: "#e8f5e9", color: "#1b5e20", border: "#81c784" },
  // Cancelled / Rejected
  cancelled: { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
  rejected: { bg: "#ffebee", color: "#c62828", border: "#ef9a9a" },
};

export function OrderStatusChip({ status }: { status: string }) {
  const normalized = String(status || "").trim().toLowerCase();
  const palette = ORDER_STATUS_COLORS[normalized] ?? {
    bg: "#f3f4f6",
    color: "#374151",
    border: "#d1d5db",
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
