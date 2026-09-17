# wif.tax scoreboard

Generated from `data/products/` by `npm run render`. Do not edit by hand.

Hygiene columns: expiry · rotation API · scoping · last-used · leak revocation. "·" means no static credential exists to check.

| Grade | Vendor | Product | Inbound | Outbound | Hygiene | Status | Checked |
|---|---|---|---|---|---|---|---|
| **💀 F** | CoreWeave | [Control-plane API (api.coreweave.com, Terraform provider, kubeconfigs)](data/products/coreweave-api.yaml) | 💀 F | — | `✓ ✗ ✗ ✗ ✗` | listed | 2026-09-16 |
| **🔴 D** | Cloudflare | [API / API tokens](data/products/cloudflare-api.yaml) | 🔴 D | 🟡 B | `✗ ✓ ✓ ✓ ✓` | listed | 2026-09-16 |
| **🔴 D** | Twilio | [REST API](data/products/twilio-api.yaml) | 🟠 C | 🔴 D | `✗ ✓ ✓ ✗ ✓` | listed | 2026-09-16 |
| **🟠 C** | Anthropic | [Claude API](data/products/anthropic-api.yaml) | 🟢 A | 🟠 C | `✓ ✗ ✓ ✗ ✓` | listed | 2026-09-17 |
| **🟠 C** | GitHub | [REST/GraphQL API and Actions](data/products/github-api.yaml) | 🟠 C | 🟢 A | `✓ ✗ ✓ ✓ ✓` | listed | 2026-09-16 |
| **🟡 B** | Datadog | [API (API keys + application keys)](data/products/datadog-api.yaml) | 🟡 B | 🟡 B | `✗ ✓ ✓ ✓ ✓` | listed | 2026-09-16 |
| **🟡 B** | HashiCorp | [Vault (self-managed and HCP Vault Dedicated)](data/products/hashicorp-vault.yaml) | 🟢 A | 🟡 B | `✓ ✓ ✓ ✗ ✗` | listed | 2026-09-16 |
| **🟢 A** | Amazon Web Services | [IAM / STS](data/products/aws-iam.yaml) | 🟢 A | 🟢 A | `✗ ✓ ✓ ✓ ✓` | listed | 2026-09-16 |
| **🟢 A** | CoreWeave | [CKS (Kubernetes Service)](data/products/coreweave-cks.yaml) | 🟢 A | 🟢 A | `✓ ✗ ✗ ✗ ✗` | listed | 2026-09-16 |
| **🟢 A** | CoreWeave | [AI Object Storage](data/products/coreweave-object-storage.yaml) | 🟢 A | — | `✗ ✓ ✗ ✗ ✗` | listed | 2026-09-16 |
| **🟢 A** | Google Cloud | [IAM / Workload Identity Federation](data/products/google-cloud-iam.yaml) | 🟢 A | 🟢 A | `✓ ✓ ✓ ✓ ✓` | listed | 2026-09-16 |
| **🟢 A** | Microsoft Azure | [Entra ID workload identities](data/products/azure-entra-workload-identity.yaml) | 🟢 A | 🟢 A | `✓ ✓ ✓ ✓ ✓` | listed | 2026-09-16 |
| **🟢 A** | Snowflake | [Data Cloud](data/products/snowflake.yaml) | 🟢 A | 🟢 A | `✓ ✓ ✓ ✓ ✓` | listed | 2026-09-16 |

## Cards

### 💀 F CoreWeave Control-plane API (api.coreweave.com, Terraform provider, kubeconfigs)

This card is the control plane only: the API that creates CKS clusters and VPCs, the Terraform provider, and managed-auth kubeconfigs. Its one credential is a static, user-scoped API Access Token minted by hand in the Cloud Console, with almost no hygiene around it. CoreWeave's CKS and AI Object Storage cards grade very differently; see those.

