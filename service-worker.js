const CACHE="lanquetin-v2-local";
const ASSETS=['./', './index.html', './periodes.html', './periode.html', './personnages.html', './frises-cartes.html', './jeux.html', './methodologie.html', './mediatheque.html', './progression.html', './sources.html', './confidentialite.html', './accessibilite.html', './assets/style.css', './assets/data.js', './assets/app.js', './assets/logo.svg', './manifest.webmanifest', './assets/images/action-francaise-1936.jpg', './assets/images/berlin-wall.jpg', './assets/images/churchill.jpg', './assets/images/clemenceau.jpg', './assets/images/de-gaulle.jpg', './assets/images/gandhi.jpg', './assets/images/grevistes-1936.jpg', './assets/images/john-kennedy.jpg', './assets/images/le-populaire-1936.jpg', './assets/images/leon-blum.jpg', './assets/images/regards-conges-1936.jpg', './assets/images/soviets-front-populaire.jpg'];
self.addEventListener("install",event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response&&response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy));}
    return response;
  }).catch(()=>event.request.mode==="navigate"?caches.match("./index.html"):Response.error())));
});
