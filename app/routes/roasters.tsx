import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import MemoryOutlinedIcon from "@mui/icons-material/MemoryOutlined";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useActionData, useLoaderData, useNavigation, useRouteLoaderData, useSubmit } from "react-router";
import { PageHeading } from "~/components/page-heading";
import type { AppLayoutData } from "~/components/organization-switcher";
import {
  createRoaster,
  deleteRoaster,
  getOrganizationControllers,
  getRoasters,
  installRoasterController,
  updateRoaster,
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

type ActionError = "nameTaken" | "forbidden" | "failed";

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
    } else {
      return { intent, error: "failed" as ActionError };
    }
    return { intent, error: null };
  } catch (error) {
    if (!(error instanceof Response) || error.status < 400 || error.status >= 500) throw error;
    const byStatus: Record<number, ActionError> = { 403: "forbidden", 409: "nameTaken" };
    return { intent, error: byStatus[error.status] ?? ("failed" as ActionError) };
  }
}

type Draft = {
  id: string | null;
  name: string;
  brand: string;
  model: string;
  capacityKg: string;
  location: string;
  notes: string;
};

const emptyDraft: Draft = { id: null, name: "", brand: "", model: "", capacityKg: "", location: "", notes: "" };

function draftOf(roaster: Roaster): Draft {
  return {
    id: roaster.id,
    name: roaster.name,
    brand: roaster.brand ?? "",
    model: roaster.model ?? "",
    capacityKg: roaster.capacityKg == null ? "" : String(roaster.capacityKg),
    location: roaster.location ?? "",
    notes: roaster.notes ?? "",
  };
}

/** Owners, support staff and platform admins set up roasters; members only view them. */
function useCanManageRoasters() {
  const layout = useRouteLoaderData("routes/app-layout") as AppLayoutData | undefined;
  const role = layout?.activeOrganization?.role;
  return layout?.user.role === "ADMIN" || role === "OWNER" || role === "SUPPORT";
}

export default function RoastersPage() {
  const { roasters, controllers } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const { t } = useTranslation("common");
  const canManage = useCanManageRoasters();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [deleting, setDeleting] = useState<Roaster | null>(null);
  const [toast, setToast] = useState("");

  const busy = navigation.state !== "idle";

  useEffect(() => {
    if (!actionData) return;
    if (actionData.error) {
      // A taken name is shown inside the open form instead.
      if (!(actionData.intent === "save" && actionData.error === "nameTaken")) {
        setToast(t(`roasters.errors.${actionData.error}`));
      }
      return;
    }
    setToast(t("roasters.saved"));
    if (actionData.intent === "save") setDraft(null);
    if (actionData.intent === "delete") setDeleting(null);
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
    };
    void submit(
      { intent: "save", roasterId: draft.id ?? "", payload: JSON.stringify(payload) },
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
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDraft(emptyDraft)}>
              {t("roasters.add")}
            </Button>
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
                    <Typography component="h2" variant="h6" noWrap>{roaster.name}</Typography>
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

      {canManage && controllers.length === 0 && roasters.length > 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>{t("roasters.noControllers")}</Alert>
      )}

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
