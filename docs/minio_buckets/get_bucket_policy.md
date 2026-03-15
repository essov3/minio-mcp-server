# Tool: get_bucket_policy

**Workflow:** MinIO Buckets

Retrieves the IAM-style JSON access policy attached to a bucket.

- **Operation:** `get` on `bucket.policy`

### Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `bucket_name` | `string` | ✅ | Bucket whose policy to retrieve |

### Response — policy set

```json
{
  "bucket": "my-bucket",
  "policy": {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Principal": { "AWS": ["*"] },
        "Action": ["s3:GetObject"],
        "Resource": ["arn:aws:s3:::my-bucket/*"]
      }
    ]
  }
}
```

### Response — no policy

```json
{ "bucket": "my-bucket", "policy": null, "message": "No bucket policy is set." }
```

### Example

```
get_bucket_policy(bucket_name="my-bucket")
```
