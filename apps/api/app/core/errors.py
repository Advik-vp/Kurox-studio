from __future__ import annotations

from typing import Any


class AppError(Exception):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 400,
        details: Any = None,
    ) -> None:
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details
        super().__init__(message)


def ok(data: Any = None, message: str | None = None, meta: dict | None = None) -> dict:
    body: dict[str, Any] = {"success": True, "data": data}
    if message:
        body["message"] = message
    if meta:
        body["meta"] = meta
    return body
