var CACHE='invoices-v1';
var SHELL=['./invoices.html','invoices.webmanifest','invoices-192.png','invoices-512.png'];

self.addEventListener('install',function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){
      return Promise.all(SHELL.map(function(u){
        return fetch(u,{cache:'no-cache'}).then(function(r){if(r.ok)return c.put(u,r)}).catch(function(){});
      }));
    }).then(function(){return self.skipWaiting()})
  );
});

self.addEventListener('activate',function(e){
  e.waitUntil(
    caches.keys().then(function(ks){
      return Promise.all(ks.filter(function(k){return k.indexOf('invoices-')===0&&k!==CACHE}).map(function(k){return caches.delete(k)}));
    }).then(function(){return self.clients.claim()})
  );
});

self.addEventListener('fetch',function(e){
  var req=e.request;
  if(req.method!=='GET')return;
  var url=new URL(req.url);
  if(url.origin===location.origin){
    // نفس الموقع: الأحدث من النت أولاً، ولو مفيش نت يفتح من النسخة المخزنة
    var target=req.mode==='navigate'?req.url:req;
    e.respondWith(
      fetch(target,{cache:'no-cache'}).then(function(r){
        if(r&&r.ok){var cp=r.clone();caches.open(CACHE).then(function(c){c.put(req,cp)})}
        return r;
      }).catch(function(){
        return caches.match(req).then(function(h){return h||caches.match('invoices.html')});
      })
    );
  }else{
    // خطوط وقارئ الباركود: من المخزن لو موجود، وبيتحدث في الخلفية
    e.respondWith(caches.open(CACHE).then(function(c){
      return c.match(req).then(function(hit){
        var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});
        return hit||net;
      });
    }));
  }
});
