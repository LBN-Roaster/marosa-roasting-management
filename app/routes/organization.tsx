import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, useActionData, useLoaderData, useNavigation, useSubmit } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { useRoleLabel } from "~/components/organization-switcher";
import { requireUser } from "~/lib/auth.server";
import {
  cancelOrganizationInvite,
  changeOrganizationMemberRole,
  getCurrentOrganization,
  getOrganizationMembers,
  inviteOrganizationMember,
  removeOrganizationMember,
  renameOrganization,
  resolveOrganizations,
  type OrganizationMember,
  type OrganizationRole,
} from "~/lib/backend.server";
import type { Route } from "./+types/organization";

export function meta() {
  return [{ title: "Roastery | MAROSA" }];
}

const roles: OrganizationRole[] = ["OWNER", "MEMBER", "SUPPORT"];

function isRole(value: unknown): value is OrganizationRole {
  return roles.includes(value as OrganizationRole);
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await requireUser(request);
  const { active } = await resolveOrganizations(request);
  if (!active) {
    return { user, organization: null, members: null };
  }
  const [organization, members] = await Promise.all([
    getCurrentOrganization(request),
    getOrganizationMembers(request),
  ]);
  return { user, organization, members };
}

type ActionError = "alreadyMember" | "lastOwner" | "forbidden" | "invalid" | "failed";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = String(formData.get("intent") ?? "");
  try {
    if (intent === "rename") {
      await renameOrganization(request, String(formData.get("name") ?? "").trim());
    } else if (intent === "invite") {
      const role = formData.get("role");
      if (!isRole(role)) return { intent, error: "invalid" as ActionError };
      await inviteOrganizationMember(request, String(formData.get("email") ?? "").trim(), role);
    } else if (intent === "cancelInvite") {
      await cancelOrganizationInvite(request, String(formData.get("inviteId")));
    } else if (intent === "changeRole") {
      const role = formData.get("role");
      if (!isRole(role)) return { intent, error: "invalid" as ActionError };
      await changeOrganizationMemberRole(request, String(formData.get("userId")), role);
    } else if (intent === "remove") {
      await removeOrganizationMember(request, String(formData.get("userId")));
    } else {
      return { intent, error: "invalid" as ActionError };
    }
    return { intent, error: null };
  } catch (error) {
    if (!(error instanceof Response)) throw error;
    // The backend answers 409 for exactly one rule per action: a duplicate
    // invitation, or the last owner being demoted or removed.
    const conflict: ActionError = intent === "invite" ? "alreadyMember" : "lastOwner";
    const byStatus: Record<number, ActionError> = { 400: "invalid", 403: "forbidden", 409: conflict };
    if (error.status >= 400 && error.status < 500) {
      return { intent, error: byStatus[error.status] ?? "failed" };
    }
    throw error;
  }
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(value));
}

function displayName(member: OrganizationMember) {
  return member.name?.trim() || member.email;
}

