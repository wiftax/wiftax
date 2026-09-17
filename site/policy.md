# Disputes and policy

## What a grade is

A grade is a reading of the vendor's own public documentation against the [rubric](/rubric/). It is not a review of the product, a comment on the people who build it, or legal advice. Every grade carries the URL we read and the date we read it.

## How to dispute a grade

1. **Open a pull request** on [github.com/wiftax/wiftax](https://github.com/wiftax/wiftax) changing the card. Change the receipts, not just the letter. If the docs say something different from what we quoted, link the page that says it.
2. **Or email** disputes@wif.tax with the product, the claim you dispute, and the URL that contradicts it. We will open the PR for you.
3. While a dispute is open the card shows `disputed`, with the vendor's statement verbatim.

We do not require you to prove you work for the vendor. Receipts are receipts.

## Graduation

If your product moves from D or F to A or B, open a PR setting `status: graduated`. The card keeps a permanent gold star and a date. We would rather have an empty list than a long one.

## What we will change

- A factual error with a receipt. Same day, usually.
- A stale card, when the docs have changed. Our crawler tries to catch these first.
- Anything about a person. There should be nothing about a person on this site. If there is, it goes.

## What we will not change

- A grade because the vendor would prefer a different one.
- A grade because the mechanism exists in a private beta, a roadmap, or a sales call. Documented and available is the bar. Tier gates are recorded, not excused.
- The rubric, for one vendor. Rubric changes apply to everyone and go through a PR on `RUBRIC.md`.

## Automated changes

Sisyphus, our crawler, re-reads receipts and opens PRs when they drift. It does not merge. A person reads the receipts first.

## Contact

hello@wif.tax for everything else. security@wif.tax for problems with this site, see `/.well-known/security.txt`.
