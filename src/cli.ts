import { ArgumentParser } from "argparse";
import stackman from "stackman";
import { NeamtimeLogParserCli } from "./cli/NeamtimeLogParserCli";

process.once("unhandledRejection", (err, _p) => {
  console.error("Event: Unhandled Rejection");

  stackman().callsites(err, (stackmanErr, callsites) => {
    if (stackmanErr) {
      throw stackmanErr;
    }
    callsites.forEach(callsite => {
      console.log(
        "Error occured in at %s line %d",
        callsite.getFileName(),
        callsite.getLineNumber(),
      );
    });
  });

  console.error(err.stack, err);
  // debugger;
  process.exit(1);
});

process.once("uncaughtException", err => {
  console.error("Event: Uncaught Exception");

  stackman().callsites(err, (stackmanErr, callsites) => {
    if (stackmanErr) {
      throw stackmanErr;
    }
    callsites.forEach(callsite => {
      console.log(
        "Error occured in at %s line %d",
        callsite.getFileName(),
        callsite.getLineNumber(),
      );
    });
  });

  console.error(err.stack, err);
  // debugger;
  process.exit(1);
});

Error.stackTraceLimit = Infinity;

try {
  // const packageInfo = require("./package.json");
  const parser = new ArgumentParser({
    // version: packageInfo.version,
    // description: packageInfo.description,
    addHelp: true,
  });
  parser.addArgument(["--filePath"], {
    help: "filePath",
    required: false,
  });
  const args = parser.parseArgs();
  // console.log("CLI arguments: ", args, "\n");

  const { filePath } = args;

  (async () => {
    if (filePath) {
      const neamtimeLogParserCli = new NeamtimeLogParserCli();
      const parseResult = await neamtimeLogParserCli
        .run(filePath)
        .catch(error => {
          console.error(error.stack, error);
          // throw new Error(error);
        });
      console.log(JSON.stringify(parseResult));
    }
  })();
} catch (e) {
  console.error("CLI: Caught error:");
  console.error(e);
  process.exit(1);
}
