self.addEventListener('install', (e) => {
  console.log('FieldVoice Service Worker Installed');
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});