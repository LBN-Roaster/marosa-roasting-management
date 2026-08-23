import CheckIcon from "@mui/icons-material/Check";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
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
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
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
import Typography from "@mui/material/Typography";
import { Suspense, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Await,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import { AdminShell } from "~/components/admin-shell";
import { PageHeading } from "~/components/page-heading";
import {
  getAdminMachines,
  type AdminMachine,
  type MachineApiKeyCreated,
  type MachineApiKeySummary,
  type MachineStatus,
  type PageResponse,
} from "~/lib/backend.server";
import type {
  MachineApiKeyListData,
  MachineApiKeyMutationData,
} from "./admin-machine-api-keys";
import type { Route } from "./+types/admin-machines";

const statuses: MachineStatus[] = [
  "IN_PRODUCTION",
  "READY_FOR_SHIPPING",
  "SOLD",
  "CONSIGNMENT",
];

type MachineSortField = "serialNumber" | "name" | "lastUploadAt";
type SortDirection = "asc" | "desc";

function machineSortField(value: string | null): MachineSortField {
  if (value === "name" || value === "lastUploadAt") return value;
  return "serialNumber";
}

export function meta() {
  return [{ title: "Admin · Machines | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Page/size come from the URL so pagination is server-driven and shareable.
  // Return the promise (do NOT await) so the shell streams behind a skeleton.
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
  const sortBy = machineSortField(url.searchParams.get("sortBy"));
  const direction: SortDirection =
    url.searchParams.get("direction") === "desc" ? "desc" : "asc";
  return {
    machines: getAdminMachines(request, {
      page,
      size,
      sort: sortBy,
      direction,
    }),
    sortBy,
    direction,
  };
}

function formatDate(value: string | null, locale: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function MachinesTableSkeleton() {
  return (
    <Box sx={{ p: 2 }}>
      {Array.from({ length: 8 }).map((_, index) => (
        <Skeleton key={index} height={44} />
      ))}
    </Box>
  );
}

function MachineApiKeyDialog({
  machine,
  open,
  onClose,
}: {
  machine: AdminMachine;
  open: boolean;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";
  const listFetcher = useFetcher<MachineApiKeyListData>();
  const mutationFetcher = useFetcher<MachineApiKeyMutationData>();
  const resourcePath = `/admin/machines/${encodeURIComponent(machine.id)}/api-keys`;
  const [issued, setIssued] = useState<MachineApiKeyCreated | null>(null);
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

  function confirmAndRevoke(apiKey: MachineApiKeySummary) {
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
      aria-labelledby="machine-api-key-title"
    >
      <DialogTitle
        id="machine-api-key-title"
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
            {machine.serialNumber}
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

function MachinesTable({
  page,
  search,
  status,
  sortBy,
  direction,
  onOpen,
  onApiKey,
}: {
  page: PageResponse<AdminMachine>;
  search: string;
  status: MachineStatus | "all";
  sortBy: MachineSortField;
  direction: SortDirection;
  onOpen: (machineId: string) => void;
  onApiKey: (machine: AdminMachine) => void;
}) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";
  const [, setSearchParams] = useSearchParams();

  // Client-side search/status filters only the current page of results.
  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return page.content.filter((machine) => {
      const matchesSearch =
        !query ||
        machine.serialNumber.toLocaleLowerCase().includes(query) ||
        machine.name?.toLocaleLowerCase().includes(query);
      return matchesSearch && (status === "all" || machine.status === status);
    });
  }, [page.content, search, status]);

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

  function changeSort(field: MachineSortField) {
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

  function sortableHeader(field: MachineSortField, label: string) {
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
        <Table aria-label={t("admin.machines")}>
          <TableHead>
            <TableRow>
              <TableCell>
                {sortableHeader("serialNumber", t("admin.serialNumber"))}
              </TableCell>
              <TableCell>{sortableHeader("name", t("admin.name"))}</TableCell>
              <TableCell>
                {sortableHeader("lastUploadAt", t("admin.lastUpload"))}
              </TableCell>
              <TableCell align="right">{t("admin.apiKey.action")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((machine) => (
              <TableRow
                hover
                key={machine.id}
                role="link"
                tabIndex={0}
                onClick={() => onOpen(machine.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onOpen(machine.id);
                  }
                }}
                sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell sx={{ fontFamily: "monospace", fontWeight: 700 }}>
                  {machine.serialNumber}
                </TableCell>
                <TableCell>{machine.name || "—"}</TableCell>
                <TableCell>
                  {formatDate(machine.lastUploadAt, locale) ?? (
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
                    onClick={() => onApiKey(machine)}
                  >
                    {t("admin.apiKey.action")}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8, color: "text.secondary" }}>
                  {t("admin.noMachines")}
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

export default function AdminMachinesPage() {
  const { machines, sortBy, direction } = useLoaderData<typeof loader>();
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<MachineStatus | "all">("all");
  const [apiKeyMachine, setApiKeyMachine] = useState<AdminMachine | null>(null);

  function openMachine(machineId: string) {
    void navigate(`/admin/machines/${machineId}`);
  }

  return (
    <>
      {apiKeyMachine && (
        <MachineApiKeyDialog
          machine={apiKeyMachine}
          open
          onClose={() => setApiKeyMachine(null)}
        />
      )}
      <AdminShell
        header={<PageHeading title={t("admin.title")} description={t("admin.subtitle")} />}
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
            <FormControl sx={{ minWidth: 190 }}>
              <InputLabel>{t("admin.status")}</InputLabel>
              <Select
                value={status}
                label={t("admin.status")}
                onChange={(event) => setStatus(event.target.value as MachineStatus | "all")}
              >
                <MenuItem value="all">{t("admin.allStatuses")}</MenuItem>
                {statuses.map((value) => (
                  <MenuItem key={value} value={value}>
                    {t(`admin.statusLabels.${value}`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          <Suspense fallback={<MachinesTableSkeleton />}>
            <Await resolve={machines}>
              {(page) => (
                <MachinesTable
                  page={page}
                  search={search}
                  status={status}
                  sortBy={sortBy}
                  direction={direction}
                  onOpen={openMachine}
                  onApiKey={setApiKeyMachine}
                />
              )}
            </Await>
          </Suspense>
        </Card>
      </AdminShell>
    </>
  );
}
