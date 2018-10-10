import { writeFileSync } from "fs";

export * from "./DateTime";
export * from "./DateTimeZone";

export function mb_strlen(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    len += str.charCodeAt(i) < 0 || str.charCodeAt(i) > 255 ? 2 : 1;
  }
  return len;
}

export function cloneVariable(variable) {
  return JSON.parse(JSON.stringify(variable));
}

export function glob(filePath): string[] {
  console.log("TODO glob", filePath);
  return ["foo"];
}

export function file_put_contents(filePath, contents) {
  console.log("TODO file_put_contents", filePath, contents);
  writeFileSync(filePath, contents, "utf-8");
}

export function is_file(filePath): boolean {
  console.log("TODO is_file", filePath);
  return false;
}

export function memory_get_usage(foo): number {
  console.log("TODO memory_get_usage", foo);
  return 0;
}

export function clone(variable) {
  console.log("TODO clone", variable);
}
