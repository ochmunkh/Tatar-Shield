# Нууцлалын бодлого / Privacy Policy — Tatar Shield

**Сүүлд шинэчилсэн: 2026-07**

## Монголоор

Tatar Shield нь **ямар ч хувийн мэдээлэл цуглуулдаггүй, хадгалдаггүй, дамжуулдаггүй.**

- Бүх шалгалт (домэйн, хаяг) таны хөтөч дотор **локал** хийгдэнэ.
- Гуравдагч этгээд болон бидний сервер рүү **ямар ч өгөгдөл илгээхгүй** (телеметр байхгүй).
- Таны үзсэн вэб хуудас, хайлт, түүх, нэвтрэх мэдээллийг **цуглуулахгүй, харахгүй**.
- Хэрэглэгчийн "блок"/"найдвартай" жагсаалт зөвхөн таны төхөөрөмж дээр
  (`chrome.storage.local`) хадгалагдана, хаана ч илгээгдэхгүй.

**Ашигладаг зөвшөөрөл:**
- `storage` — таны жагсаалт болон таб бүрийн үр дүнг локал хадгалах.
- `activeTab` — идэвхтэй табын хаягийг шалгах.
- `<all_urls>` (content script) — сайт бүрийн домэйныг фишинг эсэхийг шалгах.
  (Хуудасны агуулгыг цуглуулж, дамжуулдаггүй.)

## English

Tatar Shield **does not collect, store, or transmit any personal data.**

- All analysis runs **locally** in your browser.
- **No data** is sent to third parties or our servers (no telemetry).
- We do **not** collect or view your browsing history, searches, or credentials.
- The user block/allow list is stored only on your device (`chrome.storage.local`).

**Permissions used:** `storage` (local list & per-tab result), `activeTab` (read
active tab address), `<all_urls>` content script (check each site's domain for
phishing — page content is never collected or transmitted).

**Contact:** Enkhbat.O — Security Analyst
