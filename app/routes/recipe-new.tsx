import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { PageHeading } from "~/components/page-heading";
import { RecipeForm } from "~/components/recipe-form";
import { useRecipes } from "~/contexts/recipe-context";

export function meta() {
  return [{ title: "Create recipe | MAROSA" }];
}

export default function NewRecipePage() {
  const { t } = useTranslation(["recipes", "common"]);
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();

  return (
    <>
      <PageHeading title={t("create.title")} description={t("create.description")} />
      <RecipeForm
        submitLabel={t("common:actions.createRecipe")}
        onCancel={() => navigate("/recipes")}
        onSubmit={(value) => {
          const recipe = addRecipe(value);
          navigate(`/recipes/${recipe.id}`);
        }}
      />
    </>
  );
}
