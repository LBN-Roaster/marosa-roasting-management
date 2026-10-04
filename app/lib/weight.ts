/**
 * Roast weights are stored in grams, as the roasting app records them, and
 * shown in kilograms. Conversion happens only at the edges of the UI.
 */

/** Three decimals keeps a 0.4 kg roaster's 296.1 g readable as 0.296 kg. */
const KG_FRACTION_DIGITS = 3;

export function gramsToKg(grams: number) {
  return grams / 1000;
}

/** The number of kg, "1,2" (vi) / "1.2" (en), without the unit: labels carry "(kg)". Null when there is no weight. */
export function formatKg(grams: number | null | undefined, locale: string, maximumFractionDigits = KG_FRACTION_DIGITS) {
  if (grams == null) return null;
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits }).format(gramsToKg(Number(grams)))}`;
}

/** "1,2 → 1,02 kg" for a roast's weight in and out; "?" for a missing weight out. */
export function formatWeightInOut(weightIn: number | null, weightOut: number | null, locale: string) {
  if (weightIn == null) return null;
  const number = (grams: number) =>
    new Intl.NumberFormat(locale, { maximumFractionDigits: KG_FRACTION_DIGITS }).format(gramsToKg(Number(grams)));
  return `${number(weightIn)} → ${weightOut == null ? "?" : number(weightOut)} kg`;
}

/**
 * The value for a kg input field. Four decimals keep every 0.1 g, so saving a
 * roast without touching its weights never changes them (296.1 g → 0.2961 kg).
 */
export function gramsToKgInput(grams: number | null | undefined) {
  if (grams == null) return "";
  return String(Number(gramsToKg(Number(grams)).toFixed(4)));
}

/** Back to grams for saving; rounded to 0.1 g so 0.296 kg does not become 295.99999 g. */
export function kgInputToGrams(value: string) {
  if (value.trim() === "") return null;
  const kg = Number(value);
  return Number.isFinite(kg) ? Math.round(kg * 10000) / 10 : null;
}
