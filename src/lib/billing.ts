import { aggregateBilling } from "./postType";

export interface MonthCharge {
  /** Full 15-second blocks delivered in the month. */
  blocks: number;
  /** Seconds left over after the last full block. */
  leftoverSeconds: number;
  pricePerBlock: number;
  /** blocks x pricePerBlock */
  blocksAmount: number;
  /** leftoverSeconds / 15 x pricePerBlock, to 2 decimals. */
  leftoverAmount: number;
  total: number;
}

/** Money rounded to 2 decimals (half up), so totals never carry float noise. */
export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * What a company owes for one month.
 *
 * Full blocks bill at the company's rate. The leftover seconds bill as a
 * fraction of that same rate — at 250 per 15s block, 7 leftover seconds is
 * 7/15 x 250 = 116.67.
 */
export function calculateMonthCharge(totalSeconds: number, pricePerBlock: number): MonthCharge {
  const { blocks, leftover } = aggregateBilling(totalSeconds);
  const rate = Number.isFinite(pricePerBlock) ? pricePerBlock : 0;

  const blocksAmount = round2(blocks * rate);
  const leftoverAmount = round2((leftover / 15) * rate);

  return {
    blocks,
    leftoverSeconds: leftover,
    pricePerBlock: rate,
    blocksAmount,
    leftoverAmount,
    total: round2(blocksAmount + leftoverAmount),
  };
}

/** Plain 2-decimal display, e.g. 2366.67. Currency-agnostic on purpose. */
export function formatAmount(value: number): string {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
