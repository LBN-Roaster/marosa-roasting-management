import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import CloseIcon from "@mui/icons-material/Close";
import CoffeeIcon from "@mui/icons-material/Coffee";
import HomeOutlinedIcon from "@mui/icons-material/HomeOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { NavLink } from "react-router";

const navigation = [
  { to: "/", label: "Home", icon: HomeOutlinedIcon, end: true },
  { to: "/recipes", label: "Recipes", icon: BookOutlinedIcon },
  { to: "/cupping", label: "Cupping", icon: ScienceOutlinedIcon },
  { to: "/settings", label: "Settings", icon: SettingsOutlinedIcon },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <Box sx={{ minHeight: "100vh" }}>
      <AppBar
        position="sticky"
        color="inherit"
        elevation={0}
        sx={{ borderBottom: 1, borderColor: "divider", bgcolor: "rgba(255,255,255,.92)", backdropFilter: "blur(12px)" }}
      >
        <Container maxWidth="lg" disableGutters>
          <Toolbar sx={{ minHeight: "64px!important", px: { xs: 2, sm: 3 } }}>
            <Box component={NavLink} to="/" onClick={() => setMenuOpen(false)} sx={{ mr: { md: 5 }, display: "flex", alignItems: "center", gap: 1.25, color: "text.primary", textDecoration: "none" }}>
              <Avatar variant="rounded" sx={{ width: 36, height: 36, bgcolor: "primary.main", borderRadius: 2.5 }}>
                <CoffeeIcon fontSize="small" />
              </Avatar>
              <Typography sx={{ fontWeight: 800, letterSpacing: ".16em" }}>MAROSA</Typography>
            </Box>

            <Stack component="nav" direction="row" spacing={0.5} aria-label="Main navigation" sx={{ display: { xs: "none", md: "flex" } }}>
              {navigation.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Button
                      color={isActive ? "primary" : "inherit"}
                      startIcon={<Icon fontSize="small" />}
                      sx={{ px: 1.75, bgcolor: isActive ? "rgba(138,75,43,.09)" : "transparent", color: isActive ? "primary.main" : "text.secondary" }}
                    >
                      {label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ ml: "auto", display: { xs: "none", md: "flex" }, alignItems: "center" }}>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>LBN Coffee</Typography>
                <Typography variant="caption" color="text.secondary">Primary roastery</Typography>
              </Box>
              <Avatar sx={{ width: 36, height: 36, bgcolor: "secondary.main", color: "secondary.contrastText", fontSize: 12, fontWeight: 800 }}>LC</Avatar>
            </Stack>

            <IconButton sx={{ ml: "auto", display: { md: "none" } }} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>

          {menuOpen && (
            <Stack component="nav" aria-label="Mobile navigation" sx={{ display: { md: "none" }, borderTop: 1, borderColor: "divider", p: 1.5 }}>
              {navigation.map(({ to, label, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Button fullWidth color={isActive ? "primary" : "inherit"} startIcon={<Icon />} sx={{ justifyContent: "flex-start", py: 1.25, color: isActive ? "primary.main" : "text.secondary", bgcolor: isActive ? "rgba(138,75,43,.09)" : "transparent" }}>
                      {label}
                    </Button>
                  )}
                </NavLink>
              ))}
            </Stack>
          )}
        </Container>
      </AppBar>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  );
}
