---
name: wistia-registration-updates
description: "Measure a Wistia webinar's registration pacing against its goal and optionally configure recurring pre-event updates. Use for signup pacing, registration goals, promotion timing, or scheduled webinar-status requests; not for post-event performance recaps."
---

# Wistia Registration Updates

Answer whether an upcoming webinar is likely to reach its registration goal and
what changed since the previous reporting period. Run the reporting workflow
successfully once before offering automation.

The connected Wistia MCP server instructions and current tool schemas are
authoritative. This skill is host-neutral: use scheduling or automation
features only when the current client supports them.

## 1. Identify the webinar

Resolve a title, URL, or `hashed_id` with `get-webinars`. If the user is vague,
find the soonest upcoming published webinar and confirm it. Exclude ended,
unpublished, and obvious test events unless the user explicitly selects one.

Confirm or collect:

- Registration goal.
- Event date and the event's time zone.
- Desired delivery destination when recurring updates are requested.

Treat the event's advertised local date and time carefully; do not relabel a
local clock time as UTC without an explicit offset from the tool response.

## 2. Pull the reporting data

Use the webinar analytics tools advertised by the server, typically:

- `show-webinar-analytics` for total registrations and impressions.
- `show-webinar-registration-timeseries` with daily granularity for pacing,
  trend, and campaign spikes.
- `show-webinar-audience` only when the user requests source or registrant
  detail that aggregate tools cannot provide.

Minimize personal data. Prefer aggregate sources and company/domain patterns;
do not expose registrant email addresses or unrelated profile fields in a
routine update.

## 3. Calculate pacing

Calculate defensively:

- Percent to goal = registrations / goal.
- Days left = event date minus the report date in the event time zone.
- Required daily rate = remaining registrations / days left.
- Recent daily rate = an average across approximately seven non-empty recent
  days, while calling out large campaign-driven spikes.
- Projected range = a conservative baseline and a recent-rate scenario.

Avoid a single precise projection immediately after a campaign spike. When the
goal is missing, days left is zero, or there is too little history, omit the
affected calculation and explain why instead of dividing by zero or inventing
a baseline.

## 4. Report

Use this compact structure:

```text
<Webinar title>
Date: <local event date> | <days left> days to go
Goal: <goal> registrations
Current: <current> registrations | <percent> of goal
Required pace: <required/day> | Recent pace: <actual/day>

Notes:
- <meaningful spike or slowdown>
- <new aggregate source or campaign signal>
- <one concrete promotion lever when behind>
```

Only include notes grounded in retrieved data. If nothing meaningful changed,
say so directly.

## 5. Optional recurring delivery

After a successful one-time report, offer a recurring update. Creating an
automation changes external state, so confirm the cadence, time zone,
destination, and stop condition before creating it.

When the host supports scheduled agents or automations, create one self-contained
instruction containing the webinar ID, goal, local event date/time zone, tools
to call, output format, and these gates:

- More than seven days out: run weekly on the agreed weekday.
- Seven days or fewer: run each agreed weekday.
- Skip weekends unless the user requests them.
- At or after the event: send one final registration summary, then stop or ask
  the user to disable the recurrence and offer `wistia-webinar-recap`.

Ensure the automation has access to the Wistia MCP connection before enabling
unattended runs. If the host cannot schedule work, provide the self-contained
prompt and cadence so the user can configure it elsewhere.
