import Alert from "@mui/material/Alert";
import { useTranslation } from "react-i18next";
import {
  redirect,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import { CuppingSessionForm } from "~/components/cupping-session-form";
import {
  getCuppingSession,
  getMembers,
  updateCuppingSession,
} from "~/lib/backend.server";
import {
  draftFromSession,
  payloadFromDraft,
  type CuppingSessionDraft,
} from "~/lib/cupping";
import type { Route } from "./+types/cupping-edit";

export function meta() {
  return [{ title: "Edit cupping session | MAROSA" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const [session, members] = await Promise.all([
    getCuppingSession(request, params.sessionId),
    getMembers(request),
  ]);
  return { session, members };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const draft = JSON.parse(String(formData.get("payload"))) as CuppingSessionDraft;
  try {
    await updateCuppingSession(request, params.sessionId, payloadFromDraft(draft));
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { saveFailed: true };
    }
    throw error;
  }
  return redirect("/cupping");
}

export default function EditCuppingSessionPage() {
  const { t } = useTranslation(["cupping", "common"]);
  const { session, members } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();

  return (
    <>
      {actionData?.saveFailed && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("form.validation.saveFailed")}
        </Alert>
      )}
      <CuppingSessionForm
        initialValue={draftFromSession(session)}
        members={members}
        title={t("form.editTitle")}
        submitLabel={t("common:actions.saveChanges")}
        submitting={navigation.state !== "idle"}
        onCancel={() => void navigate("/cupping")}
        onSubmit={(value) =>
          void submit({ payload: JSON.stringify(value) }, { method: "post" })
        }
      />
    </>
  );
}
