/**
 * PHP-compatible functions implemented in TypeScript
 * These replace the heavy locutus dependency (~5MB) with lightweight implementations
 */

// === Array functions ===

/**
 * Merges arrays together, similar to PHP's array_merge
 * Unlike Object.assign, this handles numeric keys properly by re-indexing
 */
export function array_merge<T>(...arrays: T[][]): T[] {
  return arrays.reduce((result, arr) => result.concat(arr), []);
}

// === Filesystem functions ===

/**
 * Reads entire file into a string (Node.js environment only)
 * Note: This is a synchronous operation
 */
export function file_get_contents(filename: string): string {
  const fs = require("fs");
  return fs.readFileSync(filename, "utf8");
}

/**
 * Returns information about a file path
 * When called without options, returns an object with all path components
 */
export function pathinfo(path: string): { dirname: string; basename: string; extension: string; filename: string };
export function pathinfo(path: string, options: number): string;
export function pathinfo(
  path: string,
  options?: number
): { dirname: string; basename: string; extension: string; filename: string } | string {
  const lastSlash = path.lastIndexOf("/");
  const lastBackslash = path.lastIndexOf("\\");
  const lastSep = Math.max(lastSlash, lastBackslash);

  const dirname = lastSep === -1 ? "." : path.substring(0, lastSep);
  const basename = lastSep === -1 ? path : path.substring(lastSep + 1);

  const lastDot = basename.lastIndexOf(".");
  const extension = lastDot === -1 || lastDot === 0 ? "" : basename.substring(lastDot + 1);
  const filename = lastDot === -1 || lastDot === 0 ? basename : basename.substring(0, lastDot);

  // PHP constants for pathinfo options
  const PATHINFO_DIRNAME = 1;
  const PATHINFO_BASENAME = 2;
  const PATHINFO_EXTENSION = 4;
  const PATHINFO_FILENAME = 8;

  if (options !== undefined) {
    if (options === PATHINFO_DIRNAME) return dirname;
    if (options === PATHINFO_BASENAME) return basename;
    if (options === PATHINFO_EXTENSION) return extension;
    if (options === PATHINFO_FILENAME) return filename;
  }

  return { dirname, basename, extension, filename };
}

// === Info functions ===

/**
 * Sets a configuration option (no-op in JS, but maintains API compatibility)
 */
export function ini_set(_varname: string, _newvalue: string): string | false {
  // In PHP this sets an ini directive - in JS we just return false (failure)
  // This is typically used for timezone settings which we handle differently
  return false;
}

// === String functions ===

/**
 * Replace all occurrences of search string with replacement string
 */
export function str_replace(
  search: string | string[],
  replace: string | string[],
  subject: string
): string {
  if (Array.isArray(search)) {
    let result = subject;
    for (let i = 0; i < search.length; i++) {
      const replaceStr = Array.isArray(replace) ? (replace[i] ?? "") : replace;
      result = result.split(search[i]).join(replaceStr);
    }
    return result;
  }
  return subject.split(search).join(replace as string);
}

/**
 * Find the position of the first occurrence of a substring
 * Returns false if not found (PHP-style), otherwise returns the position
 */
export function strpos(haystack: string, needle: string, offset: number = 0): number | false {
  const pos = haystack.indexOf(needle, offset);
  return pos === -1 ? false : pos;
}

/**
 * Join array elements with a string (alias for Array.prototype.join)
 */
export function join(glue: string, pieces: string[]): string {
  return pieces.join(glue);
}

/**
 * Return part of a string
 */
export function substr(str: string, start: number, length?: number): string {
  if (length === undefined) {
    return str.substring(start < 0 ? str.length + start : start);
  }

  const startPos = start < 0 ? str.length + start : start;
  if (length < 0) {
    return str.substring(startPos, str.length + length);
  }
  return str.substring(startPos, startPos + length);
}

/**
 * Strip whitespace (or other characters) from the beginning and end of a string
 * Similar to PHP's trim() function
 */
export function trim(str: string, charlist?: string): string {
  if (!charlist) {
    return str.trim();
  }
  // Escape special regex characters in the charlist
  const escaped = charlist.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  const regex = new RegExp(`^[${escaped}]+|[${escaped}]+$`, "g");
  return str.replace(regex, "");
}

// === Variable functions ===

/**
 * Checks if a variable is null
 */
export function is_null(value: unknown): value is null {
  return value === null;
}
