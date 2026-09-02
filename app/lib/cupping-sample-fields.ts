/**
 * The sample sheet, described as data so the form is one loop rather than 46
 * hand-written inputs — and so a "customise fields" feature has something to
 * edit later. `sampleName`, `sampleType` and `species` are columns on the
 * sample row; everything else is stored in its `details` JSON.
 */
export type SampleFieldType =
  | "text"
  | "number"
  | "date"
  | "month"
  | "select"
  | "textarea";

export type SampleField = {
  key: string;
  type: SampleFieldType;
  /** Suffix shown inside the input, e.g. `gr`. */
  unit?: string;
  options?: string[];
  /** Filled in from the session rather than typed. */
  readOnly?: boolean;
  fullWidth?: boolean;
};

export const promotedSampleFields = ["sampleName", "sampleType", "species"] as const;
export type PromotedSampleField = (typeof promotedSampleFields)[number];

export const sampleTypeOptions = ["Offer", "Sample", "Purchase", "Production"];
export const speciesOptions = ["Arabica", "Robusta", "Liberica", "Excelsa"];

export function cropYearOptions(now = new Date()) {
  const current = now.getFullYear();
  return Array.from({ length: 8 }, (_, index) => String(current - index));
}

export const sampleFields: SampleField[] = [
  { key: "sampleName", type: "text" },
  { key: "country", type: "text" },
  { key: "sampleType", type: "select", options: sampleTypeOptions },
  { key: "sampleGrade", type: "text" },

  { key: "purchaseGrade", type: "text" },
  { key: "saleGrade", type: "text" },
  { key: "producerName", type: "text" },
  { key: "supplier", type: "text" },

  { key: "certification", type: "text" },
  { key: "purchaseContract", type: "text" },
  { key: "buyerNumber", type: "text" },
  { key: "salesContract", type: "text" },

  { key: "strategy", type: "text" },
  { key: "customer", type: "text" },
  { key: "customerCode", type: "text" },
  { key: "receivedOn", type: "date" },

  { key: "dateOfDispatch", type: "date" },
  { key: "dateOfArrival", type: "date" },
  { key: "dateOfResults", type: "date" },
  { key: "harvest", type: "text" },

  { key: "externalIdentification", type: "text" },
  { key: "referenceNumber", type: "text" },
  { key: "sampleReference", type: "text" },
  { key: "species", type: "select", options: speciesOptions },

  { key: "varietals", type: "text" },
  { key: "coffeeProcessing", type: "text" },
  { key: "preferredProtocol", type: "text", readOnly: true },
  { key: "receivedWeight", type: "number", unit: "gr" },

  { key: "availableWeight", type: "number", unit: "gr" },
  { key: "cropYear", type: "select", options: cropYearOptions() },
  { key: "numberOfBags", type: "number" },
  { key: "bagWeight", type: "number", unit: "kg" },

  { key: "warehouse", type: "text" },
  { key: "sampleLocation", type: "text" },
  { key: "shipmentMonth", type: "month" },
  { key: "cargoSeal", type: "text" },

  { key: "density", type: "number", unit: "g/L" },
  { key: "moisture", type: "number", unit: "%" },
  { key: "waterActivity", type: "number" },
  { key: "temperature", type: "number" },

  { key: "mass", type: "number", unit: "gr" },
  { key: "volume", type: "number", unit: "mL" },
  { key: "containerNumber", type: "text" },
  { key: "lotNumber", type: "text" },

  { key: "courier", type: "text" },
  { key: "trackingNumber", type: "text" },

  { key: "notesAndRemarks", type: "textarea", fullWidth: true },
  { key: "description", type: "textarea", fullWidth: true },
];

export function isPromoted(key: string): key is PromotedSampleField {
  return (promotedSampleFields as readonly string[]).includes(key);
}
