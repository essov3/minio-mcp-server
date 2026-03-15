# MinIO MCP Server

A standalone **Model Context Protocol (MCP)** server for self-hosted [MinIO](https://min.io/) — giving any MCP-compatible AI client (Claude Desktop, Cursor, Zed, etc.) full control over your object storage.

All AWS Signature V4 signing is implemented inline. **No AWS SDK or additional dependencies required beyond the MCP SDK.**

---

## Tools Available

| Tool | Description |
|---|---|
| `list_buckets` | List all buckets with creation dates |
| `create_bucket` | Create a new bucket |
| `delete_bucket` | Delete an empty bucket |
| `list_objects` | List objects with prefix / delimiter / limit support |
| `get_object` | Download object content (text or base64 for binary) |
| `put_object` | Upload text or binary (base64) content |
| `delete_object` | Delete a single object |
| `stat_object` | Get object metadata without downloading (HEAD) |
| `copy_object` | Server-side copy between buckets |
| `generate_presigned_url` | Create time-limited GET or PUT URLs |
| `bulk_delete_objects` | Delete up to 1000 objects in one call |
| `get_bucket_policy` | Retrieve IAM bucket policy JSON |
| `set_bucket_policy` | Set or delete IAM bucket policy |
| `get_bucket_versioning` | Check versioning status |
| `set_bucket_versioning` | Enable or suspend versioning |

---

## Requirements

- **Node.js 18+** (uses native `fetch`)
- A running **MinIO** instance

---

## Installation

```bash
# Clone or copy the project
cd minio-mcp-server

# Install dependencies
npm install
```

---

## Configuration

The server is configured entirely via environment variables:

| Variable | Required | Default | Description |
|---|---|---|---|
| `MINIO_ENDPOINT` | ✅ | `http://localhost:9000` | Full URL to your MinIO server |
| `MINIO_ACCESS_KEY` | ✅ | — | MinIO access key (username) |
| `MINIO_SECRET_KEY` | ✅ | — | MinIO secret key (password) |
| `MINIO_REGION` | ❌ | `us-east-1` | Bucket region (most MinIO installs use default) |
| `MINIO_WORKSPACE_ROOT` | ❌ | — | Key prefix prepended to every object path (e.g. `workspace/project_id`) |

---

## Claude Desktop Setup

Add this to your `claude_desktop_config.json`:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`  
**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "minio": {
      "command": "node",
      "args": ["/absolute/path/to/minio-mcp-server/index.js"],
      "env": {
        "MINIO_ENDPOINT":        "http://localhost:9000",
        "MINIO_ACCESS_KEY":      "your-access-key",
        "MINIO_SECRET_KEY":      "your-secret-key",
        "MINIO_REGION":          "us-east-1",
        "MINIO_WORKSPACE_ROOT":  "workspace/project_id"
      }
    }
  }
}
```

Restart Claude Desktop after saving.

---

## Other MCP Clients (Cursor, Zed, etc.)

Most clients follow the same pattern — a `command` + `args` + `env` config block. Use the same values as above.

---

## Running Manually (for testing)

```bash
MINIO_ENDPOINT=http://localhost:9000 \
MINIO_ACCESS_KEY=minioadmin \
MINIO_SECRET_KEY=minioadmin \
MINIO_WORKSPACE_ROOT=workspace/project_id \
node index.js
```

The server communicates over **stdio** (standard in/out), which is the MCP standard for local servers.

---

## MinIO with Docker (quick start)

If you don't have MinIO running yet:

```bash
docker run -p 9000:9000 -p 9001:9001 \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin \
  quay.io/minio/minio server /data --console-address ":9001"
```

Then access the console at http://localhost:9001

---

## Notes

- **Binary uploads**: Pass base64-encoded content with `is_base64: true` in `put_object`
- **Presigned URLs**: Valid up to 7 days (604800 seconds)
- **Versioning**: Once enabled, can only be suspended — not fully disabled (S3 spec)
- **Bulk delete**: Limited to 1000 keys per call per the S3 spec
