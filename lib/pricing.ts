export type PricedItem = {
  qty: number;
  unit_price_cents: number;
};

/**
 * Quote/invoice math. Money stays in integer cents; tax rounds half-up
 * per line total (standard practice for small-business invoicing).
 */
export function computeTotals(
  items: PricedItem[],
  discountCents: number,
  taxRate: number,
) {
  const subtotal = items.reduce(
    (sum, i) => sum + Math.round(i.qty * i.unit_price_cents),
    0,
  );
  const discount = Math.min(Math.max(0, discountCents), subtotal);
  const taxable = subtotal - discount;
  const tax = Math.round(taxable * taxRate);
  return { subtotal, discount, tax, total: taxable + tax };
}

/** Next document number for a company, e.g. Q-0007. */
export function nextNumber(prefix: string, count: number): string {
  return `${prefix}-${String(count + 1).padStart(4, "0")}`;
}
