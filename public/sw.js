const CACHE = "stage-v2";
const SHELL = ["/", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png"];
self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    const shell = await cache.match("/");
    const html = await shell.text();
    const assets = [...new Set([...html.matchAll(/(?:src|href)="([^" ]*\/_next\/static\/[^" ]+)"/g)].map(match => match[1]))];
    await cache.addAll(assets);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", event => { event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("stage-") && key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())); });
self.addEventListener("message", event => { if(event.data==="CLEAR_PRIVATE_CACHE") event.waitUntil(caches.delete(CACHE)); });
self.addEventListener("fetch", event => {
  const request=event.request,url=new URL(request.url);
  if(request.method!=="GET" || url.origin!==self.location.origin || request.headers.get("RSC") || url.pathname.startsWith("/api/session") || request.headers.has("range")) return;
  const supported=request.mode==="navigate" || url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/") || url.pathname==="/api/workspace" || url.pathname.startsWith("/api/reports/") || url.pathname==="/manifest.webmanifest";
  if(!supported) return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE);
    const isAsset=url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/");
    if(isAsset) { const hit=await cache.match(request);if(hit) return hit; }
    try {
      const response=await fetch(request);
      if(response.ok) await cache.put(request,response.clone());
      if(response.status===401 && url.pathname==="/api/workspace") await cache.delete(request);
      return response;
    } catch {
      const cached=await cache.match(request) || (request.mode==="navigate" ? await cache.match("/") : undefined);
      if(cached) {
        const headers=new Headers(cached.headers);
        headers.set("X-Stage-Offline","1");
        return new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers});
      }
      return new Response("This page is not available offline yet.",{status:503,headers:{"Content-Type":"text/plain"}});
    }
  })());
});
