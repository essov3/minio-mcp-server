# Tool: bulk_delete_objects

**Workflow:** MinIO Objects

Deletes multiple objects in a single API call (S3 Multi-Object Delete).

- **Operation:** `delete` on `object.bulk`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket containing the objects |
| `object_keys` | `string[]` | ✅ | Array of keys to delete — minimum 1, maximum **1000** |

### Response

```json
{
  "bucket": "my-bucket",
  "deleted": 3,
  "failed": 0,
  "deletedKeys": [
    "workspace/file-a.txt",
    "workspace/file-b.txt",
    "workspace/file-c.txt"
  ],
  "errors": []
}
```

### Example

```
bulk_delete_objects(
  bucket_name="my-bucket",
  object_keys=["logs/jan.log", "logs/feb.log", "temp/scratch.tmp"]
)
```
