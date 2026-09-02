import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import PrintOutlinedIcon from "@mui/icons-material/PrintOutlined";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { RadarChart } from "@mui/x-charts/RadarChart";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLoaderData } from "react-router";
import { getCuppingResults, getCuppingSession } from "~/lib/backend.server";
import {
  attributeLabelKey,
  averageOf,
  formatScore,
  parseReportFields,
  radarAttributes,
  reportValues,
  scoreColumns,
} from "~/lib/cupping-report";
import type { Route } from "./+types/cupping-report";

export function meta() {
  return [{ title: "Cupping report | MAROSA" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const [session, results] = await Promise.all([
    getCuppingSession(request, params.sessionId),
    getCuppingResults(request, params.sessionId),
  ]);
  const sample = results.find((item) => item.id === params.sampleId);
  if (!sample) throw new Response("Not found.", { status: 404 });
  return {
    session,
    sample,
    fields: parseReportFields(new URL(request.url).searchParams),
  };
}

export default function CuppingReportPage() {
  const { session, sample, fields } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation(["cupping", "common"]);
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";

  const [showCuppers, setShowCuppers] = useState(false);
  const [hideTotal, setHideTotal] = useState(false);
  const [toast, setToast] = useState("");

  const values = reportValues(sample, session.startsAt, locale);
  const scores = sample.scores.map((entry) => entry.score);

  /** One radar ring: the table's mean on each of the seven attributes. */
  const radarData = radarAttributes.map(
    ({ key }) => averageOf(scores.map((score) => Number(score[key]))) ?? 0,
  );
  const descriptors = sample.scores.flatMap((entry) => entry.score.descriptors);
  const descriptorAttributes = [...new Set(descriptors.map((item) => item.attribute))];
  const [hiddenAttributes, setHiddenAttributes] = useState<Record<string, boolean>>({});

  function cupperLabel(index: number) {
    const scorer = sample.scores[index]?.scorer;
    if (showCuppers && scorer) return scorer.name || scorer.email;
    return t("review.cupperNumber", { number: index + 1 });
  }

  async function share() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setToast(t("review.linkCopied"));
    } catch {
      setToast(t("review.linkCopyFailed"));
    }
  }

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ mb: 2, justifyContent: "space-between", alignItems: { md: "center" }, gap: 1 }}
      >
        <Stack direction="row" sx={{ ml: -1, flexWrap: "wrap", gap: 0.5 }}>
          <Button component={Link} to="/cupping" color="inherit" startIcon={<ArrowCircleLeftOutlinedIcon />} sx={{ color: "text.primary" }}>
            {t("review.backToSessions")}
          </Button>
          <Button
            component={Link}
            to={`/cupping/${session.id}/samples`}
            color="inherit"
            startIcon={<ArrowCircleLeftOutlinedIcon />}
            sx={{ color: "text.primary" }}
          >
            {t("review.goToSampleInformation")}
          </Button>
          <Button
            component={Link}
            to={`/cupping/${session.id}/review`}
            color="inherit"
            startIcon={<ArrowCircleLeftOutlinedIcon />}
            sx={{ color: "text.primary" }}
          >
            {t("report.goToSampleReview")}
          </Button>
        </Stack>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }} className="no-print">
          <Button
            variant="contained"
            startIcon={showCuppers ? <VisibilityOffOutlinedIcon /> : <VisibilityOutlinedIcon />}
            onClick={() => setShowCuppers((current) => !current)}
          >
            {showCuppers ? t("report.hideCupper") : t("report.showCupper")}
          </Button>
          <Button variant="contained" color="inherit" startIcon={<ShareOutlinedIcon />} onClick={() => void share()}>
            {t("report.share")}
          </Button>
          <Button variant="contained" color="inherit" startIcon={<PrintOutlinedIcon />} onClick={() => window.print()}>
            {t("report.print")}
          </Button>
        </Stack>
      </Stack>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, gap: 1, mb: 2 }}
      >
        <Typography variant="body2" color="text.secondary">
          {t("report.cuppedUsing")}{" "}
          <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
            {t("cup.formName", { protocol: t(`protocol.${session.protocol}`) })}
          </Box>
        </Typography>
        <FormControlLabel
          className="no-print"
          control={<Switch size="small" checked={hideTotal} onChange={(event) => setHideTotal(event.target.checked)} />}
          label={<Typography variant="caption">{t("report.hideTotalScore")}</Typography>}
        />
      </Stack>

      <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 1fr) 260px" }, gap: 3 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
              gap: 2.5,
            }}
          >
            {fields.map((key) => (
              <Box key={key}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {t(attributeLabelKey(key), { defaultValue: key })}
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 600, color: values[key] ? "primary.main" : "text.secondary" }}>
                  {values[key] || "-"}
                </Typography>
              </Box>
            ))}
          </Box>
          {!hideTotal && (
            <Box
              sx={{
                bgcolor: "rgba(59,128,97,.08)",
                borderRadius: 2,
                p: 3,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 700 }}>
                {t("report.totalScore")}
              </Typography>
              <Typography variant="h4" color="primary" sx={{ fontWeight: 750 }}>
                {formatScore(sample.averageScore)}
              </Typography>
            </Box>
          )}
        </Box>
      </Card>

      <Typography sx={{ fontWeight: 700, mb: 1 }}>{t("report.cuppingResult")}</Typography>
      <Card sx={{ p: { xs: 2, md: 3 }, mb: 2 }}>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, alignItems: "center" }}>
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>
              {t("report.descriptors")}
            </Typography>
            {descriptorAttributes.length ? (
              <>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 1.5 }} className="no-print">
                  {descriptorAttributes.map((attribute) => (
                    <FormControlLabel
                      key={attribute}
                      control={
                        <Switch
                          size="small"
                          checked={!hiddenAttributes[attribute]}
                          onChange={(event) =>
                            setHiddenAttributes((current) => ({
                              ...current,
                              [attribute]: !event.target.checked,
                            }))
                          }
                        />
                      }
                      label={<Typography variant="caption">{t(`cup.attributes.${attribute}`)}</Typography>}
                    />
                  ))}
                </Stack>
                <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
                  {descriptors
                    .filter((item) => !hiddenAttributes[item.attribute])
                    .map((item, index) => (
                      <Chip key={`${item.attribute}-${item.descriptor}-${index}`} size="small" label={item.descriptor} />
                    ))}
                </Stack>
              </>
            ) : (
              <Typography variant="body2" color="text.secondary" sx={{ fontStyle: "italic" }}>
                {t("report.noDescriptors")}
              </Typography>
            )}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <RadarChart
              height={320}
              series={[{ label: t("report.averageSeries"), data: radarData }]}
              radar={{
                max: 10,
                metrics: radarAttributes.map(({ labelKey }) => t(labelKey)),
              }}
              hideLegend
            />
          </Box>
        </Box>
      </Card>

      <Typography sx={{ fontWeight: 700, mb: 1 }}>{t("report.sessionDetails")}</Typography>
      <Card sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
          {t("report.cuppingScores")}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>{t("review.cupper")}</TableCell>
                {scoreColumns.map((column) => (
                  <TableCell key={column.abbr} align="center" sx={{ fontWeight: 700 }}>
                    {column.abbr}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sample.scores.map((entry, index) => (
                <TableRow key={entry.score.id}>
                  <TableCell>{cupperLabel(index)}</TableCell>
                  {scoreColumns.map((column) => (
                    <TableCell key={column.abbr} align="center" sx={{ color: "primary.main" }}>
                      {column.abbr === "TS" && hideTotal ? "—" : formatScore(column.value(entry.score))}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, fontStyle: "italic" }}>
          {scoreColumns.map((column) => `${column.abbr}: ${t(column.labelKey)}`).join(" · ")}
        </Typography>

        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.5 }}>
          {t("report.notes")}
        </Typography>
        {sample.scores.some((entry) => entry.score.notes) ? (
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
            {sample.scores.map((entry, index) =>
              entry.score.notes ? (
                <Typography key={entry.score.id} component="li" variant="body2">
                  <Box component="span" sx={{ fontWeight: 700 }}>
                    {cupperLabel(index)}:
                  </Box>{" "}
                  {entry.score.notes}
                </Typography>
              ) : null,
            )}
          </Stack>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("review.noNotesYet")}
          </Typography>
        )}
      </Card>

      {!sample.scores.length && (
        <Alert severity="info" sx={{ mt: 2 }}>
          {t("review.nothingScored")}
        </Alert>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" onClose={() => setToast("")}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}
