import test, { ExecutionContext, Macro } from "ava";
import path from "path";
import { fixturesPath } from "../inc/testUtils";
import { NeamtimeLogParserCli } from "./NeamtimeLogParserCli";

const testNeamtimeLogParserCli: Macro = async (
  t: ExecutionContext,
  filePath: string,
) => {
  // t.log("filePath", filePath);

  const neamtimeLogParserCli = new NeamtimeLogParserCli();
  const parseResult = await neamtimeLogParserCli.run(filePath);

  // t.log("parseResult", parseResult);

  t.not(!!parseResult, false);
};
testNeamtimeLogParserCli.title = (providedTitle: string, filePath: string) =>
  `${providedTitle}: - should be able to parse files using NeamtimeLogParserCli: ${filePath}`;

const expectedRelativeTtbwsdFileFixturePaths = [
  "@/correct/basics/an-hour-of-something.tslog",
  "@/correct/basics/example-1-from-neamtime-reporting-2010-docs.tslog",
  "@/correct/basics/multiple-entries-with-the-same-timestamp.tslog",
  "@/correct/basics/pause-handling.tslog",
  "@/correct/basics/sierra-osx-timestamp-format.tslog",
  "@/correct/basics/newly-cycled.tslog",
  "@/incorrect/basics/empty.tslog",
  "@/incorrect/basics/correctly-reported-processing-error-sourceline-1.tslog",
  "@/incorrect/basics/incorrect-timezone.tslog",
];

expectedRelativeTtbwsdFileFixturePaths
  .map(relativeFilePath => {
    return path.join(fixturesPath, relativeFilePath.replace("@/", ""));
  })
  .forEach(filePath => {
    test("testNeamtimeLogParserCli", testNeamtimeLogParserCli, filePath);
  });
