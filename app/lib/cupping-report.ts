import type { CuppingSampleResult, CuppingScore } from "~/lib/backend.server";
import { sampleFields } from "~/lib/cupping-sample-fields";

/**
 * Fields the sample sheet holds that the report never offers: the sample name
 * heads the report already, the protocol is printed above it, and the rest are
 * internal purchasing columns rather than cupping context.
 */
const excludedFromReport = new Set([
  "sampleName",
  "preferredProtocol",
  "purchaseContract",
  "buyerNumber",
  "receivedWeight",
  "availableWeight",
]);

/**
 * Two attributes the report can print that are not stored on the sample sheet:
 * the sample's own label, and the date the session started.
 */
export const derivedReportAttributes = ["sampleId", "cuppingDate"] as const;
export type DerivedReportAttribute = (typeof derivedReportAttributes)[number];

/** Every attribute the picker can offer, in the sheet's own order. */
export const reportAttributes: string[] = [
  ...derivedReportAttributes,
  ...sampleFields.map((field) => field.key).filter((key) => !excludedFromReport.has(key)),
];

const reportAttributeSet = new Set(reportAttributes);

export function isDerived(key: string): key is DerivedReportAttribute {
  return (derivedReportAttributes as readonly string[]).includes(key);
}

/**
 * Attribute labels come from the sample sheet's own translations, so the
 * picker and the report always read the same as the form they came from.
 */
export function attributeLabelKey(key: string) {
  return isDerived(key) ? `report.attributes.${key}` : `sampleFields.${key}`;
}

/**
 * The report link carries its own field list, so a shared or reloaded report
 * shows exactly what was picked. Unknown keys are dropped, and the order always
 * follows the sheet rather than the query string.
 */
export function parseReportFields(search: string | URLSearchParams): string[] {
  const params = typeof search === "string" ? new URLSearchParams(search) : search;
  const raw = params.get("fields");
  if (raw == null) return reportAttributes;
  const picked = new Set(raw.split(",").filter((key) => reportAttributeSet.has(key)));
  return reportAttributes.filter((key) => picked.has(key));
}

export function serializeReportFields(fields: string[]) {
  return reportAttributes.filter((key) => fields.includes(key)).join(",");
}

/** The sample sheet flattened to the strings the report prints. */
export function reportValues(sample: CuppingSampleResult, startsAt: string, locale: string) {
  return {
    sampleId: sample.label,
    cuppingDate: new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(new Date(startsAt)),
    sampleType: sample.sampleType ?? "",
    species: sample.species ?? "",
    ...sample.details,
  } as Record<string, string | undefined>;
}

/** The seven ten-point attributes the radar chart plots. */
export const radarAttributes = [
  { key: "fragranceScore", labelKey: "cup.attributes.FRAGRANCE" },
  { key: "flavorScore", labelKey: "cup.attributes.FLAVOR" },
  { key: "acidityScore", labelKey: "cup.attributes.ACIDITY" },
  { key: "bodyScore", labelKey: "cup.attributes.BODY" },
  { key: "aftertasteScore", labelKey: "cup.attributes.AFTERTASTE" },
  { key: "balanceScore", labelKey: "cup.attributes.BALANCE" },
  { key: "overallScore", labelKey: "cup.overall" },
] as const;

/**
 * The score table's columns, abbreviated the way a printed cupping form does
 * it. The legend under the table spells each one out.
 */
export const scoreColumns = [
  { abbr: "FA", labelKey: "cup.attributes.FRAGRANCE", value: (score: CuppingScore) => score.fragranceScore },
  { abbr: "AC", labelKey: "cup.attributes.ACIDITY", value: (score: CuppingScore) => score.acidityScore },
  { abbr: "BD", labelKey: "cup.attributes.BODY", value: (score: CuppingScore) => score.bodyScore },
  { abbr: "FL", labelKey: "cup.attributes.FLAVOR", value: (score: CuppingScore) => score.flavorScore },
  { abbr: "AF", labelKey: "cup.attributes.AFTERTASTE", value: (score: CuppingScore) => score.aftertasteScore },
  { abbr: "BA", labelKey: "cup.attributes.BALANCE", value: (score: CuppingScore) => score.balanceScore },
  { abbr: "OV", labelKey: "cup.overall", value: (score: CuppingScore) => score.overallScore },
  { abbr: "UN", labelKey: "cup.uniformity", value: (score: CuppingScore) => score.uniformityCups * 2 },
  { abbr: "CL", labelKey: "cup.cleanCup", value: (score: CuppingScore) => score.cleanCupCups * 2 },
  { abbr: "SW", labelKey: "cup.sweetness", value: (score: CuppingScore) => score.sweetnessCups * 2 },
  { abbr: "DE", labelKey: "cup.attributes.DEFECTS", value: (score: CuppingScore) => score.defectCups * score.defectIntensity },
  { abbr: "TS", labelKey: "report.totalScore", value: (score: CuppingScore) => score.totalScore },
] as const;

/** Trailing zeroes read as noise on a score sheet: 7.50 prints as 7.5. */
export function formatScore(value: number | null | undefined) {
  if (value == null) return "-";
  return Number(value).toFixed(2).replace(/\.?0+$/, "");
}

export function averageOf(values: number[]) {
  if (!values.length) return null;
  return values.reduce((total, value) => total + Number(value), 0) / values.length;
}
