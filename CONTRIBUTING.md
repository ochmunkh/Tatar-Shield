# Хувь нэмэр оруулах / Contributing

## Банкны жагсаалт шинэчлэх

`src/lib/banks.js` файлын `BANKS` массивт зөвхөн **баталгаажсан, албан ёсны**
домайн нэмнэ үү (эх сурвалж: Монголбанк болон банк тус бүрийн албан ёсны сайт).

```js
{ name: "Банкны нэр", domains: ["undsen.mn"] },
```

Кирилл нэрийн хуурамчийг илрүүлэхийн тулд `CYRILLIC` объектод нэмнэ:

```js
"ханбанк": "Хаан Банк",
```

**Subdomain бодлого:** `banks.js`-д бүртгэсэн домайны subdomain бүгд
`isOfficialSubdomain()` функцаар автоматаар аюулгүй гэж тооцогдоно.
Жишээ: `khanbank.mn` нэмсэн бол `internet.khanbank.mn`, `app.khanbank.mn`
бүгд ногоон баталгаатай болно. `mta.gov.mn`, `ndaatgal.gov.mn` зэрэг
төрийн сайтуудыг тусад нь нэмэх шаардлагагүй — `gov.mn` нэг мөрт хангалттай.

---

## Илрүүлэлтийн давхаргууд (L1 офлайн)

Tatar Shield нь дараах **L1 офлайн** шалгалтуудыг хэрэгжүүлдэг —
интернэт болон гадаад API шаардахгүй:

| # | Шалгалт | Файл | Жишээ |
|---|---------|------|-------|
| 1 | IDN Homograph | `idn.js` | `кhanbank.mn` (кирилл к) |
| 2 | Punycode домайн | `idn.js` | `xn--khanban-v2b.mn` |
| 3 | TLD Squatting | `idn.js` | `khanbank.net` (.mn → .net) |
| 4 | Typosquatting | `idn.js` | `khanbnk.mn` |
| 5 | Combo Squatting | `idn.js` | `secure-khanbank.com` |
| 6 | Subdomain Spoofing | `idn.js` | `khanbank.mn.evil.com` |
| 7 | Кирилл банкны нэр | `banks.js` | `ханбанк.мн` |
| 8 | Wildcard subdomain | `banks.js` | `*.gov.mn`, `*.khanbank.mn` |
| 9 | @ userinfo заль | `content.js` | `khanbank.mn@evil.com` |

---

## Тест

```bash
# Node.js-ээр шалгах
node -e "
  require('./src/lib/banks.js');
  require('./src/lib/idn.js');
  console.log(TATAR_IDN.analyzeHost('кhanbank.mn'));
"
```

Браузерт: `test/logic-test.html`-ийг нээхэд бүх кейс PASS байна.

---

## Дүрэм

- Гуравдагч этгээдийн сервер рүү өгөгдөл илгээхгүй (offline-first).
- Шинэ зөвшөөрөл (permission) нэмэхээс зайлсхийх.
- Шинэ илрүүлэлт нэмэхдээ `test/logic-test.html`-д тест кейс нэмэх.
