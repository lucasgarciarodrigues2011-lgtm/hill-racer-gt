// Hill Racer GT para Windows: abre o jogo online (sempre atualizado, com conta e ranking)
// e, sem internet, abre a cópia que vem junto com o instalador.
const { app, BrowserWindow, Menu, shell } = require("electron");
const path = require("path");
const URL_ONLINE = "https://hill-racer-gt.vercel.app/";

function createWindow() {
  const win = new BrowserWindow({
    width: 1280, height: 720, minWidth: 960, minHeight: 540,
    backgroundColor: "#0d1117", title: "Hill Racer GT", autoHideMenuBar: true,
    icon: path.join(__dirname, "offline", "icon-512.png"),
    webPreferences: { contextIsolation: true, sandbox: true }
  });
  Menu.setApplicationMenu(null);
  win.webContents.setUserAgent(win.webContents.getUserAgent() + " HillRacerDesktop/" + app.getVersion());
  // links externos abrem no navegador
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: "deny" }; });
  // F11 = tela cheia
  win.webContents.on("before-input-event", (e, input) => {
    if (input.type === "keyDown" && input.key === "F11") { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.loadURL(URL_ONLINE).catch(() => win.loadFile(path.join(__dirname, "offline", "index.html")));
  win.webContents.on("did-fail-load", (e, code, desc, url, isMain) => {
    if (isMain && url.startsWith("http")) win.loadFile(path.join(__dirname, "offline", "index.html"));
  });
}

app.whenReady().then(createWindow);
app.on("window-all-closed", () => app.quit());
