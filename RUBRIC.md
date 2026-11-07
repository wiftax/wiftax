# The wif.tax Rubric (v0)

wif.tax grades **how a product lets machines authenticate**. The question for every product
is the same: **can I use this without holding a long-lived secret?**

If the answer is no, the product is charging you a tax. You pay it in rotation toil, vault
sprawl and, eventually, an incident.

## Unit of assessment

One YAML file per **product**, not per vendor. AWS is two hundred products. Datadog
is one product with a hundred integrations. When a vendor's products differ
materially in auth, each gets its own file. "Our other API supports OIDC" does not
defend the one that doesn't.

Each product is graded on two **surfaces**, and each surface gets its own letter. The
product's headline grade is the **lower** of the two, because the weakest link is
the one that leaks.

**Tier gates, both surfaces.** If the graded mechanism needs a paid or enterprise
tier, grade the mechanism anyway and record the tier in `tier_gated`. The
scoreboard shows the gate.

## Surface 1: Inbound

*How my workload authenticates to the product's API or control plane.*

| Grade | Meaning |
|---|---|
| **A** | **Bring-your-own-issuer federation.** The product accepts a short-lived token from any OIDC issuer I configure. I can constrain trust by issuer, subject and audience. No long-lived secret exists anywhere in the path. |
| **B** | **Allowlisted federation.** Federation works, but only from a fixed list of issuers the vendor chose, typically GitHub Actions, GitLab and the big three clouds. I cannot bring my own issuer. |
| **C** | **Short-lived from a static root.** The product issues short-lived tokens, but getting them requires a long-lived static secret. Examples are an OAuth2 client secret, a service account private key, or a static mTLS client cert with no federation. Better than raw keys, but still a secret to rotate. |
| **D** | **Static keys, decent hygiene.** Only long-lived keys are available, but the vendor passes at least 3 of the 5 hygiene checks below. |
| **F** | **Static keys, no hygiene.** Long-lived keys, and fewer than 3 hygiene checks pass. The key you create today will work in 2031 unless someone remembers. |

Notes:

- Ambient identity for workloads running *inside* the vendor's own platform (EC2
  instance roles, GCE metadata, Azure managed identity, Kubernetes projected tokens)
  is table stakes. It does **not** earn an A by itself. The inbound grade is about
  workloads running anywhere.
- Personal access tokens, "app passwords" and "auth tokens" are static keys, whatever
  the vendor calls them.
- Federation counts toward A or B only if it is **self-serve and documented for
  workloads**. If the vendor's support team has to switch it on, or it is documented
  only for human logins, the card notes it but it does not lift the grade.

## Surface 2: Outbound

*How the product reaches into **my** infrastructure (cloud accounts, repos, other
SaaS) on my behalf.*

| Grade | Meaning |
|---|---|
| **A** | **Keyless into every cloud it supports.** On AWS, a cross-account IAM role with external ID. On GCP, service account impersonation or federation. On Azure, a federated credential on a multi-tenant app. Or the product is itself an OIDC issuer I can trust. No long-lived secret is exchanged. |
| **B** | **Keyless for some, keys for others.** Keyless on at least one supported cloud, but at least one integration still wants a static key. |
| **C** | **Short-lived from a static root.** Access uses short-lived tokens, but setup requires me to hand over a long-lived secret, such as an OAuth refresh token minted from a client secret I manage. |
| **D** | **Static keys with guidance.** The integration wants a static key, but the vendor documents least-privilege policy, supports scoped keys and explains rotation. |
| **F** | **"Paste your access key here."** The integration wants a long-lived, broadly scoped credential and gives no least-privilege guidance. |
| **N/A** | The product never needs access into my infrastructure. |

A product with an N/A outbound surface is graded on inbound alone.

For SaaS, repos and other non-cloud integrations, an app the customer installs or
consents to counts as keyless, because no secret changes hands. Examples are a GitHub
App, Entra admin consent, and Atlassian or Slack app consent. A product whose only
integrations are consent-based apps like these can earn an A, even though it reaches
into no cloud.

## Hygiene checks

These apply to any long-lived credential the product still issues. Each is a yes/no
with a citation. They decide D versus F. Every card shows them, so a vendor stuck at
D or F still has something to fix this quarter.

| Check | Passes when |
|---|---|
| `expiry` | Keys can be given an expiry, **and** the default or an org policy can enforce one. A field that defaults to "never" and cannot be forced fails. |
| `rotation_api` | Keys can be created and revoked through the API, so rotation can be automated without a browser. |
| `scoping` | A key can be limited to a subset of permissions or resources, not just "everything the owner can do". A dedicated machine principal with its own least-privilege policy (IAM user, service account, app registration) counts. A key that inherits a human's full permissions does not. An ordinary user account created for a workload and given a narrow role counts only if the vendor documents a non-human or API-only account type. |
| `last_used` | The vendor shows when a key was last used, so dead keys can be found and killed. |
| `leak_revocation` | The vendor is in a secret-scanning partner program, GitHub's at minimum, so a key leaked to a public repo is revoked automatically. |

## Evidence

Every grade and every hygiene check needs a receipt. That is a URL to vendor
documentation or a vendor statement, plus the date it was checked. No receipt, no
grade. A grade changes only when the receipts change. This rule keeps us factual, and
it is exactly what the crawler produces.

`checked_on` must be within the last 12 months, or the card is flagged **stale**.

**Login-walled documentation.** If the docs that would settle a hygiene check are
behind a customer login, the check fails. No receipt, no pass. If those unverifiable
items could change the headline grade, the card also gets `confidence: low` with the
reason, and the site shows it. Vendors get credit by publishing the documentation.

## Status

| Status | Meaning |
|---|---|
| `listed` | Graded and current. |
| `graduated` | Was D or F, now A or B, with the date. Vendors that fix it get a permanent gold star. |
| `disputed` | The vendor has contested the grade and we are re-checking. Shown with the vendor's statement. |

## What we do not grade (yet)

- Human login. See sso.tax.
- Price. See sso.tax again.
- Whether the federation implementation is any good, such as audience validation or
  key rotation on the issuer side. That is a v1 problem.
- A single "tax" number like sso.tax's percentage. We have not found one that isn't
  made up. It is an open question in `README.md`.
