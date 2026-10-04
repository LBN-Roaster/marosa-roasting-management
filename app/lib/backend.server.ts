import { redirect } from "react-router";
import {
  authBypassEnabled,
  getAuthSession,
  getSessionOrganizationId,
} from "~/lib/auth.server";

export type RoastUploadStatus =
  | "PENDING"
  | "UPLOADED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

/** A controller kit (Raspberry Pi + roasting app) as LBN admins see it. */
export type AdminController = {
  id: string;
  serialNumber: string;
  organizationId: string | null;
  organizationName: string | null;
  roasterId: string | null;
  roasterName: string | null;
  lastUploadAt: string | null;
  createdAt: string;
};

/** One upload from a controller. */
export type RoastUploadLog = {
  uploadId: string;
  roastId: string | null;
  filename: string;
  contentLength: number;
  roastedAt: string;
  uploadedAt: string | null;
  processedAt: string | null;
  status: RoastUploadStatus;
  errorCode: string | null;
  errorMessage: string | null;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
};

export type PageParams = {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "asc" | "desc";
  status?: string;
};

export type AdminControllerDetail = {
  controller: AdminController;
  logs: PageResponse<RoastUploadLog>;
};

export type ControllerApiKeyCreated = {
  keyId: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
};

export type ControllerApiKeySummary = {
  keyId: string;
  keyPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
};

export type CuppingProtocol =
  | "ARABICA"
  | "ROBUSTA"
  | "CUP_OF_EXCELLENCE"
  | "SCA_CVA_DESCRIPTIVE"
  | "SCA_CVA_AFFECTIVE"
  | "SCA_CVA_COMBINED";

export type SampleIdStructure = "NUMBERS" | "THREE_DIGIT" | "LETTERS";

export type Member = {
  id: string;
  name: string | null;
  email: string;
  picture: string | null;
};

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
  samples: { id: string; ordinal: number; label: string }[];
  cuppers: Member[];
  guests: { id: string; name: string; email: string }[];
  scoredCount: number;
};

/** Body accepted by POST and PUT /api/cupping-sessions. */
export type CuppingSessionPayload = {
  name: string;
  description: string | null;
  protocol: CuppingProtocol;
  comboCupping: boolean;
  sampleWeight: number | null;
  sampleCount: number;
  cupsPerSample: number;
  customCups: boolean;
  blind: boolean;
  sampleIdStructure: SampleIdStructure;
  startsAt: string;
  endsAt: string;
  location: string | null;
  cupperIds: string[];
  guests: { name: string; email: string }[];
};

export type RoastLevel = "LIGHT" | "MID_LIGHT" | "MEDIUM" | "MID_DARK" | "DARK";
export type CuppingScoreStatus = "DRAFT" | "SUBMITTED";
export type DescriptorAttribute =
  | "FRAGRANCE"
  | "FLAVOR"
  | "AFTERTASTE"
  | "ACIDITY"
  | "BODY"
  | "BALANCE"
  | "DEFECTS";

export type CuppingSampleDetail = {
  id: string;
  ordinal: number;
  label: string;
  sampleName: string | null;
  sampleType: string | null;
  species: string | null;
  details: Record<string, string>;
  /** The library coffee this slot cups, when one was picked. */
  sampleId: string | null;
  sampleLibraryName: string | null;
  sampleTag: string | null;
};

export type CuppingSamplePayload = {
  /** Null clears the link; the fields below are then the slot's own identity. */
  sampleId: string | null;
  sampleName: string | null;
  sampleType: string | null;
  species: string | null;
  details: Record<string, string>;
};

/** A coffee in the library, reusable across sessions and roast logs. */
export type LibrarySample = {
  id: string;
  /** The code printed on the bag, e.g. S-260902-142. */
  tag: string;
  taggedOn: string;
  name: string;
  sampleType: string | null;
  species: string | null;
  details: Record<string, string>;
};

export type LibrarySamplePayload = {
  name: string;
  /** The date the tag stands for; omit to use today. */
  taggedOn?: string | null;
  sampleType: string | null;
  species: string | null;
  details: Record<string, string>;
};

export type CuppingScoreDescriptor = {
  attribute: DescriptorAttribute;
  descriptor: string;
};

