import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutlineOutlined";
import ArrowDropDownIcon from "@mui/icons-material/ArrowDropDown";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import LocalCafeOutlinedIcon from "@mui/icons-material/LocalCafeOutlined";
import TuneIcon from "@mui/icons-material/Tune";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import InputAdornment from "@mui/material/InputAdornment";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useEffect, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  useActionData,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSubmit,
} from "react-router";
import { requireUser } from "~/lib/auth.server";
import {
  addCuppingSamples,
  deleteCuppingSample,
  getCuppingSamples,
  getCuppingSession,
  getLibrarySamples,
  updateCuppingSample,
  type CuppingSampleDetail,
  type LibrarySample,
} from "~/lib/backend.server";
import {
  isPromoted,
  sampleFields,
  type SampleField,
} from "~/lib/cupping-sample-fields";
import type { Route } from "./+types/cupping-samples";

export function meta() {
  return [{ title: "Sample info | MAROSA" }];
}

export async function loader({ params, request }: Route.LoaderArgs) {
  const [user, session, samples, library] = await Promise.all([
    requireUser(request),
    getCuppingSession(request, params.sessionId),
    getCuppingSamples(request, params.sessionId),
    // The sheet is the point of this page; the library only feeds the picker.
    // If it cannot be reached the picker goes away rather than the page.
    getLibrarySamples(request, { size: 200 }).catch(() => null),
  ]);
  return {
    session,
    samples,
    viewerEmail: user.email,
    library: library?.content ?? [],
  };
}

