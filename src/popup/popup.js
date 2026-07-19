/* Tatar Shield — popup: илрүүлэлт + хэрэглэгчийн blacklist/whitelist. */
(function () {
  var $ = function (s) { return document.querySelector(s); };
  var REASONS = {
    mixed_script: "Хаягт кирилл, латин үсэг холилдсон",
    punycode: "Хаягт нуугдмал үсэг (punycode) оржээ",
    non_ascii: "Хаягт латин бус үсэг оржээ",
    skeleton_match: "Албан ёсны нэрийг яг хуулбарласан",
    lookalike: "Албан ёсны нэртэй ижил харагдана",
    typosquat: "Үсэг сольсон хуурамч хаяг",
    combosquat: "Банкны нэрийг агуулсан хуурамч хаяг",
    brand_in_subdomain: "Банкны нэрийг хаягийн дунд нуусан",
    brand_diff_domain: "Албан ёсны нэртэй ижил боловч өөр хаяг",
    cyrillic_brand: "Кирилл үсгээр банкны нэрийг бичсэн хуурамч хаяг",
    user_blacklist: "Та энэ хаягийг блоклосон",
    user_whitelist: "Та энэ хаягийг найдвартай гэж тэмдэглэсэн"
  };

  var CUR = null; // одоогийн host

  function norm(h) { return (h || "").replace(/^www\./, "").toLowerCase(); }
  function inList(list, host) {
    host = norm(host);
    for (var i = 0; i < (list || []).length; i++) {
      var e = norm(list[i]);
      if (e && (host === e || host.endsWith("." + e))) return true;
    }
    return false;
  }
  function getLists() {
    try {
      var g = browserAPI.storage.local.get(["tatar_blacklist", "tatar_whitelist"]);
      return (g && g.then) ? g.then(function (o) { return { bl: o.tatar_blacklist || [], wl: o.tatar_whitelist || [] }; })
        : Promise.resolve({ bl: [], wl: [] });
    } catch (e) { return Promise.resolve({ bl: [], wl: [] }); }
  }
  function setLists(bl, wl) {
    try { return browserAPI.storage.local.set({ tatar_blacklist: bl, tatar_whitelist: wl }); }
    catch (e) { return Promise.resolve(); }
  }
  function without(list, host) { host = norm(host); return (list || []).filter(function (e) { return norm(e) !== host; }); }

  load();

  function load() {
    $("#sbCard").innerHTML = "…";
    browserAPI.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
      var url = tabs[0] && tabs[0].url, host = null;
      try { host = new URL(url).hostname; } catch (e) {}
      CUR = host;
      getLists().then(function (L) {
        askStored(function (stored) {
          var res = decide(host, L.bl, L.wl, stored);
          render(res);
          renderActions(host, res, L.bl, L.wl);
        });
      });
    }).catch(function () { render(null); });
  }

  function askStored(cb) {
    var done = false;
    var p = browserAPI.runtime.sendMessage({ type: "get_safebrowse" });
    if (p && p.then) p.then(function (r) { done = true; cb(r); }).catch(function () { cb(null); });
    setTimeout(function () { if (!done) cb(null); }, 300);
  }

  function decide(host, bl, wl, stored) {
    if (!host) return null;
    if (inList(wl, host)) return { level: "safe", official: true, userWhitelisted: true, host: norm(host), unicode: norm(host), reasons: ["user_whitelist"] };
    if (inList(bl, host)) return { level: "high", score: 100, userBlacklisted: true, host: norm(host), unicode: norm(host), reasons: ["user_blacklist"] };
    if (stored && norm(stored.host) === norm(host)) return stored;
    try { return TATAR_IDN.analyzeHost(host); } catch (e) { return null; }
  }

  function render(res) {
    var card = $("#sbCard"); card.innerHTML = "";
    if (!res) { card.appendChild(div("note", "Энэ табад мэдээлэл алга. Аль нэг вэб хуудас нээгээрэй.")); return; }

    if (res.userWhitelisted) {
      card.appendChild(big("✅", "#16a34a", "Найдвартай (таны тэмдэглэсэн)"));
      card.appendChild(div("host", res.host));
      card.appendChild(div("okbox", "Та энэ хаягийг найдвартай гэж тэмдэглэсэн байна."));
      return;
    }
    if (res.userBlacklisted) {
      card.appendChild(big("⛔", "#dc2626", "Блоклосон (таны жагсаалт)"));
      card.appendChild(div("host", res.host));
      card.appendChild(div("alert", "🚫 Та энэ хаягийг блок жагсаалтад нэмсэн."));
      return;
    }
    if (res.official) {
      card.appendChild(big("✅", "#16a34a", "Албан ёсны сайт"));
      card.appendChild(div("host", res.host));
      card.appendChild(div("okbox", "Энэ бол " + (res.bankName || "") + " —ны албан ёсны сайт мөн. Итгэлтэйгээр нэвтэрч болно."));
      return;
    }
    if (res.level === "high") card.appendChild(big("⛔", "#dc2626", "Аюултай — хуурамч сайт"));
    else if (res.level === "suspicious") card.appendChild(big("⚠️", "#f59e0b", "Сэжигтэй сайт"));
    else {
      card.appendChild(big("🔎", "#8aa0bd", "Шалгагдлаа"));
      card.appendChild(div("host", res.host));
      card.appendChild(div("note", "Энэ сайт танигдсан банк/банк бус/төрийн байгууллагуудын жагсаалтад алга. Баталгаатай ердийн сайт бол асуудалгүй. Банкны мэдээлэл, хувийн мэдээлэл оруулах бол хаягаа сайн шалгаарай."));
      return;
    }
    card.appendChild(div("host", res.host));
    if ((res.punycode || res.mixed) && res.unicode) {
      var rv = div("reveal", "");
      rv.appendChild(document.createTextNode("Танд «")); rv.appendChild(bold(res.unicode));
      rv.appendChild(document.createTextNode("» гэж харагдаж байгаа ч жинхэнэ хаяг: ")); rv.appendChild(bold(res.host));
      card.appendChild(rv);
    }
    if (res.reasons && res.reasons.length) {
      var ul = document.createElement("ul"); ul.className = "reasons";
      res.reasons.forEach(function (r) {
        var li = document.createElement("li");
        li.appendChild(document.createTextNode("✗ " + (REASONS[r.split(":")[0]] || r)));
        ul.appendChild(li);
      });
      card.appendChild(ul);
    }
    if (res.nearestName) card.appendChild(div("note", "Дуурайлгаж буй: " + res.nearestName));
    card.appendChild(div("alert", "🚫 Нэвтрэх нэр, нууц үг, OTP код, картын мэдээллээ бүү оруул!"));
  }

  function renderActions(host, res, bl, wl) {
    if (!host || !res) return;
    var isOfficialReal = res.official && !res.userWhitelisted; // жинхэнэ allow-list
    var wrap = $("#sbActions"); wrap.innerHTML = "";

    if (isOfficialReal) {
      wrap.appendChild(small("Албан ёсны домэйн — тохиргоо шаардлагагүй."));
    } else if (res.userWhitelisted) {
      wrap.appendChild(btn("↩ Найдвартай тэмдэглэгээг болих", "ghost", function () {
        setLists(bl, without(wl, host)).then(reloadTabAndPopup);
      }));
    } else if (res.userBlacklisted) {
      wrap.appendChild(btn("↩ Блоклохоо болих", "ghost", function () {
        setLists(without(bl, host), wl).then(reloadTabAndPopup);
      }));
    } else {
      wrap.appendChild(btn("🚫 Энэ сайтыг блоклох", "danger", function () {
        setLists((bl || []).concat([norm(host)]), without(wl, host)).then(reloadTabAndPopup);
      }));
      wrap.appendChild(btn("✓ Найдвартай гэж тэмдэглэх", "ok", function () {
        setLists(without(bl, host), (wl || []).concat([norm(host)])).then(reloadTabAndPopup);
      }));
    }
    var cnt = small("Миний жагсаалт: блок " + (bl || []).length + " · найдвартай " + (wl || []).length);
    cnt.style.marginTop = "8px";
    wrap.appendChild(cnt);
  }

  function reloadTabAndPopup() {
    try {
      browserAPI.tabs.query({ active: true, currentWindow: true }).then(function (tabs) {
        if (tabs[0] && tabs[0].id != null) { try { browserAPI.tabs.reload(tabs[0].id); } catch (e) {} }
      });
    } catch (e) {}
    load();
  }

  function big(emoji, color, headline) {
    var b = document.createElement("div"); b.className = "big";
    var e = document.createElement("div"); e.className = "emoji"; e.textContent = emoji;
    var h = document.createElement("div"); h.className = "headline"; h.style.color = color; h.textContent = headline;
    b.appendChild(e); b.appendChild(h); return b;
  }
  function div(cls, text) { var d = document.createElement("div"); d.className = cls; d.textContent = text; return d; }
  function small(text) { var d = document.createElement("div"); d.className = "note"; d.style.fontSize = "11px"; d.textContent = text; return d; }
  function bold(text) { var b = document.createElement("b"); b.textContent = text; return b; }
  function btn(label, kind, onclick) {
    var b = document.createElement("button"); b.className = "act " + kind; b.textContent = label;
    b.addEventListener("click", onclick); return b;
  }
})();
