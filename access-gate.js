(function () {
  "use strict";

  var SESSION_KEY = "tanxkung-teaching-access-v1";
  var config = window.TEACHING_SITE_GATE || {};

  function readSession() {
    try {
      var raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      var session = JSON.parse(raw);
      if (
        session.version !== config.version ||
        typeof session.expiresAt !== "number" ||
        session.expiresAt <= Date.now()
      ) {
        window.sessionStorage.removeItem(SESSION_KEY);
        return null;
      }
      return session;
    } catch (error) {
      return null;
    }
  }

  function currentPage() {
    var filename = window.location.pathname.split("/").pop() || "index.html";
    return filename + window.location.search + window.location.hash;
  }

  function redirectToLogin() {
    var loginUrl = new URL("login.html", window.location.href);
    loginUrl.searchParams.set("next", currentPage());
    window.location.replace(loginUrl.href);
  }

  function addLogoutButton() {
    var filename = window.location.pathname.split("/").pop();
    if (filename && filename !== "index.html") return;

    var button = document.createElement("button");
    button.type = "button";
    button.textContent = "登出";
    button.setAttribute("aria-label", "登出教材網站");
    button.style.cssText = [
      "position:fixed",
      "right:18px",
      "bottom:18px",
      "z-index:2147483647",
      "border:1px solid rgba(255,255,255,.42)",
      "border-radius:999px",
      "padding:9px 15px",
      "background:rgba(10,38,65,.9)",
      "color:#fff",
      "font:700 14px/1 system-ui,-apple-system,BlinkMacSystemFont,\"Noto Sans TC\",sans-serif",
      "box-shadow:0 8px 24px rgba(0,0,0,.2)",
      "cursor:pointer"
    ].join(";");
    button.addEventListener("click", function () {
      try {
        window.sessionStorage.removeItem(SESSION_KEY);
      } catch (error) {
        // The following redirect still returns the visitor to the login page.
      }
      window.location.replace(new URL("login.html", window.location.href).href);
    });
    document.body.appendChild(button);
  }

  if (!readSession()) {
    redirectToLogin();
    return;
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", addLogoutButton, { once: true });
  } else {
    addLogoutButton();
  }
})();
