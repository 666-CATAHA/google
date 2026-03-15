async function loadEmails() {
  const el = document.getElementById("emails");

  try {
    const res = await fetch("/api/emails");
    const data = await res.json();

    if (!res.ok) {
      el.textContent = data.error || "Не удалось загрузить письма";
      return;
    }

    if (!Array.isArray(data.messages) || data.messages.length === 0) {
      el.textContent = "Писем не найдено";
      return;
    }

    el.innerHTML = data.messages.map((msg) => `
      <article class="mail-item">
        <div class="mail-subject">${escapeHtml(toText(msg.subject) || "(Без темы)")}</div>
        <div class="mail-from">${escapeHtml(toText(msg.from))}</div>
        <div class="mail-date">${escapeHtml(toText(msg.date))}</div>
        <div class="mail-snippet">${escapeHtml(toText(msg.snippet))}</div>
      </article>
    `).join("");
  } catch (e) {
    el.textContent = "Ошибка загрузки писем";
  }
}

function toText(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  if (typeof value === "object") {
    if (typeof value.value === "string") return value.value;
    try {
      return JSON.stringify(value);
    } catch {
      return "";
    }
  }
  return String(value);
}

function escapeHtml(str = "") {
  str = String(str);
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
async function loadProfile() {
  // пока пусто, чтобы app.js не падал
}
loadProfile();
loadEmails();
