import { ini_set, substr } from "../php-compat";
export * from "./DateTime";
export * from "./DateTimeZone";

// File-I/O functions (glob, is_file, file_put_contents, memory_get_usage)
// are in ./fs.ts to avoid pulling in Node's fs and fast-glob modules.

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
