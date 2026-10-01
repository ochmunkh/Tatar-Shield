#!/usr/bin/env node
/**
 * README-ийн хоёр хэлний хэсгийн БҮТЭЦ таарч байгаа эсэхийг шалгана.
 *
 * Энэ репозиторуудын README бүр хоёр хэлтэй бөгөөд хоёр тал нь ГАРААР
 * арчлагддаг. Практик дээр нэг талыг шинэчлээд нөгөөг нь мартдаг — git-ийн
 * түүхэнд яг ийм засварууд дахин дахин гарсан. Агуулгыг нь машинаар
 * харьцуулах боломжгүй (өөр хэл дээр байх нь зорилго), харин БҮТЭЦ нь таарах
 * ёстой: нэг тал дээр хэсэг нэмэгдвэл нөгөөд нь мөн нэмэгдэх ёстой.
 *
 * Шалгадаг зүйл:
 *   - гарчгийн тоо (түвшин тус бүрээр)
 *   - хүснэгтийн мөрийн тоо
 *   - ``` кодын блокийн тоо
 *
 * Хэрэглээ:  node scripts/check-readme-parity.js [README.md]
 * Гаралт  :  зөрвөл 1, таарвал 0.
 */
"use strict";

const fs = require("node:fs");
const path = require("node:path");

// Хоёр хэсгийн эхлэл. Энэ репод монгол хэсэг нь эхэлдэг.
const SECTIONS = [
  { name: "Монголоор", marker: /^#\s*(?:🇲🇳\s*)?Монголоор\s*$/m },
  { name: "English", marker: /^#\s*(?:🇬🇧\s*)?English\s*$/m },
];

function sliceSections(src) {
  const starts = SECTIONS.map((s) => {
    const m = src.match(s.marker);
    return { ...s, index: m ? m.index : -1 };
  });
  const missing = starts.filter((s) => s.index < 0);
  if (missing.length) {
    console.error(
      "check-readme-parity: хэсэг олдсонгүй: " +
        missing.map((m) => m.name).join(", ") +
        "\n  README-ийн хэсгийн гарчиг өөрчлөгдсөн бол энэ скриптийн SECTIONS-ыг зас."
    );
    process.exit(2);
  }
  const ordered = [...starts].sort((a, b) => a.index - b.index);
  return ordered.map((s, i) => ({
    name: s.name,
    body: src.slice(s.index, i + 1 < ordered.length ? ordered[i + 1].index : src.length),
  }));
}

function measure(body) {
  const lines = body.split("\n");
  const m = { h2: 0, h3: 0, h4: 0, tableRows: 0, codeBlocks: 0 };
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      if (!inFence) m.codeBlocks++;
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const h = line.match(/^(#{2,4})\s+\S/);
    if (h) m["h" + h[1].length]++;
    // Хүснэгтийн мөр: | ... | — тусгаарлагч мөрийг (|---|) тооцохгүй.
    if (/^\s*\|.*\|\s*$/.test(line) && !/^\s*\|[\s:|-]+\|\s*$/.test(line)) m.tableRows++;
  }
  return m;
}

function main() {
  const file = process.argv[2] || "README.md";
  const abs = path.resolve(file);
  if (!fs.existsSync(abs)) {
    console.error("check-readme-parity: файл алга: " + abs);
    process.exit(2);
  }
  const [a, b] = sliceSections(fs.readFileSync(abs, "utf8"));
  const ma = measure(a.body);
  const mb = measure(b.body);

  const LABEL = {
    h2: "## гарчиг",
    h3: "### гарчиг",
    h4: "#### гарчиг",
    tableRows: "хүснэгтийн мөр",
    codeBlocks: "кодын блок",
  };

  const problems = [];
  for (const k of Object.keys(LABEL)) {
    if (ma[k] !== mb[k]) {
      problems.push(
        `  ${LABEL[k].padEnd(16)} ${a.name}=${ma[k]}  ${b.name}=${mb[k]}  (зөрүү ${Math.abs(ma[k] - mb[k])})`
      );
    }
  }

  const summary =
    `${path.basename(file)}: ${a.name} [` +
    Object.keys(LABEL).map((k) => `${k}=${ma[k]}`).join(" ") +
    `]  vs  ${b.name} [` +
    Object.keys(LABEL).map((k) => `${k}=${mb[k]}`).join(" ") +
    "]";

  if (!problems.length) {
    console.log("check-readme-parity: OK — хоёр хэсгийн бүтэц таарч байна");
    console.log("  " + summary);
    process.exit(0);
  }

  console.error("check-readme-parity: ХОЁР ХЭСГИЙН БҮТЭЦ ЗӨРЖ БАЙНА");
  console.error(problems.join("\n"));
  console.error(
    "\n  Нэг талд хэсэг/хүснэгт/кодын блок нэмсэн бол нөгөөд нь ч нэм.\n" +
      "  Монгол текстийг машинаар орчуулж БОЛОХГҮЙ — хүн бичнэ.\n  " +
      summary
  );
  process.exit(1);
}

main();
