import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts/hooks";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { MachineLogVisualization } from "~/lib/backend.server";

export function formatDuration(seconds: number) {
  const rounded = Math.round(Math.abs(seconds));
  return `${seconds < 0 ? "−" : ""}${Math.floor(rounded / 60)}:${(rounded % 60).toString().padStart(2, "0")}`;
}

const milestoneAbbreviations: Record<string, string> = {
  CHARGE: "CHARGE",
  TURNING_POINT: "TP",
  DRY_END: "DE",
  FIRST_CRACK_START: "1Cs",
  SECOND_CRACK_START: "2Cs",
  DROP: "DROP",
};

/**
 * The milestones the roast views surface, in roast order. The parser also reports crack ends and
 * cool end; those stay hidden to keep the chart readable.
 */
const shownMilestones = new Set(Object.keys(milestoneAbbreviations));

function shownIn(data: MachineLogVisualization) {
  return data.milestones
    .filter((milestone) => shownMilestones.has(milestone.type))
    .sort((a, b) => a.seconds - b.seconds);
}

/** SVG callouts share the chart's scales, so they remain anchored on resize. */
function MilestoneAnnotations({ data }: { data: MachineLogVisualization }) {
  const { t } = useTranslation("common");
  const xScale = useXScale<"linear">();
  const yScale = useYScale<"linear">("temperature");
  const area = useDrawingArea();
  const boxWidth = 76;
  const boxHeight = 54;
  const gap = 8;
  const placed: { x: number; y: number }[] = [];
  if (area.width < boxWidth || area.height < boxHeight) return null;

  return (
    <g aria-label={t("admin.milestones")} style={{ pointerEvents: "none" }}>
      {shownIn(data).map((milestone, index) => {
        if (milestone.temperature == null || !Number.isFinite(milestone.temperature) ||
            !Number.isFinite(milestone.seconds)) return null;
        const x = xScale(milestone.seconds);
        const y = yScale(milestone.temperature);
        if (!Number.isFinite(x) || !Number.isFinite(y) ||
            x < area.left || x > area.left + area.width ||
            y < area.top || y > area.top + area.height) return null;

        const clampX = (value: number) => Math.max(area.left, Math.min(value, area.left + area.width - boxWidth));
        const clampY = (value: number) => Math.max(area.top, Math.min(value, area.top + area.height - boxHeight));
        const candidates = [];
        for (let row = 0; row < Math.ceil(area.height / (boxHeight + gap)); row++) {
          for (const direction of [1, -1]) {
            for (const offset of [12, -boxWidth - 12, -boxWidth / 2]) {
              candidates.push({
                x: clampX(x + offset),
                y: clampY(direction === 1
                  ? y + 24 + row * (boxHeight + gap)
                  : y - 24 - boxHeight - row * (boxHeight + gap)),
              });
            }
          }
        }
        const box = candidates.find((candidate) => placed.every((other) =>
          candidate.x + boxWidth + gap <= other.x || other.x + boxWidth + gap <= candidate.x ||
          candidate.y + boxHeight + gap <= other.y || other.y + boxHeight + gap <= candidate.y,
        )) ?? candidates[0];
        placed.push(box);
        const anchorX = Math.max(box.x + 8, Math.min(x, box.x + boxWidth - 8));
        const anchorY = box.y > y ? box.y : box.y + boxHeight;
        const label = t(`admin.milestoneLabels.${milestone.type}`, { defaultValue: milestone.type });
        const time = formatDuration(milestone.seconds);
        const temperature = `${milestone.temperature.toFixed(1)} ${data.temperatureUnit}`;
        return (
          <g key={`${milestone.type}-${milestone.seconds}-${index}`} role="img" aria-label={`${label}, ${time}, ${temperature}`}>
            <title>{`${label} · ${time} · ${temperature}`}</title>
            <path d={`M ${x} ${y} L ${anchorX} ${anchorY}`} fill="none" stroke="#737373" strokeWidth={1.5} />
            <circle cx={x} cy={y} r={4.5} fill="#737373" stroke="white" strokeWidth={1} />
            <rect x={box.x} y={box.y} width={boxWidth} height={boxHeight} rx={4} fill="#424242" fillOpacity={0.94} />
            <text x={box.x + boxWidth / 2} y={box.y + 15} textAnchor="middle" fill="white" fontSize={11} fontFamily="inherit" fontWeight={600}>
              <tspan>{milestoneAbbreviations[milestone.type] ?? milestone.type}</tspan>
              <tspan x={box.x + boxWidth / 2} dy={15}>{time}</tspan>
              <tspan x={box.x + boxWidth / 2} dy={15}>{temperature}</tspan>
            </text>
          </g>
        );
      })}
    </g>
  );
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
  const fahrenheit = data.temperatureUnit === "°F";
  const temperatureStep = fahrenheit ? 90 : 50;
  const rorStep = fahrenheit ? 9 : 5;
  let temperatureMin = 0;
  let temperatureMax = fahrenheit ? 482 : 250;
  let rorMin = 0;
  let rorMax = fahrenheit ? 45 : 25;

  // Keep comparable reference ranges without clipping unusual profiles.
  for (const point of data.points) {
    for (const value of [point.beanTemperature, point.environmentTemperature]) {
      if (value != null && Number.isFinite(value)) {
        temperatureMin = Math.min(temperatureMin, Math.floor(value / temperatureStep) * temperatureStep);
        temperatureMax = Math.max(temperatureMax, Math.ceil(value / temperatureStep) * temperatureStep);
      }
    }
    if (point.rateOfRise != null && Number.isFinite(point.rateOfRise)) {
      rorMin = Math.min(rorMin, Math.floor(point.rateOfRise / rorStep) * rorStep);
      rorMax = Math.max(rorMax, Math.ceil(point.rateOfRise / rorStep) * rorStep);
    }
  }

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
                  min: temperatureMin,
                  max: temperatureMax,
                  label: `${t("roastDetail:chart.temperature")} ${data.temperatureUnit}`,
                },
                { id: "ror", position: "right", min: rorMin, max: rorMax, label: `RoR (${data.temperatureUnit}/min)` },
              ]}
              series={[
                {
                  dataKey: "beanTemperature",
                  yAxisId: "temperature",
                  label: t("roastDetail:chart.beanTemperature"),
                  color: "#448AFF",
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
                  id: "ror",
                  dataKey: "rateOfRise",
                  yAxisId: "ror",
                  label: t("roastDetail:chart.rateOfRise"),
                  color: "#9966FF",
                  showMark: false,
                  curve: "monotoneX",
                  connectNulls: true,
                },
              ]}
              grid={{ horizontal: true, vertical: true }}
              sx={{ '& .MuiLineElement-root[data-series="ror"]': { strokeDasharray: "6 4" } }}
            >
              <MilestoneAnnotations data={data} />
            </LineChart>
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

/** Charge, turning point, dry end, both cracks and drop, as the parser found them. */
export function RoastMilestones({ data }: { data: MachineLogVisualization }) {
  const { t } = useTranslation(["common"]);
  const milestones = shownIn(data);

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
        {milestones.map((milestone) => (
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
        {milestones.length === 0 && (
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
