import path from "path";
import { memory_get_usage } from "../lib/php-wrappers";

export const rootPath = path.join(__dirname, "..", "..", ".."); // relative to build/*/*.*, not src/*.*
export const fixturesPath = path.resolve(rootPath, "fixtures");

export const memoryUsageInMiB = () => {
  return Math.round((memory_get_usage(true) / 1024 / 1024) * 100) / 100;
};