export type CuppingScore = {
  id: string;
  sampleId: string;
  roastLevel: RoastLevel | null;
  fragranceDry: number;
  fragranceBreak: number;
  fragranceScore: number;
  acidityIntensity: number;
  acidityScore: number;
  bodyLevel: number;
  bodyScore: number;
  flavorScore: number;
  aftertasteScore: number;
  balanceScore: number;
  overallScore: number;
  uniformityCups: number;
  cleanCupCups: number;
  sweetnessCups: number;
  defectCups: number;
  defectIntensity: number;
  reroastRequested: boolean;
  quakerCount: number | null;
  notes: string | null;
  totalScore: number;
  status: CuppingScoreStatus;
  descriptors: CuppingScoreDescriptor[];
};

export type CuppingScorePayload = Omit<CuppingScore, "id" | "sampleId" | "totalScore">;

/** One cupper's submitted score on a sample, as the results view sees it. */
export type CuppingCupperScore = {
  scorer: Member | null;
  score: CuppingScore;
};

/** A sample plus every submitted score on it. */
export type CuppingSampleResult = {
  id: string;
  ordinal: number;
  label: string;
  sampleName: string | null;
  sampleType: string | null;
  species: string | null;
  details: Record<string, string>;
  averageScore: number | null;
  scores: CuppingCupperScore[];
};

export type AlogProfilePoint = {
  seconds: number;
  beanTemperature: number | null;
  environmentTemperature: number | null;
  rateOfRise: number | null;
  burner: number | null;
  air: number | null;
  drum: number | null;
};

export type AlogMilestone = {
  type: string;
  seconds: number;
  temperature: number | null;
};

/** Where a roast log came from: the kit that sent it and the roaster it was made on. */
export type RoastSource = {
  controllerId: string | null;
  controllerSerialNumber: string | null;
  roasterId: string | null;
  roasterName: string | null;
};

/** Just the curve: what a chart needs, and all a public roast page may show of the log. */
export type RoastCurve = {
  temperatureUnit: "°C" | "°F";
  points: AlogProfilePoint[];
  milestones: AlogMilestone[];
};

/** A shared roast as anyone with the link sees it; fields are null until it is READY. */
export type PublicRoast = {
  status: "PROCESSING" | "READY" | "UNAVAILABLE";
  beanName: string | null;
  roastedAt: string | null;
  roasterName: string | null;
  temperatureUnit: "°C" | "°F" | null;
  points: AlogProfilePoint[];
  milestones: AlogMilestone[];
};

/**
 * Reads a shared roast without signing in. Returns null for an unknown or
 * turned-off link. The visitor's address is passed on so the backend's rate
 * limit applies per visitor rather than to this server as a whole.
 */
export async function getPublicRoast(request: Request, token: string) {
  const visitor =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "";
  let response: Response;
  try {
    response = await fetch(`${backendOrigin()}/api/public/roasts/${encodeURIComponent(token)}`, {
      headers: visitor ? { "X-Forwarded-For": visitor } : {},
    });
  } catch {
    throw new Response("The backend service is unavailable.", { status: 503 });
  }
  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Response("The roast could not be loaded.", { status: response.status });
  }
  return (await response.json()) as PublicRoast;
}

export type RoastLogVisualization = {
  source: RoastSource;
  log: RoastUploadLog;
  title: string | null;
  beanName: string | null;
  temperatureUnit: "°C" | "°F";
  points: AlogProfilePoint[];
  milestones: AlogMilestone[];
  /** The library coffee this roast is linked to, once confirmed. */
  sample: LibrarySample | null;
  /** A match on the bean name the roaster typed, offered for confirmation. */
  suggestedSample: LibrarySample | null;
};

function backendOrigin() {
  return (process.env.BACKEND_API_URL ?? "http://localhost:8080").replace(
    /\/$/,
    "",
  );
}

export type OrganizationRole = "OWNER" | "MEMBER" | "SUPPORT";

/** An organization as the signed-in user sees it; role is null for an admin who is not a member. */
export type Organization = {
  id: string;
  name: string;
  slug: string;
  role: OrganizationRole | null;
  canManage: boolean;
};

export type OrganizationMember = {
  userId: string;
  email: string;
  name: string | null;
  picture: string | null;
  role: OrganizationRole;
  joinedAt: string;
};

export type OrganizationInvite = {
  id: string;
  email: string;
  role: OrganizationRole;
  invitedAt: string;
};

export type OrganizationMembers = {
  members: OrganizationMember[];
  invites: OrganizationInvite[];
};

