import { ArgumentParser } from "argparse";
import { NeamtimeLogParserCli } from "./cli/NeamtimeLogParserCli";
// import stackman from "stackman";

process.once("unhandledRejection", (err, _p) => {
  console.log("Event: Unhandled Rejection");

  /*
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
   */

  console.error(err.stack, err);
  // debugger;
  process.exit(1);
});

process.once("uncaughtException", err => {
  console.log("Event: Uncaught Exception");

  /*
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
   */

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
          throw new Error(error);
        });
      console.log(JSON.stringify(parseResult));
    }
  })();
} catch (e) {
  console.log("CLI: Caught error:");
  console.error(e);
}
