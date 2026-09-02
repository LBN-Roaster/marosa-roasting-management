import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import ShareOutlinedIcon from "@mui/icons-material/ShareOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigate, useNavigation, useSubmit } from "react-router";
import { ReportFieldsDialog } from "~/components/cupping-report-fields-dialog";
import { requireUser } from "~/lib/auth.server";
import {
  deleteMyCuppingScore,
  getCuppingResults,
  getCuppingSession,
  type CuppingCupperScore,
} from "~/lib/backend.server";
import {
  averageOf,
  formatScore,
  reportAttributes,
  serializeReportFields,
} from "~/lib/cupping-report";
import type { Route } from "./+types/cupping-review";

export function meta() {
  return [{ title: "Cupping summary | MAROSA" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const [user, session, results] = await Promise.all([
    requireUser(request),
    getCuppingSession(request, params.sessionId),
    getCuppingResults(request, params.sessionId),
  ]);
  return { session, results, viewerEmail: user.email };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  try {
    await deleteMyCuppingScore(request, params.sessionId, String(formData.get("sampleId")));
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
  return { deleted: true };
}

function cupperName(entry: CuppingCupperScore, fallback: string) {
  return entry.scorer?.name || entry.scorer?.email || fallback;
}

/** One label/value line in the session and attribute tables. */
function InfoRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Stack
      direction="row"
      sx={{
        px: 2,
        py: 1.25,
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: 1,
        borderColor: "divider",
        "&:last-of-type": { borderBottom: 0 },
      }}
    >
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Box sx={{ textAlign: "right" }}>{children}</Box>
    </Stack>
  );
}

/** The five poured cups, filled up to the score's clean-cup count. */
function CupMarks({ cups, total }: { cups: number; total: number }) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
      {Array.from({ length: total }, (_, index) => (
        <LocalCafeIcon
          key={index}
          sx={{ fontSize: 18, color: index < cups ? "primary.main" : "action.disabled" }}
        />
      ))}
    </Stack>
  );
}

