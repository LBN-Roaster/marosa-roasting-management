import type { Route } from "./+types/auth-google-callback";
import { finishGoogleLogin } from "~/lib/auth.server";

export async function loader({ request }: Route.LoaderArgs) {
  return finishGoogleLogin(request);
}