export type AdminOrganization = {
  id: string;
  name: string;
  slug: string;
  memberCount: number;
  createdAt: string;
};

// Every loader in one navigation receives the same Request, so the organization
// is worked out once per navigation however many backend calls follow.
const resolvedOrganizations = new WeakMap<
  Request,
  Promise<{ organizations: Organization[]; active: Organization | null }>
>();

/**
 * The caller's organizations and the one they are working in: the one chosen
 * in this browser while it is still available to them, otherwise the first.
 */
export function resolveOrganizations(request: Request) {
  let pending = resolvedOrganizations.get(request);
  if (!pending) {
    pending = (async () => {
      const organizations = await backendRequest<Organization[]>(
        request,
        "/api/me/organizations",
        undefined,
        { scoped: false },
      );
      const chosen = await getSessionOrganizationId(request);
      const active =
        organizations.find((organization) => organization.id === chosen) ??
        organizations[0] ??
        null;
      return { organizations, active };
    })();
    resolvedOrganizations.set(request, pending);
  }
  return pending;
}

/**
 * The backend's own explanation of a failed call: Spring's `message`, or the
 * first line of its stack trace when the message is empty.
 */
async function backendErrorReason(response: Response) {
  const text = await response.text().catch(() => "");
  try {
    const body = JSON.parse(text) as { message?: string; error?: string; trace?: string };
    const message = body.message && body.message !== "No message available" ? body.message : null;
    const exception = body.trace?.split("\n")[0]?.trim();
    return [message, exception].filter(Boolean).join(" | ") || body.error || "";
  } catch {
    return text.slice(0, 300);
  }
}

function backendRequest<T>(
  request: Request,
  path: string,
  init?: RequestInit,
  options: { scoped?: boolean } = {},
): Promise<T> {
  const pending = sendBackendRequest<T>(request, path, init, options);
  // Some loaders hand this promise to the page un-awaited so it can stream in.
  // When the layout fails first (backend down, redirect to login) nothing ever
  // awaits it, and Node would crash the server on the unhandled rejection.
  // Callers that do await it still receive the error.
  pending.catch(() => {});
  return pending;
}

