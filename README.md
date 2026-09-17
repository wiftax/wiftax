# wif.tax

**The static key tax.** An open list of products that make machines authenticate with
long-lived secrets instead of workload identity federation (OIDC / WIF). Sibling in
spirit to [sso.tax](https://sso.tax), which covers humans. We cover workloads.

Every product gets a letter on two surfaces (how you reach it, how it reaches you),
five hygiene checks, and a receipt for every claim. Read [RUBRIC.md](RUBRIC.md).
See [SCOREBOARD.md](SCOREBOARD.md) for the current list.

## Add or dispute a product

1. Copy `data/products/_TEMPLATE.yaml` to `data/products/<vendor>-<product>.yaml`.
2. Grade it per the rubric. Every grade and hygiene check needs a URL and a `checked_on` date.
3. `npm install && npm run check`.
4. Open a PR. Disputes are PRs too: change the grade, change the receipts.

Vendors: if you fixed it, open a PR setting `status: graduated`. You get a permanent gold star.

## Layout

```
RUBRIC.md                    the rules
schema/product.schema.json   the shape of a card
data/products/*.yaml         the cards
scripts/validate.mjs         schema + rubric rules + staleness
scripts/render.mjs           SCOREBOARD.md
```

## Open questions

- A single headline number, like sso.tax's percentage. Candidates: "years since a
  direct competitor shipped federation", or estimated rotation hours per year. Both
  feel made up. Suggestions welcome in issues.
- Sisyphus, the crawler that re-reads vendor docs and opens PRs when a grade should
  change. Not built yet. It will never merge its own PRs.

## Domains

wif.tax (the list) · rotate.fail (tooling, eventually Sisyphus) · wiftax.org (redirect)
