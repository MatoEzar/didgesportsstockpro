if ("serviceWorker" in navigator) {
  const script = location.pathname.includes("/pages/") ? "../sw.js" : "sw.js";
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(script).catch(() => {});
  });
}

const inPages = location.pathname.includes("/pages/");
const apkUrl = inPages ? "../didge-stock.apk" : "didge-stock.apk";
const android = /android/i.test(navigator.userAgent);
const installed = window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone;

function showInstallBar(message, actions) {
  if (installed || sessionStorage.getItem("didgeInstallHide") || document.getElementById("installBar")) return;
  const bar = document.createElement("div");
  bar.id = "installBar";
  bar.style.cssText = "position:fixed; left:12px; right:12px; bottom:12px; z-index:9999; background:#1e3c72; color:white; border-radius:12px; padding:14px 16px; display:flex; gap:10px; flex-wrap:wrap; align-items:center; box-shadow:0 8px 24px rgba(0,0,0,.25);";
  const text = document.createElement("span");
  text.textContent = message;
  text.style.flex = "1";
  text.style.minWidth = "180px";
  bar.appendChild(text);
  actions.forEach((action) => {
    const button = document.createElement(action.href ? "a" : "button");
    button.textContent = action.label;
    button.style.cssText = "background:white; color:#1e3c72; border:none; border-radius:8px; padding:8px 12px; font-weight:700; cursor:pointer; text-decoration:none;";
    if (action.href) button.href = action.href;
    else {
      button.type = "button";
      button.addEventListener("click", action.onClick);
    }
    bar.appendChild(button);
  });
  const later = document.createElement("button");
  later.type = "button";
  later.textContent = "Not now";
  later.style.cssText = "background:transparent; color:white; border:none; cursor:pointer;";
  later.addEventListener("click", () => {
    sessionStorage.setItem("didgeInstallHide", "1");
    bar.remove();
  });
  bar.appendChild(later);
  document.body.appendChild(bar);
}

let deferredPrompt = null;

window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredPrompt = event;
  const actions = [{
    label: android ? "Install" : "Install on this laptop",
    onClick: async () => {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
      const bar = document.getElementById("installBar");
      if (bar) bar.remove();
    }
  }];
  if (android) actions.push({ label: "Download APK", href: apkUrl });
  showInstallBar("Install Didge Stock. It opens like the POS, with its own icon.", actions);
});

window.addEventListener("load", () => {
  if (!android || installed) return;
  setTimeout(() => {
    if (deferredPrompt || document.getElementById("installBar")) return;
    showInstallBar("Download the Didge Stock APK for this phone.", [
      { label: "Download APK", href: apkUrl }
    ]);
  }, 1600);
});