export async function action({ params, request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  try {
    if (intent === "add") {
      await addCuppingSamples(request, params.sessionId, Number(formData.get("count")));
      return { added: true };
    }
    if (intent === "delete") {
      await deleteCuppingSample(request, params.sessionId, String(formData.get("sampleId")));
      return { deleted: true };
    }
    if (intent === "save") {
      const payload = JSON.parse(String(formData.get("payload")));
      await updateCuppingSample(request, params.sessionId, String(formData.get("sampleId")), payload);
      return { saved: true };
    }
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
  return {};
}

/** The sheet's stored values flattened into one string map the form can edit. */
function valuesFor(sample: CuppingSampleDetail, protocolLabel: string) {
  const values: Record<string, string> = {
    sampleName: sample.sampleName ?? "",
    sampleType: sample.sampleType ?? "",
    species: sample.species ?? "",
    preferredProtocol: protocolLabel,
    ...sample.details,
  };
  for (const field of sampleFields) {
    values[field.key] ??= "";
  }
  return values;
}

function SampleFieldInput({
  field,
  label,
  value,
  locked,
  onChange,
}: {
  field: SampleField;
  label: string;
  value: string;
  locked?: boolean;
  onChange: (next: string) => void;
}) {
  const shared = {
    fullWidth: true,
    id: `sample-${field.key}`,
    value,
    disabled: field.readOnly || locked,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };

  return (
    <Box sx={{ gridColumn: field.fullWidth ? "1 / -1" : undefined }}>
      <Typography
        component="label"
        htmlFor={`sample-${field.key}`}
        variant="body2"
        sx={{ display: "block", mb: 0.75, fontWeight: 700 }}
      >
        {label}
      </Typography>
      {field.type === "select" ? (
        <TextField {...shared} select>
          <MenuItem value="">—</MenuItem>
          {field.options?.map((option) => (
            <MenuItem key={option} value={option}>
              {option}
            </MenuItem>
          ))}
        </TextField>
      ) : field.type === "textarea" ? (
        <TextField {...shared} multiline minRows={4} />
      ) : (
        <TextField
          {...shared}
          type={field.type === "month" ? "month" : field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
          slotProps={
            field.unit
              ? { input: { endAdornment: <InputAdornment position="end">{field.unit}</InputAdornment> } }
              : undefined
          }
        />
      )}
    </Box>
  );
}

export default function CuppingSamplesPage() {
  const { session, samples, viewerEmail, library } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t, i18n } = useTranslation(["cupping", "common"]);
  const navigate = useNavigate();
  const navigation = useNavigation();
  const submit = useSubmit();
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";

  const [selectedId, setSelectedId] = useState(samples[0]?.id ?? "");
  const selected = samples.find((sample) => sample.id === selectedId) ?? samples[0];
  const protocolLabel = t(`protocol.${session.protocol}`);
  const [values, setValues] = useState<Record<string, string>>(() =>
    selected ? valuesFor(selected, protocolLabel) : {},
  );
  const [linkedId, setLinkedId] = useState<string>(selected?.sampleId ?? "");
  const [actionAnchor, setActionAnchor] = useState<HTMLElement | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addCount, setAddCount] = useState(1);
  const [toast, setToast] = useState("");

  // Switching samples (or reloading after a save) reseeds the sheet.
  useEffect(() => {
    if (selected) {
      setValues(valuesFor(selected, protocolLabel));
      setLinkedId(selected.sampleId ?? "");
    }
  }, [selected?.id, samples, protocolLabel]);

  useEffect(() => {
    if (actionData?.saved) setToast(t("samples.saved"));
    if (actionData?.failed) setToast(t("samples.saveFailed"));
  }, [actionData, t]);

  const busy = navigation.state !== "idle";
  // A blind session serves cuppers a coded sheet, so saving it back would write
  // those blanks over the owner's data. Only the owner may edit it.
  const locked = session.blind && session.owner.email !== viewerEmail;

  function save() {
    if (!selected) return;
    const details: Record<string, string> = {};
    for (const field of sampleFields) {
      if (isPromoted(field.key) || field.readOnly) continue;
      const value = values[field.key]?.trim();
      if (value) details[field.key] = value;
    }
    void submit(
      {
        intent: "save",
        sampleId: selected.id,
        payload: JSON.stringify({
          sampleId: linkedId || null,
          sampleName: values.sampleName?.trim() || null,
          sampleType: values.sampleType?.trim() || null,
          species: values.species?.trim() || null,
          details,
        }),
      },
      { method: "post" },
    );
  }

  return (
    <>
      <Stack
        direction={{ xs: "column", md: "row" }}
        sx={{ mb: 3, justifyContent: "space-between", alignItems: { md: "center" }, gap: 2 }}
      >
        <Box>
          <Typography component="h1" variant="h6" sx={{ fontWeight: 750 }}>
            {t("samples.sessionTitle", { reference: session.reference })}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t("samples.startAt", {
              date: new Intl.DateTimeFormat(locale, {
                dateStyle: "long",
                timeStyle: "short",
                hour12: false,
              }).format(new Date(session.startsAt)),
            })}
          </Typography>
        </Box>
        <Stack direction="row" sx={{ flexWrap: "wrap", gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddCircleOutlineIcon />}
            disabled={busy || locked}
            onClick={() => setAddOpen(true)}
          >
            {t("samples.addSamples")}
          </Button>
          <Tooltip title={t("samples.customizeFieldHint")}>
            <span>
              <Button variant="contained" color="inherit" startIcon={<TuneIcon />} disabled>
                {t("samples.customizeField")}
              </Button>
            </span>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<LocalCafeOutlinedIcon />}
            onClick={() => void navigate(`/cupping/${session.id}/cup`)}
          >
            {t("samples.cupNow")}
          </Button>
        </Stack>
      </Stack>

      {locked && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t("samples.blindNotice")}
        </Alert>
      )}

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "260px minmax(0, 1fr)" }, gap: 2, alignItems: "start" }}>
        <Stack spacing={1}>
          {samples.map((sample) => {
            const active = sample.id === selected?.id;
            return (
              <Card
                key={sample.id}
                onClick={() => setSelectedId(sample.id)}
                sx={{
                  p: 1.5,
                  cursor: "pointer",
                  display: "flex",
                  gap: 1,
                  alignItems: "flex-start",
                  borderColor: active ? "primary.main" : undefined,
                  bgcolor: active ? "rgba(59,128,97,.06)" : undefined,
                }}
              >
                <DragIndicatorIcon fontSize="small" sx={{ color: "text.disabled", mt: 0.25 }} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: active ? "primary.main" : undefined }}>
                    {sample.ordinal} {sample.sampleName || t("samples.unnamed")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                    {sample.label}
                    {sample.species ? ` · ${sample.species}` : ""}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[protocolLabel, sample.sampleType].filter(Boolean).join(" | ")}
                  </Typography>
                </Box>
              </Card>
            );
          })}
        </Stack>

        <Card>
          <Stack
            direction="row"
            sx={{ p: 2, alignItems: "center", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}
          >
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <ListAltOutlinedIcon fontSize="small" color="primary" />
              <Typography sx={{ fontWeight: 700 }}>{t("samples.heading")}</Typography>
            </Stack>
            {locked ? (
              <Typography variant="caption" color="text.secondary">
                {t("samples.blindReadOnly")}
              </Typography>
            ) : (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="inherit"
                  endIcon={<ArrowDropDownIcon />}
                  onClick={(event: MouseEvent<HTMLElement>) => setActionAnchor(event.currentTarget)}
                >
                  {t("samples.action")}
                </Button>
                <Button variant="contained" disabled={busy} onClick={save}>
                  {busy ? t("samples.saving") : t("samples.save")}
                </Button>
                <Button
                  variant="outlined"
                  color="inherit"
                  disabled={busy}
                  onClick={() => selected && setValues(valuesFor(selected, protocolLabel))}
                >
                  {t("samples.discard")}
                </Button>
              </Stack>
            )}
          </Stack>
          <Divider />
          {library.length > 0 && (
          <Box sx={{ px: { xs: 2, md: 3 }, pt: 2.5 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, mb: 0.75 }}>
              {t("samples.linkedSample")}
            </Typography>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
              <TextField
                select
                fullWidth
                id="linked-sample"
                value={linkedId}
                disabled={locked}
                onChange={(event) => setLinkedId(event.target.value)}
                sx={{ maxWidth: 420 }}
              >
                <MenuItem value="">{t("samples.noLinkedSample")}</MenuItem>
                {library.map((item: LibrarySample) => (
                  <MenuItem key={item.id} value={item.id}>
                    <Box
                      component="span"
                      sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700, mr: 1 }}
                    >
                      {item.tag}
                    </Box>
                    {item.name}
                    {item.species ? ` · ${item.species}` : ""}
                  </MenuItem>
                ))}
              </TextField>
              <Typography variant="caption" color="text.secondary">
                {linkedId ? t("samples.linkedHint") : t("samples.unlinkedHint")}
              </Typography>
            </Stack>
          </Box>
          )}
          <Box
            sx={{
              p: { xs: 2, md: 3 },
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(4, 1fr)" },
              gap: 2.5,
            }}
          >
            {sampleFields.map((field) => (
              <SampleFieldInput
                key={field.key}
                field={field}
                label={t(`sampleFields.${field.key}`)}
                value={values[field.key] ?? ""}
                locked={locked}
                onChange={(next) => setValues((current) => ({ ...current, [field.key]: next }))}
              />
            ))}
          </Box>
        </Card>
      </Box>

      <Menu anchorEl={actionAnchor} open={Boolean(actionAnchor)} onClose={() => setActionAnchor(null)}>
        <MenuItem
          disabled={samples.length <= 1}
          sx={{ gap: 1.25, color: "error.main" }}
          onClick={() => {
            if (selected) {
              void submit({ intent: "delete", sampleId: selected.id }, { method: "post" });
              setSelectedId("");
            }
            setActionAnchor(null);
          }}
        >
          <DeleteOutlineIcon fontSize="small" />
          {t("samples.deleteSample")}
        </MenuItem>
      </Menu>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)}>
        <DialogTitle>{t("samples.addSamplesTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("samples.addSamplesDescription")}</DialogContentText>
          <TextField
            autoFocus
            type="number"
            label={t("samples.howMany")}
            value={addCount}
            onChange={(event) => setAddCount(Number(event.target.value))}
            slotProps={{ htmlInput: { min: 1, max: 40 } }}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setAddOpen(false)}>
            {t("common:actions.cancel")}
          </Button>
          <Button
            variant="contained"
            onClick={() => {
              void submit({ intent: "add", count: String(Math.max(1, addCount)) }, { method: "post" });
              setAddOpen(false);
            }}
          >
            {t("samples.addSamples")}
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
