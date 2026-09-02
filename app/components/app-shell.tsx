import BookOutlinedIcon from "@mui/icons-material/BookOutlined";
import CloseIcon from "@mui/icons-material/Close";
import InboxOutlinedIcon from "@mui/icons-material/InboxOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import MenuIcon from "@mui/icons-material/Menu";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import ScienceOutlinedIcon from "@mui/icons-material/ScienceOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import TranslateIcon from "@mui/icons-material/Translate";
import AppBar from "@mui/material/AppBar";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Form, NavLink, useRouteLoaderData } from "react-router";
import type { GoogleUser } from "~/lib/auth.server";

const navigation = [
  { to: "/app", labelKey: "navigation.home", icon: InboxOutlinedIcon, end: true, hidden: true },
  { to: "/recipes", labelKey: "navigation.recipes", icon: BookOutlinedIcon, hidden: true },
  { to: "/roasts", labelKey: "navigation.roasts", icon: LocalFireDepartmentOutlinedIcon },
  { to: "/cupping", labelKey: "navigation.cupping", icon: ScienceOutlinedIcon },
  { to: "/samples", labelKey: "navigation.samples", icon: CoffeeOutlinedIcon },
  { to: "/settings", labelKey: "navigation.settings", icon: SettingsOutlinedIcon, hidden: true },
  { to: "/admin", labelKey: "navigation.admin", icon: AdminPanelSettingsOutlinedIcon, adminOnly: true },
];

function userInitials(user: GoogleUser | undefined) {
  const displayName = user?.name?.trim();
  if (displayName) {
    return displayName
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }
  return user?.email[0]?.toUpperCase() ?? "?";
}

