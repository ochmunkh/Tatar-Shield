"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const root = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8").replace(/^\uFEFF/, "");
const RE = /var FEEDBACK_URL = "([^"]+)";/;

test("feedback URL: content.js ба popup.js-д ижил, README-д бичигдсэн", () => {
  const c = read("src/content/content.js").match(RE);
  const p = read("src/popup/popup.js").match(RE);
  assert.ok(c, "content.js-д FEEDBACK_URL алга");
  assert.ok(p, "popup.js-д FEEDBACK_URL алга");
  assert.strictEqual(c[1], p[1], "content.js ба popup.js-ийн feedback URL зөрсөн");
  assert.match(c[1], /^https:\/\/m\.me\/[A-Za-z0-9._-]+$/, "feedback URL нь https://m.me/<нэр> хэлбэртэй байх ёстой");
  assert.ok(read("README.md").includes(c[1]), "README feedback URL-ийг дурдаагүй");
});

// Offline-first: өргөтгөл өөрөө гадаад сүлжээнд хандахгүй. Feedback нь зөвхөн хэрэглэгч холбоос дархад нээгдэнэ.
//
// ЗӨВХӨН ЗӨВШӨӨРСӨН нэг тохиолдол: background.js нь өргөтгөлийн ӨӨРИЙН icon файлыг
// `browserAPI.runtime.getURL(...)`-аар fetch хийж ImageData болгодог (MV3 service worker дээр
// setIcon-д path өгөхөд "Failed to fetch" гардаг тул). Энэ нь chrome-extension:// — гадаад сүлжээ биш.
const ALLOWED_FETCH = { "src/background/background.js": { max: 1, mustContain: "runtime.getURL(" } };
const OTHER_NET = /XMLHttpRequest|navigator\.sendBeacon|new\s+WebSocket|new\s+EventSource/;

test("өргөтгөл гадаад сүлжээний хүсэлт гаргадаггүй", () => {
  const files = [];
  for (const dir of ["src/content", "src/popup", "src/background", "src/lib"]) {
    for (const f of fs.readdirSync(path.join(root, dir))) if (f.endsWith(".js")) files.push(dir + "/" + f);
  }
  assert.ok(files.length >= 5, "шалгах файл олдсонгүй");
  for (const f of files) {
    const src = read(f);
    assert.ok(!OTHER_NET.test(src), f + ": XHR / sendBeacon / WebSocket / EventSource байна");
    const n = (src.match(/\bfetch\s*\(/g) || []).length;
    const allow = ALLOWED_FETCH[f];
    if (allow) {
      assert.ok(n <= allow.max, f + ": fetch дуудлага " + n + " (зөвшөөрсөн " + allow.max + ")");
      assert.ok(src.includes(allow.mustContain), f + ": fetch нь " + allow.mustContain + " -аар өргөтгөлийн өөрийн файлыг л унших ёстой");
    } else {
      assert.strictEqual(n, 0, f + ": fetch() дуудлага байна — гадаад сүлжээнд хандахыг хориглоно");
    }
  }
});
