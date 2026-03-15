async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    out[key] = val;
  }
  return out;
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(`OAuth error: ${error}`, { status: 400 });
  }

  const cookies = parseCookies(request.headers.get("Cookie"));
  if (!code || !state || cookies.oauth_state !== state) {
    return new Response("Invalid OAuth state or missing code", { status: 400 });
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: env.GOOGLE_REDIRECT_URI,
      grant_type: "authorization_code"
    })
  });

  const tokenData = await tokenRes.json();

  if (!tokenRes.ok || !tokenData.access_token) {
    return new Response(
      `Token exchange failed: ${JSON.stringify(tokenData, null, 2)}`,
      { status: 400 }
    );
  }

  const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`
    }
  });

  const profile = await profileRes.json();

  if (!profileRes.ok || !profile.email) {
    return new Response("Failed to fetch Google profile", { status: 400 });
  }

  const sessionPayload = {
    email: profile.email,
    name: profile.name || "",
    given_name: profile.given_name || "",
    family_name: profile.family_name || "",
    picture: profile.picture || "",
    access_token: tokenData.access_token
  };

  const sessionJson = JSON.stringify(sessionPayload);
  const sessionB64 = btoa(unescape(encodeURIComponent(sessionJson)));
  const sig = await sha256(sessionB64 + env.SESSION_SECRET);

  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    `session=${sessionB64}.${sig}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=86400`
  );
  headers.append(
    "Set-Cookie",
    `oauth_state=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`
  );
  headers.set("Location", "/app.html");

  return new Response(null, { status: 302, headers });
}