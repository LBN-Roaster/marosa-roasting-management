import { redirect } from "react-router";
import { getAuthSession } from "~/lib/auth.server";

export type MachineStatus =
  | "IN_PRODUCTION"
  | "READY_FOR_SHIPPING"
  | "SOLD"
  | "CONSIGNMENT";

export type RoastUploadStatus =
  | "PENDING"
  | "UPLOADED"
  | "PROCESSING"
  | "PROCESSED"
  | "FAILED";

export type AdminMachine = {
  id: string;
  serialNumber: string;
  name: string | null;
  status: MachineStatus;
  lastUploadAt: string | null;
};

export type MachineLog = {
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

export type AdminMachineDetail = {
  machine: AdminMachine;
  logs: PageResponse<MachineLog>;
};

export type MachineApiKeyCreated = {
  keyId: string;
  token: string;
  expiresAt: string | null;
  createdAt: string;
};

export type MachineApiKeySummary = {
  keyId: string;
  keyPrefix: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
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

export type MachineLogVisualization = {
  machine: AdminMachine;
  log: MachineLog;
  title: string | null;
  beanName: string | null;
  temperatureUnit: "°C" | "°F";
  points: AlogProfilePoint[];
  milestones: AlogMilestone[];
};

function backendOrigin() {
  return (process.env.BACKEND_API_URL ?? "http://localhost:8080").replace(
    /\/$/,
    "",
  );
}

async function backendRequest<T>(
  request: Request,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const session = await getAuthSession(request);
  const token = session.get("backendToken");
  if (!token) throw redirect("/login");

  let response: Response;
  try {
    response = await fetch(`${backendOrigin()}${path}`, {
      ...init,
      headers: {
        ...init?.headers,
        Authorization: `Bearer ${token}`,
      },
    });
  } catch {
    throw new Response("The backend service is unavailable.", { status: 503 });
  }

  if (response.status === 401) {
    throw redirect("/login");
  }
  if (response.status === 403) {
    throw new Response("Forbidden.", { status: 403 });
  }
  if (response.status === 404) {
    throw new Response("Machine not found.", { status: 404 });
  }
  if (!response.ok) {
    throw new Response("The backend request failed.", { status: response.status });
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

export function getAdminMachines(request: Request, params?: PageParams) {
  return backendJson<PageResponse<AdminMachine>>(
    request,
    `/api/admin/machines${pageQuery(params)}`,
  );
}

export function getAdminMachine(
  request: Request,
  machineId: string,
  params?: PageParams,
) {
  return backendJson<AdminMachineDetail>(
    request,
    `/api/admin/machines/${encodeURIComponent(machineId)}${pageQuery(params)}`,
  );
}

export function issueMachineApiKey(request: Request, machineId: string) {
  return backendRequest<MachineApiKeyCreated>(
    request,
    `/api/machines/${encodeURIComponent(machineId)}/api-keys`,
    { method: "POST" },
  );
}

export function listMachineApiKeys(request: Request, machineId: string) {
  return backendRequest<MachineApiKeySummary[]>(
    request,
    `/api/machines/${encodeURIComponent(machineId)}/api-keys`,
  );
}

export function revokeMachineApiKey(
  request: Request,
  machineId: string,
  keyId: string,
) {
  return backendRequest<void>(
    request,
    `/api/machines/${encodeURIComponent(machineId)}/api-keys/${encodeURIComponent(keyId)}`,
    { method: "DELETE" },
  );
}

export function getMachineLogVisualization(
  request: Request,
  machineId: string,
  uploadId: string,
) {
  return backendJson<MachineLogVisualization>(
    request,
    `/api/admin/machines/${encodeURIComponent(machineId)}/logs/${encodeURIComponent(uploadId)}`,
  );
}
