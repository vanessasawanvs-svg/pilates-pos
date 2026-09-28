const CACHE='core-theory-v10-0-9';
const STATIC_ASSETS=['./styles.css','./manifest.json','./offline.html'];

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
  const isJS=url.pathname.endsWith('.js');
  const isHTML=url.pathname.endsWith('.html') || url.pathname==='/' || url.pathname.endsWith('/');

  if(isJS || isHTML){
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
      .catch(()=>caches.match(event.request))
  );
});
