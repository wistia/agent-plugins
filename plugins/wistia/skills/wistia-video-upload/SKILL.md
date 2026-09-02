---
name: wistia-video-upload
description: "Upload a video to Wistia or finish setting up a newly uploaded video with the correct folder, metadata, tags, and captions. Use for upload, organize, publish-ready, or new-video setup requests; not for analytics or editing existing video content."
---

# Wistia Video Upload

Turn a source file, URL, or recent upload into an organized Wistia media item.
The Wistia MCP server instructions and current tool schemas are authoritative;
only call tools and pass fields advertised by the connected server.

## 1. Resolve the source and destination

- For a file upload, identify the destination folder before calling
  `upload-media-to-folder`; the tool opens an interactive uploader in hosts
  that support MCP Apps.
- For a URL import, use the connected server's URL-import tool when available.
  If it is not available, explain the supported upload path instead of
  inventing a request.
- For a recent or existing upload, resolve it with `get-medias`. Never guess a
  `hashed_id`; ask when multiple items plausibly match.
- Use `get-folders` to resolve the destination. If the user wants a new folder,
  confirm its name before `create-folder`.

If the host cannot render the interactive uploader, tell the user to upload in
Wistia and provide the resulting media URL or `hashed_id`, then continue with
the setup steps.

## 2. Propose the setup

Inspect the media and account taxonomy before changing anything:

- Draft a clear title and description from the user's context.
- Use `get-tags` and prefer existing tags over near-duplicates.
- Keep account-level player and branding defaults unless the user explicitly
  requests a customization.
- Check caption state with `get-captions` before offering to add captions.

Apply values the user supplied directly. When title, description, tags, folder,
or customization choices are inferred, show the proposed setup and get one
confirmation before applying those inferred changes.

## 3. Apply and verify

Use the connected schemas to select the applicable tools, typically:

- `update-media` for title and description.
- `move-media` when an existing item belongs in another folder.
- `create-tags` only for confirmed new taxonomy entries, followed by
  `bulk-tag-media` or the advertised single-media tagging path.

For captions:

- Upload a supplied caption file with the advertised captions tool.
- For free automated English captions, use `purchase-captions` only with
  `automated: true`, after the user asks for or approves caption generation.
- Never rely on `purchase-captions` defaults: they may order paid human
  captions. State the current price from the tool description and obtain
  explicit approval before any paid order.
- Do not submit a duplicate caption job when a track is already generating.

Poll asynchronous work with `get-background-job-status` when appropriate, then
read the media back to verify the final folder, metadata, tags, and caption
state. Use `fields` only when the selected tool advertises it.

## Completion

Report the media title and `hashed_id`, folder, metadata applied, tags applied,
caption status, and anything still processing. Never imply that an asynchronous
step is complete while it remains queued or running.
