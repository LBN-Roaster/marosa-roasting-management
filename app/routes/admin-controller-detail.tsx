import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
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
import Typography from "@mui/material/Typography";
import { Suspense } from "react";
import { useTranslation } from "react-i18next";
import {
  Await,
  Link,
  useLoaderData,
  useNavigate,
  useSearchParams,
} from "react-router";
import { AdminShell } from "~/components/admin-shell";
import {
  getAdminController,
  type AdminController,
  type AdminControllerDetail,
  type RoastUploadStatus,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-controller-detail";

const uploadStatuses: RoastUploadStatus[] = [
  "PENDING",
  "UPLOADED",
  "PROCESSING",
  "PROCESSED",
  "FAILED",
];

type LogStatusFilter = RoastUploadStatus | "all";
type LogSortField = "roastedAt" | "uploadedAt";
type SortDirection = "asc" | "desc";

function logStatusFilter(value: string | null): LogStatusFilter {
  return uploadStatuses.includes(value as RoastUploadStatus)
    ? (value as RoastUploadStatus)
    : "all";
}

function logSortField(value: string | null): LogSortField {
  return value === "uploadedAt" ? "uploadedAt" : "roastedAt";
}

export function meta() {
  return [{ title: "Controller | MAROSA" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  // Deferred: return the promise so the page chrome (back button) streams instantly
  // and the controller header + logs fill in behind skeletons.
  // Log pagination is server-driven via ?page/?size on the URL.
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
  const status = logStatusFilter(url.searchParams.get("status"));
  const sortBy = logSortField(url.searchParams.get("sortBy"));
  const direction: SortDirection =
    url.searchParams.get("direction") === "asc" ? "asc" : "desc";
  return {
    detail: getAdminController(request, params.controllerId, {
      page,
      size,
      status: status === "all" ? undefined : status,
      sort: sortBy,
      direction,
    }),
    status,
    sortBy,
    direction,
  };
}

function formatDate(value: string | null, locale: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function uploadStatusColor(status: RoastUploadStatus) {
  if (status === "PROCESSED") return "success" as const;
  if (status === "FAILED") return "error" as const;
  if (status === "PROCESSING") return "info" as const;
  if (status === "UPLOADED") return "secondary" as const;
  return "warning" as const;
}

// Let the wide logs table use the extra gutter on large screens.
const expandedTableCardSx = {
  width: {
    lg: "calc(100% + max(0px, calc((100vw - 1200px) / 2)))",
  },
};

function ControllerHeaderSkeleton() {
  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5, lineHeight: 1.5 }}
      >
        <Skeleton width={120} />
      </Typography>
      <Skeleton variant="text" width={280} sx={{ fontSize: "2.125rem" }} />
      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1 }}>
        <Skeleton width={220} />
        <Skeleton width={220} />
      </Stack>
    </Box>
  );
}

function ControllerHeader({ controller }: { controller: AdminController }) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";

  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5, lineHeight: 1.5 }}
      >
        {t("admin.controllerDetails")}
      </Typography>
      <Typography variant="h4" component="h1" sx={{ fontFamily: "monospace" }}>
        {controller.serialNumber}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1 }}>
        <Typography color="text.secondary">
          {t("admin.roastery")}: <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>{controller.organizationName ?? t("admin.unlinked")}</Box>
        </Typography>
        <Typography color="text.secondary">
          {t("admin.roaster")}: <Box component="span" sx={{ color: "text.primary", fontWeight: 600 }}>{controller.roasterName ?? "—"}</Box>
        </Typography>
        <Typography color="text.secondary">
          {t("admin.lastUpload")}: {formatDate(controller.lastUploadAt, locale)}
        </Typography>
      </Stack>
    </Box>
  );
}

function LogsCardSkeleton() {
  return (
    <Card sx={expandedTableCardSx}>
      <CardContent sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Skeleton width={160} sx={{ fontSize: "1.25rem" }} />
        <Skeleton width={320} />
      </CardContent>
      <Box sx={{ p: 2 }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} height={44} />
        ))}
      </Box>
    </Card>
  );
}

