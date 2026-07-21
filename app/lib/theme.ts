import { createTheme } from "@mui/material/styles";

export const marosaTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#3B8061",
      dark: "#1A3A34",
      light: "#5AAF87",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#5AAF87",
      dark: "#3B8061",
      light: "#E7F5E8",
      contrastText: "#1A3A34",
    },
    background: {
      default: "#F4F4F4",
      paper: "#FFFFFF",
    },
    text: {
      primary: "#1A3A34",
      secondary: "#6B7280",
    },
    divider: "#EEEEEE",
    success: { main: "#3D8565", contrastText: "#FFFFFF" },
    warning: { main: "#F59E0B", contrastText: "rgba(0,0,0,.87)" },
    error: { main: "#E53935", contrastText: "#FFFFFF" },
    info: { main: "#42A5F5", contrastText: "#FFFFFF" },
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
      styleOverrides: { root: { borderColor: "#E0E0E0" } },
    },
    MuiTextField: { defaultProps: { size: "small" } },
    MuiFormControl: { defaultProps: { size: "small" } },
    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: "#E0E0E0" },
        root: {
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#5AAF87" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#3B8061" },
        },
      },
    },
    MuiCssBaseline: {
      styleOverrides: {
        ":focus-visible": { outline: "3px solid rgba(0, 95, 204, .34)", outlineOffset: 2 },
      },
    },
  },
});
