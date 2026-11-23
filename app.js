(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var selected = null;
  var STEPS = { s1: 1, s2: 2, s3: 3, s4: 4, s5: 5 };
  var GATED = { s2: 1, s3: 1, s4: 1 };
  var SCREENS = ["home", "s1", "s2", "s3", "s4", "s5", "faq"];

  function fa(n) { return String(n).replace(/\d/g, function (d) { return "۰۱۲۳۴۵۶۷۸۹"[d]; }); }
  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function safeUrl(u) { return /^https:\/\/[a-z0-9.\-]+\//i.test(u) ? u : "#"; }

  function toast(msg) {
    var t = $("toast"); t.textContent = msg; t.className = "show";
    clearTimeout(toast._t); toast._t = setTimeout(function () { t.className = ""; }, 2600);
  }

  function pkgLabel(p) { return p.coins ? p.title + " (" + fa(p.coins) + " سکه)" : p.title; }
  function money(n) { return fa(String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ",")); }
  function priceOf(p) { return p.price ? money(p.price) + " تومان" : "از ادمین بپرسید"; }
  function perCoin(p) { return (p.coins && p.price) ? p.price / p.coins : 0; }
  var BASE = (function () {
    for (var i = 0; i < CONFIG.packages.length; i++) { var q = CONFIG.packages[i]; if (q.coins && q.price) return q.price / q.coins; }
    return 0;
  })();
  function savePct(p) {
    var pc = perCoin(p);
    return (BASE && pc && pc < BASE) ? Math.round((1 - pc / BASE) * 100) : 0;
  }

  function buildMessage() {
    var name = $("userName").value.replace(/[\r\n]+/g, " ").trim().slice(0, 40);
    var m = "سلام 👋\nمی‌خواهم این بسته را از بازی تیزبین بخرم:\n";
    m += selected ? "📦 " + pkgLabel(selected) : "📦 (بسته را بعداً می‌گویم)";
    if (selected && selected.price) m += "\n💰 مبلغ: " + priceOf(selected);
    if (name) m += "\n👤 نام: " + name;
    return m;
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    return new Promise(function (res, rej) {
      try {
        var a = document.createElement("textarea");
        a.value = text; a.style.position = "fixed"; a.style.opacity = "0";
        document.body.appendChild(a); a.select();
        var ok = document.execCommand("copy"); document.body.removeChild(a);
        ok ? res() : rej();
      } catch (e) { rej(e); }
    });
  }

  function fillSummary() {
    if (!selected) return;
    $("sumPkg").textContent = selected.title;
    $("sumCoins").textContent = selected.coins ? fa(selected.coins) + " سکه" : "باز شدن حالت دو نفره";
    $("sumPrice").textContent = priceOf(selected);
    $("sumPer").textContent = perCoin(selected) ? fa(Math.round(perCoin(selected))) + " تومان" : "—";
    $("msgPrev").textContent = buildMessage();
    $("pick").textContent = "سفارش شما: " + pkgLabel(selected);
  }

  function show(id) {
    if (SCREENS.indexOf(id) < 0) id = "home";
    if (GATED[id] && !selected) { toast("اول یک بسته انتخاب کنید"); id = "s1"; }
    SCREENS.forEach(function (s) { $(s).hidden = (s !== id); });
    var n = STEPS[id];
    $("progress").hidden = !n;
    if (n) {
      $("pfill").style.width = (n * 20) + "%";
      $("ptext").textContent = "مرحله " + fa(n) + " از " + fa(5);
    }
    if (id === "s2" || id === "s3") fillSummary();
    window.scrollTo(0, 0);
  }

  function go(id) {
    if (location.hash === "#" + id) show(id);
    else location.hash = id;
  }

  function renderPackages() {
    var g = $("pkgGrid");
    CONFIG.packages.forEach(function (p) {
      var b = el("button", "pkg" + (p.wide ? " wide" : ""));
      b.type = "button";
      b.appendChild(el("div", "ic", p.icon));
      b.appendChild(el("div", "t", p.title));
      if (p.badge) b.appendChild(el("div", "badge", p.badge));
      if (p.coins) b.appendChild(el("div", "c", fa(p.coins) + " سکه"));
      if (p.desc) b.appendChild(el("div", "d", p.desc));
      b.appendChild(el("div", "p", p.price ? money(p.price) + " تومان" : "قیمت: از ادمین بپرسید"));
      if (perCoin(p)) b.appendChild(el("div", "per", "هر سکه " + fa(Math.round(perCoin(p))) + " تومان"));
      if (savePct(p)) b.appendChild(el("div", "save", fa(savePct(p)) + "٪ ارزان‌تر"));
      b.addEventListener("click", function () {
        selected = p;
        Array.prototype.forEach.call(g.children, function (c) { c.classList.remove("sel"); });
        b.classList.add("sel");
        $("n1").disabled = false;
        $("selTxt").textContent = pkgLabel(p);
        $("selPrice").textContent = priceOf(p);
        try { if (navigator.vibrate) navigator.vibrate(30); } catch (e) {}
      });
      g.appendChild(b);
    });
  }

  function renderContacts() {
    var box = $("contactList");
    CONFIG.contacts.forEach(function (c) {
      var a = el("a", "ct " + c.key);
      a.href = safeUrl(c.url); a.target = "_blank"; a.rel = "noopener noreferrer";
      a.appendChild(el("span", "n", c.icon));
      var s = el("span", "", c.name);
      s.appendChild(el("small", "", c.id));
      a.appendChild(s);
      a.addEventListener("click", function () {
        var msg = buildMessage();
        copyText(msg).then(function () { toast("متن سفارش کپی شد؛ در چت Paste کنید"); }, function () {});
        if (c.telegramText) a.href = safeUrl(c.url) + "?text=" + encodeURIComponent(msg);
      });
      box.appendChild(a);
    });
  }

  function renderFaq() {
    var box = $("faqList");
    CONFIG.faq.forEach(function (f) {
      box.appendChild(el("p", "faq-q", f.q));
      box.appendChild(el("p", "faq-a", f.a));
    });
  }

  function initMenu() {
    var btn = $("menuBtn"), menu = $("menu");
    function close() { menu.hidden = true; btn.setAttribute("aria-expanded", "false"); }
    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute("aria-expanded", String(open));
    });
    menu.addEventListener("click", close);
    document.addEventListener("click", close);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
  }

  $("gameName").textContent = CONFIG.gameName;
  $("tagline").textContent = CONFIG.tagline;
  $("footName").textContent = CONFIG.gameName;
  try { $("userName").value = (localStorage.getItem("shopUserName") || "").slice(0, 40); } catch (e) {}
  $("userName").addEventListener("input", function () {
    try { localStorage.setItem("shopUserName", this.value.slice(0, 40)); } catch (e) {}
  });

  $("n1").addEventListener("click", function () { go("s2"); });
  $("copyBtn").addEventListener("click", function () {
    copyText(buildMessage()).then(function () { toast("متن سفارش کپی شد ✅"); }, function () { toast("کپی نشد؛ متن را دستی انتخاب کنید"); });
  });
  $("userName").addEventListener("input", function () { if (selected) $("msgPrev").textContent = buildMessage(); });
  Array.prototype.forEach.call(document.querySelectorAll("[data-go]"), function (b) {
    b.addEventListener("click", function () { go(b.getAttribute("data-go")); });
  });
  window.addEventListener("hashchange", function () { show(location.hash.slice(1) || "home"); });

  renderPackages(); renderContacts(); renderFaq(); initMenu();
  show(location.hash.slice(1) || "home");
})();
