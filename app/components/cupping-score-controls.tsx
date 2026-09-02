import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import LocalCafeIcon from "@mui/icons-material/LocalCafe";
import RemoveIcon from "@mui/icons-material/Remove";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Popover from "@mui/material/Popover";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { useState, type MouseEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

/** SCA forms move in quarter points. */
export const scoreStep = 0.25;
export const minScore = 6;
export const maxScore = 10;

export function ScoreStepper({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (next: number) => void;
  label?: string;
}) {
  const { t } = useTranslation("cupping");
  const clamp = (next: number) => Math.min(maxScore, Math.max(minScore, Number(next.toFixed(2))));
  return (
    <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
      <Typography variant="body2" sx={{ fontWeight: 700 }}>
        {label ?? t("cup.score")}
      </Typography>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{ alignItems: "center", bgcolor: "rgba(59,128,97,.10)", borderRadius: 999, px: 0.5, py: 0.25 }}
      >
        <IconButton
          size="small"
          color="primary"
          aria-label={`${label ?? t("cup.score")} −`}
          onClick={() => onChange(clamp(value - scoreStep))}
        >
          <RemoveIcon fontSize="small" />
        </IconButton>
        <Typography variant="body2" sx={{ minWidth: 34, textAlign: "center", fontWeight: 700 }}>
          {value.toFixed(2).replace(/\.?0+$/, "")}
        </Typography>
        <IconButton
          size="small"
          color="primary"
          aria-label={`${label ?? t("cup.score")} +`}
          onClick={() => onChange(clamp(value + scoreStep))}
        >
          <AddIcon fontSize="small" />
        </IconButton>
      </Stack>
    </Stack>
  );
}

export function IntensitySlider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (next: number) => void;
}) {
  return (
    <Box sx={{ minWidth: 0, flex: 1 }}>
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between", gap: 1 }}>
        <Typography variant="body2">{label}</Typography>
        <Box
          sx={{
            minWidth: 34,
            textAlign: "center",
            border: 1,
            borderColor: "divider",
            borderRadius: 1,
            px: 0.75,
            fontSize: 13,
          }}
        >
          {value}
        </Box>
      </Stack>
      <Slider
        size="small"
        value={value}
        min={0}
        max={10}
        step={1}
        aria-label={label}
        onChange={(_, next) => onChange(next as number)}
      />
    </Box>
  );
}

/** The five-cup rows: uniformity, clean cup and sweetness. Each cup is 2 points. */
export function CupRow({
  label,
  cups,
  totalCups,
  onChange,
}: {
  label: string;
  cups: number;
  totalCups: number;
  onChange: (next: number) => void;
}) {
  const { t } = useTranslation("cupping");
  return (
    <Stack
      direction="row"
      sx={{ alignItems: "center", justifyContent: "space-between", gap: 2, flexWrap: "wrap", p: 2 }}
    >
      <Typography variant="body2" sx={{ fontWeight: 650, minWidth: 110 }}>
        {label}
      </Typography>
      <Stack direction="row" spacing={1.25}>
        {Array.from({ length: totalCups }, (_, index) => {
          const filled = index < cups;
          return (
            <IconButton
              key={index}
              size="small"
              aria-label={t("cup.cupToggle", { number: index + 1 })}
              aria-pressed={filled}
              onClick={() => onChange(filled && cups === index + 1 ? index : index + 1)}
              sx={{
                bgcolor: filled ? "primary.main" : "action.hover",
                color: filled ? "primary.contrastText" : "text.disabled",
                "&:hover": { bgcolor: filled ? "primary.dark" : "action.selected" },
              }}
            >
              <LocalCafeIcon fontSize="small" />
            </IconButton>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
        <Typography variant="body2" sx={{ fontWeight: 700 }}>
          {t("cup.score")}
        </Typography>
        <Box
          sx={{ minWidth: 38, textAlign: "center", border: 1, borderColor: "divider", borderRadius: 1, px: 1, py: 0.25 }}
        >
          {cups * 2}
        </Box>
      </Stack>
    </Stack>
  );
}

export function DescriptorBox({
  descriptors,
  onAdd,
  onRemove,
  children,
}: {
  descriptors: string[];
  onAdd: (descriptor: string) => void;
  onRemove: (descriptor: string) => void;
  children?: ReactNode;
}) {
  const { t } = useTranslation("cupping");
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState("");

  function commit() {
    const value = draft.trim();
    if (value) onAdd(value);
    setDraft("");
    setAnchor(null);
  }

  return (
    <>
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={(event: MouseEvent<HTMLElement>) => setAnchor(event.currentTarget)}
        sx={{ borderRadius: 999, border: 1, borderStyle: "dashed", borderColor: "primary.main", px: 1.5 }}
      >
        {t("cup.addDescriptors")}
      </Button>

      <Box sx={{ mt: 1.5, minHeight: 40 }}>
        {descriptors.length ? (
          <Stack direction="row" sx={{ flexWrap: "wrap", gap: 0.75 }}>
            {descriptors.map((descriptor) => (
              <Chip
                key={descriptor}
                size="small"
                label={descriptor}
                onDelete={() => onRemove(descriptor)}
                deleteIcon={<CloseIcon />}
              />
            ))}
          </Stack>
        ) : (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", textAlign: "center", fontStyle: "italic" }}
          >
            {t("cup.noDescriptors")}
          </Typography>
        )}
      </Box>

      {children}

      <Popover
        open={Boolean(anchor)}
        anchorEl={anchor}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Stack direction="row" spacing={1} sx={{ p: 1.5 }}>
          <TextField
            autoFocus
            size="small"
            value={draft}
            placeholder={t("cup.descriptorPlaceholder")}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commit();
              }
            }}
          />
          <Button variant="contained" onClick={commit}>
            {t("cup.addDescriptor")}
          </Button>
        </Stack>
      </Popover>
    </>
  );
}
