(function () {
  "use strict";

  var SESSION_KEY = "tanxkung-teaching-access-v1";
  var config = window.TEACHING_SITE_GATE || {};
  var form = document.getElementById("login-form");
  var passwordInput = document.getElementById("site-password");
  var submitButton = document.getElementById("login-submit");
  var statusBox = document.getElementById("login-status");

  function safeNextPage() {
    var requested = new URLSearchParams(window.location.search).get("next") || "index.html";
    if (/^[A-Za-z0-9][A-Za-z0-9._-]*\.html(?:\?[^#]*)?(?:#[^\s]*)?$/.test(requested) && !/^login\.html/i.test(requested)) {
      return requested;
    }
    return "index.html";
  }

  function redirectToRequestedPage() {
    window.location.replace(new URL(safeNextPage(), window.location.href).href);
  }

  function configured() {
    return Boolean(
      config.version &&
      config.sessionMinutes &&
      config.iterations &&
      config.saltBase64 &&
      config.verifierBase64
    );
  }

  function readValidSession() {
    try {
      var raw = window.sessionStorage.getItem(SESSION_KEY);
      if (!raw) return false;
      var session = JSON.parse(raw);
      return (
        session.version === config.version &&
        typeof session.expiresAt === "number" &&
        session.expiresAt > Date.now()
      );
    } catch (error) {
      return false;
    }
  }

  function base64ToBytes(value) {
    var binary = window.atob(value);
    var bytes = new Uint8Array(binary.length);
    for (var index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function bytesToBase64(bytes) {
    var binary = "";
    for (var index = 0; index < bytes.length; index += 1) {
      binary += String.fromCharCode(bytes[index]);
    }
    return window.btoa(binary);
  }

  async function deriveVerifier(password) {
    var encoder = new TextEncoder();
    var key = await window.crypto.subtle.importKey(
      "raw",
      encoder.encode(password),
      "PBKDF2",
      false,
      ["deriveBits"]
    );
    var bits = await window.crypto.subtle.deriveBits(
      {
        name: "PBKDF2",
        hash: "SHA-256",
        salt: base64ToBytes(config.saltBase64),
        iterations: config.iterations
      },
      key,
      256
    );
    return bytesToBase64(new Uint8Array(bits));
  }

  function constantTimeEqual(left, right) {
    if (left.length !== right.length) return false;
    var difference = 0;
    for (var index = 0; index < left.length; index += 1) {
      difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
    }
    return difference === 0;
  }

  function setStatus(message, type) {
    statusBox.textContent = message;
    statusBox.dataset.type = type || "info";
  }

  if (readValidSession()) {
    redirectToRequestedPage();
    return;
  }

  if (!configured()) {
    passwordInput.disabled = true;
    submitButton.disabled = true;
    setStatus("此候選版本尚未設定門禁密碼，暫時不會發布。", "warning");
    return;
  }

  form.addEventListener("submit", async function (event) {
    event.preventDefault();
    var password = passwordInput.value;
    if (!/^\d{4}$/.test(password)) {
      setStatus("請輸入 4 位數字密碼。", "error");
      passwordInput.focus();
      return;
    }

    submitButton.disabled = true;
    passwordInput.disabled = true;
    setStatus("正在驗證…", "info");

    try {
      var verifier = await deriveVerifier(password);
      if (!constantTimeEqual(verifier, config.verifierBase64)) {
        setStatus("密碼不正確，請再試一次。", "error");
        passwordInput.value = "";
        window.setTimeout(function () {
          submitButton.disabled = false;
          passwordInput.disabled = false;
          passwordInput.focus();
        }, 900);
        return;
      }

      window.sessionStorage.setItem(
        SESSION_KEY,
        JSON.stringify({
          version: config.version,
          expiresAt: Date.now() + config.sessionMinutes * 60 * 1000
        })
      );
      setStatus("驗證成功，正在開啟教材首頁…", "success");
      redirectToRequestedPage();
    } catch (error) {
      setStatus("這個瀏覽器無法完成驗證，請改用最新版 Edge、Chrome 或 Safari。", "error");
      submitButton.disabled = false;
      passwordInput.disabled = false;
    }
  });
})();
