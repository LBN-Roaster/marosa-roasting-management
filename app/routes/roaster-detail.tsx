import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLoaderData, useSearchParams } from "react-router";
import { RoasterStatusChip, UploadProblemChip } from "~/components/roaster-status-chip";
import {
  getRoaster,
  getRoasterStats,
  getRoasterUploads,
  getRoasts,
} from "~/lib/backend.server";
import { formatWhen, roasteryToday } from "~/lib/roastery-time";
import type { Route } from "./+types/roaster-detail";

export function meta() {
  return [{ title: "Roaster | MAROSA" }];
}

const periods = [7, 30, 90] as const;
type Period = (typeof periods)[number];

function shiftDays(date: string, days: number) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const requested = Number(new URL(request.url).searchParams.get("days"));
  const days: Period = periods.includes(requested as Period) ? (requested as Period) : 30;
  const to = roasteryToday();
  const from = shiftDays(to, -(days - 1));
  const [roaster, stats, recentRoasts, failedUploads] = await Promise.all([
    getRoaster(request, params.roasterId),
    getRoasterStats(request, params.roasterId, { from, to }),
    getRoasts(request, { roasterId: params.roasterId, size: 8, sort: "roastedAt", direction: "desc" }),
    getRoasterUploads(request, params.roasterId, { status: "FAILED", size: 5 }),
  ]);
  return { roaster, stats, recentRoasts, failedUploads, days };
}

