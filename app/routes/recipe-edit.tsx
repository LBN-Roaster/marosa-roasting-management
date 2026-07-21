import { Navigate, useNavigate, useParams } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { RecipeForm } from "~/components/recipe-form";
import { useRecipes } from "~/contexts/recipe-context";

export function meta() {
  return [{ title: "Edit recipe | MAROSA" }];
}

export default function EditRecipePage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();
  const { recipes, updateRecipe } = useRecipes();
  const recipe = recipes.find((item) => item.id === recipeId);

  if (!recipe || !recipeId) return <Navigate to="/recipes" replace />;

  const { id: _id, roastCount: _roastCount, ...initialValue } = recipe;
  return (
    <>
      <PageHeading title={`Edit ${recipe.name}`} description="Update recipe details and bean composition." />
      <RecipeForm
        initialValue={initialValue}
        submitLabel="Save changes"
        onCancel={() => navigate(`/recipes/${recipeId}`)}
        onSubmit={(value) => {
          updateRecipe(recipeId, value);
          navigate(`/recipes/${recipeId}`);
        }}
      />
    </>
  );
}
