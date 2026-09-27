import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AutoGraphOutlinedIcon from "@mui/icons-material/AutoGraphOutlined";
import ChatBubbleOutlineOutlinedIcon from "@mui/icons-material/ChatBubbleOutlineOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import CloudSyncOutlinedIcon from "@mui/icons-material/CloudSyncOutlined";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExploreOutlinedIcon from "@mui/icons-material/ExploreOutlined";
import FlightLandOutlinedIcon from "@mui/icons-material/FlightLandOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import MenuBookOutlinedIcon from "@mui/icons-material/MenuBookOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import ShieldOutlinedIcon from "@mui/icons-material/ShieldOutlined";
import SpeedOutlinedIcon from "@mui/icons-material/SpeedOutlined";
import ThermostatOutlinedIcon from "@mui/icons-material/ThermostatOutlined";
import TimerOutlinedIcon from "@mui/icons-material/TimerOutlined";
import TuneOutlinedIcon from "@mui/icons-material/TuneOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import Accordion from "@mui/material/Accordion";
import AccordionDetails from "@mui/material/AccordionDetails";
import AccordionSummary from "@mui/material/AccordionSummary";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { Link, redirect } from "react-router";
import { PublicHeader } from "~/components/public-header";
import { getSignedInUser } from "~/lib/auth.server";
import type { Route } from "./+types/landing";

// Signed-in users skip the marketing page and go straight to their workspace.
export async function loader({ request }: Route.LoaderArgs) {
  if (await getSignedInUser(request)) throw redirect("/app");
  return null;
}

export function meta() {
  return [
    { title: "MAROSA — Rang cà phê, quản lý rõ ràng" },
    { name: "description", content: "Công thức, biểu đồ rang và hồ sơ sản xuất trong một không gian làm việc tinh gọn." },
  ];
}

const ZALO_URL = "https://zalo.me/2704634352934445069";
const TIKTOK_URL = "https://www.tiktok.com/@marosa.vn";

