import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import VisibilityOffOutlinedIcon from "@mui/icons-material/VisibilityOffOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Tab from "@mui/material/Tab";
import Tabs from "@mui/material/Tabs";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import {
  CupRow,
  DescriptorBox,
  IntensitySlider,
  ScoreStepper,
} from "~/components/cupping-score-controls";
import {
  getCuppingSamples,
  getCuppingSession,
  getMyCuppingScores,
  saveCuppingScore,
  type CuppingScore,
  type DescriptorAttribute,
  type RoastLevel,
} from "~/lib/backend.server";
import type { Route } from "./+types/cupping-cup";

export function meta() {
  return [{ title: "Cupping | MAROSA" }];
}

const roastLevels: RoastLevel[] = ["LIGHT", "MID_LIGHT", "MEDIUM", "MID_DARK", "DARK"];
const roastShades = ["#C89B6B", "#B07C4A", "#8B5A2B", "#67421F", "#3F2713"];

type ScoreDraft = Omit<CuppingScore, "id" | "sampleId" | "totalScore">;

function emptyDraft(cupsPerSample: number): ScoreDraft {
  return {
    roastLevel: null,
    fragranceDry: 0,
    fragranceBreak: 0,
    fragranceScore: 7.5,
    acidityIntensity: 0,
    acidityScore: 7.5,
    bodyLevel: 0,
    bodyScore: 7.5,
    flavorScore: 7.5,
    aftertasteScore: 7.5,
    balanceScore: 7.5,
    overallScore: 7.5,
    uniformityCups: cupsPerSample,
    cleanCupCups: cupsPerSample,
    sweetnessCups: cupsPerSample,
    defectCups: 0,
    defectIntensity: 0,
    reroastRequested: false,
    quakerCount: null,
    notes: null,
    status: "DRAFT",
    descriptors: [],
  };
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const [session, samples, scores] = await Promise.all([
    getCuppingSession(request, params.sessionId),
    getCuppingSamples(request, params.sessionId),
    getMyCuppingScores(request, params.sessionId),
  ]);
  return { session, samples, scores };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const sampleId = String(formData.get("sampleId"));
  const payload = JSON.parse(String(formData.get("payload"))) as ScoreDraft;
  try {
    await saveCuppingScore(request, params.sessionId, sampleId, payload);
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
  return { saved: payload.status };
}

/**
 * Mirrors the server's SCA total so the cupper sees it update as they score:
 * the seven ten-point attributes, plus two points per clean cup, less the
 * defect penalty.
 */
function totalScore(draft: ScoreDraft) {
  const attributes =
    draft.fragranceScore +
    draft.flavorScore +
    draft.aftertasteScore +
    draft.acidityScore +
    draft.bodyScore +
    draft.balanceScore +
    draft.overallScore;
  const cups = (draft.uniformityCups + draft.cleanCupCups + draft.sweetnessCups) * 2;
  return attributes + cups - draft.defectCups * draft.defectIntensity;
}

function AttributeCard({
  title,
  descriptors,
  onAddDescriptor,
  onRemoveDescriptor,
  slider,
  score,
  onScoreChange,
}: {
  title: string;
  descriptors: string[];
  onAddDescriptor: (descriptor: string) => void;
  onRemoveDescriptor: (descriptor: string) => void;
  slider?: React.ReactNode;
  score: number;
  onScoreChange: (next: number) => void;
}) {
  return (
    <Card sx={{ p: 2, display: "flex", flexDirection: "column" }}>
      <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <DescriptorBox
        descriptors={descriptors}
        onAdd={onAddDescriptor}
        onRemove={onRemoveDescriptor}
      />
      {slider && <Box sx={{ mt: 1 }}>{slider}</Box>}
      <Stack direction="row" sx={{ mt: "auto", pt: 1.5, justifyContent: "center" }}>
        <ScoreStepper value={score} onChange={onScoreChange} />
      </Stack>
    </Card>
  );
}

export default function CuppingCupPage() {
  const { session, samples, scores } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(["cupping", "common"]);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();

  const [activeIndex, setActiveIndex] = useState(0);
  const [drafts, setDrafts] = useState<Record<string, ScoreDraft>>(() =>
    Object.fromEntries(
      samples.map((sample) => {
        const saved = scores.find((score) => score.sampleId === sample.id);
        if (!saved) return [sample.id, emptyDraft(session.cupsPerSample)];
        const { id: _id, sampleId: _sampleId, totalScore: _total, ...draft } = saved;
        return [sample.id, draft];
      }),
    ),
  );
  const [showTotals, setShowTotals] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");

  const sample = samples[activeIndex];
  const draft = drafts[sample?.id ?? ""] ?? emptyDraft(session.cupsPerSample);
  const busy = navigation.state !== "idle";
  const showTotal = Boolean(showTotals[sample?.id ?? ""]);

  useEffect(() => {
    if (actionData?.failed) {
      setToast(t("cup.saveFailed"));
      return;
    }
    if (actionData?.saved === "DRAFT") {
      setToast(t("cup.draftSaved"));
      return;
    }
    if (actionData?.saved !== "SUBMITTED") return;

    setToast(t("cup.submitted"));
    // Move on to the next sample still waiting for a score. The summary is only
    // the right destination once the whole table has been submitted.
    const submitted = new Set(
      scores.filter((score) => score.status === "SUBMITTED").map((score) => score.sampleId),
    );
    const next = samples.findIndex((item) => !submitted.has(item.id));
    if (next === -1) void navigate(`/cupping/${session.id}/review`);
    else setActiveIndex(next);
  }, [actionData, navigate, samples, scores, session.id, t]);

  function patch(next: Partial<ScoreDraft>) {
    if (!sample) return;
    setDrafts((current) => ({ ...current, [sample.id]: { ...current[sample.id], ...next } }));
  }

  function descriptorsFor(attribute: DescriptorAttribute) {
    return draft.descriptors
      .filter((descriptor) => descriptor.attribute === attribute)
      .map((descriptor) => descriptor.descriptor);
  }

  function addDescriptor(attribute: DescriptorAttribute, descriptor: string) {
    if (draft.descriptors.some((item) => item.attribute === attribute && item.descriptor === descriptor)) {
      return;
    }
    patch({ descriptors: [...draft.descriptors, { attribute, descriptor }] });
  }

  function removeDescriptor(attribute: DescriptorAttribute, descriptor: string) {
    patch({
      descriptors: draft.descriptors.filter(
        (item) => !(item.attribute === attribute && item.descriptor === descriptor),
      ),
    });
  }

  function save(status: "DRAFT" | "SUBMITTED") {
    if (!sample) return;
    void submit(
      {
        sampleId: sample.id,
        payload: JSON.stringify({ ...draft, status }),
      },
      { method: "post" },
    );
  }

  if (!sample) {
    return (
      <Alert severity="info">{t("samples.deleteLastSample")}</Alert>
    );
  }

  const scoreKeys = [
    { attribute: "FLAVOR" as const, key: "flavorScore" as const },
    { attribute: "AFTERTASTE" as const, key: "aftertasteScore" as const },
    { attribute: "BALANCE" as const, key: "balanceScore" as const },
  ];

  return (
    <>
      <Button
        component={Link}
        to="/cupping"
        color="inherit"
        startIcon={<ArrowCircleLeftOutlinedIcon />}
        sx={{ mb: 1, ml: -1, color: "text.primary" }}
      >
        {t("form.back")}
      </Button>
      <Typography component="h1" variant="h5" sx={{ fontWeight: 750 }}>
        {t("samples.sessionTitle", { reference: session.reference })}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
        {t("cup.currentlyUsing")}{" "}
        <Box component="span" sx={{ color: "primary.main", fontWeight: 700 }}>
          {t("cup.formName", { protocol: t(`protocol.${session.protocol}`) })}
        </Box>
      </Typography>
      <FormControlLabel
        sx={{ mt: 0.5 }}
        control={
          <Switch
            size="small"
            checked={samples.every((item) => showTotals[item.id])}
            onChange={(event) =>
              setShowTotals(
                Object.fromEntries(samples.map((item) => [item.id, event.target.checked])),
              )
            }
          />
        }
        label={<Typography variant="caption">{t("cup.enableTotalForAll")}</Typography>}
      />

      <Tabs
        value={activeIndex}
        onChange={(_, next: number) => setActiveIndex(next)}
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mt: 2, minHeight: 36, "& .MuiTab-root": { minHeight: 36, minWidth: 44 } }}
      >
        {samples.map((item) => (
          <Tab key={item.id} label={item.ordinal} />
        ))}
      </Tabs>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }, gap: 2, mt: 2 }}>
        <Card sx={{ p: 2 }}>
          <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, flexWrap: "wrap" }}>
            <Box>
              <Typography variant="caption" color="text.secondary">
                {t("cup.sampleNumber", { ordinal: sample.ordinal })}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Typography sx={{ fontWeight: 700 }}>
                  {sample.sampleName || sample.label}
                </Typography>
                {session.blind && !sample.sampleName && (
                  <Tooltip title={t("cup.blindHint")}>
                    <Chip
                      size="small"
                      icon={<VisibilityOffOutlinedIcon />}
                      label={t("cup.blind")}
                      sx={{ height: 22 }}
                    />
                  </Tooltip>
                )}
              </Stack>
              <FormControlLabel
                sx={{ mt: 0.5 }}
                control={
                  <Switch
                    size="small"
                    checked={showTotal}
                    onChange={(event) =>
                      setShowTotals((current) => ({ ...current, [sample.id]: event.target.checked }))
                    }
                  />
                }
                label={<Typography variant="caption">{t("cup.enableTotalOnly")}</Typography>}
              />
            </Box>
            <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
              <Box sx={{ textAlign: "center" }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  {t("cup.totalCup")}
                </Typography>
                <Typography color="primary" sx={{ fontWeight: 700 }}>
                  {t("cup.cups", { count: session.cupsPerSample })}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center" }}>
                <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                  <Typography variant="caption" color="text.secondary">
                    {t("cup.totalScore")}
                  </Typography>
                  <IconButton
                    size="small"
                    aria-label={showTotal ? t("cup.hideTotal") : t("cup.showTotal")}
                    onClick={() =>
                      setShowTotals((current) => ({ ...current, [sample.id]: !current[sample.id] }))
                    }
                  >
                    {showTotal ? <VisibilityIcon fontSize="small" /> : <VisibilityOffIcon fontSize="small" />}
                  </IconButton>
                </Stack>
                <Typography color="primary" sx={{ fontWeight: 750, fontSize: 20 }}>
                  {showTotal ? totalScore(draft).toFixed(2).replace(/\.?0+$/, "") : "---"}
                </Typography>
              </Box>
            </Stack>
          </Stack>
        </Card>

        <Card sx={{ p: 2 }}>
          <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", mb: 1.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {t("cup.roastLevel")}
            </Typography>
            <Tooltip title={t("cup.roastLevelHint")}>
              <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
            </Tooltip>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 1 }}>
            {roastLevels.map((level, index) => {
              const active = draft.roastLevel === level;
              return (
                <Box
                  key={level}
                  component="button"
                  type="button"
                  aria-pressed={active}
                  onClick={() => patch({ roastLevel: level })}
                  sx={{
                    cursor: "pointer",
                    border: 1,
                    borderColor: active ? "primary.main" : "divider",
                    bgcolor: active ? "rgba(59,128,97,.08)" : "background.paper",
                    borderRadius: 2,
                    py: 1.5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.5,
                  }}
                >
                  <CoffeeOutlinedIcon sx={{ color: roastShades[index] }} />
                  <Typography variant="caption" sx={{ fontWeight: active ? 700 : 400 }}>
                    {t(`cup.roastLevels.${level}`)}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Card>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mt: 2 }}>
        <AttributeCard
          title={t("cup.attributes.FRAGRANCE")}
          descriptors={descriptorsFor("FRAGRANCE")}
          onAddDescriptor={(descriptor) => addDescriptor("FRAGRANCE", descriptor)}
          onRemoveDescriptor={(descriptor) => removeDescriptor("FRAGRANCE", descriptor)}
          slider={
            <Stack direction="row" spacing={2}>
              <IntensitySlider
                label={t("cup.dry")}
                value={draft.fragranceDry}
                onChange={(next) => patch({ fragranceDry: next })}
              />
              <IntensitySlider
                label={t("cup.break")}
                value={draft.fragranceBreak}
                onChange={(next) => patch({ fragranceBreak: next })}
              />
            </Stack>
          }
          score={draft.fragranceScore}
          onScoreChange={(next) => patch({ fragranceScore: next })}
        />
        <AttributeCard
          title={t("cup.attributes.ACIDITY")}
          descriptors={descriptorsFor("ACIDITY")}
          onAddDescriptor={(descriptor) => addDescriptor("ACIDITY", descriptor)}
          onRemoveDescriptor={(descriptor) => removeDescriptor("ACIDITY", descriptor)}
          slider={
            <IntensitySlider
              label={t("cup.acidityIntensity")}
              value={draft.acidityIntensity}
              onChange={(next) => patch({ acidityIntensity: next })}
            />
          }
          score={draft.acidityScore}
          onScoreChange={(next) => patch({ acidityScore: next })}
        />
        <AttributeCard
          title={t("cup.attributes.BODY")}
          descriptors={descriptorsFor("BODY")}
          onAddDescriptor={(descriptor) => addDescriptor("BODY", descriptor)}
          onRemoveDescriptor={(descriptor) => removeDescriptor("BODY", descriptor)}
          slider={
            <IntensitySlider
              label={t("cup.bodyLevel")}
              value={draft.bodyLevel}
              onChange={(next) => patch({ bodyLevel: next })}
            />
          }
          score={draft.bodyScore}
          onScoreChange={(next) => patch({ bodyScore: next })}
        />

        {scoreKeys.map(({ attribute, key }) => (
          <AttributeCard
            key={attribute}
            title={t(`cup.attributes.${attribute}`)}
            descriptors={descriptorsFor(attribute)}
            onAddDescriptor={(descriptor) => addDescriptor(attribute, descriptor)}
            onRemoveDescriptor={(descriptor) => removeDescriptor(attribute, descriptor)}
            score={draft[key]}
            onScoreChange={(next) => patch({ [key]: next } as Partial<ScoreDraft>)}
          />
        ))}
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 2fr" }, gap: 2, mt: 2 }}>
        <Card sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 1.5 }}>
              {t("cup.overall")}
            </Typography>
            <ScoreStepper
              value={draft.overallScore}
              onChange={(next) => patch({ overallScore: next })}
            />
          </Box>
        </Card>
        <Stack spacing={2}>
          <Card>
            <CupRow
              label={t("cup.uniformity")}
              cups={draft.uniformityCups}
              totalCups={session.cupsPerSample}
              onChange={(next) => patch({ uniformityCups: next })}
            />
          </Card>
          <Card>
            <CupRow
              label={t("cup.cleanCup")}
              cups={draft.cleanCupCups}
              totalCups={session.cupsPerSample}
              onChange={(next) => patch({ cleanCupCups: next })}
            />
          </Card>
          <Card>
            <CupRow
              label={t("cup.sweetness")}
              cups={draft.sweetnessCups}
              totalCups={session.cupsPerSample}
              onChange={(next) => patch({ sweetnessCups: next })}
            />
          </Card>
        </Stack>
      </Box>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" }, gap: 2, mt: 2 }}>
        <Card sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            {t("cup.attributes.DEFECTS")}
          </Typography>
          <DescriptorBox
            descriptors={descriptorsFor("DEFECTS")}
            onAdd={(descriptor) => addDescriptor("DEFECTS", descriptor)}
            onRemove={(descriptor) => removeDescriptor("DEFECTS", descriptor)}
          />
          <Stack direction="row" spacing={1} sx={{ mt: 2, alignItems: "flex-end" }}>
            <TextField
              select
              size="small"
              label={t("cup.defectCups")}
              value={draft.defectCups}
              onChange={(event) => patch({ defectCups: Number(event.target.value) })}
              sx={{ width: 88 }}
            >
              {Array.from({ length: session.cupsPerSample + 1 }, (_, count) => (
                <MenuItem key={count} value={count}>
                  {count}
                </MenuItem>
              ))}
            </TextField>
            <Typography sx={{ pb: 1 }}>×</Typography>
            <TextField
              select
              size="small"
              label={t("cup.defectIntensity")}
              value={draft.defectIntensity}
              onChange={(event) => patch({ defectIntensity: Number(event.target.value) })}
              sx={{ width: 110 }}
            >
              <MenuItem value={0}>{t("cup.none")}</MenuItem>
              <MenuItem value={2}>{t("cup.taint")}</MenuItem>
              <MenuItem value={4}>{t("cup.fault")}</MenuItem>
            </TextField>
            <Typography sx={{ pb: 1 }}>=</Typography>
            <Box
              sx={{ minWidth: 48, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 1, px: 1, py: 0.75 }}
            >
              {draft.defectCups * draft.defectIntensity}
            </Box>
          </Stack>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: "block" }}>
            {t("cup.taintFault")}
          </Typography>
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography
            variant="caption"
            sx={{ fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "text.secondary" }}
          >
            {t("cup.reroastTitle")}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1.5 }}>
            {t("cup.reroastQuestion")}
          </Typography>
          <RadioGroup
            row
            value={draft.reroastRequested ? "yes" : "no"}
            onChange={(event) => patch({ reroastRequested: event.target.value === "yes" })}
          >
            <FormControlLabel value="yes" control={<Radio size="small" />} label={t("cup.yes")} />
            <FormControlLabel value="no" control={<Radio size="small" />} label={t("cup.no")} />
          </RadioGroup>
          <Typography variant="body2" sx={{ fontWeight: 700, mt: 1.5, mb: 0.75 }}>
            {t("cup.quakerCount")}
          </Typography>
          <TextField
            fullWidth
            type="number"
            placeholder="e.g. 3"
            value={draft.quakerCount ?? ""}
            onChange={(event) =>
              patch({ quakerCount: event.target.value ? Number(event.target.value) : null })
            }
            slotProps={{ htmlInput: { min: 0 } }}
          />
        </Card>

        <Card sx={{ p: 2 }}>
          <Typography variant="body2" sx={{ fontWeight: 700, mb: 1 }}>
            {t("cup.notes")}
          </Typography>
          <TextField
            fullWidth
            multiline
            minRows={6}
            placeholder={t("cup.notesPlaceholder")}
            value={draft.notes ?? ""}
            onChange={(event) => patch({ notes: event.target.value || null })}
          />
        </Card>
      </Box>

      <Stack direction="row" spacing={1.5} sx={{ mt: 3, justifyContent: "flex-end" }}>
        <Button variant="outlined" color="inherit" disabled={busy} onClick={() => save("DRAFT")}>
          {t("cup.saveDraft")}
        </Button>
        <Button variant="contained" disabled={busy} onClick={() => save("SUBMITTED")}>
          {busy ? t("cup.submitting") : t("cup.reviewSubmit")}
        </Button>
      </Stack>

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
