import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import TaskAltIcon from "@mui/icons-material/TaskAlt";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLoaderData } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { RoasterStatusChip, UploadProblemChip } from "~/components/roaster-status-chip";
import { getInbox, getRoasters, getRoasts } from "~/lib/backend.server";
import { roastNames } from "~/lib/roast-names";
import { formatWhen } from "~/lib/roastery-time";
import type { Route } from "./+types/home";

export function meta() {
  return [{ title: "Today | MAROSA" }];
}

export async function loader({ request }: Route.LoaderArgs) {
  const [inbox, roasters, recent] = await Promise.all([
    getInbox(request),
    getRoasters(request),
    getRoasts(request, { size: 5, sort: "roastedAt", direction: "desc" }),
  ]);
  return { inbox, roasters, recent: recent.content };
}

type TaskItem = { key: string; to: string; primary: string; secondary?: string };

/** One kind of task: its count, the first few items, and where to see them all. */
function TaskRow({ title, count, items, seeAll }: { title: string; count: number; items: TaskItem[]; seeAll?: string }) {
  const { t } = useTranslation("inbox");
  return (
    <Box sx={{ px: { xs: 2, sm: 2.5 }, py: 2 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Typography variant="subtitle2">
          {title}
          <Typography component="span" variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>{count}</Typography>
        </Typography>
        {seeAll && (
          <Button component={Link} to={seeAll} prefetch="intent" size="small">{t("seeAll")}</Button>
        )}
      </Stack>
      <Stack spacing={0.5}>
        {items.map((item) => (
          <Stack
            key={item.key}
            component={Link}
            to={item.to}
            prefetch="intent"
            direction="row"
            sx={{ alignItems: "center", gap: 1, px: 1, py: 0.75, mx: -1, borderRadius: 1, color: "inherit", textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
          >
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>{item.primary}</Typography>
              {item.secondary && (
                <Typography variant="caption" color="text.secondary" noWrap component="p">{item.secondary}</Typography>
              )}
            </Box>
            <ChevronRightIcon fontSize="small" color="action" />
          </Stack>
        ))}
        {count > items.length && (
          <Typography variant="caption" color="text.secondary">{t("more", { count: count - items.length })}</Typography>
        )}
      </Stack>
    </Box>
  );
}

function Section({ title, action, children }: { title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <Box component="section">
      <Stack direction="row" sx={{ mb: 1.5, alignItems: "center", justifyContent: "space-between" }}>
        <Typography component="h2" variant="h6">{title}</Typography>
        {action}
      </Stack>
      {children}
    </Box>
  );
}

export default function TodayPage() {
  const { inbox, roasters, recent } = useLoaderData<typeof loader>();
  const { t, i18n } = useTranslation(["inbox", "common"]);
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-GB";

  const rows: { title: string; count: number; items: TaskItem[]; seeAll?: string }[] = [];
  if (inbox.cuppingToScore?.count) {
    rows.push({
      title: t("rows.cuppingToScore"),
      count: inbox.cuppingToScore.count,
      seeAll: "/cupping",
      items: inbox.cuppingToScore.items.map((task) => ({
        key: task.sessionId,
        to: `/cupping/${encodeURIComponent(task.sessionId)}/cup`,
        primary: task.name,
        secondary: `${formatWhen(task.startsAt, locale)} · ${t("items.unscored", { count: task.unscoredSamples })}`,
      })),
    });
  }
  if (inbox.roasterProblems?.count) {
    rows.push({
      title: t("rows.roasterProblems"),
      count: inbox.roasterProblems.count,
      seeAll: "/roasters",
      items: inbox.roasterProblems.items.map((problem) => ({
        key: problem.roasterId,
        to: `/roasters/${encodeURIComponent(problem.roasterId)}`,
        primary: problem.name,
        secondary: [problem.uploadProblem && t("items.uploadProblem"), problem.status === "OFFLINE" && t("items.offline")]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  }
  if (inbox.roastsWithoutSample?.count) {
    rows.push({
      title: t("rows.roastsWithoutSample"),
      count: inbox.roastsWithoutSample.count,
      seeAll: "/roasts",
      items: inbox.roastsWithoutSample.items.map((roast) => ({
        key: roast.roastId,
        to: `/roasts/${encodeURIComponent(roast.roastId)}`,
        primary: roastNames(roast, t("items.unnamedRoast")).heading,
        secondary: [roastNames(roast, t("items.unnamedRoast")).coffee, formatWhen(roast.roastedAt, locale), roast.roasterName]
          .filter(Boolean)
          .join(" · "),
      })),
    });
  }
  if (inbox.unfittedControllers?.count) {
    rows.push({
      title: t("rows.unfittedControllers"),
      count: inbox.unfittedControllers.count,
      items: inbox.unfittedControllers.items.map((controller) => ({
        key: controller.controllerId,
        to: "/roasters",
        primary: controller.serialNumber,
        secondary: t("items.fitController"),
      })),
    });
  }
  if (inbox.pendingInvites?.count) {
    rows.push({
      title: t("rows.pendingInvites"),
      count: inbox.pendingInvites.count,
      seeAll: "/organization",
      items: inbox.pendingInvites.items.map((invite) => ({
        key: invite.inviteId,
        to: "/organization",
        primary: invite.email,
        secondary: t(`common:organization.roles.${invite.role}`),
      })),
    });
  }

  return (
    <Box>
      <PageHeading title={t("title")} description={t("subtitle")} />

      <Stack spacing={4}>
        <Section title={t("roastersTitle")}>
          {roasters.length === 0 ? (
            <Card variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">{t("noRoasters")}</Typography>
              <Button component={Link} to="/roasters" sx={{ mt: 1, px: 0 }}>{t("addRoasters")}</Button>
            </Card>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5, gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, minmax(0, 1fr))" } }}>
              {roasters.map((roaster) => (
                <Card
                  key={roaster.id}
                  variant="outlined"
                  component={Link}
                  to={`/roasters/${encodeURIComponent(roaster.id)}`}
                  prefetch="intent"
                  sx={{ p: 2, color: "inherit", textDecoration: "none", "&:hover": { borderColor: "primary.main" } }}
                >
                  <Typography sx={{ fontWeight: 700 }} noWrap>{roaster.name}</Typography>
                  <Stack direction="row" sx={{ mt: 1, flexWrap: "wrap", gap: 0.75 }}>
                    <RoasterStatusChip status={roaster.status} />
                    {roaster.uploadProblem && <UploadProblemChip />}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {t("roastsToday", { count: roaster.roastsToday })}
                  </Typography>
                </Card>
              ))}
            </Box>
          )}
        </Section>

        <Section title={t("tasksTitle")}>
          {rows.length === 0 ? (
            <Card variant="outlined" sx={{ p: 3 }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                <TaskAltIcon color="success" />
                <Typography color="text.secondary">{t("allClear")}</Typography>
              </Stack>
            </Card>
          ) : (
            <Card variant="outlined">
              <Stack divider={<Divider />}>
                {rows.map((row) => <TaskRow key={row.title} {...row} />)}
              </Stack>
            </Card>
          )}
        </Section>

        <Section
          title={t("recentTitle")}
          action={<Button component={Link} to="/roasts" prefetch="intent" size="small">{t("allRoasts")}</Button>}
        >
          {recent.length === 0 ? (
            <Card variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">{t("noRoasts")}</Typography>
            </Card>
          ) : (
            <Card variant="outlined">
              <Stack divider={<Divider />}>
                {recent.map((roast) => (
                  <Stack
                    key={roast.id}
                    component={Link}
                    to={`/roasts/${encodeURIComponent(roast.id)}`}
                    prefetch="intent"
                    direction="row"
                    sx={{ px: 2, py: 1.5, gap: 2, alignItems: "center", color: "inherit", textDecoration: "none", "&:hover": { bgcolor: "action.hover" } }}
                  >
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {roastNames(roast, t("items.unnamedRoast")).heading}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {[roastNames(roast, t("items.unnamedRoast")).coffee, formatWhen(roast.roastedAt, locale), roast.roasterName ?? roast.controllerSerialNumber, roast.sampleTag]
                          .filter(Boolean)
                          .join(" · ")}
                      </Typography>
                    </Box>
                    <ChevronRightIcon fontSize="small" color="action" />
                  </Stack>
                ))}
              </Stack>
            </Card>
          )}
        </Section>
      </Stack>
    </Box>
  );
}
