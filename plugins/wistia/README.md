# Wistia plugin

Connects AI agents to a [Wistia](https://wistia.com) account through Wistia's
hosted MCP server: media, folders, channels, captions, webinars, analytics,
and AI remix. Includes general guidance plus focused workflow skills that teach
agents how to use the tools safely and effectively.

## What's inside

| File | Purpose |
| --- | --- |
| `plugin.json` | [Agent Plugins](https://agent-plugins.org) open-standard manifest |
| `mcp.json` | MCP server declaration pointing at Wistia's hosted server |
| `skills/` | Portable Agent Skills for general Wistia use and focused workflows |
| `.cursor-plugin/plugin.json` | Cursor marketplace manifest |

## Included skills

| Skill | Use it for |
| --- | --- |
| `using-wistia` | General Wistia concepts, discovery, pagination, analytics, uploads, and Remix |
| `wistia-video-upload` | Uploading and safely finishing folder, metadata, tag, and caption setup |
| `wistia-language-audit-order` | Auditing localization demand and coverage, then optionally ordering approved work |
| `wistia-registration-updates` | Webinar registration pacing and optional recurring pre-event updates |
| `wistia-webinar-recap` | Post-event scorecards, optional Remix clips, and recap drafts |
| `wistia-video-performance-report` | Read-only media, folder, channel, or account performance scorecards |

Clients that implement Agent Skills discover these directories automatically.
Each workflow defers current tool names, parameters, pricing, and behavior to
the connected MCP server's initialization instructions and schemas.

The MCP server itself is hosted by Wistia at `https://api.wistia.com/mcp/api`
(streamable HTTP) — this plugin contains no server code. Any MCP client can
also connect to that URL directly without the plugin.

## Authentication

Installing this plugin uses OAuth. No token setup is required: the MCP client
starts Wistia's browser authorization flow when it first connects to the
server. If authorization fails, complete the sign-in prompt in the client.

At the time of writing, the hosted MCP integration is available to account
owners only.

### Connecting directly with a Bearer token

When configuring `https://api.wistia.com/mcp/api` directly in an MCP client,
without this plugin, you can instead create an API token at
<https://account.wistia.com/account/api> and configure the client to send it
as an `Authorization: Bearer YOUR_API_TOKEN` header. The plugin intentionally
does not declare a token placeholder: its default connection relies on the
server's OAuth challenge.

## Scoping the tool surface

If a client works better with fewer tools, append a `toolsets` query param to
the server URL to expose only what you need, e.g.
`https://api.wistia.com/mcp/api?toolsets=media,analytics`. Omit it to get every
tool. Available toolsets: `media`, `tags`, `folders`, `channels`, `captions`,
`customizations`, `webinars`, `sharing`, `remix`, `analytics`, `stats`,
`account`. An unrecognized name returns a 422 listing the valid ones.

## Example prompts

- "Show me all the videos in my Wistia account"
- "What are the view stats for my latest video?"
- "Create a new channel called 'Product Demos'"
- "Upload this video and add it to our Product Launches folder"
- "Audit our top videos for missing Spanish captions and dubs"
- "How is next week's webinar pacing toward 500 registrations?"
- "Create a recap of our most recent webinar"
