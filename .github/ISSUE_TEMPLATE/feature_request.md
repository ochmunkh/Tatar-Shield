---
name: Санал / сайт нэмэх — Feature request / site list
about: Шинэ боломж санал болгох, эсвэл жагсаалтад сайт нэмэх — Suggest a feature, or a site for the allow/deny list
title: "[feat] "
labels: enhancement
---

<!--
  Монголоор эсвэл англиар бичиж болно. Аль нэгийг нь бөглөхөд хангалттай.
  Either language is fine — you only need to fill in one.
-->

## 🇲🇳 Монголоор

**Асуудал / шалтгаан**
Юу дутуу байна вэ? (Жишээ нь: жагсаалтад оруулах ёстой жинхэнэ банк/төрийн
домэйн, эсвэл блоклох ёстой фишингийн хэв маяг.)

**Санал болгож буй өөрчлөлт**
Өргөтгөл юу хийх ёстой вэ?

**Домэйн** (жагсаалттай холбоотой бол)
- Жинхэнэ домэйн: `example.gov.mn`
- Дуураймал / фишинг: `examp1e-gov.mn`

**Нэмэлт**
Эх сурвалж, дэлгэцийн зураг, offline/privacy талаас анхаарах зүйл.

> 💡 Банк нэмэхийг хүсвэл **албан ёсны домэйныг** нь бичиж өгөөрэй — жагсаалт нь
> `src/lib/banks.js` дотор байдаг ба шинэ бүртгэл бүрт тест шаарддаг
> ([CONTRIBUTING.md](../../CONTRIBUTING.md)).

---

## 🇬🇧 English

**Problem / motivation**
What is missing? (e.g. a legitimate bank/gov domain to allow-list, or a phishing pattern to block.)

**Proposed change**
What should the extension do?

**Domain(s)** (if list-related)
- Legitimate domain: `example.gov.mn`
- Look-alike / phishing: `examp1e-gov.mn`

**Notes**
References, screenshots, offline/privacy considerations.

> 💡 To add a bank, give its **official domain** — the list lives in
> `src/lib/banks.js` and every new entry needs a test
> ([CONTRIBUTING.md](../../CONTRIBUTING.md)).
