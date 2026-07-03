# Portfolio Wire-Up Notes

Domain: swain.pro
Firebase app: swain-pro
Cloudflare type: Pages
Known audit gap: Needs robots.txt optimization
Niche: Professional Portfolio

## Required manual dashboard checks

- Confirm Cloudflare custom domain binding.
- Confirm Pages/Worker production branch.
- Confirm Cloudflare environment variables exist without exposing values.
- Confirm GA4 stream exists.
- Confirm Search Console property exists.
- Confirm AdSense publisher line before replacing ads.txt.
- Confirm Firebase authorized domains for Auth.
- Confirm Firestore rules before publishing.

## Do not auto-run

- Do not deploy production without approval.
- Do not change DNS without approval.
- Do not enable billing.
- Do not publish Firebase rules without approval.
