# Tool: set_bucket_policy

**Workflow:** MinIO Buckets

Sets, updates, or deletes the IAM-style access policy for a bucket.

- **Operation:** `update` on `bucket.policy`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Target bucket |
| `policy` | `string` | ✅ | Valid IAM policy JSON, or **empty string** to delete the policy |

### Response — policy updated

```json
{ "success": true, "bucket": "my-bucket", "message": "Bucket policy updated." }
```

### Response — policy deleted

```json
{ "success": true, "message": "Bucket policy deleted." }
```

### Example

```
set_bucket_policy(bucket_name="my-bucket", policy="")   // delete policy
```
