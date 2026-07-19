/*
 * Tatar Shield — Монголын банк, санхүүгийн байгууллагуудын албан ёсны allow-list.
 * Эх сурвалж: Монголбанк (12 лицензтэй банк) + хэрэглэгчийн баталгаажуулсан жагсаалт.
 *
 * protect: true  (анхдагч) — брэнд нэрийг нь дуураймал/homograph илрүүлэлтэд ашиглана.
 * protect: false — зөвхөн ногоон баталгаа (allowlist), look-alike илрүүлэлтэд ОРОХГҮЙ.
 *   (Түгээмэл үгтэй нэрсийг false болгосон — дэлхийн жинхэнэ сайтуудыг андуурахаас сэргийлнэ.)
 */
(function () {
  var BANKS = [
    // ---- Монголбанкны лицензтэй 12 арилжааны банк (бүрэн хамгаалалттай) ----
    { name: "Хаан Банк", domains: ["khanbank.com", "khanbank.mn"] },
    { name: "Худалдаа Хөгжлийн Банк", domains: ["tdbm.mn", "etdbm.mn"] },
    { name: "Голомт Банк", domains: ["golomtbank.com", "golomtbank.mn", "egolomt.mn"] },
    { name: "Хас Банк (XacBank)", domains: ["xacbank.mn", "xacbank.com"] },
    { name: "Төрийн Банк", domains: ["statebank.mn", "ibank.mn"] },
    { name: "Тээвэр Хөгжлийн Банк", domains: ["transbank.mn", "etransbank.mn"] },
    { name: "Ариг Банк", domains: ["arigbank.mn"] },
    { name: "Чингис Хаан Банк", domains: ["ckbank.mn"] },
    { name: "Капитрон Банк", domains: ["capitronbank.mn"] },
    { name: "Үндэсний Хөрөнгө Оруулалтын Банк (NIBank)", domains: ["nibank.mn", "e-nibank.mn"] },
    { name: "Богд Банк", domains: ["bogdbank.com", "ebogdbank.com"] },
    { name: "М Банк (M Bank)", domains: ["mbank.mn"] },

    // ---- Гол төрийн үйлчилгээ ----
    { name: "E-Mongolia", domains: ["e-mongolia.mn"] },
    { name: "Монгол Улсын Засгийн газар", domains: ["gov.mn"] },
    { name: "Татварын ерөнхий газар", domains: ["mta.mn"] },

    // ---- Крипто/дижитал хөрөнгийн бирж (allowlist only) ----
    { name: "CoinHub", domains: ["coinhub.mn"], protect: false },
    { name: "Complex", domains: ["complex.mn"], protect: false },
    { name: "Trade.mn", domains: ["trade.mn"], protect: false },
    { name: "CoreX", domains: ["corex.mn"], protect: false },
    { name: "X-Meta", domains: ["x-meta.com"] },

    // ---- Банк бус санхүүгийн байгууллага / Финтек (allowlist only) ----
    { name: "LendMN", domains: ["lend.mn"], protect: false },
    { name: "Storepay", domains: ["storepay.mn"] },
    { name: "Ard Credit", domains: ["ardcredit.com"] },
    { name: "Pocket", domains: ["pocket.mn"], protect: false },
    { name: "Most Money", domains: ["most.mn"], protect: false },
    { name: "Toki", domains: ["toki.mn"], protect: false },
    { name: "SendMN", domains: ["send.mn"], protect: false },
    { name: "Moni", domains: ["moni.mn"], protect: false },
    { name: "Simple", domains: ["simple.mn"], protect: false },
    { name: "Netcapital", domains: ["netcapital.mn"], protect: false }
  ];

  // Кирилл үсгээр бичсэн банкны нэрс (зөвхөн банк — homograph илрүүлэлтэд)
  var CYRILLIC = {
    "ханбанк": "Хаан Банк", "хаанбанк": "Хаан Банк",
    "голомтбанк": "Голомт Банк", "голомт": "Голомт Банк",
    "хасбанк": "Хас Банк (XacBank)",
    "төрийнбанк": "Төрийн Банк",
    "тээвэрбанк": "Тээвэр Хөгжлийн Банк", "тээврийнбанк": "Тээвэр Хөгжлийн Банк",
    "аригбанк": "Ариг Банк",
    "чингисхаанбанк": "Чингис Хаан Банк", "чингисхаан": "Чингис Хаан Банк",
    "капитронбанк": "Капитрон Банк", "капитрон": "Капитрон Банк",
    "богдбанк": "Богд Банк",
    "мбанк": "М Банк (M Bank)",
    "худалдаахөгжлийнбанк": "Худалдаа Хөгжлийн Банк",
    "үндэснийхөрөнгөоруулалтынбанк": "Үндэсний Хөрөнгө Оруулалтын Банк (NIBank)"
  };

  var OFFICIAL = new Set();   // бүх домэйн — ногоон баталгаа
  var PROTECT = new Set();    // зөвхөн protect!==false — look-alike илрүүлэлт
  BANKS.forEach(function (b) {
    b.domains.forEach(function (d) {
      d = d.toLowerCase();
      OFFICIAL.add(d);
      if (b.protect !== false) PROTECT.add(d);
    });
  });

  var api = { BANKS: BANKS, OFFICIAL: OFFICIAL, PROTECT: PROTECT, CYRILLIC: CYRILLIC };
  if (typeof globalThis !== "undefined") globalThis.TATAR_BANKS = api;
  else if (typeof self !== "undefined") self.TATAR_BANKS = api;
  else if (typeof window !== "undefined") window.TATAR_BANKS = api;
})();
