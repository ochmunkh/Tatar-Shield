/*
 * Tatar Shield — илрүүлэлтийн регрессийн тест.
 *
 * Гадны хамаарал ШААРДАХГҮЙ — node-ийн өөрийн test runner-ыг ашиглана:
 *   node --test          (эсвэл)   npm test          (эсвэл)   node test/run.js
 *
 * banks.js / idn.js нь браузерын global болж ачаалладаг IIFE тул require-ээр
 * шууд уншиж байна — өргөтгөл хөтөч дээр ачаалах логикт өөрчлөлт хийсэнгүй.
 *
 * Хамгийн ГОЛ хүснэгт нь MUST_BE_SAFE: жинхэнэ банк/төрийн сайт, Монгол
 * кирилл домэйн, дэлхийн ердийн сайт дээр анхааруулга ГАРАХГҮЙ байх ёстой.
 * Жинхэнэ банк дээр гарсан хуурамч анхааруулга нь хэрэглэгчийг өргөтгөлөө
 * бүрмөсөн үл тоомсорлоход хүргэдэг тул хамгийн хортой алдаа юм.
 */
"use strict";

var test = require("node:test");
var assert = require("node:assert");

require("../src/lib/banks.js");
require("../src/lib/idn.js");

var IDN = globalThis.TATAR_IDN;
var BANKS = globalThis.TATAR_BANKS;

function fmt(h) {
  var r = IDN.analyzeHost(h);
  return h + " -> " + r.level + "/" + r.score + " [" + (r.reasons || []).join(",") + "]";
}

// ---------------------------------------------------------------------------
// 1. Нийлүүлэгдсэн 20 кейс — test/cases.js-ээс ХУВААЛЦАН уншина. logic-test.html
//    ч ЯГ тэр файлыг ачаалдаг тул хоёр тест зөрөх боломжгүй (хуулбар байхгүй).
//    Хаягууд нь ЯГ Unicode хэлбэрээр: new URL(...)-аар punycode болгож хөрвүүлж
//    БОЛОХГҮЙ — мэдээ.мн нь өөр хост болж, ｋｈａｎｂａｎｋ.mn нь NFKC-ээр
//    khanbank.mn болж (allowlist!) хувирдаг.
// ---------------------------------------------------------------------------
require("./cases.js");
var SHIPPED = globalThis.TATAR_CASES;

test("нийлүүлэгдсэн кейсүүд — test/cases.js (Unicode хэлбэр)", function () {
  assert.strictEqual(SHIPPED.length, 20, "cases.js-ийн кейсийн тоо хэт бага: " + SHIPPED.length);
  SHIPPED.forEach(function (c) {
    var r = IDN.analyzeHost(c.h);
    assert.strictEqual(r.level, c.exp, fmt(c.h) + " — хүлээсэн " + c.exp);
    if (c.official !== undefined) {
      assert.strictEqual(!!r.official, c.official, c.h + " — official=" + c.official + " байх ёстой");
    }
  });
});


