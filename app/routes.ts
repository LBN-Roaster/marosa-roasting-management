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
    route("recipes", "routes/recipes.tsx"),
    route("recipes/new", "routes/recipe-new.tsx"),
    route("recipes/:recipeId", "routes/recipe-detail.tsx"),
    route("recipes/:recipeId/edit", "routes/recipe-edit.tsx"),
    route("roasts", "routes/roasts.tsx"),
    route("roasts/:roastId", "routes/roast-detail-page.tsx"),
    route("samples", "routes/samples.tsx"),
    route("samples/:sampleId", "routes/sample-detail.tsx"),
    route("cupping", "routes/cupping.tsx"),
    route("cupping/new", "routes/cupping-new.tsx"),
    route("cupping/:sessionId/edit", "routes/cupping-edit.tsx"),
    route("cupping/:sessionId/samples", "routes/cupping-samples.tsx"),
    route("cupping/:sessionId/cup", "routes/cupping-cup.tsx"),
    route("cupping/:sessionId/review", "routes/cupping-review.tsx"),
    route("cupping/:sessionId/report/:sampleId", "routes/cupping-report.tsx"),
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
