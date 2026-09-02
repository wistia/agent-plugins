# Schema snapshots

Validation uses local snapshots of the official schemas so local and CI runs
are reproducible and do not depend on network availability.

| Files | Upstream version | Source |
| --- | --- | --- |
| `cursor/*.schema.json` | Cursor plugins commit `efa2a531985e0a8084d36ff3cf87233be8a9f34b` | [Cursor plugin schemas](https://github.com/cursor/plugins/tree/efa2a531985e0a8084d36ff3cf87233be8a9f34b/schemas) |
| `agent-plugins/1.0.0/*.schema.json` | Agent Plugins 1.0.0 | [Agent Plugins schemas](https://agent-plugins.org/schemas/1.0.0/) |

Snapshot checksums:

```text
a393b758901803fcf5cfe0d77bda8a83e987d32c3377dfce2d9edf445af884ed  cursor/plugin.schema.json
1aae96a24c2796419933bc8bfe3a1255394e7199c35740b36325e0ce6dbc253d  cursor/marketplace.schema.json
0a4aad95ce337878ad38802ebf0daa3fde76abe3f65400c86bcbb1ec0b3ab883  agent-plugins/1.0.0/plugin.schema.json
6539175bfcdf43085855183e86da40ea94b166547a72b47ae9a0a390516d3acb  agent-plugins/1.0.0/mcp.schema.json
```

To refresh a snapshot, choose an explicit upstream commit or specification
version, replace the relevant files, update the provenance and checksums above,
and run `npm run validate`. Review schema changes before committing them.
