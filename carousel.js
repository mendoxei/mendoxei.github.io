// Turns any [data-carousel] row into a carousel (three slides across, fewer on small screens) with Prev/Next
// buttons and a counter. Without this script the row still scrolls sideways.
(function () {
  document.querySelectorAll("[data-carousel]").forEach(function (strip) {
    var slides = Array.prototype.slice.call(strip.children);

    // Slides with data-priority go first (lowest number first); the rest
    // keep their order in the HTML.
    function priority(el) {
      var p = parseFloat(el.getAttribute("data-priority"));
      return isNaN(p) ? Infinity : p;
    }
    slides = slides
      .map(function (el, i) { return { el: el, i: i, p: priority(el) }; })
      .sort(function (a, b) { return a.p === b.p ? a.i - b.i : a.p < b.p ? -1 : 1; })
      .map(function (o) { return o.el; });
    slides.forEach(function (el) { strip.appendChild(el); });
    strip.scrollLeft = 0;

    if (slides.length < 2) return;

    var bar = document.createElement("div");
    bar.className = "carousel__bar";
    var prev = document.createElement("button");
    var next = document.createElement("button");
    var count = document.createElement("span");
    prev.type = next.type = "button";
    prev.className = next.className = "btn btn--small";
    prev.textContent = "\u25C0 Prev";
    next.textContent = "Next \u25B6";
    count.className = "carousel__count muted";
    bar.append(prev, count, next);
    strip.after(bar);

    function current() {
      var best = 0;
      slides.forEach(function (s, i) {
        if (Math.abs(s.offsetLeft - strip.scrollLeft) <
            Math.abs(slides[best].offsetLeft - strip.scrollLeft)) best = i;
      });
      return best;
    }
    // How many slides fit side by side (set by the CSS breakpoints).
    function perView() {
      return Math.max(1, Math.round(strip.clientWidth / slides[0].offsetWidth));
    }
    function go(i) {
      var last = Math.max(0, slides.length - perView());
      if (i > last) i = 0;
      if (i < 0) i = last;
      strip.scrollTo({ left: slides[i].offsetLeft, behavior: "smooth" });
    }
    function update() {
      var n = perView();
      var first = Math.min(current(), Math.max(0, slides.length - n));
      var end = Math.min(first + n, slides.length);
      count.textContent =
        (n > 1 ? first + 1 + "\u2013" + end : first + 1) + " / " + slides.length;
      bar.hidden = slides.length <= n;
    }

    prev.addEventListener("click", function () { go(current() - 1); });
    next.addEventListener("click", function () { go(current() + 1); });
    strip.addEventListener("scroll", update, { passive: true });
    strip.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { go(current() - 1); e.preventDefault(); }
      if (e.key === "ArrowRight") { go(current() + 1); e.preventDefault(); }
    });
    strip.tabIndex = 0;
    window.addEventListener("resize", update);
    update();
  });
})();
