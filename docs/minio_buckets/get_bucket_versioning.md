# Tool: get_bucket_versioning

**Workflow:** MinIO Buckets

Retrieves the versioning status of a bucket.

- **Operation:** `get` on `bucket.versioning`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket to inspect |

### Response

```json
{ "bucket": "my-bucket", "versioning": "Enabled" }
```

| `versioning` value | Meaning |
|---|---|
| `"Disabled"` | Versioning has never been configured |
| `"Enabled"` | All object versions are preserved |
| `"Suspended"` | New writes are not versioned; existing versions remain |

### Example

```
get_bucket_versioning(bucket_name="my-bucket")
```
