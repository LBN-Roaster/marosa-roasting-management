import { Navigate, useNavigate, useParams } from "react-router";
import { useTranslation } from "react-i18next";
import { PageHeading } from "~/components/page-heading";
import { RecipeForm } from "~/components/recipe-form";
import { useRecipes } from "~/contexts/recipe-context";

export function meta() {
  return [{ title: "Edit recipe | MAROSA" }];
}

export default function EditRecipePage() {
  const { t } = useTranslation(["recipes", "common"]);
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { recipes, updateRecipe } = useRecipes();
  const recipe = recipes.find((item) => item.id === recipeId);

  if (!recipe || !recipeId) return <Navigate to="/recipes" replace />;

  const { id: _id, roastCount: _roastCount, ...initialValue } = recipe;
  return (
    <>
      <PageHeading title={t("edit.title", { name: recipe.name })} description={t("edit.description")} />
      <RecipeForm
        initialValue={initialValue}
        submitLabel={t("common:actions.saveChanges")}
        onCancel={() => navigate(`/recipes/${recipeId}`)}
        onSubmit={(value) => {
          updateRecipe(recipeId, value);
          navigate(`/recipes/${recipeId}`);
        }}
      />
    </>
  );
}
