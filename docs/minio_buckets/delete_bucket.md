# Tool: delete_bucket

**Workflow:** MinIO Buckets

Permanently deletes an empty bucket.

- **Operation:** `delete` on `bucket`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Name of the bucket to delete |

### Response

```json
{ "success": true, "bucket": "my-bucket" }
```

### Notes

> ⚠️ **Irreversible.** The bucket must be completely empty before deletion.  
> If versioning was ever enabled, all object **versions and delete markers** must also be removed — not just the current objects.

### Example

```
delete_bucket(bucket_name="old-reports")
```