// ---------------------------------------------------------------------------
// N. Палочка (ӏ, U+04CF) — БАЙРЛАЛЫН дүрмийн ирмэгийн тохиолдлууд.
//
//    Хойд Кавказын хэлүүд (чечен, ингуш, авар, дарги) палочкаг ЗӨВХӨН хос
//    үсгийн (digraph) ХОЁРДУГААР элемент болгон хэрэглэдэг: гӏ кӏ пӏ тӏ хӏ цӏ чӏ.
//    Homograph довтолгоонд харин латин "l"/"I"-ийн дүр болж, digraph БИШ
//    байрлалд гарна (аррӏе -> apple). Тиймээс шүүлт нь үсгийн хүснэгт биш,
//    БАЙРЛАЛ дээр тулгуурладаг — idn.js: PALOCHKA_AFTER.
//
//    Дараах бүх мөр хос хэлбэртэй: Unicode бичиглэл ба хөтчийн буцаадаг
//    punycode. Хөтөч location.hostname-аар ЗӨВХӨН punycode өгдөг тул
//    шалгалтыг punycode дээр хийнэ; Unicode талыг нь баримт болгон бичив.
// ---------------------------------------------------------------------------
var PALOCHKA_CASES = [
  // --- ердийн бичиг: digraph байрлал, палочкад зөвшөөрөгдсөн TLD (.ru) ---
  { u: "хӏара.ru",   h: "xn--80aa1cs40e.ru",   exp: "safe", why: "х + ӏ digraph — чеченээр «энэ»" },
  { u: "кӏант.ru",   h: "xn--80atku61e.ru",    exp: "safe", why: "к + ӏ digraph — чеченээр «хүү»" },
  { u: "гӏала.ru",   h: "xn--80aah7a43d.ru",   exp: "safe", why: "г + ӏ digraph" },
  { u: "пӏелг.ru",   h: "xn--c1adso43e.ru",    exp: "safe", why: "п + ӏ digraph" },
  { u: "тӏай.ru",    h: "xn--80asz87c.ru",     exp: "safe", why: "т + ӏ digraph" },
  { u: "цӏе.ru",     h: "xn--e1a7a83a.ru",     exp: "safe", why: "ц + ӏ digraph" },
  { u: "чӏара.ru",   h: "xn--80aa1c0a49d.ru",  exp: "safe", why: "ч + ӏ digraph" },
  { u: "хӏ.ru",      h: "xn--u1a0z.ru",        exp: "safe", why: "label-ийн ТӨГСГӨЛД, гэхдээ digraph гийгүүлэгчийн дараа" },

  // --- заль: палочка digraph БИШ байрлалд ---
  { u: "ӏара.ru",    h: "xn--80aa1c40b.ru",    exp: "high", why: "байрлал 0 — палочка үг эхэлдэггүй" },
  { u: "хаӏ.ru",     h: "xn--80a5bz0a.ru",     exp: "high", why: "төгсгөлд, digraph БИШ гийгүүлэгчийн (а) дараа" },
  { u: "хӏӏара.ru",  h: "xn--80aa1cs40ea.ru",  exp: "high", why: "дараалсан хоёр палочка — ӏӏ гэсэн digraph байхгүй" },
  { u: "аррӏе.ru",   h: "xn--80ak6aa92e.ru",   exp: "high", why: "р-ийн дараа — латин l-ийн дүр (аррӏе -> apple)" },
  { u: "ӏ.ru",       h: "xn--s5a.ru",          exp: "high", why: "дан палочка" },

  // --- палочка хэрэглэдэггүй TLD: чөлөөлөлт хамаарахгүй ---
  { u: "хӏара.mn",   h: "xn--80aa1cs40e.mn",   exp: "high", why: ".mn дээр палочка хэрэглэдэггүй — монгол үгэнд байхгүй үсэг" }
];

test("палочка — байрлалын дүрмийн ирмэгийн тохиолдлууд", function () {
  PALOCHKA_CASES.forEach(function (c) {
    var r = IDN.analyzeHost(c.h);
    assert.strictEqual(r.level, c.exp,
      "палочка: " + c.u + " (" + c.h + ") — хүлээсэн " + c.exp + ", гарсан " +
      r.level + "/" + r.score + " [" + (r.reasons || []).join(",") + "] — " + c.why);
  });
});

test("палочка — Unicode ба punycode хосууд зөв", function () {
  PALOCHKA_CASES.forEach(function (c) {
    assert.strictEqual(new URL("http://" + c.u).hostname, c.h,
      c.u + " нь " + c.h + " болж хөрвөх ёстой");
  });
});

