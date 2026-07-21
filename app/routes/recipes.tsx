import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { useRecipes } from "~/contexts/recipe-context";

export function meta() {
  return [{ title: "Recipes | MAROSA" }];
}

export default function RecipesPage() {
  const { t } = useTranslation(["recipes", "common"]);
  const { recipes, deleteRecipes } = useRecipes();
  const [selected, setSelected] = useState<string[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);

  function toggleRecipe(id: string, checked: boolean) {
    setSelected((current) => checked ? [...current, id] : current.filter((recipeId) => recipeId !== id));
  }

  function confirmDelete() {
    deleteRecipes(selected);
    setSelected([]);
    setDeleteOpen(false);
  }

  return (
    <>
      <PageHeading
        title={t("title")}
        description={t("subtitle")}
        actions={
          <>
            <Button component={Link} to="/recipes/new" variant="contained" startIcon={<AddIcon />}>{t("common:actions.createRecipe")}</Button>
            <Button variant="outlined" color="inherit" disabled={!selected.length} startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteOpen(true)}>
              {t("list.deleteSelected")}{selected.length ? ` (${selected.length})` : ""}
            </Button>
          </>
        }
      />

      <Stack direction="row" sx={{ mb: 1.5, justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>{t("inUseAt", { location: "LBN Coffee" })}</Typography>
        <Typography variant="caption" color="text.secondary">{t("recipeCount", { count: recipes.length })}</Typography>
      </Stack>

      <Card sx={{ overflow: "hidden" }}>
        {recipes.length ? (
          <Box>
            {recipes.map((recipe, index) => (
              <Box
                key={recipe.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr) auto",
                  alignItems: "center",
                  gap: 1.5,
                  px: { xs: 1.5, sm: 2.5 },
                  py: 1.75,
                  borderTop: index ? 1 : 0,
                  borderColor: "divider",
                  transition: "background-color .15s ease",
                  "&:hover": { bgcolor: "rgba(59,128,97,.045)" },
                }}
              >
                <Checkbox size="small" slotProps={{ input: { "aria-label": recipe.name } }} checked={selected.includes(recipe.id)} onChange={(event) => toggleRecipe(recipe.id, event.target.checked)} />
                <Box component={Link} to={`/recipes/${recipe.id}`} sx={{ minWidth: 0, color: "inherit", textDecoration: "none" }}>
                  <Stack direction={{ xs: "column", sm: "row" }} sx={{ justifyContent: "space-between", alignItems: { sm: "center" }, gap: { xs: 0.5, sm: 3 } }}>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 650, "&:hover": { color: "primary.main" } }}>{recipe.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{recipe.isBlend ? t("type.blend") : t("type.single")} · {t("roastCount", { count: recipe.roastCount })}</Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: { sm: "48%" }, textAlign: { sm: "right" } }}>
                      {recipe.components.map((component) => `${component.bean} ${component.percentage}%`).join(" · ")}
                    </Typography>
                  </Stack>
                </Box>
                <IconButton component={Link} to={`/recipes/${recipe.id}`} size="small" aria-label={t("common:actions.view", { name: recipe.name })}><ChevronRightIcon /></IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <CardContent>
            <Stack sx={{ minHeight: 220, alignItems: "center", justifyContent: "center", textAlign: "center" }}>
              <Typography sx={{ fontWeight: 700 }}>{t("list.emptyTitle")}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{t("list.emptyDescription")}</Typography>
              <Button component={Link} to="/recipes/new" variant="contained" size="small" startIcon={<AddIcon />} sx={{ mt: 2 }}>{t("common:actions.createRecipe")}</Button>
            </Stack>
          </CardContent>
        )}
      </Card>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("list.deleteTitle")}</DialogTitle>
        <DialogContent><DialogContentText>{t("list.deleteDescription", { count: selected.length })}</DialogContentText></DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteOpen(false)}>{t("common:actions.cancel")}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t("common:actions.delete")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
