import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { BarChart } from "@mui/x-charts/BarChart";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { RoasterStats } from "~/lib/backend.server";
import { gramsToKg } from "~/lib/weight";

type Daily = RoasterStats["daily"];

/**
 * Bars stay thin however few days are shown (about 24px or less), and keep a
 * visible gap between neighbours when there are 90 of them.
 */
function gapRatio(days: number) {
  return days <= 7 ? 0.7 : 0.35;
}

/** About eight date labels whatever the period, so they never collide. */
function labelEvery(days: number) {
  return Math.max(1, Math.ceil(days / 8));
}

/** "03/10" for a YYYY-MM-DD day, read as a calendar date (no time zone shift). */
function shortDate(day: string) {
  const [, month, date] = day.split("-");
  return `${date}/${month}`;
}

function longDate(day: string, locale: string) {
  const [year, month, date] = day.split("-").map(Number);
  return new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "numeric", timeZone: "UTC" })
    .format(new Date(Date.UTC(year, month - 1, date)));
}

function DailyBarChart({
  title,
  days,
  values,
  color,
  formatValue,
  integerTicks = false,
}: {
  title: string;
  days: string[];
  values: number[];
  color: string;
  formatValue: (value: number) => string;
  integerTicks?: boolean;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";
  const every = labelEvery(days.length);

  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      {/* One series per chart: the title names it, so there is no legend box. */}
      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>{title}</Typography>
      <BarChart
        height={220}
        hideLegend
        borderRadius={4}
        grid={{ horizontal: true }}
        margin={{ left: 0, right: 8, top: 16, bottom: 0 }}
        xAxis={[{
          scaleType: "band",
          data: days,
          categoryGapRatio: gapRatio(days.length),
          tickLabelInterval: (_value, index) => index % every === 0,
          valueFormatter: (day: string, context) =>
            context.location === "tooltip" ? longDate(day, locale) : shortDate(day),
          disableTicks: true,
        }]}
        yAxis={[{
          width: 44,
          tickMinStep: integerTicks ? 1 : undefined,
          valueFormatter: (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value),
          disableLine: true,
          disableTicks: true,
        }]}
        series={[{ data: values, color, label: title, valueFormatter: (value) => (value == null ? "" : formatValue(value)) }]}
        slotProps={{ tooltip: { trigger: "axis" } }}
        sx={{
          "& .MuiChartsGrid-line": { stroke: "#ECEDEB", strokeWidth: 1 },
          "& .MuiChartsAxis-tickLabel": { fill: "#6B7280" },
        }}
      />
    </Card>
  );
}

/** Roasts and weight out per day for the chosen period, as two charts and an optional table. */
export function RoasterDailyCharts({ daily }: { daily: Daily }) {
  const { t, i18n } = useTranslation("common");
  const theme = useTheme();
  const [showTable, setShowTable] = useState(false);
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";

  const days = daily.map((day) => day.date);
  const roasts = daily.map((day) => day.roastCount);
  const weightOutKg = daily.map((day) => Number(gramsToKg(Number(day.dropWeight)).toFixed(3)));
  const kg = (value: number) => `${new Intl.NumberFormat(locale, { maximumFractionDigits: 2 }).format(value)} kg`;

  return (
    <Box>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" } }}>
        <DailyBarChart
          title={t("roasters.charts.roastsPerDay")}
          days={days}
          values={roasts}
          color={theme.palette.primary.main}
          integerTicks
          formatValue={(value) => t("roasters.charts.roasts", { count: value })}
        />
        <DailyBarChart
          title={t("roasters.charts.weightOutPerDay")}
          days={days}
          values={weightOutKg}
          color={theme.palette.primary.main}
          formatValue={kg}
        />
      </Box>

      <Button size="small" onClick={() => setShowTable((value) => !value)} sx={{ mt: 1, px: 0.5 }}>
        {showTable ? t("roasters.charts.hideTable") : t("roasters.charts.showTable")}
      </Button>
      {showTable && (
        <TableContainer component={Card} variant="outlined" sx={{ mt: 1, maxHeight: 360 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>{t("roasters.charts.day")}</TableCell>
                <TableCell align="right">{t("roasters.charts.roastsColumn")}</TableCell>
                <TableCell align="right">{t("roasters.charts.weightOutColumn")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[...daily].reverse().map((day, index) => (
                <TableRow key={day.date}>
                  <TableCell>{longDate(day.date, locale)}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>{day.roastCount}</TableCell>
                  <TableCell align="right" sx={{ fontVariantNumeric: "tabular-nums" }}>
                    {kg(weightOutKg[daily.length - 1 - index])}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
