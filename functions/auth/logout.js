export async function onRequestGet() {
  const headers = new Headers();
  headers.append(
    "Set-Cookie",
    "session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0"
  );
  headers.set("Location", "/");
  return new Response(null, { status: 302, headers });
}