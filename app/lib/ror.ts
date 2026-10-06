/** How many points the rate-of-rise line is averaged over on roast charts. */
export const ROR_SMOOTHING_WINDOW = 10;

/**
 * Centered moving average of a series over `window` points: for an even window,
 * half before and the rest after (5 + this + 4 for 10). Centered rather than
 * trailing because a finished roast is shown, so the curve does not lag behind
 * the temperatures. Points with no value stay empty, so the line still starts at
 * the turning point; at the ends the window shrinks to the points available.
 */
export function smoothSeries(values: (number | null)[], window = ROR_SMOOTHING_WINDOW): (number | null)[] {
  if (window <= 1) return values;
  const before = Math.floor(window / 2);
  const after = window - before - 1;
  return values.map((value, index) => {
    if (value == null || !Number.isFinite(value)) return value;
    let sum = 0;
    let count = 0;
    for (let at = Math.max(0, index - before); at <= Math.min(values.length - 1, index + after); at += 1) {
      const neighbour = values[at];
      if (neighbour != null && Number.isFinite(neighbour)) {
        sum += neighbour;
        count += 1;
      }
    }
    return sum / count;
  });
}
