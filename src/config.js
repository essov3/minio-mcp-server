/**
 * Configuration — loaded from environment variables once at startup.
 *
 * MINIO_ENDPOINT        — Full URL to MinIO  (default: http://localhost:9445)
 * MINIO_ACCESS_KEY      — Access key (required)
 * MINIO_SECRET_KEY      — Secret key (required)
 * MINIO_REGION          — S3 region          (default: us-east-1)
 * MINIO_WORKSPACE_ROOT  — Key prefix for all object operations (optional)
 *                         e.g. "workspace/project_id"
 */

export const ENDPOINT = (process.env.MINIO_ENDPOINT || "http://localhost:9445").replace(/\/$/, "");
export const ACCESS_KEY = process.env.MINIO_ACCESS_KEY || "";
export const SECRET_KEY = process.env.MINIO_SECRET_KEY || "";
export const REGION = process.env.MINIO_REGION || "us-east-1";
export const WORKSPACE_ROOT = (process.env.MINIO_WORKSPACE_ROOT || "").replace(/^\/+|\/+$/g, "");

if (!ACCESS_KEY || !SECRET_KEY) {
  process.stderr.write("[minio-mcp] WARNING: MINIO_ACCESS_KEY and/or MINIO_SECRET_KEY are not set.\n");
}
