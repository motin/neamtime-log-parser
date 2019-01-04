import path from "path";

export const rootPath = path.join(__dirname, "..", "..", ".."); // relative to build/*/*.*, not src/*.*
export const fixturesPath = path.resolve(rootPath, "fixtures");
