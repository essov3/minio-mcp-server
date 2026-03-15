#!/usr/bin/env node
/**
 * Purge all object versions and delete markers from a bucket,
 * then delete the bucket itself.
 * Usage: node scripts/purge-versioned-bucket.js <bucket-name>
 */
import crypto from "crypto";
import { s3Sign } from "../src/s3/sign.js";

const bucket = process.argv[2];
if (!bucket) { console.error("Usage: node scripts/purge-versioned-bucket.js <bucket>"); process.exit(1); }

// 1. List all versions + delete markers
const { url, headers } = s3Sign("GET", `/${bucket}`, { versions: "" });
const resp = await fetch(url, { method: "GET", headers });
const text = await resp.text();
if (!resp.ok) { console.error("List versions failed:", resp.status, text); process.exit(1); }

const entries = [];
for (const m of text.matchAll(/<Version>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<VersionId>([^<]+)<\/VersionId>[\s\S]*?<\/Version>/g))
  entries.push({ Key: m[1], VersionId: m[2] });
for (const m of text.matchAll(/<DeleteMarker>[\s\S]*?<Key>([^<]+)<\/Key>[\s\S]*?<VersionId>([^<]+)<\/VersionId>[\s\S]*?<\/DeleteMarker>/g))
  entries.push({ Key: m[1], VersionId: m[2] });

if (entries.length === 0) {
  console.log("No versions found — bucket is empty.");
} else {
  // 2. Bulk-delete all versions
  const xmlObjs = entries.map(
    (e) => `<Object><Key>${e.Key.replace(/&/g,"&amp;").replace(/</g,"&lt;")}</Key><VersionId>${e.VersionId}</VersionId></Object>`
  ).join("");
  const body = `<?xml version="1.0" encoding="UTF-8"?><Delete><Quiet>false</Quiet>${xmlObjs}</Delete>`;
  const md5  = crypto.createHash("md5").update(body).digest("base64");

  const { url: u2, headers: h2 } = s3Sign("POST", `/${bucket}`, { delete: "" }, body, {
    "content-md5":  md5,
    "content-type": "application/xml",
  });
  const r2 = await fetch(u2, { method: "POST", headers: h2, body });
  const t2 = await r2.text();
  if (!r2.ok) { console.error("Bulk-delete versions failed:", r2.status, t2); process.exit(1); }
  console.log(`Purged ${entries.length} version(s)/marker(s). Status: ${r2.status}`);
}

// 3. Delete the now-empty bucket
const { url: u3, headers: h3 } = s3Sign("DELETE", `/${bucket}`);
const r3 = await fetch(u3, { method: "DELETE", headers: h3 });
if (r3.status === 204) {
  console.log(`Bucket '${bucket}' deleted successfully.`);
} else {
  console.error("Delete bucket failed:", r3.status, await r3.text());
}
