export type InvoiceGstMode = "intra" | "inter";

export type InvoiceTotalsSummary = {
  subTotal: number;
  additionalCharges: number;
  taxableAmount: number;
  gstLines: ReadonlyArray<{ label: string; value: number }>;
  total: number;
};

function formatGstPercent(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "";
  const rounded = Math.round(value * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

function withPercentLabel(base: string, percent: number): string {
  const formatted = formatGstPercent(percent);
  return formatted ? `${base} (${formatted}%)` : base;
}

/**
 * Invoice totals order:
 * Sub Total → Additional Charges → Taxable Amount → GST (C/S or I) → Total
 *
 * GST amounts come from line items; % labels are derived from item sub total.
 */
export function buildInvoiceTotalsSummary(input: {
  itemSubTotal: number;
  additionalCharges: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstMode: InvoiceGstMode;
}): InvoiceTotalsSummary {
  const subTotal = Number(input.itemSubTotal) || 0;
  const additionalCharges = Number(input.additionalCharges) || 0;
  const cgst = Number(input.cgst) || 0;
  const sgst = Number(input.sgst) || 0;
  const igst = Number(input.igst) || 0;

  const taxableAmount = subTotal + additionalCharges;
  const gstAmount = cgst + sgst + igst;
  const total = taxableAmount + gstAmount;
  const effectiveRate =
    subTotal > 0 ? (gstAmount / subTotal) * 100 : 0;

  const gstLines =
    input.gstMode === "intra"
      ? [
          {
            label: withPercentLabel("CGST", effectiveRate / 2),
            value: cgst,
          },
          {
            label: withPercentLabel("SGST", effectiveRate / 2),
            value: sgst,
          },
        ]
      : [
          {
            label: withPercentLabel("IGST", effectiveRate),
            value: igst,
          },
        ];

  return {
    subTotal,
    additionalCharges,
    taxableAmount,
    gstLines,
    total,
  };
}