export default function CuppingReviewPage() {
  const { session, results, viewerEmail } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t, i18n } = useTranslation(["cupping", "common"]);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";

  const scored = results.filter((sample) => sample.scores.length > 0);
  const [selectedId, setSelectedId] = useState(scored[0]?.id ?? "");
  const sample = scored.find((item) => item.id === selectedId) ?? scored[0];
  const [excluded, setExcluded] = useState<Record<string, boolean>>({});
  const [pickerOpen, setPickerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (actionData?.deleted) setToast(t("review.deleted"));
    if (actionData?.failed) setToast(t("review.deleteFailed"));
  }, [actionData, t]);

  if (!sample) {
    return (
      <>
        <Button
          component={Link}
          to="/cupping"
          color="inherit"
          startIcon={<ArrowCircleLeftOutlinedIcon />}
          sx={{ mb: 2, ml: -1, color: "text.primary" }}
        >
          {t("form.back")}
        </Button>
        <Alert severity="info">{t("review.nothingScored")}</Alert>
      </>
    );
  }

  // Toggling a cupper off leaves them on the table but out of the numbers, so
  // an outlying score can be set aside without deleting it.
  const included = sample.scores.filter((entry) => !excluded[entry.score.id]);
  const summarised = included.length ? included : sample.scores;
  const average = averageOf(summarised.map((entry) => entry.score.totalScore));
  // One agreed roast level prints as itself; nobody recording one prints as a
  // blank, and only a genuine disagreement reads as mixed.
  const roastLevels = [...new Set(summarised.map((entry) => entry.score.roastLevel).filter(Boolean))];
  const mine = sample.scores.find((entry) => entry.scorer?.email === viewerEmail);
  const busy = navigation.state !== "idle";

  /** Mean of one attribute across the cuppers still switched on. */
  function attribute(pick: (score: (typeof summarised)[number]["score"]) => number) {
    return averageOf(summarised.map((entry) => pick(entry.score)));
  }

  function openReport(fields: string[]) {
    const query = serializeReportFields(fields);
    void navigate(`/cupping/${session.id}/report/${sample.id}?fields=${encodeURIComponent(query)}`);
  }

  async function shareReport() {
    const url = `${window.location.origin}/cupping/${session.id}/report/${sample.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setToast(t("review.linkCopied"));
    } catch {
      setToast(t("review.linkCopyFailed"));
    }
  }

  const cupsPerSample = session.cupsPerSample;

  return (
    <>
      <Stack direction="row" sx={{ mb: 2, ml: -1, flexWrap: "wrap", gap: 0.5 }}>
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
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px minmax(0, 1fr)" }, gap: 2, alignItems: "start" }}>
        <Stack spacing={1}>
          {scored.map((item) => {
            const active = item.id === sample.id;
            return (
              <Card
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  display: "flex",
                  gap: 1,
                  justifyContent: "space-between",
                  borderColor: active ? "primary.main" : undefined,
                  bgcolor: active ? "rgba(59,128,97,.06)" : undefined,
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: active ? "primary.main" : undefined }}>
                    {item.ordinal}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {item.label}
                    {item.sampleName ? ` - ${item.sampleName}` : ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[item.species, item.sampleType].filter(Boolean).join(" | ") || "-"}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", flexShrink: 0 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {t("review.avgScore")}
                  </Typography>
                  <Typography sx={{ fontWeight: 750, color: "primary.main" }}>
                    {formatScore(item.averageScore)}
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Stack>

        <Box>
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1, mb: 2 }}>
            {sample.scores.map((entry, index) => {
              const on = !excluded[entry.score.id];
              const name = cupperName(entry, t("review.cupperNumber", { number: index + 1 }));
              return (
                <Stack
                  key={entry.score.id}
                  direction="row"
                  spacing={1}
                  sx={{
                    alignItems: "center",
                    border: 1,
                    borderColor: on ? "primary.main" : "divider",
                    borderRadius: 999,
                    pl: 0.5,
                    pr: 1.5,
                    py: 0.5,
                    bgcolor: on ? "rgba(59,128,97,.06)" : undefined,
                  }}
                >
                  <Switch
                    size="small"
                    checked={on}
                    slotProps={{ input: { "aria-label": t("review.includeCupper", { name }) } }}
                    onChange={(event) =>
                      setExcluded((current) => ({ ...current, [entry.score.id]: !event.target.checked }))
                    }
                  />
                  <Avatar src={entry.scorer?.picture ?? undefined} sx={{ width: 28, height: 28, fontSize: 13 }}>
                    {name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.2 }}>
                      {entry.scorer?.id === session.owner.id ? t("review.sessionOwner") : t("review.cupper")}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                      {name}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      borderRadius: 999,
                      px: 1.25,
                      py: 0.25,
                      fontWeight: 700,
                      fontSize: 13,
                    }}
                  >
                    {formatScore(entry.score.totalScore)}
                  </Box>
                </Stack>
              );
            })}
          </Stack>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" }, gap: 1.5, mb: 3 }}>
            <Button
              component={Link}
              to={`/cupping/${session.id}/cup`}
              variant="outlined"
              color="inherit"
              startIcon={<EditOutlinedIcon />}
            >
              {t("review.editSummary")}
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<VisibilityOutlinedIcon />} onClick={() => setPickerOpen(true)}>
              {t("review.seeReport")}
            </Button>
            <Button variant="outlined" color="inherit" startIcon={<ShareOutlinedIcon />} onClick={() => void shareReport()}>
              {t("review.shareReport")}
            </Button>
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteOutlineIcon />}
              disabled={!mine || busy}
              onClick={() => setConfirmDelete(true)}
            >
              {t("review.deleteResult")}
            </Button>
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 3, mb: 3 }}>
            <Box>
              <Typography sx={{ fontWeight: 750 }}>
                {session.name}{" "}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                  ({sample.label})
                </Box>
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("review.cuppingProtocol")}{" "}
                <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
                  {t(`protocol.${session.protocol}`)}
                </Box>
              </Typography>
              <Typography variant="body2" color="primary" sx={{ mb: 1.5 }}>
                {session.comboCupping ? t("review.comboCupping") : t("review.regularCupping")}
              </Typography>
              <Card sx={{ maxWidth: 360 }}>
                <InfoRow label={t("sampleFields.referenceNumber")}>
                  <Typography variant="body2">{sample.details.referenceNumber || "-"}</Typography>
                </InfoRow>
                <InfoRow label={t("review.sessionId")}>
                  <Typography variant="body2" color="primary">{session.reference}</Typography>
                </InfoRow>
                <InfoRow label={t("sampleFields.country")}>
                  <Typography variant="body2">{sample.details.country || "-"}</Typography>
                </InfoRow>
                <InfoRow label={t("sampleFields.sampleType")}>
                  <Typography variant="body2">{sample.sampleType || "-"}</Typography>
                </InfoRow>
                <InfoRow label={t("review.averageScore")}>
                  <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>
                    {formatScore(average)}
                  </Typography>
                </InfoRow>
                <InfoRow label={t("sampleFields.salesContract")}>
                  <Typography variant="body2">{sample.details.salesContract || "-"}</Typography>
                </InfoRow>
                <InfoRow label={t("sampleFields.purchaseContract")}>
                  <Typography variant="body2">{sample.details.purchaseContract || "-"}</Typography>
                </InfoRow>
                <InfoRow label={t("review.status")}>
                  <Typography variant="body2">
                    {t("review.scoredBy", { count: sample.scores.length })}
                  </Typography>
                </InfoRow>
              </Card>
            </Box>
            <Box>
              <Typography sx={{ fontWeight: 700, mb: 1 }}>{t("review.producerNotes")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sample.details.notesAndRemarks || t("review.noNotesYet")}
              </Typography>
            </Box>
          </Box>

          <Typography sx={{ fontWeight: 750, mb: 1 }}>{t("review.sampleTypeInformation")}</Typography>
          <Card>
            <InfoRow label={t("cup.roastLevel")}>
              {roastLevels.length === 1 ? (
                <Stack direction="row" spacing={0.75} sx={{ alignItems: "center" }}>
                  <CoffeeOutlinedIcon fontSize="small" sx={{ color: "primary.main" }} />
                  <Typography variant="body2">{t(`cup.roastLevels.${roastLevels[0]}`)}</Typography>
                </Stack>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  {roastLevels.length ? t("review.mixed") : "-"}
                </Typography>
              )}
            </InfoRow>
            <InfoRow label={t("review.numberOfCups")}>
              <Typography variant="body2" color="primary">{cupsPerSample}</Typography>
            </InfoRow>
            {(
              [
                ["FRAGRANCE", (score: typeof summarised[number]["score"]) => score.fragranceScore],
                ["ACIDITY", (score: typeof summarised[number]["score"]) => score.acidityScore],
                ["BODY", (score: typeof summarised[number]["score"]) => score.bodyScore],
                ["FLAVOR", (score: typeof summarised[number]["score"]) => score.flavorScore],
                ["AFTERTASTE", (score: typeof summarised[number]["score"]) => score.aftertasteScore],
                ["BALANCE", (score: typeof summarised[number]["score"]) => score.balanceScore],
              ] as const
            ).map(([key, pick]) => (
              <InfoRow key={key} label={t(`cup.attributes.${key}`)}>
                <Typography variant="body2" color="primary">{formatScore(attribute(pick))}</Typography>
              </InfoRow>
            ))}
            <InfoRow label={t("cup.overall")}>
              <Typography variant="body2" color="primary">
                {formatScore(attribute((score) => score.overallScore))}
              </Typography>
            </InfoRow>
            {(
              [
                ["uniformity", (score: typeof summarised[number]["score"]) => score.uniformityCups],
                ["cleanCup", (score: typeof summarised[number]["score"]) => score.cleanCupCups],
                ["sweetness", (score: typeof summarised[number]["score"]) => score.sweetnessCups],
              ] as const
            ).map(([key, pick]) => {
              const cups = attribute(pick) ?? 0;
              return (
                <InfoRow key={key} label={t(`cup.${key}`)}>
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                    <Typography variant="body2" color="primary">{formatScore(cups * 2)}</Typography>
                    <CupMarks cups={Math.round(cups)} total={cupsPerSample} />
                  </Stack>
                </InfoRow>
              );
            })}
            <InfoRow label={t("cup.attributes.DEFECTS")}>
              <Typography variant="body2" color="primary">
                {formatScore(attribute((score) => score.defectCups * score.defectIntensity))}
              </Typography>
            </InfoRow>
            <InfoRow label={t("review.reroastRequest")}>
              <Typography variant="body2">
                {summarised.some((entry) => entry.score.reroastRequested) ? t("cup.yes") : t("cup.no")}
              </Typography>
            </InfoRow>
            <InfoRow label={t("cup.notes")}>
              <Typography variant="body2">
                {summarised
                  .map((entry) => entry.score.notes)
                  .filter(Boolean)
                  .join(" · ") || "-"}
              </Typography>
            </InfoRow>
          </Card>

          <Typography sx={{ fontWeight: 750, mt: 3, mb: 1 }}>{t("review.postCuppingNotes")}</Typography>
          <Stack component="ul" spacing={0.5} sx={{ m: 0, pl: 2.5 }}>
            {summarised.map((entry, index) => (
              <Typography key={entry.score.id} component="li" variant="body2" color="text.secondary">
                {cupperName(entry, t("review.cupperNumber", { number: index + 1 }))}:{" "}
                {entry.score.notes || "-"}
              </Typography>
            ))}
          </Stack>
          <Divider sx={{ mt: 3 }} />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5 }}>
            {t("review.updatedAt", {
              date: new Intl.DateTimeFormat(locale, { dateStyle: "long", timeStyle: "short", hour12: false }).format(
                new Date(session.startsAt),
              ),
            })}
          </Typography>
        </Box>
      </Box>

      <ReportFieldsDialog
        open={pickerOpen}
        initial={reportAttributes}
        onCancel={() => setPickerOpen(false)}
        onGenerate={(fields) => {
          setPickerOpen(false);
          openReport(fields);
        }}
      />

      <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
        <DialogTitle>{t("review.deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("review.deleteDescription")}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setConfirmDelete(false)}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={() => {
              void submit({ sampleId: sample.id }, { method: "post" });
              setConfirmDelete(false);
            }}
          >
            {t("common:actions.delete")}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={3000}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={actionData?.failed ? "error" : "success"} onClose={() => setToast("")}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}
