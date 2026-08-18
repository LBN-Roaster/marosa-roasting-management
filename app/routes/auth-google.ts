import type { Route } from "./+types/auth-google";
import { startGoogleLogin } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return startGoogleLogin(request);
}
