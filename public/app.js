function renderBootError(message, detail = "") {
  const root = document.createElement("div");
  root.style.cssText = [
    "margin:24px auto",
    "max-width:980px",
    "padding:20px",
    "border-radius:18px",
    "background:#fff4f1",
    "border:1px solid rgba(209,72,54,0.22)",
    "box-shadow:0 18px 48px rgba(27,43,77,0.12)",
    "font-family:Manrope, sans-serif",
    "color:#162033",
  ].join(";");
  root.innerHTML = `
    <p style="margin:0 0 8px;font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:#b24a35;">Error de arranque</p>
    <h2 style="margin:0 0 10px;font-size:26px;">La aplicacion no pudo iniciar</h2>
    <p style="margin:0 0 12px;line-height:1.5;">${message}</p>
    <pre style="margin:0;padding:14px;border-radius:14px;background:#fff;border:1px solid rgba(22,32,51,0.08);overflow:auto;white-space:pre-wrap;">${detail}</pre>
  `;
  document.body.appendChild(root);
}

window.addEventListener("error", (event) => {
  renderBootError(event.message || "Error JavaScript no controlado.", event.error?.stack || "");
});

window.addEventListener("unhandledrejection", (event) => {
  const reason = event.reason;
  renderBootError("Promesa rechazada durante el arranque.", reason?.stack || String(reason || ""));
});

// Clean entrypoint. The legacy implementation stays isolated here while we
// rebuild the app screen by screen without adding more overrides below.
import("./legacy/app-legacy.js").catch((error) => {
  renderBootError("Fallo al cargar el modulo principal.", error?.stack || String(error || ""));
});