async function sendBackendRequest<T>(
  request: Request,
  path: string,
  init?: RequestInit,
  { scoped = true }: { scoped?: boolean } = {},
): Promise<T> {
  const session = await getAuthSession(request);
  const token = session.get("backendToken");
  // With the development bypass on there is no token to send; the backend is
  // running with its own bypass and supplies the stand-in user itself.
  const bypass = authBypassEnabled();
  if (!token && !bypass) throw redirect("/login");

  let organizationId: string | undefined;
  if (scoped) {
    const { active } = await resolveOrganizations(request);
    // Someone who belongs to no roastery yet has nothing to load; the
    // organization page explains how to get invited.
    if (!active) throw redirect("/organization");
    organizationId = active.id;
  }

  let response: Response;
  try {
    response = await fetch(`${backendOrigin()}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(organizationId ? { "X-Organization-Id": organizationId } : {}),
      },
    });
  } catch {
    throw new Response("The backend service is unavailable.", { status: 503 });
  }

  if (response.status === 401) {
    throw redirect("/login");
  }
  if (!response.ok) {
    // This terminal is the only place the backend's reason is visible, so say
    // which call failed and why before turning it into a generic error page.
    const reason = await backendErrorReason(response);
    console.error(
      `[backend] ${init?.method ?? "GET"} ${path} -> ${response.status}${reason ? `: ${reason}` : ""}`,
    );
    const summary =
      response.status === 403
        ? "Forbidden."
        : response.status === 404
          ? "Not found."
          : "The backend request failed.";
    throw new Response(reason ? `${summary} ${reason}` : summary, { status: response.status });
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

function backendJson<T>(request: Request, path: string): Promise<T> {
  return backendRequest<T>(request, path);
}

function pageQuery(params?: PageParams) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
  if (params?.sort) {
    search.set("sort", `${params.sort},${params.direction ?? "asc"}`);
  }
  if (params?.status) search.set("status", params.status);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getCurrentOrganization(request: Request) {
  return backendJson<Organization>(request, "/api/organization");
}

export function renameOrganization(request: Request, name: string) {
  return backendRequest<Organization>(request, "/api/organization", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export function getOrganizationMembers(request: Request) {
  return backendJson<OrganizationMembers>(request, "/api/organization/members");
}

export function inviteOrganizationMember(
  request: Request,
  email: string,
  role: OrganizationRole,
) {
  return backendRequest<OrganizationMembers>(request, "/api/organization/invites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, role }),
  });
}

export function cancelOrganizationInvite(request: Request, inviteId: string) {
  return backendRequest<OrganizationMembers>(
    request,
    `/api/organization/invites/${encodeURIComponent(inviteId)}`,
    { method: "DELETE" },
  );
}

export function changeOrganizationMemberRole(
  request: Request,
  userId: string,
  role: OrganizationRole,
) {
  return backendRequest<OrganizationMembers>(
    request,
    `/api/organization/members/${encodeURIComponent(userId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    },
  );
}

export function removeOrganizationMember(request: Request, userId: string) {
  return backendRequest<OrganizationMembers>(
    request,
    `/api/organization/members/${encodeURIComponent(userId)}`,
    { method: "DELETE" },
  );
}

export function getAdminOrganizations(request: Request) {
  return backendRequest<AdminOrganization[]>(
    request,
    "/api/admin/organizations",
    undefined,
    { scoped: false },
  );
}

export function createAdminOrganization(
  request: Request,
  payload: { name: string; slug: string; ownerEmail: string },
) {
  return backendRequest<AdminOrganization>(
    request,
    "/api/admin/organizations",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    { scoped: false },
  );
}

// Controller kits are LBN admin data, not organization data.
const unscoped = { scoped: false };

export function getAdminControllers(request: Request, params?: PageParams) {
  return backendRequest<PageResponse<AdminController>>(
    request,
    `/api/admin/controllers${pageQuery(params)}`,
    undefined,
    unscoped,
  );
}

export function getAdminController(
  request: Request,
  controllerId: string,
  params?: PageParams,
) {
  return backendRequest<AdminControllerDetail>(
    request,
    `/api/admin/controllers/${encodeURIComponent(controllerId)}${pageQuery(params)}`,
    undefined,
    unscoped,
  );
}

export function createAdminController(
  request: Request,
  payload: { serialNumber: string; organizationId: string | null },
) {
  return backendRequest<AdminController>(
    request,
    "/api/admin/controllers",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
    unscoped,
  );
}

/** Moves a kit to another roastery; null unlinks it. */
export function changeAdminControllerOrganization(
  request: Request,
  controllerId: string,
  organizationId: string | null,
) {
  return backendRequest<AdminController>(
    request,
    `/api/admin/controllers/${encodeURIComponent(controllerId)}/organization`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ organizationId }),
    },
    unscoped,
  );
}

export function issueControllerApiKey(request: Request, controllerId: string) {
  return backendRequest<ControllerApiKeyCreated>(
    request,
    `/api/admin/controllers/${encodeURIComponent(controllerId)}/api-keys`,
    { method: "POST" },
    unscoped,
  );
}

export function listControllerApiKeys(request: Request, controllerId: string) {
  return backendRequest<ControllerApiKeySummary[]>(
    request,
    `/api/admin/controllers/${encodeURIComponent(controllerId)}/api-keys`,
    undefined,
    unscoped,
  );
}

export function revokeControllerApiKey(
  request: Request,
  controllerId: string,
  keyId: string,
) {
  return backendRequest<void>(
    request,
    `/api/admin/controllers/${encodeURIComponent(controllerId)}/api-keys/${encodeURIComponent(keyId)}`,
    { method: "DELETE" },
    unscoped,
  );
}

export function getControllerLogVisualization(
  request: Request,
  controllerId: string,
  uploadId: string,
) {
  return backendRequest<RoastLogVisualization>(
    request,
    `/api/admin/controllers/${encodeURIComponent(controllerId)}/logs/${encodeURIComponent(uploadId)}`,
    undefined,
    unscoped,
  );
}

export type RoasterStatus = "ACTIVE" | "IDLE" | "OFFLINE" | "NO_CONTROLLER";

