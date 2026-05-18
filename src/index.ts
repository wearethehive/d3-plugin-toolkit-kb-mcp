#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod/v4";
import { buildContextPack } from "./context-pack.js";
import { loadKb } from "./kb-loader.js";
import { formatEntry, entryResourceMetadata, listResourceLinks, summarizeResults } from "./resources.js";
import { getRelatedEntries, searchEntries, toSearchResult } from "./search.js";
import type { KbCategory } from "./types.js";

const CATEGORIES = ["api", "patterns", "bugs", "docs"] as const;

async function main() {
  const kb = loadKb();
  const server = new McpServer(
    {
      name: "d3-kb-mcp",
      title: "d3 Plugin Toolkit Knowledge Base",
      version: "0.1.0",
    },
    {
      capabilities: {
        resources: {},
        tools: {},
      },
    }
  );

  for (const entry of kb.entries) {
    server.registerResource(
      entry.id.replace(/[^a-zA-Z0-9_-]/g, "-"),
      entry.resourceUri,
      entryResourceMetadata(entry),
      async () => ({
        contents: [
          {
            uri: entry.resourceUri,
            mimeType: "text/markdown",
            text: formatEntry(entry, kb.readEntry(entry)),
          },
        ],
      })
    );
  }

  server.registerTool(
    "search_kb",
    {
      title: "Search d3 KB",
      description: "Search compact metadata from the curated d3-plugin-toolkit knowledge base.",
      inputSchema: {
        query: z.string().default("").describe("Search query, API name, warning, or implementation goal."),
        category: z.enum(CATEGORIES).optional().describe("Optional KB category filter."),
        status: z.string().optional().describe("Optional exact status filter."),
        limit: z.number().int().min(1).max(25).optional().describe("Maximum number of results."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ query, category, status, limit }) => {
      const results = searchEntries(kb.entries, {
        query,
        category: category as KbCategory | undefined,
        status,
        limit,
      });

      return {
        content: [
          { type: "text", text: summarizeResults(results) },
          ...listResourceLinks(kb, results),
        ],
      };
    }
  );

  server.registerTool(
    "get_kb_entry",
    {
      title: "Get d3 KB Entry",
      description: "Load one full KB entry by ID, such as patterns/bare-except-required.",
      inputSchema: {
        id: z.string().describe("Entry ID returned by search_kb."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ id }) => {
      const entry = kb.byId.get(id);
      if (!entry) {
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown KB entry: ${id}` }],
        };
      }

      return {
        content: [
          {
            type: "text",
            text: formatEntry(entry, kb.readEntry(entry)),
          },
        ],
      };
    }
  );

  server.registerTool(
    "get_related_entries",
    {
      title: "Get Related d3 KB Entries",
      description: "Return compact related KB entries for an existing entry ID.",
      inputSchema: {
        id: z.string().describe("Entry ID returned by search_kb."),
        limit: z.number().int().min(1).max(25).optional().describe("Maximum number of related entries."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ id, limit }) => {
      const entry = kb.byId.get(id);
      if (!entry) {
        return {
          isError: true,
          content: [{ type: "text", text: `Unknown KB entry: ${id}` }],
        };
      }

      const results = getRelatedEntries(kb.byId, entry, limit);
      return {
        content: [
          { type: "text", text: summarizeResults(results) },
          ...listResourceLinks(kb, results),
        ],
      };
    }
  );

  server.registerTool(
    "context_pack",
    {
      title: "Build d3 KB Context Pack",
      description: "Build a bounded set of KB retrieval handles for an implementation or review goal.",
      inputSchema: {
        goal: z.string().describe("Task goal or API behavior to retrieve context for."),
        token_budget: z
          .number()
          .int()
          .min(400)
          .max(4000)
          .optional()
          .describe("Approximate maximum token budget for the compact pack."),
      },
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
      },
    },
    async ({ goal, token_budget }) => {
      const pack = buildContextPack(kb, goal, token_budget);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(pack, null, 2),
          },
          ...listResourceLinks(kb, pack.entries),
        ],
      };
    }
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
