import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link, Navigate, useNavigate, useParams } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { useRecipes } from "~/contexts/recipe-context";

export function meta() {
  return [{ title: "Recipe detail | MAROSA" }];
}

function Detail({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box component="div">
      <Typography component="dt" variant="overline" color="text.secondary" sx={{ lineHeight: 1.5 }}>{label}</Typography>
      <Typography component="dd" variant="body2" sx={{ fontWeight: 600, mt: 0.75, ml: 0 }}>{children}</Typography>
    </Box>
  );
}

export default function RecipeDetailPage() {
  const { t, i18n } = useTranslation(["recipes", "common"]);
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { recipes, deleteRecipes } = useRecipes();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const recipe = recipes.find((item) => item.id === recipeId);

  if (!recipe || !recipeId) return <Navigate to="/recipes" replace />;

  function confirmDelete() {
    deleteRecipes([recipeId!]);
    navigate("/recipes");
  }

  return (
    <>
      <Button component={Link} to="/recipes" color="inherit" startIcon={<ArrowBackIcon />} sx={{ mb: 2, ml: -1 }}>{t("common:actions.allRecipes")}</Button>
      <PageHeading
        title={recipe.name}
        description={recipe.description || t("detail.noDescription")}
        actions={
          <>
            <Button component={Link} to={`/recipes/${recipe.id}/edit`} variant="contained" startIcon={<EditOutlinedIcon />}>{t("common:actions.edit")}</Button>
            <Button variant="outlined" color="inherit" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteOpen(true)}>{t("common:actions.delete")}</Button>
          </>
        }
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.15fr .85fr" }, gap: 3 }}>
        <Card>
          <CardHeader title={t("detail.recipeDetails")} slotProps={{ title: { variant: "h6" } }} />
          <Divider />
          <CardContent component="dl" sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 3 }}>
            <Detail label={t("detail.name")}>{recipe.name}</Detail>
            <Detail label={t("detail.numberOfRoasts")}><Box component="span" sx={{ color: "primary.main" }}>{recipe.roastCount}</Box></Detail>
            <Detail label={t("detail.location")}>{recipe.location}</Detail>
            <Detail label={t("detail.recipeType")}>{recipe.isBlend ? t("type.blend") : t("type.single")}</Detail>
            <Detail label={t("detail.shrinkage")}>{recipe.shrinkage == null ? "—" : `${recipe.shrinkage}%`}</Detail>
            <Detail label={t("detail.price")}>
              {recipe.price == null
                ? "—"
                : `${new Intl.NumberFormat(i18n.resolvedLanguage === "vi" ? "vi-VN" : "en-US", { style: "currency", currency: "USD" }).format(recipe.price)} / kg`}
            </Detail>
          </CardContent>
        </Card>

        <Card>
          <CardHeader title={t("detail.beanComposition")} slotProps={{ title: { variant: "h6" } }} />
          <Divider />
          <CardContent>
            <Stack spacing={2.5}>
              {recipe.components.map((component, index) => (
                <Box key={`${component.bean}-${index}`}>
                  <Stack direction="row" sx={{ justifyContent: "space-between", gap: 2, mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>{component.bean}</Typography>
                    <Typography variant="body2" color="primary" sx={{ fontWeight: 700 }}>{component.percentage}%</Typography>
                  </Stack>
                  <LinearProgress variant="determinate" value={component.percentage} sx={{ height: 8, borderRadius: 4, bgcolor: "action.hover", "& .MuiLinearProgress-bar": { borderRadius: 4 } }} />
                </Box>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Box>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("detail.deleteTitle", { name: recipe.name })}</DialogTitle>
        <DialogContent><DialogContentText>{t("detail.deleteDescription")}</DialogContentText></DialogContent>
        <DialogActions>
          <Button color="inherit" onClick={() => setDeleteOpen(false)}>{t("common:actions.cancel")}</Button>
          <Button color="error" variant="contained" onClick={confirmDelete}>{t("common:actions.delete")}</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