export default function OrganizationPage() {
  const { user, organization, members } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const { t, i18n } = useTranslation("common");
  const roleLabel = useRoleLabel();
  const [toast, setToast] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("MEMBER");
  const [removing, setRemoving] = useState<OrganizationMember | null>(null);

  const busy = navigation.state !== "idle";
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";

  useEffect(() => {
    if (!actionData) return;
    if (actionData.error) {
      setToast(t(`organization.errors.${actionData.error}`));
      return;
    }
    setToast(t("organization.saved"));
    if (actionData.intent === "invite") {
      setInviteEmail("");
      setInviteRole("MEMBER");
    }
    if (actionData.intent === "remove") setRemoving(null);
  }, [actionData, t]);

  if (!organization || !members) {
    return (
      <Box sx={{ maxWidth: 640 }}>
        <PageHeading eyebrow={t("organization.eyebrow")} title={t("organization.empty.title")} />
        <Alert severity="info">{t("organization.empty.body", { email: user.email })}</Alert>
      </Box>
    );
  }

  const canManage = organization.canManage;

  return (
    <Box>
      <PageHeading
        eyebrow={t("organization.eyebrow")}
        title={organization.name}
        description={t("organization.description")}
        actions={<Chip label={roleLabel(organization, user)} color="primary" variant="outlined" />}
      />

      <Stack spacing={3}>
        {canManage && (
          <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
              {t("organization.details")}
            </Typography>
            <Form method="post" key={organization.name}>
              <input type="hidden" name="intent" value="rename" />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "flex-start" } }}>
                <TextField
                  name="name"
                  label={t("organization.name")}
                  defaultValue={organization.name}
                  required
                  size="small"
                  slotProps={{ htmlInput: { maxLength: 255 } }}
                  sx={{ flex: 1, maxWidth: { sm: 420 } }}
                />
                <Button type="submit" variant="outlined" disabled={busy}>
                  {t("organization.saveName")}
                </Button>
              </Stack>
            </Form>
          </Card>
        )}

        <Card variant="outlined">
          <Box sx={{ px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 3 }, pb: 1.5 }}>
            <Typography component="h2" variant="h6">
              {t("organization.members")} ({members.members.length})
            </Typography>
            {!canManage && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {t("organization.onlyOwners")}
              </Typography>
            )}
          </Box>
          <Divider />
          <Stack divider={<Divider />}>
            {members.members.map((member) => {
              const isYou = member.email.toLowerCase() === user.email.toLowerCase();
              return (
                <Stack
                  key={member.userId}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={{ xs: 1.5, sm: 2 }}
                  sx={{ px: { xs: 2, sm: 3 }, py: 1.75, alignItems: { sm: "center" } }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
                    <Avatar src={member.picture ?? undefined} alt="" sx={{ width: 36, height: 36 }}>
                      {displayName(member)[0]?.toUpperCase()}
                    </Avatar>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {displayName(member)}
                        {isYou && (
                          <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                            {t("organization.you")}
                          </Typography>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="p">
                        {member.email} · {t("organization.joined", { date: formatDate(member.joinedAt, locale) })}
                      </Typography>
                    </Box>
                  </Stack>

                  {canManage ? (
                    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                      <TextField
                        select
                        size="small"
                        value={member.role}
                        disabled={busy}
                        aria-label={t("organization.role")}
                        onChange={(event) => void submit(
                          { intent: "changeRole", userId: member.userId, role: event.target.value },
                          { method: "post" },
                        )}
                        sx={{ minWidth: 150 }}
                      >
                        {roles.map((role) => (
                          <MenuItem key={role} value={role}>{t(`organization.roles.${role}`)}</MenuItem>
                        ))}
                      </TextField>
                      <IconButton
                        aria-label={t("organization.remove.action", { name: displayName(member) })}
                        onClick={() => setRemoving(member)}
                        disabled={busy}
                      >
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Stack>
                  ) : (
                    <Chip label={t(`organization.roles.${member.role}`)} size="small" variant="outlined" />
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Card>

        {canManage && (
          <Card variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography component="h2" variant="h6">
              {t("organization.invite.title")}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 2, maxWidth: 640 }}>
              {t("organization.invite.description")}
            </Typography>
            <Form method="post">
              <input type="hidden" name="intent" value="invite" />
              <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} sx={{ alignItems: { md: "flex-start" } }}>
                <TextField
                  name="email"
                  type="email"
                  label={t("organization.invite.email")}
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  required
                  size="small"
                  sx={{ flex: 1, maxWidth: { md: 360 } }}
                />
                <TextField
                  select
                  name="role"
                  label={t("organization.role")}
                  value={inviteRole}
                  onChange={(event) => setInviteRole(event.target.value as OrganizationRole)}
                  size="small"
                  helperText={t(`organization.roleHelp.${inviteRole}`)}
                  sx={{ minWidth: 200, maxWidth: { md: 280 } }}
                >
                  {roles.map((role) => (
                    <MenuItem key={role} value={role}>{t(`organization.roles.${role}`)}</MenuItem>
                  ))}
                </TextField>
                <Button type="submit" variant="contained" startIcon={<PersonAddAltOutlinedIcon />} disabled={busy}>
                  {t("organization.invite.submit")}
                </Button>
              </Stack>
            </Form>

            {members.invites.length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t("organization.pending.title")}
                </Typography>
                <Stack divider={<Divider />} sx={{ border: 1, borderColor: "divider", borderRadius: 2 }}>
                  {members.invites.map((invite) => (
                    <Stack
                      key={invite.id}
                      direction="row"
                      spacing={1.5}
                      sx={{ px: 2, py: 1.25, alignItems: "center" }}
                    >
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" noWrap>{invite.email}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {t(`organization.roles.${invite.role}`)} · {t("organization.pending.invited", { date: formatDate(invite.invitedAt, locale) })}
                        </Typography>
                      </Box>
                      <Form method="post">
                        <input type="hidden" name="intent" value="cancelInvite" />
                        <input type="hidden" name="inviteId" value={invite.id} />
                        <IconButton
                          type="submit"
                          disabled={busy}
                          aria-label={t("organization.pending.cancel", { email: invite.email })}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Form>
                    </Stack>
                  ))}
                </Stack>
              </Box>
            )}
          </Card>
        )}
      </Stack>

      <Dialog open={Boolean(removing)} onClose={() => setRemoving(null)}>
        {removing && (
          <Form method="post">
            <input type="hidden" name="intent" value="remove" />
            <input type="hidden" name="userId" value={removing.userId} />
            <DialogTitle>{t("organization.remove.title", { name: displayName(removing) })}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("organization.remove.body")}</DialogContentText>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setRemoving(null)}>{t("actions.cancel")}</Button>
              <Button type="submit" color="error" variant="contained" disabled={busy}>
                {t("organization.remove.confirm")}
              </Button>
            </DialogActions>
          </Form>
        )}
      </Dialog>

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast("")}
        message={toast}
      />
    </Box>
  );
}
