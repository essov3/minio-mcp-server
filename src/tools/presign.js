import crypto from "crypto";
import { z } from "zod";
import { ENDPOINT, ACCESS_KEY, SECRET_KEY, REGION } from "../config.js";
import { wsKey } from "../s3/keys.js";

export function registerPresignTool(server) {
  server.tool(
    "generate_presigned_url",
    `Generates a temporary pre-signed URL for a MinIO object.
The URL allows direct access without credentials — safe to share or embed in apps.
  • GET method — creates a download link
  • PUT method — creates an upload link for clients
expiry_seconds controls how long the URL is valid (default 3600 = 1 hour, max 604800 = 7 days).`,
    {
      bucket_name:    z.string().describe("Bucket containing the object"),
      object_key:     z.string().describe("Full key/path of the object"),
      expiry_seconds: z.number().min(1).max(604800).optional().describe("Validity in seconds (default 3600)"),
      method:         z.enum(["GET", "PUT"]).optional().describe("HTTP method: GET for download, PUT for upload (default GET)"),
    },
    async ({ bucket_name, object_key, expiry_seconds, method }) => {
      const expiry   = Math.min(expiry_seconds || 3600, 604800);
      const httpVerb = (method || "GET").toUpperCase();
      const safePath = `/${bucket_name}/${wsKey(object_key)}`;
      const host     = new URL(ENDPOINT).host;

      const now       = new Date();
      const pad       = (n) => String(n).padStart(2, "0");
      const amzDate   = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
                        `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
      const dateStamp = amzDate.slice(0, 8);
      const scope     = `${dateStamp}/${REGION}/s3/aws4_request`;

      const query = {
        "X-Amz-Algorithm":     "AWS4-HMAC-SHA256",
        "X-Amz-Credential":    `${ACCESS_KEY}/${scope}`,
        "X-Amz-Date":          amzDate,
        "X-Amz-Expires":       String(expiry),
        "X-Amz-SignedHeaders": "host",
      };
      const qs = Object.keys(query)
        .sort()
        .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
        .join("&");

      const canReq = [httpVerb, safePath, qs, `host:${host}\n`, "host", "UNSIGNED-PAYLOAD"].join("\n");
      const s2s    = ["AWS4-HMAC-SHA256", amzDate, scope,
        crypto.createHash("sha256").update(canReq).digest("hex")].join("\n");

      const hmac   = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
      const sigKey = hmac(hmac(hmac(hmac(`AWS4${SECRET_KEY}`, dateStamp), REGION), "s3"), "aws4_request");
      const sig    = crypto.createHmac("sha256", sigKey).update(s2s).digest("hex");

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            url:       `${ENDPOINT}${safePath}?${qs}&X-Amz-Signature=${sig}`,
            method:    httpVerb,
            bucket:    bucket_name,
            key:       object_key,
            expiresIn: `${expiry}s`,
            expiresAt: new Date(now.getTime() + expiry * 1000).toISOString(),
          }, null, 2),
        }],
      };
    }
  );
}
