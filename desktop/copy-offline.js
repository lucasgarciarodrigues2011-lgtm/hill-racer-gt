// copia o jogo da raiz do repositório para dentro do app (modo sem internet) e o ícone do instalador
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, ".."), OUT = path.join(__dirname, "offline");
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
for (const f of ["index.html", "icon-192.png", "icon-512.png", "manifest.webmanifest"]) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(OUT, f));
fs.mkdirSync(path.join(__dirname, "build"), { recursive: true });
fs.copyFileSync(path.join(ROOT, "icon-512.png"), path.join(__dirname, "build", "icon.png"));
console.log("offline:", fs.readdirSync(OUT).join(", "));
