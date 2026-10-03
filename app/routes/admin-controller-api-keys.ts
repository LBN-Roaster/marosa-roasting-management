import { requireAdmin } from "~/lib/auth.server";
import {
  issueControllerApiKey,
  listControllerApiKeys,
  revokeControllerApiKey,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-controller-api-keys";

export async function loader({ request, params }: Route.LoaderArgs) {
  await requireAdmin(request);
  try {
    return {
      success: true as const,
      intent: "list" as const,
      apiKeys: await listControllerApiKeys(request, params.controllerId),
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
        apiKey: await issueControllerApiKey(request, params.controllerId),
      };
    }

    const keyId = formData.get("keyId");
    if (typeof keyId !== "string" || !keyId) {
      return { success: false as const, intent };
    }
    await revokeControllerApiKey(request, params.controllerId, keyId);
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

export type ControllerApiKeyListData = Awaited<ReturnType<typeof loader>>;
export type ControllerApiKeyMutationData = Awaited<ReturnType<typeof action>>;
