---
name: wistia-webinar-recap
description: "Turn a completed Wistia webinar into a performance recap, optional Remix-generated social clips, and a ready-to-edit recap article or HTML report. Use for post-event webinar analysis and repurposing; not for registration pacing before the event."
---

# Wistia Webinar Recap

Produce a trustworthy post-event summary first, then offer optional content
repurposing. Reading analytics is the default. Creating Remix clips spends
credits and requires explicit approval.

The connected Wistia MCP server instructions and tool schemas are authoritative.
Use [assets/recap-report-template.html](assets/recap-report-template.html) only
when the user wants a saved HTML deliverable.

## 1. Identify the completed webinar

Resolve the user's title, URL, or `hashed_id` with `get-webinars`. For "my last
webinar," find the most recently ended real event and confirm it. Do not assume
a local state file or another skill ran first.

## 2. Pull only the data needed

Use the current webinar analytics tools, typically:

- `show-webinar-analytics` for registrations, attendance, engagement, watch
  time, chat, Q&A, polls, and event duration when advertised.
- `show-webinar-histograms` for aggregate retention and focus curves.
- `show-webinar-audience` only for questions that require per-registrant data;
  it is large and may contain personal information.

Prefer aggregate data and minimize personal information in outputs. If an
optional endpoint fails, mark that section unavailable and continue with the
remaining recap.

## 3. Compute and label metrics

Calculate only metrics whose inputs are present:

- Show rate = attendance / registrations.
- Percent to goal = registrations / goal, when a goal is known.
- Average watch depth = average watch time / event duration.
- Retention near 75% and at the end from the aggregate attendee histogram.
- Active engagement, chat participation, and poll satisfaction when their
  denominators exist.

Guard zero denominators. Label histogram-derived retention as aggregate
retention, not the exact percentage of individual people who watched past a
point. Never fill missing figures with demo values or remembered benchmarks.

## 4. Deliver the recap

Start with a compact scorecard and a short, evidence-based takeaway: what
worked, the biggest constraint, and one next action. Include a caveat for low
sample sizes or incomplete data.

When the user requests a saved page, copy the bundled template to a new file in
a user-approved or clearly appropriate writable location. Replace every
placeholder, repeat or remove the marked card blocks as needed, HTML-escape
inserted text, and remove sections for unavailable data. Do not overwrite an
existing file without permission.

## 5. Optional Remix clips

Offer clips after the read-only recap unless the user already requested them.
Before creating anything:

1. Propose the number of clips, purpose, orientation, and source moments.
2. Check `get-remix-account-status` for credit availability.
3. Obtain explicit approval for the proposed credit-using work.

Call `create-remix` once per approved variant with the webinar media and a
complete instruction describing the moment, length, orientation, captions,
and copy goal. Multiple independent variants may run in parallel. Remix
auto-exports; poll `get-remix` for status and do not call a separate export
tool unless the current server instructions explicitly require it.

Only embed permanent, ready Wistia media IDs in the saved report. Temporary
preview URLs can expire.

## 6. Recap article

Draft the article from the webinar transcript and retrieved metrics. Keep
claims traceable to the source event, distinguish direct quotes from
paraphrases, and use only approved ready clips. The user must explicitly ask
before the agent publishes or sends the article anywhere; generating a local
draft is not permission to publish.

## Completion

Return the scorecard, takeaway, generated file link when applicable, clip job
states, and anything unavailable or still processing.
