import fg from "fast-glob";
import fs from "fs";

export function glob(patternOrPatterns): string[] {
  return fg.sync(patternOrPatterns).map((_) => _.toString());
}

export function file_put_contents(filePath, contents) {
  // Guard against undefined/null contents to avoid writeFileSync errors
  if (contents === undefined || contents === null) {
    contents = "";
  }
  fs.writeFileSync(filePath, contents, "utf-8");
}

export function is_file(filePath): boolean {
  return fs.existsSync(filePath);
}

export function memory_get_usage(realUsage = false): number {
  return process.memoryUsage()[realUsage ? "heapUsed" : "heapUsed"]; // TODO: Figure out correct equivalent for realUsage = false
}
