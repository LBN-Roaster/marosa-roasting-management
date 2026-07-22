import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { Outlet } from "react-router";
import { marosaTheme } from "~/lib/theme";

export default function PublicLayout() {
  return (
    <ThemeProvider theme={marosaTheme}>
      <CssBaseline />
      <Outlet />
    </ThemeProvider>
  );
}
