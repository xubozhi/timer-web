const CACHE_NAME = 'voice-timer-v2';
const OFFLINE_URL = '/index.html';
const PRECACHE_URLS = ['/timer-web/', '/timer-web/index.html'];

self.addEventListener('install', event => {
  console.log('[Service Worker] 安装中...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  console.log('[Service Worker] 激活中，清理旧缓存...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(name => name !== CACHE_NAME && caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  // 对页面导航请求使用“网络优先，失败后缓存”的策略
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // 对其他资源（CSS， 内联JS等）使用“缓存优先，网络回退”的策略
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        // 克隆请求，因为它是“流”，只能使用一次
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
          return networkResponse;
        });
      }).catch(error => {
        console.error('[Service Worker] 获取失败:', error);
        // 对于非导航请求，可以返回一个自定义错误或什么都不做
      })
  );
});
