function base64url(bytes) {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export async function onRequestGet(context) {
  const { env } = context;

  const stateBytes = crypto.getRandomValues(new Uint8Array(24));
  const state = base64url(stateBytes);

  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.searchParams.set("client_id", env.GOOGLE_CLIENT_ID);
  url.searchParams.set("redirect_uri", env.GOOGLE_REDIRECT_URI);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", [
    "openid",
    "email",
    "profile",
    "https://www.googleapis.com/auth/gmail.readonly"
  ].join(" "));
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("prompt", "consent");
  url.searchParams.set("state", state);

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `oauth_state=${state}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`
  );
  headers.set("Location", url.toString());

  return new Response(null, { status: 302, headers });
}