import AddIcon from "@mui/icons-material/Add";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Form, useActionData, useLoaderData, useNavigation } from "react-router";
import { AdminShell } from "~/components/admin-shell";
import { PageHeading } from "~/components/page-heading";
import { requireAdmin } from "~/lib/auth.server";
import { createAdminOrganization, getAdminOrganizations } from "~/lib/backend.server";
import type { Route } from "./+types/admin-organizations";

export function meta() {
  return [{ title: "Roasteries | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  await requireAdmin(request);
  return { organizations: await getAdminOrganizations(request) };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  try {
    await createAdminOrganization(request, {
      name: String(formData.get("name") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      ownerEmail: String(formData.get("ownerEmail") ?? "").trim(),
    });
    return { error: null };
  } catch (error) {
    if (error instanceof Response && error.status === 409) return { error: "slugTaken" as const };
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { error: "failed" as const };
    }
    throw error;
  }
}

/** "Nhà rang Đà Lạt" → "nha-rang-da-lat". */
function slugify(name: string) {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/gi, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function AdminOrganizationsPage() {
  const { organizations } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const { t, i18n } = useTranslation("common");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [toast, setToast] = useState("");

  const busy = navigation.state !== "idle";
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";

  useEffect(() => {
    if (actionData && !actionData.error) {
      setToast(t("admin.organizations.created"));
      setOpen(false);
    }
  }, [actionData, t]);

  function openCreate() {
    setName("");
    setSlug("");
    setSlugEdited(false);
    setOpen(true);
  }

  return (
    <AdminShell
      header={
        <PageHeading
          title={t("admin.organizations.title")}
          description={t("admin.organizations.subtitle")}
          actions={
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              {t("admin.organizations.create")}
            </Button>
          }
        />
      }
    >
      <Card variant="outlined">
        {organizations.length === 0 ? (
          <Typography color="text.secondary" sx={{ p: 3 }}>
            {t("admin.organizations.empty")}
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t("admin.organizations.name")}</TableCell>
                  <TableCell>{t("admin.organizations.slug")}</TableCell>
                  <TableCell align="right">{t("admin.organizations.members")}</TableCell>
                  <TableCell>{t("admin.organizations.createdAt")}</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{organization.name}</TableCell>
                    <TableCell sx={{ color: "text.secondary", fontFamily: "monospace" }}>
                      {organization.slug}
                    </TableCell>
                    <TableCell align="right">{organization.memberCount}</TableCell>
                    <TableCell sx={{ color: "text.secondary" }}>
                      {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                        new Date(organization.createdAt),
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Form method="post" action="/organization/switch">
                        <input type="hidden" name="organizationId" value={organization.id} />
                        <input type="hidden" name="returnTo" value="/organization" />
                        <Button type="submit" size="small">
                          {t("admin.organizations.open")}
                        </Button>
                      </Form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Card>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <Form method="post">
          <DialogTitle>{t("admin.organizations.create")}</DialogTitle>
          <DialogContent>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
              {actionData?.error && (
                <Alert severity="error">{t(`admin.organizations.${actionData.error}`)}</Alert>
              )}
              <TextField
                name="name"
                label={t("admin.organizations.name")}
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  if (!slugEdited) setSlug(slugify(event.target.value));
                }}
                required
                autoFocus
                slotProps={{ htmlInput: { maxLength: 255 } }}
              />
              <TextField
                name="slug"
                label={t("admin.organizations.slug")}
                value={slug}
                onChange={(event) => {
                  setSlug(event.target.value);
                  setSlugEdited(true);
                }}
                required
                helperText={t("admin.organizations.slugHelp")}
                slotProps={{ htmlInput: { maxLength: 64, pattern: "[a-z0-9]+(-[a-z0-9]+)*" } }}
              />
              <TextField
                name="ownerEmail"
                type="email"
                label={t("admin.organizations.ownerEmail")}
                required
                helperText={t("admin.organizations.ownerHelp")}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>{t("actions.cancel")}</Button>
            <Button type="submit" variant="contained" disabled={busy}>
              {t("admin.organizations.create")}
            </Button>
          </DialogActions>
        </Form>
      </Dialog>

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </AdminShell>
  );
}
