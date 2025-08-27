import time
import uuid
import structlog
from fastapi import Request, Response

# Configure structlog
structlog.configure(
    processors=[
        structlog.processors.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer(),
    ]
)

log = structlog.get_logger()

async def logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())
    start_time = time.time()

    await log.ainfo(
        "request_started",
        method=request.method,
        path=request.url.path,
        request_id=request_id,
    )

    try:
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request_id

        await log.ainfo(
            "request_finished",
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            process_time=round(process_time, 4),
            request_id=request_id,
        )
        return response
    except Exception as e:
        process_time = time.time() - start_time
        await log.aerror(
            "request_failed",
            method=request.method,
            path=request.url.path,
            process_time=round(process_time, 4),
            request_id=request_id,
            exception=str(e),
        )
        raise