/** A roastery's physical roaster, of any brand, the kit fitted to it, and its recent activity. */
export type Roaster = {
  id: string;
  name: string;
  brand: string | null;
  model: string | null;
  capacityKg: number | null;
  location: string | null;
  notes: string | null;
  /** When on, the roasting app shares each roast publicly with a QR code. */
  shareRoastsPublicly: boolean;
  controller: { id: string; serialNumber: string } | null;
  status: RoasterStatus;
  /** The latest upload failed or has been stuck too long. */
  uploadProblem: boolean;
  lastRoastAt: string | null;
  /** When the fitted controller last reached the backend. */
  lastSeenAt: string | null;
  roastsToday: number;
  roastsThisWeek: number;
  createdAt: string;
};

/** Totals for one roaster over local days from..to; weights are as typed, without a unit. */
export type RoasterStats = {
  from: string;
  to: string;
  roastCount: number;
  totalChargeWeight: number | null;
  totalDropWeight: number | null;
  averageWeightLossPercent: number | null;
  averageDevelopmentRatio: number | null;
  averageCuppingScore: number | null;
  cuppedRoastCount: number;
};

export type RoasterPayload = {
  name: string;
  brand: string | null;
  model: string | null;
  capacityKg: number | null;
  location: string | null;
  notes: string | null;
  shareRoastsPublicly: boolean;
};

/** A controller kit as the roastery sees it. */
export type OrganizationController = {
  id: string;
  serialNumber: string;
  roasterId: string | null;
  roasterName: string | null;
};

export function getRoasters(request: Request) {
  return backendJson<Roaster[]>(request, "/api/roasters");
}

type InboxRow<T> = { count: number; items: T[] };

/** The Today page's tasks; a row the caller may not see is null. */
export type Inbox = {
  cuppingToScore: InboxRow<{ sessionId: string; name: string; startsAt: string; unscoredSamples: number }> | null;
  roastsWithoutSample: InboxRow<{ roastId: string; beanName: string | null; roastedAt: string; roasterName: string | null }> | null;
  roasterProblems: InboxRow<{ roasterId: string; name: string; status: RoasterStatus; uploadProblem: boolean }> | null;
  unfittedControllers: InboxRow<{ controllerId: string; serialNumber: string }> | null;
  pendingInvites: InboxRow<{ inviteId: string; email: string; role: OrganizationRole }> | null;
};

export function getInbox(request: Request) {
  return backendJson<Inbox>(request, "/api/me/inbox");
}

export function getRoaster(request: Request, roasterId: string) {
  return backendJson<Roaster>(request, `/api/roasters/${encodeURIComponent(roasterId)}`);
}

export function getRoasterStats(
  request: Request,
  roasterId: string,
  period?: { from: string; to: string },
) {
  const query = period ? `?${new URLSearchParams(period).toString()}` : "";
  return backendJson<RoasterStats>(
    request,
    `/api/roasters/${encodeURIComponent(roasterId)}/stats${query}`,
  );
}

/** Uploads from the roaster's fitted controller, newest first. */
export function getRoasterUploads(
  request: Request,
  roasterId: string,
  params?: { status?: RoastUploadStatus; size?: number },
) {
  const search = new URLSearchParams();
  if (params?.status) search.set("status", params.status);
  if (params?.size != null) search.set("size", String(params.size));
  const query = search.toString();
  return backendJson<PageResponse<RoastUploadLog>>(
    request,
    `/api/roasters/${encodeURIComponent(roasterId)}/uploads${query ? `?${query}` : ""}`,
  );
}

