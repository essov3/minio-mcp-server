#!/usr/bin/env node
/**
 * MinIO MCP Server — entry point
 * ─────────────────────────────────────────────────────────────────
 * Standalone Model Context Protocol server for self-hosted MinIO.
 * All AWS Signature V4 signing is done inline — no AWS SDK needed.
 *
 * Configuration (environment variables):
 *   MINIO_ENDPOINT        — e.g. http://localhost:9000       (required)
 *   MINIO_ACCESS_KEY      — MinIO access key                 (required)
 *   MINIO_SECRET_KEY      — MinIO secret key                 (required)
 *   MINIO_REGION          — defaults to "us-east-1"
 *   MINIO_WORKSPACE_ROOT  — key prefix for all object ops    (optional)
 *                           e.g. "workspace/project_id"
 *
 * Usage:
 *   node index.js
 *   npx minio-mcp-server
 * ─────────────────────────────────────────────────────────────────
 */

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { server } from "./src/server.js";
import { ENDPOINT, REGION, WORKSPACE_ROOT } from "./src/config.js";

const transport = new StdioServerTransport();
await server.connect(transport);

process.stderr.write(
  `[minio-mcp] Server started — endpoint: ${ENDPOINT} | region: ${REGION}` +
  (WORKSPACE_ROOT ? ` | workspace: ${WORKSPACE_ROOT}` : "") + "\n"
);
