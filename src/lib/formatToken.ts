/** Format integer token amount (bigint smallest units) for display. */
export function formatTokenAmount(amount: bigint, decimals: number, maxFractionDigits = 6): string {
  if (decimals < 0 || decimals > 36) return "0";
  const base = 10n ** BigInt(decimals);
  const neg = amount < 0n;
  const v = neg ? -amount : amount;
  const whole = v / base;
  const frac = v % base;
  if (frac === 0n) return `${neg ? "-" : ""}${whole.toString()}`;
  const fracStr = frac.toString().padStart(decimals, "0").replace(/0+$/, "");
  const n = Number(`${whole.toString()}.${fracStr}`);
  const out = (neg ? -n : n).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: maxFractionDigits,
  });
  return out;
}
