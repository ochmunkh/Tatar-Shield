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
  function hasLatin(s) { return LATIN.test(s); }
  function hasNonAscii(s) { return /[^\x00-\x7F]/.test(s); }

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

  function coreLabel(host) {
    host = host.replace(/^www\./, "");
    var parts = host.split(".");
    if (parts.length <= 1) return host;
    var twoLevel = { "gov.mn": 1, "co.uk": 1, "com.mn": 1, "org.mn": 1, "edu.mn": 1 };
    var lastTwo = parts.slice(-2).join(".");
    if (twoLevel[lastTwo] && parts.length >= 3) return parts[parts.length - 3];
    return parts[parts.length - 2];
  }

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
    var mixed = hasCyrillic(uni) && hasLatin(uni);
    var nonAscii = hasNonAscii(uni);
    if (mixed) { score += 45; reasons.push("mixed_script"); }
    if (punycode) { score += 40; reasons.push("punycode"); }
    if (nonAscii && !mixed) { score += 15; reasons.push("non_ascii"); }

    var core = coreLabel(uni);
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
      } else if (best.dist === 0 && best.core.length >= 4) {
        // Яг брэнд нэр боловч албан ёсны бус хаяг (өөр TLD/байрлал) -> ӨНДӨР эрсдэл
        score += 75; reasons.push("brand_diff_domain:" + best.core); nearest = best.domains[0];
      } else if (best.dist > 0 && best.dist <= 2 && ratio >= 0.72 && best.core.length >= 4) {
        score += 35; reasons.push("typosquat:" + best.core + "(d=" + best.dist + ")"); nearest = best.domains[0];
      }
    }

    var labels = uni.replace(/^www\./, "").toLowerCase().split(".");
    Object.keys(map).forEach(function (oc) {
      if (oc.length < 4) return;
      for (var i = 0; i < labels.length; i++) {
        if (toSkeleton(labels[i]) === oc && core !== oc && reasons.indexOf("brand_in_subdomain:" + oc) < 0) {
          score += 40; reasons.push("brand_in_subdomain:" + oc);
          if (!nearest) nearest = map[oc][0];
        }
      }
      if (oc.length >= 5 && skel.indexOf(oc) > -1 && skel !== oc && reasons.indexOf("combosquat:" + oc) < 0) {
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
          score += 60;
          if (reasons.indexOf("cyrillic_brand:" + CYR[alias]) < 0) reasons.push("cyrillic_brand:" + CYR[alias]);
          nearestNameOverride = CYR[alias];
          break;
        }
      }
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

  var api = { analyzeHost: analyzeHost, toSkeleton: toSkeleton, levenshtein: levenshtein,
              coreLabel: coreLabel, isOfficial: isOfficial, officialInfo: officialInfo, decodeHost: decodeHost };
  if (typeof globalThis !== "undefined") globalThis.TATAR_IDN = api;
  else if (typeof self !== "undefined") self.TATAR_IDN = api;
  else if (typeof window !== "undefined") window.TATAR_IDN = api;
})();
