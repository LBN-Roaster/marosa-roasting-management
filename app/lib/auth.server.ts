import { randomBytes } from "node:crypto";
import {
  createCookieSessionStorage,
  redirect,
  type Session,
} from "react-router";

export type UserRole = "USER" | "ADMIN";

export type GoogleUser = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  role: UserRole;
};

type AuthSessionData = {
  backendToken: string;
  user: GoogleUser;
  oauthState: string;
  returnTo: string;
  /** The roastery the user last worked in; sent to the backend on every call. */
  organizationId: string;
};

let sessionStorage: ReturnType<
  typeof createCookieSessionStorage<AuthSessionData>
> | null = null;

function requiredEnvironmentVariable(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is required for Google authentication.`);
  }
  return value;
}

function getSessionStorage() {
  if (!sessionStorage) {
    sessionStorage = createCookieSessionStorage<AuthSessionData>({
      cookie: {
        name: "__marosa_session",
        httpOnly: true,
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
        sameSite: "lax",
        secrets: [requiredEnvironmentVariable("SESSION_SECRET")],
        secure: process.env.NODE_ENV === "production",
      },
    });
  }
  return sessionStorage;
}

function appOrigin(request: Request) {
  return (process.env.APP_URL ?? new URL(request.url).origin).replace(/\/$/, "");
}

function backendOrigin() {
  return (process.env.BACKEND_API_URL ?? "http://localhost:8080").replace(
    /\/$/,
    "",
  );
}

function safeReturnTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/app";
  }
  return value;
}

function decodeGoogleUser(idToken: string): Omit<GoogleUser, "role"> {
  const payload = idToken.split(".")[1];
  if (!payload) {
    throw new Error("Google returned an invalid ID token.");
  }

  const claims = JSON.parse(
    Buffer.from(payload, "base64url").toString("utf8"),
  ) as Partial<GoogleUser> & { email_verified?: boolean };

  if (
    !claims.sub ||
    !claims.email ||
    claims.email_verified !== true
  ) {
    throw new Error("Google did not return a verified email address.");
  }

  return {
    sub: claims.sub,
    email: claims.email,
    name: claims.name,
    picture: claims.picture,
  };
}

export async function getAuthSession(request: Request) {
  return getSessionStorage().getSession(request.headers.get("Cookie"));
}

/**
 * DEVELOPMENT ONLY. With AUTH_DEV_BYPASS=true the app skips Google sign-in and
 * runs as a stand-in user, so the screens can be clicked through locally. It is
 * ignored in production builds no matter how the variable is set.
 */
export function authBypassEnabled() {
  return (
    process.env.AUTH_DEV_BYPASS === "true" &&
    process.env.NODE_ENV !== "production"
  );
}

const bypassUser: GoogleUser = {
  sub: "dev-bypass",
  email: process.env.AUTH_DEV_BYPASS_EMAIL ?? "dev@lbn.local",
  name: "Local Developer",
  role: "ADMIN",
};

// The session cookie lives for a week, but the backend JWT inside it expires
// sooner (auth.jwt.expiration-ms). Only the JWT's own expiry says whether the
// backend will still accept the user, so read it rather than trust the cookie.
function backendTokenExpired(token: string) {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1] ?? "", "base64url").toString("utf8"),
    ) as { exp?: unknown };
    return typeof payload.exp !== "number" || payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

/** The signed-in user, or null when there is no session the backend would still accept. */
export async function getSignedInUser(request: Request) {
  if (authBypassEnabled()) return bypassUser;

  const session = await getAuthSession(request);
  const token = session.get("backendToken");
  const user = session.get("user");
  if (
    !token ||
    backendTokenExpired(token) ||
    !user ||
    (user.role !== "USER" && user.role !== "ADMIN")
  ) {
    return null;
  }
  return user;
}

export async function requireUser(request: Request) {
  const user = await getSignedInUser(request);
  if (!user) {
    const url = new URL(request.url);
    const callbackUrl = `${url.pathname}${url.search}`;
    throw redirect(
      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }
  return user;
}

export async function requireAdmin(request: Request) {
  const user = await requireUser(request);
  if (user.role !== "ADMIN") {
    throw redirect("/app");
  }
  return user;
}

/** The organization chosen in this browser, if any. */
export async function getSessionOrganizationId(request: Request) {
  const session = await getAuthSession(request);
  return session.get("organizationId") ?? null;
}

/** A Set-Cookie header that remembers the chosen organization. */
export async function rememberOrganization(request: Request, organizationId: string) {
  const session = await getAuthSession(request);
  session.set("organizationId", organizationId);
  return getSessionStorage().commitSession(session);
}

export async function logout(request: Request) {
  const session = await getAuthSession(request);
  throw redirect("/login", {
    headers: {
      "Set-Cookie": await getSessionStorage().destroySession(session),
    },
  });
}

export async function startGoogleLogin(request: Request) {
  const url = new URL(request.url);

  // Google always returns to APP_URL, and the state cookie is scoped to the
  // host that set it. Starting from any other host (a Vercel deployment URL,
  // www vs apex) would fail with invalid_state, so hop to APP_URL first.
  // Hosts are compared rather than origins so a proxy reporting http instead
  // of https cannot cause a redirect loop.
  const canonical = new URL(appOrigin(request));
  if (url.host !== canonical.host) {
    throw redirect(`${canonical.origin}${url.pathname}${url.search}`);
  }

  const session = await getAuthSession(request);
  const state = randomBytes(32).toString("base64url");
  const redirectUri = `${appOrigin(request)}/auth/google/callback`;

  session.set("oauthState", state);
  session.set("returnTo", safeReturnTo(url.searchParams.get("callbackUrl")));

  const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  googleUrl.search = new URLSearchParams({
    client_id: requiredEnvironmentVariable("GOOGLE_CLIENT_ID"),
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  }).toString();

  throw redirect(googleUrl.toString(), {
    headers: {
      "Set-Cookie": await getSessionStorage().commitSession(session),
    },
  });
}

async function redirectWithError(
  session: Session<AuthSessionData>,
  error: string,
) {
  session.unset("oauthState");
  session.unset("returnTo");
  throw redirect(`/login?error=${encodeURIComponent(error)}`, {
    headers: {
      "Set-Cookie": await getSessionStorage().commitSession(session),
    },
  });
}

export async function finishGoogleLogin(request: Request) {
  const url = new URL(request.url);
  const session = await getAuthSession(request);
  const expectedState = session.get("oauthState");
  const state = url.searchParams.get("state");
  const code = url.searchParams.get("code");

  if (url.searchParams.has("error")) {
    return redirectWithError(session, "cancelled");
  }
  if (!code || !state || !expectedState || state !== expectedState) {
    return redirectWithError(session, "invalid_state");
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: requiredEnvironmentVariable("GOOGLE_CLIENT_ID"),
        client_secret: requiredEnvironmentVariable("GOOGLE_CLIENT_SECRET"),
        code,
        grant_type: "authorization_code",
        redirect_uri: `${appOrigin(request)}/auth/google/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      return redirectWithError(session, "token_exchange_failed");
    }

    const tokens = (await tokenResponse.json()) as { id_token?: string };
    if (!tokens.id_token) {
      return redirectWithError(session, "missing_id_token");
    }

    const user = decodeGoogleUser(tokens.id_token);
    const accessCheck = await fetch(
      `${backendOrigin()}/api/auth/google/check`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      },
    );
    if (!accessCheck.ok) {
      return redirectWithError(session, "not_authorized");
    }

    const backendResponse = await fetch(
      `${backendOrigin()}/api/auth/google`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: tokens.id_token }),
      },
    );
    if (!backendResponse.ok) {
      return redirectWithError(session, "backend_auth_failed");
    }

    const backendSession = (await backendResponse.json()) as {
      token?: string;
      email?: string;
      name?: string;
      picture?: string;
      role?: UserRole;
    };
    if (
      !backendSession.token ||
      !backendSession.email ||
      (backendSession.role !== "USER" && backendSession.role !== "ADMIN")
    ) {
      return redirectWithError(session, "missing_backend_token");
    }

    const returnTo = safeReturnTo(session.get("returnTo") ?? null);
    session.unset("oauthState");
    session.unset("returnTo");
    session.set("backendToken", backendSession.token);
    session.set("user", {
      sub: user.sub,
      email: backendSession.email,
      name: backendSession.name,
      picture: backendSession.picture,
      role: backendSession.role,
    });

    throw redirect(returnTo, {
      headers: {
        "Set-Cookie": await getSessionStorage().commitSession(session),
      },
    });
  } catch (error) {
    if (error instanceof Response) {
      throw error;
    }
    console.error("Google authentication failed", error);
    return redirectWithError(session, "unexpected");
  }
}
