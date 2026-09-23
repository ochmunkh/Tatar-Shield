# Chrome Web Store — Listing (English)

## Name
Tatar Shield — Phishing Protection

## Short description (max 132 chars)
Detects look-alike (phishing) domains of Mongolian banks & government sites and warns you in red before you lose your password.

## Detailed description
Tatar Shield is a lightweight, offline phishing-protection extension for Mongolian
users. All checks run locally in your browser — no data is collected, nothing is
sent to any server.

What it does:
• 🟢 Confirms official bank/government sites with a green check.
• 🟡 Warns about suspicious addresses with a yellow banner.
• 🔴 Blocks the whole page on fake (look-alike) sites, stopping you before you
  enter a password or OTP.

Attacks detected (v1.2.0):
• Mixed Cyrillic/Latin (IDN homograph) — e.g. кhanbank.mn (Cyrillic к)
• Bank names written in Cyrillic — e.g. ханбанк.мн
• Punycode domains (xn--) — e.g. xn--khanban-v2b.mn
• TLD squatting — e.g. khanbank.net (.mn → .net)
• Subdomain spoofing — e.g. khanbank.mn.evil.com
• @ userinfo spoofing — e.g. khanbank.mn@evil.com (real host: evil.com)
• Typosquatting / combosquatting — e.g. khanbnk.mn, secure-khanbank.com
• All subdomains of Mongolian banks auto-protected (*.khanbank.mn etc.)
• All Mongolian government sites auto-safe (*.gov.mn etc.)

Extra: users can block a suspicious site themselves or mark one as trusted.
All settings stay on your device only.

Privacy: collects no data, sends nothing to any server, no telemetry.
Uses only `storage` and `activeTab` permissions.

## Category
Productivity / Security

## Keywords
phishing, bank, security, Mongolia, protection, homograph, safe browsing, IDN
