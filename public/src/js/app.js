if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("/sw.js").then((event) => {
    console.log("The service worker has been registered successfully!", event);
  });
}

let deferredPrompt;

window.addEventListener("beforeinstallprompt", (event) => {
  console.log("Before install prompt event has been fired!", event);

  event.preventDefault();

  deferredPrompt = event;

  return false;
});
