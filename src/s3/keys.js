import { WORKSPACE_ROOT } from "../config.js";

/** Strip leading slashes from an object key. */
export const normKey = (k) => (k || "").replace(/^\/+/, "");

/** Prepend WORKSPACE_ROOT to an object key (no-op when the var is empty). */
export const wsKey = (k) =>
  WORKSPACE_ROOT ? `${WORKSPACE_ROOT}/${normKey(k)}` : normKey(k);
