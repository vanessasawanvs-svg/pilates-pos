const CACHE='core-theory-v11-2-final-brand';
const PRECACHE=['/','/index.html','/styles.css','/styles-v11.css','/app-v11.2.js','/manifest.json','/offline.html','/core-theory-logo.png','/icons/icon-192.png','/icons/icon-512.png','/icons/icon-maskable-512.png','/icons/apple-touch-icon.png'];
const STATIC_ASSETS=['./styles.css','./styles-v11.css','./manifest.json','./offline.html'];

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
