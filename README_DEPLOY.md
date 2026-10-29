# Unlock Private Wealth — Phase 1 Site Package

## What is included

- `index.html` — public acquisition landing page
- `blueprint/index.html` — post-submit Blueprint delivery page
- `assets/styles.css` — shared Denali visual system
- `assets/site.js` — live form integration
- `assets/private-wealth-blueprint-cover.png` — Blueprint cover artwork

## Live backend wiring

The landing-page form is wired to:

`https://yssidthemskvrlopgolj.supabase.co/functions/v1/blueprint-request`

The form sends the existing supported payload:

- first_name
- last_name
- email
- source_category
- source_detail
- landing_url
- market_intelligence_opt_in
- website (honeypot)

UTM parameters and the referring hostname are preserved inside `source_detail` without requiring a backend schema change.

## Local preview

Double-clicking `index.html` is fine for visual review, but browsers give `file://` pages an origin that the production Edge Function should not trust.

For a real local submission test, use VS Code Live Server on port 5500. The existing Edge Function allow-list already includes localhost:5500 and 127.0.0.1:5500.

Expected flow:

1. Open the landing page through Live Server.
2. Submit a real test email.
3. Supabase records the request.
4. Resend sends the Blueprint email.
5. Browser redirects to `/blueprint/`.
6. The delivery-page button opens the hosted PDF.

## Launch state

Canonical launch domain: `https://unlockmyprivatewealth.com/`

This package includes canonical tags, GitHub Pages `CNAME`, `robots.txt`, sitemap, 404, Privacy Policy, Terms of Use, and Investment Disclosures. The legal utility pages are an operational baseline and are explicitly marked in source for legal review before paid campaigns or material expansion of data collection.

Remaining launch actions:

1. Publish this folder as its own GitHub repository / GitHub Pages site.
2. Point `unlockmyprivatewealth.com` DNS to GitHub Pages and enable HTTPS.
3. Update Supabase secret `BLUEPRINT_DELIVERY_URL` to `https://unlockmyprivatewealth.com/blueprint/`, redeploy `blueprint-request`, and re-test.
4. Run a public end-to-end submission and verify contact, source, consent, event, email, redirect, PDF access, and mobile behavior.
5. Add Cloudflare Turnstile before paid traffic or meaningful campaign scale.
6. Build the real Investor Readiness experience before exposing a Readiness CTA from the delivery page.

## CTA language

- `Get` = acquisition
- `Explore` = pre-conversion education
- `Open` = post-conversion delivery

## Investor journey

Blueprint → Investor Readiness → Strategy Call → deal-specific communication → existing investor portal.
