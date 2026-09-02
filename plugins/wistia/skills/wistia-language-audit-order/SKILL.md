---
name: wistia-language-audit-order
description: "Audit whether high-performing Wistia videos have captions and dubs for the languages their audiences use, estimate current costs, and optionally place approved orders. Use for localization coverage, language-demand, missing-translation, or dubbing audit requests; not for a one-off caption edit."
---

# Wistia Language Audit and Order

Compare observed audience-language demand with existing caption and dub
coverage. The audit is read-only by default. Ordering is a separate, explicitly
approved phase that may spend money.

The connected Wistia server instructions and tool schemas are authoritative.
Before comparing language codes, read
[references/language-codes.md](references/language-codes.md).

## 1. Set the audit scope

Establish these inputs, using the user's values when already provided:

- Date range; suggest the last 90 days when the user has no preference.
- Number of top videos to audit.
- Target-language rule: top N languages or a minimum share/play threshold.
- Whether they want only the audit or also a costed order proposal.

Rank top media with the account analytics tool advertised by the server. Keep
the full row for each candidate, including plays, engagement, and duration when
available. If the user wants localization candidates, favor spoken content with
a usable source transcript; check candidates with `get-captions` and do not
silently replace the requested top N with unrelated media.

## 2. Measure language demand

For each qualifying video, use `show-media-languages` over the same date range.
Normalize browser-language codes through the bundled reference before
aggregating them. Default to base languages; preserve regional variants only
when their volume matters and the user wants separate treatment.

Report both aggregate demand and per-video demand. Do not recommend a dub for a
video that has no measured demand in that language merely because the account
uses that language elsewhere.

## 3. Audit coverage

For every selected video and target language:

- Use `get-captions` to determine source and translated caption coverage.
- Use `gets-localizations` to determine dubbed-language coverage.
- Classify each pair as covered, captions only, dub only, or neither.
- Do not order a duplicate when a caption, localization, or background job
  already exists or is processing.

Present a compact table containing video, observed language demand, existing
coverage, and the missing deliverable.

## 4. Price safely

Never use a price remembered from this skill. Read the current connected tool
descriptions and account eligibility immediately before preparing a quote.
Check plan or usage eligibility with `get-account-usage` or the current account
tool when available.

If the server does not provide a reliable current price, label the cost as
unknown and direct the user to the Wistia ordering UI or support; do not invent
an estimate. Distinguish free and paid operations only when the current tool
contract supports that claim.

Lead with a targeted proposal based on each video's own language demand. A
full-coverage alternative may be shown for comparison, but do not recommend
unmeasured work simply to fill every matrix cell.

## 5. Approval and ordering

Before any write, show an itemized proposal with video, language, output type,
and current price or "price unavailable." Ask for explicit approval of the
exact items. Ambiguous approval is not permission to spend.

For approved items, use the schemas advertised by the server:

- `translate-media` for translated caption/subtitle tracks.
- `create-localization` for dubbed video.

Both may be asynchronous. Track returned jobs with
`get-background-job-status`, avoid tight polling loops, and report each item as
finished, processing, failed, or skipped. A partial failure must not be hidden
inside an overall success message.

## Completion

Summarize the scope, target languages, coverage gaps, approved work, reliable
cost information, job states, and any eligibility or pricing uncertainty.
