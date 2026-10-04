import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import CheckIcon from "@mui/icons-material/Check";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { DetailItem, RoastMilestones, RoastProfileChart } from "~/components/roast-profile-charts";
import {
  createSampleFromRoast,
  getRoast,
  getRoastProfile,
  shareRoast,
  stopSharingRoast,
  updateRoast,
} from "~/lib/backend.server";
import { isoToLocalInput, localToIso } from "~/lib/cupping";
import { gramsToKgInput, kgInputToGrams } from "~/lib/weight";
import type { Route } from "./+types/roast-detail-page";

export function meta() {
  return [{ title: "Roast | MAROSA" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const [roast, profile] = await Promise.all([
    getRoast(request, params.roastId),
    // The curve lives in the uploaded `.alog`. If it cannot be read the roast
    // is still worth showing and editing, so the charts drop out instead.
    getRoastProfile(request, params.roastId).catch(() => null),
  ]);
  // The address the roasting app also prints in its QR codes.
  const shareBase = (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
  return { roast, profile, shareBase };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  try {
    if (formData.get("intent") === "createSample") {
      const sample = await createSampleFromRoast(request, params.roastId);
      return { created: sample.tag };
    }
    if (formData.get("intent") === "share") {
      await shareRoast(request, params.roastId);
      return { shared: true };
    }
    if (formData.get("intent") === "stopSharing") {
      await stopSharingRoast(request, params.roastId);
      return { unshared: true };
    }
    await updateRoast(request, params.roastId, JSON.parse(String(formData.get("payload"))));
    return { saved: true };
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
}

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  const content = (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 650 }}>{value}</Typography>
    </Box>
  );
  return hint ? <Tooltip title={hint}>{content}</Tooltip> : content;
}

function seconds(value: number | null) {
  if (value == null) return "—";
  const total = Number(value);
  return `${Math.floor(total / 60)}:${String(Math.round(total % 60)).padStart(2, "0")}`;
}

export default function RoastDetailPage() {
  const { roast, profile, shareBase } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(["cupping", "common"]);
  const navigation = useNavigation();
  const submit = useSubmit();
  const busy = navigation.state !== "idle";

  const [beanName, setBeanName] = useState(roast.beanName ?? "");
  const [batchNumber, setBatchNumber] = useState(roast.batchNumber ?? "");
  // Edited in kg; stored in grams.
  const [chargeWeight, setChargeWeight] = useState(gramsToKgInput(roast.chargeWeight));
  const [dropWeight, setDropWeight] = useState(gramsToKgInput(roast.dropWeight));
  const [roastedAt, setRoastedAt] = useState(isoToLocalInput(roast.roastedAt));
  const [toast, setToast] = useState("");
  const [copied, setCopied] = useState(false);
  const shareUrl = roast.shareToken ? `${shareBase}/r/${roast.shareToken}` : null;
  const developmentRatio = roast.developmentRatio != null
    ? `${(Number(roast.developmentRatio) * 100).toFixed(1)}%`
    : "—";

  // Reseed only when a different roast is opened. Depending on the loader
  // object instead would refill these inputs on every revalidation and discard
  // whatever was half-typed.
  useEffect(() => {
    setBeanName(roast.beanName ?? "");
    setBatchNumber(roast.batchNumber ?? "");
    setChargeWeight(gramsToKgInput(roast.chargeWeight));
    setDropWeight(gramsToKgInput(roast.dropWeight));
    setRoastedAt(isoToLocalInput(roast.roastedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roast.id]);

  useEffect(() => {
    if (actionData?.failed) setToast(t("roasts.saveFailed"));
    else if (actionData?.saved) setToast(t("roasts.saved"));
    else if (actionData?.created) setToast(t("roasts.created", { tag: actionData.created }));
    else if (actionData?.shared) setToast(t("roasts.share.on"));
    else if (actionData?.unshared) setToast(t("roasts.share.off"));
  }, [actionData, t]);

  function save() {
    void submit(
      {
        intent: "save",
        payload: JSON.stringify({
          beanName: beanName.trim() || null,
          batchNumber: batchNumber.trim() || null,
          chargeWeight: kgInputToGrams(chargeWeight),
          dropWeight: kgInputToGrams(dropWeight),
          roastedAt: roastedAt ? localToIso(roastedAt) : null,
        }),
      },
      { method: "post" },
    );
  }

  return (
    <>
      <Button
        component={Link}
        to="/roasts"
        color="inherit"
        startIcon={<ArrowCircleLeftOutlinedIcon />}
        sx={{ mb: 1, ml: -1, color: "text.primary" }}
      >
        {t("roasts.backToRoasts")}
      </Button>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { sm: "center" }, gap: 2 }}
      >
        <Box>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 750 }}>
            {roast.beanName || t("roasts.unnamed")}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {roast.roasterName ?? roast.controllerSerialNumber}
            {roast.sourceRoastId ? ` · ${roast.sourceRoastId}` : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button variant="contained" disabled={busy} onClick={save}>
            {busy ? t("samples.saving") : t("samples.save")}
          </Button>
        </Stack>
      </Stack>

      <Card variant="outlined" sx={{ p: { xs: 2, md: 2.5 }, mb: 3 }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ alignItems: { md: "center" } }}>
          <PublicOutlinedIcon color={shareUrl ? "primary" : "action"} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography sx={{ fontWeight: 700 }}>
              {shareUrl ? t("roasts.share.sharedTitle") : t("roasts.share.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {shareUrl ? t("roasts.share.sharedHint") : t("roasts.share.hint")}
            </Typography>
            {shareUrl && (
              <Stack direction="row" spacing={1} sx={{ mt: 1, alignItems: "center" }}>
                <Box
                  component="code"
                  sx={{ minWidth: 0, flex: 1, overflowX: "auto", whiteSpace: "nowrap", border: 1, borderColor: "divider", borderRadius: 1, px: 1.5, py: 0.75, fontSize: "0.8rem" }}
                >
                  {shareUrl}
                </Box>
                <IconButton
                  aria-label={t("roasts.share.copy")}
                  color={copied ? "success" : "default"}
                  onClick={() => {
                    void navigator.clipboard.writeText(shareUrl).then(() => {
                      setCopied(true);
                      window.setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? <CheckIcon /> : <ContentCopyIcon />}
                </IconButton>
              </Stack>
            )}
          </Box>
          {shareUrl ? (
            <Button color="error" disabled={busy} onClick={() => void submit({ intent: "stopSharing" }, { method: "post" })}>
              {t("roasts.share.stop")}
            </Button>
          ) : (
            <Button variant="outlined" disabled={busy} onClick={() => void submit({ intent: "share" }, { method: "post" })}>
              {t("roasts.share.start")}
            </Button>
          )}
        </Stack>
      </Card>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Typography sx={{ fontWeight: 700 }}>{t("roasts.editable")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {t("roasts.editableHint")}
          </Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              label={t("roasts.beanName")}
              helperText={t("roasts.beanNameHint")}
              value={beanName}
              onChange={(event) => setBeanName(event.target.value)}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                label={t("roasts.batchNumber")}
                value={batchNumber}
                onChange={(event) => setBatchNumber(event.target.value)}
              />
              <TextField
                fullWidth
                type="datetime-local"
                label={t("roasts.roastedAt")}
                value={roastedAt}
                onChange={(event) => setRoastedAt(event.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Stack>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                fullWidth
                type="number"
                label={t("roasts.chargeWeight")}
                value={chargeWeight}
                onChange={(event) => setChargeWeight(event.target.value)}
                slotProps={{
                  htmlInput: { min: 0, step: "any" },
                  input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> },
                }}
              />
              <TextField
                fullWidth
                type="number"
                label={t("roasts.dropWeight")}
                value={dropWeight}
                onChange={(event) => setDropWeight(event.target.value)}
                slotProps={{
                  htmlInput: { min: 0, step: "any" },
                  input: { endAdornment: <InputAdornment position="end">kg</InputAdornment> },
                }}
              />
            </Stack>
          </Stack>
        </Card>

        <Stack spacing={2}>
          {/* With a profile these figures live in the milestones card under the chart. */}
          {!profile && <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography sx={{ fontWeight: 700 }}>{t("roasts.fromCurve")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("roasts.fromCurveHint")}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2.5 }}>
              <Metric label={t("roasts.chargeTemperature")} value={roast.chargeTemperature?.toString() ?? "—"} />
              <Metric label={t("roasts.dropTemperature")} value={roast.dropTemperature?.toString() ?? "—"} />
              <Metric label={t("roasts.firstCrack")} value={seconds(roast.firstCrackSeconds)} />
              <Metric label={t("roasts.dropTime")} value={seconds(roast.dropSeconds)} />
              <Metric label={t("roasts.development")} value={seconds(roast.developmentSeconds)} />
              <Metric
                label={t("roasts.developmentRatio")}
                value={developmentRatio}
              />
            </Box>
          </Card>}

          <Card sx={{ p: { xs: 2, md: 3 } }}>
            <Typography sx={{ fontWeight: 700, mb: 1.5 }}>{t("roasts.sample")}</Typography>
            {roast.sampleId ? (
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                <CoffeeOutlinedIcon fontSize="small" color="primary" />
                <Box>
                  <Typography
                    sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700, color: "primary.main" }}
                  >
                    {roast.sampleTag}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">{roast.sampleName}</Typography>
                </Box>
                <Button component={Link} to={`/samples/${roast.sampleId}`} size="small" sx={{ ml: "auto" }}>
                  {t("roasts.openSample")}
                </Button>
              </Stack>
            ) : (
              <>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
                  {t("roasts.noSample")}
                </Typography>
                <Button
                  variant="contained"
                  disabled={busy}
                  onClick={() => void submit({ intent: "createSample" }, { method: "post" })}
                >
                  {t("roasts.createSample")}
                </Button>
              </>
            )}
          </Card>
        </Stack>
      </Box>

      <Box sx={{ mt: 3 }}>
        {profile ? (
          <Stack spacing={3}>
            <RoastMilestones data={profile} title={t("roasts.fromCurve")} subheader={t("roasts.fromCurveHint")}>
              <DetailItem label={t("roasts.development")}>{seconds(roast.developmentSeconds)}</DetailItem>
              <DetailItem label={t("roasts.developmentRatio")}>{developmentRatio}</DetailItem>
            </RoastMilestones>
            <RoastProfileChart data={profile} />
          </Stack>
        ) : (
          <Alert severity="info">{t("roasts.profileUnavailable")}</Alert>
        )}
      </Box>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
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
