function parseCookies(cookieHeader = "") {
  const out = {};
  for (const part of cookieHeader.split(";")) {
    const i = part.indexOf("=");
    if (i !== -1) {
      const key = part.slice(0, i).trim();
      const val = part.slice(i + 1).trim();
      out[key] = val;
    }
  }
  return out;
}

function decodeBase64Unicode(str) {
  const bin = atob(str);
  const bytes = Uint8Array.from(bin, c => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

async function sha256(text) {
  const data = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, "0")).join("");
}

async function verifySession(raw, secret) {
  if (!raw || !raw.includes(".")) return null;

  const [payload, signature] = raw.split(".");
  const expected = await sha256(payload + secret);

  if (signature !== expected) return null;

  try {
    return JSON.parse(decodeBase64Unicode(payload));
  } catch {
    return null;
  }
}

export async function onRequestGet(context) {
  const cookieHeader = context.request.headers.get("Cookie") || "";
  const cookies = parseCookies(cookieHeader);
  const session = await verifySession(cookies.session, context.env.SESSION_SECRET);

  if (!session) {
    return Response.json({ error: "Не авторизован" }, { status: 401 });
  }

  return Response.json({
    email: session.email || "",
    name: session.name || "",
    picture: session.picture || ""
  });
}
