/** Simple package description. Pure report + workflow step. */
import { type Opts } from "big-config";
import { readBcPars } from "big-config/workflow";
import { okAlias, paramsOf, profileOf, toBcOpts } from "./interop.js";

export interface DescribeResult {
  profile: string;
  package: string;
  name: string;
}

function display(value: unknown, fallback = "(unset)"): string {
  return typeof value === "string" && value.trim() !== "" ? value : value == null ? fallback : String(value);
}

/** Pure: build a concise description of the active profile. */
export function describeReport(
  opts: Opts,
  env: Record<string, string | undefined> = process.env,
): DescribeResult {
  const merged = readBcPars(toBcOpts(opts), env);
  const params = paramsOf(merged);
  return {
    profile: display(profileOf(merged), "default"),
    package: display(params["package"]),
    name: display(params["name"]),
  };
}

export function printReport(result: DescribeResult): void {
  console.log(`Package: ${result.package}`);
  console.log(`Profile: ${result.profile}`);
  console.log(`Name: ${result.name}`);
}

/** Workflow step: print the description and succeed. */
export function describe(
  _stepFns: any,
  opts: Opts,
  reportFn: (opts: Opts) => DescribeResult = describeReport,
): Opts {
  const result = reportFn(opts);
  printReport(result);
  return okAlias({ ...opts, "describe/result": result });
}
