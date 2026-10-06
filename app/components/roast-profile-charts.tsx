import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { LineChart } from "@mui/x-charts/LineChart";
import { useDrawingArea, useXScale, useYScale } from "@mui/x-charts/hooks";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { RoastCurve } from "~/lib/backend.server";
import { smoothSeries } from "~/lib/ror";

export function formatDuration(seconds: number) {
  const rounded = Math.round(Math.abs(seconds));
  return `${seconds < 0 ? "−" : ""}${Math.floor(rounded / 60)}:${(rounded % 60).toString().padStart(2, "0")}`;
}

/**
 * Burner, air and drum settings in percent. Headroom above 100% keeps a control
 * held at full power off the chart frame; ticks stop at 100 because nothing
 * above it is meaningful.
 */
export const controlPercentAxis = {
  min: 0,
  max: 110,
  tickInterval: [0, 20, 40, 60, 80, 100],
};

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

function shownIn(data: RoastCurve) {
  return data.milestones
    .filter((milestone) => shownMilestones.has(milestone.type))
    .sort((a, b) => a.seconds - b.seconds);
}

type Spot = { x: number; y: number };
type Segment = { x1: number; y1: number; x2: number; y2: number };

/** Liang–Barsky clip: does the segment pass through the (padded) rectangle? */
function segmentHitsRect(segment: Segment, left: number, top: number, right: number, bottom: number) {
  const dx = segment.x2 - segment.x1;
  const dy = segment.y2 - segment.y1;
  let t0 = 0;
  let t1 = 1;
  for (const [p, q] of [
    [-dx, segment.x1 - left], [dx, right - segment.x1],
    [-dy, segment.y1 - top], [dy, bottom - segment.y1],
  ]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const r = q / p;
      if (p < 0) t0 = Math.max(t0, r);
      else t1 = Math.min(t1, r);
      if (t0 > t1) return false;
    }
  }
  return true;
}

/** SVG callouts share the chart's scales, so they remain anchored on resize. */
function MilestoneAnnotations({ data }: { data: RoastCurve }) {
  const { t } = useTranslation("common");
  const xScale = useXScale<"linear">();
  const yScale = useYScale<"linear">("temperature");
  const rorScale = useYScale<"linear">("ror");
  const area = useDrawingArea();
  const boxWidth = 58;
  const boxHeight = 40;
  const fontSize = 9.5;
  const lineHeight = 11.5;
  const gap = 8;
  // Keep a little air between a callout and the curves so the line stays readable.
  const linePadding = 4;
  const placed: Spot[] = [];
  if (area.width < boxWidth || area.height < boxHeight) return null;

  // Every plotted curve in pixel space, sorted by x (the points already are), so
  // a callout only has to test the segments under its own horizontal span.
  const segments: Segment[] = [];
  for (const [key, scale] of [
    ["beanTemperature", yScale], ["environmentTemperature", yScale], ["rateOfRise", rorScale],
  ] as const) {
    let previous: { x: number; y: number } | null = null;
    for (const point of data.points) {
      const value = point[key];
      if (value == null || !Number.isFinite(value)) continue; // the chart connects nulls
      const current = { x: xScale(point.seconds), y: scale(value) };
      if (!Number.isFinite(current.x) || !Number.isFinite(current.y)) continue;
      if (previous) segments.push({ x1: previous.x, y1: previous.y, x2: current.x, y2: current.y });
      previous = current;
    }
  }
  segments.sort((a, b) => Math.min(a.x1, a.x2) - Math.min(b.x1, b.x2));
  const widestSegment = segments.reduce((widest, segment) => Math.max(widest, Math.abs(segment.x2 - segment.x1)), 0);

  const hitsCurve = (box: Spot) => {
    const left = box.x - linePadding;
    const right = box.x + boxWidth + linePadding;
    const top = box.y - linePadding;
    const bottom = box.y + boxHeight + linePadding;
    // Binary search for the first segment that could reach the box's left edge.
    let low = 0;
    let high = segments.length;
    while (low < high) {
      const mid = (low + high) >> 1;
      if (Math.min(segments[mid].x1, segments[mid].x2) < left - widestSegment) low = mid + 1;
      else high = mid;
    }
    for (let index = low; index < segments.length; index++) {
      const segment = segments[index];
      if (Math.min(segment.x1, segment.x2) > right) break;
      if (segmentHitsRect(segment, left, top, right, bottom)) return true;
    }
    return false;
  };
  const hitsCallout = (box: Spot) => placed.some((other) =>
    !(box.x + boxWidth + gap <= other.x || other.x + boxWidth + gap <= box.x ||
      box.y + boxHeight + gap <= other.y || other.y + boxHeight + gap <= box.y));

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
        // Candidate spots on a grid around the milestone, nearest first, so a
        // callout moves only as far as it must to clear the curves.
        const candidates: Spot[] = [];
        const step = boxHeight / 2;
        for (let dy = -area.height; dy <= area.height; dy += step) {
          for (let dx = -3 * boxWidth; dx <= 3 * boxWidth; dx += boxWidth / 4) {
            candidates.push({ x: clampX(x + dx - boxWidth / 2), y: clampY(y + dy - boxHeight / 2) });
          }
        }
        const distance = (box: Spot) =>
          Math.hypot(box.x + boxWidth / 2 - x, box.y + boxHeight / 2 - y);
        candidates.sort((a, b) => distance(a) - distance(b));
        const open = candidates.filter((candidate) => !hitsCallout(candidate));
        // Prefer a spot clear of both curves and callouts; failing that, clear of
        // callouts; failing that, the nearest spot so the milestone still shows.
        const box = open.find((candidate) => !hitsCurve(candidate)) ?? open[0] ?? candidates[0];
        placed.push(box);
        // The leader meets the callout at the edge point nearest the milestone.
        const anchorX = Math.max(box.x, Math.min(x, box.x + boxWidth));
        const anchorY = Math.max(box.y, Math.min(y, box.y + boxHeight));
        const label = t(`admin.milestoneLabels.${milestone.type}`, { defaultValue: milestone.type });
        const time = formatDuration(milestone.seconds);
        const temperature = `${milestone.temperature.toFixed(1)} ${data.temperatureUnit}`;
        return (
          <g key={`${milestone.type}-${milestone.seconds}-${index}`} role="img" aria-label={`${label}, ${time}, ${temperature}`}>
            <title>{`${label} · ${time} · ${temperature}`}</title>
            <path d={`M ${x} ${y} L ${anchorX} ${anchorY}`} fill="none" stroke="#737373" strokeWidth={1.5} />
            <circle cx={x} cy={y} r={3.5} fill="#737373" stroke="white" strokeWidth={1} />
            <rect x={box.x} y={box.y} width={boxWidth} height={boxHeight} rx={3} fill="#424242" fillOpacity={0.94} />
            <text x={box.x + boxWidth / 2} y={box.y + 12} textAnchor="middle" fill="white" fontSize={fontSize} fontFamily="inherit" fontWeight={600}>
              <tspan>{milestoneAbbreviations[milestone.type] ?? milestone.type}</tspan>
              <tspan x={box.x + boxWidth / 2} dy={lineHeight}>{time}</tspan>
              <tspan x={box.x + boxWidth / 2} dy={lineHeight}>{temperature}</tspan>
            </text>
          </g>
        );
      })}
    </g>
  );
}

