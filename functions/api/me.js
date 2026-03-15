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

async function getSession(request, env) {
  const cookies = parseCookies(request.headers.get("Cookie"));
  const raw = cookies.session;
  if (!raw || !raw.includes(".")) return null;

  const [payloadB64, sig] = raw.split(".");
  const expected = await sha256(payloadB64 + env.SESSION_SECRET);
  if (sig !== expected) return null;

  try {
    const json = decodeURIComponent(escape(atob(payloadB64)));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const session = await getSession(context.request, context.env);
  if (!session) {
    return Response.json({ authenticated: false }, { status: 401 });
  }

  return Response.json({
    authenticated: true,
    user: {
      email: session.email,
      name: session.name,
      given_name: session.given_name,
      family_name: session.family_name,
      picture: session.picture
    }
  });
}