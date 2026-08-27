---
name: using-wistia
description: Work with a Wistia account through the Wistia MCP server — find and manage media, folders, channels, captions, and webinars, pull analytics, and create AI remixes. Use when a task involves Wistia videos, media, or account content.
---

# Using Wistia

Wistia is a video hosting and analytics platform. The Wistia MCP server bundled
with this plugin provides full access to a Wistia account.

## Key concepts

- **Media**: any uploaded file (video, audio, PDF, image). Identified by a
  unique `hashed_id`, used in most tool calls.
- **Folder** (aka "Project"): organizes media. Also identified by `hashed_id`.
  Can contain subfolders.
- **Channel**: a curated collection of episodes for public viewing or podcast
  distribution.
- **Webinar**: a live video event with registration, scheduling, and analytics.

## Finding things

- Prefer `search` when given a name or keyword — it also matches transcript
  text. Use `get-medias` to list or filter by folder, tags, type, or
  hashed_ids.
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

## Keeping responses small

- Read tools accept an optional `fields` selector using Google
  partial-response syntax (`hashed_id,name`, `hashed_id,assets(url)`) to
  return only the parts of the response you need. Use it on large listings.

## Authentication

- The server uses OAuth: the first tool call returns unauthorized and the MCP
  client starts the browser sign-in flow automatically. If calls fail with an
  authorization error, ask the user to complete the sign-in prompt in their
  client rather than retrying.
