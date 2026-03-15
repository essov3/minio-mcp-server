# Tool: list_buckets

**Workflow:** MinIO Buckets

Lists all buckets on the MinIO server.

- **Operation:** `list` on `bucket`

### Parameters

_None_

### Response

```json
{
  "total": 2,
  "buckets": [
    { "name": "my-bucket",    "createdAt": "2026-01-10T08:00:00.000Z" },
    { "name": "other-bucket", "createdAt": "2026-02-15T12:30:00.000Z" }
  ]
}
```

| Field | Type | Description |
|---|---|---|
| `total` | `number` | Number of buckets returned |
| `buckets` | `array` | List of bucket objects |
| `buckets[].name` | `string` | Bucket name |
| `buckets[].createdAt` | `string` | ISO 8601 creation timestamp |

### Example

```
list_buckets()
```
