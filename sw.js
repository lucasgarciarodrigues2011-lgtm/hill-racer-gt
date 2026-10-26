// Hill Racer GT — offline after the first visit; the game page is always checked online first
const V='hillracer-2026-10-26';
const CORE=['/','/manifest.webmanifest','/icon-192.png','/icon-512.png','/icon-512-maskable.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>c.addAll(CORE))); self.skipWaiting(); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{ const r=e.request, u=new URL(r.url); if(r.method!=='GET'||u.origin!==location.origin) return;
  if(r.mode==='navigate'){ e.respondWith(fetch(r).then(res=>{ caches.open(V).then(c=>c.put('/',res.clone())); return res; }).catch(()=>caches.match('/'))); return; }
  e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{ const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp)); return res; }))); });
