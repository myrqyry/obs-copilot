import time
from starlette.middleware.base import BaseHTTPMiddleware
import logging

logger = logging.getLogger(__name__)

class EnhancedLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        start_time = time.time()

        # Log request
        logger.info(
            f"Request: {request.method} {request.url.path}",
            extra={
                'method': request.method,
                'path': request.url.path,
                'client': request.client.host if request.client else 'unknown',
                'user_agent': request.headers.get('user-agent', '')[:100]
            }
        )

        response = await call_next(request)

        # Log response with timing
        process_time = time.time() - start_time
        logger.info(
            f"Response: {response.status_code} ({process_time:.3f}s)",
            extra={
                'status_code': response.status_code,
                'process_time': process_time,
                'path': request.url.path
            }
        )

        return response
