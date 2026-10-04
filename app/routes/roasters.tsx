import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import PublicOutlinedIcon from "@mui/icons-material/PublicOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import FormControlLabel from "@mui/material/FormControlLabel";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigation, useRouteLoaderData, useSubmit } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { formatWhen } from "~/lib/roastery-time";
import { RoasterStatusChip, UploadProblemChip } from "~/components/roaster-status-chip";
import type { AppLayoutData } from "~/components/organization-switcher";
import {
  claimController,
  createRoaster,
  deleteRoaster,
  getOrganizationControllers,
  getRoasters,
  installRoasterController,
  releaseController,
  updateRoaster,
  type OrganizationController,
  type Roaster,
  type RoasterPayload,
} from "~/lib/backend.server";
import type { Route } from "./+types/roasters";

export function meta() {
  return [{ title: "Roasters | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [roasters, controllers] = await Promise.all([
    getRoasters(request),
    getOrganizationControllers(request),
  ]);
  return { roasters, controllers };
}

type ActionError =
  | "nameTaken"
  | "forbidden"
  | "failed"
  | "invalidCode"
  | "tooManyAttempts"
  | "alreadyClaimed";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  const roasterId = String(formData.get("roasterId") ?? "");
  try {
    if (intent === "save") {
      const payload = JSON.parse(String(formData.get("payload"))) as RoasterPayload;
      if (roasterId) await updateRoaster(request, roasterId, payload);
      else await createRoaster(request, payload);
    } else if (intent === "delete") {
      await deleteRoaster(request, roasterId);
    } else if (intent === "install") {
      const controllerId = String(formData.get("controllerId") ?? "");
      await installRoasterController(request, roasterId, controllerId || null);
    } else if (intent === "claim") {
      const fitTo = String(formData.get("fitTo") ?? "");
      await claimController(request, {
        code: String(formData.get("code") ?? ""),
        roasterId: fitTo && fitTo !== "new" ? fitTo : null,
        newRoasterName: fitTo === "new" ? String(formData.get("newRoasterName") ?? "").trim() : null,
      });
    } else if (intent === "release") {
      await releaseController(request, String(formData.get("controllerId") ?? ""));
    } else {
      return { intent, error: "failed" as ActionError };
    }
    return { intent, error: null };
  } catch (error) {
    if (!(error instanceof Response) || error.status < 400 || error.status >= 500) throw error;
    // A claim's 409 means the kit already has a roastery: the page checks a new
    // roaster's name against the list before sending, so it is never that.
    const byStatus: Record<number, ActionError> =
      intent === "claim"
        ? { 403: "forbidden", 404: "invalidCode", 409: "alreadyClaimed", 429: "tooManyAttempts" }
        : { 403: "forbidden", 409: "nameTaken" };
    return { intent, error: byStatus[error.status] ?? ("failed" as ActionError) };
  }
}

type Draft = {
  id: string | null;
  shareRoastsPublicly: boolean;
  name: string;
  brand: string;
  model: string;
  capacityKg: string;
  location: string;
  notes: string;
};

const emptyDraft: Draft = {
  id: null,
  shareRoastsPublicly: false,
  name: "",
  brand: "",
  model: "",
  capacityKg: "",
  location: "",
  notes: "",
};

function draftOf(roaster: Roaster): Draft {
  return {
    id: roaster.id,
    shareRoastsPublicly: roaster.shareRoastsPublicly,
    name: roaster.name,
    brand: roaster.brand ?? "",
    model: roaster.model ?? "",
    capacityKg: roaster.capacityKg == null ? "" : String(roaster.capacityKg),
    location: roaster.location ?? "",
    notes: roaster.notes ?? "",
  };
}

/**
 * Owners, support staff and platform admins set up roasters and claim kits;
 * only owners and platform admins hand a kit back. Members only view.
 */
