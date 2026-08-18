import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet } from "react-router";
import { AppShell } from "~/components/app-shell";
import { RecipeProvider } from "~/contexts/recipe-context";
import { RoastProvider } from "~/contexts/roast-context";
import { marosaTheme } from "~/lib/theme";
import { requireUser } from "~/lib/auth.server";
import type { Route } from "./+types/app-layout";

export async function loader({ request }: Route.LoaderArgs) {
  return { user: await requireUser(request) };
}

export default function AppLayout() {
  return (
    <ThemeProvider theme={marosaTheme}>
      <CssBaseline />
      <RecipeProvider>
        <RoastProvider>
          <AppShell>
            <Outlet />
          </AppShell>
        </RoastProvider>
      </RecipeProvider>
    </ThemeProvider>
  );
}
