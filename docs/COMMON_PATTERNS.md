# Common Patterns & Rules

### Workspace Isolation

When `MINIO_WORKSPACE_ROOT` is set, all tools operate within a virtual root. 

- **Object Keys:** All object keys passed to tools are automatically prefixed with the workspace root.
- **Paths:** Tool parameters always use workspace-relative paths.
- **Example:** If `MINIO_WORKSPACE_ROOT=workspace/123`, a request for `reports/january.pdf` is resolved to `workspace/123/reports/january.pdf` in the bucket.

### Bucket Naming Convention

MinIO (and S3) enforces strict bucket naming rules:
- Length: 3 to 63 characters.
- Characters: Lowercase letters, numbers, and hyphens.
- Start/End: Must start and end with a letter or number.
- No consecutive hyphens or periods.

### Object Key Formatting

- **Recursive Listing:** `list_objects` can be recursive (traverses subfolders) or non-recursive (returns only immediate children).
- **Delimiters:** The forward slash `/` is the standard delimiter for simulating folder structures.

### Environment Variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `MINIO_ENDPOINT` | ✅ | `http://localhost:9000` | Full URL to your MinIO instance |
| `MINIO_ACCESS_KEY` | ✅ | — | MinIO access key |
| `MINIO_SECRET_KEY` | ✅ | — | MinIO secret key |
| `MINIO_REGION` | ❌ | `us-east-1` | S3 region |
| `MINIO_WORKSPACE_ROOT` | ❌ | — | Key prefix prepended to every object path |

### Common Response Shape

All tools return an MCP `content` array with a single `text` item containing JSON:

```json
{ "content": [{ "type": "text", "text": "<JSON string>" }] }
```

Errors are thrown as plain `Error` objects with the message `MinIO <status>: <error XML>`.
