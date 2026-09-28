// 个人生活台 PWA - Service Worker
// 职责：缓存应用外壳（启动闪屏），实现离线可用与"可安装"。
// 注意：manifest 与图标已内联进 index.html；不拦截跨域的 workbuddy.cn 工作台内容（由 iframe 直接加载）。
const CACHE = 'wb-desk-v2';
const SHELL = [
  '.',
  'index.html',
  'sw.js'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // 仅处理同源外壳资源；跨域工作台内容放行给网络
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    caches.match(req).then((hit) => {
      if (hit) return hit;
      return fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => hit);
    })
  );
});
