import Alert from "@mui/material/Alert";
import Card from "@mui/material/Card";
import Skeleton from "@mui/material/Skeleton";
import { useEffect, useState } from "react";
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
import { PageHeading } from "~/components/page-heading";
import { createCuppingSession, getMembers } from "~/lib/backend.server";
import {
  emptyCuppingSession,
  payloadFromDraft,
  type CuppingSessionDraft,
} from "~/lib/cupping";
import type { Route } from "./+types/cupping-new";

export function meta() {
  return [{ title: "New cupping session | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  return { members: await getMembers(request) };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const draft = JSON.parse(String(formData.get("payload"))) as CuppingSessionDraft;
  let created;
  try {
    created = await createCuppingSession(request, payloadFromDraft(draft));
  } catch (error) {
    // 4xx means the backend rejected the session; anything else (including the
    // redirect thrown on an expired session) belongs to the error boundary.
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { saveFailed: true };
    }
    throw error;
  }
  return redirect(`/cupping/${created.id}/samples`);
}

export default function NewCuppingSessionPage() {
  const { t } = useTranslation("cupping");
  const { members } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const navigate = useNavigate();
  const submit = useSubmit();
  // The blank session is seeded from the clock, so it is built after mount:
  // the server and the browser would otherwise disagree on today's date.
  const [draft, setDraft] = useState<CuppingSessionDraft | null>(null);

  useEffect(() => setDraft(emptyCuppingSession()), []);

  if (!draft) {
    return (
      <>
        <PageHeading title={t("form.createTitle")} />
        <Card>
          <Skeleton variant="rectangular" height={520} sx={{ bgcolor: "action.hover" }} />
        </Card>
      </>
    );
  }

  return (
    <>
      {actionData?.saveFailed && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("form.validation.saveFailed")}
        </Alert>
      )}
      <CuppingSessionForm
        initialValue={draft}
        members={members}
        title={t("form.createTitle")}
        submitLabel={t("form.createSubmit")}
        submitting={navigation.state !== "idle"}
        onCancel={() => void navigate("/cupping")}
        onSubmit={(value) =>
          void submit({ payload: JSON.stringify(value) }, { method: "post" })
        }
      />
    </>
  );
}
