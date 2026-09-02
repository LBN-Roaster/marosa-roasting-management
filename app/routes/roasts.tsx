import LocalFireDepartmentOutlinedIcon from "@mui/icons-material/LocalFireDepartmentOutlined";
import SearchIcon from "@mui/icons-material/Search";
import ShowChartIcon from "@mui/icons-material/ShowChart";
import Alert from "@mui/material/Alert";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import Pagination from "@mui/material/Pagination";
import Snackbar from "@mui/material/Snackbar";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
  useSubmit,
} from "react-router";
import { PageHeading } from "~/components/page-heading";
import { createSampleFromRoast, getRoasts } from "~/lib/backend.server";
import type { Route } from "./+types/roasts";

export function meta() {
  return [{ title: "Roasts | MAROSA" }];
}

const pageSize = 20;

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  // Newest first is the default: the roast you want is almost always the last
  // one out of the drum.
  const direction = url.searchParams.get("direction") === "asc" ? "asc" : "desc";
  const search = url.searchParams.get("search") ?? "";
  return {
    roasts: await getRoasts(request, {
      page: Number(url.searchParams.get("page") ?? "0"),
      size: pageSize,
      sort: "roastedAt",
      direction,
      search: search || undefined,
    }),
    search,
    direction,
  };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  try {
    const sample = await createSampleFromRoast(request, String(formData.get("roastId")));
    return { created: sample.tag };
  } catch (error) {
    if (error instanceof Response && error.status >= 400 && error.status < 500) {
      return { failed: true };
    }
    throw error;
  }
}

export default function RoastsPage() {
  const { roasts, search: appliedSearch, direction } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const { t, i18n } = useTranslation(["cupping", "common"]);
  const navigation = useNavigation();
  const submit = useSubmit();
  const [searchParams, setSearchParams] = useSearchParams();
  const [toast, setToast] = useState("");
  const [search, setSearch] = useState(appliedSearch);
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";
  const busy = navigation.state !== "idle";

  /** Writes the controls into the URL so a filtered list can be shared. */
  function applyParams(next: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    setSearchParams(params);
  }

  useEffect(() => {
    if (actionData?.failed) setToast(t("roasts.createFailed"));
    else if (actionData?.created) setToast(t("roasts.created", { tag: actionData.created }));
  }, [actionData, t]);

  return (
    <>
      <PageHeading
        eyebrow={t("roasts.eyebrow")}
        title={t("roasts.title")}
        description={t("roasts.description")}
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2, alignItems: { sm: "center" } }}
      >
        <TextField
          value={search}
          placeholder={t("roasts.search")}
          onChange={(event) => setSearch(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") applyParams({ search, page: null });
          }}
          onBlur={() => applyParams({ search, page: null })}
          sx={{ flex: 1, maxWidth: 380 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          select
          value={direction}
          label={t("roasts.sortBy")}
          onChange={(event) => applyParams({ direction: event.target.value, page: null })}
          sx={{ minWidth: 190 }}
        >
          <MenuItem value="desc">{t("roasts.newestFirst")}</MenuItem>
          <MenuItem value="asc">{t("roasts.oldestFirst")}</MenuItem>
        </TextField>
      </Stack>

      {roasts.content.length ? (
        <Stack spacing={1}>
          {roasts.content.map((roast) => {
            const metrics = [
              roast.batchNumber && `${t("library.batch")} ${roast.batchNumber}`,
              roast.chargeWeight != null && `${roast.chargeWeight} → ${roast.dropWeight ?? "?"}`,
              roast.developmentRatio != null &&
                `DTR ${(Number(roast.developmentRatio) * 100).toFixed(1)}%`,
              roast.machineSerialNumber,
            ].filter(Boolean);

            return (
              <Card key={roast.id} sx={{ p: 2 }}>
                <Stack
                  direction="row"
                  sx={{ justifyContent: "space-between", alignItems: "center", gap: 2, flexWrap: "wrap" }}
                >
                  <Stack direction="row" spacing={1.5} sx={{ alignItems: "center", minWidth: 0 }}>
                    <LocalFireDepartmentOutlinedIcon fontSize="small" color="primary" />
                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        component={Link}
                        to={`/roasts/${roast.id}`}
                        sx={{ fontWeight: 700, color: "inherit", textDecoration: "none" }}
                      >
                        {roast.beanName || t("roasts.unnamed")}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                        {new Intl.DateTimeFormat(locale, {
                          dateStyle: "medium",
                          timeStyle: "short",
                          hour12: false,
                        }).format(new Date(roast.roastedAt))}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {metrics.join(" · ")}
                      </Typography>
                    </Box>
                  </Stack>

                  <Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
                    {roast.sampleId ? (
                      <Chip
                        component={Link}
                        to={`/samples/${roast.sampleId}`}
                        clickable
                        size="small"
                        color="primary"
                        variant="outlined"
                        label={roast.sampleTag}
                        sx={{ fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", fontWeight: 700 }}
                      />
                    ) : (
                      <Button
                        size="small"
                        variant="contained"
                        disabled={busy}
                        onClick={() => void submit({ roastId: roast.id }, { method: "post" })}
                      >
                        {t("roasts.createSample")}
                      </Button>
                    )}
                    <Button
                      component={Link}
                      to={`/roasts/${roast.id}`}
                      size="small"
                      variant="outlined"
                      color="inherit"
                      startIcon={<ShowChartIcon />}
                    >
                      {t("roasts.openRoast")}
                    </Button>
                  </Stack>
                </Stack>
              </Card>
            );
          })}
        </Stack>
      ) : (
        <Card sx={{ p: 4, textAlign: "center", borderStyle: "dashed" }}>
          <Typography sx={{ fontWeight: 700 }}>
            {appliedSearch ? t("roasts.noMatchTitle") : t("roasts.emptyTitle")}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {appliedSearch
              ? t("roasts.noMatchDescription", { search: appliedSearch })
              : t("roasts.emptyDescription")}
          </Typography>
        </Card>
      )}

      {roasts.totalPages > 1 && (
        <Stack direction="row" sx={{ mt: 2, justifyContent: "center" }}>
          <Pagination
            count={roasts.totalPages}
            page={roasts.page + 1}
            onChange={(_, value) => {
              const next = new URLSearchParams(searchParams);
              next.set("page", String(value - 1));
              setSearchParams(next);
            }}
          />
        </Stack>
      )}

      <Snackbar
        open={Boolean(toast)}
        autoHideDuration={4000}
        onClose={() => setToast("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity={actionData?.failed ? "error" : "success"} onClose={() => setToast("")}>
          {toast}
        </Alert>
      </Snackbar>
    </>
  );
}
