// Хувилбарын НЭГ эх сурвалж.
//
// Өргөтгөлийн хувьд manifest.json бол цорын ганц эрх бүхий эх сурвалж: хөтөч
// өөрөө үүнийг уншдаг, дэлгүүрийн жагсаалт үүгээр хувилбарладаг. Бусад бүх
// газар (package.json, CHANGELOG, README) үүнтэй ТААРАХ ёстой.
//
// Энэ тест яагаад хэрэгтэй вэ: өмнө нь git tag v1.0.0 байхад manifest 1.2.0
// байсан — өөрөөр хэлбэл хүргэгдсэн өргөтгөл ямар хувилбар болох нь хоёр
// өөр хариулттай байв.
"use strict";
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");
const readJson = (p) => JSON.parse(read(p).replace(/^﻿/, ""));

const MANIFEST_VERSION = readJson("manifest.json").version;

test("manifest.json нь зөв хэлбэрийн хувилбартай (эх сурвалж)", () => {
  assert.match(MANIFEST_VERSION, /^\d+\.\d+(\.\d+)?$/,
    "manifest.json-ийн version нь 1.2.0 маягийн байх ёстой, гарсан: " + MANIFEST_VERSION);
});

test("package.json нь manifest.json-той таарна", () => {
  assert.strictEqual(readJson("package.json").version, MANIFEST_VERSION,
    "package.json-ийн version нь manifest.json-тай таарах ёстой");
});

test("CHANGELOG-ийн хамгийн сүүлийн ГАРСАН хувилбар нь manifest-тай таарна", () => {
  // "Unreleased"/"Хувилбарлагдаагүй" гарчгийг алгасаад эхний бодит хувилбарыг авна.
  const headings = read("CHANGELOG.md")
    .split("\n")
    .filter((l) => /^##\s/.test(l))
    .filter((l) => !/unreleased|хувилбарлагдаагүй/i.test(l));
  assert.ok(headings.length, "CHANGELOG-д гарсан хувилбарын гарчиг олдсонгүй");
  const m = headings[0].match(/(\d+\.\d+(?:\.\d+)?)/);
  assert.ok(m, "CHANGELOG-ийн эхний гарчгаас хувилбар олдсонгүй: " + headings[0]);
  assert.strictEqual(m[1], MANIFEST_VERSION,
    "CHANGELOG-ийн сүүлийн гарсан хувилбар (" + m[1] + ") нь manifest.json (" +
    MANIFEST_VERSION + ")-тай таарах ёстой. Гаргахдаа хоёуланг нь зэрэг шинэчил.");
});

test("README-д дурдсан хувилбарууд manifest-тай зөрчилдөхгүй", () => {
  // README-д өөр НЭГ semver дурдагдвал хуучирсан гэсэн үг. Түүхэн тэмдэглэл
  // (v1.1 гэх мэт) биш, БҮТЭН x.y.z хэлбэрийг л шалгана.
  const found = [...read("README.md").matchAll(/\b(\d+\.\d+\.\d+)\b/g)].map((x) => x[1]);
  const wrong = [...new Set(found)].filter((v) => v !== MANIFEST_VERSION);
  assert.deepStrictEqual(wrong, [],
    "README-д manifest.json (" + MANIFEST_VERSION + ")-аас өөр хувилбар бичигдсэн: " + wrong.join(", "));
});
