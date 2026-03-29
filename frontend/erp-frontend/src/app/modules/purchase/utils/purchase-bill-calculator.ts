/**
 * Matches assignment: Total Cost = (Cost × Qty) − Discount% (as percent of line cost),
 * Total Selling = Price × Qty.
 */
export interface LineLike {
  cost: number;
  price: number;
  quantity: number;
  discountPercent: number;
}

export function lineTotalCost(l: LineLike): number {
  const c = Number(l.cost) || 0;
  const q = Number(l.quantity) || 0;
  const d = Number(l.discountPercent) || 0;
  return c * q * (1 - d / 100);
}

export function lineTotalSelling(l: LineLike): number {
  const p = Number(l.price) || 0;
  const q = Number(l.quantity) || 0;
  return p * q;
}

export interface BillSummaryTotals {
  lineCount: number;
  totalQty: number;
  totalSelling: number;
  totalCost: number;
}

export function summarizeLines(lines: LineLike[]): BillSummaryTotals {
  let totalQty = 0;
  let totalSelling = 0;
  let totalCost = 0;
  for (const l of lines) {
    const q = Number(l.quantity) || 0;
    totalQty += q;
    totalSelling += lineTotalSelling(l);
    totalCost += lineTotalCost(l);
  }
  return {
    lineCount: lines.length,
    totalQty,
    totalSelling,
    totalCost,
  };
}
