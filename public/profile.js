var modal = document.querySelector("#delete-image");
var imageToDelete;
var elem = document.querySelector(".grid");

document.querySelector("#url-form").addEventListener("submit", function (e) {
  e.preventDefault();
  fetch("/image-upload", {
    method: "POST",
    mode: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({url: e.target.url.value})
  })
    .then(response => response.json())
    .then(response => {
      if (response == "OK") {
        alert("Image uploaded!")
        location = location;
      } else {
        alert("Error")
        console.log(response);
      }
    })
    .catch(error => {
      alert("Error: ", error);
    });
});

Dropzone.options.myAwesomeDropzone = {
    init: function() {
      this.on("addedfile", function(file) {
        document.querySelector(".dz-upload").innerText = "File added..."
      });
      this.on("uploadprogress", function(file, progress) {
        document.querySelector(".dz-upload").innerText = Math.floor(progress) + " % uploaded..."
      });
      this.on("success", function(file, response) { 
        alert("Image uploaded!");
        location = location;
    });
    },
    maxFilesize: 5,
    maxFiles: 1,
    acceptedFiles: "image/*"
  };

function openDelete(arg) {
  imageToDelete = arg.parentNode.id;
  modal.style.display = "block";
  setTimeout(() => {
    document.getElementById('question-mark').style.top = "0px";
  }, 0.1)
}

function postDelete() {
   fetch("/delete-image", {
    method: "POST",
    mode: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({imageid: imageToDelete})
  })
    .then(response => response.json())
    .then(response => {
      if (response == "OK") {
        alert("Image deleted!")
        location = location;
      } else {
        alert("Error");
      }
    })
    .catch(error => {
      alert("Error: ", error);
    });
}

function clickCancelDelete() {
  modal.style.display = "none";
  imageToDelete = null;
  document.getElementById('question-mark').style.top = '-70px';
}

window.onclick = function (event) {
  if (event.target == modal) {
    clickCancelDelete();
  }
};