export function DetailItem({ label, children }: { label: string; children: ReactNode }) {
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
export function RoastProfileChart({ data: recorded }: { data: RoastCurve }) {
  const { t } = useTranslation(["roastDetail", "common"]);
  // The rate of rise is drawn averaged over a few points so sensor noise does not
  // hide its trend; temperatures and controls are shown as recorded.
  const data = useMemo<RoastCurve>(() => {
    const rateOfRise = smoothSeries(recorded.points.map((point) => point.rateOfRise));
    return { ...recorded, points: recorded.points.map((point, index) => ({ ...point, rateOfRise: rateOfRise[index] })) };
  }, [recorded]);
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
              margin={{ left: 70, right: 70, top: 40, bottom: 10 }}
              xAxis={[
                {
                  dataKey: "seconds",
                  scaleType: "linear",
                  // Sized to its tick labels and title; the fixed default is
                  // too short once there is a title and hides the tick labels.
                  height: "auto",
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
              margin={{ left: 70, right: 30, top: 30, bottom: 10 }}
              xAxis={[
                {
                  dataKey: "seconds",
                  scaleType: "linear",
                  // Sized to its tick labels and title; the fixed default is
                  // too short once there is a title and hides the tick labels.
                  height: "auto",
                  label: t("roastDetail:chart.time"),
                  valueFormatter: (value) => formatDuration(Number(value)),
                },
              ]}
              yAxis={[{ ...controlPercentAxis, label: t("roastDetail:chart.percent") }]}
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
/**
 * Milestone times and temperatures from the log. `children` adds further
 * figures read from the same curve (e.g. development) into the same grid, so a
 * page does not need a second card repeating the milestones.
 */
export function RoastMilestones({
  data,
  title,
  subheader,
  children,
}: {
  data: RoastCurve;
  title?: string;
  subheader?: string;
  children?: ReactNode;
}) {
  const { t } = useTranslation(["common"]);
  const milestones = shownIn(data);

  return (
    <Card>
      <CardHeader
        title={title ?? t("common:admin.milestones")}
        subheader={subheader}
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
        {children}
        {milestones.length === 0 && !children && (
          <Typography color="text.secondary">{t("common:admin.noMilestones")}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

/** Chart and milestones together, the way both roast views present them. */
export function RoastProfile({ data }: { data: RoastCurve }) {
  return (
    <Stack spacing={3}>
      <RoastProfileChart data={data} />
      <RoastMilestones data={data} />
    </Stack>
  );
}
