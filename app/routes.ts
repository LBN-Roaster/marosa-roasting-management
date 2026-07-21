import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/app-layout.tsx", [
    index("routes/home.tsx"),
    route("roasts/:roastId", "routes/roast-detail.tsx"),
    route("recipes", "routes/recipes.tsx"),
    route("recipes/new", "routes/recipe-new.tsx"),
    route("recipes/:recipeId", "routes/recipe-detail.tsx"),
    route("recipes/:recipeId/edit", "routes/recipe-edit.tsx"),
    route("cupping", "routes/cupping.tsx"),
    route("settings", "routes/settings.tsx"),
  ]),
] satisfies RouteConfig;
