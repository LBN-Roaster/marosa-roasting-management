import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import CoffeeOutlinedIcon from "@mui/icons-material/CoffeeOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { DetailItem, RoastMilestones, RoastProfileChart } from "~/components/roast-profile-charts";
import { createSampleFromRoast, getRoast, getRoastProfile, updateRoast } from "~/lib/backend.server";
import { isoToLocalInput, localToIso } from "~/lib/cupping";
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
  return { roast, profile };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  try {
    if (formData.get("intent") === "createSample") {
      const sample = await createSampleFromRoast(request, params.roastId);
      return { created: sample.tag };
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
  const { roast, profile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(["cupping", "common"]);
  const navigation = useNavigation();
  const submit = useSubmit();
  const busy = navigation.state !== "idle";

  const [beanName, setBeanName] = useState(roast.beanName ?? "");
  const [batchNumber, setBatchNumber] = useState(roast.batchNumber ?? "");
  const [chargeWeight, setChargeWeight] = useState(roast.chargeWeight?.toString() ?? "");
  const [dropWeight, setDropWeight] = useState(roast.dropWeight?.toString() ?? "");
  const [roastedAt, setRoastedAt] = useState(isoToLocalInput(roast.roastedAt));
  const [toast, setToast] = useState("");
  const developmentRatio = roast.developmentRatio != null
    ? `${(Number(roast.developmentRatio) * 100).toFixed(1)}%`
    : "—";

  // Reseed only when a different roast is opened. Depending on the loader
  // object instead would refill these inputs on every revalidation and discard
  // whatever was half-typed.
  useEffect(() => {
    setBeanName(roast.beanName ?? "");
    setBatchNumber(roast.batchNumber ?? "");
    setChargeWeight(roast.chargeWeight?.toString() ?? "");
    setDropWeight(roast.dropWeight?.toString() ?? "");
    setRoastedAt(isoToLocalInput(roast.roastedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roast.id]);

  useEffect(() => {
    if (actionData?.failed) setToast(t("roasts.saveFailed"));
    else if (actionData?.saved) setToast(t("roasts.saved"));
    else if (actionData?.created) setToast(t("roasts.created", { tag: actionData.created }));
  }, [actionData, t]);

  function save() {
    void submit(
      {
        intent: "save",
        payload: JSON.stringify({
          beanName: beanName.trim() || null,
          batchNumber: batchNumber.trim() || null,
          chargeWeight: chargeWeight ? Number(chargeWeight) : null,
          dropWeight: dropWeight ? Number(dropWeight) : null,
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
            {roast.machineSerialNumber}
            {roast.sourceRoastId ? ` · ${roast.sourceRoastId}` : ""}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button variant="contained" disabled={busy} onClick={save}>
            {busy ? t("samples.saving") : t("samples.save")}
          </Button>
        </Stack>
      </Stack>

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
                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              />
              <TextField
                fullWidth
                type="number"
                label={t("roasts.dropWeight")}
                value={dropWeight}
                onChange={(event) => setDropWeight(event.target.value)}
                slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
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
