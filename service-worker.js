const CACHE="fasting-coach-v8";
const FILES=[
  "./index.html",
  "./styles.css",
  "./storage.js",
  "./theme.js",
  "./nutrition.js",
  "./food.js",
  "./app.js",
  "./settings.js",
  "./manifest.json"
];

function isCacheable(response) {
  return response.status===200 && !response.redirected;
}

async function fetchClean(request) {
  const response=await fetch(request);
  if (!response.redirected) return response;
  return fetch(new Request(response.url,{
    credentials:"same-origin",
    redirect:"error"
  }));
}

self.addEventListener("install",event=>{
  event.waitUntil((async()=>{
    const cache=await caches.open(CACHE);
    await Promise.all(FILES.map(async url=>{
      const request=new Request(url,{cache:"reload",redirect:"error"});
      const response=await fetch(request);
      if (isCacheable(response)) await cache.put(url,response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate",event=>{
  event.waitUntil((async()=>{
    const names=await caches.keys();
    await Promise.all(names.filter(name=>name!==CACHE).map(name=>caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch",event=>{
  const request=event.request;
  if (request.method!=="GET" || new URL(request.url).origin!==self.location.origin) return;

  if (request.mode==="navigate") {
    event.respondWith((async()=>{
      try {
        const response=await fetchClean(request);
        if (isCacheable(response)) {
          const cache=await caches.open(CACHE);
          await cache.put("./index.html",response.clone());
        }
        return response;
      } catch (error) {
        const cached=await caches.match("./index.html");
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }

  event.respondWith((async()=>{
    const cached=await caches.match(request);
    if (cached) return cached;
    const response=await fetchClean(request);
    if (isCacheable(response)) {
      const cache=await caches.open(CACHE);
      await cache.put(request,response.clone());
    }
    return response;
  })());
});
