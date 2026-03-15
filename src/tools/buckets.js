import { z } from "zod";
import { s3Sign } from "../s3/sign.js";
import { REGION } from "../config.js";

export function registerBucketTools(server) {
  // ── list_buckets ─────────────────────────────────────────────────────────────
  server.tool(
    "list_buckets",
    `Lists all buckets in the MinIO server.
Returns each bucket's name and creation date.
Use this first to discover what storage buckets are available before performing operations.`,
    {},
    async () => {
      const { url, headers } = s3Sign("GET", "/");
      const resp = await fetch(url, { method: "GET", headers });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`MinIO ${resp.status}: ${text}`);

      const buckets = [];
      for (const m of text.matchAll(
        /<Bucket>[\s\S]*?<Name>([^<]+)<\/Name>[\s\S]*?<CreationDate>([^<]+)<\/CreationDate>[\s\S]*?<\/Bucket>/g
      )) {
        buckets.push({ name: m[1], createdAt: m[2] });
      }
      return {
        content: [{ type: "text", text: JSON.stringify({ total: buckets.length, buckets }, null, 2) }],
      };
    }
  );

  // ── create_bucket ─────────────────────────────────────────────────────────────
  server.tool(
    "create_bucket",
    `Creates a new bucket in MinIO.
Bucket names must be lowercase, 3–63 characters, start/end with a letter or number, and may contain hyphens.
Returns success or an error if the name is invalid or the bucket already exists.`,
    {
      bucket_name: z.string().min(3).max(63).describe("Name of the bucket to create (lowercase, 3–63 chars)"),
    },
    async ({ bucket_name }) => {
      const body = REGION !== "us-east-1"
        ? `<CreateBucketConfiguration><LocationConstraint>${REGION}</LocationConstraint></CreateBucketConfiguration>`
        : "";
      const extra = body ? { "content-type": "application/xml" } : {};
      const { url, headers } = s3Sign("PUT", `/${bucket_name}`, {}, body, extra);
      const resp = await fetch(url, { method: "PUT", headers, body: body || undefined });
      const text = await resp.text();
      if (resp.status === 200 || resp.status === 204) {
        return { content: [{ type: "text", text: JSON.stringify({ success: true, bucket: bucket_name }) }] };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );

  // ── delete_bucket ─────────────────────────────────────────────────────────────
  server.tool(
    "delete_bucket",
    `Permanently deletes an EMPTY bucket from MinIO.
The bucket must contain zero objects before deletion — remove all objects first.
This action is irreversible.`,
    {
      bucket_name: z.string().describe("Name of the bucket to delete"),
    },
    async ({ bucket_name }) => {
      const { url, headers } = s3Sign("DELETE", `/${bucket_name}`);
      const resp = await fetch(url, { method: "DELETE", headers });
      const text = await resp.text();
      if (resp.status === 204) {
        return { content: [{ type: "text", text: JSON.stringify({ success: true, bucket: bucket_name }) }] };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );

  // ── get_bucket_policy ─────────────────────────────────────────────────────────
  server.tool(
    "get_bucket_policy",
    `Retrieves the IAM-style access policy JSON for a MinIO bucket.
The policy defines who can access the bucket and what operations are permitted (GetObject, PutObject, ListBucket, etc.).
Returns the full policy document, or indicates that no policy is currently set.`,
    {
      bucket_name: z.string().describe("Bucket whose policy to retrieve"),
    },
    async ({ bucket_name }) => {
      const { url, headers } = s3Sign("GET", `/${bucket_name}`, { policy: "" });
      const resp = await fetch(url, { method: "GET", headers });
      const text = await resp.text();
      if (resp.status === 404 || resp.status === 405) {
        return {
          content: [{ type: "text", text: JSON.stringify({ bucket: bucket_name, policy: null, message: "No bucket policy is set." }) }],
        };
      }
      if (!resp.ok) throw new Error(`MinIO ${resp.status}: ${text}`);
      try {
        return { content: [{ type: "text", text: JSON.stringify({ bucket: bucket_name, policy: JSON.parse(text) }, null, 2) }] };
      } catch {
        return { content: [{ type: "text", text: text }] };
      }
    }
  );

  // ── set_bucket_policy ─────────────────────────────────────────────────────────
  server.tool(
    "set_bucket_policy",
    `Sets or updates the IAM-style access policy for a MinIO bucket.
Provide the bucket name and a valid JSON policy string.
Common policy effects:
  • Allow public read: grant s3:GetObject to Principal "*"
  • Restrict to specific IAM users or roles
  • Block all public access
Pass an empty string as policy to delete the existing policy.`,
    {
      bucket_name: z.string().describe("Bucket to apply the policy to"),
      policy: z.string().describe("IAM policy JSON string, or empty string to remove the policy"),
    },
    async ({ bucket_name, policy }) => {
      if (!policy || policy.trim() === "") {
        const { url, headers } = s3Sign("DELETE", `/${bucket_name}`, { policy: "" });
        const resp = await fetch(url, { method: "DELETE", headers });
        if (resp.status === 204 || resp.status === 200) {
          return { content: [{ type: "text", text: JSON.stringify({ success: true, message: "Bucket policy deleted." }) }] };
        }
        throw new Error(`MinIO ${resp.status}: ${await resp.text()}`);
      }

      try { JSON.parse(policy); } catch { throw new Error("Invalid JSON policy string."); }

      const { url, headers } = s3Sign("PUT", `/${bucket_name}`, { policy: "" }, policy, { "content-type": "application/json" });
      const resp = await fetch(url, { method: "PUT", headers, body: policy });
      const text = await resp.text();
      if (resp.status === 204 || resp.status === 200) {
        return { content: [{ type: "text", text: JSON.stringify({ success: true, bucket: bucket_name, message: "Bucket policy updated." }) }] };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );

  // ── get_bucket_versioning ─────────────────────────────────────────────────────
  server.tool(
    "get_bucket_versioning",
    `Retrieves the versioning configuration of a MinIO bucket.
Versioning can be: Enabled, Suspended, or not configured (disabled).
When enabled, MinIO keeps all versions of every object, allowing recovery of deleted or overwritten files.`,
    {
      bucket_name: z.string().describe("Bucket to check versioning status for"),
    },
    async ({ bucket_name }) => {
      const { url, headers } = s3Sign("GET", `/${bucket_name}`, { versioning: "" });
      const resp = await fetch(url, { method: "GET", headers });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`MinIO ${resp.status}: ${text}`);
      const match  = text.match(/<Status>([^<]+)<\/Status>/);
      const status = match ? match[1] : "Disabled";
      return { content: [{ type: "text", text: JSON.stringify({ bucket: bucket_name, versioning: status }) }] };
    }
  );

  // ── set_bucket_versioning ─────────────────────────────────────────────────────
  server.tool(
    "set_bucket_versioning",
    `Enables or suspends versioning on a MinIO bucket.
Once enabled, versioning cannot be fully disabled — only suspended.
  • Enabled   — all object versions are preserved
  • Suspended — new overwrites/deletes are not versioned; existing versions remain
Versioning is required for object lock and lifecycle policies.`,
    {
      bucket_name: z.string().describe("Bucket to configure versioning for"),
      status: z.enum(["Enabled", "Suspended"]).describe("Versioning state: Enabled or Suspended"),
    },
    async ({ bucket_name, status }) => {
      const body = `<VersioningConfiguration><Status>${status}</Status></VersioningConfiguration>`;
      const { url, headers } = s3Sign("PUT", `/${bucket_name}`, { versioning: "" }, body, { "content-type": "application/xml" });
      const resp = await fetch(url, { method: "PUT", headers, body });
      const text = await resp.text();
      if (resp.status === 200 || resp.status === 204) {
        return { content: [{ type: "text", text: JSON.stringify({ success: true, bucket: bucket_name, versioning: status }) }] };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );
}
