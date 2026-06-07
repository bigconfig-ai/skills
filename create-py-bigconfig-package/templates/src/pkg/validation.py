"""Pre-flight validation for the active profile. Pure report + workflow step."""
from __future__ import annotations

import os
from typing import Any, Callable, Literal, TypedDict

from big_config.core import Opts

from .interop import ok_alias, params_of, profile_of, read_bc_pars, status

CheckKind = Literal["schema"]


class CheckError(TypedDict):
    check: CheckKind
    detail: str


class ValidateResult(TypedDict):
    ok: bool
    errors: list[CheckError]


PLACEHOLDER = "REPLACE_ME"


def blank_or_placeholder(v: Any) -> bool:
    return v is None or (isinstance(v, str) and (v.strip() == "" or PLACEHOLDER in v))


def validate_report(opts: Opts, env: dict[str, str | None] | None = None) -> ValidateResult:
    """Pure: build the validation report for the given opts."""
    env = os.environ if env is None else env
    # interop.read_bc_pars syncs aliases, so params_of below sees BC_PAR_* overrides.
    merged = read_bc_pars(opts, env)
    errors: list[CheckError] = []

    def emit(detail: str) -> None:
        errors.append({"check": "schema", "detail": detail})

    profile = profile_of(merged)
    if not isinstance(profile, str) or profile.strip() == "":
        emit("render/profile: must be a non-empty string")
    params = params_of(merged)
    if blank_or_placeholder(params.get("package")):
        emit("workflow/params → package: must be a real value (not blank or REPLACE_ME)")
    if blank_or_placeholder(params.get("name")):
        emit("workflow/params → name: must be a real value (not blank or REPLACE_ME)")
    return {"ok": len(errors) == 0, "errors": errors}


def print_report(result: ValidateResult) -> None:
    if result["ok"]:
        print("All checks passed.")
        return
    n = len(result["errors"])
    print(f"Validation failed ({n} issue{'' if n == 1 else 's'}):")
    for e in result["errors"]:
        print(f"    - {e['detail']}")


def validate(_step_fns: Any, opts: Opts, report_fn: Callable[[Opts], ValidateResult] = validate_report) -> Opts:
    """Workflow step: run the report, print it, and set exit accordingly."""
    result = report_fn(opts)
    print_report(result)
    base = {**opts, "validation/result": result}
    return ok_alias(base) if result["ok"] else status(base, 1, "validation failed")


