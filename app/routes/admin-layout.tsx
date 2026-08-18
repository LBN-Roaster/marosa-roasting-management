import { Outlet } from "react-router";
import { requireAdmin } from "~/lib/auth.server";
import type { Route } from "./+types/admin-layout";

export async function loader({ request }: Route.LoaderArgs) {
  return { user: await requireAdmin(request) };
}

export default function AdminLayout() {
  return <Outlet />;
}