function LogsCard({
  detail,
  status,
  sortBy,
  direction,
}: {
  detail: AdminControllerDetail;
  status: LogStatusFilter;
  sortBy: LogSortField;
  direction: SortDirection;
}) {
  const { controller, logs } = detail;
  const { t, i18n } = useTranslation("common");
  const navigate = useNavigate();
  const [, setSearchParams] = useSearchParams();
  const locale = i18n.resolvedLanguage ?? "en";

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

  function changeStatus(nextStatus: LogStatusFilter) {
    setSearchParams(
      (prev) => {
        if (nextStatus === "all") {
          prev.delete("status");
        } else {
          prev.set("status", nextStatus);
        }
        prev.set("page", "0");
        return prev;
      },
      { preventScrollReset: true },
    );
  }

  function changeSort(field: LogSortField) {
    const nextDirection: SortDirection =
      sortBy === field && direction === "desc" ? "asc" : "desc";
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

  function sortableHeader(field: LogSortField, label: string) {
    return (
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? direction : "desc"}
        onClick={() => changeSort(field)}
      >
        {label}
      </TableSortLabel>
    );
  }

  return (
    <Card sx={expandedTableCardSx}>
      <CardContent sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ justifyContent: "space-between", alignItems: { sm: "center" } }}
        >
          <Box>
            <Typography variant="h6">{t("admin.uploadedLogs")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              {t("admin.uploadedLogsDescription")}
            </Typography>
          </Box>
          <FormControl size="small" sx={{ minWidth: 190 }}>
            <InputLabel id="log-status-filter-label">{t("admin.status")}</InputLabel>
            <Select
              labelId="log-status-filter-label"
              value={status}
              label={t("admin.status")}
              onChange={(event) =>
                changeStatus(event.target.value as LogStatusFilter)
              }
            >
              <MenuItem value="all">{t("admin.allStatuses")}</MenuItem>
              {uploadStatuses.map((uploadStatus) => (
                <MenuItem key={uploadStatus} value={uploadStatus}>
                  {t(`admin.statusLabels.${uploadStatus}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </CardContent>
      <TableContainer>
        <Table
          aria-label={t("admin.uploadedLogs")}
          sx={{ minWidth: 1120, tableLayout: "fixed" }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 420 }}>{t("admin.file")}</TableCell>
              <TableCell sx={{ width: 240 }}>
                {sortableHeader("roastedAt", t("admin.roastTime"))}
              </TableCell>
              <TableCell sx={{ width: 240 }}>
                {sortableHeader("uploadedAt", t("admin.uploadedAt"))}
              </TableCell>
              <TableCell sx={{ width: 220 }}>{t("admin.status")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {logs.content.map((log) => (
              <TableRow
                hover
                key={log.uploadId}
                role="link"
                tabIndex={0}
                onClick={() =>
                  void navigate(`/admin/controllers/${controller.id}/logs/${log.uploadId}`)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void navigate(`/admin/controllers/${controller.id}/logs/${log.uploadId}`);
                  }
                }}
                sx={{ cursor: "pointer", "&:last-child td": { borderBottom: 0 } }}
              >
                <TableCell>
                  <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                    <DescriptionOutlinedIcon fontSize="small" color="action" />
                    <Box sx={{ minWidth: 0, maxWidth: 250 }}>
                      <Typography
                        variant="body2"
                        title={log.filename}
                        noWrap
                        sx={{ fontWeight: 650 }}
                      >
                        {log.filename}
                      </Typography>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        title={log.roastId ?? log.uploadId}
                        noWrap
                        sx={{ display: "block", fontFamily: "monospace" }}
                      >
                        {log.roastId ?? log.uploadId}
                      </Typography>
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.roastedAt, locale)}</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>{formatDate(log.uploadedAt, locale)}</TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    color={uploadStatusColor(log.status)}
                    label={t(`admin.statusLabels.${log.status}`)}
                  />
                </TableCell>
              </TableRow>
            ))}
            {logs.content.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8, color: "text.secondary" }}>
                  {status === "all" ? t("admin.noLogs") : t("admin.noLogsForStatus")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={logs.totalElements}
        page={logs.page}
        rowsPerPage={logs.size}
        rowsPerPageOptions={[10, 20, 50]}
        onPageChange={(_, next) => changePage(next)}
        onRowsPerPageChange={(event) => changeSize(parseInt(event.target.value, 10))}
      />
    </Card>
  );
}

export default function AdminControllerDetailPage() {
  const { detail, status, sortBy, direction } = useLoaderData<typeof loader>();
  const { t } = useTranslation("common");

  return (
    <AdminShell
      header={
        <Box sx={{ mb: 3.5 }}>
          <Button
            component={Link}
            to="/admin"
            prefetch="intent"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 2, px: 0.5 }}
          >
            {t("admin.back")}
          </Button>
          <Suspense fallback={<ControllerHeaderSkeleton />}>
            <Await resolve={detail}>
              {(resolved) => <ControllerHeader controller={resolved.controller} />}
            </Await>
          </Suspense>
        </Box>
      }
    >
      <Suspense fallback={<LogsCardSkeleton />}>
        <Await resolve={detail}>
          {(resolved) => (
            <LogsCard
              detail={resolved}
              status={status}
              sortBy={sortBy}
              direction={direction}
            />
          )}
        </Await>
      </Suspense>
    </AdminShell>
  );
}
