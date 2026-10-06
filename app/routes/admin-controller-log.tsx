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
import { Suspense, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Await, Link, useFetcher, useLoaderData, useParams } from "react-router";
import { InfoTooltip } from "~/components/info-tooltip";
import { AdminShell } from "~/components/admin-shell";
import { RoastProfile, formatDuration } from "~/components/roast-profile-charts";
import Alert from "@mui/material/Alert";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import {
  getLibrarySamples,
  getControllerLogVisualization,
  linkRoastSample,
  type LibrarySample,
  type RoastLogVisualization,
  type RoastUploadStatus,
} from "~/lib/backend.server";
import type { Route } from "./+types/admin-controller-log";

export function meta() {
  return [{ title: "Log visualization | MAROSA" }];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  return {
    visualization: getControllerLogVisualization(
      request,
      params.controllerId,
      params.uploadId,
    ),
    library: getLibrarySamples(request, { size: 200 }).then((page) => page.content),
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const sampleId = String(formData.get("sampleId") || "");
  try {
    await linkRoastSample(request, String(formData.get("roastId")), sampleId || null);
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
  return { linked: true };
}

/**
 * Ties this roast to the coffee it roasted, so a batch off the roaster can be
 * traced to how it cupped. The bean name the roasting app recorded is free text, so
 * a name match is only ever offered as a suggestion to confirm.
 */
function SampleLink({
  roastId,
  sample,
  suggested,
  library,
}: {
  roastId: string | null;
  sample: LibrarySample | null;
  suggested: LibrarySample | null;
  library: LibrarySample[];
}) {
  const { t } = useTranslation(["common"]);
  const fetcher = useFetcher<typeof action>();

  if (!roastId) return null;
  const busy = fetcher.state !== "idle";
  const current = sample?.id ?? "";

  return (
    <Card>
      <CardHeader
        title={
          <Stack component="span" direction="row" sx={{ alignItems: "center", gap: 0.5 }}>
            {t("common:admin.linkedSample")}
            <InfoTooltip title={t("common:admin.linkedSampleDescription")} />
          </Stack>
        }
        slotProps={{ title: { variant: "h6" } }}
      />
      <Divider />
      <CardContent>
        {suggested && !sample && (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
                size="small"
                disabled={busy}
                onClick={() =>
                  void fetcher.submit({ roastId, sampleId: suggested.id }, { method: "post" })
                }
              >
                {t("common:admin.useSuggestion")}
              </Button>
            }
          >
            {t("common:admin.sampleSuggestion", { name: suggested.name })}
          </Alert>
        )}
        <TextField
          select
          fullWidth
          label={t("common:admin.linkedSample")}
          value={current}
          disabled={busy}
          onChange={(event) =>
            void fetcher.submit({ roastId, sampleId: event.target.value }, { method: "post" })
          }
          sx={{ maxWidth: 420 }}
        >
          <MenuItem value="">{t("common:admin.noLinkedSample")}</MenuItem>
          {library.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.name}
              {item.species ? ` · ${item.species}` : ""}
            </MenuItem>
          ))}
        </TextField>
      </CardContent>
    </Card>
  );
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

function VisualizationContent({
  data,
  library,
}: {
  data: RoastLogVisualization;
  library: LibrarySample[];
}) {
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
          {[data.source.roasterName, data.source.controllerSerialNumber, data.log.filename]
            .filter(Boolean)
            .join(" · ")}
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
            {data.source.controllerSerialNumber ?? "—"}
          </DetailItem>
        </CardContent>
      </Card>

      <SampleLink
        roastId={data.log.roastId}
        sample={data.sample}
        suggested={data.suggestedSample}
        library={library}
      />

      <RoastProfile data={data} />

    </Stack>
  );
}

export default function AdminControllerLogPage() {
  const { visualization, library } = useLoaderData<typeof loader>();
  const { controllerId } = useParams();
  const { t } = useTranslation("common");

  return (
    <AdminShell>
      <Stack spacing={3}>
        <Box>
          <Button
            component={Link}
            to={`/admin/controllers/${controllerId}`}
            prefetch="intent"
            startIcon={<ArrowBackIcon />}
            sx={{ px: 0.5 }}
          >
            {t("admin.backToController")}
          </Button>
        </Box>
        <Suspense fallback={<VisualizationSkeleton />}>
          <Await resolve={visualization}>
            {(data) => (
              <Suspense fallback={null}>
                <Await resolve={library} errorElement={null}>
                  {(resolved) => <VisualizationContent data={data} library={resolved} />}
                </Await>
              </Suspense>
            )}
          </Await>
        </Suspense>
      </Stack>
    </AdminShell>
  );
}
