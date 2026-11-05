const CACHE_VER='food-v2';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./vendor/zxing.min.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE_VER).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('food-')&&k!==CACHE_VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  // Only handle this app's GET requests; external API calls stay network-only.
  if(e.request.method!=='GET'||u.origin!==location.origin||!u.href.startsWith(self.registration.scope))return;
  e.respondWith((async()=>{
    const cache=await caches.open(CACHE_VER);
    let response;
    try{response=await fetch(e.request)}
    catch(error){
      const cached=await cache.match(e.request,{ignoreSearch:true});
      if(cached)return cached;
      // Never substitute HTML for a missing script, icon, or other resource.
      if(e.request.mode==='navigate'){
        const page=await cache.match(new URL('./index.html',self.registration.scope).href);
        if(page)return page;
      }
      throw error;
    }
    // Do not replace usable offline files with HTTP errors.
    if(response.ok){
      try{await cache.put(e.request,response.clone())}catch(error){/* Keep network responses usable if storage is full. */}
    }
    return response;
  })());
});
