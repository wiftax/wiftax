# Our own tax

A site that grades other people's authentication should publish its own. This page lists every long-lived credential wif.tax is forced to hold, and who is forcing us. The target number is zero.

| Credential | Held because | Grade we would give ourselves |
|---|---|---|
| GitHub App private key for Sisyphus | GitHub Apps authenticate with a static RSA key that never expires. There is no federated path for an App to mint its own installation tokens. | C, same as the [GitHub card](/p/github-api/) |

## What we got to zero

- **Anthropic API.** Sisyphus authenticates with workload identity federation from GitHub Actions' OIDC issuer. No API key exists.
- **Cloudflare.** The site deploys through Cloudflare's GitHub integration. We hold no Cloudflare API token. DNS is edited by a human in a browser with a passkey, because a Terraform pipeline would need a static token.
- **GitHub Actions.** The CI on the data repo runs on the default `GITHUB_TOKEN`, which lives for one job.

## Human logins

Humans log in to GitHub, Cloudflare, the registrar, and email with passkeys or hardware keys, and 2FA is required on the GitHub org. Humans are sso.tax's department, but we mention it because you would ask.

This page is updated whenever the list above changes. If you spot a credential we forgot, that is a valid dispute.
