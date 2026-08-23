import { requireAdmin } from "~/lib/auth.server";
import {
  issueMachineApiKey,
  listMachineApiKeys,
  revokeMachineApiKey,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-machine-api-keys";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  try {
    return {
      success: true as const,
      intent: "list" as const,
      apiKeys: await listMachineApiKeys(request, params.machineId),
    };
  } catch (error) {
    if (
      error instanceof Response &&
      error.status >= 300 &&
      error.status < 400
    ) {
      throw error;
    }
    return {
      success: false as const,
      intent: "list" as const,
      apiKeys: [],
    };
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent !== "generate" && intent !== "revoke") {
    return { success: false as const, intent: "invalid" as const };
  }

  try {
    if (intent === "generate") {
      return {
        success: true as const,
        intent,
        apiKey: await issueMachineApiKey(request, params.machineId),
      };
    }

    const keyId = formData.get("keyId");
    if (typeof keyId !== "string" || !keyId) {
      return { success: false as const, intent };
    }
    await revokeMachineApiKey(request, params.machineId, keyId);
    return { success: true as const, intent, keyId };
  } catch (error) {
    if (
      error instanceof Response &&
      error.status >= 300 &&
      error.status < 400
    ) {
      throw error;
    }
    return { success: false as const, intent };
  }
}

export type MachineApiKeyListData = Awaited<ReturnType<typeof loader>>;
export type MachineApiKeyMutationData = Awaited<ReturnType<typeof action>>;
