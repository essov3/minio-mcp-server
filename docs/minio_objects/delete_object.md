# Tool: delete_object

**Workflow:** MinIO Objects

Permanently deletes a single object from a bucket.

- **Operation:** `delete` on `object`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket containing the object |
| `object_key` | `string` | ✅ | Key/path of the object to delete |

### Response

```json
{ "success": true, "bucket": "my-bucket", "key": "old-file.txt" }
```

### Notes

> ⚠️ **Irreversible** when versioning is disabled.

### Example

```
delete_object(bucket_name="my-bucket", object_key="temp/scratch.log")
```
