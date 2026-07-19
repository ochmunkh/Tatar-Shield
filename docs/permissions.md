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
