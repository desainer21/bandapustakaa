const CACHE='banda-pustaka-v2';
const ASSETS=['./','./index.html','./style.css','./app.js','./logo.svg','./manifest.webmanifest'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS))));
self.addEventListener('activate',event=>event.waitUntil(self.clients.claim()));
self.addEventListener('fetch',event=>event.respondWith(caches.match(event.request).then(response=>response||fetch(event.request))));
self.addEventListener('push',event=>{
 let data={title:'Banda Pustaka',body:'Ada pembaruan pesanan Anda.',url:'/'};
 try{data={...data,...event.data.json()};}catch{if(event.data)data.body=event.data.text();}
 event.waitUntil(self.registration.showNotification(data.title,{body:data.body,icon:'/logo.svg',badge:'/logo.svg',data:{url:data.url}}));
});
self.addEventListener('notificationclick',event=>{
 event.notification.close(); const url=new URL(event.notification.data?.url||'/',self.location.origin).href;
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windows=>{
  const match=windows.find(window=>window.url===url); if(match)return match.focus(); return clients.openWindow(url);
 }));
});