test("палочка — том/жижиг үсгийн боловсруулалт", function () {
  // 1. Код нь U+04C0 (Ӏ) -> U+04CF (ӏ) гэсэн JS-ийн жижигрүүлэлт дээр
  //    тулгуурладаг (hasForeignCyrillic доторх label.toLowerCase()).
  assert.strictEqual("Ӏ".toLowerCase(), "ӏ",
    "U+04C0 нь U+04CF болж жижигрэх ёстой — байрлалын шүүлт үүн дээр тогтдог");

  // 2. ТОМ үсгийн палочка хаяг дотор ОГТ ирэхгүй: IDNA/UTS-46 боловсруулалт
  //    U+04C0-г зөвшөөрдөггүй тул URL задлагч бүхэлд нь няцаана. Өөрөөр хэлбэл
  //    "том үсгийн палочкаар далдлах" гэсэн зам хөтчийн түвшинд аль хэдийн хаалттай.
  assert.throws(function () { return new URL("http://хӀара.ru"); },
    "U+04C0-той хост нь хүчингүй URL байх ёстой");

  // 3. ASCII том/жижиг үсэг холилдсон Unicode бичиглэл нь ижил punycode болно.
  assert.strictEqual(new URL("http://ХӏаРа.ru").hostname,
    "xn--80aa1cs40e.ru", "холимог бичиглэл ижил punycode болох ёстой");

  // 4. analyzeHost() нь punycode хэлбэрийг том/жижиг үсгээс үл хамааран ижил
  //    дүгнэнэ (дотроо host.toLowerCase() хийдэг). Өргөтгөл нь ихэвчлэн
  //    location.hostname-аас жижиг үсэгтэй авдаг ч popup нь хэрэглэгчийн
  //    бичсэн URL-ыг ч дамжуулж болно.
  [["xn--80aa1cs40e.ru", "XN--80AA1CS40E.RU", "safe"],
   ["xn--80ak6aa92e.ru", "XN--80AK6AA92E.RU", "high"]].forEach(function (t) {
    var lo = IDN.analyzeHost(t[0]), up = IDN.analyzeHost(t[1]);
    assert.strictEqual(lo.level, t[2], t[0] + " — хүлээсэн " + t[2]);
    assert.strictEqual(up.level, lo.level, t[1] + " нь жижиг үсгийнхтэй ижил байх ёстой");
    assert.strictEqual(up.score, lo.score, t[1] + " — оноо нь ч ижил байх ёстой");
  });
});

