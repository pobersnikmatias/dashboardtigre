// Tigre · Jugador — guarda la página en el celular para que abra sin señal.
// Sólo se ocupa de sus propios archivos: no toca el dashboard ni Supabase.
var CACHE = 'tigre-jugador-j2';
var ARCHIVOS = ['jugador.html', 'jugador.webmanifest', 'jugador-192.png', 'jugador-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ARCHIVOS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k.indexOf('tigre-jugador-') === 0 && k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var r = e.request;
  if(r.method !== 'GET') return;
  var u = new URL(r.url);
  if(u.origin !== location.origin) return;
  var nombre = u.pathname.split('/').pop() || '';
  if(ARCHIVOS.indexOf(nombre) < 0) return;
  // Primero la red (para recibir versiones nuevas); si no hay señal en 4 s, lo guardado
  e.respondWith(new Promise(function(ok){
    var listo = false;
    var t = setTimeout(function(){ caches.match(nombre, {ignoreSearch: true}).then(function(c){ if(c && !listo){ listo = true; ok(c); } }); }, 4000);
    fetch(r).then(function(res){
      if(res && res.ok){ var copia = res.clone(); caches.open(CACHE).then(function(c){ c.put(nombre, copia); }); }
      if(!listo){ listo = true; clearTimeout(t); ok(res); }
    }).catch(function(){
      caches.match(nombre, {ignoreSearch: true}).then(function(c){ if(!listo){ listo = true; clearTimeout(t); ok(c || Response.error()); } });
    });
  }));
});
