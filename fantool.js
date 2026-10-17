/* fantool — trace a single connected line between the six points of a hexagon.
 *
 * Rules:
 *   - the glyph is one path: every line starts where the last one ended
 *   - stepping back to the point you just came from rubs that line out
 *   - a line between two points can only exist once
 */
(function () {
  "use strict";

  var N = 6;
  var TAU = Math.PI * 2;
  var GOLD = "#ffd400";
  var SLOTS = 3;
  var STORE = "fantool.slots";

  /* ---------- state ---------- */

  var slots = [[], [], []];
  var active = 0;
  var opts = { dots: true, nums: true, guide: false };

  var pad = document.getElementById("pad");
  var ctx = pad.getContext("2d");
  var reading = document.getElementById("reading");
  var codeField = document.getElementById("code");
  var codeNote = document.getElementById("codeNote");
  var thumbs = [].slice.call(document.querySelectorAll(".slot__thumb"));
  var slotBtns = [].slice.call(document.querySelectorAll(".slot"));

  var padSize = 520; // CSS px, kept in sync by the resize observer
  var pointer = null; // {x, y} in CSS px while the pointer is over the pad
  var drawing = false;

  function path() {
    return slots[active];
  }

  /* ---------- geometry ---------- */

  function vertex(i, cx, cy, r) {
    var a = -Math.PI / 2 + i * (TAU / N);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  }

  function vertices(cx, cy, r) {
    var out = [];
    for (var i = 0; i < N; i++) out.push(vertex(i, cx, cy, r));
    return out;
  }

  /* ---------- path rules ---------- */

  function edgeKey(a, b) {
    return a < b ? a + ":" + b : b + ":" + a;
  }

  function edgesOf(p) {
    var set = {};
    for (var i = 0; i < p.length - 1; i++) set[edgeKey(p[i], p[i + 1])] = true;
    return set;
  }

  // Apply a move to vertex v. Returns what happened, or null for a no-op.
  function step(p, v) {
    if (v < 0 || v >= N) return null;
    if (p.length === 0) {
      p.push(v);
      return "start";
    }
    var last = p[p.length - 1];
    if (v === last) return null;
    if (p.length >= 2 && v === p[p.length - 2]) {
      p.pop();
      return "undo";
    }
    if (edgesOf(p)[edgeKey(last, v)]) return "blocked";
    p.push(v);
    return "draw";
  }

  function replay(seq) {
    var p = [];
    var rejected = 0;
    for (var i = 0; i < seq.length; i++) {
      if (!step(p, seq[i])) rejected++;
    }
    return { path: p, rejected: rejected };
  }

  /* ---------- drawing ---------- */

  // box: {x, y, size}. o: {dots, nums, guide, preview}
  function paintGlyph(c, box, p, o) {
    var size = box.size;
    var cx = box.x + size / 2;
    var cy = box.y + size / 2;
    var r = size * 0.36;
    var pts = vertices(cx, cy, r);
    var i;

    if (o.guide) {
      c.beginPath();
      for (i = 0; i < N; i++) {
        if (i === 0) c.moveTo(pts[i].x, pts[i].y);
        else c.lineTo(pts[i].x, pts[i].y);
      }
      c.closePath();
      c.lineWidth = Math.max(1, size * 0.002);
      c.strokeStyle = "rgba(255,255,255,.07)";
      c.stroke();
    }

    if (o.dots) {
      for (i = 0; i < N; i++) {
        c.beginPath();
        c.arc(pts[i].x, pts[i].y, size * 0.012, 0, TAU);
        c.fillStyle = "rgba(255,255,255,.22)";
        c.fill();
      }
    }

    if (o.nums) {
      c.font =
        "500 " + Math.round(size * 0.026) + "px Tahoma, Verdana, sans-serif";
      c.textAlign = "center";
      c.textBaseline = "middle";
      c.fillStyle = "rgba(255,255,255,.28)";
      for (i = 0; i < N; i++) {
        var lp = vertex(i, cx, cy, r + size * 0.062);
        c.fillText(String(i + 1), lp.x, lp.y);
      }
    }

    // preview of the line being pulled towards the pointer
    if (o.preview && p.length > 0) {
      var from = pts[p[p.length - 1]];
      c.save();
      c.setLineDash([size * 0.012, size * 0.018]);
      c.lineWidth = size * 0.008;
      c.strokeStyle = "rgba(255,212,0,.30)";
      c.beginPath();
      c.moveTo(from.x, from.y);
      c.lineTo(o.preview.x, o.preview.y);
      c.stroke();
      c.restore();
    }

    if (p.length > 1) {
      c.save();
      c.lineWidth = size * 0.032;
      c.lineCap = "round";
      c.lineJoin = "round";
      c.strokeStyle = GOLD;
      if (o.glow) {
        c.shadowColor = "rgba(255,212,0,.45)";
        c.shadowBlur = size * 0.035;
      }
      c.beginPath();
      for (i = 0; i < p.length; i++) {
        var pt = pts[p[i]];
        if (i === 0) c.moveTo(pt.x, pt.y);
        else c.lineTo(pt.x, pt.y);
      }
      c.stroke();
      c.restore();
    } else if (p.length === 1) {
      // a started but empty glyph: mark where the line will begin
      var s = pts[p[0]];
      c.beginPath();
      c.arc(s.x, s.y, size * 0.018, 0, TAU);
      c.fillStyle = GOLD;
      c.fill();
    }
  }

  function paintPad() {
    ctx.clearRect(0, 0, padSize, padSize);
    paintGlyph(
      ctx,
      { x: 0, y: 0, size: padSize },
      path(),
      {
        dots: opts.dots,
        nums: opts.nums,
        guide: opts.guide,
        glow: true,
        preview: drawing ? null : pointer
      }
    );
  }

  function paintThumbs() {
    for (var i = 0; i < SLOTS; i++) {
      var cv = thumbs[i];
      var box = sizeCanvas(cv, cv.clientWidth || 80);
      var c = cv.getContext("2d");
      c.clearRect(0, 0, box, box);
      paintGlyph(c, { x: 0, y: 0, size: box }, slots[i], {
        dots: true,
        nums: false,
        guide: false,
        glow: false
      });
    }
  }

  // Size a canvas' backing store for the display and return its CSS size.
  function sizeCanvas(cv, cssSize) {
    var dpr = window.devicePixelRatio || 1;
    var px = Math.max(1, Math.round(cssSize * dpr));
    if (cv.width !== px || cv.height !== px) {
      cv.width = px;
      cv.height = px;
    }
    var c = cv.getContext("2d");
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    return cssSize;
  }

  function render() {
    paintPad();
    paintThumbs();
    var p = path();
    reading.textContent = p.length
      ? p
          .map(function (v) {
            return v + 1;
          })
          .join(" → ")
      : "Empty";
    if (document.activeElement !== codeField) {
      codeField.value = p
        .map(function (v) {
          return v + 1;
        })
        .join("-");
      codeField.classList.remove("is-bad");
    }
    save();
  }

  /* ---------- storage ---------- */

  function save() {
    try {
      window.localStorage.setItem(STORE, JSON.stringify(slots));
    } catch (e) {
      /* private mode, blocked storage — the tool still works */
    }
  }

  function restore() {
    var raw = null;
    try {
      raw = window.localStorage.getItem(STORE);
    } catch (e) {
      return;
    }
    if (!raw) return;
    try {
      var data = JSON.parse(raw);
      if (!Array.isArray(data)) return;
      for (var i = 0; i < SLOTS; i++) {
        var seq = Array.isArray(data[i]) ? data[i] : [];
        slots[i] = replay(
          seq.filter(function (v) {
            return typeof v === "number" && v >= 0 && v < N;
          })
        ).path;
      }
    } catch (e) {
      /* corrupt entry — start empty */
    }
  }

  /* ---------- sharing ---------- */

  // ?c=135.246.14 — one digit string per slot, slots split on a dot.
  function fromQuery() {
    var m = /[?&]c=([^&]*)/.exec(window.location.search);
    if (!m) return false;
    var parts = decodeURIComponent(m[1]).split(".");
    for (var i = 0; i < SLOTS; i++) {
      var digits = ((parts[i] || "").match(/[1-6]/g) || []).map(function (d) {
        return parseInt(d, 10) - 1;
      });
      slots[i] = replay(digits).path;
    }
    return true;
  }

  function shareLink() {
    var codes = slots.map(function (p) {
      return p
        .map(function (v) {
          return v + 1;
        })
        .join("");
    });
    var base = window.location.href.split("?")[0].split("#")[0];
    return base + "?c=" + codes.join(".");
  }

  function copyText(text, done) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () {
          done(true);
        },
        function () {
          done(false);
        }
      );
      return;
    }
    var ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    var ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    done(ok);
  }

  /* ---------- pointer ---------- */

  function padPoint(ev) {
    var rect = pad.getBoundingClientRect();
    return {
      x: ((ev.clientX - rect.left) / rect.width) * padSize,
      y: ((ev.clientY - rect.top) / rect.height) * padSize
    };
  }

  function hitVertex(pt) {
    var r = padSize * 0.36;
    var pts = vertices(padSize / 2, padSize / 2, r);
    var reach = r * 0.42;
    var best = -1;
    var bestD = reach * reach;
    for (var i = 0; i < N; i++) {
      var dx = pt.x - pts[i].x;
      var dy = pt.y - pts[i].y;
      var d = dx * dx + dy * dy;
      if (d <= bestD) {
        bestD = d;
        best = i;
      }
    }
    return best;
  }

  pad.addEventListener("pointerdown", function (ev) {
    pad.focus();
    var pt = padPoint(ev);
    pointer = pt;
    var v = hitVertex(pt);
    drawing = true;
    pad.setPointerCapture(ev.pointerId);
    if (v >= 0 && step(path(), v)) render();
    else paintPad();
  });

  pad.addEventListener("pointermove", function (ev) {
    var pt = padPoint(ev);
    pointer = pt;
    if (!drawing) {
      paintPad();
      return;
    }
    var v = hitVertex(pt);
    if (v >= 0 && step(path(), v)) render();
  });

  function endStroke(ev) {
    if (!drawing) return;
    drawing = false;
    if (ev && ev.pointerId != null && pad.hasPointerCapture(ev.pointerId)) {
      pad.releasePointerCapture(ev.pointerId);
    }
    paintPad();
  }

  pad.addEventListener("pointerup", endStroke);
  pad.addEventListener("pointercancel", endStroke);

  pad.addEventListener("pointerleave", function () {
    pointer = null;
    paintPad();
  });

  /* ---------- keyboard ---------- */

  pad.addEventListener("keydown", function (ev) {
    if (ev.key >= "1" && ev.key <= "6") {
      if (step(path(), parseInt(ev.key, 10) - 1)) render();
      ev.preventDefault();
    } else if (ev.key === "Backspace") {
      path().pop();
      render();
      ev.preventDefault();
    } else if (ev.key === "Escape") {
      slots[active] = [];
      render();
      ev.preventDefault();
    }
  });

  /* ---------- controls ---------- */

  document.getElementById("undo").addEventListener("click", function () {
    path().pop();
    render();
  });

  document.getElementById("clear").addEventListener("click", function () {
    slots[active] = [];
    render();
  });

  document.getElementById("clearAll").addEventListener("click", function () {
    slots = [[], [], []];
    render();
  });

  slotBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      active = parseInt(btn.getAttribute("data-slot"), 10);
      slotBtns.forEach(function (b, i) {
        b.classList.toggle("is-active", i === active);
      });
      codeField.blur();
      render();
    });
  });

  [
    ["tgDots", "dots"],
    ["tgNums", "nums"],
    ["tgGuide", "guide"]
  ].forEach(function (pair) {
    var el = document.getElementById(pair[0]);
    el.checked = opts[pair[1]];
    el.addEventListener("change", function () {
      opts[pair[1]] = el.checked;
      paintPad();
    });
  });

  function loadCode() {
    var digits = (codeField.value.match(/[1-6]/g) || []).map(function (d) {
      return parseInt(d, 10) - 1;
    });
    var res = replay(digits);
    slots[active] = res.path;
    codeField.blur();
    render();
    if (res.rejected) {
      codeField.classList.add("is-bad");
      codeNote.textContent =
        res.rejected +
        (res.rejected === 1 ? " move was" : " moves were") +
        " dropped — repeated or duplicate lines.";
    } else {
      codeNote.textContent = "Vertex order for the selected slot.";
    }
  }

  document.getElementById("load").addEventListener("click", loadCode);
  codeField.addEventListener("keydown", function (ev) {
    if (ev.key === "Enter") {
      ev.preventDefault();
      loadCode();
    }
  });

  /* ---------- export ---------- */

  function download(href, name) {
    var a = document.createElement("a");
    a.href = href;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  document.getElementById("pngOne").addEventListener("click", function () {
    var size = 1024;
    var cv = document.createElement("canvas");
    cv.width = size;
    cv.height = size;
    paintGlyph(cv.getContext("2d"), { x: 0, y: 0, size: size }, path(), {
      dots: false,
      nums: false,
      guide: false,
      glow: false
    });
    download(cv.toDataURL("image/png"), "glyph-" + (active + 1) + ".png");
  });

  document.getElementById("pngAll").addEventListener("click", function () {
    var cell = 1024;
    var gap = Math.round(cell * 0.06);
    var cv = document.createElement("canvas");
    cv.width = cell * SLOTS + gap * (SLOTS - 1);
    cv.height = cell;
    var c = cv.getContext("2d");
    for (var i = 0; i < SLOTS; i++) {
      paintGlyph(c, { x: i * (cell + gap), y: 0, size: cell }, slots[i], {
        dots: false,
        nums: false,
        guide: false,
        glow: false
      });
    }
    download(cv.toDataURL("image/png"), "coordinate.png");
  });

  document.getElementById("copyLink").addEventListener("click", function () {
    var note = document.getElementById("exportNote");
    var link = shareLink();
    copyText(link, function (ok) {
      note.textContent = ok
        ? "Link copied — it carries all three glyphs."
        : "Copy failed. Link: " + link;
    });
  });

  document.getElementById("svgOne").addEventListener("click", function () {
    var size = 100;
    var p = path();
    var pts = vertices(size / 2, size / 2, size * 0.36);
    var body = "";
    if (p.length > 1) {
      var d = p
        .map(function (v, i) {
          return (
            (i === 0 ? "M" : "L") +
            pts[v].x.toFixed(2) +
            " " +
            pts[v].y.toFixed(2)
          );
        })
        .join(" ");
      body =
        '<path d="' +
        d +
        '" fill="none" stroke="' +
        GOLD +
        '" stroke-width="' +
        (size * 0.032).toFixed(2) +
        '" stroke-linecap="round" stroke-linejoin="round"/>';
    } else if (p.length === 1) {
      body =
        '<circle cx="' +
        pts[p[0]].x.toFixed(2) +
        '" cy="' +
        pts[p[0]].y.toFixed(2) +
        '" r="' +
        (size * 0.018).toFixed(2) +
        '" fill="' +
        GOLD +
        '"/>';
    }
    var svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ' +
      size +
      " " +
      size +
      '" width="512" height="512">' +
      body +
      "</svg>";
    var url = URL.createObjectURL(
      new Blob([svg], { type: "image/svg+xml" })
    );
    download(url, "glyph-" + (active + 1) + ".svg");
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  });

  /* ---------- sizing ---------- */

  function resize() {
    var css = pad.clientWidth || 520;
    padSize = sizeCanvas(pad, css);
    paintPad();
    paintThumbs();
  }

  if (window.ResizeObserver) {
    new ResizeObserver(resize).observe(pad);
  } else {
    window.addEventListener("resize", resize);
  }

  if (!fromQuery()) restore();
  resize();
  render();
})();
