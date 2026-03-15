/**
 * AWS Signature V4 signing for S3-compatible requests.
 * Returns { url, headers, bodyBuf } ready to pass to fetch().
 */

import crypto from "crypto";
import { ENDPOINT, ACCESS_KEY, SECRET_KEY, REGION } from "../config.js";

/**
 * @param {string}         method    - HTTP method (GET, PUT, DELETE, HEAD, POST)
 * @param {string}         path      - URL path with leading slash (e.g. "/bucket/key")
 * @param {Object}         query     - Query-string parameters as a plain object
 * @param {string|Buffer}  body      - Request body
 * @param {Object}         extraHdrs - Extra headers to include in the signature
 */
export function s3Sign(method, path, query = {}, body = "", extraHdrs = {}) {
  const now   = new Date();
  const pad   = (n) => String(n).padStart(2, "0");
  const amzDt = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
                `T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;
  const date  = amzDt.slice(0, 8);
  const host  = new URL(ENDPOINT).host;

  const bodyBuf  = Buffer.isBuffer(body) ? body : Buffer.from(body || "", "utf8");
  const bodyHash = crypto.createHash("sha256").update(bodyBuf).digest("hex");

  const qs = Object.keys(query)
    .sort()
    .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join("&");

  const hdrs = {
    host: host,
    "x-amz-content-sha256": bodyHash,
    "x-amz-date": amzDt,
    ...extraHdrs,
  };

  const hkeys    = Object.keys(hdrs).sort();
  const canHdrs  = hkeys.map((k) => `${k}:${hdrs[k]}`).join("\n") + "\n";
  const signHdrs = hkeys.join(";");
  const canReq   = [method, path, qs, canHdrs, signHdrs, bodyHash].join("\n");
  const scope    = `${date}/${REGION}/s3/aws4_request`;
  const s2s      = ["AWS4-HMAC-SHA256", amzDt, scope,
    crypto.createHash("sha256").update(canReq).digest("hex")].join("\n");

  const hmac   = (k, d) => crypto.createHmac("sha256", k).update(d).digest();
  const sigKey = hmac(hmac(hmac(hmac(`AWS4${SECRET_KEY}`, date), REGION), "s3"), "aws4_request");
  const sig    = crypto.createHmac("sha256", sigKey).update(s2s).digest("hex");
  const auth   = `AWS4-HMAC-SHA256 Credential=${ACCESS_KEY}/${scope}, SignedHeaders=${signHdrs}, Signature=${sig}`;

  const reqHdrs = {};
  hkeys.filter((k) => k !== "host").forEach((k) => (reqHdrs[k] = hdrs[k]));
  reqHdrs["Authorization"] = auth;

  return { url: `${ENDPOINT}${path}${qs ? "?" + qs : ""}`, headers: reqHdrs, bodyBuf };
}
