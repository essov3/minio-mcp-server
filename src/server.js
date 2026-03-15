import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerBucketTools } from "./tools/buckets.js";
import { registerObjectTools } from "./tools/objects.js";
import { registerPresignTool } from "./tools/presign.js";

export const server = new McpServer({
  name:    "minio-mcp-server",
  version: "1.0.0",
});

registerBucketTools(server);
registerObjectTools(server);
registerPresignTool(server);
