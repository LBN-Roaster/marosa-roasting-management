import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Skeleton from "@mui/material/Skeleton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Await, Link, useLoaderData, useParams } from "react-router";
import { AdminShell } from "~/components/admin-shell";
import {
  getMachineLogVisualization,
  type MachineLogVisualization,
  type RoastUploadStatus,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-machine-log";

export function meta() {
  return [{ title: "Log visualization | MAROSA" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return {
    visualization: getMachineLogVisualization(
      request,
      params.machineId,
      params.uploadId,
    ),
  };
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}:${remainder.toString().padStart(2, "0")}`;
}

function statusColor(status: RoastUploadStatus) {
  if (status === "PROCESSED") return "success" as const;
  if (status === "FAILED") return "error" as const;
  if (status === "PROCESSING") return "info" as const;
  if (status === "UPLOADED") return "secondary" as const;
  return "warning" as const;
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography component="dt" variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography component="dd" variant="body2" sx={{ mt: 0.5, ml: 0, fontWeight: 650 }}>
        {children}
      </Typography>
    </Box>
  );
}

function VisualizationSkeleton() {
  return (
    <Stack spacing={3}>
      <Box>
        <Skeleton width={120} />
        <Skeleton width={360} sx={{ fontSize: "2.125rem" }} />
        <Skeleton width={260} />
      </Box>
      <Skeleton variant="rounded" height={150} />
      <Skeleton variant="rounded" height={520} />
    </Stack>
  );
}

function VisualizationContent({ data }: { data: MachineLogVisualization }) {
  const { t } = useTranslation(["common", "roastDetail"]);
  const duration = data.points.at(-1)?.seconds ?? 0;

  return (
    <Stack spacing={3}>
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block", mb: 0.5, lineHeight: 1.5 }}
        >
          {t("common:admin.logVisualization")}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          sx={{ alignItems: { xs: "flex-start", sm: "center" } }}
        >
          <Typography variant="h4" component="h1">
            {data.title || data.log.filename}
          </Typography>
          <Chip
            size="small"
            color={statusColor(data.log.status)}
            label={t(`common:admin.statusLabels.${data.log.status}`)}
          />
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 1 }}>
          {data.machine.name || data.machine.serialNumber} · {data.log.filename}
        </Typography>
      </Box>

      <Card>
        <CardContent
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 3,
            m: 0,
          }}
        >
          <DetailItem label={t("common:admin.bean")}>
            {data.beanName || "—"}
          </DetailItem>
          <DetailItem label={t("common:admin.duration")}>
            {formatDuration(duration)}
          </DetailItem>
          <DetailItem label={t("common:admin.samples")}>
            {data.points.length.toLocaleString()}
          </DetailItem>
          <DetailItem label={t("common:admin.serialNumber")}>
            {data.machine.serialNumber}
          </DetailItem>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={t("common:admin.roastProfile")}
          subheader={t("common:admin.roastProfileDescription")}
          slotProps={{ title: { variant: "h6" } }}
        />
        <Divider />
        <CardContent>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 820, width: "100%" }}>
              <LineChart
                dataset={data.points}
                height={480}
                margin={{ left: 70, right: 70, top: 40, bottom: 55 }}
                xAxis={[
                  {
                    dataKey: "seconds",
                    scaleType: "linear",
                    label: t("roastDetail:chart.time"),
                    valueFormatter: (value) => formatDuration(Number(value)),
                  },
                ]}
                yAxis={[
                  {
                    id: "temperature",
                    position: "left",
                    label: `${t("roastDetail:chart.temperature")} ${data.temperatureUnit}`,
                  },
                  {
                    id: "ror",
                    position: "right",
                    label: `RoR (${data.temperatureUnit}/min)`,
                  },
                ]}
                series={[
                  {
                    dataKey: "beanTemperature",
                    yAxisId: "temperature",
                    label: t("roastDetail:chart.beanTemperature"),
                    color: "#009688",
                    showMark: false,
                    curve: "monotoneX",
                    connectNulls: true,
                  },
                  {
                    dataKey: "environmentTemperature",
                    yAxisId: "temperature",
                    label: t("roastDetail:chart.exhaustTemperature"),
                    color: "#FF5252",
                    showMark: false,
                    curve: "monotoneX",
                    connectNulls: true,
                  },
                  {
                    dataKey: "rateOfRise",
                    yAxisId: "ror",
                    label: t("roastDetail:chart.rateOfRise"),
                    color: "#448AFF",
                    showMark: false,
                    curve: "monotoneX",
                    connectNulls: true,
                  },
                ]}
                grid={{ horizontal: true, vertical: true }}
              />
            </Box>
          </Box>
          <Typography variant="subtitle2" sx={{ mt: 3, mb: 1 }}>
            {t("roastDetail:chart.percent")}
          </Typography>
          <Box sx={{ overflowX: "auto" }}>
            <Box sx={{ minWidth: 820, width: "100%" }}>
              <LineChart
                dataset={data.points}
                height={260}
                margin={{ left: 70, right: 30, top: 30, bottom: 50 }}
                xAxis={[
                  {
                    dataKey: "seconds",
                    scaleType: "linear",
                    label: t("roastDetail:chart.time"),
                    valueFormatter: (value) => formatDuration(Number(value)),
                  },
                ]}
                yAxis={[
                  {
                    min: 0,
                    max: 100,
                    label: t("roastDetail:chart.percent"),
                  },
                ]}
                series={[
                  {
                    dataKey: "burner",
                    label: t("roastDetail:chart.burner"),
                    color: "#FF9800",
                    showMark: false,
                    curve: "stepAfter",
                    connectNulls: true,
                  },
                  {
                    dataKey: "air",
                    label: t("roastDetail:chart.air"),
                    color: "#26C6DA",
                    showMark: false,
                    curve: "stepAfter",
                    connectNulls: true,
                  },
                  {
                    dataKey: "drum",
                    label: t("roastDetail:chart.drum"),
                    color: "#3B8061",
                    showMark: false,
                    curve: "stepAfter",
                    connectNulls: true,
                  },
                ]}
                grid={{ horizontal: true }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardHeader
          title={t("common:admin.milestones")}
          slotProps={{ title: { variant: "h6" } }}
        />
        <Divider />
        <CardContent
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              md: "repeat(4, minmax(0, 1fr))",
            },
            gap: 3,
            m: 0,
          }}
        >
          {data.milestones.map((milestone) => (
            <DetailItem
              key={milestone.type}
              label={t(`common:admin.milestoneLabels.${milestone.type}`)}
            >
              {formatDuration(milestone.seconds)}
              {milestone.temperature == null
                ? ""
                : ` · ${milestone.temperature.toFixed(1)} ${data.temperatureUnit}`}
            </DetailItem>
          ))}
          {data.milestones.length === 0 && (
            <Typography color="text.secondary">
              {t("common:admin.noMilestones")}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}

export default function AdminMachineLogPage() {
  const { visualization } = useLoaderData<typeof loader>();
  const { machineId } = useParams();
  const { t } = useTranslation("common");

  return (
    <AdminShell>
      <Stack spacing={3}>
        <Box>
          <Button
            component={Link}
            to={`/admin/machines/${machineId}`}
            prefetch="intent"
            startIcon={<ArrowBackIcon />}
            sx={{ px: 0.5 }}
          >
            {t("admin.backToMachine")}
          </Button>
        </Box>
        <Suspense fallback={<VisualizationSkeleton />}>
          <Await resolve={visualization}>
            {(data) => <VisualizationContent data={data} />}
          </Await>
        </Suspense>
      </Stack>
    </AdminShell>
  );
}
