"""Parameter composition: apply BC_PAR_* env overrides to the threaded opts."""
from __future__ import annotations

from big_config.core import Opts

from .interop import read_bc_pars, sync_aliases


def opts_fn(opts: Opts) -> Opts:
    """Per-stage opts function: fold BC_PAR_* overrides into params.

    Grow this to extract params from earlier stages' outputs as you add stages.
    """
    return sync_aliases(read_bc_pars(opts))


