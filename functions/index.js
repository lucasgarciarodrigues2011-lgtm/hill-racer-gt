// Hill Racer GT — valida compras do Google Play antes de liberar o item no jogo.
// Recebe o corpo enviado pelo cordova-plugin-purchase (store.validator) e responde no formato que ele espera.
const functions = require("@google-cloud/functions-framework");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { getAuth } = require("firebase-admin/auth");
const { google } = require("googleapis");
const crypto = require("crypto");

initializeApp();
const db = getFirestore();
const PKG = process.env.PACKAGE_NAME || "br.com.hillracergt.game";
const PRODUCTS = new Set(["car_lambid", "car_sangue", "car_omega", "car_devil", "gems_60", "gems_200", "gems_500", "coins_10k", "coins_40k", "coins_100k"]);
const auth = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/androidpublisher"] });
const publisher = google.androidpublisher({ version: "v3", auth });

const fail = (res, code, message) => res.status(200).json({ ok: false, code, message });

functions.http("validatePurchase", async (req, res) => {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "content-type, authorization");
  if (req.method === "OPTIONS") return res.status(204).send("");
  if (req.method !== "POST") return res.status(405).send("");

  const body = req.body || {};
  const tx = body.transaction || {};
  if (tx.type !== "android-playstore" || !tx.purchaseToken) return fail(res, 6778003, "Transação inválida");

  let productId = body.id;
  try { const r = JSON.parse(tx.receipt || "{}"); productId = r.productId || (r.productIds && r.productIds[0]) || productId; } catch (e) {}
  if (!PRODUCTS.has(productId)) return fail(res, 6778003, "Produto desconhecido");

  // conta do jogador (opcional): liga a compra ao uid
  let uid = null;
  const h = req.get("authorization") || "";
  if (h.startsWith("Bearer ")) { try { uid = (await getAuth().verifyIdToken(h.slice(7))).uid; } catch (e) {} }

  try {
    const { data: p } = await publisher.purchases.products.get({ packageName: PKG, productId, token: tx.purchaseToken });
    // purchaseState: 0 = comprado, 1 = cancelado, 2 = pendente
    if (p.purchaseState !== 0) return fail(res, 6778006, p.purchaseState === 2 ? "Pagamento pendente" : "Compra cancelada");

    const id = crypto.createHash("sha256").update(tx.purchaseToken).digest("hex").slice(0, 40);
    await db.doc(`purchases/${id}`).set({
      productId, orderId: p.orderId || null, uid, test: p.purchaseType === 0,
      purchaseTime: Number(p.purchaseTimeMillis || 0), consumption: p.consumptionState ?? null,
      checkedAt: FieldValue.serverTimestamp()
    }, { merge: true });

    return res.status(200).json({ ok: true, data: { id: productId, latest_receipt: true, transaction: tx } });
  } catch (e) {
    const status = e.code || (e.response && e.response.status);
    if (status === 404 || status === 400 || status === 410) return fail(res, 6778006, "Compra não encontrada no Google Play");
    console.error("erro ao validar", status, e.message);
    return fail(res, 6778003, "Não foi possível validar agora. Tente de novo.");   // o plugin tenta de novo depois
  }
});

// ---------------------------------------------------------------------------
// Prêmios do ranking mensal: roda no dia 1º (Cloud Scheduler) e cria um prêmio
// para os 50 primeiros do mês anterior. O jogo resgata o prêmio na próxima vez
// que o jogador entrar na conta.
const PRIZE = pos => pos === 1 ? 300 : pos === 2 ? 200 : pos === 3 ? 150 : pos <= 10 ? 80 : 30;
functions.http("monthlyRewards", async (req, res) => {
  const now = new Date();
  const prev = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const key = (req.query && /^\d{6}$/.test(req.query.month || "")) ? req.query.month : String(prev.getUTCFullYear() * 100 + prev.getUTCMonth() + 1);
  const snap = await db.collection(`month/${key}/runs`).orderBy("pts", "desc").limit(50).get();
  let pos = 0, made = 0;
  for (const d of snap.docs) {
    const r = d.data(); if (!(r.pts > 0)) continue;
    pos++;
    try {
      await db.doc(`rewards/${d.id}_${key}`).create({ uid: d.id, nick: r.nick || "", month: key, pos, pts: r.pts, gems: PRIZE(pos), claimed: false, createdAt: FieldValue.serverTimestamp() });
      made++;
    } catch (e) { /* já existia: não duplica */ }
  }
  res.status(200).json({ month: key, ranked: pos, created: made });
});
