/* ==========================================================
   noe's space — site scripts (vanilla JS, no build step)
========================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var HUES = [335, 45, 215, 270, 340, 50];

  function rand(min, max) { return min + Math.random() * (max - min); }

  /* ---------- run something once the splash screen has gone ---------- */
  var siteReady = !root.classList.contains("splashing");
  var readyQueue = [];
  function whenReady(fn) { siteReady ? fn() : readyQueue.push(fn); }
  function markReady() {
    siteReady = true;
    readyQueue.splice(0).forEach(function (fn) { fn(); });
  }

  /* ==========================================================
     SPLASH — bubbles splashing out of the middle
  ========================================================== */
  (function splash() {
    var el = document.querySelector(".splash");
    if (!el) { root.classList.remove("splashing"); markReady(); return; }

    var seen = false;
    try { seen = sessionStorage.getItem("noe-splash") === "1"; } catch (e) {}
    var minTime = reduceMotion ? 250 : seen ? 800 : 2100;
    var started = performance.now();
    var finished = false;
    var timer;

    function burst(count, big) {
      var vmin = Math.min(window.innerWidth, window.innerHeight);
      for (var i = 0; i < count; i++) {
        var b = document.createElement("span");
        var angle = Math.random() * Math.PI * 2;
        var dist = vmin * (big ? rand(0.3, 0.85) : rand(0.14, 0.5));
        var size = big ? rand(34, 110) : rand(16, 66);
        b.className = "bubble splash-bubble";
        b.style.cssText =
          "--s:" + size + "px;--dx:" + Math.cos(angle) * dist + "px;--dy:" + Math.sin(angle) * dist +
          "px;--h:" + HUES[i % HUES.length] + ";--dur:" + rand(900, 1500) + "ms;--delay:" + rand(0, 320) + "ms";
        b.addEventListener("animationend", function () { this.remove(); });
        el.appendChild(b);
      }
    }

    function finish() {
      if (finished) return;
      finished = true;
      clearInterval(timer);
      if (!reduceMotion) burst(36, true);
      setTimeout(function () { el.classList.add("done"); }, reduceMotion ? 0 : 420);
      setTimeout(function () {
        el.remove();
        root.classList.remove("splashing");
        try { sessionStorage.setItem("noe-splash", "1"); } catch (e) {}
        markReady();
      }, reduceMotion ? 50 : 1400);
    }

    function pageLoaded() {
      var wait = Math.max(0, minTime - (performance.now() - started));
      setTimeout(finish, wait);
    }

    if (!reduceMotion) {
      burst(16, false);
      timer = setInterval(function () { burst(11, false); }, 650);
    }
    if (document.readyState === "complete") pageLoaded();
    else window.addEventListener("load", pageLoaded);
    setTimeout(finish, 5000); // never keep anyone waiting
  })();

  /* ==========================================================
     BACKGROUND BUBBLES
  ========================================================== */
  if (!reduceMotion) {
    var field = document.createElement("div");
    field.className = "bubble-field";
    field.setAttribute("aria-hidden", "true");
    var count = window.innerWidth < 700 ? 7 : 11;
    for (var i = 0; i < count; i++) {
      var b = document.createElement("span");
      var size = rand(26, 96);
      b.className = "bubble";
      b.style.cssText =
        "left:" + rand(2, 96) + "%;width:" + size + "px;height:" + size + "px;--h:" + HUES[i % HUES.length] +
        ";--dur:" + rand(20, 38) + "s;--delay:" + -rand(0, 30) + "s;--sway:" + rand(-50, 50) + "px";
      field.appendChild(b);
    }
    document.body.appendChild(field);
  }

  /* ==========================================================
     NAVIGATION
  ========================================================== */
  var page = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach(function (a) {
    if (a.getAttribute("href") === page) {
      a.classList.add("active");
      a.setAttribute("aria-current", "page");
    }
  });

  var burger = document.getElementById("hamburger");
  var navLinks = document.querySelector(".nav-links");
  function setMenu(open) {
    if (!burger || !navLinks) return;
    navLinks.classList.toggle("active", open);
    burger.classList.toggle("active", open);
    burger.setAttribute("aria-expanded", String(open));
  }
  if (burger && navLinks) {
    burger.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!navLinks.classList.contains("active"));
    });
    navLinks.addEventListener("click", function (e) { if (e.target.closest("a")) setMenu(false); });
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".navbar")) setMenu(false);
    });
  }

  document.querySelectorAll("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ==========================================================
     BACK TO TOP
  ========================================================== */
  var toTop = document.createElement("button");
  toTop.type = "button";
  toTop.className = "back-to-top";
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
  document.body.appendChild(toTop);
  window.addEventListener("scroll", function () {
    toTop.classList.toggle("show", window.scrollY > 400);
  }, { passive: true });
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
  });

  /* ==========================================================
     FADE-IN ON SCROLL
  ========================================================== */
  var fadeSel = ".project-card, .page-banner, .about-content, .about-image, .interest-card, .language-card, .tool-card, .contact-card, .education-card, .hero, .call-to-action, .section-title";
  if ("IntersectionObserver" in window && !reduceMotion) {
    var items = document.querySelectorAll(fadeSel);
    items.forEach(function (el) { el.classList.add("fade"); });
    whenReady(function () {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
          var delay = Math.min(idx, 5) * 90;
          el.style.transitionDelay = delay + "ms";
          el.classList.add("show");
          io.unobserve(el);
          // hand control back to hover/tilt styles once revealed
          setTimeout(function () {
            el.classList.remove("fade", "show");
            el.style.transitionDelay = "";
          }, 1000 + delay);
        });
      }, { threshold: 0.12 });
      items.forEach(function (el) { io.observe(el); });
    });
  }

  /* ==========================================================
     HERO TYPEWRITER
  ========================================================== */
  var tw = document.getElementById("hero-typewriter");
  if (tw && !reduceMotion) {
    var words = ["Computer Science Student", "UI/UX Enthusiast", "Frontend Developer", "Java & Python Developer", "Creative Problem Solver"];
    tw.innerHTML = '<span class="tw-text"></span><span class="caret" aria-hidden="true"></span>';
    var text = tw.firstChild, w = 0, c = 0, deleting = false;
    tw.setAttribute("aria-label", words.join(", "));
    (function tick() {
      var word = words[w];
      c += deleting ? -1 : 1;
      text.textContent = word.slice(0, c);
      var delay = deleting ? 35 : 75;
      if (!deleting && c === word.length) { deleting = true; delay = 1600; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 350; }
      setTimeout(tick, delay);
    })();
  }

  /* ==========================================================
     WORKS: FILTERS
  ========================================================== */
  var filterBtns = document.querySelectorAll(".filter-btn");
  var cards = document.querySelectorAll(".projects-grid .project-card");
  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var f = btn.dataset.filter;
      filterBtns.forEach(function (x) {
        x.classList.toggle("active", x === btn);
        x.setAttribute("aria-pressed", String(x === btn));
      });
      cards.forEach(function (card) {
        card.hidden = !(f === "all" || card.dataset.category === f);
      });
    });
  });

  /* ==========================================================
     PROJECT MODALS + LIGHTBOX
  ========================================================== */
  var lastFocus = null;

  function activeModal() { return document.querySelector(".modal.active"); }

  function openModal(id) {
    var modal = document.getElementById(id);
    if (!modal) return false;
    lastFocus = document.activeElement;
    modal.classList.add("active");
    root.classList.add("modal-open");
    modal.querySelector(".modal-content").scrollTop = 0;
    modal.querySelectorAll(".gallery img").forEach(function (img) {
      if (img.complete && img.naturalWidth) img.classList.add("loaded");
      else img.addEventListener("load", function () { img.classList.add("loaded"); }, { once: true });
    });
    var close = modal.querySelector(".close-button");
    if (close) close.focus({ preventScroll: true });
    if (history.replaceState) history.replaceState(null, "", "#" + id);
    return true;
  }

  function closeModal() {
    var modal = activeModal();
    if (!modal) return;
    modal.classList.remove("active");
    root.classList.remove("modal-open");
    if (history.replaceState) history.replaceState(null, "", location.pathname + location.search);
    if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var opener = e.target.closest("[data-open]");
    if (opener && openModal(opener.dataset.open)) { e.preventDefault(); return; }
    if (e.target.closest("[data-close]")) { closeModal(); return; }
    if (e.target.classList && e.target.classList.contains("modal")) closeModal();
  });

  function openLightbox(src, alt) {
    var box = document.createElement("div");
    box.className = "lightbox";
    box.setAttribute("role", "dialog");
    box.setAttribute("aria-label", "Image preview");
    var img = document.createElement("img");
    img.src = src;
    img.alt = alt || "";
    var x = document.createElement("button");
    x.type = "button";
    x.className = "close-lightbox";
    x.setAttribute("aria-label", "Close image");
    x.innerHTML = "&times;";
    box.appendChild(img);
    box.appendChild(x);
    box.addEventListener("click", function () { box.remove(); });
    document.body.appendChild(box);
    x.focus({ preventScroll: true });
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest(".gallery img");
    if (img) openLightbox(img.currentSrc || img.src, img.alt);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      var box = document.querySelector(".lightbox");
      if (box) { box.remove(); return; }
      if (activeModal()) { closeModal(); return; }
      setMenu(false);
    }
    // keep keyboard focus inside the open modal
    if (e.key === "Tab" && activeModal()) {
      var f = activeModal().querySelectorAll("a[href], button, [tabindex]:not([tabindex='-1'])");
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // deep links such as work.html#khit-modal
  whenReady(function () {
    if (location.hash && document.querySelector(".modal" + location.hash)) openModal(location.hash.slice(1));
  });

  /* ==========================================================
     BUTTON BUBBLE POP
  ========================================================== */
  if (!reduceMotion) {
    document.addEventListener("click", function (e) {
      if (!e.target.closest(".primary-button, .secondary-button, .filter-btn")) return;
      for (var i = 0; i < 7; i++) {
        var p = document.createElement("span");
        var s = rand(8, 20);
        var a = rand(-Math.PI, 0);
        var d = rand(30, 70);
        p.className = "pop-bubble";
        p.style.cssText =
          "left:" + e.clientX + "px;top:" + e.clientY + "px;width:" + s + "px;height:" + s +
          "px;--h:" + HUES[i % HUES.length] + ";--x:" + Math.cos(a) * d + "px;--y:" + Math.sin(a) * d + "px";
        p.addEventListener("animationend", function () { this.remove(); });
        document.body.appendChild(p);
      }
    });
  }
})();
