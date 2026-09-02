---
name: using-wistia
description: Work with a Wistia account through the Wistia MCP server — understand core concepts, find and manage content, paginate results, use analytics, and create AI remixes. Use for general or multi-purpose Wistia tasks that do not fit a more specific bundled workflow skill.
---

# Using Wistia

Wistia is a video hosting and analytics platform. The Wistia MCP server bundled
with this plugin provides full access to a Wistia account.

The server's initialization instructions and each tool's current input and
output schemas are authoritative for tool-level behavior. Follow them when
they differ from this portable workflow guidance.

## Specialized workflows

Use a specialized Wistia skill when the request matches one of these outcomes:

- `wistia-video-upload` for uploading or finishing setup on newly uploaded media.
- `wistia-language-audit-order` for comparing audience languages with caption and dub coverage.
- `wistia-registration-updates` for webinar registration pacing and recurring updates.
- `wistia-webinar-recap` for post-webinar analysis, clips, and recap content.
- `wistia-video-performance-report` for read-only media, folder, channel, or account scorecards.

This skill remains the fallback for general Wistia work and shared operating
habits. Do not combine overlapping workflows unless the user asks for both.

## Key concepts

- **Media**: any uploaded file (video, audio, PDF, image). Identified by a
  unique `hashed_id`, used in most tool calls.
- **Folder** (aka "Project"): organizes media. Also identified by `hashed_id`.
  Can contain subfolders.
- **Channel**: a curated collection of episodes for public viewing or podcast
  distribution.
- **Webinar**: a live video event with registration, scheduling, and analytics.
- **Remix**: an AI-assisted edit generated from source media and instructions,
  with an exported media result when processing completes.

## Finding things

- Prefer `search` when given a name or keyword — it also matches transcript
  text. Use `get-medias` to list or filter by folder, tags, type, or
  hashed_ids.
- Use `search` with a `custom_metadata` object to match metadata fields. For
  example, `{"region":"emea"}` matches a value and
  `{"region":{"exists":false}}` finds media missing that field. An empty
  query can be combined with this filter.
- When the user says "video" they usually mean a media object.
- Most tools require a `hashed_id`. Get one from `get-medias`, `get-folders`,
  `get-channels`, or `search` — or ask the user.

## Pagination and counts

- All list endpoints paginate. Check for `next_cursor`, a per-record `cursor`,
  or a full page of results and follow up to get more pages.
- `per_page` is a request limit, not a returned count. Use `returned_count` or
  `content.length` to count each response; if `returned_count` is less than
  `requested_per_page`, that page is not full.
- For "all X" or "how many X" requests, set the largest safe `per_page` and
  keep paginating until exhausted — never report a single page's size as the
  total.

## Analytics

- `show-media-analytics` for aggregate stats, `show-media-analytics-timeseries`
  for trends, `show-media-engagement` for second-by-second data.
- Date ranges are capped at 2 years.

## Uploads and background jobs

- `upload-media-to-folder` opens an interactive uploader in UI-capable hosts;
  the upload happens from the user's browser.
- Bulk operations run asynchronously. Poll `get-background-job-status` for
  completion.

## AI Remix

- Before starting, use `get-remix-account-status` to check available credits.
- Call `create-remix` with source media and clear editing instructions. Remix
  runs asynchronously and automatically exports the completed result as
  Wistia media.
- Poll `get-remix` for status and results. Use `continue-remix` when the
  user wants to refine an existing remix rather than start over.

## Keeping responses small

- Tools whose input schema advertises `fields` accept a selector using Google
  partial-response syntax (`hashed_id,name`, `hashed_id,assets(url)`). Choose
  field names from that tool's output schema and use the selector for large
  list, search, or response-heavy calls. Never pass `fields` to a tool whose
  input schema does not advertise it.

## Authentication

- The server uses OAuth: the first tool call returns unauthorized and the MCP
  client starts the browser sign-in flow automatically. If calls fail with an
  authorization error, ask the user to complete the sign-in prompt in their
  client rather than retrying.
