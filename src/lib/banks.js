/*
 * Tatar Shield — Монголын банк, санхүүгийн байгууллагуудын албан ёсны allow-list.
 * Эх сурвалж: Монголбанк (12 лицензтэй банк) + хэрэглэгчийн баталгаажуулсан жагсаалт.
 *
 * protect: true  (анхдагч) — брэнд нэрийг нь дуураймал/homograph илрүүлэлтэд ашиглана.
 * protect: false — зөвхөн ногоон баталгаа (allowlist), look-alike илрүүлэлтэд ОРОХГҮЙ.
 *   (Түгээмэл үгтэй нэрсийг false болгосон — дэлхийн жинхэнэ сайтуудыг андуурахаас сэргийлнэ.)
 *
 * aliases: [...] — брэндийн дуураймал хэлбэрүүд (gov-mn, tdbm-mn гэх мэт).
 *   Зөвхөн skeleton яг тэнцсэн үед ажиллана — Levenshtein хайлтад ОРОХГҮЙ.
 *   (gov, tdbm мэт 3-4 тэмдэгттэй core уртын шүүлтүүрт баригдаж чаддаггүй.)
 *
 * Subdomain бодлого: OFFICIAL/PROTECT-д бүртгэгдсэн домайны subdomain-ууд
 * автоматаар allowlist-д ордог (жишээ: *.gov.mn, *.khanbank.mn гэх мэт).
 * Шалгалтыг idn.js-ийн officialInfo() хийнэ.
 */
(function () {
  var BANKS = [
    // ---- Монголбанкны лицензтэй 12 арилжааны банк (бүрэн хамгаалалттай) ----
    { name: "Хаан Банк", domains: ["khanbank.com", "khanbank.mn"] },
    { name: "Худалдаа Хөгжлийн Банк", domains: ["tdbm.mn", "etdbm.mn"], aliases: ["tdbm-mn"] },
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
    // Тэмдэглэл: gov.mn-г нэмснээр *.gov.mn (mta.gov.mn, ndaatgal.gov.mn гэх мэт)
    // бүгд автоматаар allowlist-д ордог.
    // Иргэн бүр төрийн үйлчилгээгээ авдаг портал — хамгийн өндөр эрсдэлтэй
    // фишингийн бай. Зураасгүй бичиглэл (emongolia) нь зөвхөн бүдэг дүрэмд
    // тусаж, дарагдах шар зураас л гардаг байсныг alias-аар яг таарлаа.
    { name: "E-Mongolia", domains: ["e-mongolia.mn"],
      aliases: ["emongolia", "e-mongolia-mn", "emongolia-mn", "emongoliamn"] },
    { name: "Монгол Улсын Засгийн газар", domains: ["gov.mn"], aliases: ["gov-mn", "govmn"] },
    // Тэмдэглэл: эдгээрийг хасах санал байсан ч хоёулаа ижил БИШ.
    //   mta     — core 3 тэмдэгт тул илрүүлэлтэд орж чаддаггүй (mta.com, mta-mn.com
    //             одоо ч 0/safe). Хасвал зөвхөн mta.mn-ийн ногоон баталгаа л арилна.
    //   ndaatgal — 8 тэмдэгт, ndaatgal.com / ndaatgal.net-ийг ОДООГООР барьж байгаа
    //             цорын гагц хамгаалалт. Хасвал тэд 0/safe болно — хасахгүй.
    // *.gov.mn нь officialInfo()-д аль хэдийн таслагддаг тул mta.gov.mn дээр
    // хуурамч анхааруулга гарах асуудал байгаагүй. test/run.js-д бичигдсэн.
    { name: "Татварын ерөнхий газар", domains: ["mta.mn"] },
    { name: "Нийгмийн даатгал", domains: ["ndaatgal.mn"] },
    // Монголбанк (төв банк) жагсаалтад огт байгаагүй. *.gov.mn-ийн доор биш,
    // өөрийн домэйнтэй тул wildcard-д ч хамрагдахгүй байв.
    { name: "Монголбанк (төв банк)", domains: ["mongolbank.mn"] },

    // ---- Крипто/дижитал хөрөнгийн бирж (allowlist only) ----
    { name: "CoinHub", domains: ["coinhub.mn"], protect: false },
    { name: "Complex", domains: ["complex.mn"], protect: false },
    { name: "Trade.mn", domains: ["trade.mn"], protect: false },
    { name: "CoreX", domains: ["corex.mn"], protect: false },
    { name: "X-Meta", domains: ["x-meta.com"], protect: false },

    // ---- Банк бус санхүүгийн байгууллага / Финтек (allowlist only) ----
    { name: "LendMN", domains: ["lend.mn"], protect: false },
    { name: "Storepay", domains: ["storepay.mn"], protect: false },
    { name: "Ard Credit", domains: ["ardcredit.com"], protect: false },
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
    "үндэснийхөрөнгөоруулалтынбанк": "Үндэсний Хөрөнгө Оруулалтын Банк (NIBank)",
    // Төрийн байгууллагууд. Зөвхөн БҮРЭН, онцлог нэрийг бүртгэнэ: "засаг",
    // "татвар", "даатгал" гэсэн ЕРДИЙН үгсийг бүртгэвэл засаг.mn, татвар.mn,
    // даатгал.mn, монголдаатгал.mn зэрэг жинхэнэ хаяг дээр хуурамч
    // анхааруулга гарна (эдгээрийг test/run.js-ийн MUST_BE_SAFE хамгаалдаг).
    "засгийнгазар": "Монгол Улсын Засгийн газар",
    "татварынгазар": "Татварын ерөнхий газар",
    "татварынерөнхийгазар": "Татварын ерөнхий газар",
    "нийгмийндаатгал": "Нийгмийн даатгал",
    "нийгмийндаатгалынгазар": "Нийгмийн даатгал",
    // E-Mongolia-гийн кирилл бичиглэл. Латин нэр нь аль хэдийн хамгаалагдсан
    // ч кирилл хувилбар нь бүрэн дуугүй өнгөрдөг байв.
    "емонголиа": "E-Mongolia",
    "имонголиа": "E-Mongolia",
    // Төв банк.
    "монголбанк": "Монголбанк (төв банк)",
    // Бусад төрийн байгууллага. Жинхэнэ домэйн нь *.gov.mn доор аль хэдийн
    // allowlist-д ордог (customs.gov.mn, burtgel.gov.mn); энд бүртгэж байгаа
    // нь тэдгээрийн НЭРИЙГ өөр домэйн дээр ашигласан дуураймал юм.
    "гаалийнерөнхийгазар": "Гаалийн ерөнхий газар",
    "улсынбүртгэл": "Улсын бүртгэлийн ерөнхий газар",
    "улсынбүртгэлийнерөнхийгазар": "Улсын бүртгэлийн ерөнхий газар",
    "эрүүлмэндийндаатгал": "Эрүүл мэндийн даатгал"
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

  var api = {
    BANKS: BANKS,
    OFFICIAL: OFFICIAL,
    PROTECT: PROTECT,
    CYRILLIC: CYRILLIC
  };
  if (typeof globalThis !== "undefined") globalThis.TATAR_BANKS = api;
  else if (typeof self !== "undefined") self.TATAR_BANKS = api;
  else if (typeof window !== "undefined") window.TATAR_BANKS = api;
})();

