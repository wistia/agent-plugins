---
name: wistia-video-performance-report
description: "Build a read-only Wistia performance scorecard for one video, a folder, a channel, or the whole account, including period-over-period trends and optional current external benchmarks. Use for performance reports, dashboards, comparisons, or underperforming-video questions; not for second-by-second editing advice."
---

# Wistia Video Performance Report

Produce a synthesized scorecard with a plain-language takeaway rather than a
raw stat dump. This workflow is strictly read-only: never create, edit, move,
archive, or delete media, and never run Remix.

The connected Wistia MCP server instructions and current tool schemas are
authoritative. Use
[assets/performance-report-template.html](assets/performance-report-template.html)
only when the user wants a saved HTML report.

## 1. Scope and window

Determine the scope: one media item, folder, channel, or account. Confirm when
ambiguous. Default the reporting window to the last 30 days and compare it with
the immediately preceding equal-length window. Analytics support at most a
two-year range; cap a longer request and say so.

Resolve titles, phrases, or URLs with `search` or `get-medias`, folders with
`get-folders`, and channels with `get-channels` plus
`get-channel-episodes`. Never guess a `hashed_id`. If the resolved scope is
large, report its size and offer a top-N scorecard before issuing one analytics
call per item.

## 2. Core metrics

Use the narrowest aggregate tools that answer the request:

- Single media: `show-media-analytics` for the scorecard and
  `show-media-aggregated-stats` for current/prior trend when required.
- Folder: `show-project-stats` for totals; use list-response play counts for a
  leaderboard and call detailed analytics only for the reported top items.
- Account: `show-current-account-stats` and
  `show-account-stats-by-date` for the two windows.
- Channel: resolve its episode media IDs, then keep per-media fan-out bounded
  to the agreed scope or top N.

Report plays, play rate, hours watched, average engagement, and conversions
when available. Use `fields` to control large responses only when the selected
tool advertises it.

## 3. Trend and distribution

Express each headline metric as direction and percentage versus the prior
window. With little or no prior data, say "no prior-period baseline" instead
of presenting a misleading percentage.

For a single video, add the relevant distribution calls when useful:

- `show-media-traffic-breakdown` for sources.
- `show-media-embed-locations` for pages embedding the video.
- `show-media-form-conversions` for lead capture.
- `show-media-languages` for audience-language reach.

Empty results mean none observed, not a protocol error. For folder, channel,
or account reports, offer distribution detail only for the top media instead
of multiplying calls across the entire library.

## 4. Benchmarks

The account's own equal-window baseline is the primary comparison. When the
user explicitly requests Wistia State of Video or industry benchmarks, use a
current authoritative Wistia source such as
`https://wistia.com/blog/video-marketing-statistics` if the host can access
the web. State the report year and comparison bucket used.

If current benchmark data cannot be retrieved, omit the external comparison
or ask the user to provide the report. Never rely on remembered figures or an
undated value embedded in this skill.

## 5. Synthesize and optionally save

Return a compact scorecard followed by a one-to-three sentence takeaway: what
improved, what declined, and the most plausible explanation grounded in
retrieved numbers. Flag fewer than ten plays as a low sample size.

For a requested downloadable report, copy the bundled template to a new file
in a user-approved or clearly appropriate writable location. Replace every
placeholder, repeat or remove the marked media rows, HTML-escape inserted text,
and remove unavailable sections. Do not overwrite an existing file without
permission.

If one sub-metric fails, mark it unavailable and continue. Do not convert a
partial report into an overall failure or silently claim full coverage.
