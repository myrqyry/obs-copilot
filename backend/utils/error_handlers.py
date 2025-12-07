from typing import Optional, Dict, Any
from enum import Enum
from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)

class ErrorCode(str, Enum):
    VALIDATION_ERROR = "VALIDATION_ERROR"
    HTTP_ERROR = "HTTP_ERROR"
    RATE_LIMIT_ERROR = "RATE_LIMIT_ERROR"
    AUTHENTICATION_ERROR = "AUTHENTICATION_ERROR"
    INTERNAL_ERROR = "INTERNAL_SERVER_ERROR"
    TIMEOUT_ERROR = "TIMEOUT_ERROR"

class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str
    type: str

class ErrorResponse(BaseModel):
    detail: str
    code: ErrorCode
    request_id: str
    errors: Optional[list[ErrorDetail]] = None
    timestamp: str

def create_error_response(
    status_code: int,
    detail: str,
    code: ErrorCode,
    request_id: str,
    errors: Optional[list[ErrorDetail]] = None,
    headers: Optional[Dict[str, str]] = None,
) -> JSONResponse:
    from datetime import datetime
    response = ErrorResponse(
        detail=detail,
        code=code,
        request_id=request_id,
        errors=errors,
        timestamp=datetime.utcnow().isoformat(),
    )

    return JSONResponse(
        status_code=status_code,
        content=response.model_dump(exclude_none=True),
        headers=headers or {},
    )

async def log_error(
    request: Request,
    error_type: str,
    message: str,
    status_code: int,
    exc_info: Optional[Exception] = None,
) -> None:
    request_id = getattr(request.state, 'request_id', 'unknown')
    log_data = {
        "request_id": request_id,
        "error_type": error_type,
        "status_code": status_code,
        "method": request.method,
        "path": request.url.path,
        "client": request.client.host if request.client else None,
        "user_agent": request.headers.get("user-agent", ""),
    }
    if status_code >= 500:
        logger.error(message, extra=log_data, exc_info=exc_info)
    else:
        logger.warning(message, extra=log_data)


def get_request_id(request: Request) -> str:
    """Extract request ID from request state, with a safe fallback.

    This central helper ensures a single place to change request_id logic later.
    """
    return getattr(request.state, 'request_id', 'unknown')