// ---------------------------------------------------------------------------
// 2. MUST_BE_SAFE — ямар ч анхааруулга ГАРАХГҮЙ (level === "safe").
// ---------------------------------------------------------------------------
var MUST_BE_SAFE = [
  // Түгээмэл үгтэй core-той ЖИНХЭНЭ гадны банк/компани.
  // (mBank S.A. — Польш, Transbank — Чили, State Bank — АНУ.)
  "mbank.pl", "mbank.cz", "mbank.sk", "transbank.cl", "statebank.com",
  "ibank.co.uk", "storepay.com", "x-meta.net", "ardcredit.net",
  // Хоёр түвшний суффикстэй жинхэнэ хаяг (com.pl, co.in, com.br ...) — эдгээрийн
  // core нь 3 дахь label тул "subdomain-д нуусан брэнд" гэж тооцогдож болохгүй.
  "statebank.co.uk", "mbank.com.pl", "mbank.net.pl", "statebank.co.in",
  "ibank.com.tr", "transbank.com.br", "tdbank.com.au",
  "google.co.jp", "amazon.co.uk",
  // Хойд Кавказын хэлээр бичсэн ЖИНХЭНЭ .ru хаягууд. Палочка (ӏ) нь эдгээрт
  // digraph-ийн хоёрдугаар элемент (хӏ, кӏ) — ердийн бичиг. Бүх үсэг нь латинтай
  // андуурагдах тул skeleton нь ASCII болж, latin_disguise хуурамч дуудагддаг байв.
  //   хӏара — "энэ" (чечен) · кӏант — "хүү" (чечен) · хӏусам — "гэр" (чечен)
  //   (punycode — хөтөч location.hostname-ээр ЗӨВХӨН ийм хэлбэрээр өгдөг)
  "xn--80aa1cs40e.ru", "xn--80atku61e.ru", "xn--80aynhj24f.ru",
  "xn--80aah7a43d.ru", "xn--80asz87c.ru",
  // Кирилл ЕРДИЙН үгс — төрийн байгууллагын брэнд гэж бүртгэвэл эдгээр унана.
  // (banks.js-ийн CYRILLIC хүснэгтийн тайлбарыг хар.)
  //   даатгал — "insurance" · татвар — "tax" · засаг — "administration"
  "xn--80aaalc0c6b.mn", "xn--80aaf1dgb.mn", "xn--80aaajcd2cfbkkc0d.mn",
  //   банк.mn · гааль.mn · бүртгэл.mn · цагдаа.mn · эрүүлмэнд.mn — төрийн
  //   байгууллагын нэрийг нэмэхэд эдгээр ЕРДИЙН үг унах ёсгүй.
  "xn--80ab2al.mn", "xn--80aah8azf.mn", "xn--90aeysk1e80b.mn",
  "xn--80aaakf9h.mn", "xn--d1andem1fd59ea.mn",
  // ...мөн core нь 3 дахь label боловч банкны нэр БИШ жинхэнэ гадны хаягууд.
  // Эдгээр дээр бүдэг шалгалт (Levenshtein/substring) ажиллуулбал ibank/tdbm-тэй
  // 1 үсгийн зайд таарч хуурамч анхааруулга гардаг — idn.js-ийн SLD2 тайлбар.
  //   bank.gov.ua — Украины Үндэсний банк · tdb.co.jp — Teikoku Databank (Япон)
  //   abank.com.tr — Alternatifbank (Турк) · idbibank.co.in — IDBI Bank (Энэтхэг)
  "bank.gov.ua", "tdb.co.jp", "idbibank.co.in", "abank.com.tr", "tbank.com.tr",
  "nbank.co.jp", "bank.or.jp", "bank.co.id", "bank.com.br", "bank.net.au",
  "bank.gov.tw",
  // Монгол хэл дээрх ердийн домэйн — хөтөч буцаадаг punycode хэлбэрээр.
  // (монгол.mn, мэдээ.mn, засаг.mn, өмнөговь.mn)
  "xn--c1aqbeec.mn", "xn--d1ap5cba.mn", "xn--80aajn5c.mn", "xn--b1ab0aeg9f77cca.mn",
  // Зөвхөн confusable үсгээс тогтох ЕРДИЙН монгол үг — skeleton нь бүхэлдээ
  // ASCII болдог (мөнх -> mohx, хот -> xot, үүр -> yyp) тул CYR_TLD хүснэгт
  // (idn.js) нь эдгээрийг хамгаалдаг ЦОРЫН ГАГЦ зүйл. Хүснэгтийг хасвал
  // гурвуулаа high/85 болж улаан блок хуудас гардаг.
  // (мөнх.mn, хот.mn, үүр.mn)
  "xn--l1acy86d.mn", "xn--n1aih.mn", "xn--p1a5ta.mn",
  // Монголын .мон кирилл ccTLD (монгол.мон).
  "xn--c1aqbeec.xn--l1acc",
  // Дэлхийн ердийн IDN сайтууд: москва.рф, правительство.рф, 한국.kr, 日本.jp.
  "xn--80adxhks.xn--p1ai", "xn--80aealotwbjpid2k.xn--p1ai",
  "xn--3e0b707e.kr", "xn--wgv71a.jp",
  // Хатуулгийн бариул — эдгээр хэзээ ч зөөлрөх ёсгүй.
  "google.com", "gov.uk", "gov.au", "gov.pl", "facebook.com", "wikipedia.org",
  "tdbank.com", "tdbanknorth.com", "mongolbank.mn", "news.mn", "sberbank.ru"
];

test("MUST_BE_SAFE — жинхэнэ сайтууд дээр анхааруулга гарахгүй", function () {
  MUST_BE_SAFE.forEach(function (h) {
    var r = IDN.analyzeHost(h);
    assert.strictEqual(r.level, "safe", "ХУУРАМЧ АНХААРУУЛГА: " + fmt(h));
  });
});

// banks.js-ийн БҮХ албан ёсны домэйн — ногоон баталгаатай, анхааруулгагүй.
test("MUST_BE_SAFE — banks.js-ийн албан ёсны домэйн бүр official/safe", function () {
  var domains = Array.from(BANKS.OFFICIAL);
  assert.ok(domains.length >= 40, "OFFICIAL хэт бага: " + domains.length);
  domains.forEach(function (d) {
    [d, "www." + d, "login." + d, "internet." + d].forEach(function (h) {
      var r = IDN.analyzeHost(h);
      assert.strictEqual(r.level, "safe", "ХУУРАМЧ АНХААРУУЛГА: " + fmt(h));
      assert.strictEqual(r.official, true, h + " — ногоон баталгаа алдагдсан");
    });
  });
});

