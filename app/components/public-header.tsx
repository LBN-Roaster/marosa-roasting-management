import TranslateIcon from "@mui/icons-material/Translate";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function PublicHeader({ compact = false }: { compact?: boolean }) {
  const { t, i18n } = useTranslation(["landing", "common"]);
  const [languageAnchor, setLanguageAnchor] = useState<HTMLElement | null>(null);

  function openLanguageMenu(event: MouseEvent<HTMLElement>) {
    setLanguageAnchor(event.currentTarget);
  }

  function changeLanguage(locale: "en" | "vi") {
    document.cookie = `marosa_locale=${locale}; Path=/; Max-Age=31536000; SameSite=Lax`;
    document.documentElement.lang = locale;
    void i18n.changeLanguage(locale);
    setLanguageAnchor(null);
  }

  return (
    <Box component="header" sx={{ py: 2 }}>
      <Container maxWidth="lg">
        <Stack direction="row" sx={{ alignItems: "center" }}>
          <Stack component={Link} to="/" direction="row" spacing={1.25} aria-label="MAROSA" sx={{ alignItems: "center", color: "text.primary", textDecoration: "none" }}>
            <Box component="img" src="/icon.png" alt="" sx={{ width: 36, height: 36, objectFit: "contain" }} />
            <Typography sx={{ display: { xs: "none", sm: "block" }, fontWeight: 800, letterSpacing: ".16em" }}>MAROSA</Typography>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ ml: "auto", alignItems: "center" }}>
            <Button color="inherit" size="small" startIcon={<TranslateIcon />} onClick={openLanguageMenu} aria-label={t("common:language.label")}>
              {i18n.resolvedLanguage === "en" ? "EN" : "VI"}
            </Button>
            {!compact && (
              <>
                <Button component={Link} to="/login" color="inherit">{t("login")}</Button>
                <Button component={Link} to="/login?mode=signup" variant="contained">{t("signup")}</Button>
              </>
            )}
          </Stack>
        </Stack>
      </Container>

      <Menu anchorEl={languageAnchor} open={Boolean(languageAnchor)} onClose={() => setLanguageAnchor(null)}>
        <MenuItem selected={i18n.resolvedLanguage === "vi"} onClick={() => changeLanguage("vi")}>{t("common:language.vietnamese")}</MenuItem>
        <MenuItem selected={i18n.resolvedLanguage === "en"} onClick={() => changeLanguage("en")}>{t("common:language.english")}</MenuItem>
      </Menu>
    </Box>
  );
}
