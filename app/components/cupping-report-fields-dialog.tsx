import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControlLabel from "@mui/material/FormControlLabel";
import Typography from "@mui/material/Typography";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { attributeLabelKey, reportAttributes } from "~/lib/cupping-report";

/**
 * Picks the sample attributes a report prints. The report lays them out in the
 * sample sheet's own order, so the picker only decides which ones appear.
 */
export function ReportFieldsDialog({
  open,
  initial,
  onCancel,
  onGenerate,
}: {
  open: boolean;
  initial: string[];
  onCancel: () => void;
  onGenerate: (fields: string[]) => void;
}) {
  const { t } = useTranslation(["cupping", "common"]);
  const [selected, setSelected] = useState<string[]>(initial);

  // Reopening the dialog starts from whatever the report is showing now.
  useEffect(() => {
    if (open) setSelected(initial);
  }, [open, initial]);

  const label = (key: string) => t(attributeLabelKey(key), { defaultValue: key });

  // The picker reads alphabetically; the report itself keeps the sheet's order.
  const sorted = useMemo(
    () => [...reportAttributes].sort((a, b) => label(a).localeCompare(label(b))),
    [t],
  );

  const chosen = useMemo(
    () => reportAttributes.filter((key) => selected.includes(key)),
    [selected],
  );

  function toggle(key: string) {
    setSelected((current) =>
      current.includes(key) ? current.filter((item) => item !== key) : [...current, key],
    );
  }

  const allSelected = selected.length === reportAttributes.length;

  return (
    <Dialog open={open} onClose={onCancel} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ pb: 0.5 }}>
        {t("report.picker.title")}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          {t("report.picker.description")}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <FormControlLabel
          control={
            <Checkbox
              checked={allSelected}
              indeterminate={selected.length > 0 && !allSelected}
              onChange={(event) => setSelected(event.target.checked ? [...reportAttributes] : [])}
            />
          }
          label={<Typography variant="body2" sx={{ fontWeight: 700 }}>{t("report.picker.selectAll")}</Typography>}
        />
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(3, 1fr)" },
            columnGap: 2,
          }}
        >
          {sorted.map((key) => (
            <FormControlLabel
              key={key}
              control={<Checkbox size="small" checked={selected.includes(key)} onChange={() => toggle(key)} />}
              label={<Typography variant="body2">{label(key)}</Typography>}
            />
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button color="inherit" onClick={onCancel}>
          {t("common:actions.cancel")}
        </Button>
        <Button variant="contained" disabled={!chosen.length} onClick={() => onGenerate(chosen)}>
          {t("report.picker.generate")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
