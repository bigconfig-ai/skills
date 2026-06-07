/** Pre-flight validation for the active profile. Pure report + workflow step. */
import { WF_PARAMS, type Opts } from "big-config";
import { readBcPars } from "big-config/workflow";
import { okAlias, profileOf, status, toBcOpts } from "./interop.js";

export interface CheckError {
  check: "schema";
  detail: string;
}

export interface ValidateResult {
  ok: boolean;
  errors: CheckError[];
}

const PLACEHOLDER = "REPLACE_ME";

function blankOrPlaceholder(v: unknown): boolean {
  return v == null || (typeof v === "string" && (v.trim() === "" || v.includes(PLACEHOLDER)));
}

/** Pure: build the validation report for the given opts. */
export function validateReport(
  opts: Opts,
  env: Record<string, string | undefined> = process.env,
): ValidateResult {
  const merged = readBcPars(toBcOpts(opts), env);
  const errors: CheckError[] = [];
  const emit = (detail: string) => errors.push({ check: "schema", detail });

  const profile = profileOf(merged);
  if (typeof profile !== "string" || profile.trim() === "") {
    emit("render/profile: must be a non-empty string");
  }
  // Read the namespaced params key directly: readBcPars updates it in place, while
  // the friendly `params` alias would still hold the pre-override values.
  const params: Record<string, any> = { ...(merged[WF_PARAMS] ?? {}) };
  if (blankOrPlaceholder(params["package"])) {
    emit("workflow/params → package: must be a real value (not blank or REPLACE_ME)");
  }
  if (blankOrPlaceholder(params["name"])) {
    emit("workflow/params → name: must be a real value (not blank or REPLACE_ME)");
  }
  return { ok: errors.length === 0, errors };
}

export function printReport(result: ValidateResult): void {
  if (result.ok) {
    console.log("All checks passed.");
    return;
  }
  console.log(`Validation failed (${result.errors.length} issue${result.errors.length === 1 ? "" : "s"}):`);
  for (const e of result.errors) console.log(`    - ${e.detail}`);
}

/** Workflow step: run the report, print it, and set exit accordingly. */
export function validate(
  _stepFns: any,
  opts: Opts,
  reportFn: (opts: Opts) => ValidateResult = validateReport,
): Opts {
  const result = reportFn(opts);
  printReport(result);
  const base = { ...opts, "validation/result": result };
  return result.ok ? okAlias(base) : status(base, 1, "validation failed");
}
