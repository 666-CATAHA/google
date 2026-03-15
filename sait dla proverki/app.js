async function loadProfile() {
  const el = document.getElementById("profile");
  try {
    const res = await fetch("/api/me");
    const data = await res.json();

    if (!res.ok || !data.authenticated) {
      el.innerHTML = `<p>Вы не авторизованы.</p><a class="btn" href="/auth/google">Войти через Google</a>`;
      return;
    }

    const user = data.user;
    el.innerHTML = `
      <div class="profile">
        ${user.picture ? `<img src="${user.picture}" alt="avatar" class="avatar">` : ""}
        <div>
          <div><strong>${user.name || "Без имени"}</strong></div>
          <div class="muted">${user.email}</div>
          <div class="muted">${user.given_name || ""} ${user.family_name || ""}</div>
        </div>
      </div>
    `;
  } catch (e) {
    el.textContent = "Ошибка загрузки профиля";
  }
}

async function loadEmails() {
  const el = document.getElementById("emails");
  try {
    const res = await fetch("/api/emails");
    const data = await res.json();

    if (!res.ok) {
      el.textContent = data.error || "Не удалось загрузить письма";
      return;
    }

    if (!data.messages || data.messages.length === 0) {
      el.textContent = "Писем не найдено";
      return;
    }

    el.innerHTML = data.messages.map(msg => `
      <article class="mail-item">
        <div class="mail-subject">${escapeHtml(msg.subject || "(Без темы)")}</div>
        <div class="mail-from">${escapeHtml(msg.from || "")}</div>
        <div class="mail-date">${escapeHtml(msg.date || "")}</div>
        <div class="mail-snippet">${escapeHtml(msg.snippet || "")}</div>
      </article>
    `).join("");
  } catch (e) {
    el.textContent = "Ошибка загрузки писем";
  }
}

function escapeHtml(str) {
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

loadProfile();
loadEmails();