const CACHE='core-theory-v10-0-7';
const STATIC_ASSETS=['./','./styles.css','./manifest.json','./offline.html'];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then(cache=>cache.addAll(STATIC_ASSETS)).catch(()=>{})
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;

  const url=new URL(event.request.url);
  const isAppJs=url.pathname.endsWith('/app.js');
  const isIndex=url.pathname.endsWith('/index.html') || url.pathname==='/' || url.pathname.endsWith('/');
  const isServiceWorker=url.pathname.endsWith('/service-worker.js');

  if(isServiceWorker){
    return;
  }

  if(isAppJs || isIndex){
    event.respondWith(
      fetch(event.request,{cache:'no-store'}).catch(()=>caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        return response;
      })
      .catch(()=>caches.match(event.request).then(r=>r||caches.match('./offline.html')))
  );
});
