importScripts("https://cdn.jsdelivr.net/npm/idb@8/build/umd.js");
importScripts("/src/js/utility.js");

const CACHE_STATIC = "static-v12";
const CACHE_DYNAMIC = "dynamic";

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    cache.keys().then((keys) => {
      if (keys.length > maxItems) {
        cache.delete(keys[0]).then((isDeleted) => {
          trimCache(cacheName, maxItems);
        });
      }
    });
  });
}

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
          "/offline.html",
          "/src/js/material.min.js",
          "/src/js/idb.js",
          "/src/js/utility.js",
          "/src/js/app.js",
          "/src/js/feed.js",
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

const url =
  "https://firestore.googleapis.com/v1/projects/pwagram-3a1b1/databases/(default)/documents/posts";

self.addEventListener("fetch", (event) => {
  if (event.request.url.includes(url)) {
    event.respondWith(
      fetch(event.request).then((response) => {
        const clonedResponse = response.clone();

        clonedResponse.json().then((data) => {
          const posts = data.documents.map((doc) => {
            return {
              id: doc.fields.id.stringValue,
              title: doc.fields.title.stringValue,
              image: doc.fields.image.stringValue,
              location: doc.fields.location.stringValue,
            };
          });

          for (const post of posts) {
            writeData("posts", post);
          }
        });

        return response;
      })
    );
  } else {
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
                    // trimCache(CACHE_DYNAMIC, 3);

                    cache.put(event.request.url, res.clone());
                  }
                });

                return res;
              });
            })
            .catch((error) => {
              return caches.open(CACHE_STATIC).then((cache) => {
                // This fallback page is only when any of the HTML pages only isn't found, because it's non sense to show
                // this fallbakc on any failed request.
                if (event.request.headers.get("accept").includes("text/html")) {
                  return cache.match("/offline.html");
                }
              });
            });
        }
      })
    );
  }
});

self.addEventListener("sync", function (event) {
  console.log("[Service Worker] Background syncing", event);
  if (event.tag === "sync-new-posts") {
    console.log("[Service Worker] Syncing new Posts");
    event.waitUntil(
      readAllData("sync-posts").then(function (data) {
        for (var dt of data) {
          fetch(
            "https://firestore.googleapis.com/v1/projects/pwagram-3a1b1/databases/(default)/documents/posts",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Accept: "application/json",
              },
              body: JSON.stringify({
                id: dt.id,
                title: dt.title,
                location: dt.location,
                image:
                  "https://firebasestorage.googleapis.com/v0/b/pwagram-3a1b1.appspot.com/o/sf-boat.jpg?alt=media&token=527ae467-a938-493b-a205-4fd4c70b4d6e",
              }),
            }
          )
            .then(function (res) {
              // This always returns an error because there is a problem with the endpoint since
              // I cannot do a post request to it so the items will never get deleted.
              console.log("Sent data", res);
              if (res.ok) {
                deleteItemFromData("sync-posts", dt.id);
                // This is commented because firebase functions didn't work since it requires BLAZE plan
                // res.json().then(function (resData) {
                //   deleteItemFromData("sync-posts", resData.id);
                // });
              }
            })
            .catch(function (err) {
              console.log("Error while sending data", err);
            });
        }
      })
    );
  }
});

self.addEventListener("notificationclick", function (event) {
  var notification = event.notification;
  var action = event.action;

  console.log(notification);

  if (action === "confirm") {
    console.log("Confirm was chosen");
    notification.close();
  } else {
    console.log(action);
    notification.close();
  }
});

self.addEventListener("notificationclose", function (event) {
  console.log("Notification was closed", event);
});
