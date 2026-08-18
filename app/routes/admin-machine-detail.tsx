import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TablePagination from "@mui/material/TablePagination";
import TableRow from "@mui/material/TableRow";
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
  getAdminMachine,
  type AdminMachine,
  type AdminMachineDetail,
  type RoastUploadStatus,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-machine-detail";

export function meta() {
  return [{ title: "Machine | MAROSA" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  // Deferred: return the promise so the page chrome (back button) streams instantly
  // and the machine header + logs fill in behind skeletons.
  // Log pagination is server-driven via ?page/?size on the URL.
  const url = new URL(request.url);
  const page = Number(url.searchParams.get("page") ?? "0");
  const size = Number(url.searchParams.get("size") ?? "20");
  return { detail: getAdminMachine(request, params.machineId, { page, size }) };
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

function MachineHeaderSkeleton() {
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

function MachineHeader({ machine }: { machine: AdminMachine }) {
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage ?? "en";

  return (
    <Box>
      <Typography
        variant="overline"
        color="text.secondary"
        sx={{ display: "block", mb: 0.5, lineHeight: 1.5 }}
      >
        {t("admin.machineDetails")}
      </Typography>
      <Typography variant="h4" component="h1">
        {machine.name || machine.serialNumber}
      </Typography>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 0.5, sm: 2 }} sx={{ mt: 1 }}>
        <Typography color="text.secondary">
          {t("admin.serialNumber")}: <Box component="span" sx={{ fontFamily: "monospace", color: "text.primary", fontWeight: 700 }}>{machine.serialNumber}</Box>
        </Typography>
        <Typography color="text.secondary">
          {t("admin.lastUpload")}: {formatDate(machine.lastUploadAt, locale)}
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

function LogsCard({ detail }: { detail: AdminMachineDetail }) {
  const { machine, logs } = detail;
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

  return (
    <Card sx={expandedTableCardSx}>
      <CardContent sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Typography variant="h6">{t("admin.uploadedLogs")}</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("admin.uploadedLogsDescription")}
        </Typography>
      </CardContent>
      <TableContainer>
        <Table
          aria-label={t("admin.uploadedLogs")}
          sx={{ minWidth: 1120, tableLayout: "fixed" }}
        >
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 420 }}>{t("admin.file")}</TableCell>
              <TableCell sx={{ width: 240 }}>{t("admin.roastTime")}</TableCell>
              <TableCell sx={{ width: 240 }}>{t("admin.uploadedAt")}</TableCell>
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
                  void navigate(`/admin/machines/${machine.id}/logs/${log.uploadId}`)
                }
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    void navigate(`/admin/machines/${machine.id}/logs/${log.uploadId}`);
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
                  {t("admin.noLogs")}
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

export default function AdminMachineDetailPage() {
  const { detail } = useLoaderData<typeof loader>();
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
          <Suspense fallback={<MachineHeaderSkeleton />}>
            <Await resolve={detail}>
              {(resolved) => <MachineHeader machine={resolved.machine} />}
            </Await>
          </Suspense>
        </Box>
      }
    >
      <Suspense fallback={<LogsCardSkeleton />}>
        <Await resolve={detail}>
          {(resolved) => <LogsCard detail={resolved} />}
        </Await>
      </Suspense>
    </AdminShell>
  );
}
