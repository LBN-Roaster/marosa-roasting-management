/** Roasteries are in Vietnam; server rendering and the browser must agree on the clock. */
export const roasteryTimeZone = "Asia/Ho_Chi_Minh";

/** Today's date in the roastery, as YYYY-MM-DD. */
export function roasteryToday() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: roasteryTimeZone }).format(new Date());
}

/** "14:05" for today, otherwise the date and time, in roastery time. */
export function formatWhen(value: string, locale: string) {
  const date = new Date(value);
  const day = (moment: Date) => new Intl.DateTimeFormat("en-CA", { timeZone: roasteryTimeZone }).format(moment);
  const options: Intl.DateTimeFormatOptions =
    day(date) === day(new Date()) ? { timeStyle: "short" } : { dateStyle: "medium", timeStyle: "short" };
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: roasteryTimeZone }).format(date);
}
