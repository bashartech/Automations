import asyncio
import logging
import traceback
from functools import wraps
from typing import Any, Callable, Optional, TypeVar

logger = logging.getLogger(__name__)

F = TypeVar("F", bound=Callable[..., Any])


class ServiceUnavailableError(Exception):
    pass


async def fallback_chain(services: list[Callable], name: str = "service") -> Any:
    last_exc = None
    for svc in services:
        try:
            return await svc()
        except Exception as e:
            last_exc = e
            logger.warning("%s failed, trying next fallback: %s", name, e)
    raise ServiceUnavailableError(f"All {name} providers failed") from last_exc


def graceful_degradation(
    fallback_result: Any = None,
    log_message: str = "Service failed, using fallback",
) -> Callable:
    def decorator(func: F) -> F:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            try:
                return await func(*args, **kwargs)
            except Exception as e:
                logger.warning("%s: %s", log_message, e)
                if callable(fallback_result):
                    return fallback_result()
                return fallback_result
        return wrapper  # type: ignore
    return decorator
