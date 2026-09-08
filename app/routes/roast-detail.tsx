import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import PrintIcon from "@mui/icons-material/Print";
import ScheduleIcon from "@mui/icons-material/Schedule";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { useRoasts } from "~/contexts/roast-context";
import type { RoastMilestone } from "~/lib/roasts";

export function meta() {
  return [{ title: "Roast detail | MAROSA" }];
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="caption" color="text.secondary">{label}</Typography>
      <Typography component="dd" variant="body2" sx={{ mt: 0.5, ml: 0, fontWeight: 650 }}>{children}</Typography>
    </Box>
  );
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

export default function RoastDetailPage() {
  const { t, i18n } = useTranslation(["roastDetail", "inbox", "common"]);
  const { roastId } = useParams();
  const navigate = useNavigate();
  const { roasts, toggleStar, deleteRoasts } = useRoasts();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const roast = roasts.find((item) => item.id === roastId);

  if (!roast || !roastId) return <Navigate to="/app" replace />;

  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";
  const shrinkage = ((roast.startingMassKg - roast.endingMassKg) / roast.startingMassKg) * 100;
  const money = new Intl.NumberFormat(locale, { style: "currency", currency: "VND", maximumFractionDigits: 0 });
  const levelKey = { LIGHT: "light", MEDIUM_LIGHT: "mediumLight", MEDIUM: "medium", DARK: "dark" }[roast.roastLevel]!;

  function milestone(value: RoastMilestone | null) {
    return value ? `${value.temperature.toFixed(1)} °C · ${formatDuration(value.seconds)}` : t("notRecorded");
  }

  function downloadProfile() {
    if (!roast?.profileAvailable) return;
    const content = JSON.stringify({ roastId: roast.id, recipe: roast.recipeName, roastedAt: roast.roastedAt, machine: roast.machine, profile: roast.profile }, null, 2);
    const url = URL.createObjectURL(new Blob([content], { type: "application/json" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${roast.id}.alog`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function confirmDelete() {
    deleteRoasts([roastId!]);
    navigate("/app");
  }

  return (
    <>
      <Button component={Link} to="/app" color="inherit" startIcon={<ArrowBackIcon />} sx={{ mb: 2, ml: -1 }}>{t("back")}</Button>

      <Stack direction={{ xs: "column", md: "row" }} sx={{ mb: 3.5, justifyContent: "space-between", alignItems: { md: "flex-end" }, gap: 2 }}>
        <Box>
          <Stack direction="row" sx={{ alignItems: "center", gap: 1 }}>
            <IconButton color={roast.starred ? "warning" : "default"} aria-label={roast.starred ? t("inbox:unstar", { name: roast.recipeName }) : t("inbox:star", { name: roast.recipeName })} onClick={() => toggleStar(roast.id)}>
              {roast.starred ? <StarIcon /> : <StarBorderIcon />}
            </IconButton>
            <Box>
              <Typography component="h1" variant="h4">{roast.recipeName}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, fontFamily: "monospace" }}>{roast.id}</Typography>
            </Box>
          </Stack>
        </Box>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button disabled={!roast.profileAvailable} variant="contained" startIcon={<DownloadIcon />} onClick={downloadProfile}>{t("actions.download")}</Button>
          <Tooltip title={t("editUnavailable")}><span><Button disabled variant="outlined" startIcon={<EditOutlinedIcon />}>{t("actions.edit")}</Button></span></Tooltip>
          <Button variant="outlined" color="inherit" startIcon={<PrintIcon />} onClick={() => window.print()}>{t("actions.print")}</Button>
          <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteOpen(true)}>{t("actions.delete")}</Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 3 }}>
        <Card>
          <CardHeader avatar={<InfoOutlinedIcon color="primary" />} title={t("generalInformation")} slotProps={{ title: { variant: "h6" } }} />
          <Divider />
          <CardContent component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <DetailItem label={t("recipe")}>{roast.recipeName}</DetailItem>
            <DetailItem label={t("components")}>{roast.components.map((component) => `${component.name} ${component.percentage}%`).join(" · ")}</DetailItem>
            <DetailItem label={t("startingMass")}>{roast.startingMassKg.toLocaleString(locale)} kg</DetailItem>
            <DetailItem label={t("endingMass")}>{roast.endingMassKg.toLocaleString(locale)} kg</DetailItem>
            <DetailItem label={t("shrinkage")}>{shrinkage.toLocaleString(locale, { maximumFractionDigits: 2 })}%</DetailItem>
            <DetailItem label={t("greenCost")}>{roast.greenCostPerKg == null ? t("notRecorded") : `${money.format(roast.greenCostPerKg)} / kg`}</DetailItem>
            <DetailItem label={t("totalCost")}>{roast.greenCostPerKg == null ? t("notRecorded") : money.format(roast.greenCostPerKg * roast.startingMassKg)}</DetailItem>
            <DetailItem label={t("roastedOn")}>{new Intl.DateTimeFormat(locale, { dateStyle: "full", timeStyle: "short" }).format(new Date(roast.roastedAt))}</DetailItem>
            <DetailItem label={t("roastedBy")}>{roast.roastedBy}</DetailItem>
            <DetailItem label={t("roaster")}>{roast.machine}</DetailItem>
            <DetailItem label={t("status")}><Chip size="small" color={roast.status === "COMPLETED" ? "success" : "warning"} variant="outlined" label={roast.status === "COMPLETED" ? t("inbox:status.completed") : t("inbox:status.needsReview")} /></DetailItem>
          </CardContent>
        </Card>

        <Card>
          <CardHeader avatar={<ScheduleIcon color="primary" />} title={t("milestones")} slotProps={{ title: { variant: "h6" } }} />
          <Divider />
          <CardContent component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2.5 }}>
            <DetailItem label={t("charge")}>{milestone(roast.milestones.charge)}</DetailItem>
            <DetailItem label={t("turningPoint")}>{milestone(roast.milestones.turningPoint)}</DetailItem>
            <DetailItem label={t("dryEnd")}>{milestone(roast.milestones.dryEnd)}</DetailItem>
            <DetailItem label={t("firstCrackStart")}>{milestone(roast.milestones.firstCrackStart)}</DetailItem>
            <DetailItem label={t("secondCrackStart")}>{milestone(roast.milestones.secondCrackStart)}</DetailItem>
            <DetailItem label={t("drop")}>{milestone(roast.milestones.drop)}</DetailItem>
            <DetailItem label={t("roastTime")}>{formatDuration(roast.milestones.drop.seconds)}</DetailItem>
            <DetailItem label={t("developmentRatio")}>{roast.developmentRatio.toLocaleString(locale)}%</DetailItem>
            <DetailItem label={t("roastLevel")}>{t(`level.${levelKey}`)}</DetailItem>
          </CardContent>
        </Card>
      </Box>

      <Card sx={{ mt: 3 }}>
        <CardHeader title={t("profileTitle")} subheader={t("profileDescription")} slotProps={{ title: { variant: "h6" } }} />
        <Divider />
        <CardContent>
          {!roast.profileAvailable ? (
            <Alert severity="info">{t("noProfile")}</Alert>
          ) : (
            <>
              <Box sx={{ overflowX: "auto" }}><Box sx={{ minWidth: 720, width: "100%" }}>
                <LineChart
                  dataset={roast.profile}
                  height={400}
                  margin={{ left: 65, right: 65, top: 40, bottom: 50 }}
                  xAxis={[{ dataKey: "seconds", scaleType: "linear", label: t("chart.time"), valueFormatter: (value) => formatDuration(Number(value)) }]}
                  yAxis={[
                    { id: "temperature", position: "left", min: 70, max: 240, label: t("chart.temperature") },
                    { id: "ror", position: "right", min: 0, max: 22, label: "RoR (°C/min)" },
                  ]}
                  series={[
                    { dataKey: "beanTemperature", yAxisId: "temperature", label: t("chart.beanTemperature"), color: "#009688", showMark: false, curve: "monotoneX" },
                    { dataKey: "exhaustTemperature", yAxisId: "temperature", label: t("chart.exhaustTemperature"), color: "#FF5252", showMark: false, curve: "monotoneX" },
                    { dataKey: "rateOfRise", yAxisId: "ror", label: t("chart.rateOfRise"), color: "#448AFF", showMark: false, curve: "monotoneX" },
                  ]}
                  grid={{ horizontal: true, vertical: true }}
                />
              </Box></Box>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>{t("chart.percent")}</Typography>
              <Box sx={{ overflowX: "auto" }}><Box sx={{ minWidth: 720, width: "100%" }}>
                <LineChart
                  dataset={roast.profile}
                  height={220}
                  margin={{ left: 65, right: 25, top: 30, bottom: 45 }}
                  xAxis={[{ dataKey: "seconds", scaleType: "linear", label: t("chart.time"), valueFormatter: (value) => formatDuration(Number(value)) }]}
                  yAxis={[{ min: 0, max: 100, label: t("chart.percent") }]}
                  series={[
                    { dataKey: "burner", label: t("chart.burner"), color: "#FF9800", showMark: false, curve: "stepAfter" },
                    { dataKey: "air", label: t("chart.air"), color: "#26C6DA", showMark: false, curve: "stepAfter" },
                    { dataKey: "drum", label: t("chart.drum"), color: "#3B8061", showMark: false, curve: "stepAfter" },
                  ]}
                  grid={{ horizontal: true }}
                />
              </Box></Box>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("deleteTitle", { id: roast.id })}</DialogTitle>
        <DialogContent><DialogContentText>{t("deleteDescription")}</DialogContentText></DialogContent>
        <DialogActions><Button color="inherit" onClick={() => setDeleteOpen(false)}>{t("common:actions.cancel")}</Button><Button color="error" variant="contained" onClick={confirmDelete}>{t("common:actions.delete")}</Button></DialogActions>
      </Dialog>
    </>
  );
}
