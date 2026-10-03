import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import AddIcon from "@mui/icons-material/Add";
import KeyIcon from "@mui/icons-material/Key";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Chip from "@mui/material/Chip";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Await,
  Form,
  useActionData,
  useFetcher,
  useLoaderData,
  useNavigate,
  useNavigation,
  useSearchParams,
} from "react-router";
import { AdminShell } from "~/components/admin-shell";
import { PageHeading } from "~/components/page-heading";
import { requireAdmin } from "~/lib/auth.server";
import {
  createAdminController,
  getAdminControllers,
  getAdminOrganizations,
  type AdminController,
  type AdminOrganization,
  type ControllerApiKeyCreated,
  type ControllerApiKeySummary,
  type PageResponse,
} from "~/lib/backend.server";
import type {
  ControllerApiKeyListData,
  ControllerApiKeyMutationData,
} from "./admin-controller-api-keys";
import type { Route } from "./+types/admin-controllers";

type ControllerSortField = "serialNumber" | "lastUploadAt";
type SortDirection = "asc" | "desc";

function controllerSortField(value: string | null): ControllerSortField {
  return value === "lastUploadAt" ? value : "serialNumber";
}

export function meta() {
  return [{ title: "Admin · Controllers | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Page/size come from the URL so pagination is server-driven and shareable.
  // Return the promise (do NOT await) so the shell streams behind a skeleton.
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
  const sortBy = controllerSortField(url.searchParams.get("sortBy"));
  const direction: SortDirection =
    url.searchParams.get("direction") === "desc" ? "desc" : "asc";
  return {
    controllers: getAdminControllers(request, {
      page,
      size,
      sort: sortBy,
      direction,
    }),
    // A short list, needed by the register dialog as soon as it opens.
    organizations: await getAdminOrganizations(request),
    sortBy,
    direction,
  };
}

export async function action({ request }: Route.ActionArgs) {
  await requireAdmin(request);
  const formData = await request.formData();
  const organizationId = String(formData.get("organizationId") ?? "");
  try {
    await createAdminController(request, {
      serialNumber: String(formData.get("serialNumber") ?? "").trim(),
      organizationId: organizationId || null,
    });
    return { error: null };
  } catch (error) {
    if (error instanceof Response && error.status === 409) return { error: "serialTaken" as const };
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { error: "registerFailed" as const };
    }
    throw error;
  }
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function ControllersTableSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} height={44} />
      ))}
    </Box>
  );
}

