# The wif.tax Rubric (v0)

wif.tax grades **how a product lets machines authenticate**. Humans logging in with
SSO is [sso.tax](https://sso.tax)'s problem. We only care about workloads: CI jobs,
services, agents, cron, anything that is not a person at a keyboard.

The question for every product is the same: **can I use this without holding a
long-lived secret?** If the answer is no, the product is charging you a tax. You pay
it in rotation toil, in vault sprawl, and eventually in an incident.

## Unit of assessment

One YAML file per **product**, not per vendor. AWS is two hundred products. Datadog
is one product with a hundred integrations. Where a vendor's products differ
materially in auth, they get separate files. "Our other API supports OIDC" is not a
defense for the one that does not.

Each product is graded on two **surfaces**. Each surface gets its own letter. The
product's headline grade is the **lower** of the two, because the weakest link is
the one that leaks.

## Surface 1: Inbound

*How my workload authenticates to the product's API or control plane.*

| Grade | Meaning |
|---|---|
| **A** | **Bring-your-own-issuer federation.** The product accepts a short-lived token from any OIDC issuer I configure, and lets me constrain trust by issuer, subject, and audience. No long-lived secret exists anywhere in the path. |
| **B** | **Allowlisted federation.** Federation works, but only from a fixed list of issuers the vendor chose (typically GitHub Actions, GitLab, and the big three clouds). I cannot bring my own issuer. |
| **C** | **Short-lived from a static root.** The product issues short-lived tokens, but bootstrapping them requires a long-lived static secret (OAuth2 client secret, service account private key, static mTLS client cert with no federation). Better than raw keys, still a secret to rotate. |
| **D** | **Static keys, decent hygiene.** Only long-lived keys are available, but the vendor passes at least 3 of the 5 hygiene checks below. |
| **F** | **Static keys, no hygiene.** Long-lived keys, and fewer than 3 hygiene checks pass. The key you create today will work in 2031 unless someone remembers. |

Notes:

- Ambient identity for workloads running *inside* the vendor's own platform (EC2
  instance roles, GCE metadata, Azure managed identity, Kubernetes projected tokens)
  is table stakes and does **not** by itself earn an A. The inbound grade is about
  workloads running anywhere.
- Personal access tokens, "app passwords", and "auth tokens" are static keys no
  matter what the vendor calls them.
- If the top grade requires an enterprise tier, record it in `tier_gated` and grade
  the product at the top grade anyway. The scoreboard shows the gate. Charging for
  security is sso.tax's beat, but we will point at it.

## Surface 2: Outbound

*How the product reaches into **my** infrastructure (cloud accounts, repos, other
SaaS) on my behalf.*

| Grade | Meaning |
|---|---|
| **A** | **Keyless into every cloud it supports.** Cross-account IAM role with external ID (AWS), service account impersonation or federation (GCP), federated credential on a multi-tenant app (Azure), or the product is itself an OIDC issuer I can trust. No long-lived secret is exchanged. |
| **B** | **Keyless for some, keys for others.** Keyless on at least one supported cloud, but at least one integration still wants a static key. |
| **C** | **Short-lived from a static root.** Access is via short-lived tokens, but the setup requires me to hand over a long-lived secret (for example, an OAuth refresh token minted from a client secret I manage). |
| **D** | **Static keys with guidance.** The integration wants a static key, but the vendor documents least-privilege policy, supports scoped keys, and explains rotation. |
| **F** | **"Paste your access key here."** The integration wants a long-lived, broadly scoped credential, with no least-privilege guidance. |
| **N/A** | The product never needs access into my infrastructure. |

A product with an N/A outbound surface is graded on inbound alone.

## Hygiene checks

Applied to any long-lived credential the product still issues. Each is a yes/no
with a citation. They decide D versus F, and they are shown on every card so a
vendor stuck at D or F still has something to fix this quarter.

| Check | Passes when |
|---|---|
| `expiry` | Keys can be given an expiry, **and** the default or an org policy can enforce one. A field that defaults to "never" and cannot be forced counts as a fail. |
| `rotation_api` | A key can be created and revoked through the API, so rotation can be automated without a browser. |
| `scoping` | A key can be limited to a subset of permissions or resources, not just "everything the owner can do". |
| `last_used` | The vendor shows when a key was last used, so dead keys can be found and killed. |
| `leak_revocation` | The vendor participates in a secret-scanning partner program (GitHub's, at minimum) so a key leaked to a public repo is revoked automatically. |

## Evidence

Every grade and every hygiene check needs a receipt: a URL to vendor documentation
or a vendor statement, and the date it was checked. No receipt, no grade. A grade
only changes when the receipts change. This is the rule that keeps us factual, and
it is exactly the input the crawler agent produces.

`checked_on` must be within the last 12 months or the card is flagged **stale**.

## Status

| Status | Meaning |
|---|---|
| `listed` | Graded and current. |
| `graduated` | Was D or F, now A or B, with the date. Vendors that fix it get a permanent gold star. Exit paths make shame lists work. |
| `disputed` | The vendor has contested the grade and we are re-checking. Shown, with the vendor's statement. |

## What we do not grade (yet)

- Human login. See sso.tax.
- Price. See sso.tax again.
- Whether the federation implementation is any good (audience validation, key
  rotation on the issuer side). v1 problem.
- A single "tax" number in the style of sso.tax's percentage. We have not found one
  that is not made up. Open question in `README.md`.
