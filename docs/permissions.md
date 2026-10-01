# Permission Justification (Chrome Web Store review)

| Permission | Why it is required |
|------------|--------------------|
| `storage` | Store the user's personal block/allow list and the per-tab risk result locally. No remote storage. |
| `activeTab` | Read the active tab's URL (hostname) so the popup can show the risk of the site the user is currently on. |
| `content_scripts` on `<all_urls>` | The core function is phishing protection, which requires checking the domain of **every** site the user visits (bank look-alikes can be hosted anywhere). Only the hostname is analyzed locally; page content is never read, collected, or transmitted. |

**No** `tabs` (broad), `webRequest`, `cookies`, `history`, or host data-collection
permissions are used. The extension is fully offline and privacy-preserving.

## Data usage disclosure (for the store form)
- Does the extension collect user data? **No.**
- Remote code? **No** (all code is bundled).
- Sold/transferred data? **No.**

---

<h2 id="mongol">🇲🇳 Монголоор</h2>

> Энэ баримтын англи хэсэг нь Chrome Web Store-ын шалгагчид зориулагдсан тул
> эхэндээ үлдээв. Доорх нь Монгол хэлтэй хувь нэмэр оруулагчдад зориулсан ижил
> агуулга.

# Эрх бүрийн үндэслэл (Chrome Web Store-ын хяналт)

| Эрх | Яагаад шаардлагатай вэ |
|-----|------------------------|
| `storage` | Хэрэглэгчийн өөрийн блок/зөвшөөрлийн жагсаалт болон таб тус бүрийн эрсдэлийн дүнг **локал** хадгална. Алсын сервер дээр юу ч хадгалахгүй. |
| `activeTab` | Идэвхтэй табын URL (hostname)-ыг уншиж, popup дээр тухайн сайтын эрсдэлийг харуулна. |
| `<all_urls>` дээрх `content_scripts` | Үндсэн үүрэг нь фишингээс хамгаалах бөгөөд үүнд хэрэглэгчийн зочилж буй **бүх** сайтын домэйныг шалгах шаардлагатай (банкны дуураймал хаяг хаана ч байрлаж болно). Зөвхөн hostname-ыг локал шинжилнэ; хуудасны агуулгыг уншихгүй, цуглуулахгүй, дамжуулахгүй. |

Өргөтгөл нь `tabs` (өргөн хүрээт), `webRequest`, `cookies`, `history` зэрэг эрх,
мөн өгөгдөл цуглуулах ямар ч эрх **ашигладаггүй**. Бүрэн офлайн ажиллаж,
нууцлалыг хадгална.

## Өгөгдөл ашиглалтын мэдэгдэл (дэлгүүрийн маягтад)
- Өргөтгөл хэрэглэгчийн өгөгдөл цуглуулдаг уу? **Үгүй.**
- Алсын код ачаалдаг уу? **Үгүй** (бүх код дотор нь багтсан).
- Өгөгдлийг зарж/шилжүүлдэг үү? **Үгүй.**
