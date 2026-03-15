# Tool: set_bucket_versioning

**Workflow:** MinIO Buckets

Enables or suspends versioning on a bucket.

- **Operation:** `update` on `bucket.versioning`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Target bucket |
| `status` | `"Enabled" \| "Suspended"` | ✅ | Desired versioning state |

### Response

```json
{ "success": true, "bucket": "my-bucket", "versioning": "Enabled" }
```

### Notes

> ⚠️ Versioning **cannot be fully disabled** once enabled — only suspended (S3 spec).

### Example

```
set_bucket_versioning(bucket_name="my-bucket", status="Enabled")
```
