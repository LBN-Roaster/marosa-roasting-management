import { randomBytes } from "node:crypto";
import {
  createCookieSessionStorage,
  redirect,
  type Session,
} from "react-router";

type GoogleUser = {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
};

type AuthSessionData = {
  backendToken: string;
  user: GoogleUser;
  oauthState: string;
  returnTo: string;
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

function decodeGoogleUser(idToken: string): GoogleUser {
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

export async function requireUser(request: Request) {
  const session = await getAuthSession(request);
  if (!session.has("backendToken")) {
    const url = new URL(request.url);
    const callbackUrl = `${url.pathname}${url.search}`;
    throw redirect(
      `/login?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
  }
  return session.get("user");
}

export async function startGoogleLogin(request: Request) {
  const url = new URL(request.url);
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
    };
    if (!backendSession.token || !backendSession.email) {
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
