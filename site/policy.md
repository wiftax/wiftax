# Policy

A grade is a reading of the vendor's own public documentation against the [rubric](/rubric/). It is not a review of the product, a comment on the people who build it, or legal advice.

Every grade cites the page we read, the date we read it, and the exact sentence. A better receipt changes a grade. Nothing else does.

## Disputes

Anyone can dispute a grade. You do not have to work for the vendor, and we will not ask.

1. **Pull request.** Edit the card in `data/products/` on [GitHub](https://github.com/wiftax/wiftax). Change the receipt, not just the letter. Link the page that says something different, and quote it.
2. **Email.** Send [disputes@wif.tax](mailto:disputes@wif.tax) the product, the claim you dispute, and the page that contradicts it. We open the pull request for you.

While a dispute is open, the card is marked `disputed` and shows the vendor's statement word for word, with its link and date. A person reads the new receipt against the rubric, then changes the grade or says why it holds.

## What changes a grade

- A factual error, shown with a receipt.
- Documentation that changed since we read it. Sisyphus usually notices first.
- Anything about a person. Nothing on this site should be about a person. If something is, it comes down.

## What does not

- The vendor preferring a different grade.
- A mechanism in a private beta, on a roadmap, or promised on a sales call. The bar is documented and generally available. Tier gates are recorded, not excused.
- A rubric change for one vendor. The rubric changes for everyone at once, through a pull request on `RUBRIC.md`.

## Graduation

When a product moves from D or F to A or B, its card is marked `graduated` with the date, and it keeps a gold star for good. Open a pull request with the new receipts, or email us. We would rather have a short list than a long one.

## Sisyphus

Sisyphus is our crawler. Every Monday it re-reads every page a card cites. When a cited sentence moves, or a grade should change, it opens a pull request with the old text and the new. It never merges. A person reads the receipts first. Each patrol is published on [rotate.fail](https://rotate.fail).

## Contact

| Address | For |
|---|---|
| [disputes@wif.tax](mailto:disputes@wif.tax) | A grade or a receipt you think is wrong. |
| [security@wif.tax](mailto:security@wif.tax) | A problem with this site or its code. See [security.txt](/.well-known/security.txt). |
| [hello@wif.tax](mailto:hello@wif.tax) | Anything else. |
