import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import LocalPrintshopOutlinedIcon from "@mui/icons-material/LocalPrintshopOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigation, useSearchParams, useSubmit } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { sampleLabelHtml } from "~/lib/sample-label";
import {
  createLibrarySample,
  deleteLibrarySample,
  getLibrarySamples,
  updateLibrarySample,
  type LibrarySample,
} from "~/lib/backend.server";
import {
  isPromoted,
  sampleFields,
  sampleTypeOptions,
  speciesOptions,
} from "~/lib/cupping-sample-fields";
import type { Route } from "./+types/samples";

export function meta() {
  return [{ title: "Samples | MAROSA" }];
}

const pageSize = 20;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  return {
    samples: await getLibrarySamples(request, {
      page: Number(url.searchParams.get("page") ?? "0"),
      size: pageSize,
      search: url.searchParams.get("search") ?? undefined,
    }),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "delete") {
      await deleteLibrarySample(request, String(formData.get("sampleId")));
      return { deleted: true };
    }
    const payload = JSON.parse(String(formData.get("payload")));
    const sampleId = formData.get("sampleId");
    if (sampleId) {
      await updateLibrarySample(request, String(sampleId), payload);
      return { saved: true };
    }
    await createLibrarySample(request, payload);
    return { created: true };
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
}

/** The sheet fields worth capturing when a coffee first enters the library. */
const quickFields = ["country", "producerName", "varietals", "coffeeProcessing", "cropYear"];

type Draft = {
  name: string;
  sampleType: string;
  species: string;
  details: Record<string, string>;
};

const emptyDraft: Draft = { name: "", sampleType: "", species: "", details: {} };

export default function SamplesPage() {
  const { samples } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation(["cupping", "common"]);
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState("");

  const busy = navigation.state !== "idle";

  useEffect(() => {
    if (actionData?.failed) setToast(t("library.saveFailed"));
    else if (actionData?.deleted) setToast(t("library.deleted"));
    else if (actionData?.saved || actionData?.created) {
      setToast(t("library.saved"));
      setOpen(false);
    }
  }, [actionData, t]);

  function openCreate() {
    setDraft(emptyDraft);
    setOpen(true);
  }


  function save() {
    const details: Record<string, string> = {};
    for (const [key, value] of Object.entries(draft.details)) {
      if (value?.trim()) details[key] = value.trim();
    }
    void submit(
      {
        intent: "save",
        payload: JSON.stringify({
          name: draft.name.trim(),
          sampleType: draft.sampleType.trim() || null,
          species: draft.species.trim() || null,
          details,
        }),
      },
      { method: "post" },
    );
  }

  function printLabel(sample: LibrarySample) {
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

  function applySearch(value: string) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set("search", value);
    else next.delete("search");
    next.delete("page");
    setSearchParams(next);
  }

  return (
    <>
      <PageHeading
        eyebrow={t("library.eyebrow")}
        title={t("library.title")}
        description={t("library.description")}
        actions={
          <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={openCreate}>
            {t("library.addSample")}
          </Button>
        }
      />

      <TextField
        value={search}
        placeholder={t("library.search")}
        onChange={(event) => setSearch(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") applySearch(search);
        }}
        onBlur={() => applySearch(search)}
        sx={{ mb: 2, maxWidth: 360 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          },
        }}
      />

      {samples.content.length ? (
        <Stack spacing={1}>
          {samples.content.map((sample) => (
            <Card key={sample.id} sx={{ p: 2 }}>
              <Stack
                direction="row"
                sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}
              >
                <Box
                  component={Link}
                  to={`/samples/${sample.id}`}
                  sx={{ textAlign: "left", minWidth: 0, textDecoration: "none", color: "inherit" }}
                >
                  <Stack direction="row" spacing={1} sx={{ alignItems: "baseline", flexWrap: "wrap" }}>
                    <Typography
                      sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700, color: "primary.main" }}
                    >
                      {sample.tag}
                    </Typography>
                    <Typography sx={{ fontWeight: 700 }}>{sample.name}</Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    {[sample.species, sample.sampleType, sample.details.country, sample.details.producerName]
                      .filter(Boolean)
                      .join(" · ") || t("library.noDetails")}
                  </Typography>
                </Box>
                <Stack direction="row" spacing={0.5}>
                <Button
                  size="small"
                  color="inherit"
                  startIcon={<LocalPrintshopOutlinedIcon />}
                  onClick={() => printLabel(sample)}
                >
                  {t("library.printLabel")}
                </Button>
                <IconButton
                  aria-label={t("library.deleteSample", { name: sample.name })}
                  disabled={busy}
                  onClick={() => void submit({ intent: "delete", sampleId: sample.id }, { method: "post" })}
                >
                  <DeleteOutlineIcon fontSize="small" />
                </IconButton>
                </Stack>
              </Stack>
            </Card>
          ))}
        </Stack>
      ) : (
        <Card sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
          <Typography sx={{ fontWeight: 700 }}>{t("library.emptyTitle")}</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {t("library.emptyDescription")}
          </Typography>
        </Card>
      )}

      {samples.totalPages > 1 && (
        <Stack direction="row" sx={{ mt: 2, justifyContent: "center" }}>
          <Pagination
            count={samples.totalPages}
            page={samples.page + 1}
            onChange={(_, value) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(value - 1));
              setSearchParams(next);
            }}
          />
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("library.createTitle")}</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2} sx={{ pt: 0.5 }}>
            <TextField
              autoFocus
              required
              fullWidth
              label={t("sampleFields.sampleName")}
              value={draft.name}
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            />
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                select
                fullWidth
                label={t("sampleFields.species")}
                value={draft.species}
                onChange={(event) => setDraft((current) => ({ ...current, species: event.target.value }))}
              >
                <MenuItem value="">—</MenuItem>
                {speciesOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                fullWidth
                label={t("sampleFields.sampleType")}
                value={draft.sampleType}
                onChange={(event) => setDraft((current) => ({ ...current, sampleType: event.target.value }))}
              >
                <MenuItem value="">—</MenuItem>
                {sampleTypeOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
            <Divider />
            <Typography variant="caption" color="text.secondary">
              {t("library.detailsHint")}
            </Typography>
            <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
              {quickFields.map((key) => {
                const field = sampleFields.find((item) => item.key === key);
                return (
                  <TextField
                    key={key}
                    fullWidth
                    select={field?.type === "select"}
                    label={t(`sampleFields.${key}`)}
                    value={draft.details[key] ?? ""}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        details: { ...current.details, [key]: event.target.value },
                      }))
                    }
                  >
                    {field?.type === "select"
                      ? [
                          <MenuItem key="" value="">
                            —
                          </MenuItem>,
                          ...(field.options ?? []).map((option) => (
                            <MenuItem key={option} value={option}>
                              {option}
                            </MenuItem>
                          )),
                        ]
                      : undefined}
                  </TextField>
                );
              })}
            </Box>
            <Typography variant="caption" color="text.secondary">
              {t("library.remainingFieldsHint", {
                count: sampleFields.filter(
                  (field) => !isPromoted(field.key) && !quickFields.includes(field.key),
                ).length,
              })}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setOpen(false)}>
            {t("common:actions.cancel")}
          </Button>
          <Button variant="contained" disabled={busy || !draft.name.trim()} onClick={save}>
            {busy ? t("samples.saving") : t("samples.save")}
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