export function AppShell({ children }: { children: ReactNode }) {
  const { t, i18n } = useTranslation("common");
  const appLayoutData = useRouteLoaderData("routes/app-layout") as
    | { user: GoogleUser }
    | undefined;
  const user = appLayoutData?.user;
  const visibleNavigation = navigation.filter(
    (item) => !item.hidden && (!item.adminOnly || user?.role === "ADMIN"),
  );
  const [menuOpen, setMenuOpen] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState<HTMLElement | null>(null);
  const [accountAnchor, setAccountAnchor] = useState<HTMLElement | null>(null);

  function openLanguageMenu(event: MouseEvent<HTMLElement>) {
    setLanguageAnchor(event.currentTarget);
  }

  function openAccountMenu(event: MouseEvent<HTMLElement>) {
    setAccountAnchor(event.currentTarget);
  }

  function changeLanguage(locale: "en" | "vi") {
    document.cookie = `marosa_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = locale;
    void i18n.changeLanguage(locale);
    setLanguageAnchor(null);
  }

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
            <Box component={NavLink} to="/app" onClick={() => setMenuOpen(false)} aria-label="MAROSA" sx={{ mr: { md: 5 }, display: "flex", alignItems: "center", gap: 1.25, color: "text.primary", textDecoration: "none" }}>
              <Box component="img" src="/icon.png" alt="" sx={{ width: 36, height: 36, objectFit: "contain" }} />
              <Typography sx={{ fontWeight: 800, letterSpacing: ".16em" }}>MAROSA</Typography>
            </Box>

            <Stack component="nav" direction="row" spacing={0.5} aria-label={t("navigation.mainLabel")} sx={{ display: { xs: "none", md: "flex" } }}>
              {visibleNavigation.map(({ to, labelKey, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} prefetch="intent" style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Button
                      color={isActive ? "primary" : "inherit"}
                      startIcon={<Icon fontSize="small" />}
                      sx={{ px: 1.75, bgcolor: isActive ? "rgba(59,128,97,.10)" : "transparent", color: isActive ? "primary.main" : "text.secondary" }}
                    >
                      {t(labelKey)}
                    </Button>
                  )}
                </NavLink>
              ))}
            </Stack>

            <Stack direction="row" spacing={1.5} sx={{ ml: "auto", display: { xs: "none", md: "flex" }, alignItems: "center" }}>
              <Box sx={{ textAlign: "right", display: { md: "none", lg: "block" } }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>{t("roastery.name")}</Typography>
                <Typography variant="caption" color="text.secondary">{t("roastery.description")}</Typography>
              </Box>
              <IconButton
                aria-label={t("account.menuLabel")}
                aria-controls={accountAnchor ? "account-menu" : undefined}
                aria-expanded={accountAnchor ? "true" : undefined}
                onClick={openAccountMenu}
                sx={{ p: 0 }}
              >
                <Avatar
                  src={user?.picture}
                  alt={user?.name ?? user?.email ?? ""}
                  sx={{ width: 36, height: 36, bgcolor: "secondary.main", color: "secondary.contrastText", fontSize: 12, fontWeight: 800 }}
                >
                  {userInitials(user)}
                </Avatar>
              </IconButton>
              <Button
                color="inherit"
                size="small"
                startIcon={<TranslateIcon />}
                aria-label={t("language.label")}
                aria-controls={languageAnchor ? "language-menu" : undefined}
                aria-expanded={languageAnchor ? "true" : undefined}
                onClick={openLanguageMenu}
                sx={{ minWidth: 70 }}
              >
                {i18n.resolvedLanguage === "vi" ? "VI" : "EN"}
              </Button>
            </Stack>

            <IconButton
              aria-label={t("account.menuLabel")}
              aria-controls={accountAnchor ? "account-menu" : undefined}
              aria-expanded={accountAnchor ? "true" : undefined}
              onClick={openAccountMenu}
              sx={{ ml: "auto", p: 0, display: { md: "none" } }}
            >
              <Avatar
                src={user?.picture}
                alt={user?.name ?? user?.email ?? ""}
                sx={{ width: 34, height: 34, bgcolor: "secondary.main", color: "secondary.contrastText", fontSize: 12, fontWeight: 800 }}
              >
                {userInitials(user)}
              </Avatar>
            </IconButton>

            <IconButton sx={{ ml: 0.5, display: { md: "none" } }} aria-label={menuOpen ? "Close navigation" : "Open navigation"} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
              {menuOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </Toolbar>

          {menuOpen && (
            <Stack component="nav" aria-label={t("navigation.mobileLabel")} sx={{ display: { md: "none" }, borderTop: 1, borderColor: "divider", p: 1.5 }}>
              {visibleNavigation.map(({ to, labelKey, icon: Icon, end }) => (
                <NavLink key={to} to={to} end={end} prefetch="intent" onClick={() => setMenuOpen(false)} style={{ textDecoration: "none" }}>
                  {({ isActive }) => (
                    <Button fullWidth color={isActive ? "primary" : "inherit"} startIcon={<Icon />} sx={{ justifyContent: "flex-start", py: 1.25, color: isActive ? "primary.main" : "text.secondary", bgcolor: isActive ? "rgba(59,128,97,.10)" : "transparent" }}>
                      {t(labelKey)}
                    </Button>
                  )}
                </NavLink>
              ))}
              <Button fullWidth color="inherit" startIcon={<TranslateIcon />} onClick={openLanguageMenu} sx={{ justifyContent: "flex-start", py: 1.25, color: "text.secondary" }}>
                {t("language.label")}: {i18n.resolvedLanguage === "vi" ? t("language.vietnamese") : t("language.english")}
              </Button>
            </Stack>
          )}
        </Container>
      </AppBar>

      <Menu id="language-menu" anchorEl={languageAnchor} open={Boolean(languageAnchor)} onClose={() => setLanguageAnchor(null)}>
        <MenuItem selected={i18n.resolvedLanguage === "en"} onClick={() => changeLanguage("en")}>{t("language.english")}</MenuItem>
        <MenuItem selected={i18n.resolvedLanguage === "vi"} onClick={() => changeLanguage("vi")}>{t("language.vietnamese")}</MenuItem>
      </Menu>

      <Menu
        id="account-menu"
        anchorEl={accountAnchor}
        open={Boolean(accountAnchor)}
        onClose={() => setAccountAnchor(null)}
        slotProps={{ paper: { sx: { mt: 1, minWidth: 240 } } }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {t("account.signedInAs")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.25, fontWeight: 700 }} noWrap>
            {user?.name ?? user?.email}
          </Typography>
          {user?.name && (
            <Typography variant="caption" color="text.secondary" noWrap component="p">
              {user.email}
            </Typography>
          )}
          <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>
            {user?.role === "ADMIN" ? t("account.roleAdmin") : t("account.roleUser")}
          </Typography>
        </Box>
        <Divider />
        <Form method="post" action="/logout">
          <MenuItem component="button" type="submit" sx={{ width: "100%", gap: 1.25 }}>
            <LogoutOutlinedIcon fontSize="small" />
            {t("account.signOut")}
          </MenuItem>
        </Form>
      </Menu>

      <Container component="main" maxWidth="lg" sx={{ py: { xs: 4, sm: 5 }, px: { xs: 2, sm: 3 } }}>
        {children}
      </Container>
    </Box>
  );
}
