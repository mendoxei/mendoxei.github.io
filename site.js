(function () {
  var frame = document.getElementById("player-frame");
  var start = document.getElementById("player-start");
  if (!frame || !start) return;

  function play() {
    if (frame.querySelector("iframe")) return;
    var iframe = document.createElement("iframe");
    iframe.src = "https://itch.io/embed-upload/19133928?color=333333";
    iframe.title = "Encore Points: Skymarks";
    iframe.allowFullscreen = true;
    iframe.setAttribute("allow", "autoplay; fullscreen; gamepad");
    frame.replaceChildren(iframe);
    frame.classList.add("player__frame--live");
  }

  start.addEventListener("click", play);
  document.querySelectorAll("[data-play]").forEach(function (el) {
    el.addEventListener("click", play);
  });
})();
