import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Silences Chrome DevTools' automatic probe for a workspace config file.
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "routes/chrome-devtools.ts",
  ),
  layout("routes/public-layout.tsx", [
    index("routes/landing.tsx"),
    route("login", "routes/login.tsx"),
    route("auth/google", "routes/auth-google.ts"),
    route("auth/google/callback", "routes/auth-google-callback.ts"),
  ]),
  layout("routes/app-layout.tsx", [
    route("app", "routes/home.tsx"),
    route("roasts/:roastId", "routes/roast-detail.tsx"),
    route("recipes", "routes/recipes.tsx"),
    route("recipes/new", "routes/recipe-new.tsx"),
    route("recipes/:recipeId", "routes/recipe-detail.tsx"),
    route("recipes/:recipeId/edit", "routes/recipe-edit.tsx"),
    route("cupping", "routes/cupping.tsx"),
    route("settings", "routes/settings.tsx"),
    layout("routes/admin-layout.tsx", [
      route("admin", "routes/admin-machines.tsx"),
      route("admin/machines/:machineId", "routes/admin-machine-detail.tsx"),
      route(
        "admin/machines/:machineId/api-keys",
        "routes/admin-machine-api-keys.ts",
      ),
      route(
        "admin/machines/:machineId/logs/:uploadId",
        "routes/admin-machine-log.tsx",
      ),
    ]),
  ]),
  route("logout", "routes/logout.ts"),
] satisfies RouteConfig;
