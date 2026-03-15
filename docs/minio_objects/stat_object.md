# Tool: stat_object

**Workflow:** MinIO Objects

Retrieves metadata for an object without downloading its content (HTTP HEAD).

- **Operation:** `get` on `object.metadata`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket containing the object |
| `object_key` | `string` | ✅ | Key/path of the object to inspect |

### Response — object exists

```json
{
  "exists": true,
  "bucket": "my-bucket",
  "key": "report.pdf",
  "size": 204800,
  "contentType": "application/pdf",
  "lastModified": "Sun, 15 Mar 2026 10:00:00 GMT",
  "etag": "abc123def456",
  "versionId": null,
  "userMetadata": {
    "author": "alice",
    "project": "quarterly"
  }
}
```

### Response — object not found

```json
{ "exists": false, "bucket": "my-bucket", "key": "missing.txt" }
```

### Example

```
stat_object(bucket_name="my-bucket", object_key="reports/q1.pdf")
```
