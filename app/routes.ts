import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  // Silences Chrome DevTools' automatic probe for a workspace config file.
  route(
    ".well-known/appspecific/com.chrome.devtools.json",
    "routes/chrome-devtools.ts",
  ),
  layout("routes/public-layout.tsx", [
    index("routes/landing.tsx"),
    route("tool", "routes/tool.tsx"),
    route("login", "routes/login.tsx"),
    route("r/:token", "routes/public-roast.tsx"),
    route("auth/google", "routes/auth-google.ts"),
    route("auth/google/callback", "routes/auth-google-callback.ts"),
  ]),
  layout("routes/app-layout.tsx", [
    route("app", "routes/home.tsx"),
    route("recipes", "routes/recipes.tsx"),
    route("recipes/new", "routes/recipe-new.tsx"),
    route("recipes/:recipeId", "routes/recipe-detail.tsx"),
    route("recipes/:recipeId/edit", "routes/recipe-edit.tsx"),
    route("roasters", "routes/roasters.tsx"),
    route("roasters/:roasterId", "routes/roaster-detail.tsx"),
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
    route("organization", "routes/organization.tsx"),
    route("organization/switch", "routes/organization-switch.ts"),
    layout("routes/admin-layout.tsx", [
      route("admin", "routes/admin-controllers.tsx"),
      route("admin/organizations", "routes/admin-organizations.tsx"),
      route("admin/controllers/:controllerId", "routes/admin-controller-detail.tsx"),
      route(
        "admin/controllers/:controllerId/api-keys",
        "routes/admin-controller-api-keys.ts",
      ),
      route(
        "admin/controllers/:controllerId/logs/:uploadId",
        "routes/admin-controller-log.tsx",
      ),
    ]),
  ]),
  route("logout", "routes/logout.ts"),
] satisfies RouteConfig;
