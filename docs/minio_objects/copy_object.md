# Tool: copy_object

**Workflow:** MinIO Objects

Server-side copies an object from one location to another — no data leaves MinIO.

- **Operation:** `update` on `object`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `source_bucket` | `string` | ✅ | Bucket containing the source object |
| `source_key` | `string` | ✅ | Key/path of the source object |
| `destination_bucket` | `string` | ✅ | Target bucket (can be the same or different) |
| `destination_key` | `string` | ✅ | Key/path for the copied object |

### Response

```json
{
  "success": true,
  "from": "source-bucket/original.txt",
  "to": "dest-bucket/copy.txt"
}
```

### Notes

- The source object is **not modified**.
- Source and destination can be in **different buckets**.
- To **rename** a file: copy it, then `delete_object` the source.

### Example

```
copy_object(
  source_bucket="my-bucket",
  source_key="reports/draft.pdf",
  destination_bucket="archive-bucket",
  destination_key="2026/q1-final.pdf"
)
```
