var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
var form = document.querySelector("form");
var titleInput = document.querySelector("#title");
var locationInput = document.querySelector("#location");
var videoPlayer = document.querySelector("#player");
var canvasElement = document.querySelector("#canvas");
var captureButton = document.querySelector("#capture-btn");
var imagePicker = document.querySelector("#image-picker");
var imagePickerArea = document.querySelector("#pick-image");
var locationBtn = document.querySelector("#location-btn");
var locationLoader = document.querySelector("#location-loader");

var fetchedLocation = { lat: 0, lng: 0 };

var picture;

locationBtn.addEventListener("click", function (event) {
  if (!("geolocation" in navigator)) {
    return;
  }
  var sawAlert = false;

  locationBtn.style.display = "none";
  locationLoader.style.display = "block";

  navigator.geolocation.getCurrentPosition(
    function (position) {
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      fetchedLocation = { lat: position.coords.latitude, lng: 0 };
      locationInput.value = "In Munich";
      document.querySelector("#manual-location").classList.add("is-focused");
    },
    function (err) {
      console.log(err);
      locationBtn.style.display = "inline";
      locationLoader.style.display = "none";
      if (!sawAlert) {
        alert("Couldn't fetch location, please enter manually!");
        sawAlert = true;
      }
      fetchedLocation = { lat: 0, lng: 0 };
    },
    { timeout: 7000 }
  );
});

function initializeLocation() {
  if (!("geolocation" in navigator)) {
    locationBtn.style.display = "none";
  }
}

function initializeMedia() {
  if (!("mediaDevices" in navigator)) {
    navigator.mediaDevices = {};
  }

  if (!("getUserMedia" in navigator.mediaDevices)) {
    navigator.mediaDevices.getUserMedia = function (constraints) {
      var getUserMedia =
        navigator.webkitGetUserMedia || navigator.mozGetUserMedia;

      if (!getUserMedia) {
        return Promise.reject(new Error("getUserMedia is not implemented!"));
      }

      return new Promise(function (resolve, reject) {
        getUserMedia.call(navigator, constraints, resolve, reject);
      });
    };
  }

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then(function (stream) {
      videoPlayer.srcObject = stream;
      videoPlayer.style.display = "block";
    })
    .catch(function (err) {
      imagePickerArea.style.display = "block";
    });
}

captureButton.addEventListener("click", function (event) {
  canvasElement.style.display = "block";
  videoPlayer.style.display = "none";
  captureButton.style.display = "none";
  var context = canvasElement.getContext("2d");
  context.drawImage(
    videoPlayer,
    0,
    0,
    canvas.width,
    videoPlayer.videoHeight / (videoPlayer.videoWidth / canvas.width)
  );
  videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
    track.stop();
  });
  picture = dataURItoBlob(canvasElement.toDataURL());
});

imagePicker.addEventListener("change", function (event) {
  picture = event.target.files[0];
});

function openCreatePostModal() {
  setTimeout(function () {
    createPostArea.style.transform = "translateY(0)";
  }, 1);

  initializeMedia();
  initializeLocation();

  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((event) => {
      if (event.outcome === "dismissed") {
        console.log("The user cancelled adding the PWA");
      } else {
        console.log("The user added the PWA");
      }
    });

    deferredPrompt = undefined;
  }
}

function closeCreatePostModal() {
  imagePickerArea.style.display = "none";
  videoPlayer.style.display = "none";
  canvasElement.style.display = "none";
  locationBtn.style.display = "inline";
  locationLoader.style.display = "none";
  captureButton.style.display = "inline";

  if (videoPlayer.srcObject) {
    videoPlayer.srcObject.getVideoTracks().forEach(function (track) {
      track.stop();
    });
  }

  setTimeout(function () {
    createPostArea.style.transform = "translateY(100vh)";
  }, 1);
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function onSaveButtonClicked() {
  // if ("caches" in window) {
  //   caches.open("user-requested").then((cache) => {
  //     cache.add("https://httpbin.org/get");
  //   });
  // }
}

function createCard(post) {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  cardWrapper.style.margin = "0 auto";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = `url(${post.image})`;
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.style.color = "white";
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = post.title;
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = post.location;
  cardSupportingText.style.textAlign = "center";
  var cardSaveButton = document.createElement("button");
  cardSaveButton.textContent = "Save";
  cardSaveButton.addEventListener("click", onSaveButtonClicked);
  cardSupportingText.appendChild(cardSaveButton);
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

function clearCards() {
  if (sharedMomentsArea.hasChildNodes) {
    sharedMomentsArea.innerHTML = "";
  }
}

let isRequestReceived = false;

const url =
  "https://firestore.googleapis.com/v1/projects/pwagram-3a1b1/databases/(default)/documents/posts";

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    isRequestReceived = true;

    clearCards();

    const posts = data.documents.map((doc) => {
      return {
        id: doc.fields.id.stringValue,
        title: doc.fields.title.stringValue,
        image: doc.fields.image.stringValue,
        location: doc.fields.location.stringValue,
      };
    });

    for (const post of posts) {
      createCard(post);
    }
  });

readAllData("posts").then((posts) => {
  if (!isRequestReceived) {
    clearCards();

    for (const post of posts) {
      createCard(post);
    }
  }
});

function sendData() {
  fetch(
    "https://firestore.googleapis.com/v1/projects/pwagram-3a1b1/databases/(default)/documents/posts",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
        image:
          "https://firebasestorage.googleapis.com/v0/b/pwagram-3a1b1.appspot.com/o/sf-boat.jpg?alt=media&token=527ae467-a938-493b-a205-4fd4c70b4d6e",
      }),
    }
  ).then(function (res) {
    console.log("Sent data", res);
  });
}

form.addEventListener("submit", function (event) {
  event.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("Please enter valid data!");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then(function (sw) {
      var post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
      };
      writeData("sync-posts", post)
        .then(function () {
          return sw.sync.register("sync-new-posts");
        })
        .then(function () {
          var snackbarContainer = document.querySelector("#confirmation-toast");
          var data = { message: "Your Post was saved for syncing!" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch(function (err) {
          console.log(err);
        });
    });
  } else {
    sendData();
  }
});