// ---------------------------------------------------------------------------
// 3. MUST_NOT_BLOCK — шар анхааруулга зүгээр, ГЭХДЭЭ улаан блок хуудас БОЛОХГҮЙ.
// ---------------------------------------------------------------------------
var MUST_NOT_BLOCK = [
  // Банкны нэрийг платформ дээр хэрэглэсэн хаяг — блоклох нь хэт хатуу.
  "khanbank.github.io", "khanbank.blogspot.com", "xacbank.medium.com",
  "e-mongolia.wordpress.com", "statebank.github.io"
];

test("MUST_NOT_BLOCK — блок хуудас гарахгүй", function () {
  MUST_NOT_BLOCK.forEach(function (h) {
    var r = IDN.analyzeHost(h);
    assert.notStrictEqual(r.level, "high", "ХЭТ ХАТУУ БЛОК: " + fmt(h));
  });
});

// ---------------------------------------------------------------------------
// 4. MUST_BE_HIGH — эдгээрийг дуугүй өнгөрүүлбэл хэрэглэгч нууц үгээ алдана.
// ---------------------------------------------------------------------------
var MUST_BE_HIGH = [
  // Төрийн байгууллага ба төв банкны нэрийн дуураймал (2026-09-30-нд нэмэгдсэн).
  // Бүртгэсэн шалтгаан нь тус бүрдээ: ЗӨВХӨН БҮТЭН, онцлог нэрийг оруулсан —
  // ердийн үг (даатгал, татвар, засаг, гааль, бүртгэл, цагдаа) нэмбэл
  // жинхэнэ хаяг унана. Тэдгээрийг MUST_BE_SAFE хамгаалдаг.
  //   емонголиа / имонголиа — иргэн бүр төрийн үйлчилгээ авдаг порталын кирилл
  //     бичиглэл. Латин нэр нь хамгаалагдсан байсан ч кирилл нь дуугүй байв.
  "xn--80affnoehhc.com", "xn--80afoboehhc.com",
  //   emongolia — зураасгүй латин бичиглэл. Өмнө нь зөвхөн бүдэг дүрэмд тусаж,
  //     дарагдах шар зураас гардаг байсан; alias-аар яг таарна.
  "emongolia.com", "emongolia.mn", "e-mongolia-mn.com",
  //   монголбанк — төв банк. Жагсаалтад огт байгаагүй (*.gov.mn доор биш).
  "xn--80abf4acehedc.com", "xn--80abf4acehedc.mn", "mongolbank.com",
  //   гаалийн / улсын бүртгэлийн / эрүүл мэндийн даатгалын ерөнхий газар —
  //     жинхэнэ домэйн нь *.gov.mn доор allowlist-д ордог; эдгээр нь тэдний
  //     НЭРИЙГ өөр домэйн дээр ашигласан дуураймал.
  "xn--80aaaalcnsfbjcv4ab1ch7fr7n.com", "xn--90aewchteld6f1a68i.com",
  "xn--80aaalca1aipicmd9a3b6ld57oa.com",
  // Төрийн байгууллагын нэрийн КИРИЛЛ дуураймал. Банкны кирилл дуураймал
  // (ханбанк.com) аль хэдийн баригддаг байсан ч төрийн нэрс banks.js-ийн
  // CYRILLIC хүснэгтэд байхгүй тул бүрэн дуугүй өнгөрдөг байв.
  "xn--80aaakavefj4bybd.com", "xn--80aaaahh3a9b0afmb4j.com",
  "xn--80aaajcd0abhc1aejg2f.com",
  // Төрийн сайтын дуураймал (өмнө нь 0/safe байсан).
  "gov-mn.com", "govmn.com", "gov-mn.net", "gov.mn.co", "tdbm-mn.com",
  // Албан ёсны бүтэн домэйныг хаягийн эхэнд тавьсан — фишингийн хамгийн
  // түгээмэл хэлбэр (өмнө нь зөвхөн хаагддаг шар зураас байсан).
  "khanbank.mn.secure-login.com", "login.khanbank.com.evil.ru",
  "khanbank.com.verify.top", "statebank.mn.evil.com", "e-mongolia.mn.phish.tk",
  "golomtbank.mn.login.ru",
  // Homograph / кирилл брэнд нэр / punycode.
  "кhanbank.mn", "хacbank.mn", "statebаnk.mn", "κhanbanκ.mn", "gοlomtbank.com",
  "ｋｈａｎｂａｎｋ.mn", "ханбанк.мн", "хасбанк.mn", "мбанк.com",
  "xn--80ak6aa92e.com", "xn--80aac1bmc5c.xn--l1ac", "xn--khanban-v2b.mn",
  // Яг брэнд нэр, өөр TLD.
  "khanbank.net", "golomtbank.co", "xacbank.net", "ndaatgal.com", "ndaatgal.net",
  // Лицензтэй банкны ЯГ брэнд core — эдгээр нь түгээмэл үг БИШ тул idn.js-ийн
  // GENERIC хүснэгтэд ХЭЗЭЭ Ч оруулж болохгүй. (ckbank.mn — Чингис Хаан Банк,
  // nibank.mn / e-nibank.mn — NIBank, etransbank.mn — Тээвэр Хөгжлийн Банк.)
  "ckbank.com", "ckbank.net", "nibank.com", "e-nibank.com", "etransbank.com",
  // Ялгаатай брэнд нэр хоёр түвшний суффикс дор ч гэсэн барина.
  "khanbank.com.pl", "khanbank.net.ru", "xacbank.co.uk", "golomtbank.com.br",
  "ckbank.co.jp",
  // Homograph — хөтөч буцаадаг punycode хэлбэрээр (өргөтгөл location.hostname-ыг
  // л хардаг). Кирилл бичиг хэвийн TLD (.mn, .ru, .рф) дээр ч монгол/орос
  // хэлэнд БАЙДАГГҮЙ үсэг (ӏ палочка, ғ, ѵ ижица) орсныг заль гэж тооцно.
  // (аррӏе.mn, аррӏе.ru, ғоѵ.mn, ғоѵ.рф, мта.mn)
  // ЭНЭ ХОЁРЫГ ХАМТ УНШИНА: аррӏе дээрх палочка нь "р"-ийн дараа — digraph
  // БИШ, латин "l"-ийн дүр. MUST_BE_SAFE-ийн хӏара.ru/кӏант.ru дээр ижил үсэг
  // "х"/"к"-ийн дараа — чеченээр ердийн digraph. Ижил үсэг, өөр байрлал,
  // өөр дүгнэлт (idn.js: PALOCHKA_AFTER).
  "xn--80ak6aa92e.mn", "xn--80ak6aa92e.ru", "xn--n1a4iqd.mn",
  "xn--n1a4iqd.xn--p1ai", "xn--80axs.mn"
];

