# MinIO MCP Server — Tool Reference

> **Platform:** MinIO / S3  
> **Backend:** MinIO Client (Node.js)

## Tool Groups

| Workflow | Tools |
|---|---:|
| [MinIO Buckets](minio_buckets/INDEX.md) | 7 |
| [MinIO Objects](minio_objects/INDEX.md) | 7 |
| [MinIO Presigned URLs](minio_presign/INDEX.md) | 1 |

## Documentation Resources

- [Common Patterns & Rules](COMMON_PATTERNS.md)
- [Full Tool Index](TOOL_INDEX.md)

## Runtime Isolation

When `MINIO_WORKSPACE_ROOT` is set, the server automatically prepends this prefix to all object operations.

- `list_objects` returns paths relative to the workspace root.
- `put_object`, `get_object`, and `delete_object` expect paths relative to the workspace root.
- `copy_object` and `bulk_delete_objects` also honor the workspace root.

This allows for seamless integration into n8n workflows that are scoped to specific projects or users.
