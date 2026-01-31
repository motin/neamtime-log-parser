import fs from "fs";

/**
 * Reads entire file into a string (Node.js environment only)
 * Note: This is a synchronous operation
 */
export function file_get_contents(filename: string): string {
  return fs.readFileSync(filename, "utf8");
}
