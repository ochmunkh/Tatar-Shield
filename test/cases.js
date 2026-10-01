/*
 * Tatar Shield — илрүүлэлтийн ЖИШЭЭ КЕЙСҮҮД (нэг эх сурвалж).
 *
 * Хоёр тест ХОЁУЛАА энэ файлыг ачаална — хуулбар тавибал хоёр жагсаалт
 * дуугүйхэн зөрдөг:
 *   test/logic-test.html  ->  <script src="cases.js">   (хөтөч)
 *   test/run.js           ->  require("./cases.js")     (node --test)
 *
 * Хаягуудыг ЯГ ийм Unicode хэлбэрээр хадгална. new URL(...)-аар punycode
 * болгож хөрвүүлж БОЛОХГҮЙ: мэдээ.мн нь өөр хост болж, ｋｈａｎｂａｎｋ.mn нь
 * NFKC-ээр khanbank.mn (allowlist!) болж хувирдаг.
 *
 * h        — шалгах хост
 * exp      — хүлээж буй түвшин: "safe" | "suspicious" | "high"
 * official — allowlist-ийн ногоон баталгаа (байхгүй бол шалгахгүй)
 */
(function () {
  var CASES = [
    { h: "khanbank.com", exp: "safe", official: true },
    { h: "statebank.mn", exp: "safe", official: true },
    { h: "etransbank.mn", exp: "safe", official: true },
    { h: "e-nibank.mn", exp: "safe", official: true },
    { h: "customs.gov.mn", exp: "safe", official: true },
    { h: "google.com", exp: "safe", official: false },
    { h: "мэдээ.мн", exp: "safe", official: false },
    { h: "хacbank.mn", exp: "high" },
    { h: "statebаnk.mn", exp: "high" },
    { h: "xn--80ak6aa92e.com", exp: "high" },
    { h: "ханбанк.мн", exp: "high" },
    { h: "хасбанк.mn", exp: "high" },
    { h: "мбанк.com", exp: "high" },
    { h: "khanbank.net", exp: "high" },
    { h: "golomtbank.co", exp: "high" },
    { h: "κhanbanκ.mn", exp: "high" },
    { h: "gοlomtbank.com", exp: "high" },
    { h: "ｋｈａｎｂａｎｋ.mn", exp: "high" },
    { h: "mbank-secure.com", exp: "suspicious" },
    { h: "transbank-mn.com", exp: "suspicious" }
  ];
  if (typeof globalThis !== "undefined") globalThis.TATAR_CASES = CASES;
  else if (typeof self !== "undefined") self.TATAR_CASES = CASES;
  else if (typeof window !== "undefined") window.TATAR_CASES = CASES;
})();
