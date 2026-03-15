# Tool: get_object

**Workflow:** MinIO Objects

Downloads the content of a single object.

- **Operation:** `get` on `object`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket containing the object |
| `object_key` | `string` | ✅ | Object key/path (e.g. `"reports/summary.json"`) |

### Response — text content

```json
{
  "bucket": "my-bucket",
  "key": "hello.txt",
  "contentType": "text/plain",
  "encoding": "text",
  "content": "Hello, world!"
}
```

### Response — binary content

```json
{
  "bucket": "my-bucket",
  "key": "image.png",
  "contentType": "image/png",
  "encoding": "base64",
  "content": "iVBORw0KGgoAAAANSUhEUgAA..."
}
```

### Example

```
get_object(bucket_name="my-bucket", object_key="config/settings.json")
```
