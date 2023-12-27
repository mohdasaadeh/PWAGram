self.addEventListener("install", (event) => {
  console.log("The service worker has been installed successfully!", event);
});

self.addEventListener("activate", (event) => {
  console.log("The service worker has been activated successfully!", event);
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
