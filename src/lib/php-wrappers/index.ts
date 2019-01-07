import fg from "fast-glob";
import fs, { writeFileSync } from "fs";
import { ini_set } from "locutus/php/info";
import { substr } from "locutus/php/strings";
export * from "./DateTime";
export * from "./DateTimeZone";

export function mb_strlen(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? 2 : 1;
  }
  return len;
}

export function mb_substr(str, start, len) {
  ini_set("unicode.semantics", "on");
  const result = substr(str, start, len);
  ini_set("unicode.semantics", "off");
  return result;
}

export function cloneVariable(variable) {
  if (variable === undefined) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(variable));
}

export function glob(patternOrPatterns): string[] {
  return fg.sync(patternOrPatterns).map(_ => _.toString());
}

export function file_put_contents(filePath, contents) {
  writeFileSync(filePath, contents, "utf-8");
}

export function is_file(filePath): boolean {
  return fs.existsSync(filePath);
}

export function memory_get_usage(realUsage = false): number {
  return process.memoryUsage()[realUsage ? "heapUsed" : "heapUsed"]; // TODO: Figure out correct equivalent for realUsage = false
}
