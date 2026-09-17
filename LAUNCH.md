# Launch checklist

Everything on Cloudflare + GitHub. No Vercel, no socials, and the target for our own
static-secret count is **zero**. Anything we cannot get to zero goes on the
"our own tax" page, in public.

## 1. Accounts and ownership

- [ ] GitHub org `wiftax` (personal account as owner, personal email, nothing tied to an employer)
- [ ] Org settings: require 2FA, secret scanning + push protection on for all repos, Dependabot alerts on
- [ ] Cloudflare account on the same personal email; passkey or hardware key
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
- [ ] Custom domain wif.tax on Pages; wiftax.org → 301 to wif.tax via Redirect Rules
- [ ] rotate.fail: parked one-pager until Sisyphus ships, then it is his home
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

- [ ] GitHub App identity ("sisyphus[bot]"), installed only on `wiftax/wiftax`, permissions: contents write, pull requests write, nothing else
- [ ] Runs on GitHub Actions cron in `wiftax/sisyphus`
- [ ] Anthropic auth via Workload Identity Federation: federation rule trusting the GitHub Actions OIDC issuer for this repo, `ANTHROPIC_FEDERATION_RULE_ID` / `ANTHROPIC_ORGANIZATION_ID` / `ANTHROPIC_SERVICE_ACCOUNT_ID` / `ANTHROPIC_IDENTITY_TOKEN_FILE` set in the workflow. No API key.
- [ ] GitHub App private key is the one static secret left. Store it as an Actions secret, note it on the "our own tax" page, and open an issue asking GitHub for federated app auth.
- [ ] It opens PRs with evidence diffs and a proposed grade. It never merges. Ever.

## 6. Policy pages (plain English, short)

- [ ] How grades work (links to RUBRIC.md)
- [ ] How to dispute: open a PR or email disputes@; vendor statements shown verbatim
- [ ] Takedown: we remove factual errors with receipts, not opinions
- [ ] Editorial: products, never people

## 7. Before flipping DNS

- [ ] Ten cards validated and rendered, CoreWeave included
- [ ] Anthropic graded too, since we are using their federation and should show our work
- [ ] Read every card once more as if you were the vendor's lawyer
