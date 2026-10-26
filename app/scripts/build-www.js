// Copia o jogo (raiz do repositório) para app/www, que vira o conteúdo do app Android
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..", ".."), WWW = path.join(__dirname, "..", "www");
fs.rmSync(WWW, { recursive: true, force: true }); fs.mkdirSync(WWW, { recursive: true });
const files = ["index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "icon-512-maskable.png", "og.png", "privacidade.html"];
for (const f of files) if (fs.existsSync(path.join(ROOT, f))) fs.copyFileSync(path.join(ROOT, f), path.join(WWW, f));
// marca que está rodando dentro do app (o site continua igual)
const ix = path.join(WWW, "index.html");
let s = fs.readFileSync(ix, "utf8");
s = s.replace("<head>", '<head>\n<script>window.HR_APP="android";</script>');
fs.writeFileSync(ix, s);
console.log("www pronto:", fs.readdirSync(WWW).join(", "));
