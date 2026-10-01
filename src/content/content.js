/* Tatar Shield — content script: block page (улаан), banner (шар) + хэрэглэгчийн жагсаалт. */
(function () {
  function norm(h) { return (h || "").replace(/^www\./, "").toLowerCase(); }
  function inList(list, host) {
    host = norm(host);
    for (var i = 0; i < (list || []).length; i++) {
      var e = norm(list[i]);
      if (e && (host === e || host.endsWith("." + e))) return true;
    }
    return false;
  }

  var host, p, href;
  var overlayEl = null, overlayObserver = null, overlayDismissed = false;
  try {
    host = location.hostname; p = location.protocol;
    try { href = location.href; } catch (e) { href = ""; }
    if (!host || p === "chrome:" || p === "edge:" || p === "about:" ||
        p === "moz-extension:" || p === "chrome-extension:") return;
    if (!globalThis.TATAR_IDN) return;
  } catch (e) { return; }

  function proceed(bl, wl) {
    var res;
    if (inList(wl, host)) {
      res = { level: "safe", score: 0, official: true, userWhitelisted: true,
              host: norm(host), unicode: norm(host), reasons: ["user_whitelist"] };
    } else if (inList(bl, host)) {
      res = { level: "high", score: 100, userBlacklisted: true, host: norm(host),
              unicode: norm(host), reasons: ["user_blacklist"], nearestName: null,
              punycode: false, mixed: false };
    } else {
      res = TATAR_IDN.analyzeUrl(href, host);
    }
    try {
      if (browserAPI && browserAPI.runtime && browserAPI.runtime.sendMessage) {
        var m = browserAPI.runtime.sendMessage({ type: "safebrowse_result", result: res });
        if (m && m.catch) m.catch(function () {});
      }
    } catch (e) {}
    if (res.level === "high") blockPage(res);
    else if (res.level === "suspicious") banner(res);
  }

  try {
    if (browserAPI && browserAPI.storage && browserAPI.storage.local) {
      var g = browserAPI.storage.local.get(["tatar_blacklist", "tatar_whitelist"]);
      if (g && g.then) g.then(function (o) { proceed(o.tatar_blacklist || [], o.tatar_whitelist || []); })
        .catch(function () { proceed([], []); });
      else proceed([], []);
    } else proceed([], []);
  } catch (e) { proceed([], []); }

  function el(tag, style, text) {
    var e = document.createElement(tag);
    if (style) e.setAttribute("style", style);
    if (text != null) e.textContent = text;
    return e;
  }

  function blockPage(res) {
    function build() {
      // Хуудас өөрөө ижил id-тай div тавиад анхааруулгыг дарж болохгүй —
      // зөвхөн БИДНИЙ үүсгэсэн node л хамгаалалтыг хангана.
      if (overlayDismissed) return;
      if (overlayEl && overlayEl.isConnected) return;
      try {
        document.documentElement.style.setProperty("overflow", "hidden", "important");
        if (document.body) document.body.style.setProperty("overflow", "hidden", "important");
      } catch (e) {}
      var ov = el("div", "all:initial !important; position:fixed !important; inset:0 !important;" +
        "top:0 !important; left:0 !important; right:0 !important; bottom:0 !important;" +
        "width:100vw !important; height:100vh !important; z-index:2147483647 !important;" +
        "background:#7f1d1d !important; color:#fff !important; margin:0 !important;" +
        "font-family:system-ui,'Segoe UI',Arial,sans-serif !important; display:flex !important;" +
        "visibility:visible !important; opacity:1 !important;" +
        "align-items:center !important; justify-content:center !important;");
      ov.id = "tatar-shield-block";
      ov.setAttribute("role", "dialog");
      ov.setAttribute("aria-modal", "true");
      ov.setAttribute("aria-label", "Tatar Shield — хуурамч сайтын анхааруулга");
      ov.setAttribute("lang", "mn");
      ov.setAttribute("tabindex", "-1");
      var card = el("div", "max-width:520px; margin:20px; padding:28px 26px; text-align:center;");
      card.appendChild(el("div", "font-size:64px; line-height:1;", "⚠️"));
      card.appendChild(el("div", "font-size:24px; font-weight:800; margin:14px 0 6px;", "Зогс! Хуурамч сайт байж болзошгүй"));

      var desc = el("div", "font-size:16px; line-height:1.6; opacity:.95; margin:6px 0 14px;");
      if (res.userBlacklisted) {
        desc.textContent = "Та энэ хаягийг өөрийн блок жагсаалтад нэмсэн байна.";
      } else if (res.nearestName) {
        desc.appendChild(document.createTextNode("Энэ хаяг «"));
        desc.appendChild(el("b", "background:#fff;color:#7f1d1d;padding:1px 6px;border-radius:4px;", res.nearestName));
        desc.appendChild(document.createTextNode("»-ыг дуурайлгасан хуурамч сайт байж магадгүй."));
      } else {
        desc.textContent = "Энэ хаяг дуураймал (хуурамч) сайт байж магадгүй.";
      }
      card.appendChild(desc);

      if (res.punycode || res.mixed) {
        var hid = el("div", "font-size:14px; line-height:1.6; background:rgba(0,0,0,.25);" +
          "border-radius:8px; padding:10px 12px; margin:10px 0; text-align:left;");
        hid.appendChild(document.createTextNode("Хаягт нуугдмал/өөр үсэг оржээ. Танд «"));
        hid.appendChild(el("b", null, res.unicode));
        hid.appendChild(document.createTextNode("» гэж харагдаж байгаа ч жинхэнэ хаяг: "));
        hid.appendChild(el("b", null, res.host));
        card.appendChild(hid);
      }

      if (res.reasons && res.reasons.indexOf("userinfo_spoof") > -1) {
        var ui = el("div", "font-size:14px; line-height:1.6; background:rgba(0,0,0,.25);" +
          "border-radius:8px; padding:10px 12px; margin:10px 0; text-align:left;");
        ui.appendChild(document.createTextNode("Хаягт «@» тэмдэг оржээ. «@»-ийн эхний хэсэг («"));
        ui.appendChild(el("b", null, res.decoy || ""));
        ui.appendChild(document.createTextNode("») нь зүгээр л заль — жинхэнэ хаяг нь «@»-ийн дараах "));
        ui.appendChild(el("b", null, res.host));
        ui.appendChild(document.createTextNode(" юм."));
        card.appendChild(ui);
      }

      card.appendChild(el("div", "font-size:16px; font-weight:700; margin:14px 0 18px;",
        "🚫 Нэвтрэх нэр, нууц үг, OTP код, картын мэдээллээ бүү оруул!"));

      var back = el("button", "all:initial; cursor:pointer; display:inline-block;" +
        "background:#16a34a; color:#fff; font-weight:700; font-size:16px;" +
        "padding:12px 22px; border-radius:10px; font-family:inherit;", "← Аюулгүй хуудас руу буцах");
      back.addEventListener("click", function () {
        if (history.length > 1) history.back(); else location.href = "about:blank";
      });
      card.appendChild(back);

      var proceedDiv = el("div", "margin-top:16px;");
      // <a href>-гүй бол товчлуураар focus авахгүй, Enter дарагдахгүй тул
      // <button> болголоо (харагдах байдал өмнөхтэй адил).
      var go = el("button", "all:initial; cursor:pointer; color:#fecaca; font-size:13px;" +
        "text-decoration:underline; font-family:inherit;", "Эрсдэлийг ойлгосон, үргэлжлүүлэх");
      go.addEventListener("click", function () {
        overlayDismissed = true;
        try { if (overlayObserver) { overlayObserver.disconnect(); overlayObserver = null; } } catch (e) {}
        overlayEl = null;
        ov.remove();
        try { document.documentElement.style.setProperty("overflow", "", ""); if (document.body) document.body.style.overflow = ""; } catch (e) {}
      });
      proceedDiv.appendChild(go);
      card.appendChild(proceedDiv);
      card.appendChild(el("div", "margin-top:22px; font-size:12px; opacity:.7;", "Tatar Shield · Enkhbat.O — Security Analyst"));

      // Focus-ыг хоёр товчны дунд эргэлдүүлж, доорх фишинг хуудас руу
      // гаргахгүй байлгана.
      ov.addEventListener("keydown", function (ev) {
        if (ev.key !== "Tab") return;
        ev.preventDefault();
        var order = [back, go], i = order.indexOf(document.activeElement);
        var n = ev.shiftKey ? (i <= 0 ? order.length - 1 : i - 1) : (i + 1) % order.length;
        try { order[n].focus(); } catch (e) {}
      });

      ov.appendChild(card);
      overlayEl = ov;
      (document.body || document.documentElement).appendChild(ov);
      try { back.focus(); } catch (e) {}

      // Хуудас MutationObserver-оор overlay-г устгавал дахин тавина.
      try {
        if (!overlayObserver && typeof MutationObserver === "function") {
          overlayObserver = new MutationObserver(function () {
            if (overlayDismissed || !overlayEl || overlayEl.isConnected) return;
            try { (document.body || document.documentElement).appendChild(overlayEl); } catch (e) {}
          });
          overlayObserver.observe(document.documentElement, { childList: true, subtree: true });
        }
      } catch (e) {}
    }
    if (document.documentElement) build();
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build);
  }

  function banner(res) {
    function build() {
      if (document.getElementById("tatar-shield-banner")) return;
      var bar = el("div", "all:initial !important; position:fixed !important; bottom:0 !important;" +
        "left:0 !important; right:0 !important; top:auto !important; z-index:2147483646 !important;" +
        "background:#b45309 !important; color:#fff !important; font-family:system-ui,Arial,sans-serif !important;" +
        "font-size:14px !important; line-height:1.4 !important; padding:11px 14px !important;" +
        "box-shadow:0 -2px 10px rgba(0,0,0,.4) !important; display:flex !important;" +
        "align-items:center !important; gap:10px !important;");
      bar.id = "tatar-shield-banner";
      bar.setAttribute("role", "alert");
      bar.setAttribute("lang", "mn");
      var msg = el("span", "flex:1;");
      msg.textContent = "⚠️ Болгоомжтой — энэ сайт сэжигтэй байна. Мэдээллээ оруулахаасаа өмнө хаягаа шалгаарай." +
        (res.nearestName ? (" (" + res.nearestName + "?)") : "");
      var close = el("button", "all:initial; cursor:pointer; color:#fff; font-size:16px; padding:2px 10px;", "✕");
      close.addEventListener("click", function () { bar.remove(); });
      bar.appendChild(msg); bar.appendChild(close);
      (document.body || document.documentElement).appendChild(bar);
    }
    if (document.body) build();
    else document.addEventListener("DOMContentLoaded", build);
  }
})();



