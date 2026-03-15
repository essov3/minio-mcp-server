import crypto from "crypto";
import { z } from "zod";
import { s3Sign } from "../s3/sign.js";
import { wsKey, normKey } from "../s3/keys.js";
import { WORKSPACE_ROOT } from "../config.js";

const TEXT_CONTENT_TYPES = [
  "text/",
  "application/json",
  "application/xml",
  "application/yaml",
  "application/javascript",
  "application/ld+json",
];

const isTextContentType = (contentType) =>
  TEXT_CONTENT_TYPES.some((t) => contentType.startsWith(t));

export function registerObjectTools(server) {
  // ── list_objects ──────────────────────────────────────────────────────────────
  server.tool(
    "list_objects",
    `Lists objects inside a MinIO bucket.
Supports:
  • prefix    — filter by virtual folder path (e.g. "images/")
  • delimiter — group results (e.g. "/" to list only top-level entries)
  • max_keys  — limit results (default 100, max 1000)
Returns object keys, sizes in bytes, last-modified dates, and ETags.
Also returns CommonPrefixes (sub-folders) when a delimiter is used.`,
    {
      bucket_name: z.string().describe("Bucket to list objects from"),
      prefix:      z.string().optional().describe('Filter by prefix/folder path (e.g. "reports/2024/")'),
      delimiter:   z.string().optional().describe('Group by delimiter (e.g. "/" for top-level listing)'),
      max_keys:    z.number().min(1).max(1000).optional().describe("Max objects to return (default 100)"),
    },
    async ({ bucket_name, prefix, delimiter, max_keys }) => {
      const effectivePrefix = WORKSPACE_ROOT
        ? `${WORKSPACE_ROOT}/${normKey(prefix || "")}`
        : (prefix || undefined);

      const query = { "list-type": "2", "max-keys": String(max_keys || 100) };
      if (effectivePrefix) query.prefix    = effectivePrefix;
      if (delimiter)       query.delimiter = delimiter;

      const { url, headers } = s3Sign("GET", `/${bucket_name}`, query);
      const resp = await fetch(url, { method: "GET", headers });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`MinIO ${resp.status}: ${text}`);

      const objects = [];
      for (const m of text.matchAll(
        /<Contents>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<LastModified>([^<]+)<\/LastModified>[\s\S]*?<ETag>([^<]+)<\/ETag>[\s\S]*?<Size>(\d+)<\/Size>[\s\S]*?<\/Contents>/g
      )) {
        objects.push({ key: m[1], lastModified: m[2], etag: m[3].replace(/&quot;/g, '"'), size: parseInt(m[4]) });
      }

      const prefixes = [];
      for (const m of text.matchAll(/<CommonPrefixes>[\s\S]*?<Prefix>([^<]+)<\/Prefix>[\s\S]*?<\/CommonPrefixes>/g)) {
        prefixes.push(m[1]);
      }

      const truncated = text.includes("<IsTruncated>true</IsTruncated>");
      return {
        content: [{ type: "text", text: JSON.stringify({ bucket: bucket_name, total: objects.length, truncated, prefixes, objects }, null, 2) }],
      };
    }
  );

  // ── get_object ────────────────────────────────────────────────────────────────
  server.tool(
    "get_object",
    `Downloads the content of a specific object from a MinIO bucket.
  • Text files (txt, json, csv, xml, html, md, yaml, js…) — returned as plain text.
  • Binary files (images, PDFs, archives…) — returned as a base64-encoded string with content-type noted.
Provide the bucket name and full object key/path.`,
    {
      bucket_name: z.string().describe("Bucket containing the object"),
      object_key:  z.string().describe('Full key/path of the object (e.g. "reports/summary.json")'),
    },
    async ({ bucket_name, object_key }) => {
      const { url, headers } = s3Sign("GET", `/${bucket_name}/${wsKey(object_key)}`);
      const resp = await fetch(url, { method: "GET", headers });
      if (!resp.ok) throw new Error(`MinIO ${resp.status}: ${await resp.text()}`);

      const contentType = resp.headers.get("content-type") || "";
      let result;
      if (isTextContentType(contentType)) {
        result = { bucket: bucket_name, key: object_key, contentType, encoding: "text", content: await resp.text() };
      } else {
        const b64 = Buffer.from(await resp.arrayBuffer()).toString("base64");
        result = { bucket: bucket_name, key: object_key, contentType, encoding: "base64", content: b64 };
      }
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    }
  );

  // ── put_object ────────────────────────────────────────────────────────────────
  server.tool(
    "put_object",
    `Uploads an object to a MinIO bucket.
Creates the object if it doesn't exist, or overwrites it if it does.
For text content, provide the text directly.
For binary content, provide base64-encoded data and set is_base64 to true.
Specify the MIME content_type (e.g. "text/plain", "application/json", "image/png").`,
    {
      bucket_name:  z.string().describe("Target bucket name"),
      object_key:   z.string().describe('Destination key/path (e.g. "folder/report.txt")'),
      content:      z.string().describe("Content to upload (plain text or base64 string)"),
      content_type: z.string().optional().describe('MIME type (default "text/plain")'),
      is_base64:    z.boolean().optional().describe("Set true if content is base64-encoded binary data"),
    },
    async ({ bucket_name, object_key, content, content_type, is_base64 }) => {
      const ct      = content_type || "text/plain";
      const bodyBuf = is_base64 ? Buffer.from(content, "base64") : Buffer.from(content, "utf8");
      const { url, headers } = s3Sign("PUT", `/${bucket_name}/${wsKey(object_key)}`, {}, bodyBuf, { "content-type": ct });

      const resp = await fetch(url, { method: "PUT", headers, body: bodyBuf });
      const text = await resp.text();
      if (resp.status === 200 || resp.status === 204) {
        const etag = (resp.headers.get("etag") || "").replace(/"/g, "");
        return {
          content: [{ type: "text", text: JSON.stringify({ success: true, bucket: bucket_name, key: object_key, size: bodyBuf.length, etag }) }],
        };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );

  // ── delete_object ─────────────────────────────────────────────────────────────
  server.tool(
    "delete_object",
    `Permanently deletes a single object from a MinIO bucket.
This operation is irreversible.
If versioning is enabled, this creates a delete marker rather than removing data permanently.
Use bulk_delete_objects to remove multiple files in one call.`,
    {
      bucket_name: z.string().describe("Bucket containing the object"),
      object_key:  z.string().describe('Full key/path of the object to delete (e.g. "folder/file.txt")'),
    },
    async ({ bucket_name, object_key }) => {
      const { url, headers } = s3Sign("DELETE", `/${bucket_name}/${wsKey(object_key)}`);
      const resp = await fetch(url, { method: "DELETE", headers });
      const text = await resp.text();
      if (resp.status === 204) {
        return { content: [{ type: "text", text: JSON.stringify({ success: true, bucket: bucket_name, key: object_key }) }] };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );

  // ── stat_object ───────────────────────────────────────────────────────────────
  server.tool(
    "stat_object",
    `Retrieves metadata for a MinIO object without downloading its content (HTTP HEAD).
Returns: size in bytes, content-type, last-modified date, ETag checksum, version ID, and custom user metadata.
Use this to check if an object exists or inspect its properties before downloading.`,
    {
      bucket_name: z.string().describe("Bucket containing the object"),
      object_key:  z.string().describe('Full key/path of the object to inspect (e.g. "folder/file.txt")'),
    },
    async ({ bucket_name, object_key }) => {
      const { url, headers } = s3Sign("HEAD", `/${bucket_name}/${wsKey(object_key)}`);
      const resp = await fetch(url, { method: "HEAD", headers });

      if (resp.status === 404) {
        return { content: [{ type: "text", text: JSON.stringify({ exists: false, bucket: bucket_name, key: object_key }) }] };
      }
      if (!resp.ok) throw new Error(`MinIO ${resp.status}`);

      const userMetadata = {};
      for (const [k, v] of resp.headers.entries()) {
        if (k.startsWith("x-amz-meta-")) userMetadata[k.replace("x-amz-meta-", "")] = v;
      }
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            exists:       true,
            bucket:       bucket_name,
            key:          object_key,
            size:         parseInt(resp.headers.get("content-length") || "0"),
            contentType:  resp.headers.get("content-type"),
            lastModified: resp.headers.get("last-modified"),
            etag:         (resp.headers.get("etag") || "").replace(/"/g, ""),
            versionId:    resp.headers.get("x-amz-version-id"),
            userMetadata,
          }, null, 2),
        }],
      };
    }
  );

  // ── copy_object ───────────────────────────────────────────────────────────────
  server.tool(
    "copy_object",
    `Server-side copies an object from one location to another within MinIO.
Source and destination can be in different buckets.
The original object is not modified.
Useful for backups, renaming (copy then delete), or moving files between buckets without re-uploading data.`,
    {
      source_bucket:      z.string().describe("Bucket containing the source object"),
      source_key:         z.string().describe("Key/path of the object to copy"),
      destination_bucket: z.string().describe("Target bucket for the copy"),
      destination_key:    z.string().describe("Desired key/path of the copied object"),
    },
    async ({ source_bucket, source_key, destination_bucket, destination_key }) => {
      const copySource = `/${source_bucket}/${wsKey(source_key)}`;
      const dstPath    = `/${destination_bucket}/${wsKey(destination_key)}`;
      const { url, headers } = s3Sign("PUT", dstPath, {}, "", { "x-amz-copy-source": copySource });

      const resp = await fetch(url, { method: "PUT", headers });
      const text = await resp.text();
      if (resp.ok) {
        return {
          content: [{
            type: "text",
            text: JSON.stringify({
              success: true,
              from: `${source_bucket}/${source_key}`,
              to:   `${destination_bucket}/${destination_key}`,
            }),
          }],
        };
      }
      throw new Error(`MinIO ${resp.status}: ${text}`);
    }
  );

  // ── bulk_delete_objects ───────────────────────────────────────────────────────
  server.tool(
    "bulk_delete_objects",
    `Deletes multiple objects from a MinIO bucket in a single API call.
Far more efficient than deleting objects one-by-one.
Provide an array of object keys to remove. Maximum 1000 keys per call.
Returns a summary of successfully deleted keys and any per-key errors.`,
    {
      bucket_name: z.string().describe("Bucket containing the objects to delete"),
      object_keys: z.array(z.string()).min(1).max(1000).describe('Array of object keys to delete (e.g. ["a.txt", "b/c.jpg"])'),
    },
    async ({ bucket_name, object_keys }) => {
      const xmlObjects = object_keys
        .map((k) => wsKey(k))
        .map((k) => `<Object><Key>${k.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</Key></Object>`)
        .join("");
      const body = `<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>false</Quiet>${xmlObjects}</Delete>`;
      const md5  = crypto.createHash("md5").update(body).digest("base64");

      const { url, headers } = s3Sign("POST", `/${bucket_name}`, { delete: "" }, body, {
        "content-md5":  md5,
        "content-type": "application/xml",
      });

      const resp = await fetch(url, { method: "POST", headers, body });
      const text = await resp.text();
      if (!resp.ok) throw new Error(`MinIO ${resp.status}: ${text}`);

      const deleted = [];
      const errors  = [];
      for (const m of text.matchAll(/<Deleted>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<\/Deleted>/g))
        deleted.push(m[1]);
      for (const m of text.matchAll(/<Error>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<Message>([^<]+)<\/Message>/g))
        errors.push({ key: m[1], message: m[2] });

      return {
        content: [{
          type: "text",
          text: JSON.stringify({ bucket: bucket_name, deleted: deleted.length, failed: errors.length, deletedKeys: deleted, errors }, null, 2),
        }],
      };
    }
  );
}
