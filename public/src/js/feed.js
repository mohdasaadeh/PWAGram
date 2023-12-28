var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");

function openCreatePostModal() {
  createPostArea.style.display = "block";

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
  createPostArea.style.display = "none";
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
