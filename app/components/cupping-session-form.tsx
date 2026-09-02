import ArrowCircleLeftOutlinedIcon from "@mui/icons-material/ArrowCircleLeftOutlined";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import HelpOutlineIcon from "@mui/icons-material/HelpOutlined";
import SearchIcon from "@mui/icons-material/Search";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import MenuItem from "@mui/material/MenuItem";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PageHeading } from "~/components/page-heading";
import {
  cuppingProtocols,
  defaultCupsPerSample,
  joinLocalValue,
  sampleIdPreview,
  sampleIdStructures,
  splitLocalValue,
  toLocalInputValue,
  type CuppingProtocol,
  type CuppingSessionDraft,
  type Member,
  type SampleIdStructure,
} from "~/lib/cupping";

type FieldError =
  | "name"
  | "sampleCount"
  | "cupsPerSample"
  | "start"
  | "end"
  | "endBeforeStart";

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <Typography
      variant="caption"
      sx={{ fontWeight: 800, letterSpacing: ".08em", textTransform: "uppercase", color: "text.secondary" }}
    >
      {children}
    </Typography>
  );
}

function Field({
  label,
  htmlFor,
  required,
  hint,
  children,
}: {
  label: string;
  htmlFor?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <Box>
      <Stack direction="row" spacing={0.5} sx={{ mb: 0.75, alignItems: "center" }}>
        <Typography
          component="label"
          htmlFor={htmlFor}
          variant="body2"
          sx={{ fontWeight: 700 }}
        >
          {label}
          {required && (
            <Box component="span" sx={{ color: "error.main" }}>
              {" *"}
            </Box>
          )}
        </Typography>
        {hint && (
          <Tooltip title={hint}>
            <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
          </Tooltip>
        )}
      </Stack>
      {children}
    </Box>
  );
}