export function createRoaster(request: Request, payload: RoasterPayload) {
  return backendRequest<Roaster>(request, "/api/roasters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateRoaster(request: Request, roasterId: string, payload: RoasterPayload) {
  return backendRequest<Roaster>(request, `/api/roasters/${encodeURIComponent(roasterId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function deleteRoaster(request: Request, roasterId: string) {
  return backendRequest<void>(request, `/api/roasters/${encodeURIComponent(roasterId)}`, {
    method: "DELETE",
  });
}

/** Fits a controller to a roaster; null takes the fitted one off. */
export function installRoasterController(
  request: Request,
  roasterId: string,
  controllerId: string | null,
) {
  return backendRequest<Roaster>(
    request,
    `/api/roasters/${encodeURIComponent(roasterId)}/controller`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ controllerId }),
    },
  );
}

export function getOrganizationControllers(request: Request) {
  return backendJson<OrganizationController[]>(request, "/api/controllers");
}

/**
 * Links the kit showing this code to the active roastery, optionally fitting
 * it to an existing roaster or a new one named here.
 */
export function claimController(
  request: Request,
  payload: { code: string; roasterId: string | null; newRoasterName: string | null },
) {
  return backendRequest<OrganizationController>(request, "/api/controllers/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Hands a kit back so it can be claimed again; its roasts stay with this roastery. */
export function releaseController(request: Request, controllerId: string) {
  return backendRequest<void>(
    request,
    `/api/controllers/${encodeURIComponent(controllerId)}/release`,
    { method: "POST" },
  );
}

export function getCuppingSessions(request: Request, params?: PageParams) {
  return backendJson<PageResponse<CuppingSessionSummary>>(
    request,
    `/api/cupping-sessions${pageQuery(params)}`,
  );
}

export function getCuppingSession(request: Request, sessionId: string) {
  return backendJson<CuppingSessionDetail>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}`,
  );
}

export function createCuppingSession(
  request: Request,
  payload: CuppingSessionPayload,
) {
  return backendRequest<CuppingSessionDetail>(request, "/api/cupping-sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateCuppingSession(
  request: Request,
  sessionId: string,
  payload: CuppingSessionPayload,
) {
  return backendRequest<CuppingSessionDetail>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function duplicateCuppingSession(request: Request, sessionId: string) {
  return backendRequest<CuppingSessionDetail>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/duplicate`,
    { method: "POST" },
  );
}

export function deleteCuppingSession(request: Request, sessionId: string) {
  return backendRequest<void>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}`,
    { method: "DELETE" },
  );
}

export function getMembers(request: Request) {
  return backendJson<Member[]>(request, "/api/members");
}

export function getCuppingSamples(request: Request, sessionId: string) {
  return backendJson<CuppingSampleDetail[]>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/samples`,
  );
}

export function addCuppingSamples(request: Request, sessionId: string, count: number) {
  return backendRequest<CuppingSampleDetail[]>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/samples`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    },
  );
}

