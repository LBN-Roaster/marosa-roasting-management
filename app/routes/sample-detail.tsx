import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import LinkOffOutlinedIcon from "@mui/icons-material/LinkOffOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { InfoTooltip } from "~/components/info-tooltip";
import type { SampleRoast } from "~/lib/backend.server";
import { getSample, linkRoastSample, updateLibrarySample } from "~/lib/backend.server";
import { sampleFields, sampleTypeOptions, speciesOptions } from "~/lib/cupping-sample-fields";
import { sampleLabelHtml } from "~/lib/sample-label";
import { formatWeightInOut } from "~/lib/weight";
import type { Route } from "./+types/sample-detail";

export function meta() {
  return [{ title: "Sample | MAROSA" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  return { sample: await getSample(request, params.sampleId) };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "unlinkRoast") {
      await linkRoastSample(request, String(formData.get("roastId")), null);
      return { unlinked: true };
    }
    if (intent === "linkRoast") {
      await linkRoastSample(request, String(formData.get("roastId")), params.sampleId);
      return { linked: true };
    }
    await updateLibrarySample(
      request,
      params.sampleId,
      JSON.parse(String(formData.get("payload"))),
    );
    return { saved: true };
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
}

/** The sheet fields worth editing here; the rest stay per-session. */
const editableFields = [
  "country",
  "producerName",
  "varietals",
  "coffeeProcessing",
  "cropYear",
  "moisture",
  "density",
  "lotNumber",
];

function RoastRow({ roast, locale, onUnlink, busy }: {
  roast: SampleRoast;
  locale: string;
  onUnlink: () => void;
  busy: boolean;
}) {
  const { t } = useTranslation(["cupping", "common"]);
  const when = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", hour12: false })
    .format(new Date(roast.roastedAt));

  const metrics = [
    roast.title && when,
    roast.batchNumber && `${t("library.batch")} ${roast.batchNumber}`,
    formatWeightInOut(roast.chargeWeight, roast.dropWeight, locale),
    roast.developmentRatio != null && `DTR ${(Number(roast.developmentRatio) * 100).toFixed(1)}%`,
    roast.roasterName ?? roast.controllerSerialNumber,
  ].filter(Boolean);

  return (
    <Card sx={{ p: 2 }}>
      <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: "flex-start", minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {roast.title ?? when}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
              {metrics.join(" · ") || t("library.noRoastDetails")}
            </Typography>
          </Box>
        </Stack>
        <Stack direction="row" spacing={1}>
          <Button
            component={Link}
            to={`/roasts/${roast.id}`}
            size="small"
            variant="outlined"
            color="inherit"
            startIcon={<ShowChartIcon />}
          >
            {t("roasts.openRoast")}
          </Button>
          <Button
            size="small"
            color="inherit"
            disabled={busy}
            startIcon={<LinkOffOutlinedIcon />}
            onClick={onUnlink}
          >
            {t("library.unlinkRoast")}
          </Button>
        </Stack>
      </Stack>
    </Card>
  );
}

export default function SampleDetailPage() {
  const { sample } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t, i18n } = useTranslation(["cupping", "common"]);
  const navigation = useNavigation();
  const submit = useSubmit();
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";
  const busy = navigation.state !== "idle";

  const [name, setName] = useState(sample.name);
  const [sampleType, setSampleType] = useState(sample.sampleType ?? "");
  const [species, setSpecies] = useState(sample.species ?? "");
  const [details, setDetails] = useState<Record<string, string>>({ ...sample.details });
  const [toast, setToast] = useState("");

  // Same rule as the roast page: reseed per sample, not per revalidation.
  useEffect(() => {
    setName(sample.name);
    setSampleType(sample.sampleType ?? "");
    setSpecies(sample.species ?? "");
    setDetails({ ...sample.details });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sample.id]);

  useEffect(() => {
    if (actionData?.failed) setToast(t("library.saveFailed"));
    else if (actionData?.saved) setToast(t("library.saved"));
    else if (actionData?.unlinked) setToast(t("library.roastUnlinked"));
  }, [actionData, t]);

  function save() {
    const cleaned: Record<string, string> = {};
    for (const [key, value] of Object.entries(details)) {
      if (value?.trim()) cleaned[key] = value.trim();
    }
    void submit(
      {
        intent: "save",
        payload: JSON.stringify({
          name: name.trim(),
          taggedOn: sample.taggedOn,
          sampleType: sampleType.trim() || null,
          species: species.trim() || null,
          details: cleaned,
        }),
      },
      { method: "post" },
    );
  }

  function printLabel() {
    const win = window.open("", "_blank", "width=420,height=320");
    if (!win) {
      setToast(t("library.printBlocked"));
      return;
    }
    win.document.write(
      sampleLabelHtml(sample, {
        roastedOn: t("library.labelDate"),
        species: t("sampleFields.species"),
        country: t("sampleFields.country"),
        producer: t("sampleFields.producerName"),
      }),
    );
    win.document.close();
  }

  return (
    <>
      <Button
        component={Link}
        to="/samples"
        color="inherit"
        startIcon={<ArrowCircleLeftOutlinedIcon />}
        sx={{ mb: 1, ml: -1, color: "text.primary" }}
      >
        {t("library.backToSamples")}
      </Button>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { sm: "center" }, gap: 2 }}
      >
        <Box>
          <Typography
            component="h1"
            sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontSize: 28, fontWeight: 750, color: "primary.main" }}
          >
            {sample.tag}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {sample.name}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" color="inherit" startIcon={<LocalPrintshopOutlinedIcon />} onClick={printLabel}>
            {t("library.printLabel")}
          </Button>
          <Button variant="contained" disabled={busy || !name.trim()} onClick={save}>
            {busy ? t("samples.saving") : t("samples.save")}
          </Button>
        </Stack>
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
        <Card sx={{ p: { xs: 2, md: 3 } }}>
          <Typography sx={{ fontWeight: 700, mb: 2 }}>{t("library.identity")}</Typography>
          <Stack spacing={2}>
            <TextField
              fullWidth
              required
              label={t("sampleFields.sampleName")}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label={t("sampleFields.species")}
                value={species}
                onChange={(event) => setSpecies(event.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {speciesOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label={t("sampleFields.sampleType")}
                value={sampleType}
                onChange={(event) => setSampleType(event.target.value)}
              >
                <MenuItem value="">—</MenuItem>
                {sampleTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
            </Stack>
            <Divider />
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {editableFields.map((key) => {
                const field = sampleFields.find((item) => item.key === key);
                return (
                  <TextField
                    key={key}
                    fullWidth
                    select={field?.type === "select"}
                    label={t(`sampleFields.${key}`)}
                    value={details[key] ?? ""}
                    onChange={(event) =>
                      setDetails((current) => ({ ...current, [key]: event.target.value }))
                    }
                  >
                    {field?.type === "select"
                      ? [
                          <MenuItem key="" value="">—</MenuItem>,
                          ...(field.options ?? []).map((option) => (
                            <MenuItem key={option} value={option}>{option}</MenuItem>
                          )),
                        ]
                      : undefined}
                  </TextField>
                );
              })}
            </Box>
          </Stack>
        </Card>

        <Box>
          <Stack direction="row" sx={{ mb: 1.5, alignItems: "center", gap: 0.5 }}>
            <Typography sx={{ fontWeight: 700 }}>{t("library.roasts")}</Typography>
            <InfoTooltip title={t("library.roastsDescription")} />
          </Stack>
          {sample.roasts.length ? (
            <Stack spacing={1}>
              {sample.roasts.map((roast) => (
                <RoastRow
                  key={roast.id}
                  roast={roast}
                  locale={locale}
                  busy={busy}
                  onUnlink={() =>
                    void submit({ intent: "unlinkRoast", roastId: roast.id }, { method: "post" })
                  }
                />
              ))}
            </Stack>
          ) : (
            <Card sx={{ p: 3, textAlign: "center", borderStyle: "dashed" }}>
              <Typography variant="body2" color="text.secondary">
                {t("library.noRoasts")}
              </Typography>
            </Card>
          )}
        </Box>
      </Box>

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
