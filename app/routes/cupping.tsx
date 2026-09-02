import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import DriveFileRenameOutlineIcon from "@mui/icons-material/DriveFileRenameOutlineOutlined";
import EditNoteIcon from "@mui/icons-material/EditNote";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import GridViewIcon from "@mui/icons-material/GridView";
import LocalCafeOutlinedIcon from "@mui/icons-material/LocalCafeOutlined";
import MoreHorizIcon from "@mui/icons-material/MoreHoriz";
import RateReviewOutlinedIcon from "@mui/icons-material/RateReviewOutlined";
import ViewListIcon from "@mui/icons-material/ViewList";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Pagination from "@mui/material/Pagination";
import Select from "@mui/material/Select";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { Suspense, useMemo, useState, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import {
  Await,
  useFetcher,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import { PageHeading } from "~/components/page-heading";
import {
  deleteCuppingSession,
  duplicateCuppingSession,
  getCuppingSessions,
  type PageResponse,
} from "~/lib/backend.server";
import {
  cuppingSessionStatus,
  cuppingStatuses,
  type CuppingSessionStatus,
  type CuppingSessionSummary,
} from "~/lib/cupping";
import type { Route } from "./+types/cupping";

export function meta() {
  return [{ title: "Cupping | MAROSA" }];
}

const pageSize = 10;

type StatusFilter = CuppingSessionStatus | "all";
type ViewMode = "list" | "grid";

const statusColors: Record<CuppingSessionStatus, "default" | "info" | "warning" | "success"> = {
  DRAFT: "default",
  READY: "info",
  IN_PROGRESS: "warning",
  COMPLETED: "success",
};

export async function loader({ request }: Route.LoaderArgs) {
  // Page comes from the URL so pagination is server-driven and shareable.
  // Return the promise (do NOT await) so the page streams behind a skeleton.
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "0");
  return {
    sessions: getCuppingSessions(request, { page, size: pageSize }),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get("intent");
  const sessionIds = formData.getAll("sessionId").map(String);

  if (intent === "duplicate" && sessionIds[0]) {
    await duplicateCuppingSession(request, sessionIds[0]);
    return { done: true };
  }
  if (intent === "delete") {
    for (const sessionId of sessionIds) {
      await deleteCuppingSession(request, sessionId);
    }
    return { done: true };
  }
  return { done: false };
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function CupButton({
  session,
  onCup,
}: {
  session: CuppingSessionSummary;
  onCup: (session: CuppingSessionSummary) => void;
}) {
  const { t } = useTranslation("cupping");
  const status = cuppingSessionStatus(session);
  const canCup = status === "READY" || status === "IN_PROGRESS";
  return (
    <Tooltip title={canCup ? "" : t(`statusHint.${status}`)}>
      <span>
        <Button
          size="small"
          variant={canCup ? "contained" : "outlined"}
          color={canCup ? "primary" : "inherit"}
          disabled={!canCup}
          startIcon={<LocalCafeOutlinedIcon />}
          onClick={() => onCup(session)}
        >
          {status === "IN_PROGRESS" ? t("actions.continue") : t("actions.cupNow")}
        </Button>
      </span>
    </Tooltip>
  );
}

function SessionActions({
  session,
  onSamples,
  onEdit,
  onReview,
}: {
  session: CuppingSessionSummary;
  onSamples: (session: CuppingSessionSummary) => void;
  onEdit: (session: CuppingSessionSummary) => void;
  onReview: (session: CuppingSessionSummary) => void;
}) {
  const { t } = useTranslation("cupping");
  return (
    <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
      <Tooltip title={t("actions.samples")}>
        <IconButton size="small" color="primary" onClick={() => onSamples(session)}>
          <EditNoteIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={t("actions.edit")}>
        <IconButton size="small" color="primary" onClick={() => onEdit(session)}>
          <DriveFileRenameOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      <Tooltip title={session.scoredCount ? t("actions.review") : t("actions.reviewHint")}>
        <span>
          <IconButton
            size="small"
            color="primary"
            disabled={!session.scoredCount}
            onClick={() => onReview(session)}
          >
            <RateReviewOutlinedIcon fontSize="small" />
          </IconButton>
        </span>
      </Tooltip>
    </Stack>
  );
}

function SessionsSkeleton() {
  return (
    <Card>
      <Box sx={{ p: 2 }}>
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} height={48} />
        ))}
      </Box>
    </Card>
  );
}

