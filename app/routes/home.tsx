import CompareArrowsIcon from "@mui/icons-material/CompareArrows";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import LocalCafeOutlinedIcon from "@mui/icons-material/LocalCafeOutlined";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { useRoasts } from "~/contexts/roast-context";

export function meta() {
  return [{ title: "Inbox | MAROSA" }];
}

type Filters = {
  startDate: string;
  endDate: string;
  machine: string;
  starredOnly: boolean;
};

const emptyFilters: Filters = { startDate: "", endDate: "", machine: "all", starredOnly: false };

export default function InboxPage() {
  const { t, i18n } = useTranslation(["inbox", "common"]);
  const { roasts, toggleStar, deleteRoasts } = useRoasts();
  const navigate = useNavigate();
  const [draftFilters, setDraftFilters] = useState<Filters>(emptyFilters);
  const [filters, setFilters] = useState<Filters>(emptyFilters);
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [compareOpen, setCompareOpen] = useState(false);

  const machines = useMemo(() => [...new Set(roasts.map((roast) => roast.machine))].sort(), [roasts]);
  const filteredRoasts = useMemo(() => roasts.filter((roast) => {
    const roastDate = roast.roastedAt.slice(0, 10);
    return (!filters.startDate || roastDate >= filters.startDate)
      && (!filters.endDate || roastDate <= filters.endDate)
      && (filters.machine === "all" || roast.machine === filters.machine)
      && (!filters.starredOnly || roast.starred);
  }), [filters, roasts]);
  const selectedRoasts = roasts.filter((roast) => selected.includes(roast.id));
  const singleSelection = selectedRoasts.length === 1 ? selectedRoasts[0] : null;
  const locale = i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-AU";

  function toggleSelected(id: string, checked: boolean) {
    setSelected((current) => checked ? [...new Set([...current, id])] : current.filter((roastId) => roastId !== id));
  }

  function clearFilters() {
    setDraftFilters(emptyFilters);
    setFilters(emptyFilters);
  }

  function confirmDelete() {
    deleteRoasts(selected);
    setSelected([]);
    setDeleteOpen(false);
  }

  const selectionHint = t("selectionHint");

  return (
    <>
      <PageHeading
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Tooltip title={selected.length === 2 ? "" : selectionHint}><span><Button disabled={selected.length !== 2} variant="contained" startIcon={<CompareArrowsIcon />} onClick={() => setCompareOpen(true)}>{t("actions.compare")}</Button></span></Tooltip>
            <Tooltip title={singleSelection?.status === "COMPLETED" ? "" : selectionHint}><span><Button disabled={!singleSelection || singleSelection.status !== "COMPLETED"} variant="outlined" startIcon={<LocalCafeOutlinedIcon />} onClick={() => navigate("/cupping")}>{t("actions.cup")}</Button></span></Tooltip>
            <Tooltip title={singleSelection ? "" : selectionHint}><span><Button disabled={!singleSelection} variant="outlined" startIcon={<OpenInNewIcon />} onClick={() => singleSelection && navigate(`/roasts/${singleSelection.id}`)}>{t("actions.openRoast")}</Button></span></Tooltip>
            <Button disabled={!selected.length} color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteOpen(true)}>{t("actions.delete")}</Button>
          </>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "260px minmax(0, 1fr)" }, gap: 3, alignItems: "start" }}>
        <Card>
          <CardHeader title={t("filters")} slotProps={{ title: { variant: "h6" } }} />
          <Divider />
          <CardContent>
            <Stack spacing={2.25}>
              <TextField label={t("startDate")} type="date" value={draftFilters.startDate} onChange={(event) => setDraftFilters({ ...draftFilters, startDate: event.target.value })} slotProps={{ inputLabel: { shrink: true }, htmlInput: { max: draftFilters.endDate || undefined } }} />
              <TextField label={t("endDate")} type="date" value={draftFilters.endDate} onChange={(event) => setDraftFilters({ ...draftFilters, endDate: event.target.value })} slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: draftFilters.startDate || undefined } }} />
              <FormControl>
                <InputLabel id="machine-filter-label">{t("roastingMachine")}</InputLabel>
                <Select labelId="machine-filter-label" label={t("roastingMachine")} value={draftFilters.machine} onChange={(event) => setDraftFilters({ ...draftFilters, machine: event.target.value })}>
                  <MenuItem value="all">{t("allMachines")}</MenuItem>
                  {machines.map((machine) => <MenuItem key={machine} value={machine}>{machine}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControlLabel control={<Checkbox checked={draftFilters.starredOnly} onChange={(event) => setDraftFilters({ ...draftFilters, starredOnly: event.target.checked })} />} label={t("starredOnly")} />
              <Stack direction={{ xs: "row", lg: "column" }} spacing={1}>
                <Button fullWidth variant="contained" onClick={() => setFilters(draftFilters)}>{t("applyFilters")}</Button>
                <Button fullWidth color="inherit" onClick={clearFilters}>{t("clear")}</Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Card sx={{ overflow: "hidden" }}>
          <Box sx={{ px: 2.5, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: 1, borderColor: "divider" }}>
            <Typography variant="body2" color="text.secondary">{t("results", { count: filteredRoasts.length })}</Typography>
            {selected.length > 0 && <Typography variant="caption" color="primary.main" sx={{ fontWeight: 700 }}>{t("selectedCount", { count: selected.length })}</Typography>}
          </Box>
          <TableContainer>
            <Table sx={{ minWidth: 850 }} aria-label={t("title")}>
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox" />
                  <TableCell padding="checkbox" />
                  <TableCell>{t("table.recipe")}</TableCell>
                  <TableCell>{t("table.roastedOn")}</TableCell>
                  <TableCell align="right">{t("table.score")}</TableCell>
                  <TableCell>{t("table.roastId")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRoasts.map((roast) => (
                  <TableRow key={roast.id} hover selected={selected.includes(roast.id)} sx={{ "&:last-child td": { borderBottom: 0 } }}>
                    <TableCell padding="checkbox">
                      <IconButton size="small" color={roast.starred ? "warning" : "default"} aria-label={roast.starred ? t("unstar", { name: roast.recipeName }) : t("star", { name: roast.recipeName })} onClick={() => toggleStar(roast.id)}>
                        {roast.starred ? <StarIcon /> : <StarBorderIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell padding="checkbox">
                      <Checkbox checked={selected.includes(roast.id)} onChange={(event) => toggleSelected(roast.id, event.target.checked)} slotProps={{ input: { "aria-label": t("select", { name: roast.recipeName }) } }} />
                    </TableCell>
                    <TableCell>
                      <Button color="inherit" onClick={() => navigate(`/roasts/${roast.id}`)} sx={{ justifyContent: "flex-start", p: 0, textAlign: "left", fontWeight: 700 }}>{roast.recipeName}</Button>
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>{roast.machine}</Typography>
                    </TableCell>
                    <TableCell>{new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short" }).format(new Date(roast.roastedAt))}</TableCell>
                    <TableCell align="right">{roast.overallScore == null ? <Typography variant="caption" color="text.secondary">{t("noScore")}</Typography> : roast.overallScore.toFixed(1)}</TableCell>
                    <TableCell>
                      <Button
                        color="primary"
                        onClick={() => navigate(`/roasts/${roast.id}`)}
                        sx={{ p: 0, minWidth: 0, fontFamily: "monospace", fontWeight: 700 }}
                      >
                        {roast.id}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {!filteredRoasts.length && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: "text.secondary" }}>{t("noResults")}</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("deleteTitle")}</DialogTitle>
        <DialogContent><DialogContentText>{t("deleteDescription", { count: selected.length })}</DialogContentText></DialogContent>
        <DialogActions><Button color="inherit" onClick={() => setDeleteOpen(false)}>{t("common:actions.cancel")}</Button><Button color="error" variant="contained" onClick={confirmDelete}>{t("common:actions.delete")}</Button></DialogActions>
      </Dialog>

      <Dialog open={compareOpen} onClose={() => setCompareOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t("actions.compare")}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2, pt: 1 }}>
            {selectedRoasts.map((roast) => (
              <Card key={roast.id} sx={{ bgcolor: "background.default" }}>
                <CardContent><Typography sx={{ fontWeight: 700 }}>{roast.recipeName}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>{roast.id}</Typography><Typography variant="h5" color="primary" sx={{ mt: 2 }}>{roast.overallScore?.toFixed(1) ?? "—"}</Typography><Typography variant="caption" color="text.secondary">{t("table.score")}</Typography></CardContent>
              </Card>
            ))}
          </Box>
        </DialogContent>
        <DialogActions><Button onClick={() => setCompareOpen(false)}>{t("common:actions.cancel")}</Button></DialogActions>
      </Dialog>
    </>
  );
}
