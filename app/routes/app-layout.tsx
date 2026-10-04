import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { data, Outlet } from "react-router";
import { AppShell } from "~/components/app-shell";
import { RecipeProvider } from "~/contexts/recipe-context";
import { marosaTheme } from "~/lib/theme";
import {
  getSessionOrganizationId,
  rememberOrganization,
  requireUser,
} from "~/lib/auth.server";
import { resolveOrganizations } from "~/lib/backend.server";
import type { Route } from "./+types/app-layout";

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  let resolved;
  try {
    resolved = await resolveOrganizations(request);
  } catch (error) {
    // Pages without backend data (the inbox, recipes) still work while the
    // backend is down; pages that need it report the outage themselves.
    if (error instanceof Response && error.status >= 500) {
      return { user, organizations: [], activeOrganization: null, organizationsUnavailable: true };
    }
    throw error;
  }
  const { organizations, active } = resolved;
  const payload = { user, organizations, activeOrganization: active, organizationsUnavailable: false };

  // Remember the fallback choice so the switcher and the next request agree,
  // including after the user lost access to the organization they had open.
  if (active && active.id !== (await getSessionOrganizationId(request))) {
    return data(payload, {
      headers: { "Set-Cookie": await rememberOrganization(request, active.id) },
    });
  }
  return payload;
}

export default function AppLayout() {
  return (
    <ThemeProvider theme={marosaTheme}>
      <CssBaseline />
      <RecipeProvider>
        <AppShell>
          <Outlet />
        </AppShell>
      </RecipeProvider>
    </ThemeProvider>
  );
}
