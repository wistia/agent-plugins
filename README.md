# Wistia Agent Plugins

Wistia's plugins for AI coding agents and agentic editors, built to the
[Agent Plugins](https://agent-plugins.org) open standard.

Each plugin connects an agent to [Wistia](https://wistia.com) — video hosting,
analytics, webinars, and AI remix — through Wistia's hosted MCP server, along
with skills that teach agents how to use it well.

## Plugins

| Plugin | Description |
| --- | --- |
| [`wistia`](./plugins/wistia) | Full access to a Wistia account: media, folders, channels, captions, webinars, analytics, and AI remix. |

## Marketplaces

- **Cursor** — `.cursor-plugin/marketplace.json` at the repo root is the
  [Cursor marketplace](https://cursor.com/docs/reference/plugins) manifest.

Plugins themselves are vendor-neutral: each plugin directory follows the Agent
Plugins layout (`plugin.json`, `mcp.json`, `skills/`), so supporting another
marketplace only means adding that marketplace's manifest — the plugin content
is shared.

## Layout

```text
.cursor-plugin/
  marketplace.json          Cursor marketplace manifest
plugins/
  wistia/
    plugin.json             Agent Plugins open-standard manifest
    mcp.json                MCP server declaration (Wistia's hosted server)
    skills/                 Skills, one SKILL.md per directory
    assets/logo.svg
    .cursor-plugin/
      plugin.json           Cursor plugin manifest
scripts/
  validate-plugins.mjs      Schema and structure validator
schemas/                    Pinned official schema snapshots
```

The MCP server code is **not** in this repo — plugins point at Wistia's hosted
server at `https://api.wistia.com/mcp/api`. See each plugin's README for
authentication and configuration details.

## Validation

```bash
npm ci
npm run validate
```

Validates the Cursor and Agent Plugins manifests against pinned snapshots of
their official schemas, then checks referenced paths and skill frontmatter.
Schema provenance is documented in [`schemas/README.md`](./schemas/README.md).
Fix all reported errors before submitting to a marketplace. The same command
runs in GitHub Actions on pull requests and pushes to `main`.

## License

[MIT](./LICENSE)