function ControllerApiKeyDialog({
  controller,
  open,
  onClose,
}: {
  controller: AdminController;
  open: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";
  const listFetcher = useFetcher<ControllerApiKeyListData>();
  const mutationFetcher = useFetcher<ControllerApiKeyMutationData>();
  const resourcePath = `/admin/controllers/${encodeURIComponent(controller.id)}/api-keys`;
  const [issued, setIssued] = useState<ControllerApiKeyCreated | null>(null);
  const [revoked, setRevoked] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<"request" | "copy" | null>(null);
  const [requestedIntent, setRequestedIntent] = useState<
    "generate" | "revoke" | null
  >(null);
  const [requestedKeyId, setRequestedKeyId] = useState<string | null>(null);
  const pending = mutationFetcher.state !== "idle";

  useEffect(() => {
    void listFetcher.load(resourcePath);
  }, [resourcePath]);

  useEffect(() => {
    if (!mutationFetcher.data) return;
    setRequestedIntent(null);
    setRequestedKeyId(null);
    if (!mutationFetcher.data.success) {
      setError("request");
      return;
    }
    setError(null);
    if ("apiKey" in mutationFetcher.data && mutationFetcher.data.apiKey) {
      setIssued(mutationFetcher.data.apiKey);
      setRevoked(false);
      setDeleted(false);
    } else if (
      "keyId" in mutationFetcher.data &&
      mutationFetcher.data.keyId
    ) {
      if (issued?.keyId === mutationFetcher.data.keyId) {
        setRevoked(true);
      }
      setDeleted(true);
    }
    void listFetcher.load(resourcePath);
  }, [mutationFetcher.data, resourcePath]);

  function resetAndClose() {
    if (pending) return;
    setIssued(null);
    setRevoked(false);
    setDeleted(false);
    setCopied(false);
    setError(null);
    setRequestedIntent(null);
    setRequestedKeyId(null);
    onClose();
  }

  function generate() {
    setError(null);
    setDeleted(false);
    setCopied(false);
    setRevoked(false);
    setRequestedIntent("generate");
    setRequestedKeyId(null);
    void mutationFetcher.submit(
      { intent: "generate" },
      { method: "post", action: resourcePath },
    );
  }

  function revoke(keyId: string) {
    setError(null);
    setDeleted(false);
    setRequestedIntent("revoke");
    setRequestedKeyId(keyId);
    void mutationFetcher.submit(
      { intent: "revoke", keyId },
      { method: "post", action: resourcePath },
    );
  }

  function confirmAndRevoke(apiKey: ControllerApiKeySummary) {
    const label = `rsk_${apiKey.keyPrefix}_…`;
    if (!window.confirm(t("admin.apiKey.deleteConfirm", { key: label }))) {
      return;
    }
    revoke(apiKey.keyId);
  }

  async function copy() {
    if (!issued) return;
    try {
      await navigator.clipboard.writeText(issued.token);
      setError(null);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("copy");
    }
  }

  const existingKeys = listFetcher.data?.success
    ? listFetcher.data.apiKeys.filter((apiKey) => apiKey.keyId !== issued?.keyId)
    : [];

  return (
    <Dialog
      open={open}
      onClose={resetAndClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="controller-api-key-title"
    >
      <DialogTitle
        id="controller-api-key-title"
        sx={{ display: "flex", gap: 1, alignItems: "center" }}
      >
        <KeyIcon fontSize="small" />
        {t("admin.apiKey.title")}
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Box
            component="span"
            sx={{
              display: "block",
              mb: 0.5,
              fontFamily: "monospace",
              color: "text.primary",
            }}
          >
            {controller.serialNumber}
          </Box>
          {t("admin.apiKey.description")}
        </DialogContentText>

        {issued && (
          <Stack spacing={1.5} sx={{ mt: 2 }}>
            <Alert severity="warning">{t("admin.apiKey.warning")}</Alert>
            <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
              <Box
                component="code"
                sx={{
                  minWidth: 0,
                  flex: 1,
                  overflowX: "auto",
                  whiteSpace: "nowrap",
                  border: 1,
                  borderColor: "divider",
                  borderRadius: 1,
                  bgcolor: "background.default",
                  px: 1.5,
                  py: 1,
                  fontSize: "0.8rem",
                }}
              >
                {issued.token}
              </Box>
              <IconButton
                onClick={() => void copy()}
                aria-label={t("admin.apiKey.copy")}
                color={copied ? "success" : "default"}
              >
                {copied ? <CheckIcon /> : <ContentCopyIcon />}
              </IconButton>
            </Stack>
            {copied && (
              <Typography variant="caption" color="text.secondary">
                {t("admin.apiKey.copied")}
              </Typography>
            )}
          </Stack>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {t(
              error === "copy"
                ? "admin.apiKey.copyFailed"
                : "admin.apiKey.failed",
            )}
          </Alert>
        )}
        {deleted && (
          <Alert severity="success" sx={{ mt: 2 }}>
            {t("admin.apiKey.revoked")}
          </Alert>
        )}

        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2">
            {t("admin.apiKey.existingKeys")}
          </Typography>
          {listFetcher.state !== "idle" && !listFetcher.data && (
            <LinearProgress sx={{ mt: 1.5 }} />
          )}
          {listFetcher.data && !listFetcher.data.success && (
            <Alert severity="error" sx={{ mt: 1.5 }}>
              {t("admin.apiKey.loadFailed")}
            </Alert>
          )}
          {listFetcher.data?.success && existingKeys.length === 0 && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t(
                issued
                  ? "admin.apiKey.noOtherExistingKeys"
                  : "admin.apiKey.noExistingKeys",
              )}
            </Typography>
          )}
          {existingKeys.length > 0 && (
            <Stack spacing={1} sx={{ mt: 1.5 }}>
              {existingKeys.map((apiKey) => (
                <Box
                  key={apiKey.keyId}
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "center",
                    border: 1,
                    borderColor: "divider",
                    borderRadius: 1,
                    p: 1.5,
                  }}
                >
                  <Box sx={{ minWidth: 0, flex: 1 }}>
                    <Typography
                      component="code"
                      variant="body2"
                      sx={{ display: "block", fontFamily: "monospace" }}
                    >
                      rsk_{apiKey.keyPrefix}_…
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t("admin.apiKey.created", {
                        date: formatDate(apiKey.createdAt, locale),
                      })}
                      {" · "}
                      {apiKey.lastUsedAt
                        ? t("admin.apiKey.lastUsed", {
                            date: formatDate(apiKey.lastUsedAt, locale),
                          })
                        : t("admin.apiKey.neverUsed")}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {apiKey.expiresAt
                        ? t("admin.apiKey.expires", {
                            date: formatDate(apiKey.expiresAt, locale),
                          })
                        : t("admin.apiKey.neverExpires")}
                    </Typography>
                  </Box>
                  <Button
                    size="small"
                    color="error"
                    disabled={pending}
                    onClick={() => confirmAndRevoke(apiKey)}
                  >
                    {pending && requestedKeyId === apiKey.keyId
                      ? t("admin.apiKey.revoking")
                      : t("admin.apiKey.delete")}
                  </Button>
                </Box>
              ))}
            </Stack>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ flexWrap: "wrap" }}>
        <Button variant="contained" onClick={generate} disabled={pending}>
          {pending && requestedIntent === "generate"
            ? t("admin.apiKey.generating")
            : issued
              ? t("admin.apiKey.regenerate")
              : t("admin.apiKey.generate")}
        </Button>
        {issued && !revoked && (
          <Button
            color="error"
            onClick={() => revoke(issued.keyId)}
            disabled={pending}
          >
            {pending && requestedIntent === "revoke"
              ? t("admin.apiKey.revoking")
              : t("admin.apiKey.revoke")}
          </Button>
        )}
        <Button color="inherit" onClick={resetAndClose} disabled={pending}>
          {t("admin.apiKey.close")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function ControllersTable({
  page,
  search,
  sortBy,
  direction,
  onOpen,
  onApiKey,
}: {
  page: PageResponse<AdminController>;
  search: string;
  sortBy: ControllerSortField;
  direction: SortDirection;
  onOpen: (controllerId: string) => void;
  onApiKey: (controller: AdminController) => void;
}) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";
  const [, setSearchParams] = useSearchParams();

  // Client-side search filters only the current page of results.
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return page.content;
    return page.content.filter((controller) =>
      [controller.serialNumber, controller.organizationName, controller.roasterName]
        .some((value) => value?.toLocaleLowerCase().includes(query)),
    );
  }, [page.content, search]);

  function changePage(next: number) {
    setSearchParams(
      (prev) => {
        prev.set("page", String(next));
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  function changeSize(size: number) {
    setSearchParams(
      (prev) => {
        prev.set("size", String(size));
        prev.set("page", "0");
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  function changeSort(field: ControllerSortField) {
    const nextDirection: SortDirection =
      sortBy === field
        ? direction === "asc"
          ? "desc"
          : "asc"
        : field === "lastUploadAt"
          ? "desc"
          : "asc";
    setSearchParams(
      (prev) => {
        prev.set("sortBy", field);
        prev.set("direction", nextDirection);
        prev.set("page", "0");
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  function sortableHeader(field: ControllerSortField, label: string) {
    return (
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? direction : "asc"}
        onClick={() => changeSort(field)}
      >
        {label}
      </TableSortLabel>
    );
  }

  return (
    <>
      <TableContainer>
        <Table aria-label={t("admin.controllers")}>
          <TableHead>
            <TableRow>
              <TableCell>
                {sortableHeader("serialNumber", t("admin.serialNumber"))}
              </TableCell>
              <TableCell>{t("admin.roastery")}</TableCell>
              <TableCell>{t("admin.roaster")}</TableCell>
              <TableCell>
                {sortableHeader("lastUploadAt", t("admin.lastUpload"))}
              </TableCell>
              <TableCell align="right">{t("admin.apiKey.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((controller) => (
              <TableRow
                hover
                key={controller.id}
                role="link"
                tabIndex={0}
                onClick={() => onOpen(controller.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(controller.id);
                  }
                }}
                sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {controller.serialNumber}
                </TableCell>
                <TableCell>
                  {controller.organizationName ?? (
                    <Chip size="small" variant="outlined" label={t("admin.unlinked")} />
                  )}
                </TableCell>
                <TableCell>{controller.roasterName ?? "—"}</TableCell>
                <TableCell>
                  {formatDate(controller.lastUploadAt, locale) ?? (
                    <Typography component="span" variant="body2" color="text.secondary">
                      {t("admin.noUpload")}
                    </Typography>
                  )}
                </TableCell>
                <TableCell
                  align="right"
                  onClick={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <Button
                    size="small"
                    startIcon={<KeyIcon />}
                    onClick={() => onApiKey(controller)}
                  >
                    {t("admin.apiKey.action")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8, color: "text.secondary" }}>
                  {t("admin.noControllers")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={page.totalElements}
        page={page.page}
        rowsPerPage={page.size}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, next) => changePage(next)}
        onRowsPerPageChange={(event) => changeSize(parseInt(event.target.value, 10))}
      />
    </>
  );
}

/** Registers a kit before it ships, optionally already linked to the roastery that bought it. */
function RegisterControllerDialog({
  organizations,
  open,
  onClose,
}: {
  organizations: AdminOrganization[];
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation("common");
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [organizationId, setOrganizationId] = useState("");

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <Form method="post">
        <DialogTitle>{t("admin.register.title")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 1 }}>
            <DialogContentText>{t("admin.register.description")}</DialogContentText>
            {actionData?.error && <Alert severity="error">{t(`admin.register.${actionData.error}`)}</Alert>}
            <TextField
              name="serialNumber"
              label={t("admin.serialNumber")}
              required
              autoFocus
              slotProps={{ htmlInput: { maxLength: 255 } }}
            />
            <TextField
              select
              name="organizationId"
              label={t("admin.roastery")}
              value={organizationId}
              onChange={(event) => setOrganizationId(event.target.value)}
              helperText={t("admin.register.roasteryHelp")}
              slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">{t("admin.unlinked")}</MenuItem>
              {organizations.map((organization) => (
                <MenuItem key={organization.id} value={organization.id}>
                  {organization.name}
                </MenuItem>
              ))}
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("actions.cancel")}</Button>
          <Button type="submit" variant="contained" disabled={navigation.state !== "idle"}>
            {t("admin.register.submit")}
          </Button>
        </DialogActions>
      </Form>
    </Dialog>
  );
}

export default function AdminControllersPage() {
  const { controllers, organizations, sortBy, direction } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [apiKeyController, setApiKeyController] = useState<AdminController | null>(null);
  const [registering, setRegistering] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (actionData && !actionData.error) {
      setRegistering(false);
      setToast(t("admin.register.done"));
    }
  }, [actionData, t]);

  function openController(controllerId: string) {
    void navigate(`/admin/controllers/${controllerId}`);
  }

  return (
    <>
      {apiKeyController && (
        <ControllerApiKeyDialog
          controller={apiKeyController}
          open
          onClose={() => setApiKeyController(null)}
        />
      )}
      <RegisterControllerDialog
        organizations={organizations}
        open={registering}
        onClose={() => setRegistering(false)}
      />
      <AdminShell
        header={
          <PageHeading
            title={t("admin.title")}
            description={t("admin.subtitle")}
            actions={
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setRegistering(true)}>
                {t("admin.register.title")}
              </Button>
            }
          />
        }
      >
        <Card>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}
          >
            <TextField
              fullWidth
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("admin.search")}
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
          </Stack>

          <Suspense fallback={<ControllersTableSkeleton />}>
            <Await resolve={controllers}>
              {(page) => (
                <ControllersTable
                  page={page}
                  search={search}
                  sortBy={sortBy}
                  direction={direction}
                  onOpen={openController}
                  onApiKey={setApiKeyController}
                />
              )}
            </Await>
          </Suspense>
        </Card>
      </AdminShell>
      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast("")} message={toast} />
    </>
  );
}
