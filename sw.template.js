var CACHE='drill-__BUILD__';
var FILES=['./','index.html','styles.css','app.js','gen.js','cards.js','manifest.webmanifest','icons/icon-180.png','icons/icon-192.png','icons/icon-512.png'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES.map(function(u){return new Request(u,{cache:'reload'});}));}).then(function(){return self.skipWaiting();}));
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k.indexOf('drill-')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));}).then(function(){return self.clients.claim();}));
});
self.addEventListener('fetch',function(e){
  if(e.request.method!=='GET')return;
  var url=new URL(e.request.url);if(url.origin!==location.origin)return;
  e.respondWith(caches.open(CACHE).then(function(c){return c.match(e.request,{ignoreSearch:true}).then(function(hit){
    if(hit)return hit;
    if(e.request.mode==='navigate')return c.match('index.html').then(function(h){return h||fetch(e.request);});
    return fetch(e.request);
  });}));
});
