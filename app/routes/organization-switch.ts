import { redirect } from "react-router";
import { rememberOrganization, requireUser } from "~/lib/auth.server";
import { resolveOrganizations } from "~/lib/backend.server";
import type { Route } from "./+types/organization-switch";

/**
 * Lands on the top of the section the user was in: a record open in the old
 * organization (a roast, a cupping session) does not exist in the new one.
 */
function sectionOf(path: string) {
  if (!path.startsWith("/") || path.startsWith("//")) return "/roasts";
  const section = path.split(/[/?#]/)[1];
  return section ? `/${section}` : "/roasts";
}

export async function action({ request }: Route.ActionArgs) {
  await requireUser(request);
  const formData = await request.formData();
  const organizationId = String(formData.get("organizationId") ?? "");

  const { organizations } = await resolveOrganizations(request);
  if (!organizations.some((organization) => organization.id === organizationId)) {
    throw new Response("Organization not found.", { status: 404 });
  }

  throw redirect(sectionOf(String(formData.get("returnTo") ?? "")), {
    headers: { "Set-Cookie": await rememberOrganization(request, organizationId) },
  });
}
