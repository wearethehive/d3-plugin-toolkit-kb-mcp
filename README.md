# d3 KB MCP

Read-only MCP server for the curated d3-plugin-toolkit knowledge base.

This repository is generated from the private d3-plugin-toolkit curation repo.
Make durable KB changes in the private repo, then run the public export flow.

## Install

Run directly with npm:

```bash
npx @hiveschool/d3-kb-mcp
```

Show setup help:

```bash
npx @hiveschool/d3-kb-mcp --help
npx @hiveschool/d3-kb-mcp --version
```

Add it to Codex from any project:

```bash
codex mcp add d3-kb -- npx @hiveschool/d3-kb-mcp
```

Add it to Claude Code from the project where you want the KB available:

```bash
claude mcp add --scope project d3-kb -- npx @hiveschool/d3-kb-mcp
```

Or clone this repository:

```bash
npm install
npm run build
node dist/index.js
```

## MCP Capabilities

Tools:

- `search_kb` - search compact KB metadata and summaries
- `get_kb_entry` - load one full KB entry by ID
- `get_related_entries` - find related curated entries
- `context_pack` - build a bounded retrieval pack for an assistant goal

Resources:

- `d3kb://api/<slug>`
- `d3kb://patterns/<slug>`
- `d3kb://bugs/<slug>`
- `d3kb://docs/reference`

Smoke prompt:

```text
Use the d3-kb MCP server. Search for "bare except" with limit 3, load
patterns/bare-except-required, get related entries for
patterns/active-context-resolution, build a context pack for safely writing
Designer Python, and read d3kb://docs/reference.
```

## Scope

The MCP is read-only. It does not run Designer, execute probes, mutate project
files, or write back to the knowledge base.

The packaged KB includes curated Markdown conclusions from `api/`,
`patterns/`, `bugs/`, and `docs/reference.md`. Raw probe files, logs,
private plugin workspaces, and private helper code are intentionally excluded.

## License

This project is source-available, not open source under an OSI-approved license.
See `LICENSE`.
