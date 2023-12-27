const CACHE_STATIC = "static-v5";
const CACHE_DYNAMIC = "dynamic";

self.addEventListener("install", (event) => {
  console.log("The service worker has been installed successfully!", event);

  event.waitUntil(
    caches
      .open(CACHE_STATIC)
      .then((cache) => {
        cache.addAll([
          "/",
          "/index.html",
          "/help/",
          "/help/index.html",
          "/src/js/app.js",
          "/src/js/feed.js",
          "/src/js/material.min.js",
          "/src/css/app.css",
          "/src/css/feed.css",
          "/src/css/help.css",
          "/src/images/main-image.jpg",
          "https://fonts.googleapis.com/css?family=Roboto:400,700",
          "https://fonts.googleapis.com/icon?family=Material+Icons",
          "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
        ]);
      })
      .catch((error) => {
        console.log(error);
      })
  );
});

self.addEventListener("activate", (event) => {
  console.log("The service worker has been activated successfully!", event);

  event.waitUntil(
    caches.keys().then((keysList) => {
      return Promise.all(
        keysList.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      } else {
        return fetch(event.request)
          .then((res) => {
            return caches.open(CACHE_DYNAMIC).then(async (cache) => {
              // This matching is to make sure that the key doens't exist in the static cache
              // so the dynamic cache doesn't overwrite it.
              await caches.match(event.request).then((staticMatch) => {
                if (!staticMatch) {
                  cache.put(event.request.url, res.clone());
                }
              });

              return res;
            });
          })
          .catch();
      }
    })
  );
});