export default function CuppingPage() {
  const { sessions } = useLoaderData<typeof loader>();
  const { t } = useTranslation(["cupping", "common"]);
  const navigate = useNavigate();

  const [status, setStatus] = useState<StatusFilter>("all");
  const [view, setView] = useState<ViewMode>("list");
  const [selected, setSelected] = useState<string[]>([]);

  return (
    <>
      <PageHeading
        eyebrow={t("eyebrow")}
        title={t("title")}
        actions={
          <>
            <Button
              variant="contained"
              startIcon={<LocalCafeOutlinedIcon />}
              onClick={() => void navigate("/cupping/new")}
            >
              {t("actions.new")}
            </Button>
            <Button
              variant="outlined"
              color="inherit"
              disabled={!selected.length}
              startIcon={<FileDownloadOutlinedIcon />}
              form="cupping-export"
              type="submit"
            >
              {t("actions.export")}
              {selected.length ? ` (${selected.length})` : ""}
            </Button>
            <Select
              size="small"
              value={status}
              onChange={(event) => setStatus(event.target.value as StatusFilter)}
              aria-label={t("filter.label")}
              sx={{ minWidth: 150 }}
            >
              <MenuItem value="all">{t("filter.none")}</MenuItem>
              {cuppingStatuses.map((value) => (
                <MenuItem key={value} value={value}>
                  {t(`status.${value}`)}
                </MenuItem>
              ))}
            </Select>
            <ToggleButtonGroup
              exclusive
              size="small"
              value={view}
              onChange={(_, next: ViewMode | null) => next && setView(next)}
            >
              <ToggleButton value="list" aria-label={t("actions.listView")}>
                <ViewListIcon fontSize="small" />
              </ToggleButton>
              <ToggleButton value="grid" aria-label={t("actions.gridView")}>
                <GridViewIcon fontSize="small" />
              </ToggleButton>
            </ToggleButtonGroup>
          </>
        }
      />

      <Suspense fallback={<SessionsSkeleton />}>
        <Await resolve={sessions}>
          {(page) => (
            <SessionList
              page={page}
              status={status}
              view={view}
              selected={selected}
              onSelectedChange={setSelected}
            />
          )}
        </Await>
      </Suspense>
    </>
  );
}

