# Tool: list_objects

**Workflow:** MinIO Objects

Lists objects inside a bucket, with optional prefix filtering and folder-style grouping.

- **Operation:** `list` on `object`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket to list |
| `prefix` | `string` | ❌ | Filter — only return keys starting with this string (e.g. `"reports/2026/"`) |
| `delimiter` | `string` | ❌ | Grouping character (e.g. `"/"` to simulate directory listing) |
| `max_keys` | `number` | ❌ | Max results to return (default `100`, max `1000`) |

> When `MINIO_WORKSPACE_ROOT` is set, the workspace root is automatically prepended to `prefix`.

### Response

```json
{
  "bucket": "my-bucket",
  "total": 2,
  "truncated": false,
  "prefixes": ["reports/2026/"],
  "objects": [
    {
      "key": "reports/2026/jan.csv",
      "lastModified": "2026-01-31T18:00:00.000Z",
      "etag": "abc123",
      "size": 4096
    }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `total` | `number` | Number of objects in this response |
| `truncated` | `boolean` | `true` if more results exist beyond `max_keys` |
| `prefixes` | `string[]` | Common prefixes (virtual sub-folders) when `delimiter` is used |
| `objects[].key` | `string` | Full object key (includes workspace root if set) |
| `objects[].size` | `number` | Size in bytes |
| `objects[].lastModified` | `string` | ISO 8601 last-modified timestamp |
| `objects[].etag` | `string` | MD5 checksum (quoted string stripped) |

### Examples

```
// All objects in bucket
list_objects(bucket_name="my-bucket")

// Top-level "folders" only
list_objects(bucket_name="my-bucket", delimiter="/")
```
