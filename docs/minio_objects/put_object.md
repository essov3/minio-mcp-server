# Tool: put_object

**Workflow:** MinIO Objects

Uploads content to a bucket, creating or overwriting the object.

- **Operation:** `create` on `object`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Target bucket |
| `object_key` | `string` | ✅ | Destination key/path (e.g. `"folder/report.txt"`) |
| `content` | `string` | ✅ | Content to upload — plain text or base64 string |
| `content_type` | `string` | ❌ | MIME type (default `"text/plain"`) |
| `is_base64` | `boolean` | ❌ | Set `true` when `content` is base64-encoded binary (default `false`) |

### Response

```json
{
  "success": true,
  "bucket": "my-bucket",
  "key": "report.txt",
  "size": 1024,
  "etag": "d41d8cd98f00b204e9800998ecf8427e"
}
```

### Examples

```
// Upload text
put_object(
  bucket_name="my-bucket",
  object_key="notes.txt",
  content="Hello world",
  content_type="text/plain"
)

// Upload binary (base64)
put_object(
  bucket_name="my-bucket",
  object_key="images/logo.png",
  content="iVBORw0KGgoAAAANS...",
  content_type="image/png",
  is_base64=true
)
```