function usePermissions() {
  const layout = useRouteLoaderData("routes/app-layout") as AppLayoutData | undefined;
  const role = layout?.activeOrganization?.role;
  const admin = layout?.user.role === "ADMIN";
  return {
    canManage: admin || role === "OWNER" || role === "SUPPORT",
    canRelease: admin || role === "OWNER",
  };
}

const CLAIM_CODE_LENGTH = 8;

/**
 * Letters and digits only, upper-cased, at most 8. No native maxLength on the
 * input: it would cut a pasted "K7QX-M2PA" before the dash is dropped.
 */
function claimCodeCharacters(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, CLAIM_CODE_LENGTH);
}

/** Takes the code shown on the Pi's screen and links that kit to this roastery. */
function ClaimControllerDialog({
  open,
  roasters,
  onClose,
}: {
  open: boolean;
  roasters: Roaster[];
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  /** The 8 code characters only; the dash is display. */
  const [code, setCode] = useState("");
  const [fitTo, setFitTo] = useState("");
  const [newRoasterName, setNewRoasterName] = useState("");

  const nameTaken =
    fitTo === "new" &&
    roasters.some((roaster) => roaster.name.toLocaleLowerCase() === newRoasterName.trim().toLocaleLowerCase());
  const ready =
    code.length === CLAIM_CODE_LENGTH &&
    (fitTo !== "new" || (newRoasterName.trim() !== "" && !nameTaken));
  const claimError = actionData?.intent === "claim" ? actionData.error : null;

  useEffect(() => {
    if (open) {
      setCode("");
      setFitTo("");
      setNewRoasterName("");
    }
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("roasters.claim.title")}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ pt: 1 }}>
          <DialogContentText>{t("roasters.claim.description")}</DialogContentText>
          {claimError && <Alert severity="error">{t(`roasters.errors.${claimError}`)}</Alert>}
          <TextField
            label={t("roasters.claim.code")}
            value={code.length > 4 ? `${code.slice(0, 4)}-${code.slice(4)}` : code}
            onChange={(event) => setCode(claimCodeCharacters(event.target.value))}
            placeholder="XXXX-XXXX"
            required
            autoFocus
            slotProps={{ htmlInput: { autoCapitalize: "characters", autoComplete: "off", spellCheck: false, style: { fontFamily: "monospace", letterSpacing: "0.15em" } } }}
          />
          <TextField
            select
            label={t("roasters.claim.fitTo")}
            value={fitTo}
            onChange={(event) => setFitTo(event.target.value)}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">{t("roasters.claim.fitLater")}</MenuItem>
            {roasters
              .filter((roaster) => !roaster.controller)
              .map((roaster) => (
                <MenuItem key={roaster.id} value={roaster.id}>{roaster.name}</MenuItem>
              ))}
            <MenuItem value="new">{t("roasters.claim.newRoaster")}</MenuItem>
          </TextField>
          {fitTo === "new" && (
            <TextField
              label={t("roasters.fields.name")}
              value={newRoasterName}
              onChange={(event) => setNewRoasterName(event.target.value)}
              required
              error={nameTaken}
              helperText={nameTaken ? t("roasters.errors.nameTaken") : t("roasters.fields.nameHelp")}
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("actions.cancel")}</Button>
        <Button
          variant="contained"
          disabled={!ready || navigation.state !== "idle"}
          onClick={() =>
            void submit({ intent: "claim", code, fitTo, newRoasterName }, { method: "post" })
          }
        >
          {t("roasters.claim.submit")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function RoastersPage() {
  const { roasters, controllers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";
  const { canManage, canRelease } = usePermissions();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [releasing, setReleasing] = useState<OrganizationController | null>(null);
  const [deleting, setDeleting] = useState<Roaster | null>(null);
  const [toast, setToast] = useState("");

  const busy = navigation.state !== "idle";

  useEffect(() => {
    if (!actionData) return;
    if (actionData.error) {
      // A taken name and a failed claim are shown inside the open dialog instead.
      if (!(actionData.intent === "save" && actionData.error === "nameTaken") && actionData.intent !== "claim") {
        setToast(t(`roasters.errors.${actionData.error}`));
      }
      return;
    }
    setToast(t(actionData.intent === "claim" ? "roasters.claim.done" : "roasters.saved"));
    if (actionData.intent === "save") setDraft(null);
    if (actionData.intent === "delete") setDeleting(null);
    if (actionData.intent === "claim") setClaiming(false);
    if (actionData.intent === "release") setReleasing(null);
  }, [actionData, t]);

  function save() {
    if (!draft) return;
    const capacity = draft.capacityKg.trim() === "" ? null : Number(draft.capacityKg);
    const payload: RoasterPayload = {
      name: draft.name.trim(),
      brand: draft.brand.trim() || null,
      model: draft.model.trim() || null,
      capacityKg: capacity != null && Number.isFinite(capacity) ? capacity : null,
      location: draft.location.trim() || null,
      notes: draft.notes.trim() || null,
      shareRoastsPublicly: draft.shareRoastsPublicly,
    };
    void submit(
      { intent: "save", roasterId: draft.id ?? "", payload: JSON.stringify(payload) },
      { method: "post" },
    );
  }

  /** Flips the roaster's public sharing straight from its card, keeping everything else as it is. */
  function setPublicSharing(roaster: Roaster, shareRoastsPublicly: boolean) {
    const payload: RoasterPayload = {
      name: roaster.name,
      brand: roaster.brand,
      model: roaster.model,
      capacityKg: roaster.capacityKg,
      location: roaster.location,
      notes: roaster.notes,
      shareRoastsPublicly,
    };
    void submit(
      { intent: "save", roasterId: roaster.id, payload: JSON.stringify(payload) },
      { method: "post" },
    );
  }

  function install(roaster: Roaster, controllerId: string) {
    void submit({ intent: "install", roasterId: roaster.id, controllerId }, { method: "post" });
  }

  return (
    <>
      <PageHeading
        eyebrow={t("roasters.eyebrow")}
        title={t("roasters.title")}
        description={t("roasters.description")}
        actions={
          canManage && (
            <>
              <Button variant="outlined" startIcon={<MemoryOutlinedIcon />} onClick={() => setClaiming(true)}>
                {t("roasters.claim.title")}
              </Button>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDraft(emptyDraft)}>
                {t("roasters.add")}
              </Button>
            </>
          )
        }
      />

      {roasters.length === 0 ? (
        <Card variant="outlined" sx={{ p: 4, textAlign: "center" }}>
          <Typography color="text.secondary">
            {canManage ? t("roasters.emptyManage") : t("roasters.empty")}
          </Typography>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
          {roasters.map((roaster) => {
            const specs = [
              [roaster.brand, roaster.model].filter(Boolean).join(" "),
              roaster.capacityKg != null && `${roaster.capacityKg} kg`,
              roaster.location,
            ].filter(Boolean);
            return (
              <Card key={roaster.id} variant="outlined" sx={{ p: { xs: 2, sm: 2.5 } }}>
                <Stack direction="row" spacing={1} sx={{ alignItems: "flex-start" }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                      component={Link}
                      to={`/roasters/${encodeURIComponent(roaster.id)}`}
                      prefetch="intent"
                      variant="h6"
                      noWrap
                      sx={{ display: "block", color: "text.primary", textDecoration: "none", "&:hover": { textDecoration: "underline" } }}
                    >
                      {roaster.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {specs.length ? specs.join(" · ") : t("roasters.noDetails")}
                    </Typography>
                  </Box>
                  {canManage && (
                    <>
                      <IconButton
                        aria-label={t("roasters.edit", { name: roaster.name })}
                        onClick={() => setDraft(draftOf(roaster))}
                        disabled={busy}
                      >
                        <EditOutlinedIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        aria-label={t("roasters.delete.action", { name: roaster.name })}
                        onClick={() => setDeleting(roaster)}
                        disabled={busy}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </>
                  )}
                </Stack>

                <Stack direction="row" sx={{ mt: 1.5, flexWrap: "wrap", gap: 1, alignItems: "center" }}>
                  <RoasterStatusChip status={roaster.status} />
                  {roaster.uploadProblem && <UploadProblemChip />}
                  {!canManage && roaster.shareRoastsPublicly && (
                    <Chip size="small" variant="outlined" icon={<PublicOutlinedIcon />} label={t("roasters.publicSharing.on")} />
                  )}
                  <Typography variant="caption" color="text.secondary">
                    {roaster.lastRoastAt
                      ? t("roasters.activity.lastRoast", { when: formatWhen(roaster.lastRoastAt, locale) })
                      : t("roasters.activity.noRoasts")}
                    {" · "}
                    {t("roasters.activity.counts", { today: roaster.roastsToday, week: roaster.roastsThisWeek })}
                  </Typography>
                </Stack>

                {canManage && (
                  <FormControlLabel
                    sx={{ mt: 1.5, ml: 0, alignItems: "flex-start" }}
                    control={
                      <Switch
                        size="small"
                        checked={roaster.shareRoastsPublicly}
                        disabled={busy}
                        onChange={(event) => setPublicSharing(roaster, event.target.checked)}
                      />
                    }
                    label={
                      <Box sx={{ ml: 0.5 }}>
                        <Typography variant="body2">{t("roasters.publicSharing.label")}</Typography>
                        <Typography variant="caption" color="text.secondary">{t("roasters.publicSharing.help")}</Typography>
                      </Box>
                    }
                  />
                )}

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{ mt: 2, alignItems: { sm: "center" }, justifyContent: "space-between" }}
                >
                  {canManage ? (
                    <TextField
                      select
                      size="small"
                      label={t("roasters.controller")}
                      value={roaster.controller?.id ?? ""}
                      disabled={busy}
                      onChange={(event) => install(roaster, event.target.value)}
                      slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
                      sx={{ minWidth: 220 }}
                    >
                      <MenuItem value="">{t("roasters.noController")}</MenuItem>
                      {controllers.map((controller) => (
                        <MenuItem key={controller.id} value={controller.id}>
                          {controller.serialNumber}
                          {controller.roasterId && controller.roasterId !== roaster.id
                            ? ` · ${t("roasters.fittedTo", { name: controller.roasterName })}`
                            : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                  ) : (
                    <Chip
                      icon={<MemoryOutlinedIcon />}
                      variant="outlined"
                      label={roaster.controller?.serialNumber ?? t("roasters.noController")}
                      sx={{ alignSelf: "flex-start" }}
                    />
                  )}
                  <Button
                    component={Link}
                    to={`/roasts?roasterId=${encodeURIComponent(roaster.id)}`}
                    prefetch="intent"
                    startIcon={<LocalFireDepartmentOutlinedIcon />}
                    size="small"
                  >
                    {t("roasters.viewRoasts")}
                  </Button>
                </Stack>
              </Card>
            );
          })}
        </Box>
      )}

      <Typography component="h2" variant="h6" sx={{ mt: 4, mb: 1.5 }}>
        {t("roasters.controllers.title")}
      </Typography>
      {controllers.length === 0 ? (
        <Alert severity="info">{canManage ? t("roasters.noControllers") : t("roasters.controllers.empty")}</Alert>
      ) : (
        <Card variant="outlined">
          <Stack divider={<Box sx={{ borderTop: 1, borderColor: "divider" }} />}>
            {controllers.map((controller) => (
              <Stack
                key={controller.id}
                direction="row"
                spacing={1.5}
                sx={{ px: { xs: 2, sm: 2.5 }, py: 1.5, alignItems: "center" }}
              >
                <MemoryOutlinedIcon fontSize="small" color="action" />
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                    {controller.serialNumber}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {controller.roasterName
                      ? t("roasters.fittedTo", { name: controller.roasterName })
                      : t("roasters.controllers.notFitted")}
                  </Typography>
                </Box>
                {canRelease && (
                  <Button size="small" color="error" disabled={busy} onClick={() => setReleasing(controller)}>
                    {t("roasters.release.action")}
                  </Button>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}

      <ClaimControllerDialog open={claiming} roasters={roasters} onClose={() => setClaiming(false)} />

      <Dialog open={Boolean(releasing)} onClose={() => setReleasing(null)}>
        {releasing && (
          <>
            <DialogTitle>{t("roasters.release.title", { serial: releasing.serialNumber })}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("roasters.release.body")}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReleasing(null)}>{t("actions.cancel")}</Button>
              <Button
                color="error"
                variant="contained"
                disabled={busy}
                onClick={() => void submit({ intent: "release", controllerId: releasing.id }, { method: "post" })}
              >
                {t("roasters.release.confirm")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={Boolean(draft)} onClose={() => setDraft(null)} fullWidth maxWidth="sm">
        {draft && (
          <>
            <DialogTitle>{draft.id ? t("roasters.editTitle") : t("roasters.add")}</DialogTitle>
            <DialogContent>
              <Stack spacing={2} sx={{ pt: 1 }}>
                {actionData?.intent === "save" && actionData.error === "nameTaken" && (
                  <Alert severity="error">{t("roasters.errors.nameTaken")}</Alert>
                )}
                <TextField
                  label={t("roasters.fields.name")}
                  value={draft.name}
                  onChange={(event) => setDraft({ ...draft, name: event.target.value })}
                  required
                  autoFocus
                  helperText={t("roasters.fields.nameHelp")}
                  slotProps={{ htmlInput: { maxLength: 255 } }}
                />
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    label={t("roasters.fields.brand")}
                    value={draft.brand}
                    onChange={(event) => setDraft({ ...draft, brand: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: 255 } }}
                  />
                  <TextField
                    fullWidth
                    label={t("roasters.fields.model")}
                    value={draft.model}
                    onChange={(event) => setDraft({ ...draft, model: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: 255 } }}
                  />
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    type="number"
                    label={t("roasters.fields.capacityKg")}
                    value={draft.capacityKg}
                    onChange={(event) => setDraft({ ...draft, capacityKg: event.target.value })}
                    slotProps={{ htmlInput: { min: 0, step: "0.1" } }}
                  />
                  <TextField
                    fullWidth
                    label={t("roasters.fields.location")}
                    value={draft.location}
                    onChange={(event) => setDraft({ ...draft, location: event.target.value })}
                    slotProps={{ htmlInput: { maxLength: 255 } }}
                  />
                </Stack>
                <TextField
                  label={t("roasters.fields.notes")}
                  value={draft.notes}
                  onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                  multiline
                  minRows={2}
                />
                <FormControlLabel
                  sx={{ ml: 0, alignItems: "flex-start" }}
                  control={
                    <Switch
                      checked={draft.shareRoastsPublicly}
                      onChange={(event) => setDraft({ ...draft, shareRoastsPublicly: event.target.checked })}
                    />
                  }
                  label={
                    <Box sx={{ ml: 0.5, mt: 0.75 }}>
                      <Typography variant="body2">{t("roasters.publicSharing.label")}</Typography>
                      <Typography variant="caption" color="text.secondary">{t("roasters.publicSharing.help")}</Typography>
                    </Box>
                  }
                />
              </Stack>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDraft(null)}>{t("actions.cancel")}</Button>
              <Button variant="contained" onClick={save} disabled={busy || !draft.name.trim()}>
                {t("actions.saveChanges")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog open={Boolean(deleting)} onClose={() => setDeleting(null)}>
        {deleting && (
          <>
            <DialogTitle>{t("roasters.delete.title", { name: deleting.name })}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("roasters.delete.body")}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setDeleting(null)}>{t("actions.cancel")}</Button>
              <Button
                color="error"
                variant="contained"
                disabled={busy}
                onClick={() => void submit({ intent: "delete", roasterId: deleting.id }, { method: "post" })}
              >
                {t("roasters.delete.confirm")}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </>
  );
}
