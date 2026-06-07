"""Simple package description. Pure report + workflow step."""
from __future__ import annotations

from typing import Any, Callable, TypedDict

from big_config.core import Opts

from .interop import ok_alias, params_of, profile_of, read_bc_pars


class DescribeResult(TypedDict):
    profile: str
    package: str
    name: str


def _display(value: Any, fallback: str = "(unset)") -> str:
    if isinstance(value, str) and value.strip() != "":
        return value
    if value is None:
        return fallback
    return str(value)


def describe_report(opts: Opts, env: dict[str, str | None] | None = None) -> DescribeResult:
    """Pure: build a concise description of the active profile."""
    merged = read_bc_pars(opts, env)
    params = params_of(merged)
    return {
        "profile": _display(profile_of(merged), "default"),
        "package": _display(params.get("package")),
        "name": _display(params.get("name")),
    }


def print_report(result: DescribeResult) -> None:
    print(f"Package: {result['package']}")
    print(f"Profile: {result['profile']}")
    print(f"Name: {result['name']}")


def describe(_step_fns: Any, opts: Opts, report_fn: Callable[[Opts], DescribeResult] = describe_report) -> Opts:
    """Workflow step: print the description and succeed."""
    result = report_fn(opts)
    print_report(result)
    return ok_alias({**opts, "describe/result": result})
