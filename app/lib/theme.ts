import { createTheme } from "@mui/material/styles";

export const marosaTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#8a4b2b",
      dark: "#66351e",
      light: "#b97955",
      contrastText: "#fffaf5",
    },
    secondary: {
      main: "#c99b68",
      contrastText: "#352117",
    },
    background: {
      default: "#fbf8f3",
      paper: "#ffffff",
    },
    text: {
      primary: "#352720",
      secondary: "#74645c",
    },
    divider: "#e7ddd4",
    error: { main: "#b42318" },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
    h1: { fontWeight: 750, letterSpacing: "-0.03em" },
    h2: { fontWeight: 700, letterSpacing: "-0.02em" },
    h3: { fontWeight: 700, letterSpacing: "-0.015em" },
    button: { fontWeight: 650, textTransform: "none" },
  },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: { root: { borderRadius: 9 } },
    },
    MuiCard: {
      defaultProps: { variant: "outlined" },
      styleOverrides: { root: { borderColor: "#e7ddd4" } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiFormControl: { defaultProps: { size: "small" } },
  },
});
