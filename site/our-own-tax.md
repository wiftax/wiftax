# Our own tax

A site that grades other people's authentication should publish its own. This page lists every long-lived credential wif.tax is forced to hold, and who is forcing us. The target number is zero.

| Credential | Held because | Grade we would give ourselves |
|---|---|---|
| None | — | A |

## What we got to zero

- **Anthropic API.** Sisyphus authenticates with workload identity federation from GitHub Actions' OIDC issuer. No API key exists.
- **GitHub.** Sisyphus used to open its pull requests as a GitHub App, which authenticates with a static RSA key that never expires. It now runs in this repo's Actions on the default `GITHUB_TOKEN`, which lives for one job. The App and its key are deleted.
- **Cloudflare.** The site deploys through Cloudflare's GitHub integration. We hold no Cloudflare API token. DNS is edited by a human in a browser with a passkey, because a Terraform pipeline would need a static token.
- **GitHub Actions.** The CI on the data repo runs on the default `GITHUB_TOKEN`, which lives for one job.

## Human logins

Humans log in to GitHub, Cloudflare, the registrar and email with passkeys or hardware keys. The GitHub org requires 2FA. Human login is sso.tax's department, but you would ask.

This page is updated whenever the list above changes. If you spot a credential we forgot, that is a valid dispute.