test("MUST_BE_HIGH — дуураймал хаягууд блоклогдоно", function () {
  MUST_BE_HIGH.forEach(function (h) {
    var r = IDN.analyzeHost(h);
    assert.strictEqual(r.level, "high", "ИЛРҮҮЛЭЛТ УНАЛАА: " + fmt(h));
  });
});

// ---------------------------------------------------------------------------
// 5. Хөтөч хэлбэр — location.hostname яг ийм байдлаар punycode буцаадаг.
//    (SHIPPED хүснэгтийн Unicode хэлбэрийг НӨХӨХ, солих биш.)
//
//    exp  — punycode (хөтөчийн ЖИНХЭНЭ) хэлбэрийн хүлээлт.
//    uexp — Unicode хэлбэрийн хүлээлт (logic-test.html, гар шалгалт). Punycode
//           хэлбэр нь +40 оноо авдаг тул хоёр нь зөрж болно, ГЭХДЭЭ дуураймал
//           хаяг Unicode хэлбэрээр ч "safe" болж ЧИМЭЭГҮЙ БОЛОХ ЁСГҮЙ.
// ---------------------------------------------------------------------------
var IDN_FORMS = [
  // Ердийн кирилл домэйн — хоёр хэлбэрээр ч анхааруулгагүй.
  { u: "монгол.mn", h: "xn--c1aqbeec.mn", exp: "safe", uexp: "safe" },
  { u: "мэдээ.mn", h: "xn--d1ap5cba.mn", exp: "safe", uexp: "safe" },
  { u: "москва.рф", h: "xn--80adxhks.xn--p1ai", exp: "safe", uexp: "safe" },
  // Зөвхөн confusable үсэгтэй ердийн монгол үг (мөнх/хот/үүр) — CYR_TLD-ийн
  // чөлөөлөлт эдгээрт хамаарна: skeleton нь mohx/xot/yyp болох ч заль БИШ.
  { u: "мөнх.mn", h: "xn--l1acy86d.mn", exp: "safe", uexp: "safe" },
  { u: "хот.mn", h: "xn--n1aih.mn", exp: "safe", uexp: "safe" },
  { u: "үүр.mn", h: "xn--p1a5ta.mn", exp: "safe", uexp: "safe" },
  // Кирилл банкны нэр.
  { u: "ханбанк.мн", h: "xn--80aac1bmc5c.xn--l1ac", exp: "high", uexp: "high" },
  // Homograph: монгол/орос хэлэнд байдаггүй үсэг (ӏ палочка, ғ, ѵ ижица).
  // Кирилл бичиг хэвийн TLD дээр ч гэсэн ЧИМЭЭГҮЙ ӨНГӨРӨХ ЁСГҮЙ.
  { u: "аррӏе.com", h: "xn--80ak6aa92e.com", exp: "high", uexp: "suspicious" },
  { u: "аррӏе.mn", h: "xn--80ak6aa92e.mn", exp: "high", uexp: "suspicious" },
  { u: "аррӏе.ru", h: "xn--80ak6aa92e.ru", exp: "high", uexp: "suspicious" },
  { u: "ғоѵ.mn", h: "xn--n1a4iqd.mn", exp: "high", uexp: "high" },
  { u: "ғоѵ.рф", h: "xn--n1a4iqd.xn--p1ai", exp: "high", uexp: "high" },
  // мта нь бүхэлдээ монгол үсэг тул latin_disguise БИШ — skeleton_match-аар барина.
  { u: "мта.mn", h: "xn--80axs.mn", exp: "high", uexp: "suspicious" }
];