- **Inbound F:** A static, user-scoped API Access Token created in the Cloud Console (CW-SECRET-... via COREWEAVE_API_TOKEN for Terraform); no federation path exists into api.coreweave.com.
- **Outbound N/A:** The control plane never needs access to customer infrastructure.
- **Receipts:** [docs.coreweave.com](https://docs.coreweave.com/docs/products/cks/auth-access/managed-auth/api-access), [docs.coreweave.com](https://docs.coreweave.com/docs/products/cks/auth-access/manage-api-access-tokens), [docs.coreweave.com](https://docs.coreweave.com/support/cks/articles/what-is-the-difference-between-managed-auth-and-unmanaged-auth.md), [docs.coreweave.com](https://docs.coreweave.com/docs/products/cks/reference/cks-api)

### 🔴 D Cloudflare API / API tokens

The Cloudflare API runs on static bearer tokens that, by default, never expire. They are at least well scoped, fully manageable over the API, show last use, and get revoked when they leak to GitHub. Logpush writes to your S3 or GCS bucket without a key, but the R2 migration tools still ask you to paste AWS access keys.

- **Inbound D:** Static API token (user-owned or account-owned service principal) scoped by permission group and resource, with optional TTL and client-IP restriction. No OIDC or token exchange for API calls.
- **Outbound B:** Logpush is keyless: you grant a Cloudflare-owned IAM principal (S3 bucket policy) or service account (GCS bucket IAM) write access. R2 Super Slurper and Sippy migrations want a static IAM access key or GCP service-account JSON key, with a documented least-privilege policy.
- **Receipts:** [developers.cloudflare.com](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/), [developers.cloudflare.com](https://developers.cloudflare.com/fundamentals/api/get-started/account-owned-tokens/), [developers.cloudflare.com](https://developers.cloudflare.com/fundamentals/api/get-started/keys/), [developers.cloudflare.com](https://developers.cloudflare.com/logs/get-started/enable-destinations/aws-s3/), [developers.cloudflare.com](https://developers.cloudflare.com/logs/get-started/enable-destinations/google-cloud-storage/), [developers.cloudflare.com](https://developers.cloudflare.com/r2/data-migration/super-slurper/), [developers.cloudflare.com](https://developers.cloudflare.com/r2/data-migration/sippy/)

### 🔴 D Twilio REST API

No federation: the best you get is an OAuth client-credentials flow (public beta) that still starts from a client secret, or API keys that never expire. Twilio itself is a good citizen about scoping and secret scanning. Sending recordings to your S3 bucket means handing it an IAM user's access key.

- **Inbound C:** OAuth 2.0 client-credentials grant (public beta) exchanges a Console-issued Client ID and Client Secret for short-lived access tokens; otherwise a static API Key SID + Secret or the Account SID + Auth Token.
- **Outbound D:** External S3 storage for Voice and Video recordings takes an IAM user's access key ID and secret access key, stored as a Twilio CredentialAWS resource; Twilio publishes a deny-everything-except-s3:PutObject IAM policy but no rotation guidance.
- **Receipts:** [www.twilio.com](https://www.twilio.com/en-us/changelog/oauth-public-beta), [www.twilio.com](https://www.twilio.com/docs/iam/oauth-apps/overview), [www.twilio.com](https://www.twilio.com/docs/iam/api-keys), [www.twilio.com](https://www.twilio.com/docs/voice/recording-settings), [www.twilio.com](https://www.twilio.com/docs/iam/credentialaws-resource), [www.twilio.com](https://www.twilio.com/docs/video/tutorials/storing-aws-s3)

### 🟠 C Anthropic Claude API

A workload can trade a JWT from any OIDC issuer you register (subject, audience, claim and CEL constraints) for a short-lived token bound to a service account, so no sk-ant key has to exist. Static API keys remain, can be forced to expire by org policy, but cannot be minted over the API. Anthropic-hosted agents reach back into your systems only on bearer tokens you hand over. wif.tax runs on this API, and it was graded like everything else.

- **Inbound A:** Workload Identity Federation: register a federation issuer (issuer_url plus JWKS via OIDC discovery, an explicit JWKS URL, or an inline key set), bind it to a service account with a federation rule that matches subject_prefix, audience, exact claims and/or a CEL condition, then exchange the IdP JWT at POST /v1/oauth/token (RFC 7523 jwt-bearer) for a short-lived sk-ant-oat01 access token; the SDKs do the exchange and refresh when ANTHROPIC_FEDERATION_RULE_ID, ANTHROPIC_ORGANIZATION_ID, ANTHROPIC_SERVICE_ACCOUNT_ID and ANTHROPIC_IDENTITY_TOKEN_FILE (or ANTHROPIC_IDENTITY_TOKEN) are set.
- **Outbound C:** Every path back into your systems is a bearer credential you hand Anthropic. Best case is a Managed Agents vault mcp_oauth credential (access token plus refresh token and client secret that Anthropic refreshes for you) or a short-lived token you mint yourself and pass per request to the Messages API MCP connector; the rest are static: vault static_bearer tokens, environment_variable secrets substituted at egress, GitHub personal access tokens for mounted repos, and MCP tunnel tokens. No cloud IAM role, service-account impersonation or OIDC federation exists for the agent to reach AWS, GCP or Azure.
- **Receipts:** [platform.claude.com](https://platform.claude.com/docs/en/manage-claude/workload-identity-federation), [platform.claude.com](https://platform.claude.com/docs/en/api/beta/organization/federation/issuers/create), [platform.claude.com](https://platform.claude.com/docs/en/api/beta/organization/federation/rules/create), [platform.claude.com](https://platform.claude.com/docs/en/manage-claude/wif-reference), [platform.claude.com](https://platform.claude.com/docs/en/manage-claude/authentication), [platform.claude.com](https://platform.claude.com/docs/en/agents-and-tools/mcp-connector), [platform.claude.com](https://platform.claude.com/docs/en/managed-agents/vaults), [platform.claude.com](https://platform.claude.com/docs/en/managed-agents/github), [platform.claude.com](https://platform.claude.com/docs/en/agents-and-tools/mcp-tunnels/overview), [platform.claude.com](https://platform.claude.com/docs/en/agents-and-tools/mcp-tunnels/security)

### 🟠 C GitHub REST/GraphQL API and Actions

Nothing outside GitHub can federate into the GitHub API: you hold a personal access token or a GitHub App private key, and the App key at least buys you one-hour installation tokens. In the other direction GitHub Actions is a proper OIDC issuer, so your workflows reach AWS, GCP, Azure and Vault without a single stored key.

- **Inbound C:** GitHub App: a JWT signed with a long-lived private key is exchanged for a one-hour installation access token. Personal access tokens (classic and fine-grained) are static keys.
- **Outbound A:** GitHub Actions is an OIDC issuer (https://token.actions.githubusercontent.com); AWS, GCP, Azure, Vault and any other OIDC-aware target trust it by sub and aud claims and hand back a short-lived credential, so no cloud secret is stored in GitHub.
- **Receipts:** [docs.github.com](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/generating-an-installation-access-token-for-a-github-app), [docs.github.com](https://docs.github.com/en/apps/creating-github-apps/authenticating-with-a-github-app/managing-private-keys-for-github-apps), [docs.github.com](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens), [docs.github.com](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

### 🟡 B Datadog API (API keys + application keys)

API and application keys never expire, but Datadog now lets an AWS-identified workload skip them entirely (Terraform provider for everyone, the Agent on Enterprise). Into your clouds it is keyless almost everywhere; AWS China and GovCloud-on-a-commercial-site still want access keys.

- **Inbound B:** Workload Identity Federation maps an AWS identity (proved via a signed STS GetCallerIdentity request) to a Datadog service account and issues a temporary JWT; every other client uses a static API key plus a static application key.
- **Outbound B:** Cross-account IAM role with External ID (AWS commercial), service account impersonation (GCP), and a federated credential / OIDC workload identity on an app registration or the Azure Native managed identity (Azure); AWS China and GovCloud-on-commercial still require static access keys and Azure still offers a client-secret path.
- **Receipts:** [docs.datadoghq.com](https://docs.datadoghq.com/account_management/workload_identity_federation/), [docs.datadoghq.com](https://docs.datadoghq.com/account_management/api-app-keys/), [docs.datadoghq.com](https://docs.datadoghq.com/developers/integrations/oauth_for_integrations/), [docs.datadoghq.com](https://docs.datadoghq.com/integrations/guide/aws-manual-setup/), [docs.datadoghq.com](https://docs.datadoghq.com/integrations/amazon_web_services/), [docs.datadoghq.com](https://docs.datadoghq.com/integrations/google_cloud_platform/), [docs.datadoghq.com](https://docs.datadoghq.com/integrations/guide/azure-manual-setup/), [docs.datadoghq.com](https://docs.datadoghq.com/integrations/guide/azure-native-manual-setup/)

### 🟡 B HashiCorp Vault (self-managed and HCP Vault Dedicated)

Vault's JWT/OIDC auth method trusts any issuer you configure, so nothing needs a static Vault credential to get in. Going out, the AWS, GCP and Azure secrets engines can run keyless via plugin workload identity federation, but only on Vault Enterprise or HCP, and the remaining engines still want a static (rotatable) root credential.

- **Inbound A:** The JWT/OIDC auth method validates tokens from any issuer (OIDC discovery URL, JWKS URL or static public keys) with bound_audiences, bound_subject and bound_claims per role; native AWS, GCP, Azure and Kubernetes auth methods cover platform identities.
- **Outbound B:** Plugin workload identity federation: Vault acts as an OIDC issuer and the AWS, GCP and Azure secrets engines exchange its identity token for cloud credentials with no static root key. Other engines (AliCloud, databases, and everything on Community Edition) still need a static root credential that Vault can rotate.
- **Receipts:** [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/auth/jwt), [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/auth/aws), [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/secrets/aws), [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/secrets/gcp), [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/secrets/azure), [developer.hashicorp.com](https://developer.hashicorp.com/vault/tutorials/enterprise/plugin-workload-identity-federation), [developer.hashicorp.com](https://developer.hashicorp.com/hcp/docs/vault), [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/secrets/alicloud), [developer.hashicorp.com](https://developer.hashicorp.com/vault/docs/secrets/databases)

### 🟢 A Amazon Web Services IAM / STS

Register any OIDC issuer as an IAM identity provider and AssumeRoleWithWebIdentity trades its token for an hour of credentials with no key on disk; since outbound identity federation shipped, your roles can mint JWTs for everyone else too. IAM user access keys still never expire, so try not to make any.

- **Inbound A:** IAM OIDC identity provider (any issuer with an OIDC discovery document and JWKS) plus sts:AssumeRoleWithWebIdentity; the role trust policy pins issuer, audience (aud/azp) and subject with <issuer>:aud and <issuer>:sub condition keys.
- **Outbound A:** IAM outbound identity federation: any IAM principal with sts:GetWebIdentityToken permission gets a short-lived (60-3600 s) STS-signed JWT with a chosen audience, verifiable at an account-specific OIDC issuer URL with discovery and JWKS endpoints.
- **Receipts:** [docs.aws.amazon.com](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_create_oidc.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_policies_iam-condition-keys.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/STS/latest/APIReference/API_AssumeRoleWithWebIdentity.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/IAM/latest/UserGuide/reference_iam-quotas.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_outbound.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/STS/latest/APIReference/API_GetWebIdentityToken.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_outbound_getting_started.html), [docs.aws.amazon.com](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_roles_providers_outbound_token_claims.html), [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation), [docs.aws.amazon.com](https://docs.aws.amazon.com/eks/latest/userguide/enable-iam-roles-for-service-accounts.html), [docs.cloud.google.com](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-clouds)

### 🟢 A CoreWeave CKS (Kubernetes Service)

This card is the cluster API server, not the control plane that creates clusters. Under "unmanaged auth" a cluster trusts whatever OIDC issuer you configure, and every cluster is itself a public OIDC issuer your other clouds can trust. The default "managed auth" mode instead rides on the static control-plane token graded F on the coreweave-api card.

- **Inbound A:** Unmanaged auth lets a cluster's api-server trust a customer-configured OIDC issuer (issuerUrl, clientId, usernameClaim, groupsClaim, requiredClaim, signingAlgorithms) or Kubernetes service-account tokens; managed auth (the default) uses a Cloud Console API Access Token embedded in a kubeconfig.
- **Outbound A:** Every CKS cluster is an OIDC issuer with a public discovery document and JWKS at oidc.cks.coreweave.com/id/[CLUSTER-ID]; workloads present projected service-account tokens to AWS, GCP or any other OIDC-trusting service, so no CoreWeave-held cloud credential exists.
- **Receipts:** [docs.coreweave.com](https://docs.coreweave.com/docs/products/cks/reference/cks-api), [docs.coreweave.com](https://docs.coreweave.com/docs/products/cks/clusters/create), [docs.coreweave.com](https://docs.coreweave.com/docs/changelog/release-notes/unmanaged-auth), [docs.coreweave.com](https://docs.coreweave.com/support/cks/articles/what-is-the-difference-between-managed-auth-and-unmanaged-auth.md), [docs.coreweave.com](https://docs.coreweave.com/products/cks/auth-access/workload-identity/introduction), [docs.coreweave.com](https://docs.coreweave.com/docs/changelog/release-notes/oidc-workload-identity-federation)

### 🟢 A CoreWeave AI Object Storage

This card is object storage only. Any OIDC issuer with a discovery document can be exchanged for 30-minute S3-compatible keys (SAML gets up to 12 hours), and CoreWeave recommends exactly that for production. The permanent access keys that still exist have poor hygiene, and creating them requires the static control-plane token graded F on the coreweave-api card.

- **Inbound A:** Workload Identity Federation: POST a JWT from any OIDC provider that implements OIDC Discovery (issuer URL configured per org) to api.coreweave.com/v1/cwobject/temporary-credentials/oidc/[ORG-ID] and receive a 30-minute AccessKeyId/SecretAccessKey; SAML assertions yield keys up to 12h.
- **Outbound N/A:** Object storage never needs access to customer infrastructure.
- **Receipts:** [docs.coreweave.com](https://docs.coreweave.com/docs/products/storage/object-storage/auth-access/workload-identity-federation/configure-wif-for-object-storage), [docs.coreweave.com](https://docs.coreweave.com/docs/products/storage/object-storage/auth-access/about), [docs.coreweave.com](https://docs.coreweave.com/docs/products/storage/object-storage/auth-access/manage-access-keys/about), [docs.coreweave.com](https://docs.coreweave.com/docs/products/storage/object-storage/auth-access/workload-identity-federation/saml-workload-federation), [docs.coreweave.com](https://docs.coreweave.com/docs/changelog/release-notes/oidc-workload-identity-federation)

### 🟢 A Google Cloud IAM / Workload Identity Federation

Workload identity pools take tokens from any OIDC or SAML issuer and CEL conditions decide who gets in, and every service account can mint a Google-signed ID token from the metadata server. Service account JSON keys never expire by default, but an org policy can force them to, and Google disables the ones it finds on GitHub.

- **Inbound A:** Workload identity pool with an OIDC (or SAML 2.0) provider for any issuer URL; attribute mappings set google.subject from the token and CEL attribute conditions constrain issuer, subject, audience and any other claim before the Security Token Service issues a short-lived federated token.
- **Outbound A:** Any workload with an attached service account requests a Google-signed OIDC ID token for an arbitrary audience from the metadata server identity endpoint, or via the IAM Credentials API generateIdToken; tokens live at most one hour and verify against Google's public JWKS.
- **Receipts:** [docs.cloud.google.com](https://docs.cloud.google.com/iam/docs/workload-identity-federation), [docs.cloud.google.com](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-providers), [docs.cloud.google.com](https://docs.cloud.google.com/docs/authentication/get-id-token), [docs.cloud.google.com](https://docs.cloud.google.com/iam/docs/create-short-lived-credentials-direct), [docs.cloud.google.com](https://docs.cloud.google.com/docs/authentication/token-types), [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-create-trust)

### 🟢 A Microsoft Azure Entra ID workload identities

A federated identity credential lets any OIDC issuer stand in for a client secret, and managed identities hand out Entra-signed JWTs on demand. Client secrets cap at two years and tenant policy can shorten or ban them; you get 20 federated credentials per app, exact-match only.

- **Inbound A:** Federated identity credential on an app registration or user-assigned managed identity that trusts an external OIDC issuer URL with an exact issuer, subject and audience match; the workload presents the external JWT as a client_assertion in the client credentials flow and gets an Entra access token for Azure Resource Manager or any Entra-protected API.
- **Outbound A:** Managed identities obtain Entra-signed JWT access tokens from the Azure Instance Metadata Service for a chosen resource/audience, verifiable at the tenant's OIDC discovery endpoint; a managed identity token can also serve as the federated credential for an app registration, so no client secret is needed anywhere.
- **Receipts:** [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation), [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-create-trust), [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-considerations), [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/identity/managed-identities-azure-resources/how-to-use-vm-token), [learn.microsoft.com](https://learn.microsoft.com/en-us/entra/workload-id/workload-identity-federation-config-app-trust-managed-identity), [docs.cloud.google.com](https://docs.cloud.google.com/iam/docs/workload-identity-federation-with-other-clouds)

### 🟢 A Snowflake Data Cloud

A service user can log in with a token from AWS, Azure, GCP, or any OIDC issuer with a public discovery document; no secret on either side. Storage integrations reach into S3, GCS and Azure with identities, not keys. The static options that remain (key pairs, PATs) are unusually well behaved.

- **Inbound A:** Workload identity federation on a SERVICE user (WORKLOAD_IDENTITY TYPE = AWS | AZURE | GCP | OIDC) with ISSUER, SUBJECT and an optional OIDC_AUDIENCE_LIST; any OIDC provider with a publicly reachable discovery document and JWKS is accepted.
- **Outbound A:** Storage integrations use an IAM role with an external ID (S3), a Snowflake-provisioned service account you grant bucket roles to (GCS), or a Snowflake multi-tenant app you consent to (Azure); no cloud key is handed to Snowflake.
- **Receipts:** [docs.snowflake.com](https://docs.snowflake.com/en/user-guide/workload-identity-federation), [docs.snowflake.com](https://docs.snowflake.com/en/user-guide/data-load-s3-config-storage-integration), [docs.snowflake.com](https://docs.snowflake.com/en/user-guide/data-load-gcs-config), [docs.snowflake.com](https://docs.snowflake.com/en/user-guide/data-load-azure-config)

