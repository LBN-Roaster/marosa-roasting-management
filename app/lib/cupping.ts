export const cuppingProtocols = [
  "ARABICA",
  "ROBUSTA",
  "CUP_OF_EXCELLENCE",
  "SCA_CVA_DESCRIPTIVE",
  "SCA_CVA_AFFECTIVE",
  "SCA_CVA_COMBINED",
] as const;
export type CuppingProtocol = (typeof cuppingProtocols)[number];

export const sampleIdStructures = ["NUMBERS", "THREE_DIGIT", "LETTERS"] as const;
export type SampleIdStructure = (typeof sampleIdStructures)[number];

export const cuppingStatuses = [
  "DRAFT",
  "READY",
  "IN_PROGRESS",
  "COMPLETED",
] as const;
export type CuppingSessionStatus = (typeof cuppingStatuses)[number];

export const defaultCupsPerSample = 5;

export type Member = {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
};

/** Row shape returned by `GET /api/cupping-sessions`. */
export type CuppingSessionSummary = {
  id: string;
  reference: number;
  owner: Member;
  name: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
  protocol: CuppingProtocol;
  blind: boolean;
  comboCupping: boolean;
  sampleCount: number;
  scoredCount: number;
};

export type CuppingSample = { id: string; ordinal: number; label: string };
export type CuppingGuest = { id: string; name: string; email: string };

/** Shape returned by `GET /api/cupping-sessions/{id}`. */
export type CuppingSessionDetail = {
  id: string;
  reference: number;
  owner: Member;
  name: string;
  description: string | null;
  protocol: CuppingProtocol;
  comboCupping: boolean;
  sampleWeight: number | null;
  cupsPerSample: number;
  customCups: boolean;
  blind: boolean;
  sampleIdStructure: SampleIdStructure;
  startsAt: string;
  endsAt: string;
  location: string | null;
  samples: CuppingSample[];
  cuppers: Member[];
  guests: CuppingGuest[];
  scoredCount: number;
};

/**
 * What the create/edit form edits. Times are local wall-time
 * (`YYYY-MM-DDTHH:mm`) because that is what the date and time inputs speak;
 * they are converted to offset timestamps on the way to the API.
 */
export type CuppingSessionDraft = {
  name: string;
  description: string;
  protocol: CuppingProtocol;
  comboCupping: boolean;
  sampleWeight: number | null;
  sampleCount: number;
  cupsPerSample: number;
  customCups: boolean;
  blind: boolean;
  sampleIdStructure: SampleIdStructure;
  scheduledAt: string;
  startNow: boolean;
  endsAt: string;
  location: string;
  cupperIds: string[];
  guests: CuppingGuest[];
};

// Status is derived from the sample counts rather than stored, so the counts
// stay the single source of truth for what a session can do next.
export function cuppingSessionStatus(session: {
  sampleCount: number;
  scoredCount: number;
}): CuppingSessionStatus {
  if (!session.sampleCount) return "DRAFT";
  if (!session.scoredCount) return "READY";
  return session.scoredCount < session.sampleCount ? "IN_PROGRESS" : "COMPLETED";
}

export function toLocalInputValue(date: Date) {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function splitLocalValue(value: string) {
  const [date = "", time = ""] = value.split("T");
  return { date, time };
}

export function joinLocalValue(date: string, time: string) {
  if (!date) return "";
  return `${date}T${time || "00:00"}`;
}

/** Local wall-time from the form → an absolute timestamp the API accepts. */
export function localToIso(local: string) {
  return new Date(local).toISOString();
}

/** An absolute timestamp from the API → local wall-time for the inputs. */
export function isoToLocalInput(iso: string) {
  return toLocalInputValue(new Date(iso));
}

export function addDays(value: string, days: number) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  date.setDate(date.getDate() + days);
  return toLocalInputValue(date);
}

export function defaultSessionName(date: Date) {
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-US", { month: "short" });
  return `Cupping Session ${day}-${month}-${date.getFullYear()}`;
}

/** Sample labels for the chosen ID structure, e.g. `1, 2, 3` or `A, B, C`. */
export function sampleIdPreview(structure: SampleIdStructure, count: number) {
  return Array.from({ length: Math.min(Math.max(count, 1), 3) }, (_, index) => {
    if (structure === "LETTERS") return String.fromCharCode(65 + index);
    if (structure === "THREE_DIGIT") return String(257 + index);
    return String(index + 1);
  }).join(", ");
}

export function emptyCuppingSession(now = new Date()): CuppingSessionDraft {
  const startsAt = toLocalInputValue(now);
  return {
    name: defaultSessionName(now),
    description: "",
    protocol: "ARABICA",
    comboCupping: false,
    sampleWeight: null,
    sampleCount: 1,
    cupsPerSample: defaultCupsPerSample,
    customCups: false,
    blind: false,
    sampleIdStructure: "NUMBERS",
    scheduledAt: startsAt,
    startNow: true,
    endsAt: addDays(startsAt, 7),
    location: "",
    cupperIds: [],
    guests: [],
  };
}

/** Turns a session fetched from the API back into an editable draft. */
export function draftFromSession(session: CuppingSessionDetail): CuppingSessionDraft {
  return {
    name: session.name,
    description: session.description ?? "",
    protocol: session.protocol,
    comboCupping: session.comboCupping,
    sampleWeight: session.sampleWeight,
    sampleCount: session.samples.length,
    cupsPerSample: session.cupsPerSample,
    customCups: session.customCups,
    blind: session.blind,
    sampleIdStructure: session.sampleIdStructure,
    scheduledAt: isoToLocalInput(session.startsAt),
    startNow: false,
    endsAt: isoToLocalInput(session.endsAt),
    location: session.location ?? "",
    cupperIds: session.cuppers.map((cupper) => cupper.id),
    guests: session.guests,
  };
}

/** Draft → the JSON body the API expects, converting times to absolute. */
export function payloadFromDraft(draft: CuppingSessionDraft) {
  return {
    name: draft.name,
    description: draft.description || null,
    protocol: draft.protocol,
    comboCupping: draft.comboCupping,
    sampleWeight: draft.sampleWeight,
    sampleCount: draft.sampleCount,
    cupsPerSample: draft.cupsPerSample,
    customCups: draft.customCups,
    blind: draft.blind,
    sampleIdStructure: draft.sampleIdStructure,
    startsAt: localToIso(draft.scheduledAt),
    endsAt: localToIso(draft.endsAt),
    location: draft.location || null,
    cupperIds: draft.cupperIds,
    guests: draft.guests.map(({ name, email }) => ({ name, email })),
  };
}
