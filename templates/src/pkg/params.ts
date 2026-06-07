/** Parameter composition: apply BC_PAR_* env overrides to the threaded opts. */
import type { Opts } from "big-config";
import * as bcWorkflow from "big-config/workflow";
import { syncAliases, toBcOpts } from "./interop.js";

/** Per-stage opts function: fold BC_PAR_* overrides into params.
 *
 * Grow this to extract params from earlier stages' outputs as you add stages. */
export function optsFn(opts: Opts): Opts {
  return syncAliases(bcWorkflow.readBcPars(toBcOpts(opts)));
}
