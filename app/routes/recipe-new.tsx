import { useNavigate } from "react-router";
import { PageHeading } from "~/components/page-heading";
import { RecipeForm } from "~/components/recipe-form";
import { useRecipes } from "~/contexts/recipe-context";

export function meta() {
  return [{ title: "Create recipe | MAROSA" }];
}

export default function NewRecipePage() {
  const navigate = useNavigate();
  const { addRecipe } = useRecipes();

  return (
    <>
      <PageHeading title="Create a new recipe" description="Add the production details and bean composition for this recipe." />
      <RecipeForm
        submitLabel="Create recipe"
        onCancel={() => navigate("/recipes")}
        onSubmit={(value) => {
          const recipe = addRecipe(value);
          navigate(`/recipes/${recipe.id}`);
        }}
      />
    </>
  );
}
