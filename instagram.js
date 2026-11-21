// Instagram posts shown in the carousel, in order.
// Each entry is the code from the post's URL:
//   https://www.instagram.com/p/SHORTCODE/      ->  "SHORTCODE"
//   https://www.instagram.com/reel/SHORTCODE/   ->  "reel/SHORTCODE"
// Comment a line out to hide that post. With no posts left, the whole
// Instagram section is hidden.
var INSTAGRAM_POSTS = [
  "CT5VaM-I6Db",
  "CNPsyShLPIC",
  "CJdmRbFFQFF",
  "CGfmZIml-cC",
  "CGc-NXrlmN2",
  "CGYPXIkFwkl",
  "CB5g_rCD9Gj",
  "BxssXWuCOkl",
];

(function () {
  var section = document.getElementById("instagram");
  var frame = document.getElementById("ig-frame");
  var prev = document.getElementById("ig-prev");
  var next = document.getElementById("ig-next");
  var count = document.getElementById("ig-count");
  var open = document.getElementById("ig-open");
  if (!section || !frame || !prev || !next) return;

  var posts = INSTAGRAM_POSTS.filter(Boolean);
  if (!posts.length) {
    (section.closest("[data-window]") || section).hidden = true;
    return;
  }

  var index = 0;

  function url(code) {
    var path = code.indexOf("/") === -1 ? "p/" + code : code;
    return "https://www.instagram.com/" + path + "/";
  }

  function show(i) {
    index = (i + posts.length) % posts.length;
    var iframe = document.createElement("iframe");
    iframe.src = url(posts[index]) + "embed/";
    iframe.title = "Instagram post " + (index + 1) + " of " + posts.length;
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("allowtransparency", "true");
    frame.replaceChildren(iframe);
    if (count) count.textContent = index + 1 + " / " + posts.length;
    if (open) open.href = url(posts[index]);
  }

  prev.addEventListener("click", function () { show(index - 1); });
  next.addEventListener("click", function () { show(index + 1); });
  section.addEventListener("keydown", function (e) {
    if (e.key === "ArrowLeft") show(index - 1);
    if (e.key === "ArrowRight") show(index + 1);
  });

  if (posts.length < 2) {
    prev.hidden = true;
    next.hidden = true;
  }
  show(0);
})();
