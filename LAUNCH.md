# Launch checklist

Everything on Cloudflare + GitHub. No Vercel, no socials, and the target for our own
static-secret count is **zero**. Anything we cannot get to zero goes on the
"our own tax" page, in public.

## 1. Accounts and ownership

- [ ] GitHub org `wiftax` (personal account as owner, personal email, nothing tied to an employer)
- [ ] Org settings: require 2FA, secret scanning + push protection on for all repos, Dependabot alerts on
- [ ] Cloudflare account on the same personal email, with a passkey or hardware key
- [ ] Registrar: all three domains in one account, registrar lock + auto-renew on, 2FA
- [ ] Transfer DNS for wif.tax, wiftax.org, rotate.fail to Cloudflare
- [ ] Licenses: `LICENSE` (Apache-2.0 for code) + `LICENSE-DATA` (CC BY 4.0 for `data/`)

## 2. Repos

- [ ] `wiftax/wiftax` — rubric, schema, data, site. This repo.
- [ ] Branch protection on `main`: PR required, CI required, no force push, CODEOWNERS review for `RUBRIC.md` and `schema/`
- [ ] `CODEOWNERS`, `CONTRIBUTING.md`, `SECURITY.md`, `CODE_OF_CONDUCT.md`
- [ ] Issue templates: new product, dispute (vendor), grade change
- [ ] `wiftax/sisyphus` — the crawler. Separate repo so its permissions are separate.

## 3. Cloudflare

- [ ] Pages project for the site, connected via Cloudflare's GitHub App (no API token in our hands)
- [ ] Custom domain wif.tax on Pages. wiftax.org → 301 to wif.tax via Redirect Rules
- [x] rotate.fail: Sisyphus's home. Shows the last patrol, open notices and unreachable hosts.
- [ ] DNSSEC on, CAA records (letsencrypt + digicert for Cloudflare-managed certs), HSTS with preload, TLS 1.2 minimum
- [ ] Email Routing: `hello@`, `disputes@`, `security@` → Gmail
- [ ] Web Analytics (cookieless). No other trackers, ever.
- [ ] `/.well-known/security.txt` and `/robots.txt` in the site
- [ ] DNS managed by hand in the dashboard for now. Terraform would need an API token, which is a static secret. Revisit when Cloudflare supports federated API auth (that is a card for the list).

## 4. Site (static, Pages)

- [ ] Scoreboard, product cards, rubric, dispute/takedown policy, "our own tax" page
- [ ] `/api/products.json` built from `data/` at deploy time
- [ ] Embeddable grade badges at `/badge/<id>.svg` (shields style). Vendors with an A will embed them.
- [ ] Per-product OG images generated at build time
- [ ] Sitemap + basic meta for search

## 5. Sisyphus (crawler)

- [x] Runs from this repo's `patrol` workflow on the job's `GITHUB_TOKEN`. No GitHub App, no private key.
- [x] Anthropic auth via Workload Identity Federation, pinned to this repo's `main` branch. No API key.
- [x] Opens a Notice of Assessment per grade change, one receipts refresh PR per patrol, and one issue per docs host that keeps blocking it. It never merges. Ever.
- [x] rotate.fail renders `patrol.json` from the `sisyphus-state` branch.

## 6. Policy pages (plain English, short)

- [ ] How grades work (links to RUBRIC.md)
- [ ] How to dispute: open a PR or email disputes@. Vendor statements shown verbatim
- [ ] Takedown: we remove factual errors with receipts, not opinions
- [ ] Editorial: products, never people

## 7. Before flipping DNS

- [ ] Ten cards validated and rendered, CoreWeave included
- [ ] Anthropic graded too, since we are using their federation and should show our work
- [ ] Read every card once more as if you were the vendor's lawyer
