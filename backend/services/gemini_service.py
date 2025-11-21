import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import partial
from typing import Any, Callable, Coroutine

from fastapi import HTTPException, status

logger = logging.getLogger(__name__)

class GeminiService:
    """
    A service to run synchronous Google Gemini API calls in a separate thread pool
    to avoid blocking the main FastAPI event loop.
    """
    def __init__(self, max_workers: int = 8):
        # Using more workers for I/O-bound tasks
        self.executor = ThreadPoolExecutor(max_workers=max_workers)
        logger.info(f"GeminiService initialized with {max_workers} workers.")

    async def initialize(self):
        """Initialize service resources."""
        # Add any async initialization logic here if needed
        logger.info("GeminiService initialized.")

    async def run_in_executor(self, sync_func: Callable[..., Any], *args: Any, **kwargs: Any) -> Any:
        """
        Runs a synchronous function in the thread pool executor with a timeout.
        """
        loop = asyncio.get_event_loop()
        try:
            # Use functools.partial to pass arguments to the function
            func = partial(sync_func, *args, **kwargs)

            # Add a timeout to prevent requests from hanging indefinitely
            result = await asyncio.wait_for(
                loop.run_in_executor(self.executor, func),
                timeout=60.0  # 60-second timeout for AI requests
            )
            return result
        except asyncio.TimeoutError as e:
            logger.error(f"Gemini API request timed out after 60s: {sync_func.__name__}")
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail="AI service request timed out. Please try again."
            )
        except asyncio.CancelledError:
            logger.warning(f"Gemini API request cancelled: {sync_func.__name__}")
            raise HTTPException(
                status_code=status.HTTP_499_CLIENT_CLOSED_REQUEST,
                detail="Request was cancelled."
            )
        except Exception as e:
            logger.error(
                f"Error in {sync_func.__name__}: {type(e).__name__}: {e}",
                exc_info=True,
                extra={'function': sync_func.__name__, 'args_count': len(args)}
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="AI service temporarily unavailable."
            )

    async def shutdown(self):
        """Gracefully shuts down the thread pool executor."""
        logger.info("Shutting down GeminiService thread pool executor.")
        self.executor.shutdown(wait=False)
        logger.info("GeminiService cleanup complete")

# Create a singleton instance to be used across the application
gemini_service = GeminiService()