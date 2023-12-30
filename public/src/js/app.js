const enableNotificationsButtons = document.querySelectorAll(
  ".enable-notifications"
);

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

function displayNotification() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.ready.then((sw) => {
      sw.showNotification("Notification permission granted!", {
        body: "You successfully subscribed to our Notification service!",
        icon: "/src/images/icons/app-icon-96x96.png",
        image: "/src/images/sf-boat.jpg",
        dir: "ltr",
        lang: "en-US", // BCP 47,
        vibrate: [100, 50, 200],
        badge: "/src/images/icons/app-icon-96x96.png",
        tag: "confirm-notification",
        renotify: true,
        actions: [
          {
            action: "confirm",
            title: "Okay",
            icon: "/src/images/icons/app-icon-96x96.png",
          },
          {
            action: "cancel",
            title: "Cancel",
            icon: "/src/images/icons/app-icon-96x96.png",
          },
        ],
      });
    });
  }
}

function askForNotificationsPermission() {
  Notification.requestPermission().then((permission) => {
    if (permission !== "granted") {
      console.log("The notification permission was not granted");
    } else {
      displayNotification();
    }
  });
}

for (const button of enableNotificationsButtons) {
  if ("Notification" in window) {
    button.style.display = "block";
    button.addEventListener("click", askForNotificationsPermission);
  } else {
    button.style.display = "hidden";
  }
}