export function updateCuppingSample(
  request: Request,
  sessionId: string,
  sampleId: string,
  payload: CuppingSamplePayload,
) {
  return backendRequest<CuppingSampleDetail>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/samples/${encodeURIComponent(sampleId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function deleteCuppingSample(request: Request, sessionId: string, sampleId: string) {
  return backendRequest<void>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/samples/${encodeURIComponent(sampleId)}`,
    { method: "DELETE" },
  );
}

export function getMyCuppingScores(request: Request, sessionId: string) {
  return backendJson<CuppingScore[]>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/scores/me`,
  );
}

export function getLibrarySamples(
  request: Request,
  params?: PageParams & { search?: string },
) {
  const search = new URLSearchParams();
  if (params?.page != null) search.set("page", String(params.page));
  if (params?.size != null) search.set("size", String(params.size));
  if (params?.search) search.set("search", params.search);
  const query = search.toString();
  return backendJson<PageResponse<LibrarySample>>(
    request,
    `/api/samples${query ? `?${query}` : ""}`,
  );
}

export function createLibrarySample(request: Request, payload: LibrarySamplePayload) {
  return backendRequest<LibrarySample>(request, "/api/samples", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function updateLibrarySample(
  request: Request,
  sampleId: string,
  payload: LibrarySamplePayload,
) {
  return backendRequest<LibrarySample>(
    request,
    `/api/samples/${encodeURIComponent(sampleId)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}

export function deleteLibrarySample(request: Request, sampleId: string) {
  return backendRequest<void>(request, `/api/samples/${encodeURIComponent(sampleId)}`, {
    method: "DELETE",
  });
}

/** A synced roast in the roast log listing. */
export type RoastSummary = {
  id: string;
  roastedAt: string;
  beanName: string | null;
  batchNumber: string | null;
  chargeWeight: number | null;
  dropWeight: number | null;
  developmentRatio: number | null;
  /** The roaster this batch was made on; null when the kit was fitted to none. */
  roasterId: string | null;
  roasterName: string | null;
  controllerSerialNumber: string | null;
  sampleId: string | null;
  sampleTag: string | null;
  sampleName: string | null;
};

/** A roast in full: what the roaster typed, plus what the curve yielded. */
export type RoastDetail = {
  id: string;
  roastedAt: string;
  beanName: string | null;
  batchNumber: string | null;
  chargeWeight: number | null;
  dropWeight: number | null;
  chargeTemperature: number | null;
  dropTemperature: number | null;
  firstCrackSeconds: number | null;
  dropSeconds: number | null;
  developmentSeconds: number | null;
  developmentRatio: number | null;
  sourceRoastId: string | null;
  roasterId: string | null;
  roasterName: string | null;
  controllerId: string | null;
  controllerSerialNumber: string | null;
  uploadId: string | null;
  sampleId: string | null;
  sampleTag: string | null;
  sampleName: string | null;
  /** The working public link token, when the roast is shared; the page is /r/{token}. */
  shareToken: string | null;
};

/** Only the fields a roaster may correct; curve-derived values are read-only. */
export type RoastPayload = {
  beanName: string | null;
  batchNumber: string | null;
  chargeWeight: number | null;
  dropWeight: number | null;
  roastedAt: string | null;
};

export function getRoast(request: Request, roastId: string) {
  return backendJson<RoastDetail>(request, `/api/roasts/${encodeURIComponent(roastId)}`);
}

export function updateRoast(request: Request, roastId: string, payload: RoastPayload) {
  return backendRequest<RoastDetail>(request, `/api/roasts/${encodeURIComponent(roastId)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

export function getRoasts(
  request: Request,
  params?: PageParams & { search?: string; roasterId?: string },
) {
  const search = new URLSearchParams(pageQuery(params).replace(/^\?/, ""));
  if (params?.search) search.set("search", params.search);
  if (params?.roasterId) search.set("roasterId", params.roasterId);
  const query = search.toString();
  return backendJson<PageResponse<RoastSummary>>(request, `/api/roasts${query ? `?${query}` : ""}`);
}

/** A roast as it appears on the coffee it roasted. */
export type SampleRoast = {
  id: string;
  roastedAt: string;
  beanName: string | null;
  batchNumber: string | null;
  chargeWeight: number | null;
  dropWeight: number | null;
  developmentRatio: number | null;
  roasterId: string | null;
  roasterName: string | null;
  controllerId: string | null;
  controllerSerialNumber: string | null;
  uploadId: string | null;
};

/** A coffee with the roasts it came from. */
export type SampleDetail = LibrarySample & { roasts: SampleRoast[] };

export function getSample(request: Request, sampleId: string) {
  return backendJson<SampleDetail>(
    request,
    `/api/samples/${encodeURIComponent(sampleId)}`,
  );
}

/** The roast curve, addressed by roast and readable without admin rights. */
export function getRoastProfile(request: Request, roastId: string) {
  return backendJson<RoastLogVisualization>(
    request,
    `/api/roasts/${encodeURIComponent(roastId)}/profile`,
  );
}

/** Turns the roast's public link on, or returns the one already on. */
export function shareRoast(request: Request, roastId: string) {
  return backendRequest<{ token: string; sharedAt: string }>(
    request,
    `/api/roasts/${encodeURIComponent(roastId)}/share`,
    { method: "POST" },
  );
}

/** Turns the public link off; it never works again. */
export function stopSharingRoast(request: Request, roastId: string) {
  return backendRequest<void>(request, `/api/roasts/${encodeURIComponent(roastId)}/share`, {
    method: "DELETE",
  });
}

/** Mints a tagged sample for a roast and links the two in one step. */
export function createSampleFromRoast(request: Request, roastId: string) {
  return backendRequest<LibrarySample>(
    request,
    `/api/roasts/${encodeURIComponent(roastId)}/sample`,
    { method: "POST" },
  );
}

/** Links a synced roast log to the coffee it roasted; null clears the link. */
export function linkRoastSample(request: Request, roastId: string, sampleId: string | null) {
  return backendRequest<void>(
    request,
    `/api/roasts/${encodeURIComponent(roastId)}/sample`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sampleId }),
    },
  );
}

export function getCuppingResults(request: Request, sessionId: string) {
  return backendJson<CuppingSampleResult[]>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/results`,
  );
}

export function deleteMyCuppingScore(
  request: Request,
  sessionId: string,
  sampleId: string,
) {
  return backendRequest<void>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/samples/${encodeURIComponent(sampleId)}/score`,
    { method: "DELETE" },
  );
}

export function saveCuppingScore(
  request: Request,
  sessionId: string,
  sampleId: string,
  payload: CuppingScorePayload,
) {
  return backendRequest<CuppingScore>(
    request,
    `/api/cupping-sessions/${encodeURIComponent(sessionId)}/samples/${encodeURIComponent(sampleId)}/score`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
}
