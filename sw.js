// sw.js 核心修改部分

const CACHE_NAME = 'timer-cache-v4'; // 重要：升级版本号，强制更新
const PRECACHE_URLS = [
  '/timer-web/',          // 注意：这是目录，通常会匹配 index.html
  '/timer-web/index.html',
  '/timer-web/manifest.json'
  // 如果有其他需要预缓存的文件，也列在这里
];
const OFFLINE_URL = '/timer-web/index.html'; // 明确指定离线回退页面

// 安装事件：预缓存关键文件
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      // 强制当前等待的 Service Worker 进入激活状态
      .then(() => self.skipWaiting())
  );
});

// 激活事件：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keyList => {
      return Promise.all(keyList.map(key => {
        if (key !== CACHE_NAME) {
          return caches.delete(key);
        }
      }));
    }).then(() => self.clients.claim()) // 立即接管所有客户端
  );
});

// 关键修复：fetch 事件处理，防止死循环
self.addEventListener('fetch', event => {
  // 只处理 GET 请求
  if (event.request.method !== 'GET') return;

  // 处理导航请求（即页面请求）
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // 网络失败时，返回离线回退页面
          return caches.match(OFFLINE_URL);
        })
    );
    return;
  }

  // 处理其他静态资源请求：缓存优先策略
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request);
      })
  );
});