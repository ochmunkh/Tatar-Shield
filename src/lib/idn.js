/*
 * Tatar Shield — IDN / homograph фишинг шинжилгээ (офлайн, гадны дуудлагагүй).
 * Кирилл/латин холимог, punycode, дуураймал домэйныг илрүүлж, банкны нэрийг буцаана.
 */
(function () {
  // Unicode TR39-д суурилсан түгээмэл confusable тэмдэгтүүд -> латин үсэг.
  var CONFUSABLES = {
    // Кирилл
    "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x",
    "к": "k", "м": "m", "н": "h", "т": "t", "в": "b", "і": "i", "ј": "j",
    "ѕ": "s", "ԁ": "d", "ԛ": "q", "ԝ": "w", "ё": "e", "ү": "y", "ө": "o",
    "ѐ": "e", "ӏ": "l", "қ": "k", "ғ": "g", "ҳ": "x", "ѵ": "v", "ѡ": "w",
    // Грек
    "α": "a", "ο": "o", "ρ": "p", "ε": "e", "ι": "i", "ν": "v", "τ": "t",
    "κ": "k", "β": "b", "η": "n", "μ": "m", "χ": "x", "υ": "u", "γ": "y",
    "ϲ": "c", "ϳ": "j", "ѕ ": "s",
    // Letterlike / математик тэмдэгт
    "ⅼ": "l", "ⅿ": "m", "ⅾ": "d", "ⅽ": "c", "ⅰ": "i", "ℯ": "e", "ℓ": "l",
    "ａ": "a", "ӕ": "ae"
  };
  var CYRILLIC = /[Ѐ-ӿԀ-ԯ]/;
  var LATIN = /[a-z]/i;

  // Кирилл бичиг хэвийн хэрэглэгддэг ASCII ccTLD-ууд. Кирилл IDN TLD (.рф, .мон)
  // нь өөрөө кирилл тул тусад нь бичих шаардлагагүй.
  var CYR_TLD = { mn: 1, ru: 1, by: 1, ua: 1, kz: 1, kg: 1, tj: 1, rs: 1,
                  bg: 1, mk: 1, md: 1, uz: 1, me: 1 };

  // Дээрх ccTLD-уудын хэлэнд ЕРДИЙН хэрэглэгддэг кирилл үсгүүд: орос+монгол
  // үндсэн олонлог + үндэсний нэмэлт үсгүүд. CYR_TLD-ийн чөлөөлөлт ЗӨВХӨН
  // эдгээр үсгээр бичигдсэн label-д хамаарна.
  //   мөнх.mn, хот.mn, москва.рф -> үндэсний үсэг, ердийн хаяг (чөлөөлөгдөнө)
  //   аррӏе.mn (ӏ палочка), ғоѵ.mn (ғ, ѵ ижица) -> Монгол/Оросын хэлэнд
  //   байдаггүй үсэг, зориуд холисон homograph (ЧӨЛӨӨЛӨГДӨХГҮЙ).
  var CYR_BASE = "абвгдеёжзийклмнопрстуфхцчшщъыьэюяөү";
  var CYR_EXTRA = { ua: "іїєґ", by: "іў", kz: "әғқңұһі", kg: "әғқңүһ",
                    tj: "ғқҳҷӣӯ", uz: "ўқғҳ", rs: "јљњћђџ", mk: "јљњѓќџѕ",
                    me: "јљњћђџ" };

  // Палочка (ӏ, U+04CF). Хоёр тал нь зөрчилддөг:
  //   · Хойд Кавказын хэлүүд (чечен, ингуш, авар, дарги…) үүнийг ЗӨВХӨН
  //     хос үсгийн (digraph) хоёрдугаар элемент болгон хэрэглэдэг: гӏ кӏ пӏ тӏ хӏ цӏ чӏ.
  //     Эдгээр нь Орост, өөрөөр хэлбэл .ru дээр ердийн хаяг: хӏара.ru, кӏант.ru.
  //   · Homograph довтолгоонд палочка нь латин "l"/"I"-ийн дүр болж, digraph
  //     БИШ байрлалд гардаг: аррӏе -> apple (ӏ нь "р"-ийн дараа).
  // Тиймээс палочкаг үсгийн хүснэгтээр биш, БАЙРЛАЛААР шүүнэ: өмнөх тэмдэгт
  // digraph бүтээдэг гийгүүлэгч бол ердийн, бусад тохиолдолд заль.
  var PALOCHKA = "\u04cf";
  var PALOCHKA_TLD = { ru: 1 };
  var PALOCHKA_AFTER = "гкптхцч";

  // ТҮГЭЭМЭЛ ҮГТЭЙ core-ууд. Өөр TLD дээр тааралдвал дэлхийн жинхэнэ байгууллага
  // байх магадлалтай тул зөвхөн brand_diff_domain-д (яг ижил нэр, өөр TLD)
  // тооцохгүй. Homograph/skeleton/subdomain/cyrillic шалгалт бүгд хэвийн.
  // Бүртгэл бүрийн ЖИНХЭНЭ гадны эзэмшигч:
  //   mbank      — mBank S.A. (Польш): mbank.pl, mbank.cz, mbank.sk
  //   ibank      — "internet bank" гэсэн түгээмэл үг: ibank.co.uk
  //   statebank  — State Bank (АНУ): statebank.com, statebank.co.in
  //   transbank  — Transbank (Чили): transbank.cl, transbank.com.br
  //   storepay / ardcredit / x-meta — protect:false (зөвхөн ногоон баталгаа)
  //
  // ЭНД НЭМЭХГҮЙ: ckbank / nibank / e-nibank / etransbank. Эдгээр нь түгээмэл
  // үг БИШ — лицензтэй банкны ЯГ брэнд core (Чингис Хаан Банк ckbank.mn,
  // NIBank nibank.mn / e-nibank.mn, Тээвэр Хөгжлийн Банк etransbank.mn).
  // Гадны жинхэнэ эзэмшигч мэдэгдээгүй тул ckbank.com / nibank.com нь
  // дуураймал бөгөөд ӨНДӨР эрсдэл байх ёстой (test/run.js: MUST_BE_HIGH).
  var GENERIC = { mbank: 1, ibank: 1, statebank: 1, transbank: 1,
                  storepay: 1, ardcredit: 1, "x-meta": 1 };

  // TLD дүр эсгэсэн label — khanbank.mn.secure-login.com хэлбэр.
  var FAKETLD = { mn: 1, com: 1, net: 1, org: 1, co: 1, info: 1, gov: 1 };

  // Хоёр түвшний бүртгэлийн суффикс (com.pl, co.in, net.au ...). Ийм хаягийн
  // core нь 3 дахь label болно — үүнийг мэдэхгүй бол mbank.com.pl-ийн core нь
  // "com" болж, "mbank" нь subdomain-д нуусан брэнд шиг харагдаж байсан.
  //
  // ЭНЭ НЬ ТААМАГ: <sld2>.<2 үсэгтэй cc> хэлбэрийг гадаадын хоёр түвшний
  // бүртгэл гэж ТААЖ байна. Тиймээс ийм байдлаар олдсон core дээр ЗӨВХӨН
  // яг тэнцэх шинжийг (brand_diff_domain / skeleton / cyrillic / subdomain)
  // хүлээн авч, БҮДЭГ шалгалтыг (Levenshtein typosquat, substring combosquat)
  // хийхгүй — бүдэг шалгалт нь жинхэнэ гадны сайтууд дээр хуурамч
  // анхааруулга гаргадаг:
  //   bank.gov.ua    (Украины Үндэсний банк)  ~ typosquat:ibank(d=1)
  //   tdb.co.jp      (Teikoku Databank, Япон) ~ typosquat:tdbm(d=1)
  //   abank.com.tr   (Alternatifbank, Турк)   ~ typosquat:ibank(d=1)
  //   idbibank.co.in (IDBI Bank, Энэтхэг)     ⊃ combosquat:ibank
  // khanbank.com.pl / xacbank.co.uk мэт ЯГ брэнд нэр нь brand_diff_domain-аар
  // хэвээр ӨНДӨР эрсдэл (test/run.js: MUST_BE_HIGH).
  var SLD2 = { com: 1, co: 1, net: 1, org: 1, gov: 1, edu: 1, ac: 1, or: 1,
               ne: 1, gr: 1, biz: 1, info: 1, mil: 1, nom: 1 };

  // Мэдэгдэж байгаа (таамаг БИШ) хоёр түвшний суффиксууд — бүдэг шалгалт хэвийн.
  var TWO_LEVEL = { "gov.mn": 1, "co.uk": 1, "com.mn": 1, "org.mn": 1, "edu.mn": 1 };

  function toSkeleton(s) {
    var out = "";
    for (var i = 0; i < s.length; i++) {
      var code = s.charCodeAt(i);
      // Fullwidth латин/тоо (ａ-ｚ, Ａ-Ｚ, ０-９) -> энгийн ASCII
      if (code >= 0xFF01 && code <= 0xFF5E) { out += String.fromCharCode(code - 0xFEE0).toLowerCase(); continue; }
      var ch = s[i].toLowerCase();
      out += CONFUSABLES.hasOwnProperty(ch) ? CONFUSABLES[ch] : ch;
    }
    return out;
  }

  function digitFromCode(c) {
    if (c >= 0x30 && c <= 0x39) return c - 22;
    if (c >= 0x41 && c <= 0x5a) return c - 65;
    if (c >= 0x61 && c <= 0x7a) return c - 97;
    return 36;
  }
  function adapt(delta, numPoints, firstTime) {
    var base = 36, tmin = 1, tmax = 26, skew = 38, damp = 700, k = 0;
    delta = firstTime ? Math.floor(delta / damp) : delta >> 1;
    delta += Math.floor(delta / numPoints);
    while (delta > (((base - tmin) * tmax) >> 1)) {
      delta = Math.floor(delta / (base - tmin));
      k += base;
    }
    return Math.floor(k + ((base - tmin + 1) * delta) / (delta + skew));
  }
  function punyDecode(input) {
    var base = 36, tmin = 1, tmax = 26, initialN = 128, initialBias = 72;
    var output = [], i = 0, n = initialN, bias = initialBias;
    var basic = input.lastIndexOf("-");
    if (basic < 0) basic = 0;
    for (var j = 0; j < basic; j++) {
      if (input.charCodeAt(j) >= 0x80) return null;
      output.push(input.charCodeAt(j));
    }
    var index = basic > 0 ? basic + 1 : 0;
    while (index < input.length) {
      var oldi = i, w = 1, k = base;
      for (;;) {
        if (index >= input.length) return null;
        var digit = digitFromCode(input.charCodeAt(index++));
        if (digit >= base) return null;
        i += digit * w;
        var t = k <= bias ? tmin : (k >= bias + tmax ? tmax : k - bias);
        if (digit < t) break;
        w *= base - t; k += base;
      }
      var out = output.length + 1;
      bias = adapt(i - oldi, out, oldi === 0);
      n += Math.floor(i / out); i %= out;
      output.splice(i++, 0, n);
    }
    try { return String.fromCodePoint.apply(String, output); }
    catch (e) { return null; }
  }
  function decodeHost(host) {
    return host.split(".").map(function (label) {
      if (label.indexOf("xn--") === 0) {
        var dec = punyDecode(label.slice(4));
        return dec || label;
      }
      return label;
    }).join(".");
  }

  function hasCyrillic(s) { return CYRILLIC.test(s); }
  /** label дотор тухайн TLD-ийн хэлэнд БАЙДАГГҮЙ кирилл тэмдэгт байна уу. */
  function hasForeignCyrillic(label, tld) {
    var allowed = CYR_BASE + (CYR_EXTRA[tld] || "");
    var low = label.toLowerCase();
    for (var i = 0; i < low.length; i++) {
      var ch = low[i];
      if (!CYRILLIC.test(ch)) continue;
      if (allowed.indexOf(ch) >= 0) continue;
      // Палочка: digraph байрлалд байвал (гӏ кӏ пӏ тӏ хӏ цӏ чӏ) ердийн гэж тооцно.
      if (ch === PALOCHKA && PALOCHKA_TLD[tld] &&
          i > 0 && PALOCHKA_AFTER.indexOf(low[i - 1]) >= 0) continue;
      return true;
    }
    return false;
  }
  function hasLatin(s) { return LATIN.test(s); }
  function hasNonAscii(s) { return /[^\x00-\x7F]/.test(s); }
  function onlyCyrillicNonAscii(s) { return !hasNonAscii(s.replace(/[Ѐ-ӿԀ-ԯ]/g, "")); }

  /**
   * label нь латин үг болж "хувирдаг" (skeleton нь бүхэлдээ ASCII) эсэх.
   * Жишээ: аррӏе -> apple, κhanbanκ -> khanbank, ｋｈａｎｂａｎｋ -> khanbank.
   * Кирилл бичиг хэвийн TLD дээрх, ҮНДЭСНИЙ үсгээр бичигдсэн кирилл нэрийг
   * заль гэж тооцохгүй — монгол.mn, мөнх.mn, москва.рф нь ердийн хаяг.
   * Харин тухайн хэлэнд байдаггүй үсэг (аррӏе -> apple дахь ӏ палочка,
   * ғоѵ -> gov дахь ѵ ижица) орсон бол .mn/.ru дээр ч заль гэж тооцно.
   */
  function isLatinDisguise(label, tld) {
    if (!hasNonAscii(label)) return false;
    var sk = toSkeleton(label);
    if (sk === label || hasNonAscii(sk) || !hasLatin(sk)) return false;
    if (hasCyrillic(label) && onlyCyrillicNonAscii(label) &&
        !hasForeignCyrillic(label, tld) &&
        (CYR_TLD[tld] || hasCyrillic(tld))) return false;
    return true;
  }

  function levenshtein(a, b) {
    if (a === b) return 0;
    var m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    var prev = new Array(n + 1), cur = new Array(n + 1), i, j;
    for (j = 0; j <= n; j++) prev[j] = j;
    for (i = 1; i <= m; i++) {
      cur[0] = i;
      for (j = 1; j <= n; j++) {
        var cost = a[i - 1] === b[j - 1] ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
  }

  /**
   * Хостын registrable core label. guessed2ld=true бол core нь мэдэгдээгүй
   * <sld2>.<cc> суффиксийн ТААМАГААР олдсон — тэр үед бүдэг (typosquat /
   * combosquat) шалгалт хийхгүй (SLD2-ийн тайлбарыг үзнэ үү).
   */
  function coreParts(host) {
    host = host.replace(/^www\./, "");
    var parts = host.split(".");
    if (parts.length <= 1) return { core: host, guessed2ld: false };
    if (parts.length >= 3) {
      if (TWO_LEVEL[parts.slice(-2).join(".")]) {
        return { core: parts[parts.length - 3], guessed2ld: false };
      }
      if (SLD2[parts[parts.length - 2]] && parts[parts.length - 1].length === 2) {
        return { core: parts[parts.length - 3], guessed2ld: true };
      }
    }
    return { core: parts[parts.length - 2], guessed2ld: false };
  }
  function coreLabel(host) { return coreParts(host).core; }

  function banks() { return (globalThis.TATAR_BANKS && globalThis.TATAR_BANKS.BANKS) || []; }

  function nameOfDomain(domain) {
    var bs = banks();
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].domains.indexOf(domain) > -1) return bs[i].name;
    }
    return null;
  }

  function officialInfo(host) {
    host = host.replace(/^www\./, "").toLowerCase();
    var bs = banks();
    for (var i = 0; i < bs.length; i++) {
      for (var j = 0; j < bs[i].domains.length; j++) {
        var d = bs[i].domains[j];
        if (host === d || host.endsWith("." + d)) return { domain: d, name: bs[i].name };
      }
    }
    return null;
  }
  function isOfficial(host) { return !!officialInfo(host); }

  /**
   * banks.js-ийн aliases — зөвхөн skeleton яг тэнцэх харьцуулалтад.
   * officialCores()-ийн мапд ОРУУЛАХГҮЙ: 3-4 тэмдэгттэй alias Levenshtein
   * хайлтад жинхэнэ nearest-ийг дарж, tdb.com мэт илрүүлэлтийг унагадаг.
   */
  function officialAliases() {
    var bs = banks(), map = {};
    for (var i = 0; i < bs.length; i++) {
      if (bs[i].protect === false || !bs[i].aliases) continue;
      for (var j = 0; j < bs[i].aliases.length; j++) {
        map[bs[i].aliases[j].toLowerCase()] = bs[i].domains[0];
      }
    }
    return map;
  }

  function officialCores() {
    var set = (globalThis.TATAR_BANKS && (globalThis.TATAR_BANKS.PROTECT || globalThis.TATAR_BANKS.OFFICIAL)) || new Set();
    var map = {};
    set.forEach(function (d) {
      var c = coreLabel(d);
      (map[c] = map[c] || []).push(d);
    });
    return map;
  }

  function analyzeHost(host) {
    var reasons = [], score = 0, nearest = null, nearestNameOverride = null;
    if (!host) return { score: 0, level: "safe", reasons: [], nearest: null, host: host };
    host = host.toLowerCase();

    var off = officialInfo(host);
    if (off) {
      return { score: 0, level: "safe", reasons: ["allowlisted"], nearest: null,
               host: host, unicode: host, official: true, bankName: off.name };
    }

    var punycode = /(^|\.)xn--/.test(host);
    var uni = decodeHost(host);
    var uniLabels = uni.split(".");
    var uniTld = uniLabels[uniLabels.length - 1];
    // Скрипт холилдлыг label тус бүрээр шалгана. Бүтэн хостоор шалгавал TLD-ийн
    // ASCII "mn" нь латин болж, .mn-ийн доорх ямар ч кирилл нэр (монгол.mn)
    // "холимог" гэж тооцогдоод улаан блок хуудас гарч байсан.
    var mixed = uniLabels.some(function (L) { return hasCyrillic(L) && hasLatin(L); });
    var nonAscii = hasNonAscii(uni);
    var disguised = uniLabels.some(function (L, i) {
      return i < uniLabels.length - 1 && isLatinDisguise(L, uniTld);
    });
    if (mixed) { score += 45; reasons.push("mixed_script"); }
    if (disguised) { score += 45; reasons.push("latin_disguise"); }
    // Латин бус бичиг нь өөрөө заль биш (москва.рф, 한국.kr, монгол.mn).
    // Punycode-ийн оноог хуримтлуулж, брэндийн шинж гарсан үед л нэмнэ.
    var scriptScore = punycode ? 40 : 0;

    var cp = coreParts(uni);
    var core = cp.core;
    // Таамгаар олдсон <sld2>.<cc> core дээр бүдэг шалгалт хийхгүй (SLD2 тайлбар).
    var fuzzyOk = !cp.guessed2ld;
    var skel = toSkeleton(core);
    var map = officialCores();
    var best = { dist: Infinity, core: null, domains: null };
    Object.keys(map).forEach(function (oc) {
      var d = levenshtein(skel, oc);
      if (d < best.dist) best = { dist: d, core: oc, domains: map[oc] };
    });
    if (best.core) {
      var len = Math.max(best.core.length, skel.length);
      var ratio = 1 - best.dist / len;
      if (best.dist === 0 && skel !== core) {
        score += 55; reasons.push("skeleton_match:" + best.core); nearest = best.domains[0];
      } else if (best.dist === 0 && (nonAscii || punycode)) {
        score += 50; reasons.push("lookalike:" + best.core); nearest = best.domains[0];
      } else if (best.dist === 0 && best.core.length >= 4 && !GENERIC[best.core]) {
        // Яг брэнд нэр боловч албан ёсны бус хаяг (өөр TLD/байрлал) -> ӨНДӨР эрсдэл
        score += 75; reasons.push("brand_diff_domain:" + best.core); nearest = best.domains[0];
      } else if (fuzzyOk && best.dist > 0 && best.dist <= 2 && ratio >= 0.72 && best.core.length >= 4) {
        score += 35; reasons.push("typosquat:" + best.core + "(d=" + best.dist + ")"); nearest = best.domains[0];
      }
    }

    // Брэндийн дуураймал хэлбэр (gov-mn, govmn, tdbm-mn) — уртын шүүлтүүрт
    // баригддаггүй 3-4 тэмдэгттэй core-уудыг яг тэнцэх alias-аар барина.
    var ali = officialAliases();
    if (ali[skel]) {
      score += 75; reasons.push("brand_alias:" + skel);
      if (!nearest) nearest = ali[skel];
    }

    var labels = uni.replace(/^www\./, "").toLowerCase().split(".");

    // Албан ёсны БҮТЭН домэйныг хаягийн эхэнд тавьсан заль: gov.mn.co,
    // khanbank.mn.evil.com. Жинхэнэ subdomain-ууд officialInfo()-д аль хэдийн
    // таслагдсан тул энд тааралдвал registrable хэсэг нь өөр — хууль ёсны
    // тайлбар байхгүй.
    var prot = (globalThis.TATAR_BANKS && (globalThis.TATAR_BANKS.PROTECT || globalThis.TATAR_BANKS.OFFICIAL)) || new Set();
    for (var ri = 0; ri < labels.length - 1; ri++) {
      for (var rj = ri + 1; rj < labels.length - 1; rj++) {
        var run = labels.slice(ri, rj + 1).join(".");
        if (prot.has(run)) {
          score += 70; reasons.push("official_domain_in_subdomain:" + run);
          if (!nearest) nearest = run;
          ri = labels.length; break;
        }
      }
    }

    Object.keys(map).forEach(function (oc) {
      if (oc.length < 4) return;
      for (var i = 0; i < labels.length; i++) {
        if (toSkeleton(labels[i]) === oc && core !== oc && reasons.indexOf("brand_in_subdomain:" + oc) < 0) {
          // Брэндийн дараа TLD дүр эсгэсэн label байвал (khanbank.mn.evil.com)
          // шууд блок; khanbank.github.io мэт платформ хаягийг зөвхөн сэжигтэй.
          score += FAKETLD[labels[i + 1]] ? 70 : 40;
          reasons.push("brand_in_subdomain:" + oc);
          if (!nearest) nearest = map[oc][0];
        }
      }
      if (fuzzyOk && oc.length >= 5 && skel.indexOf(oc) > -1 && skel !== oc && reasons.indexOf("combosquat:" + oc) < 0) {
        score += 35; reasons.push("combosquat:" + oc);
        if (!nearest) nearest = map[oc][0];
      }
    });

    // Кирилл үсгээр бичсэн банкны нэр (ханбанк.мн мэт) — уншаад хууртах эрсдэл өндөр
    var CYR = (globalThis.TATAR_BANKS && globalThis.TATAR_BANKS.CYRILLIC) || {};
    var coreLc = core.toLowerCase();
    if (hasCyrillic(coreLc)) {
      var ckeys = Object.keys(CYR);
      for (var ci = 0; ci < ckeys.length; ci++) {
        var alias = ckeys[ci];
        if (coreLc === alias || coreLc.indexOf(alias) > -1) {
          score += 70;
          if (reasons.indexOf("cyrillic_brand:" + CYR[alias]) < 0) reasons.push("cyrillic_brand:" + CYR[alias]);
          nearestNameOverride = CYR[alias];
          break;
        }
      }
    }

    // Punycode нь брэндийн шинжтэй (nearest, кирилл брэнд нэр, латин заль)
    // хамт гарвал л оноо болно. Ингэснээр дэлхийн ердийн IDN сайт бүр дээр
    // шар анхааруулга гарахаа болино.
    if (scriptScore > 0 && (nearest !== null || nearestNameOverride !== null || disguised)) {
      score += scriptScore; reasons.push("punycode");
    }

    if (score > 100) score = 100;
    var level = score >= 70 ? "high" : score >= 35 ? "suspicious" : "safe";
    return {
      score: score, level: level, reasons: reasons, nearest: nearest,
      nearestName: nearestNameOverride || (nearest ? nameOfDomain(nearest) : null),
      host: host, unicode: uni, skeleton: skel,
      punycode: punycode, mixed: mixed
    };
  }

  /**
   * URL-ийн authority хэсгээс «@» userinfo-д нуусан жинхэнэ мэт хаягуудыг авна.
   * http://khanbank.mn@evil.com/ -> ["khanbank.mn"] (жинхэнэ хост нь evil.com).
   * «@»-гүй URL дээр хоосон массив буцаана.
   */
  function userinfoDecoys(url) {
    if (!url) return [];
    var auth = String(url).replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split(/[/?#]/)[0];
    var at = auth.lastIndexOf("@");
    if (at < 0) return [];
    return auth.slice(0, at).split(":").filter(function (s) { return !!s; });
  }

  /**
   * Бүтэн URL-ээр шинжилнэ: analyzeHost + «@» userinfo заль.
   * http://khanbank.mn@evil.com дээр location.hostname нь evil.com-ыг буцаадаг тул
   * хаягийн эхний хэсэг хэрэглэгчид жинхэнэ мэт харагдана. Хөтөч URL-аас
   * userinfo-г хасаагүй тохиолдолд л илэрнэ — хассан бол analyzeHost-ийн үр дүн
   * хөдөлгөөнгүй хэвээр (алдаатай анхааруулга гарахгүй).
   */
  function analyzeUrl(url, host) {
    var res = analyzeHost(host);
    if (res.official || res.level === "high") return res;
    var decoys = userinfoDecoys(url);
    for (var i = 0; i < decoys.length; i++) {
      var off = officialInfo(decoys[i]);
      if (off) {
        return { score: 85, level: "high", reasons: ["userinfo_spoof"],
                 nearest: off.domain, nearestName: off.name, decoy: decoys[i],
                 host: res.host, unicode: res.unicode, skeleton: res.skeleton,
                 punycode: !!res.punycode, mixed: !!res.mixed };
      }
    }
    return res;
  }

  var api = { analyzeHost: analyzeHost, analyzeUrl: analyzeUrl, userinfoDecoys: userinfoDecoys,
              toSkeleton: toSkeleton, levenshtein: levenshtein,
              coreLabel: coreLabel, isOfficial: isOfficial, officialInfo: officialInfo, decodeHost: decodeHost };
  if (typeof globalThis !== "undefined") globalThis.TATAR_IDN = api;
  else if (typeof self !== "undefined") self.TATAR_IDN = api;
  else if (typeof window !== "undefined") window.TATAR_IDN = api;
})();