function SessionList({
  page,
  status,
  view,
  selected,
  onSelectedChange,
}: {
  page: PageResponse<CuppingSessionSummary>;
  status: StatusFilter;
  view: ViewMode;
  selected: string[];
  onSelectedChange: (next: string[]) => void;
}) {
  const { t, i18n } = useTranslation(["cupping", "common"]);
  const navigate = useNavigate();
  const fetcher = useFetcher<typeof action>();
  const [, setSearchParams] = useSearchParams();
  const [menuFor, setMenuFor] = useState<{
    session: CuppingSessionSummary;
    anchor: HTMLElement;
  } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string[] | null>(null);
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";

  // The status filter is derived client-side, so it narrows the loaded page
  // rather than querying the backend.
  const visible = useMemo(
    () =>
      page.content.filter(
        (session) => status === "all" || cuppingSessionStatus(session) === status,
      ),
    [page.content, status],
  );
  const allVisibleSelected =
    visible.length > 0 && visible.every((session) => selected.includes(session.id));

  function formatTime(session: CuppingSessionSummary) {
    return new Intl.DateTimeFormat(locale, {
      dateStyle: "short",
      timeStyle: "short",
      hour12: false,
    }).format(new Date(session.startsAt));
  }

  function toggleSelected(id: string, checked: boolean) {
    onSelectedChange(
      checked
        ? [...new Set([...selected, id])]
        : selected.filter((sessionId) => sessionId !== id),
    );
  }

  function toggleAllVisible(checked: boolean) {
    const ids = visible.map((session) => session.id);
    onSelectedChange(
      checked
        ? [...new Set([...selected, ...ids])]
        : selected.filter((sessionId) => !ids.includes(sessionId)),
    );
  }

  function openWorkspace(
    session: CuppingSessionSummary,
    panel: "samples" | "cup" | "review",
  ) {
    void navigate(`/cupping/${session.id}/${panel}`);
  }

  function editSession(session: CuppingSessionSummary) {
    void navigate(`/cupping/${session.id}/edit`);
  }

  function duplicate(sessionId: string) {
    void fetcher.submit({ intent: "duplicate", sessionId }, { method: "post" });
  }

  function confirmDelete() {
    if (!pendingDelete) return;
    const body = new FormData();
    body.set("intent", "delete");
    pendingDelete.forEach((sessionId) => body.append("sessionId", sessionId));
    void fetcher.submit(body, { method: "post" });
    onSelectedChange(selected.filter((id) => !pendingDelete.includes(id)));
    setPendingDelete(null);
  }

  function changePage(next: number) {
    setSearchParams(
      (prev) => {
        prev.set("page", String(next - 1));
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  function exportSelected() {
    const rows = page.content.filter((session) => selected.includes(session.id));
    if (!rows.length) return;
    const csv = [
      [
        t("table.id"),
        t("table.owner"),
        t("table.time"),
        t("table.name"),
        t("table.location"),
        t("table.cuppingForm"),
        t("table.samples"),
        t("table.status"),
      ],
      ...rows.map((session) => [
        session.reference,
        session.owner.name ?? session.owner.email,
        session.startsAt,
        session.name,
        session.location ?? "",
        t(`protocol.${session.protocol}`),
        `${session.scoredCount}/${session.sampleCount}`,
        t(`status.${cuppingSessionStatus(session)}`),
      ]),
    ]
      .map((row) => row.map(csvCell).join(","))
      .join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "cupping-sessions.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  if (!page.totalElements) {
    return (
      <Card sx={{ borderStyle: "dashed" }}>
        <CardContent>
          <Stack sx={{ minHeight: 260, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
            <Typography sx={{ fontWeight: 700 }}>{t("empty.title")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("empty.description")}
            </Typography>
            <Button
              variant="contained"
              size="small"
              startIcon={<LocalCafeOutlinedIcon />}
              sx={{ mt: 2 }}
              onClick={() => void navigate("/cupping/new")}
            >
              {t("actions.new")}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* The export button lives in the page heading, so it targets this form by id. */}
      <Box
        component="form"
        id="cupping-export"
        onSubmit={(event) => {
          event.preventDefault();
          exportSelected();
        }}
      />

      {view === "list" ? (
        <Card sx={{ overflow: "hidden" }}>
          <TableContainer>
            <Table sx={{ minWidth: 1100 }} aria-label={t("eyebrow")}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={allVisibleSelected}
                      indeterminate={
                        !allVisibleSelected &&
                        visible.some((session) => selected.includes(session.id))
                      }
                      onChange={(event) => toggleAllVisible(event.target.checked)}
                      slotProps={{ input: { "aria-label": t("table.selectAll") } }}
                    />
                  </TableCell>
                  <TableCell align="center">{t("table.id")}</TableCell>
                  <TableCell align="center">{t("table.owner")}</TableCell>
                  <TableCell align="center">{t("table.time")}</TableCell>
                  <TableCell>{t("table.name")}</TableCell>
                  <TableCell align="center">{t("table.location")}</TableCell>
                  <TableCell align="center">{t("table.cuppingForm")}</TableCell>
                  <TableCell align="center">{t("table.samples")}</TableCell>
                  <TableCell align="center">{t("table.status")}</TableCell>
                  <TableCell align="center">{t("table.actions")}</TableCell>
                  <TableCell padding="checkbox" />
                </TableRow>
              </TableHead>
              <TableBody>
                {visible.map((session) => (
                  <TableRow
                    hover
                    key={session.id}
                    selected={selected.includes(session.id)}
                    sx={{ "&:last-child td": { borderBottom: 0 } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox
                        checked={selected.includes(session.id)}
                        onChange={(event) => toggleSelected(session.id, event.target.checked)}
                        slotProps={{ input: { "aria-label": t("table.select", { name: session.name }) } }}
                      />
                    </TableCell>
                    <TableCell align="center">{session.reference}</TableCell>
                    <TableCell align="center">
                      {session.owner.name ?? session.owner.email}
                    </TableCell>
                    <TableCell align="center">{formatTime(session)}</TableCell>
                    <TableCell sx={{ fontWeight: 650 }}>{session.name}</TableCell>
                    <TableCell align="center">{session.location || "—"}</TableCell>
                    <TableCell align="center">{t(`protocol.${session.protocol}`)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "center" }}>
                        <Tooltip title={t("actions.samples")}>
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => openWorkspace(session, "samples")}
                          >
                            <EditNoteIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Typography variant="body2" color="text.secondary">
                          {session.scoredCount}/{session.sampleCount}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="center">
                      <CupButton
                        session={session}
                        onCup={(target) => openWorkspace(target, "cup")}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "center" }}>
                        <Tooltip title={t("actions.edit")}>
                          <IconButton size="small" color="primary" onClick={() => editSession(session)}>
                            <DriveFileRenameOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={session.scoredCount ? t("actions.review") : t("actions.reviewHint")}>
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={!session.scoredCount}
                              onClick={() => openWorkspace(session, "review")}
                            >
                              <RateReviewOutlinedIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell padding="checkbox">
                      <IconButton
                        size="small"
                        aria-label={t("table.moreActions", { name: session.name })}
                        onClick={(event: MouseEvent<HTMLElement>) =>
                          setMenuFor({ session, anchor: event.currentTarget })
                        }
                      >
                        <MoreHorizIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!visible.length && (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 8, color: "text.secondary" }}>
                      {t("noResults")}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      ) : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" }, gap: 2 }}>
          {visible.map((session) => {
            const sessionStatus = cuppingSessionStatus(session);
            return (
              <Card key={session.id}>
                <CardContent>
                  <Stack direction="row" sx={{ alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="caption" color="text.secondary">
                        #{session.reference} · {session.owner.name ?? session.owner.email}
                      </Typography>
                      <Typography sx={{ fontWeight: 700 }}>{session.name}</Typography>
                    </Box>
                    <Chip size="small" color={statusColors[sessionStatus]} label={t(`status.${sessionStatus}`)} />
                  </Stack>
                  <Stack spacing={0.5} sx={{ mt: 1.5 }}>
                    <Typography variant="body2" color="text.secondary">{formatTime(session)}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {session.location || "—"} · {t(`protocol.${session.protocol}`)}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t("samplesScored", { scored: session.scoredCount, total: session.sampleCount })}
                    </Typography>
                  </Stack>
                  <Divider sx={{ my: 1.5 }} />
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", justifyContent: "space-between" }}>
                    <CupButton session={session} onCup={(target) => openWorkspace(target, "cup")} />
                    <SessionActions
                      session={session}
                      onSamples={(target) => openWorkspace(target, "samples")}
                      onEdit={editSession}
                      onReview={(target) => openWorkspace(target, "review")}
                    />
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
          {!visible.length && (
            <Card sx={{ gridColumn: "1 / -1", borderStyle: "dashed" }}>
              <CardContent>
                <Typography align="center" color="text.secondary" sx={{ py: 6 }}>
                  {t("noResults")}
                </Typography>
              </CardContent>
            </Card>
          )}
        </Box>
      )}

      {page.totalPages > 1 && (
        <Stack sx={{ mt: 3, alignItems: "center" }}>
          <Pagination
            color="primary"
            shape="rounded"
            count={page.totalPages}
            page={page.page + 1}
            onChange={(_, next) => changePage(next)}
          />
        </Stack>
      )}

      <Menu anchorEl={menuFor?.anchor ?? null} open={Boolean(menuFor)} onClose={() => setMenuFor(null)}>
        <MenuItem
          onClick={() => {
            if (menuFor) duplicate(menuFor.session.id);
            setMenuFor(null);
          }}
          sx={{ gap: 1.25 }}
        >
          <ContentCopyIcon fontSize="small" />
          {t("actions.duplicate")}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuFor) setPendingDelete([menuFor.session.id]);
            setMenuFor(null);
          }}
          sx={{ gap: 1.25, color: "error.main" }}
        >
          <DeleteOutlineIcon fontSize="small" />
          {t("common:actions.delete")}
        </MenuItem>
      </Menu>

      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("deleteDescription", { count: pendingDelete?.length ?? 0 })}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setPendingDelete(null)}>
            {t("common:actions.cancel")}
          </Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>
            {t("common:actions.delete")}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
