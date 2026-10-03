import HourglassEmptyIcon from "@mui/icons-material/HourglassEmpty";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Container from "@mui/material/Container";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";
import { data, useLoaderData } from "react-router";
import { PublicHeader } from "~/components/public-header";
import { RoastProfile } from "~/components/roast-profile-charts";
import { getPublicRoast, type RoastCurve } from "~/lib/backend.server";
import { formatWhen } from "~/lib/roastery-time";
import type { Route } from "./+types/public-roast";

export async function loader({ request, params }: Route.LoaderArgs) {
  const roast = await getPublicRoast(request, params.token);
  // A finished roast never changes; a pending one is worth checking again soon.
  const cache = roast?.status === "READY" ? "public, max-age=300" : "no-store";
  return data({ roast, url: request.url }, { status: roast ? 200 : 404, headers: { "Cache-Control": cache } });
}

export function headers({ loaderHeaders }: Route.HeadersArgs) {
  return { "Cache-Control": loaderHeaders.get("Cache-Control") ?? "no-store" };
}

export function meta({ loaderData }: Route.MetaArgs) {
  const roast = loaderData?.roast;
  const title = roast?.beanName ? `${roast.beanName} · MAROSA` : "Roast · MAROSA";
  const description = roast?.roasterName
    ? `Roast profile from ${roast.roasterName}, shared with MAROSA.`
    : "Roast profile shared with MAROSA.";
  return [
    { title },
    // Shared roasts are reachable only through their link.
    { name: "robots", content: "noindex, nofollow" },
    { name: "description", content: description },
    { property: "og:type", content: "article" },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:image", content: "/icon.png" },
    ...(loaderData?.url ? [{ property: "og:url", content: loaderData.url }] : []),
  ];
}

export default function PublicRoastPage() {
  const { roast } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation("common");
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <PublicHeader compact />
      <Container maxWidth="lg" sx={{ py: { xs: 4, sm: 6 }, px: { xs: 2, sm: 3 } }}>
        {!roast ? (
          <Card variant="outlined" sx={{ p: 4, maxWidth: 560, mx: "auto", textAlign: "center" }}>
            <Typography component="h1" variant="h5">{t("publicRoast.notFound.title")}</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>{t("publicRoast.notFound.body")}</Typography>
          </Card>
        ) : roast.status !== "READY" ? (
          <Card variant="outlined" sx={{ p: 4, maxWidth: 560, mx: "auto", textAlign: "center" }}>
            <HourglassEmptyIcon color="action" sx={{ fontSize: 40 }} />
            <Typography component="h1" variant="h5" sx={{ mt: 1 }}>
              {t(`publicRoast.${roast.status === "PROCESSING" ? "processing" : "unavailable"}.title`)}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {t(`publicRoast.${roast.status === "PROCESSING" ? "processing" : "unavailable"}.body`)}
            </Typography>
          </Card>
        ) : (
          <Stack spacing={3}>
            <Box>
              <Typography variant="overline" color="text.secondary">{t("publicRoast.eyebrow")}</Typography>
              <Typography component="h1" variant="h4">{roast.beanName || t("publicRoast.unnamed")}</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                {[roast.roasterName, roast.roastedAt && formatWhen(roast.roastedAt, locale)].filter(Boolean).join(" · ")}
              </Typography>
            </Box>
            {roast.points.length > 0 && roast.temperatureUnit ? (
              <RoastProfile data={roast as RoastCurve} />
            ) : (
              <Alert severity="info">{t("publicRoast.noCurve")}</Alert>
            )}
            <Typography variant="caption" color="text.secondary">{t("publicRoast.footer")}</Typography>
          </Stack>
        )}
      </Container>
    </Box>
  );
}