test("хөтөч буцаадаг punycode хэлбэр (Unicode хэлбэрийг мөн шалгана)", function () {
  IDN_FORMS.forEach(function (r) {
    // Хөтөч яг ийм хост буцаана гэдгийг баталгаажуулна.
    assert.strictEqual(new URL("http://" + r.u).hostname, r.h, r.u + " -> " + r.h);
    assert.strictEqual(IDN.analyzeHost(r.h).level, r.exp, fmt(r.h) + " (" + r.u + ")");
    assert.strictEqual(IDN.analyzeHost(r.u).level, r.uexp, fmt(r.u) + " (Unicode хэлбэр)");
  });
});

// ---------------------------------------------------------------------------
// 6. Тусдаа шалгалтууд — регресс гаргахгүй байх бариулууд.
// ---------------------------------------------------------------------------
test("шар анхааруулгын түвшин хэвээр (typosquat / combosquat)", function () {
  [["khanbnk.mn", "suspicious"], ["golom6tbank.com", "suspicious"],
   ["secure-khanbank.com", "suspicious"], ["khanbank-mn.com", "suspicious"],
   ["tdb.com", "suspicious"], ["mbank-secure.com", "suspicious"],
   ["transbank-mn.com", "suspicious"]].forEach(function (c) {
    assert.strictEqual(IDN.analyzeHost(c[0]).level, c[1], fmt(c[0]));
  });
});

