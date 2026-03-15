# Tool: create_bucket

**Workflow:** MinIO Buckets

Creates a new bucket in MinIO.

- **Operation:** `create` on `bucket`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket name — lowercase, 3–63 chars, letters/numbers/hyphens only |

### Response

```json
{ "success": true, "bucket": "my-new-bucket" }
```

### Notes

- Names must start and end with a letter or number.
- Returns an error if the bucket already exists or the name is invalid.
- When `MINIO_REGION` is set to something other than `us-east-1`, the bucket is created with a `LocationConstraint`.

### Example

```
create_bucket(bucket_name="reports-2026")
```
