// Draggable section windows. Drag a window by its title bar; clicking a
// window brings it to the front. Below 901px wide the windows stack in a
// single column and dragging is off (see the media query in styles.css).
(function () {
  var desktop = document.getElementById("desktop");
  if (!desktop) return;
  var windows = Array.prototype.slice.call(
    desktop.querySelectorAll("[data-window]")
  );
  if (!windows.length) return;

  var wide = window.matchMedia("(min-width: 901px)");
  var topZ = 10;
  var GRAB = 120; // px of title bar that must stay inside the desktop

  function clamp(v, min, max) {
    return Math.min(Math.max(v, min), max);
  }

  function focus(win) {
    windows.forEach(function (w) {
      w.classList.toggle("is-active", w === win);
    });
    win.style.zIndex = ++topZ;
  }

  windows.forEach(function (win) {
    var bar = win.querySelector(".titlebar");
    var pos = { x: 0, y: 0 };

    win.addEventListener("pointerdown", function () { focus(win); });
    win.addEventListener("focusin", function () { focus(win); });
    if (!bar) return;

    bar.addEventListener("pointerdown", function (e) {
      if (!wide.matches || e.button !== 0) return;
      if (e.target.closest("button, a")) return;

      // Where the window sits without its drag offset, relative to the desktop.
      var d = desktop.getBoundingClientRect();
      var r = win.getBoundingClientRect();
      var baseLeft = r.left - d.left - pos.x;
      var baseTop = r.top - d.top - pos.y;
      var minX = GRAB - r.width - baseLeft;
      var maxX = d.width - GRAB - baseLeft;
      var minY = -baseTop;
      var maxY = d.height - bar.offsetHeight - baseTop;

      var startX = e.clientX - pos.x;
      var startY = e.clientY - pos.y;

      function move(ev) {
        pos.x = clamp(ev.clientX - startX, minX, maxX);
        pos.y = clamp(ev.clientY - startY, minY, maxY);
        win.style.transform = "translate(" + pos.x + "px," + pos.y + "px)";
      }
      function stop() {
        win.classList.remove("is-dragging");
        bar.removeEventListener("pointermove", move);
        bar.removeEventListener("pointerup", stop);
        bar.removeEventListener("pointercancel", stop);
      }

      bar.setPointerCapture(e.pointerId);
      bar.addEventListener("pointermove", move);
      bar.addEventListener("pointerup", stop);
      bar.addEventListener("pointercancel", stop);
      win.classList.add("is-dragging");
      e.preventDefault();
    });

    // Double-click the title bar to send the window back where it started.
    bar.addEventListener("dblclick", function (e) {
      if (e.target.closest("button, a")) return;
      pos.x = 0;
      pos.y = 0;
      win.style.transform = "";
    });
  });

  desktop.classList.add("desktop--live");
  focus(windows[0]);
})();