test("mta.mn / ndaatgal.mn-ийн одоогийн бодлого", function () {
  // Хоёулаа allowlist-д байгаа тул ногоон баталгаатай (*.gov.mn ч мөн адил).
  ["mta.mn", "ndaatgal.mn", "mta.gov.mn", "ndaatgal.gov.mn"].forEach(function (h) {
    var r = IDN.analyzeHost(h);
    assert.strictEqual(r.official, true, h + " — allowlist-ээс хасагдсан");
  });
  // ndaatgal нь 8 тэмдэгттэй тул илрүүлэлтэд ажилладаг...
  assert.strictEqual(IDN.analyzeHost("ndaatgal.com").level, "high");
  // ...mta нь 3 тэмдэгттэй тул уртын шүүлтүүрээс хэтэрдэггүй (одоогийн байдал).
  assert.strictEqual(IDN.analyzeHost("mta.com").level, "safe");
});

test("PROTECT / OFFICIAL-ийн салалт (protect:false зөвхөн ногоон баталгаа)", function () {
  ["x-meta.com", "storepay.mn", "ardcredit.com", "lend.mn", "trade.mn"].forEach(function (d) {
    assert.strictEqual(BANKS.OFFICIAL.has(d), true, d + " — OFFICIAL-д байх ёстой");
    assert.strictEqual(BANKS.PROTECT.has(d), false, d + " — PROTECT-д БАЙХ ЁСГҮЙ");
  });
  ["khanbank.mn", "golomtbank.mn", "gov.mn", "ndaatgal.mn"].forEach(function (d) {
    assert.strictEqual(BANKS.PROTECT.has(d), true, d + " — PROTECT-д байх ёстой");
  });
});

test("«@» userinfo заль (хөтөч URL-аас userinfo-г хасаагүй үед)", function () {
  var spoof = IDN.analyzeUrl("http://khanbank.mn@evil.com/", "evil.com");
  assert.strictEqual(spoof.level, "high", "userinfo заль илрээгүй");
  assert.deepStrictEqual(spoof.reasons, ["userinfo_spoof"]);
  assert.strictEqual(spoof.decoy, "khanbank.mn");
  assert.strictEqual(spoof.host, "evil.com");
  assert.strictEqual(IDN.analyzeUrl("http://e-mongolia.mn@phish.tk/login", "phish.tk").level, "high");
  assert.strictEqual(IDN.analyzeUrl("http://khanbank.mn:8080@evil.com/", "evil.com").level, "high");
  assert.strictEqual(IDN.analyzeUrl("http://user:khanbank.mn@evil.com/", "evil.com").level, "high");

  // path/query дотор байгаа «@» нь заль БИШ — хуурамч анхааруулга гаргахгүй.
  assert.strictEqual(IDN.analyzeUrl("https://example.com/@khanbank.mn", "example.com").level, "safe");
  assert.strictEqual(IDN.analyzeUrl("https://example.com/?to=a@khanbank.mn", "example.com").level, "safe");
  assert.strictEqual(IDN.analyzeUrl("http://notabank.com@evil.com/", "evil.com").level, "safe");
  // Жинхэнэ хост нь албан ёсны бол хөндөхгүй.
  assert.strictEqual(IDN.analyzeUrl("http://khanbank.mn@khanbank.mn/", "khanbank.mn").official, true);
  // Хөтөч userinfo-г хассан бол analyzeHost-тай ижил үр дүн.
  assert.strictEqual(IDN.analyzeUrl("http://evil.com/", "evil.com").level, "safe");
  assert.deepStrictEqual(IDN.userinfoDecoys("https://evil.com/"), []);
});

test("skeleton — Монгол нэрийг латин гэж андуурахгүй", function () {
  assert.strictEqual(IDN.toSkeleton("аррӏе"), "apple");      // бүхэлдээ ASCII -> заль
  assert.strictEqual(IDN.toSkeleton("κhanbanκ"), "khanbank");
  assert.strictEqual(IDN.toSkeleton("ｋｈａｎｂａｎｋ"), "khanbank");
  assert.ok(/[^\x00-\x7F]/.test(IDN.toSkeleton("мэдээ")), "мэдээ латин болох ёсгүй");
  assert.ok(/[^\x00-\x7F]/.test(IDN.toSkeleton("монгол")), "монгол латин болох ёсгүй");
});
