const CACHE="namaz-takip-v1";
const CORE=["./","./index.html","./manifest.webmanifest","./service-worker.js"];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  const req=event.request;
  if(req.method!=="GET") return;
  event.respondWith(
    caches.match(req).then(cached=>{
      if(cached) return cached;
      return fetch(req).then(res=>{
        if(res.ok && new URL(req.url).origin===self.location.origin){
          const copy=res.clone();
          caches.open(CACHE).then(c=>c.put(req,copy));
        }
        return res;
      }).catch(()=>caches.match("./index.html"));
    })
  );
});

self.addEventListener("push",event=>{
  let data={title:"Namaz Takip",body:"Yeni bir hatırlatıcınız var.",url:"./"};
  try{if(event.data)data={...data,...event.data.json()};}catch(_){}
  event.waitUntil(
    self.registration.showNotification(data.title,{
      body:data.body,
      icon:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23059669'/%3E%3Cpath d='M50 18c15 0 27 12 27 27H23c0-15 12-27 27-27Zm-36 36h72v8H14zm10 14h52v8H24z' fill='white'/%3E%3C/svg%3E",
      badge:"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='22' fill='%23059669'/%3E%3C/svg%3E",
      tag:"namaz-takip",
      data:{url:data.url}
    })
  );
});

self.addEventListener("notificationclick",event=>{
  event.notification.close();
  const url=event.notification.data?.url||"./";
  event.waitUntil(
    clients.matchAll({type:"window",includeUncontrolled:true}).then(list=>{
      for(const client of list){
        if("focus" in client){client.navigate(url);return client.focus();}
      }
      if(clients.openWindow)return clients.openWindow(url);
    })
  );
});