import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PublicHeader } from "~/components/public-header";

export function meta() {
  return [
    { title: "MAROSA — Coffee roasting, clearly managed" },
    { name: "description", content: "Recipes, roast profiles, and production records in one calm workspace." },
  ];
}

const features = [
  { key: "recipes", icon: MenuBookOutlinedIcon },
  { key: "profiles", icon: AutoGraphOutlinedIcon },
  { key: "sync", icon: CloudSyncOutlinedIcon },
] as const;

export default function LandingPage() {
  const { t } = useTranslation("landing");

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FBFCFA", backgroundImage: "radial-gradient(circle at 76% 20%, rgba(90,175,135,.15), transparent 28rem)" }}>
      <PublicHeader />

      <Container component="main" maxWidth="lg">
        <Box sx={{ minHeight: { xs: "auto", md: "72vh" }, py: { xs: 8, md: 11 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr .95fr" }, gap: { xs: 7, md: 10 }, alignItems: "center" }}>
          <Box>
            <Typography variant="overline" color="primary.main" sx={{ fontWeight: 800, letterSpacing: ".16em" }}>{t("eyebrow")}</Typography>
            <Typography component="h1" sx={{ mt: 2, maxWidth: 700, fontSize: { xs: "2.75rem", sm: "4rem", md: "4.7rem" }, lineHeight: .98, letterSpacing: "-.055em", fontWeight: 760, color: "text.primary" }}>
              {t("headline")}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 3, maxWidth: 590, fontSize: { xs: "1.05rem", sm: "1.2rem" }, lineHeight: 1.7 }}>{t("subheadline")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={Link} to="/login?mode=signup" variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ px: 3 }}>{t("start")}</Button>
              <Button component={Link} to="/app" variant="outlined" size="large" color="inherit" sx={{ px: 3 }}>{t("demo")}</Button>
            </Stack>
          </Box>

          <Box aria-label={t("previewLabel")} sx={{ position: "relative", border: "1px solid", borderColor: "divider", borderRadius: 5, bgcolor: "rgba(255,255,255,.88)", boxShadow: "0 28px 80px rgba(26,58,52,.12)", overflow: "hidden" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "primary.main" }} />
              <Typography variant="caption" sx={{ fontWeight: 700 }}>{t("preview.title")}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ ml: "auto!important" }}>{t("preview.id")}</Typography>
            </Stack>
            <Box sx={{ p: { xs: 2.5, sm: 4 } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box><Typography variant="caption" color="text.secondary">{t("preview.beanTemperature")}</Typography><Typography variant="h4" sx={{ mt: .5, fontWeight: 750 }}>197.5°C</Typography></Box>
                <Box sx={{ textAlign: "right" }}><Typography variant="caption" color="text.secondary">{t("preview.duration")}</Typography><Typography sx={{ mt: .5, fontWeight: 700 }}>10:02</Typography></Box>
              </Stack>
              <Box sx={{ mt: 4, height: 180, position: "relative", borderBottom: "1px solid #DEE9E2", backgroundImage: "linear-gradient(#EDF3EF 1px, transparent 1px)", backgroundSize: "100% 45px", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: "32% -8% 10% -5%", borderTop: "4px solid", borderColor: "primary.main", borderRadius: "50% 50% 0 0", transform: "rotate(-7deg)" }} />
                <Box sx={{ position: "absolute", inset: "12% -5% 36% -10%", borderBottom: "3px solid #E58A62", borderRadius: "0 0 50% 50%", transform: "rotate(5deg)" }} />
                <Box sx={{ position: "absolute", left: "80%", bottom: 0, height: "76%", borderLeft: "1px dashed #7A9A8B" }} />
              </Box>
              <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
                <Typography variant="caption" color="text.secondary"><Box component="span" sx={{ display: "inline-block", width: 8, height: 8, mr: .75, borderRadius: "50%", bgcolor: "primary.main" }} />BT</Typography>
                <Typography variant="caption" color="text.secondary"><Box component="span" sx={{ display: "inline-block", width: 8, height: 8, mr: .75, borderRadius: "50%", bgcolor: "#E58A62" }} />ET</Typography>
              </Stack>
            </Box>
          </Box>
        </Box>

        <Divider />
        <Box id="features" sx={{ py: { xs: 7, md: 9 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 5 }}>
          {features.map(({ key, icon: Icon }) => (
            <Box key={key}>
              <Icon color="primary" />
              <Typography variant="h6" sx={{ mt: 2, mb: 1 }}>{t(`features.${key}.title`)}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.7 }}>{t(`features.${key}.description`)}</Typography>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
