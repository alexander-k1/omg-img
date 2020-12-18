var msnry = new Masonry(".grid", {
  columnWidth: 200,
  itemSelector: ".grid-item",
  fitWidth: true,
  gutter: 10,
  stagger: 0
});
document.addEventListener("visibilitychange", () => {
  setTimeout(() => {
    msnry.layout();
  }, 500);
});
function imgError(image) {
  image.onerror = "";
  image.src =
    "https://cdn.glitch.com/a7df2678-5f61-4ca8-ab98-0c8eff5b3b7a%2Fplaceholder.png?v=1606375050517";
  return true;
}

window.onload = function() {
  msnry.layout();
  setTimeout(() => {
    msnry.layout();
  }, 500);
};