export function CuppingSessionForm({
  initialValue,
  members,
  title,
  submitLabel,
  submitting,
  onSubmit,
  onCancel,
}: {
  initialValue: CuppingSessionDraft;
  members: Member[];
  title: string;
  submitLabel: string;
  submitting?: boolean;
  onSubmit: (value: CuppingSessionDraft) => void;
  onCancel: () => void;
}) {
  const { t } = useTranslation(["cupping", "common"]);
  const [value, setValue] = useState<CuppingSessionDraft>(initialValue);
  const [errors, setErrors] = useState<FieldError[]>([]);
  const [memberSearch, setMemberSearch] = useState("");
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

  const start = splitLocalValue(value.scheduledAt);
  const end = splitLocalValue(value.endsAt);
  const hasError = (field: FieldError) => errors.includes(field);

  const visibleMembers = useMemo(() => {
    const query = memberSearch.trim().toLocaleLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        member.name?.toLocaleLowerCase().includes(query) ||
        member.email.toLocaleLowerCase().includes(query),
    );
  }, [members, memberSearch]);
  const allVisibleSelected =
    visibleMembers.length > 0 &&
    visibleMembers.every((member) => value.cupperIds.includes(member.id));

  function patch(next: Partial<CuppingSessionDraft>) {
    setValue((current) => ({ ...current, ...next }));
  }

  function toggleCupper(id: string, checked: boolean) {
    patch({
      cupperIds: checked
        ? [...new Set([...value.cupperIds, id])]
        : value.cupperIds.filter((cupperId) => cupperId !== id),
    });
  }

  function toggleAllCuppers() {
    const ids = visibleMembers.map((member) => member.id);
    patch({
      cupperIds: allVisibleSelected
        ? value.cupperIds.filter((id) => !ids.includes(id))
        : [...new Set([...value.cupperIds, ...ids])],
    });
  }

  function addGuest() {
    const name = guestName.trim();
    const email = guestEmail.trim();
    if (!name || !email) return;
    patch({
      guests: [...value.guests, { id: `${email}-${Date.now().toString(36)}`, name, email }],
    });
    setGuestName("");
    setGuestEmail("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // "Start cupping now" keeps the stored start time honest at submit time.
    const scheduledAt = value.startNow
      ? toLocalInputValue(new Date())
      : value.scheduledAt;

    const found: FieldError[] = [];
    if (!value.name.trim()) found.push("name");
    if (!value.sampleCount || value.sampleCount < 1) found.push("sampleCount");
    if (!value.cupsPerSample || value.cupsPerSample < 1) found.push("cupsPerSample");
    if (!scheduledAt) found.push("start");
    if (!value.endsAt) found.push("end");
    if (scheduledAt && value.endsAt && value.endsAt <= scheduledAt) {
      found.push("endBeforeStart");
    }
    setErrors(found);
    if (found.length) return;

    onSubmit({
      ...value,
      scheduledAt,
      name: value.name.trim(),
      location: value.location.trim(),
      description: value.description.trim(),
    });
  }

  return (
    <Box component="form" onSubmit={handleSubmit} noValidate>
      <Button
        component={Link}
        to="/cupping"
        color="inherit"
        startIcon={<ArrowCircleLeftOutlinedIcon />}
        sx={{ mb: 1, ml: -1, color: "text.primary" }}
      >
        {t("form.back")}
      </Button>
      <PageHeading
        title={title}
        actions={
          <FormControlLabel
            sx={{ mr: 0 }}
            labelPlacement="end"
            control={
              <Switch
                checked={value.comboCupping}
                onChange={(event) => patch({ comboCupping: event.target.checked })}
              />
            }
            label={
              <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                <Typography variant="body2">{t("form.comboCupping")}</Typography>
                <Tooltip title={t("form.comboCuppingHint")}>
                  <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                </Tooltip>
              </Stack>
            }
          />
        }
      />
      <Card>
        <CardContent
          sx={{
            p: { xs: 2.5, md: 4 },
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
            columnGap: 6,
            rowGap: 4,
            alignItems: "start",
          }}
        >
          <Stack spacing={2.5}>
            <Field label={t("form.sessionName")} htmlFor="session-name" required>
              <TextField
                fullWidth
                id="session-name"
                value={value.name}
                error={hasError("name")}
                helperText={hasError("name") ? t("form.validation.nameRequired") : undefined}
                onChange={(event) => patch({ name: event.target.value })}
              />
            </Field>

            <Field label={t("form.protocol")} htmlFor="cupping-protocol" required>
              <TextField
                fullWidth
                select
                id="cupping-protocol"
                value={value.protocol}
                onChange={(event) => patch({ protocol: event.target.value as CuppingProtocol })}
              >
                {cuppingProtocols.map((protocol) => (
                  <MenuItem key={protocol} value={protocol}>
                    {t(`protocol.${protocol}`)}
                  </MenuItem>
                ))}
              </TextField>
              <Alert severity="info" sx={{ mt: 1, py: 0.25 }}>
                {t("form.protocolHint")}
              </Alert>
            </Field>

            <Divider sx={{ pt: 1 }} />

            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 2 }}>
              <SectionLabel>{t("form.sampleSetup")}</SectionLabel>
              <FormControlLabel
                sx={{ mr: 0 }}
                control={
                  <Switch
                    checked={value.customCups}
                    onChange={(event) =>
                      patch({
                        customCups: event.target.checked,
                        cupsPerSample: event.target.checked
                          ? value.cupsPerSample
                          : defaultCupsPerSample,
                      })
                    }
                  />
                }
                label={
                  <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                    <Typography variant="body2">{t("form.customCups")}</Typography>
                    <Tooltip title={t("form.customCupsHint")}>
                      <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                    </Tooltip>
                  </Stack>
                }
              />
            </Stack>

            <Field label={t("form.sampleWeight")} htmlFor="sample-weight">
              <TextField
                fullWidth
                id="sample-weight"
                type="number"
                value={value.sampleWeight ?? ""}
                onChange={(event) =>
                  patch({ sampleWeight: event.target.value ? Number(event.target.value) : null })
                }
                slotProps={{
                  htmlInput: { min: 0, step: 0.1 },
                  input: { endAdornment: <InputAdornment position="end">g</InputAdornment> },
                }}
              />
            </Field>

            <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, alignItems: "start" }}>
              <Field label={t("form.sampleCount")} htmlFor="sample-count" required>
                <Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
                  <TextField
                    id="sample-count"
                    type="number"
                    value={value.sampleCount}
                    error={hasError("sampleCount")}
                    onChange={(event) => patch({ sampleCount: Number(event.target.value) })}
                    slotProps={{ htmlInput: { min: 1, max: 40 } }}
                    sx={{ width: 88 }}
                  />
                  <FormControlLabel
                    sx={{ mr: 0 }}
                    control={
                      <Checkbox
                        checked={value.blind}
                        onChange={(event) => patch({ blind: event.target.checked })}
                      />
                    }
                    label={
                      <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
                        <Typography variant="body2">{t("form.blind")}</Typography>
                        <Tooltip title={t("form.blindHint")}>
                          <HelpOutlineIcon sx={{ fontSize: 16, color: "text.secondary" }} />
                        </Tooltip>
                      </Stack>
                    }
                  />
                </Stack>
              </Field>

              <Field label={t("form.cupsPerSample")} htmlFor="cups-per-sample" required>
                <TextField
                  id="cups-per-sample"
                  type="number"
                  disabled={!value.customCups}
                  value={value.cupsPerSample}
                  error={hasError("cupsPerSample")}
                  onChange={(event) => patch({ cupsPerSample: Number(event.target.value) })}
                  slotProps={{ htmlInput: { min: 1, max: 10 } }}
                  sx={{ width: 88 }}
                />
              </Field>
            </Box>

            <Field
              label={t("form.sampleIdStructure")}
              required
              hint={t("form.sampleIdPreview", {
                preview: sampleIdPreview(value.sampleIdStructure, value.sampleCount),
              })}
            >
              <ToggleButtonGroup
                exclusive
                size="small"
                value={value.sampleIdStructure}
                onChange={(_, next: SampleIdStructure | null) =>
                  next && patch({ sampleIdStructure: next })
                }
                sx={{
                  flexWrap: "wrap",
                  gap: 1,
                  "& .MuiToggleButtonGroup-grouped": {
                    border: 1,
                    borderColor: "primary.main",
                    borderRadius: "999px!important",
                    px: 2,
                    color: "primary.main",
                    "&.Mui-selected": {
                      bgcolor: "primary.main",
                      color: "primary.contrastText",
                      "&:hover": { bgcolor: "primary.dark" },
                    },
                  },
                }}
              >
                {sampleIdStructures.map((structure) => (
                  <ToggleButton key={structure} value={structure}>
                    {t(`form.sampleIdOptions.${structure}`)}
                  </ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Field>

            <Divider sx={{ pt: 1 }} />

            <SectionLabel>{t("form.scheduleAndLocation")}</SectionLabel>

            <Field label={t("form.startSession")} htmlFor="start-date" required>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  id="start-date"
                  type="date"
                  disabled={value.startNow}
                  value={start.date}
                  error={hasError("start")}
                  onChange={(event) =>
                    patch({ scheduledAt: joinLocalValue(event.target.value, start.time) })
                  }
                />
                <TextField
                  fullWidth
                  id="start-time"
                  type="time"
                  disabled={value.startNow}
                  value={start.time}
                  onChange={(event) =>
                    patch({ scheduledAt: joinLocalValue(start.date, event.target.value) })
                  }
                />
              </Stack>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={value.startNow}
                    onChange={(event) => {
                      const startNow = event.target.checked;
                      patch({
                        startNow,
                        scheduledAt: startNow
                          ? toLocalInputValue(new Date())
                          : value.scheduledAt,
                      });
                    }}
                  />
                }
                label={<Typography variant="body2">{t("form.startNow")}</Typography>}
              />
            </Field>

            <Field label={t("form.endSession")} htmlFor="end-date" required>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  fullWidth
                  id="end-date"
                  type="date"
                  value={end.date}
                  error={hasError("end") || hasError("endBeforeStart")}
                  onChange={(event) =>
                    patch({ endsAt: joinLocalValue(event.target.value, end.time) })
                  }
                />
                <TextField
                  fullWidth
                  id="end-time"
                  type="time"
                  value={end.time}
                  error={hasError("endBeforeStart")}
                  onChange={(event) => patch({ endsAt: joinLocalValue(end.date, event.target.value) })}
                />
              </Stack>
            </Field>

            <Field label={t("form.location")} htmlFor="location">
              <TextField
                fullWidth
                id="location"
                value={value.location}
                onChange={(event) => patch({ location: event.target.value })}
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
            </Field>

            <Field label={t("form.description")} htmlFor="description">
              <TextField
                fullWidth
                multiline
                minRows={3}
                id="description"
                value={value.description}
                onChange={(event) => patch({ description: event.target.value })}
              />
            </Field>
          </Stack>

          <Stack spacing={2.5}>
            <SectionLabel>{t("form.inviteCuppers")}</SectionLabel>
            <TextField
              fullWidth
              value={memberSearch}
              placeholder={t("form.searchMembers")}
              onChange={(event) => setMemberSearch(event.target.value)}
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
            <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
              <Typography variant="body2" color="text.secondary">
                {t("form.cupperList")}
              </Typography>
              <Button
                type="button"
                size="small"
                disabled={!visibleMembers.length}
                onClick={toggleAllCuppers}
                sx={{ textDecoration: "underline" }}
              >
                {allVisibleSelected ? t("form.clearAll") : t("form.selectAll")}
              </Button>
            </Stack>
            <Divider />
            <Stack spacing={0.5}>
              {visibleMembers.map((member) => (
                <FormControlLabel
                  key={member.id}
                  sx={{ mr: 0 }}
                  control={
                    <Checkbox
                      checked={value.cupperIds.includes(member.id)}
                      onChange={(event) => toggleCupper(member.id, event.target.checked)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={1.25} sx={{ alignItems: "center" }}>
                      <Avatar
                        src={member.picture ?? undefined}
                        sx={{ width: 28, height: 28, fontSize: 12, bgcolor: "secondary.light", color: "secondary.contrastText" }}
                      >
                        {(member.name ?? member.email)[0]?.toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {member.name ?? member.email}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {member.email}
                        </Typography>
                      </Box>
                    </Stack>
                  }
                />
              ))}
              {!visibleMembers.length && (
                <Typography variant="body2" color="text.secondary">
                  {t("form.noMembers")}
                </Typography>
              )}
            </Stack>

            <SectionLabel>{t("form.inviteGuest")}</SectionLabel>
            <Field label={t("form.guestName")} htmlFor="guest-name">
              <TextField
                fullWidth
                id="guest-name"
                value={guestName}
                placeholder="John Doe"
                onChange={(event) => setGuestName(event.target.value)}
              />
            </Field>
            <Field label={t("form.guestEmail")} htmlFor="guest-email">
              <TextField
                fullWidth
                id="guest-email"
                type="email"
                value={guestEmail}
                placeholder="john@mail.com"
                onChange={(event) => setGuestEmail(event.target.value)}
              />
            </Field>
            <Button
              type="button"
              fullWidth
              variant="contained"
              color="inherit"
              disabled={!guestName.trim() || !guestEmail.trim()}
              onClick={addGuest}
            >
              {t("form.addGuest")}
            </Button>

            {value.guests.length > 0 && (
              <Stack spacing={1}>
                {value.guests.map((guest) => (
                  <Stack
                    key={guest.id}
                    direction="row"
                    spacing={1}
                    sx={{ alignItems: "center", border: 1, borderColor: "divider", borderRadius: 2, px: 1.5, py: 1 }}
                  >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                        {guest.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap component="p">
                        {guest.email}
                      </Typography>
                    </Box>
                    <IconButton
                      size="small"
                      aria-label={t("form.removeGuest", { name: guest.name })}
                      onClick={() =>
                        patch({ guests: value.guests.filter((item) => item.id !== guest.id) })
                      }
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </Stack>
                ))}
              </Stack>
            )}

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ fontStyle: "italic", textAlign: "center", px: 4 }}
            >
              {t("form.notifyNote")}
            </Typography>
          </Stack>
        </CardContent>
      </Card>

      {errors.length > 0 && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {hasError("endBeforeStart")
            ? t("form.validation.endBeforeStart")
            : t("form.validation.summary")}
        </Alert>
      )}

      <Stack direction="row" spacing={1.5} sx={{ mt: 3, justifyContent: "flex-end" }}>
        <Button
          type="button"
          variant="outlined"
          color="inherit"
          disabled={submitting}
          onClick={onCancel}
        >
          {t("form.discard")}
        </Button>
        <Button type="submit" variant="contained" disabled={submitting}>
          {submitting ? t("form.saving") : submitLabel}
        </Button>
      </Stack>
    </Box>
  );
}
