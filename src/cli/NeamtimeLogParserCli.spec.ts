import test, { ExecutionContext, Macro } from "ava";
import path from "path";
import { fixturesPath } from "../inc/testUtils";
import { NeamtimeLogParserCli } from "./NeamtimeLogParserCli";

const testNeamtimeLogParserCli: Macro = async (
  t: ExecutionContext,
  filePath: string,
) => {
  t.log("filePath", filePath);

  const neamtimeLogParserCli = new NeamtimeLogParserCli();
  const parseResult = await neamtimeLogParserCli.run(filePath);

  t.log("parseResult", parseResult);

  t.is(undefined, undefined);
};
testNeamtimeLogParserCli.title = (
  providedTitle: string,
  filePath: string,
  fileSha1: number,
) =>
  `${providedTitle}: - should be able to parse files using NeamtimeLogParserCli: ${filePath}, ${fileSha1}`;

const expectedRelativeTtbwsdFileFixturePaths = [
  "@/correct/basics/an-hour-of-something.tslog",
  "@/correct/basics/an-hour-of-something.identical-copy.tslog",
  "@/correct/basics/example-1-from-neamtime-reporting-2010-docs.tslog",
  "@/correct/basics/multiple-entries-with-the-same-timestamp.tslog",
  "@/correct/basics/pause-handling.tslog",
  "@/correct/basics/sierra-osx-timestamp-format.tslog",
  "@/correct/basics/empty.tslog",
  "@/incorrect/basics/correctly-reported-processing-error-sourceline-1.tslog",
  "@/incorrect/basics/incorrect-timezone.tslog",
];

expectedRelativeTtbwsdFileFixturePaths
  .slice(0, 1)
  .map(relativeFilePath => {
    return path.join(fixturesPath, relativeFilePath.replace("@/", ""));
  })
  .forEach(filePath => {
    test("testNeamtimeLogParserCli", testNeamtimeLogParserCli, filePath);
  });