function StatTile({ label, value, note }: { label: string; value: string; note?: string }) {
  return (
    <Card variant="outlined" sx={{ p: 2 }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography sx={{ mt: 0.5, fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>{value}</Typography>
      {note && <Typography variant="caption" color="text.secondary">{note}</Typography>}
    </Card>
  );
}

function InfoItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{label}</Typography>
      <Typography variant="body2" sx={{ fontWeight: 600 }}>{children}</Typography>
    </Box>
  );
}

export default function RoasterDetailPage() {
  const { roaster, stats, recentRoasts, failedUploads, days } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation("common");
  const [, setSearchParams] = useSearchParams();
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";

  const number = (value: number | null, digits = 0) =>
    value == null
      ? "—"
      : new Intl.NumberFormat(locale, { notation: "compact", maximumFractionDigits: digits }).format(value);
  const percent = (value: number | null) =>
    value == null ? "—" : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)}%`;

  const specs = [
    [roaster.brand, roaster.model].filter(Boolean).join(" "),
    roaster.capacityKg != null && `${roaster.capacityKg} kg`,
    roaster.location,
  ].filter(Boolean);

  return (
    <Box>
      <Button component={Link} to="/roasters" prefetch="intent" startIcon={<ArrowBackIcon />} sx={{ mb: 2, px: 0.5 }}>
        {t("roasters.detail.back")}
      </Button>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ alignItems: { sm: "center" } }}>
        <Typography component="h1" variant="h4">{roaster.name}</Typography>
        <Stack direction="row" spacing={1}>
          <RoasterStatusChip status={roaster.status} size="medium" />
          {roaster.uploadProblem && <UploadProblemChip size="medium" />}
        </Stack>
      </Stack>
      {specs.length > 0 && (
        <Typography color="text.secondary" sx={{ mt: 0.5 }}>{specs.join(" · ")}</Typography>
      )}

      <Card variant="outlined" sx={{ mt: 2.5, p: 2 }}>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          <InfoItem label={t("roasters.controller")}>
            {roaster.controller?.serialNumber ?? t("roasters.noController")}
          </InfoItem>
          <InfoItem label={t("roasters.detail.lastRoast")}>
            {roaster.lastRoastAt ? formatWhen(roaster.lastRoastAt, locale) : t("roasters.detail.never")}
          </InfoItem>
          <InfoItem label={t("roasters.detail.lastSeen")}>
            {roaster.lastSeenAt ? formatWhen(roaster.lastSeenAt, locale) : t("roasters.detail.never")}
          </InfoItem>
          <InfoItem label={t("roasters.detail.thisWeek")}>
            {t("roasters.activity.counts", { today: roaster.roastsToday, week: roaster.roastsThisWeek })}
          </InfoItem>
        </Box>
      </Card>

      {failedUploads.content.length > 0 && (
        <Alert severity="error" sx={{ mt: 2.5 }}>
          <Typography variant="subtitle2">{t("roasters.detail.uploadProblems")}</Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>{t("roasters.detail.uploadProblemsHelp")}</Typography>
          <Stack spacing={0.5}>
            {failedUploads.content.map((upload) => (
              <Typography key={upload.uploadId} variant="body2">
                {formatWhen(upload.roastedAt, locale)} · {upload.filename}
                {upload.errorCode ? ` · ${upload.errorCode}` : ""}
              </Typography>
            ))}
          </Stack>
        </Alert>
      )}

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mt: 4, mb: 1.5, justifyContent: "space-between", alignItems: { sm: "center" } }}
      >
        <Typography component="h2" variant="h6">{t("roasters.detail.statsTitle", { days })}</Typography>
        <ToggleButtonGroup
          exclusive
          size="small"
          value={days}
          aria-label={t("roasters.detail.period")}
          onChange={(_, next: Period | null) => {
            if (next) setSearchParams({ days: String(next) }, { preventScrollReset: true });
          }}
        >
          {periods.map((period) => (
            <ToggleButton key={period} value={period}>{t("roasters.detail.days", { count: period })}</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
        <StatTile label={t("roasters.stats.roasts")} value={number(stats.roastCount)} />
        <StatTile label={t("roasters.stats.chargeWeight")} value={number(stats.totalChargeWeight, 1)} />
        <StatTile label={t("roasters.stats.dropWeight")} value={number(stats.totalDropWeight, 1)} />
        <StatTile label={t("roasters.stats.weightLoss")} value={percent(stats.averageWeightLossPercent)} />
        <StatTile
          label={t("roasters.stats.developmentRatio")}
          value={percent(stats.averageDevelopmentRatio == null ? null : stats.averageDevelopmentRatio * 100)}
        />
        <StatTile
          label={t("roasters.stats.cuppingScore")}
          value={stats.averageCuppingScore == null ? "—" : number(stats.averageCuppingScore, 2)}
          note={t("roasters.stats.cuppedRoasts", { count: stats.cuppedRoastCount })}
        />
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
        {t("roasters.stats.weightsNote")}
      </Typography>

      <Stack direction="row" sx={{ mt: 4, mb: 1.5, justifyContent: "space-between", alignItems: "center" }}>
        <Typography component="h2" variant="h6">{t("roasters.detail.recentRoasts")}</Typography>
        <Button component={Link} to={`/roasts?roasterId=${encodeURIComponent(roaster.id)}`} prefetch="intent" size="small">
          {t("roasters.detail.allRoasts")}
        </Button>
      </Stack>
      {recentRoasts.content.length === 0 ? (
        <Card variant="outlined" sx={{ p: 3 }}>
          <Typography color="text.secondary">{t("roasters.detail.noRoasts")}</Typography>
        </Card>
      ) : (
        <Card variant="outlined">
          <Stack divider={<Divider />}>
            {recentRoasts.content.map((roast) => (
              <Stack
                key={roast.id}
                component={Link}
                to={`/roasts/${encodeURIComponent(roast.id)}`}
                prefetch="intent"
                direction="row"
                spacing={2}
                sx={{ px: 2, py: 1.5, color: "inherit", textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
              >
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {roast.beanName || t("roasters.detail.unnamedRoast")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {[
                      formatWhen(roast.roastedAt, locale),
                      roast.batchNumber,
                      roast.chargeWeight != null && `${roast.chargeWeight} → ${roast.dropWeight ?? "?"}`,
                    ].filter(Boolean).join(" · ")}
                  </Typography>
                </Box>
                {roast.developmentRatio != null && (
                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap" }}>
                    DTR {(Number(roast.developmentRatio) * 100).toFixed(1)}%
                  </Typography>
                )}
              </Stack>
            ))}
          </Stack>
        </Card>
      )}
    </Box>
  );
}
