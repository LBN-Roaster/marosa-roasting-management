import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet } from "react-router";
import { AppShell } from "~/components/app-shell";
import { RecipeProvider } from "~/contexts/recipe-context";
import { marosaTheme } from "~/lib/theme";

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