// One type scale for the whole page, so headline → section → card → detail steps
// evenly instead of jumping between MUI's caption/body2/body1 defaults.
const type = {
  eyebrow: { fontSize: ".8rem", fontWeight: 800, letterSpacing: ".14em", textTransform: "uppercase" as const, lineHeight: 1.5 },
  hero: { fontSize: { xs: "2.5rem", sm: "3.25rem", md: "3.9rem" }, lineHeight: 1.04, letterSpacing: "-.04em", fontWeight: 750 },
  lead: { fontSize: { xs: "1.0625rem", md: "1.1875rem" }, lineHeight: 1.72 },
  sectionTitle: { fontSize: { xs: "1.75rem", md: "2.15rem" }, lineHeight: 1.22, letterSpacing: "-.025em", fontWeight: 720 },
  cardTitle: { fontSize: "1.1875rem", lineHeight: 1.45, fontWeight: 700, letterSpacing: "-.01em" },
  body: { fontSize: "1rem", lineHeight: 1.72 },
  detail: { fontSize: ".9375rem", lineHeight: 1.68 },
  micro: { fontSize: ".875rem", lineHeight: 1.6 },
  label: { fontSize: ".8125rem", lineHeight: 1.5, letterSpacing: ".02em" },
  statValue: { fontSize: { xs: "2.25rem", md: "2.6rem" }, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-.03em" },
};

// The nine-tone heat spectrum used across MAROSA — Drying through Development.
const spectrum = ["#018763", "#3B8061", "#5AAF87", "#009688", "#26C6DA", "#448AFF", "#FF9800", "#FF5252", "#6D4C41"];

const proofStats = ["roasteries", "batches", "days", "regions"] as const;

const problems = ["drift", "tethered", "machine", "blind"] as const;

const solutionStats = [
  { key: "accuracy", icon: ThermostatOutlinedIcon, value: "±1°C", color: "#7FD3AC" },
  { key: "tick", icon: TimerOutlinedIcon, value: "500ms", color: "#5FD3D9" },
  { key: "prediction", icon: VisibilityOutlinedIcon, value: "60s", color: "#FFB74D" },
  { key: "safety", icon: ShieldOutlinedIcon, value: "3", color: "#FF8A80" },
] as const;

const features = [
  { key: "recipes", icon: MenuBookOutlinedIcon, tags: ["blend", "targets"] },
  { key: "profiles", icon: AutoGraphOutlinedIcon, tags: ["ror", "phases"] },
  { key: "sync", icon: CloudSyncOutlinedIcon, tags: ["telemetry"] },
  { key: "control", icon: TuneOutlinedIcon, tags: ["feedforward", "phasePid"] },
  { key: "prediction", icon: FlightLandOutlinedIcon, tags: ["ghostTrace", "coasting"] },
  { key: "modes", icon: ExploreOutlinedIcon, tags: ["fourModes", "override"] },
] as const;

// Capabilities stated once, so the tier cards only carry the differences.
const includedEverywhere = ["autopilot", "pid", "ghost", "coast", "modes", "tuning", "safety", "sensekit", "profiles", "alog", "local"] as const;

const standardLadder = [
  { capacity: "1,5 – 3 kg", price: "6.000.000 ₫" },
  { capacity: "6 kg", price: "9.000.000 ₫" },
  { capacity: "15 kg", price: "12.000.000 ₫" },
  { capacity: "30 kg", price: "18.000.000 ₫" },
];

const proLadder = [
  { capacity: "6 kg", price: "12.000.000 ₫" },
  { capacity: "15 kg", price: "18.000.000 ₫" },
  { capacity: "30 kg", price: "24.000.000 ₫" },
];

const spoilRows = [
  { machine: "3 kg", robusta: "360.000 ₫", arabica: "540.000 ₫", subscription: "500.000 ₫" },
  { machine: "6 kg", robusta: "720.000 ₫", arabica: "1.080.000 ₫", subscription: "750.000 ₫" },
  { machine: "15 kg", robusta: "1.800.000 ₫", arabica: "2.700.000 ₫", subscription: "1.000.000 ₫" },
  { machine: "30 kg", robusta: "3.600.000 ₫", arabica: "5.400.000 ₫", subscription: "1.500.000 ₫" },
];

const faqs = ["hardware", "plc", "offline", "quota", "renewal", "language", "artisan"] as const;

const ctaSteps = [
  { key: "consult", icon: ChatBubbleOutlineOutlinedIcon },
  { key: "survey", icon: PlaceOutlinedIcon },
  { key: "pilot", icon: DescriptionOutlinedIcon },
] as const;

const controlBars = [
  { key: "gas", value: 42, color: "#3B8061" },
  { key: "fan", value: 65, color: "#26C6DA" },
  { key: "drum", value: 80, color: "#FF9800" },
] as const;

const cellSx = { padding: "10px 12px", borderBottom: "1px solid #EEEEEE", textAlign: "left" as const };

export default function LandingPage() {
  const { t } = useTranslation("landing");

  function Included({ children }: { children: React.ReactNode }) {
    return (
      <Stack direction="row" spacing={1.25} component="li" sx={{ alignItems: "flex-start", listStyle: "none" }}>
        <CheckIcon sx={{ fontSize: 18, color: "primary.main", mt: .3, flexShrink: 0 }} />
        <Typography component="span" sx={type.detail}>{children}</Typography>
      </Stack>
    );
  }

  function Excluded({ children }: { children: React.ReactNode }) {
    return (
      <Stack direction="row" spacing={1.25} component="li" sx={{ alignItems: "flex-start", listStyle: "none" }}>
        <CloseIcon sx={{ fontSize: 18, color: "text.disabled", mt: .3, flexShrink: 0 }} />
        <Typography component="span" sx={{ ...type.detail, color: "text.secondary" }}>{children}</Typography>
      </Stack>
    );
  }

  function Ladder({ rows, quoteRow }: { rows: { capacity: string; price: string }[]; quoteRow?: boolean }) {
    return (
      <Box component="table" sx={{ width: "100%", borderCollapse: "collapse", mt: 2 }}>
        <Box component="thead">
          <Box component="tr">
            <Box component="th" sx={{ ...cellSx, ...type.label, color: "text.secondary", fontWeight: 700 }}>{t("pricing.ladder.capacity")}</Box>
            <Box component="th" sx={{ ...cellSx, ...type.label, color: "text.secondary", fontWeight: 700, textAlign: "right" }}>{t("pricing.ladder.perYear")}</Box>
          </Box>
        </Box>
        <Box component="tbody">
          {rows.map((row) => (
            <Box component="tr" key={row.capacity}>
              <Box component="td" sx={{ ...cellSx, ...type.detail }}>{row.capacity}</Box>
              <Box component="td" sx={{ ...cellSx, ...type.detail, textAlign: "right", fontWeight: 700 }}>{row.price}</Box>
            </Box>
          ))}
          {quoteRow && (
            <Box component="tr">
              <Box component="td" sx={{ ...cellSx, ...type.detail }}>{t("pricing.ladder.over30")}</Box>
              <Box component="td" sx={{ ...cellSx, ...type.detail, textAlign: "right", fontWeight: 700 }}>{t("pricing.ladder.quote")}</Box>
            </Box>
          )}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#FBFCFA", backgroundImage: "radial-gradient(circle at 76% 20%, rgba(90,175,135,.15), transparent 28rem)" }}>
      <PublicHeader />

      <Container component="main" maxWidth="lg">
        <Box sx={{ minHeight: { xs: "auto", md: "68vh" }, py: { xs: 8, md: 11 }, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1.05fr .95fr" }, gap: { xs: 7, md: 10 }, alignItems: "center" }}>
          <Box>
            <Typography component="p" color="primary.main" sx={type.eyebrow}>{t("eyebrow")}</Typography>
            <Typography component="h1" sx={{ ...type.hero, mt: 2, maxWidth: 640, color: "text.primary" }}>
              {t("headline")}
            </Typography>
            <Typography color="text.secondary" sx={{ ...type.lead, mt: 3, maxWidth: 560 }}>{t("subheadline")}</Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
              <Button component={Link} to="/login?mode=signup" variant="contained" size="large" endIcon={<ArrowForwardIcon />} sx={{ px: 3 }}>{t("start")}</Button>
              <Button component={Link} to="#pricing" variant="outlined" size="large" color="inherit" sx={{ px: 3 }}>{t("seePricing")}</Button>
            </Stack>
          </Box>

          <Box aria-label={t("previewLabel")} sx={{ position: "relative", border: "1px solid", borderColor: "divider", borderRadius: 5, bgcolor: "rgba(255,255,255,.88)", boxShadow: "0 28px 80px rgba(26,58,52,.12)", overflow: "hidden" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", px: 2.5, py: 2, borderBottom: "1px solid", borderColor: "divider" }}>
              <Box sx={{ width: 9, height: 9, borderRadius: "50%", bgcolor: "primary.main" }} />
              <Typography sx={{ ...type.label, fontWeight: 700 }}>{t("preview.title")}</Typography>
              <Typography color="text.secondary" sx={{ ...type.label, ml: "auto!important" }}>{t("preview.id")}</Typography>
            </Stack>
            <Box sx={{ p: { xs: 2.5, sm: 3.5 } }}>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-end" }}>
                <Box>
                  <Typography color="text.secondary" sx={type.label}>{t("preview.beanTemperature")}</Typography>
                  <Typography sx={{ mt: .25, fontSize: "2.125rem", fontWeight: 760, letterSpacing: "-.03em", lineHeight: 1.1 }}>197.5°C</Typography>
                  <Typography sx={{ ...type.micro, color: "#C2410C", fontWeight: 700 }}>{t("preview.ror", { value: "6.2" })}</Typography>
                </Box>
                <Box sx={{ textAlign: "right" }}>
                  <Typography color="text.secondary" sx={type.label}>{t("preview.duration")}</Typography>
                  <Typography sx={{ ...type.body, mt: .25, fontWeight: 700 }}>10:02</Typography>
                  <Chip size="small" label={t("preview.autopilot")} sx={{ mt: .75, height: 24, fontSize: ".75rem", fontWeight: 750, letterSpacing: ".04em", bgcolor: "rgba(59,128,97,.12)", color: "primary.dark" }} />
                </Box>
              </Stack>
              <Box sx={{ mt: 3.5, height: 180, position: "relative", borderBottom: "1px solid #DEE9E2", backgroundImage: "linear-gradient(#EDF3EF 1px, transparent 1px)", backgroundSize: "100% 45px", overflow: "hidden" }}>
                <Box sx={{ position: "absolute", inset: "32% -8% 10% -5%", borderTop: "4px solid", borderColor: "primary.main", borderRadius: "50% 50% 0 0", transform: "rotate(-7deg)" }} />
                <Box sx={{ position: "absolute", inset: "12% -5% 36% -10%", borderBottom: "3px solid #E58A62", borderRadius: "0 0 50% 50%", transform: "rotate(5deg)" }} />
                <Box sx={{ position: "absolute", left: "80%", bottom: 0, height: "76%", borderLeft: "1px dashed #7A9A8B" }} />
              </Box>
              <Stack direction="row" spacing={1} sx={{ mt: 1.25, justifyContent: "space-between" }}>
                {["drying", "maillard", "development"].map((phase) => (
                  <Typography key={phase} color="text.secondary" sx={{ ...type.label, fontSize: ".75rem", letterSpacing: ".06em", textTransform: "uppercase" }}>
                    {t(`preview.phases.${phase}`)}
                  </Typography>
                ))}
              </Stack>
              <Stack direction="row" spacing={3} sx={{ mt: 1.5 }}>
                <Typography color="text.secondary" sx={type.label}><Box component="span" sx={{ display: "inline-block", width: 8, height: 8, mr: .75, borderRadius: "50%", bgcolor: "primary.main" }} />BT</Typography>
                <Typography color="text.secondary" sx={type.label}><Box component="span" sx={{ display: "inline-block", width: 8, height: 8, mr: .75, borderRadius: "50%", bgcolor: "#E58A62" }} />ET</Typography>
              </Stack>

              <Stack spacing={1.25} sx={{ mt: 3, pt: 2.5, borderTop: "1px solid", borderColor: "divider" }}>
                {controlBars.map(({ key, value, color }) => (
                  <Box key={key}>
                    <Stack direction="row" sx={{ justifyContent: "space-between", mb: .5 }}>
                      <Typography color="text.secondary" sx={type.label}>{t(`preview.controls.${key}`)}</Typography>
                      <Typography sx={{ ...type.label, fontWeight: 750 }}>{value}%</Typography>
                    </Stack>
                    <LinearProgress variant="determinate" value={value} sx={{ height: 5, borderRadius: 3, bgcolor: "rgba(26,58,52,.07)", "& .MuiLinearProgress-bar": { bgcolor: color, borderRadius: 3 } }} />
                  </Box>
                ))}
              </Stack>
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Nine-tone heat spectrum — the visual thread that runs through the product. */}
      <Box aria-hidden sx={{ display: "flex", height: 6 }}>
        {spectrum.map((color) => (
          <Box key={color} sx={{ flex: 1, bgcolor: color }} />
        ))}
      </Box>

      <Box sx={{ bgcolor: "#F3F7F4", py: { xs: 7, md: 9 } }}>
        <Container maxWidth="lg">
          <Typography component="p" color="text.secondary" sx={{ ...type.eyebrow, textAlign: "center", fontWeight: 700, letterSpacing: ".16em" }}>{t("proof.label")}</Typography>
          <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 4 }}>
            {proofStats.map((key) => (
              <Box key={key} sx={{ textAlign: "center" }}>
                <Typography sx={{ ...type.statValue, color: "primary.main" }}>{t(`proof.${key}.value`)}</Typography>
                <Typography color="text.secondary" sx={{ ...type.micro, mt: 1, letterSpacing: ".06em", textTransform: "uppercase" }}>{t(`proof.${key}.label`)}</Typography>
              </Box>
            ))}
          </Box>
          <Typography component="blockquote" sx={{ mt: 6, mx: "auto", maxWidth: 780, textAlign: "center", fontStyle: "italic", fontSize: { xs: "1.0625rem", md: "1.1875rem" }, lineHeight: 1.75, color: "text.primary" }}>
            {t("proof.quote")}
          </Typography>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box id="problem" sx={{ py: { xs: 8, md: 11 } }}>
          <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center" }}>
            <Typography component="p" sx={{ ...type.eyebrow, color: "error.main" }}>{t("problem.label")}</Typography>
            <Typography component="h2" sx={{ ...type.sectionTitle, mt: 1.5 }}>{t("problem.title")}</Typography>
            <Typography color="text.secondary" sx={{ ...type.lead, mt: 2 }}>{t("problem.subtitle")}</Typography>
          </Box>

          <Box sx={{ mt: 6, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" }, gap: 2.5 }}>
            {problems.map((key) => (
              <Box key={key} sx={{ p: 3.5, border: "1px solid", borderColor: "divider", borderRadius: 4, bgcolor: "background.paper" }}>
                <Typography sx={{ ...type.cardTitle }}>{t(`problem.${key}.pain`)}</Typography>
                <Typography sx={{ ...type.detail, mt: 1.5, color: "#B45309" }}>{t(`problem.${key}.cost`)}</Typography>
                <Typography sx={{ ...type.detail, mt: 1.5, color: "primary.main", fontWeight: 650 }}>{t(`problem.${key}.solution`)}</Typography>
              </Box>
            ))}
          </Box>

          <Typography sx={{ ...type.lead, mt: 5, textAlign: "center", fontStyle: "italic", color: "text.secondary" }}>{t("problem.closing")}</Typography>
        </Box>
      </Container>

      <Box sx={{ bgcolor: "primary.dark", color: "#FFFFFF", py: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center" }}>
            <Typography component="p" sx={{ ...type.eyebrow, color: "secondary.main" }}>{t("stats.label")}</Typography>
            <Typography component="h2" sx={{ ...type.sectionTitle, mt: 1.5 }}>{t("stats.title")}</Typography>
          </Box>
          <Box sx={{ mt: 6, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }, gap: 5 }}>
            {solutionStats.map(({ key, icon: Icon, value, color }) => (
              <Box key={key} sx={{ textAlign: { xs: "left", lg: "center" } }}>
                <Icon sx={{ color, fontSize: 30 }} />
                <Typography sx={{ ...type.micro, mt: 1.5, color: "rgba(255,255,255,.75)" }}>{t(`stats.${key}.title`)}</Typography>
                <Typography sx={{ ...type.statValue, mt: .5, color }}>{value}</Typography>
                <Typography sx={{ ...type.detail, mt: .75, color: "rgba(255,255,255,.66)" }}>{t(`stats.${key}.desc`)}</Typography>
                <Typography sx={{ ...type.detail, mt: 1.5, color: "rgba(255,255,255,.9)", fontWeight: 650 }}>{t(`stats.${key}.outcome`)}</Typography>
              </Box>
            ))}
          </Box>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box id="features" sx={{ py: { xs: 8, md: 11 } }}>
          <Box sx={{ maxWidth: 640, mx: "auto", textAlign: "center" }}>
            <Typography component="p" color="primary.main" sx={type.eyebrow}>{t("features.label")}</Typography>
            <Typography component="h2" sx={{ ...type.sectionTitle, mt: 1.5 }}>{t("features.title")}</Typography>
          </Box>
          <Box sx={{ mt: 6, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 5 }}>
            {features.map(({ key, icon: Icon, tags }) => (
              <Box key={key}>
                <Icon color="primary" />
                <Typography component="h3" sx={{ ...type.cardTitle, mt: 2, mb: 1 }}>{t(`features.${key}.title`)}</Typography>
                <Typography color="text.secondary" sx={type.detail}>{t(`features.${key}.description`)}</Typography>
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: "wrap", gap: 1 }}>
                  {tags.map((tag) => (
                    <Chip key={tag} size="small" variant="outlined" label={t(`features.tags.${tag}`)} sx={{ height: 26, fontSize: ".8125rem" }} />
                  ))}
                </Stack>
              </Box>
            ))}
          </Box>
        </Box>
      </Container>

      <Box id="pricing" sx={{ bgcolor: "#F3F7F4", py: { xs: 8, md: 11 } }}>
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 680, mx: "auto", textAlign: "center" }}>
            <Typography component="p" color="primary.main" sx={type.eyebrow}>{t("pricing.label")}</Typography>
            <Typography component="h2" sx={{ ...type.sectionTitle, mt: 1.5 }}>{t("pricing.title")}</Typography>
            <Typography color="text.secondary" sx={{ ...type.lead, mt: 2 }}>{t("pricing.subtitle")}</Typography>
          </Box>

          {/* One-off onboarding fee — applies to every tier. */}
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={{ xs: 1.5, md: 3 }}
            sx={{ mt: 5, p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", alignItems: { md: "center" } }}
          >
            <Box sx={{ flexShrink: 0 }}>
              <Typography sx={{ fontSize: "1.375rem", fontWeight: 780, letterSpacing: "-.02em", color: "primary.dark" }}>{t("pricing.onboarding.amount")}</Typography>
              <Typography sx={{ ...type.micro, color: "text.secondary" }}>{t("pricing.onboarding.label")}</Typography>
            </Box>
            <Divider flexItem orientation="vertical" sx={{ display: { xs: "none", md: "block" } }} />
            <Typography sx={{ ...type.detail, color: "text.secondary" }}>{t("pricing.onboarding.note")}</Typography>
          </Stack>

          {/* Capabilities every tier includes, stated once. */}
          <Box sx={{ mt: 2.5, p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 2 }}>
              <CheckIcon sx={{ fontSize: 18, color: "primary.main" }} />
              <Typography sx={{ ...type.micro, fontWeight: 750, letterSpacing: ".06em", textTransform: "uppercase" }}>{t("pricing.common.title")}</Typography>
            </Stack>
            <Box component="ul" sx={{ m: 0, p: 0, display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }, gap: 1.5 }}>
              {includedEverywhere.map((key) => (
                <Included key={key}>{t(`pricing.included.${key}`)}</Included>
              ))}
            </Box>
          </Box>

          <Box sx={{ mt: 4, display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 3, alignItems: "start" }}>
            {/* Basic — free, small MAROSA/LBN machines only. */}
            <Stack sx={{ p: 3.5, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", height: "100%" }}>
              <Chip size="small" label={t("pricing.basic.badge")} sx={{ alignSelf: "flex-start", fontSize: ".8125rem", fontWeight: 700, bgcolor: "rgba(59,128,97,.1)", color: "primary.dark" }} />
              <Typography component="h3" sx={{ ...type.cardTitle, mt: 2, fontSize: "1.375rem" }}>{t("pricing.basic.name")}</Typography>
              <Typography sx={{ ...type.micro, mt: .5, color: "primary.main", fontWeight: 700 }}>{t("pricing.basic.eligibility")}</Typography>
              <Typography sx={{ ...type.detail, mt: 1.5, color: "text.secondary" }}>{t("pricing.basic.description")}</Typography>

              <Stack direction="row" spacing={1} sx={{ mt: 3, alignItems: "baseline" }}>
                <Typography sx={{ fontSize: "2.4rem", fontWeight: 800, letterSpacing: "-.03em", color: "primary.main", lineHeight: 1 }}>0 ₫</Typography>
                <Typography sx={{ ...type.micro, color: "text.secondary" }}>{t("pricing.basic.priceUnit")}</Typography>
              </Stack>

              <Box sx={{ mt: 2.5, p: 2, borderRadius: 3, bgcolor: "#F3F7F4" }}>
                <Typography sx={{ ...type.micro, fontWeight: 750, letterSpacing: ".04em", textTransform: "uppercase" }}>{t("pricing.basic.quotaTitle")}</Typography>
                <Stack direction="row" sx={{ mt: 1.25, justifyContent: "space-between" }}>
                  <Typography sx={{ ...type.detail, color: "text.secondary" }}>{t("pricing.basic.quota15")}</Typography>
                  <Typography sx={{ ...type.detail, fontWeight: 700 }}>{t("pricing.basic.quota15Value")}</Typography>
                </Stack>
                <Stack direction="row" sx={{ mt: .5, justifyContent: "space-between" }}>
                  <Typography sx={{ ...type.detail, color: "text.secondary" }}>{t("pricing.basic.quota30")}</Typography>
                  <Typography sx={{ ...type.detail, fontWeight: 700 }}>{t("pricing.basic.quota30Value")}</Typography>
                </Stack>
                <Typography sx={{ ...type.micro, mt: 1.5, color: "text.secondary" }}>{t("pricing.basic.quotaNote")}</Typography>
              </Box>

              <Box component="ul" sx={{ m: 0, mt: 2.5, p: 0 }}>
                <Excluded>{t("pricing.basic.excluded")}</Excluded>
              </Box>
              <Button component={Link} to="#contact" variant="outlined" fullWidth sx={{ mt: 3, pt: 1.25, pb: 1.25 }}>{t("pricing.basic.cta")}</Button>
            </Stack>

            {/* Standard — the main tier, every capacity and brand. */}
            <Stack sx={{ p: 3.5, borderRadius: 4, border: "2px solid", borderColor: "primary.main", bgcolor: "background.paper", height: "100%", boxShadow: "0 24px 60px rgba(26,58,52,.1)" }}>
              <Chip size="small" label={t("pricing.standard.badge")} sx={{ alignSelf: "flex-start", fontSize: ".8125rem", fontWeight: 700, bgcolor: "primary.main", color: "#FFFFFF" }} />
              <Typography component="h3" sx={{ ...type.cardTitle, mt: 2, fontSize: "1.375rem" }}>{t("pricing.standard.name")}</Typography>
              <Typography sx={{ ...type.micro, mt: .5, color: "primary.main", fontWeight: 700 }}>{t("pricing.standard.eligibility")}</Typography>
              <Typography sx={{ ...type.detail, mt: 1.5, color: "text.secondary" }}>{t("pricing.standard.description")}</Typography>

              <Ladder rows={standardLadder} />

              <Box component="ul" sx={{ m: 0, mt: 2.5, p: 0, display: "grid", gap: 1.5 }}>
                <Included><Box component="strong" sx={{ fontWeight: 750 }}>{t("pricing.standard.unlimited")}</Box></Included>
                <Typography sx={{ ...type.micro, fontWeight: 750, color: "primary.dark", mt: .5 }}>{t("pricing.standard.fleetHeading")}</Typography>
                <Included>{t("pricing.standard.fleet1")}</Included>
                <Included>{t("pricing.standard.fleet2")}</Included>
                <Included>{t("pricing.standard.support")}</Included>
                <Excluded>{t("pricing.standard.excluded")}</Excluded>
              </Box>
              <Button component={Link} to="#contact" variant="contained" fullWidth sx={{ mt: 3, pt: 1.25, pb: 1.25 }}>{t("pricing.standard.cta")}</Button>
            </Stack>

            {/* Professional — 6 kg and up, whole-shift automation. */}
            <Stack sx={{ p: 3.5, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", height: "100%" }}>
              <Chip size="small" label={t("pricing.pro.badge")} sx={{ alignSelf: "flex-start", fontSize: ".8125rem", fontWeight: 700, bgcolor: "rgba(26,58,52,.08)", color: "primary.dark" }} />
              <Typography component="h3" sx={{ ...type.cardTitle, mt: 2, fontSize: "1.375rem" }}>{t("pricing.pro.name")}</Typography>
              <Typography sx={{ ...type.micro, mt: .5, color: "primary.main", fontWeight: 700 }}>{t("pricing.pro.eligibility")}</Typography>
              <Typography sx={{ ...type.detail, mt: 1.5, color: "text.secondary" }}>{t("pricing.pro.description")}</Typography>

              <Ladder rows={proLadder} quoteRow />

              <Box component="ul" sx={{ m: 0, mt: 2.5, p: 0, display: "grid", gap: 1.5 }}>
                <Typography sx={{ ...type.micro, fontWeight: 750, color: "primary.dark" }}>{t("pricing.pro.workflowHeading")}</Typography>
                <Included>{t("pricing.pro.wf1")}</Included>
                <Included>{t("pricing.pro.wf2")}</Included>
                <Included>{t("pricing.pro.wf3")}</Included>
                <Typography sx={{ ...type.micro, fontWeight: 750, color: "primary.dark", mt: .5 }}>{t("pricing.pro.inventoryHeading")}</Typography>
                <Included>{t("pricing.pro.inv1")}</Included>
                <Included>{t("pricing.pro.selfLearning")}</Included>
                <Included>{t("pricing.pro.support")}</Included>
              </Box>
              <Button component={Link} to="#contact" variant="outlined" fullWidth sx={{ mt: 3, pt: 1.25, pb: 1.25 }}>{t("pricing.pro.cta")}</Button>
            </Stack>
          </Box>

          {/* What one spoiled batch costs, against the subscription. */}
          <Box sx={{ mt: 4, p: { xs: 3, md: 4 }, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper" }}>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <WarningAmberOutlinedIcon sx={{ fontSize: 20, color: "#B45309" }} />
              <Typography component="h3" sx={{ ...type.cardTitle }}>{t("pricing.spoil.title")}</Typography>
            </Stack>
            <Typography sx={{ ...type.detail, mt: 1.5, color: "text.secondary" }}>{t("pricing.spoil.lead")}</Typography>
            <Box sx={{ mt: 2.5, overflowX: "auto" }}>
              <Box component="table" sx={{ width: "100%", minWidth: 560, borderCollapse: "collapse" }}>
                <Box component="thead">
                  <Box component="tr">
                    {["machine", "robusta", "arabica", "subscription"].map((column, index) => (
                      <Box component="th" key={column} sx={{ ...cellSx, ...type.label, color: "text.secondary", fontWeight: 700, textAlign: index === 0 ? "left" : "right" }}>
                        {t(`pricing.spoil.columns.${column}`)}
                      </Box>
                    ))}
                  </Box>
                </Box>
                <Box component="tbody">
                  {spoilRows.map((row) => (
                    <Box component="tr" key={row.machine}>
                      <Box component="td" sx={{ ...cellSx, ...type.detail, fontWeight: 700 }}>{row.machine}</Box>
                      <Box component="td" sx={{ ...cellSx, ...type.detail, textAlign: "right" }}>{row.robusta}</Box>
                      <Box component="td" sx={{ ...cellSx, ...type.detail, textAlign: "right" }}>{row.arabica}</Box>
                      <Box component="td" sx={{ ...cellSx, ...type.detail, textAlign: "right", color: "primary.main", fontWeight: 700 }}>
                        {t("pricing.spoil.perMonth", { amount: row.subscription })}
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            <Typography sx={{ ...type.detail, mt: 2, color: "text.secondary" }}>{t("pricing.spoil.note")}</Typography>
          </Box>

          {/* Bridge Kit and custom integration. */}
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5} sx={{ mt: 2.5, p: 3, borderRadius: 4, border: "1px solid", borderColor: "divider", bgcolor: "background.paper", alignItems: { md: "center" } }}>
            <Inventory2OutlinedIcon sx={{ color: "primary.main" }} />
            <Box sx={{ flex: 1 }}>
              <Typography component="h3" sx={{ ...type.cardTitle, fontSize: "1.0625rem" }}>{t("pricing.custom.title")}</Typography>
              <Typography sx={{ ...type.detail, mt: .75, color: "text.secondary" }}>{t("pricing.custom.description")}</Typography>
            </Box>
            <Button component={Link} to="#contact" variant="outlined" color="inherit" sx={{ flexShrink: 0 }}>{t("pricing.custom.cta")}</Button>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg">
        <Box id="faq" sx={{ py: { xs: 8, md: 11 }, maxWidth: 880, mx: "auto" }}>
          <Box sx={{ textAlign: "center", mb: 5 }}>
            <Typography component="p" color="primary.main" sx={type.eyebrow}>{t("faq.label")}</Typography>
            <Typography component="h2" sx={{ ...type.sectionTitle, mt: 1.5 }}>{t("faq.title")}</Typography>
            <Typography color="text.secondary" sx={{ ...type.lead, mt: 2 }}>{t("faq.subtitle")}</Typography>
          </Box>
          {faqs.map((key) => (
            <Accordion key={key} disableGutters elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, mb: 1.5, bgcolor: "background.paper", "&::before": { display: "none" } }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: .5 }}>
                <Typography sx={{ ...type.body, fontWeight: 680 }}>{t(`faq.${key}.q`)}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography color="text.secondary" sx={type.detail}>{t(`faq.${key}.a`)}</Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>

      <Box id="contact" sx={{ bgcolor: "#F3F7F4", py: { xs: 8, md: 11 } }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: "center", maxWidth: 660, mx: "auto" }}>
            <Chip size="small" label={t("cta.badge")} sx={{ fontSize: ".8125rem", fontWeight: 700, letterSpacing: ".04em", bgcolor: "rgba(59,128,97,.12)", color: "primary.dark" }} />
            <Typography component="h2" sx={{ ...type.sectionTitle, mt: 2, fontSize: { xs: "1.9rem", md: "2.4rem" } }}>{t("cta.title")}</Typography>
            <Typography color="text.secondary" sx={{ ...type.lead, mt: 2 }}>{t("cta.subtitle")}</Typography>
          </Box>

          <Box sx={{ mt: 5, p: { xs: 3, md: 5 }, border: "1px solid", borderColor: "divider", borderRadius: 5, bgcolor: "background.paper", display: "grid", gridTemplateColumns: { xs: "1fr", md: "auto 1fr" }, gap: { xs: 4, md: 6 }, alignItems: "start" }}>
            <Box sx={{ textAlign: "center" }}>
              <Box component="img" src="/zalo-oa.jpg" alt={t("cta.qrAlt")} width={200} height={200} loading="lazy" sx={{ width: 200, height: 200, borderRadius: 4, border: "1px solid", borderColor: "divider" }} />
              <Typography color="text.secondary" sx={{ ...type.micro, mt: 1.5 }}>{t("cta.qrCaption")}</Typography>
            </Box>
            <Box>
              <Typography component="p" color="primary.main" sx={type.eyebrow}>{t("cta.channel")}</Typography>
              <Typography component="h3" sx={{ ...type.cardTitle, mt: 1, fontSize: "1.3125rem" }}>{t("cta.contactTitle")}</Typography>
              <Typography color="text.secondary" sx={{ ...type.detail, mt: 1.5 }}>{t("cta.contactDescription")}</Typography>
              <Stack spacing={2} sx={{ mt: 3 }}>
                {ctaSteps.map(({ key, icon: Icon }) => (
                  <Stack key={key} direction="row" spacing={1.5} sx={{ alignItems: "flex-start" }}>
                    <Icon color="primary" sx={{ fontSize: 20, mt: .3 }} />
                    <Typography sx={type.detail}>
                      <Box component="strong" sx={{ fontWeight: 720 }}>{t(`cta.steps.${key}.title`)}</Box>
                      {" — "}
                      {t(`cta.steps.${key}.description`)}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 4 }}>
                <Button href={ZALO_URL} target="_blank" rel="noopener" variant="contained" startIcon={<ChatBubbleOutlineOutlinedIcon />}>{t("cta.zalo")}</Button>
                <Button href={TIKTOK_URL} target="_blank" rel="noopener" variant="outlined" color="inherit" startIcon={<SpeedOutlinedIcon />}>{t("cta.tiktok")}</Button>
                <Button component={Link} to="/login?mode=signup" color="primary">{t("start")}</Button>
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      <Box component="footer" sx={{ py: 5 }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: "center", justifyContent: "space-between" }}>
            <Typography color="text.secondary" sx={type.detail}>{t("footer.tagline")}</Typography>
            <Typography color="text.secondary" sx={type.micro}>{t("footer.rights", { year: new Date().getFullYear() })}</Typography>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
