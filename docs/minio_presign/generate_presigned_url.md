# Tool: generate_presigned_url

**Workflow:** MinIO Presigned URLs

Creates a pre-signed URL that grants temporary access to a MinIO object — no credentials required to use the URL.

- **Operation:** `get` on `object.url`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket containing the object |
| `object_key` | `string` | ✅ | Key/path of the object |
| `method` | `"GET" \| "PUT"` | ❌ | HTTP method (default `"GET"`) |
| `expiry_seconds` | `number` | ❌ | Validity duration in seconds (default `3600`, max `604800`) |

### Response

```json
{
  "url": "https://minio.example.com/my-bucket/workspace/report.pdf?X-Amz-Algorithm=...",
  "method": "GET",
  "bucket": "my-bucket",
  "key": "report.pdf",
  "expiresIn": "3600s",
  "expiresAt": "2026-03-15T14:00:00.000Z"
}
```

### Examples

```
// 5-minute download link
generate_presigned_url(
  bucket_name="my-bucket",
  object_key="exports/report-2026-q1.pdf",
  method="GET",
  expiry_seconds=300
)

// 1-hour upload slot for a client
generate_presigned_url(
  bucket_name="uploads",
  object_key="incoming/user-photo.jpg",
  method="PUT",
  expiry_seconds=3600
)
```
