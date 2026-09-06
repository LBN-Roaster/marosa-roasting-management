import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { MachineLogVisualization } from "~/lib/backend.server";

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.round(seconds % 60).toString().padStart(2, "0")}`;
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

/**
 * The roast curve as the admin log view draws it: bean and exhaust temperature
 * against rate of rise, then the burner, air and drum settings underneath.
 * Shared so the two pages that show a profile cannot drift apart.
 */
export function RoastProfileChart({ data }: { data: MachineLogVisualization }) {
  const { t } = useTranslation(["roastDetail", "common"]);

  return (
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
                { id: "ror", position: "right", min: 0, label: `RoR (${data.temperatureUnit}/min)` },
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
              yAxis={[{ min: 0, max: 100, label: t("roastDetail:chart.percent") }]}
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
  );
}

/** Charge, dry end, first crack and drop, as the parser found them. */
export function RoastMilestones({ data }: { data: MachineLogVisualization }) {
  const { t } = useTranslation(["common"]);

  return (
    <Card>
      <CardHeader title={t("common:admin.milestones")} slotProps={{ title: { variant: "h6" } }} />
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
          <Typography color="text.secondary">{t("common:admin.noMilestones")}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

/** Chart and milestones together, the way both roast views present them. */
export function RoastProfile({ data }: { data: MachineLogVisualization }) {
  return (
    <Stack spacing={3}>
      <RoastProfileChart data={data} />
      <RoastMilestones data={data} />
    </Stack>
  );
}
